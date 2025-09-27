import axios from 'axios';
import * as turf from '@turf/turf';
import { 
  SubwayEntrance, 
  FloodRiskAssessment, 
  WeatherForecast, 
  FloodZone, 
  CrowdsourcedReport,
  PredictionModel,
  DashboardStats 
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
      const response = await axios.get(API_ENDPOINTS.FEMA_FLOOD_ZONES, {
        params: {
          where: "STATE_ABBR='NY' AND (COUNTY_NAM='NEW YORK' OR COUNTY_NAM='QUEENS' OR COUNTY_NAM='KINGS' OR COUNTY_NAM='BRONX' OR COUNTY_NAM='RICHMOND')",
          outFields: '*',
          outSR: 4326,
          f: 'geojson',
          resultRecordCount: 1000
        }
      });

      const data = response.data;
      if (data.features && data.features.length > 0) {
        const floodZones: FloodZone[] = data.features.map((feature: any) => ({
          type: 'FEMA',
          zone: feature.properties.FLD_ZONE || 'Unknown',
          riskLevel: this.getRiskLevelFromFEMAZone(feature.properties.FLD_ZONE),
          baseFloodElevation: feature.properties.STATIC_BFE ? parseFloat(feature.properties.STATIC_BFE) : undefined,
          geometry: feature.geometry
        }));
        
        this.floodZones = [...this.floodZones, ...floodZones];
        return floodZones;
      }
      return [];
    } catch (error) {
      console.error('Error fetching FEMA flood zones:', error);
      return [];
    }
  }

  // Fetch stormwater flood data
  async fetchStormwaterFlood(): Promise<FloodZone[]> {
    try {
      const response = await axios.get(API_ENDPOINTS.STORMWATER_FLOOD);
      const data = response.data;
      
      if (data.features && data.features.length > 0) {
        const stormwaterZones: FloodZone[] = data.features.map((feature: any) => ({
          type: 'Stormwater',
          zone: feature.properties.scenario || 'Stormwater',
          riskLevel: this.getRiskLevelFromDepth(feature.properties.depth_ft),
          depth: feature.properties.depth_ft,
          geometry: feature.geometry
        }));
        
        this.floodZones = [...this.floodZones, ...stormwaterZones];
        return stormwaterZones;
      }
      return [];
    } catch (error) {
      console.error('Error fetching stormwater flood data:', error);
      return [];
    }
  }

  // Fetch weather forecast
  async fetchWeatherForecast(): Promise<WeatherForecast[]> {
    try {
      // Using OpenWeatherMap API (requires API key)
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) {
        console.warn('OpenWeatherMap API key not found, using mock data');
        return this.getMockWeatherForecast();
      }

      const response = await axios.get(API_ENDPOINTS.WEATHER_API, {
        params: {
          lat: 40.7589,
          lon: -73.9851,
          appid: apiKey,
          units: 'imperial'
        }
      });

      const forecasts: WeatherForecast[] = response.data.list.map((item: any) => ({
        timestamp: item.dt_txt,
        rainfallIntensity: item.rain?.['1h'] || 0,
        temperature: item.main.temp,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        conditions: item.weather[0].main
      }));

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
    const stationPoint = turf.point([station.Entrance_Longitude, station.Entrance_Latitude]);
    
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
        drainageCapacity
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

  private getStationElevation(station: SubwayEntrance): number {
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

  private getImperviousSurfaceRatio(station: SubwayEntrance): number {
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

  private getDrainageCapacity(station: SubwayEntrance): number {
    // Mock drainage capacity - in real implementation, use infrastructure data
    return Math.random() * 0.8 + 0.2; // 20-100% capacity
  }

  private getHistoricalFloods(station: SubwayEntrance): any[] {
    // Mock historical flood data
    return [
      {
        date: '2021-09-01',
        severity: 'major',
        duration: 6,
        description: 'Hurricane Ida flooding',
        source: 'MTA'
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

  private getMitigationSuggestions(riskLevel: string, femaZone: string, imperviousSurface: number): any[] {
    const suggestions = [];
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      suggestions.push(MITIGATION_OPTIONS[0]); // Modular barrier
      suggestions.push(MITIGATION_OPTIONS[5]); // Pump system
    }
    
    if (femaZone === 'AE' || femaZone === 'VE') {
      suggestions.push(MITIGATION_OPTIONS[3]); // Platform elevation
    }
    
    if (imperviousSurface > 0.7) {
      suggestions.push(MITIGATION_OPTIONS[1]); // Rain garden
      suggestions.push(MITIGATION_OPTIONS[2]); // Permeable pavers
    }
    
    suggestions.push(MITIGATION_OPTIONS[4]); // Flood sensors
    
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
}
