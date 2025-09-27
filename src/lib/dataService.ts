import axios from 'axios';
import * as turf from '@turf/turf';
import { 
  SubwayEntrance, 
  FloodRiskAssessment, 
  WeatherForecast, 
  FloodZone, 
  CrowdsourcedReport,
  DashboardStats,
  HistoricalFlood,
  MitigationOption
} from '../types';
import { API_ENDPOINTS, RISK_THRESHOLDS, FLOOD_ZONE_RISK_WEIGHTS, MITIGATION_OPTIONS } from './constants';

export class DataService {
  private static instance: DataService;
  private subwayEntrances: SubwayEntrance[] = [];
  private floodZones: FloodZone[] = [];
  private weatherForecast: WeatherForecast[] = [];
  private crowdsourcedReports: CrowdsourcedReport[] = [];

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Fetch subway entrances from NYC Open Data
  async fetchSubwayEntrances(): Promise<SubwayEntrance[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.SUBWAY_ENTRANCES);
      const csvText = response.data;
      
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map((h: string) => h.replace(/"/g, '').trim());
      
      const entrances: SubwayEntrance[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((v: string) => v.replace(/"/g, '').trim());
          if (values.length >= headers.length) {
            const entrance: Record<string, string> = {};
            headers.forEach((header: string, index: number) => {
              entrance[header] = values[index];
            });
            
            const lat = parseFloat(entrance.Entrance_Latitude);
            const lng = parseFloat(entrance.Entrance_Longitude);
            
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              const typedEntrance = entrance as unknown as SubwayEntrance;
              typedEntrance.Entrance_Latitude = lat;
              typedEntrance.Entrance_Longitude = lng;
              typedEntrance.Station_Latitude = parseFloat(entrance.Station_Latitude);
              typedEntrance.Station_Longitude = parseFloat(entrance.Station_Longitude);
              entrances.push(typedEntrance);
            }
          }
        }
      }
      
      this.subwayEntrances = entrances;
      return entrances;
    } catch (error) {
      console.error('Error fetching subway entrances:', error);
      return [];
    }
  }

  // Fetch FEMA flood zones
  async fetchFEMAFloodZones(): Promise<FloodZone[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.FEMA_FLOOD_ZONES);

      const data = response.data;
      if (data.features && data.features.length > 0) {
        const floodZones: FloodZone[] = data.features.map((feature: { properties: { FLD_ZONE?: string; STATIC_BFE?: string }; geometry: GeoJSON.Geometry }) => ({
          type: 'FEMA',
          zone: feature.properties.FLD_ZONE || 'Unknown',
          riskLevel: this.getRiskLevelFromFEMAZone(feature.properties.FLD_ZONE || 'Unknown'),
          baseFloodElevation: feature.properties.STATIC_BFE ? parseFloat(feature.properties.STATIC_BFE) : undefined,
          geometry: feature.geometry
        }));
        
        this.floodZones = [...this.floodZones, ...floodZones];
        return floodZones;
      }
      return [];
    } catch (error) {
      console.error('Error fetching FEMA flood zones:', error);
      // Return mock FEMA data for demo purposes
      return this.getMockFEMAData();
    }
  }

  // Fetch stormwater flood data
  async fetchStormwaterFlood(): Promise<FloodZone[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.STORMWATER_FLOOD);
      const data = response.data;
      
      if (data.features && data.features.length > 0) {
        const stormwaterZones: FloodZone[] = data.features.map((feature: { properties: { scenario?: string; depth_ft?: number }; geometry: GeoJSON.Geometry }) => ({
          type: 'Stormwater',
          zone: feature.properties.scenario || 'Stormwater',
          riskLevel: this.getRiskLevelFromDepth(feature.properties.depth_ft || 0),
          depth: feature.properties.depth_ft,
          geometry: feature.geometry
        }));
        
        this.floodZones = [...this.floodZones, ...stormwaterZones];
        return stormwaterZones;
      }
      return [];
    } catch (error) {
      console.error('Error fetching stormwater flood data:', error);
      // Return mock stormwater data for demo purposes
      return this.getMockStormwaterData();
    }
  }

  // Fetch weather forecast
  async fetchWeatherForecast(): Promise<WeatherForecast[]> {
    try {
      // Using WeatherAPI (free tier available)
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
      if (!apiKey) {
        console.warn('Weather API key not found, using mock data');
        return this.getMockWeatherForecast();
      }

      const response = await axios.get(API_ENDPOINTS.WEATHER_API, {
        params: {
          key: apiKey,
          q: 'New York',
          days: 3,
          aqi: 'no',
          alerts: 'no'
        }
      });

      const forecasts: WeatherForecast[] = response.data.forecast.forecastday.map((day: { hour: Array<{ time: string; precip_in?: number; temp_f: number; humidity: number; wind_mph: number; condition: { text: string } }> }) => 
        day.hour.map((hour: { time: string; precip_in?: number; temp_f: number; humidity: number; wind_mph: number; condition: { text: string } }) => ({
          timestamp: hour.time,
          rainfallIntensity: hour.precip_in || 0,
          temperature: hour.temp_f,
          humidity: hour.humidity,
          windSpeed: hour.wind_mph,
          conditions: hour.condition.text
        }))
      ).flat();

      this.weatherForecast = forecasts;
      return forecasts;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return this.getMockWeatherForecast();
    }
  }

  // Calculate flood risk for a station
  calculateFloodRisk(
    station: SubwayEntrance, 
    weatherForecast: WeatherForecast[], 
    floodZones: FloodZone[]
  ): FloodRiskAssessment {
    
    // Calculate contributing factors
    const elevation = this.getStationElevation(station);
    const distanceToWater = this.getDistanceToNearestWater(station, floodZones);
    const imperviousSurface = this.getImperviousSurfaceRatio(station);
    const femaZone = this.getFEMAZoneForStation(station, floodZones);
    const drainageCapacity = this.getDrainageCapacity(station);
    const historicalFloods = this.getHistoricalFloods(station);

    // Calculate flood probability using weighted factors
    const rainfallIntensity = weatherForecast[0]?.rainfallIntensity || 0;
    const femaWeight = FLOOD_ZONE_RISK_WEIGHTS[femaZone as keyof typeof FLOOD_ZONE_RISK_WEIGHTS] || 0.5;
    
    const floodProbability = Math.min(100, Math.max(0, 
      (rainfallIntensity * 20) + // Rainfall intensity factor
      (femaWeight * 30) + // FEMA zone factor
      ((1 - distanceToWater / 1000) * 20) + // Distance to water factor
      (imperviousSurface * 15) + // Impervious surface factor
      ((1 - drainageCapacity) * 15) // Drainage capacity factor
    ));

    const riskLevel = this.getRiskLevel(floodProbability);
    const severityScore = this.calculateSeverityScore(floodProbability, rainfallIntensity, femaWeight);

    return {
      stationId: `${station.Station_Name}-${station.Line}`,
      stationName: station.Station_Name,
      floodProbability,
      riskLevel,
      severityScore,
      timeToFlood: this.calculateTimeToFlood(rainfallIntensity, elevation),
      contributingFactors: {
        elevation,
        distanceToWater,
        imperviousSurface,
        femaZone,
        drainageCapacity,
        rainfallIntensity
      },
      historicalFloods,
      mitigationSuggestions: this.getMitigationSuggestions(riskLevel, femaZone, imperviousSurface)
    };
  }

  // Get dashboard statistics
  getDashboardStats(assessments: FloodRiskAssessment[]): DashboardStats {
    const totalStations = assessments.length;
    const highRiskStations = assessments.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length;
    const activeAlerts = assessments.filter(a => a.floodProbability > 70).length;
    const averageRiskScore = assessments.reduce((sum, a) => sum + a.floodProbability, 0) / totalStations;

    return {
      totalStations,
      highRiskStations,
      activeAlerts,
      lastUpdated: new Date().toISOString(),
      weatherConditions: this.weatherForecast[0]?.conditions || 'Unknown',
      averageRiskScore: Math.round(averageRiskScore)
    };
  }

  // Private helper methods
  private getRiskLevelFromFEMAZone(zone: string): 'low' | 'medium' | 'high' {
    if (['AE', 'VE'].includes(zone)) return 'high';
    if (['A', 'AO'].includes(zone)) return 'medium';
    return 'low';
  }

  private getRiskLevelFromDepth(depth: number): 'low' | 'medium' | 'high' {
    if (depth > 3) return 'high';
    if (depth > 1.5) return 'medium';
    return 'low';
  }

  private getRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= RISK_THRESHOLDS.CRITICAL) return 'critical';
    if (probability >= RISK_THRESHOLDS.HIGH) return 'high';
    if (probability >= RISK_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  }

  private getStationElevation(_station: SubwayEntrance): number {
    // Mock elevation data - in real implementation, use elevation API
    return Math.random() * 50 + 10; // 10-60 feet above sea level
  }

  private getDistanceToNearestWater(station: SubwayEntrance, floodZones: FloodZone[]): number {
    const stationPoint = turf.point([station.Entrance_Longitude, station.Entrance_Latitude]);
    let minDistance = Infinity;

    floodZones.forEach(zone => {
      if (zone.geometry.type === 'Polygon') {
        const polygon = turf.polygon(zone.geometry.coordinates);
        const distance = turf.pointToPolygonDistance(stationPoint, polygon, { units: 'meters' });
        minDistance = Math.min(minDistance, distance);
      }
    });

    return minDistance === Infinity ? 1000 : minDistance;
  }

  private getImperviousSurfaceRatio(_station: SubwayEntrance): number {
    // Mock impervious surface ratio - in real implementation, use land cover data
    return Math.random() * 0.8 + 0.2; // 20-100% impervious
  }

  private getFEMAZoneForStation(station: SubwayEntrance, floodZones: FloodZone[]): string {
    const stationPoint = turf.point([station.Entrance_Longitude, station.Entrance_Latitude]);
    
    for (const zone of floodZones) {
      if (zone.type === 'FEMA' && zone.geometry.type === 'Polygon') {
        const polygon = turf.polygon(zone.geometry.coordinates);
        if (turf.booleanPointInPolygon(stationPoint, polygon)) {
          return zone.zone;
        }
      }
    }
    
    return 'X'; // Default to low risk zone
  }

  private getDrainageCapacity(_station: SubwayEntrance): number {
    // Mock drainage capacity - in real implementation, use infrastructure data
    return Math.random() * 0.8 + 0.2; // 20-100% capacity
  }

  private getHistoricalFloods(_station: SubwayEntrance): HistoricalFlood[] {
    // Mock historical flood data
    return [
      {
        date: '2021-09-01',
        severity: 'major',
        duration: 6,
        description: 'Ida Storm',
        source: 'MTA'
      },
      {
        date: '2012-10-29',
        severity: 'major',
        duration: 12,
        description: 'Hurricane Sandy',
        source: 'MTA'
      },
      {
        date: '2023-07-15',
        severity: 'moderate',
        duration: 3,
        description: 'Summer thunderstorm',
        source: '311'
      }
    ];
  }

  private calculateSeverityScore(probability: number, rainfall: number, femaWeight: number): number {
    return Math.min(10, (probability / 10) + (rainfall * 2) + (femaWeight * 3));
  }

  private calculateTimeToFlood(rainfallIntensity: number, elevation: number): number | undefined {
    if (rainfallIntensity < 0.5) return undefined;
    return Math.max(0, (elevation / rainfallIntensity) * 60); // minutes
  }

  private getMitigationSuggestions(riskLevel: string, femaZone: string, imperviousSurface: number): MitigationOption[] {
    const suggestions = [];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      suggestions.push({
        ...MITIGATION_OPTIONS[0],
        description: 'Deploy modular flood barrier at station entrance'
      }); // Modular barrier
      suggestions.push({
        ...MITIGATION_OPTIONS[5],
        description: 'Install emergency pump system for flood events'
      }); // Pump system
    }
    
    if (femaZone === 'AE' || femaZone === 'VE') {
      suggestions.push({
        ...MITIGATION_OPTIONS[3],
        description: 'Raise station platform above flood level'
      }); // Platform elevation
    }
    
    if (imperviousSurface > 0.7) {
      suggestions.push({
        ...MITIGATION_OPTIONS[1],
        description: 'Install rain garden to absorb stormwater runoff'
      }); // Rain garden
      suggestions.push({
        ...MITIGATION_OPTIONS[2],
        description: 'Replace impervious surfaces with permeable materials'
      }); // Permeable pavers
    }
    
    suggestions.push({
      ...MITIGATION_OPTIONS[4],
      description: 'Install real-time water level monitoring system'
    }); // Flood sensors
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private getMockWeatherForecast(): WeatherForecast[] {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(now.getTime() + i * 60 * 60 * 1000).toISOString(),
      rainfallIntensity: Math.random() * 2,
      temperature: 65 + Math.random() * 20,
      humidity: 40 + Math.random() * 40,
      windSpeed: Math.random() * 20,
      conditions: ['clear', 'cloudy', 'rain'][Math.floor(Math.random() * 3)]
    }));
  }

  private getMockFEMAData(): FloodZone[] {
    return [
      {
        type: 'FEMA',
        zone: 'AE',
        riskLevel: 'high',
        baseFloodElevation: 12,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-74.0059, 40.7128], [-74.0259, 40.7328], [-73.9859, 40.7528],
            [-73.9659, 40.7328], [-74.0059, 40.7128]
          ]]
        }
      },
      {
        type: 'FEMA',
        zone: 'A',
        riskLevel: 'medium',
        baseFloodElevation: 8,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-73.9859, 40.7428], [-74.0159, 40.7628], [-73.9759, 40.7828],
            [-73.9559, 40.7628], [-73.9859, 40.7428]
          ]]
        }
      }
    ];
  }

  private getMockStormwaterData(): FloodZone[] {
    return [
      {
        type: 'Stormwater',
        zone: 'Extreme Storm',
        riskLevel: 'high',
        depth: 3.5,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-73.9859, 40.7528], [-74.0159, 40.7728], [-73.9759, 40.7928],
            [-73.9559, 40.7728], [-73.9859, 40.7528]
          ]]
        }
      },
      {
        type: 'Stormwater',
        zone: 'Moderate Storm',
        riskLevel: 'medium',
        depth: 1.8,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-73.9659, 40.7328], [-73.9959, 40.7528], [-73.9559, 40.7728],
            [-73.9259, 40.7528], [-73.9659, 40.7328]
          ]]
        }
      }
    ];
  }
}
