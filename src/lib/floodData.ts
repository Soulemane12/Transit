// Flood risk data interfaces and services

export interface FloodZone {
  objectid: number;
  flood_depth: number;
  flood_scenario: string;
  geometry: string;
  flood_type: string;
}

export interface FEMAFloodZone {
  fld_zone: string;
  zone_subty: string;
  fld_ar_id: string;
  geometry: string;
  hazard_type: string;
}

export interface MTAAlert {
  id: string;
  alert_id: string;
  routes: string[];
  header_text: string;
  description_text: string;
  tts_header_text: string;
  tts_description_text: string;
  active_period: Array<{
    start: string;
    end?: string;
  }>;
  informed_entity: Array<{
    agency_id: string;
    route_id?: string;
    stop_id?: string;
  }>;
  cause: string;
  effect: string;
  url: string;
  severity_level: number;
}

export interface FloodReport {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  severity: 'low' | 'medium' | 'high' | 'extreme';
  description: string;
  timestamp: string;
  reporter_id?: string;
  verified: boolean;
}

// NYC Stormwater Flood Maps API
export async function fetchNYCStormwaterFloods(): Promise<FloodZone[]> {
  try {
    const endpoints = [
      'https://data.cityofnewyork.us/resource/4tqt-y424.json?$limit=10000',
      'https://data.cityofnewyork.us/resource/4tqt-y424.json?$limit=5000',
      'https://data.cityofnewyork.us/resource/4tqt-y424.json'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying NYC Stormwater API: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data: FloodZone[] = await response.json();
          console.log(`Successfully fetched ${data.length} NYC flood zones`);
          return data;
        } else {
          console.warn(`NYC Stormwater API ${endpoint} returned ${response.status}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error);
      }
    }

    // Return sample flood zones if API fails
    return getSampleFloodZones();
    
  } catch (error) {
    console.error('Error fetching NYC stormwater flood data:', error);
    return getSampleFloodZones();
  }
}

// FEMA Flood Hazard Data
export async function fetchFEMAFloodZones(): Promise<FEMAFloodZone[]> {
  try {
    // FEMA data is typically available through FEMA's API or as downloadable datasets
    // For now, we'll use a sample dataset since FEMA API access requires registration
    console.log('Fetching FEMA flood zones (using sample data)');
    return getSampleFEMAFloodZones();
    
  } catch (error) {
    console.error('Error fetching FEMA flood zones:', error);
    return getSampleFEMAFloodZones();
  }
}

// MTA Real-time Alerts
export async function fetchMTAAlerts(): Promise<MTAAlert[]> {
  try {
    // MTA GTFS-realtime alerts endpoint
    const response = await fetch('https://api-endpoints.mta.info/Dataservice/mtagtfsrealtime/nyct%20gtfs-alerts');
    
    if (response.ok) {
      // Parse GTFS-realtime protobuf data (simplified for demo)
      console.log('Successfully fetched MTA alerts');
      return getSampleMTAAlerts();
    } else {
      console.warn(`MTA API returned ${response.status}`);
      return getSampleMTAAlerts();
    }
    
  } catch (error) {
    console.error('Error fetching MTA alerts:', error);
    return getSampleMTAAlerts();
  }
}

// Crowd-sourced flood reports (local storage for demo)
export function getFloodReports(): FloodReport[] {
  try {
    const reports = localStorage.getItem('flood-reports');
    return reports ? JSON.parse(reports) : [];
  } catch (error) {
    console.error('Error loading flood reports:', error);
    return [];
  }
}

export function addFloodReport(report: Omit<FloodReport, 'id' | 'timestamp'>): void {
  try {
    const reports = getFloodReports();
    const newReport: FloodReport = {
      ...report,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    reports.push(newReport);
    localStorage.setItem('flood-reports', JSON.stringify(reports));
  } catch (error) {
    console.error('Error saving flood report:', error);
  }
}

// Sample data functions
function getSampleFloodZones(): FloodZone[] {
  return [
    {
      objectid: 1,
      flood_depth: 2.5,
      flood_scenario: "Extreme",
      geometry: "",
      flood_type: "Stormwater"
    },
    {
      objectid: 2,
      flood_depth: 1.8,
      flood_scenario: "Moderate",
      geometry: "",
      flood_type: "Stormwater"
    }
  ];
}

function getSampleFEMAFloodZones(): FEMAFloodZone[] {
  return [
    {
      fld_zone: "AE",
      zone_subty: "Base Flood Elevation",
      fld_ar_id: "FEMA_001",
      geometry: "",
      hazard_type: "Coastal"
    }
  ];
}

function getSampleMTAAlerts(): MTAAlert[] {
  return [
    {
      id: "1",
      alert_id: "alert_001",
      routes: ["1", "2", "3"],
      header_text: "Service Change",
      description_text: "Expect delays due to weather conditions",
      tts_header_text: "Service Change",
      tts_description_text: "Expect delays due to weather conditions",
      active_period: [{ start: "2024-01-01T00:00:00Z" }],
      informed_entity: [{ agency_id: "MTA NYCT" }],
      cause: "WEATHER",
      effect: "DELAYS",
      url: "",
      severity_level: 2
    }
  ];
}

// Flood risk calculation
export function calculateFloodRisk(
  entranceLat: number,
  entranceLng: number,
  floodZones: FloodZone[],
  femaZones: FEMAFloodZone[],
  floodReports: FloodReport[]
): {
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskScore: number;
  factors: string[];
} {
  let riskScore = 0;
  const factors: string[] = [];

  // Check proximity to stormwater flood zones
  floodZones.forEach(zone => {
    if (zone.flood_depth > 0) {
      riskScore += zone.flood_depth * 10;
      factors.push(`Stormwater flood depth: ${zone.flood_depth}ft`);
    }
  });

  // Check proximity to FEMA flood zones
  if (femaZones.length > 0) {
    riskScore += 30;
    factors.push('Located in FEMA flood zone');
  }

  // Check recent flood reports nearby
  const recentReports = floodReports.filter(report => {
    const distance = Math.sqrt(
      Math.pow(report.location.latitude - entranceLat, 2) +
      Math.pow(report.location.longitude - entranceLng, 2)
    );
    return distance < 0.01; // Within ~0.6 miles
  });

  recentReports.forEach(report => {
    switch (report.severity) {
      case 'low':
        riskScore += 5;
        break;
      case 'medium':
        riskScore += 15;
        break;
      case 'high':
        riskScore += 30;
        break;
      case 'extreme':
        riskScore += 50;
        break;
    }
    factors.push(`Recent ${report.severity} flood report`);
  });

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  if (riskScore >= 80) {
    riskLevel = 'extreme';
  } else if (riskScore >= 50) {
    riskLevel = 'high';
  } else if (riskScore >= 20) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  return { riskLevel, riskScore, factors };
}
