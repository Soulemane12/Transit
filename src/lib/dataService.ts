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
  MitigationOption,
  NYC311Report,
  TideData,
  RealTimeFloodData,
  EnhancedPredictionModel,
  FloodAlert
} from '../types';
import { API_ENDPOINTS, RISK_THRESHOLDS, FLOOD_ZONE_RISK_WEIGHTS, MITIGATION_OPTIONS } from './constants';

export class DataService {
  private static instance: DataService;
  private subwayEntrances: SubwayEntrance[] = [];
  private floodZones: FloodZone[] = [];
  private weatherForecast: WeatherForecast[] = [];
  private crowdsourcedReports: CrowdsourcedReport[] = [];
  private nyc311Reports: NYC311Report[] = [];
  private tideData: TideData[] = [];
  private realTimeFloodData: RealTimeFloodData[] = [];
  private activeAlerts: FloodAlert[] = [];

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

  // Fetch NYC 311 flood-related complaints
  async fetchNYC311FloodReports(): Promise<NYC311Report[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const response = await axios.get(API_ENDPOINTS.NYC_311_COMPLAINTS, {
        params: {
          '$where': `created_date >= '${thirtyDaysAgo.toISOString().split('T')[0]}' AND (complaint_type like '%Flood%' OR complaint_type like '%Water%' OR descriptor like '%flood%' OR descriptor like '%water%')`,
          '$limit': 1000,
          '$order': 'created_date DESC'
        }
      });

      this.nyc311Reports = response.data.map((report: Record<string, unknown>) => ({
        unique_key: String(report.unique_key || ''),
        created_date: String(report.created_date || ''),
        complaint_type: String(report.complaint_type || ''),
        descriptor: String(report.descriptor || ''),
        incident_zip: String(report.incident_zip || ''),
        city: String(report.city || ''),
        borough: String(report.borough || ''),
        latitude: report.latitude ? parseFloat(String(report.latitude)) : undefined,
        longitude: report.longitude ? parseFloat(String(report.longitude)) : undefined,
        location: report.location as { coordinates: [number, number] } | undefined
      }));

      return this.nyc311Reports;
    } catch (error) {
      console.error('Error fetching NYC 311 reports:', error);
      return this.getMock311Reports();
    }
  }

  // Fetch real-time tide data
  async fetchTideData(): Promise<TideData[]> {
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

      const response = await axios.get(API_ENDPOINTS.NYC_TIDE_DATA, {
        params: {
          station: '8518750', // The Battery, NYC
          product: 'water_level',
          datum: 'MLLW',
          units: 'english',
          time_zone: 'lst_ldt',
          format: 'json',
          begin_date: now.toISOString().split('T')[0].replace(/-/g, ''),
          end_date: endDate.toISOString().split('T')[0].replace(/-/g, '')
        }
      });

      if (response.data && response.data.data) {
        this.tideData = response.data.data.map((item: Record<string, unknown>) => ({
          station: String(item.s || '8518750'),
          datetime: String(item.t || ''),
          water_level: parseFloat(String(item.v || '0')),
          verified: item.q === 'v',
          prediction: item.q === 'p' ? parseFloat(String(item.v || '0')) : undefined
        }));
      }

      return this.tideData;
    } catch (error) {
      console.error('Error fetching tide data:', error);
      return this.getMockTideData();
    }
  }

  // Enhanced flood risk calculation with real-time data
  calculateEnhancedFloodRisk(
    station: SubwayEntrance,
    weatherForecast: WeatherForecast[],
    floodZones: FloodZone[]
  ): EnhancedPredictionModel {
    const stationPoint = turf.point([station.Entrance_Longitude, station.Entrance_Latitude]);

    // Get nearby 311 reports
    const nearby311Reports = this.nyc311Reports.filter(report => {
      if (!report.latitude || !report.longitude) return false;
      const reportPoint = turf.point([report.longitude, report.latitude]);
      const distance = turf.distance(stationPoint, reportPoint, { units: 'kilometers' });
      return distance <= 2; // Within 2km
    });

    // Get current tide level
    const currentTide = this.tideData.length > 0 ? this.tideData[0].water_level : 0;

    // Calculate enhanced risk factors
    const currentRainfall = weatherForecast[0]?.rainfallIntensity || 0;
    const forecastedRainfall1h = weatherForecast.slice(0, 1).reduce((sum, f) => sum + f.rainfallIntensity, 0);
    const forecastedRainfall3h = weatherForecast.slice(0, 3).reduce((sum, f) => sum + f.rainfallIntensity, 0);

    const elevation = this.getStationElevation(station);
    const femaZone = this.getFEMAZoneForStation(station, floodZones);
    const drainageCapacity = this.getDrainageCapacity(station);

    // Enhanced ML-style prediction
    const riskFactors = {
      current_rainfall: currentRainfall,
      forecasted_rainfall_1h: forecastedRainfall1h,
      forecasted_rainfall_3h: forecastedRainfall3h,
      tide_level: currentTide,
      nearby_311_reports: nearby311Reports.length,
      stream_flow_anomaly: 0, // Would come from USGS data
      emergency_alerts: this.activeAlerts.filter(alert => alert.station_id === `${station.Station_Name}-${station.Line}`).length,
      historical_flooding_frequency: this.getHistoricalFloodingFrequency(station),
      elevation_relative_to_water: elevation - (currentTide * 0.3048), // Convert feet to meters
      drainage_capacity_utilization: 1 - drainageCapacity
    };

    // Enhanced probability calculation with ML weights
    const weights = {
      current_rainfall: 0.25,
      forecasted_rainfall_1h: 0.15,
      forecasted_rainfall_3h: 0.10,
      tide_level: 0.15,
      nearby_311_reports: 0.10,
      elevation_relative_to_water: 0.15,
      drainage_capacity_utilization: 0.10
    };

    let baseFloodProbability = 0;
    baseFloodProbability += Math.min(riskFactors.current_rainfall * 25, 30) * weights.current_rainfall;
    baseFloodProbability += Math.min(riskFactors.forecasted_rainfall_1h * 20, 25) * weights.forecasted_rainfall_1h;
    baseFloodProbability += Math.min(riskFactors.forecasted_rainfall_3h * 15, 20) * weights.forecasted_rainfall_3h;
    baseFloodProbability += Math.min(Math.max(riskFactors.tide_level - 2, 0) * 10, 15) * weights.tide_level;
    baseFloodProbability += Math.min(riskFactors.nearby_311_reports * 5, 15) * weights.nearby_311_reports;
    baseFloodProbability += Math.max(0, (5 - riskFactors.elevation_relative_to_water) * 5) * weights.elevation_relative_to_water;
    baseFloodProbability += riskFactors.drainage_capacity_utilization * 20 * weights.drainage_capacity_utilization;

    // Add FEMA zone multiplier
    const femaWeight = FLOOD_ZONE_RISK_WEIGHTS[femaZone as keyof typeof FLOOD_ZONE_RISK_WEIGHTS] || 0.5;
    baseFloodProbability *= (1 + femaWeight);

    const floodProbability = Math.min(100, Math.max(0, baseFloodProbability));
    const confidenceInterval: [number, number] = [
      Math.max(0, floodProbability - 15),
      Math.min(100, floodProbability + 15)
    ];

    return {
      station_id: `${station.Station_Name}-${station.Line}`,
      timestamp: new Date().toISOString(),
      risk_factors: riskFactors,
      ml_prediction: {
        flood_probability: floodProbability,
        confidence_interval: confidenceInterval,
        time_to_flood_minutes: this.calculateTimeToFlood(currentRainfall, elevation),
        predicted_water_depth: this.calculatePredictedWaterDepth(floodProbability, elevation),
        model_version: '2.1.0'
      },
      real_time_adjustments: {
        nearby_incidents_weight: nearby311Reports.length > 3 ? 1.2 : 1.0,
        weather_pattern_weight: forecastedRainfall3h > 2 ? 1.3 : 1.0,
        tide_cycle_weight: currentTide > 3 ? 1.15 : 1.0,
        infrastructure_status_weight: 1.0 // Would be based on MTA alerts
      }
    };
  }

  // Generate flood alerts based on predictions
  generateFloodAlerts(predictions: EnhancedPredictionModel[]): FloodAlert[] {
    const alerts: FloodAlert[] = [];
    const now = new Date();

    predictions.forEach(prediction => {
      const probability = prediction.ml_prediction.flood_probability;
      let alertLevel: 'watch' | 'warning' | 'emergency' = 'watch';

      if (probability >= 80) alertLevel = 'emergency';
      else if (probability >= 60) alertLevel = 'warning';
      else if (probability >= 40) alertLevel = 'watch';
      else return; // No alert needed

      const station = this.subwayEntrances.find(s =>
        `${s.Station_Name}-${s.Line}` === prediction.station_id
      );

      if (!station) return;

      const alert: FloodAlert = {
        id: `alert_${prediction.station_id}_${now.getTime()}`,
        station_id: prediction.station_id,
        alert_level: alertLevel,
        issued_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        title: `${alertLevel.toUpperCase()}: ${station.Station_Name} Flood Risk`,
        description: `${Math.round(probability)}% chance of flooding in the next 3 hours. ${
          prediction.ml_prediction.time_to_flood_minutes
            ? `Estimated time to flood: ${Math.round(prediction.ml_prediction.time_to_flood_minutes)} minutes.`
            : ''
        }`,
        source: 'system',
        actions_recommended: this.getRecommendedActions(alertLevel, probability),
        affected_lines: [station.Line]
      };

      alerts.push(alert);
    });

    this.activeAlerts = alerts;
    return alerts;
  }

  private getHistoricalFloodingFrequency(_station: SubwayEntrance): number {
    // Mock implementation - would query historical database
    return Math.random() * 5; // 0-5 incidents per year
  }

  private calculatePredictedWaterDepth(probability: number, elevation: number): number {
    if (probability < 40) return 0;
    const baseDepth = (probability - 40) / 60 * 3; // 0-3 feet based on probability
    const elevationFactor = Math.max(0, 1 - elevation / 20); // Higher elevation = less depth
    return baseDepth * elevationFactor;
  }

  private getRecommendedActions(alertLevel: string, _probability: number): string[] {
    const actions = [];

    if (alertLevel === 'emergency') {
      actions.push('Avoid this station immediately');
      actions.push('Use alternative transportation routes');
      actions.push('Monitor MTA alerts for service changes');
    } else if (alertLevel === 'warning') {
      actions.push('Plan alternative routes');
      actions.push('Allow extra travel time');
      actions.push('Stay informed of weather conditions');
    } else {
      actions.push('Be aware of potential delays');
      actions.push('Monitor weather conditions');
    }

    return actions;
  }

  private getMock311Reports(): NYC311Report[] {
    return [
      {
        unique_key: '12345',
        created_date: new Date().toISOString(),
        complaint_type: 'Street Flooding',
        descriptor: 'Heavy flooding on street',
        incident_zip: '10001',
        city: 'NEW YORK',
        borough: 'MANHATTAN',
        latitude: 40.7505,
        longitude: -73.9934
      }
    ];
  }

  private getMockTideData(): TideData[] {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => ({
      station: '8518750',
      datetime: new Date(now.getTime() + i * 60 * 60 * 1000).toISOString(),
      water_level: 2.5 + Math.sin(i * Math.PI / 6) * 1.5, // Simulate tidal cycle
      verified: true
    }));
  }
}
