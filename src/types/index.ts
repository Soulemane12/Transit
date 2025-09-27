export interface SubwayEntrance {
  Division: string;
  Line: string;
  Station_Name: string;
  Station_Latitude: number;
  Station_Longitude: number;
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
  Entrance_Type: string;
  Entry: string;
  Exit_Only: string;
  Vending: string;
  Staffing: string;
  Staff_Hours: string;
  ADA: string;
  ADA_Notes: string;
  Free_Crossover: string;
  North_South_Street: string;
  East_West_Street: string;
  Corner: string;
  Entrance_Latitude: number;
  Entrance_Longitude: number;
  Station_Location: string;
  Entrance_Location: string;
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
  timestamp: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  reporter: string;
  verified: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
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
