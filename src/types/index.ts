export interface SubwayEntrance {
  // Core identification
  ENTRY_ID: string;
  Division: string;
  Line: string;
  Station_Name: string;
  
  // Location data
  Station_Latitude: number;
  Station_Longitude: number;
  Entrance_Latitude: number;
  Entrance_Longitude: number;
  
  // Route information
  Route1: string;
  Route2: string;
  Route3: string;
  Route4: string;
  Route5: string;
  Route6: string;
  Route7: string;
  Route8: string;
  Route9: string;
  Route10: string;
  Route11: string;
  
  // Entrance properties
  Entrance_Type: 'Exit Only' | 'Entrance/Exit' | 'Emergency Exit' | 'Elevator' | 'Escalator' | 'Stair';
  Entry: 'Yes' | 'No';
  Exit_Only: 'Yes' | 'No';
  Vending: 'Yes' | 'No';
  Staffing: 'Full Time' | 'Part Time' | 'None';
  Staff_Hours: string;
  
  // Accessibility
  ADA: 'Yes' | 'No';
  ADA_Notes: string;
  
  // Location details
  Free_Crossover: 'Yes' | 'No';
  North_South_Street: string;
  East_West_Street: string;
  Corner: string;
  
  // Descriptive fields
  Station_Location: string;
  Entrance_Location: string;
  
  // Additional metadata
  lastUpdated?: string;
  photoUrl?: string;
  notes?: string;
}

export interface FloodRiskAssessment {
  stationId: string;
  stationName: string;
  floodProbability: number; // 0-100%
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  severityScore: number; // 0-10
  timeToFlood?: number; // minutes
  contributingFactors: {
    elevation: number;
    distanceToWater: number;
    imperviousSurface: number;
    femaZone: string;
    drainageCapacity: number;
    rainfallIntensity: number;
  };
  historicalFloods: HistoricalFlood[];
  mitigationSuggestions: MitigationOption[];
}

export interface HistoricalFlood {
  date: string;
  severity: 'minor' | 'moderate' | 'major';
  duration: number; // hours
  description: string;
  source: 'MTA' | '311' | 'crowdsourced';
}

export interface MitigationOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  implementationTime: number; // days
  effectiveness: number; // 0-100%
  type: 'barrier' | 'drainage' | 'elevation' | 'monitoring';
}

export interface WeatherForecast {
  timestamp: string;
  rainfallIntensity: number; // inches/hour
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
}

export interface FloodZone {
  type: 'FEMA' | 'Stormwater';
  zone: string;
  riskLevel: 'low' | 'medium' | 'high';
  baseFloodElevation?: number;
  depth?: number;
  geometry: GeoJSON.Geometry;
}

export interface CrowdsourcedReport {
  id: string;
  stationId: string;
  stationName?: string;
  timestamp: string;
  type: 'standing_water' | 'blocked_drain' | 'overflowing_sewer' | 'infrastructure_damage' | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description?: string;
  reporter?: string;
  verified: boolean;
  location?: {
    coordinates: {
      lat: number;
      lng: number;
    };
    address?: string;
  };
  waterLevel?: number;
  contactInfo?: string;
}

export interface PredictionModel {
  features: {
    rainfallIntensity: number;
    stationElevation: number;
    distanceToWater: number;
    imperviousSurface: number;
    femaZone: string;
    drainageCapacity: number;
    historicalFloodCount: number;
  };
  prediction: {
    floodProbability: number;
    severityScore: number;
    timeToFlood?: number;
  };
}

export interface DashboardStats {
  totalStations: number;
  highRiskStations: number;
  activeAlerts: number;
  lastUpdated: string;
  weatherConditions: string;
  averageRiskScore: number;
}

export interface NYC311Report {
  unique_key: string;
  created_date: string;
  complaint_type: string;
  descriptor: string;
  incident_zip: string;
  city: string;
  borough: string;
  latitude?: number;
  longitude?: number;
  location?: {
    coordinates: [number, number];
  };
}

export interface TideData {
  station: string;
  datetime: string;
  water_level: number;
  prediction?: number;
  verified: boolean;
}

export interface StreamFlowData {
  site_no: string;
  datetime: string;
  flow_rate: number;
  gage_height: number;
  station_nm: string;
}

export interface RealTimeFloodData {
  timestamp: string;
  source: 'NYC311' | 'MTA' | 'USGS' | 'NOAA' | 'Emergency';
  location: {
    latitude: number;
    longitude: number;
  };
  severity: 'minor' | 'moderate' | 'major' | 'extreme';
  description: string;
  affected_area?: string;
  water_depth?: number;
  duration_hours?: number;
}

export interface EnhancedPredictionModel {
  station_id: string;
  timestamp: string;
  risk_factors: {
    current_rainfall: number;
    forecasted_rainfall_1h: number;
    forecasted_rainfall_3h: number;
    tide_level: number;
    nearby_311_reports: number;
    stream_flow_anomaly: number;
    emergency_alerts: number;
    historical_flooding_frequency: number;
    elevation_relative_to_water: number;
    drainage_capacity_utilization: number;
  };
  ml_prediction: {
    flood_probability: number;
    confidence_interval: [number, number];
    time_to_flood_minutes?: number;
    predicted_water_depth?: number;
    model_version: string;
  };
  real_time_adjustments: {
    nearby_incidents_weight: number;
    weather_pattern_weight: number;
    tide_cycle_weight: number;
    infrastructure_status_weight: number;
  };
}

export interface FloodAlert {
  id: string;
  station_id: string;
  alert_level: 'watch' | 'warning' | 'emergency';
  issued_at: string;
  expires_at?: string;
  title: string;
  description: string;
  source: 'system' | 'MTA' | 'NYC_Emergency' | 'NWS';
  actions_recommended: string[];
  affected_lines: string[];
}
