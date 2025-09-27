export const API_ENDPOINTS = {
  SUBWAY_ENTRANCES: 'https://data.ny.gov/api/views/i9wp-a4ja/rows.csv?accessType=DOWNLOAD',
  FEMA_FLOOD_ZONES: 'https://services.arcgis.com/Ee6nO1MdNJSOwgXW/arcgis/rest/services/FEMA_NFHL_Zones/FeatureServer/0/query',
  STORMWATER_FLOOD: 'https://data.cityofnewyork.us/resource/qcg9-hq2p.geojson',
  MTA_ALERTS: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts',
  WEATHER_API: 'https://api.openweathermap.org/data/2.5/forecast',
  NOAA_RAINFALL: 'https://api.weather.gov/gridpoints/OKX/33,37/forecast',
} as const;

export const RISK_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.8,
  CRITICAL: 0.9,
} as const;

export const FLOOD_ZONE_RISK_WEIGHTS = {
  'AE': 0.9,    // High risk
  'A': 0.7,     // Medium-high risk
  'X': 0.2,     // Low risk
  'VE': 0.95,   // Very high risk
  'AO': 0.6,    // Medium risk
} as const;

export const MITIGATION_OPTIONS: Array<{
  id: string;
  name: string;
  description: string;
  cost: number;
  implementationTime: number;
  effectiveness: number;
  type: 'barrier' | 'drainage' | 'elevation' | 'monitoring';
}> = [
  {
    id: 'modular-barrier',
    name: 'Modular Flood Barrier',
    description: 'Deployable flood barriers at station entrances',
    cost: 15000,
    implementationTime: 1,
    effectiveness: 85,
    type: 'barrier'
  },
  {
    id: 'rain-garden',
    name: 'Rain Garden',
    description: 'Bioswale to absorb stormwater runoff',
    cost: 25000,
    implementationTime: 30,
    effectiveness: 70,
    type: 'drainage'
  },
  {
    id: 'permeable-pavers',
    name: 'Permeable Pavers',
    description: 'Replace impervious surfaces with permeable materials',
    cost: 35000,
    implementationTime: 45,
    effectiveness: 60,
    type: 'drainage'
  },
  {
    id: 'elevation-platform',
    name: 'Platform Elevation',
    description: 'Raise station platform above flood level',
    cost: 100000,
    implementationTime: 90,
    effectiveness: 95,
    type: 'elevation'
  },
  {
    id: 'flood-sensors',
    name: 'Flood Monitoring Sensors',
    description: 'Real-time water level monitoring system',
    cost: 8000,
    implementationTime: 7,
    effectiveness: 40,
    type: 'monitoring'
  },
  {
    id: 'pump-system',
    name: 'Emergency Pump System',
    description: 'Backup drainage pumps for flood events',
    cost: 50000,
    implementationTime: 21,
    effectiveness: 80,
    type: 'drainage'
  }
];

export const WEATHER_CONDITIONS = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  HEAVY_RAIN: 'heavy_rain',
  STORM: 'storm',
} as const;

export const MAP_STYLES = {
  STREETS: 'mapbox://styles/mapbox/streets-v12',
  SATELLITE: 'mapbox://styles/mapbox/satellite-v9',
  DARK: 'mapbox://styles/mapbox/dark-v11',
} as const;

export const NYC_BOUNDS = {
  NORTH: 40.9176,
  SOUTH: 40.4774,
  EAST: -73.7004,
  WEST: -74.2591,
} as const;

export const DEFAULT_MAP_CENTER = [-73.9851, 40.7589] as const;
export const DEFAULT_ZOOM = 11 as const;
