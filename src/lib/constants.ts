export const API_ENDPOINTS = {
  SUBWAY_ENTRANCES: 'https://data.ny.gov/api/views/i9wp-a4ja/rows.csv?accessType=DOWNLOAD',
  FEMA_FLOOD_ZONES: 'https://services.arcgis.com/Ee6nO1MdNJSOwgXW/arcgis/rest/services/FEMA_NFHL_Zones/FeatureServer/0/query?where=STATE_ABBR%3D%27NY%27+AND+(COUNTY_NAM%3D%27NEW%20YORK%27+OR+COUNTY_NAM%3D%27QUEENS%27+OR+COUNTY_NAM%3D%27KINGS%27+OR+COUNTY_NAM%3D%27BRONX%27+OR+COUNTY_NAM%3D%27RICHMOND%27)&outFields=*&outSR=4326&f=geojson&resultRecordCount=50',
  STORMWATER_FLOOD: 'https://data.cityofnewyork.us/resource/uyj8-7rv5.geojson',
  MTA_ALERTS: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts',
  WEATHER_API: 'https://api.weatherapi.com/v1/forecast.json',
  NOAA_RAINFALL: 'https://api.weather.gov/gridpoints/OKX/33,37/forecast',
  NYC_311_COMPLAINTS: 'https://data.cityofnewyork.us/resource/erm2-nwe9.json',
  NYC_WATERWAY_STRUCTURES: 'https://data.cityofnewyork.us/resource/2k42-p9c5.geojson',
  NYC_SEA_LEVEL_RISE: 'https://data.cityofnewyork.us/resource/2qyz-gyqz.geojson',
  NYC_FLOOD_HAZARD_AREAS: 'https://data.cityofnewyork.us/resource/4q3d-vn3t.geojson',
  NYC_STREET_FLOODING: 'https://data.cityofnewyork.us/resource/ha6r-rb3j.json',
  NYC_TIDE_DATA: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
  USGS_STREAM_FLOW: 'https://waterservices.usgs.gov/nwis/iv/',
  NYC_EMERGENCY_NOTIFICATIONS: 'https://data.cityofnewyork.us/resource/8end-qv57.json',
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

// Updated to focus on Grand Central for demo
export const DEFAULT_MAP_CENTER: [number, number] = [-73.9772, 40.7527];
export const DEFAULT_ZOOM = 14 as const;
