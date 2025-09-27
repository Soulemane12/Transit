import { SubwayEntrance, FloodRiskAssessment, FloodAlert } from '../types';

// Grand Central Terminal coordinates and surrounding area
export const GRAND_CENTRAL_COORDS = {
  lat: 40.7527,
  lng: -73.9772
};

// Mock user location (right at Grand Central)
export const DEMO_USER_LOCATION = GRAND_CENTRAL_COORDS;

// Grand Central and nearby subway entrances with all lines
export const DEMO_SUBWAY_ENTRANCES: SubwayEntrance[] = [
  // Grand Central - 42nd St (4, 5, 6, 7, S)
  {
    ENTRY_ID: 'GCT001',
    Division: 'IRT',
    Line: '4-5-6-7-S',
    Station_Name: '42nd St - Grand Central',
    Station_Latitude: 40.7527,
    Station_Longitude: -73.9772,
    Entrance_Latitude: 40.7527,
    Entrance_Longitude: -73.9772,
    Route1: '4',
    Route2: '5',
    Route3: '6',
    Route4: '7',
    Route5: 'S',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Full Time',
    Staff_Hours: '24/7',
    ADA: 'Yes',
    ADA_Notes: 'Full accessibility with elevators',
    Free_Crossover: 'Yes',
    North_South_Street: 'Park Ave',
    East_West_Street: '42nd St',
    Corner: 'SW',
    Station_Location: 'Grand Central Terminal',
    Entrance_Location: 'Main Terminal Entrance'
  },
  {
    ENTRY_ID: 'GCT002',
    Division: 'IRT',
    Line: '4-5-6-7-S',
    Station_Name: '42nd St - Grand Central',
    Station_Latitude: 40.7527,
    Station_Longitude: -73.9772,
    Entrance_Latitude: 40.7530,
    Entrance_Longitude: -73.9775,
    Route1: '4',
    Route2: '5',
    Route3: '6',
    Route4: '7',
    Route5: 'S',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Full Time',
    Staff_Hours: '24/7',
    ADA: 'Yes',
    ADA_Notes: 'Elevator access to all platforms',
    Free_Crossover: 'Yes',
    North_South_Street: 'Lexington Ave',
    East_West_Street: '42nd St',
    Corner: 'NE',
    Station_Location: 'Grand Central Terminal',
    Entrance_Location: 'Lexington Ave Entrance'
  },
  {
    ENTRY_ID: 'GCT003',
    Division: 'IRT',
    Line: '4-5-6-7-S',
    Station_Name: '42nd St - Grand Central',
    Station_Latitude: 40.7527,
    Station_Longitude: -73.9772,
    Entrance_Latitude: 40.7525,
    Entrance_Longitude: -73.9770,
    Route1: '4',
    Route2: '5',
    Route3: '6',
    Route4: '7',
    Route5: 'S',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'No',
    Staffing: 'Part Time',
    Staff_Hours: '6AM-10PM',
    ADA: 'No',
    ADA_Notes: 'Stairs only',
    Free_Crossover: 'Yes',
    North_South_Street: 'Park Ave',
    East_West_Street: '41st St',
    Corner: 'SE',
    Station_Location: 'Grand Central Terminal',
    Entrance_Location: 'South Entrance'
  },

  // Times Square - 42nd St (N, Q, R, W, S, 1, 2, 3, 7)
  {
    ENTRY_ID: 'TSQ001',
    Division: 'BMT/IRT',
    Line: 'N-Q-R-W-S-1-2-3-7',
    Station_Name: 'Times Sq - 42nd St',
    Station_Latitude: 40.7550,
    Station_Longitude: -73.9868,
    Entrance_Latitude: 40.7550,
    Entrance_Longitude: -73.9868,
    Route1: 'N',
    Route2: 'Q',
    Route3: 'R',
    Route4: 'W',
    Route5: 'S',
    Route6: '1',
    Route7: '2',
    Route8: '3',
    Route9: '7',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Full Time',
    Staff_Hours: '24/7',
    ADA: 'Yes',
    ADA_Notes: 'Full accessibility',
    Free_Crossover: 'Yes',
    North_South_Street: 'Broadway',
    East_West_Street: '42nd St',
    Corner: 'NW',
    Station_Location: 'Times Square',
    Entrance_Location: 'Main Times Square Entrance'
  },

  // 51st St (6)
  {
    ENTRY_ID: '51ST001',
    Division: 'IRT',
    Line: '6',
    Station_Name: '51st St',
    Station_Latitude: 40.7570,
    Station_Longitude: -73.9755,
    Entrance_Latitude: 40.7570,
    Entrance_Longitude: -73.9755,
    Route1: '6',
    Route2: '',
    Route3: '',
    Route4: '',
    Route5: '',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Part Time',
    Staff_Hours: '6AM-10PM',
    ADA: 'No',
    ADA_Notes: 'Stairs only',
    Free_Crossover: 'No',
    North_South_Street: 'Lexington Ave',
    East_West_Street: '51st St',
    Corner: 'SW',
    Station_Location: '51st St & Lexington Ave',
    Entrance_Location: 'Street Level'
  },

  // 33rd St (6)
  {
    ENTRY_ID: '33ST001',
    Division: 'IRT',
    Line: '6',
    Station_Name: '33rd St',
    Station_Latitude: 40.7460,
    Station_Longitude: -73.9755,
    Entrance_Latitude: 40.7460,
    Entrance_Longitude: -73.9755,
    Route1: '6',
    Route2: '',
    Route3: '',
    Route4: '',
    Route5: '',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Part Time',
    Staff_Hours: '6AM-10PM',
    ADA: 'Yes',
    ADA_Notes: 'Elevator available',
    Free_Crossover: 'No',
    North_South_Street: 'Park Ave',
    East_West_Street: '33rd St',
    Corner: 'NE',
    Station_Location: '33rd St & Park Ave',
    Entrance_Location: 'Park Ave Entrance'
  },

  // 5th Ave/53rd St (E, M)
  {
    ENTRY_ID: '5AV001',
    Division: 'IND',
    Line: 'E-M',
    Station_Name: '5th Ave/53rd St',
    Station_Latitude: 40.7605,
    Station_Longitude: -73.9744,
    Entrance_Latitude: 40.7605,
    Entrance_Longitude: -73.9744,
    Route1: 'E',
    Route2: 'M',
    Route3: '',
    Route4: '',
    Route5: '',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Part Time',
    Staff_Hours: '6AM-10PM',
    ADA: 'No',
    ADA_Notes: 'Stairs only',
    Free_Crossover: 'No',
    North_South_Street: '5th Ave',
    East_West_Street: '53rd St',
    Corner: 'SE',
    Station_Location: '5th Ave & 53rd St',
    Entrance_Location: '5th Avenue Entrance'
  },

  // 47-50th Sts Rockefeller Center (B, D, F, M)
  {
    ENTRY_ID: 'ROCK001',
    Division: 'IND',
    Line: 'B-D-F-M',
    Station_Name: '47-50th Sts - Rockefeller Ctr',
    Station_Latitude: 40.7580,
    Station_Longitude: -73.9816,
    Entrance_Latitude: 40.7580,
    Entrance_Longitude: -73.9816,
    Route1: 'B',
    Route2: 'D',
    Route3: 'F',
    Route4: 'M',
    Route5: '',
    Route6: '',
    Route7: '',
    Route8: '',
    Route9: '',
    Route10: '',
    Route11: '',
    Entrance_Type: 'Entrance/Exit',
    Entry: 'Yes',
    Exit_Only: 'No',
    Vending: 'Yes',
    Staffing: 'Full Time',
    Staff_Hours: '24/7',
    ADA: 'Yes',
    ADA_Notes: 'Elevator to street level',
    Free_Crossover: 'Yes',
    North_South_Street: '6th Ave',
    East_West_Street: '49th St',
    Corner: 'NW',
    Station_Location: 'Rockefeller Center',
    Entrance_Location: 'Rockefeller Center Concourse'
  }
];

// Mock flood risk assessments for demo stations
export const DEMO_FLOOD_ASSESSMENTS: FloodRiskAssessment[] = [
  {
    stationId: '42nd St - Grand Central-4-5-6-7-S',
    stationName: '42nd St - Grand Central',
    floodProbability: 72,
    riskLevel: 'high',
    severityScore: 7.2,
    timeToFlood: 45,
    contributingFactors: {
      elevation: 32,
      distanceToWater: 850,
      imperviousSurface: 0.92,
      femaZone: 'AE',
      drainageCapacity: 0.65,
      rainfallIntensity: 1.8
    },
    historicalFloods: [
      {
        date: '2021-09-01',
        severity: 'major',
        duration: 8,
        description: 'Hurricane Ida caused extensive flooding in lower levels',
        source: 'MTA'
      },
      {
        date: '2012-10-29',
        severity: 'major',
        duration: 18,
        description: 'Hurricane Sandy flooded tunnels and platforms',
        source: 'MTA'
      },
      {
        date: '2023-09-29',
        severity: 'moderate',
        duration: 4,
        description: 'Heavy rainfall caused platform flooding',
        source: '311'
      }
    ],
    mitigationSuggestions: [
      {
        id: 'flood-barriers-gct',
        name: 'Modular Flood Barrier',
        description: 'Deploy modular flood barrier at 42nd and Lexington',
        cost: 25000,
        implementationTime: 1,
        effectiveness: 85,
        type: 'barrier'
      },
      {
        id: 'pump-system-gct',
        name: 'Advanced Pump System',
        description: 'Upgrade drainage pumps for high-capacity water removal',
        cost: 1800000,
        implementationTime: 120,
        effectiveness: 80,
        type: 'drainage'
      }
    ]
  },
  {
    stationId: 'Times Sq - 42nd St-N-Q-R-W-S-1-2-3-7',
    stationName: 'Times Sq - 42nd St',
    floodProbability: 85,
    riskLevel: 'critical',
    severityScore: 8.9,
    timeToFlood: 25,
    contributingFactors: {
      elevation: 28,
      distanceToWater: 1200,
      imperviousSurface: 0.96,
      femaZone: 'AE',
      drainageCapacity: 0.45,
      rainfallIntensity: 1.8
    },
    historicalFloods: [
      {
        date: '2021-09-01',
        severity: 'major',
        duration: 12,
        description: 'Hurricane Ida - complete station closure',
        source: 'MTA'
      }
    ],
    mitigationSuggestions: []
  },
  {
    stationId: '51st St-6',
    stationName: '51st St',
    floodProbability: 35,
    riskLevel: 'medium',
    severityScore: 4.2,
    timeToFlood: 120,
    contributingFactors: {
      elevation: 45,
      distanceToWater: 1500,
      imperviousSurface: 0.78,
      femaZone: 'X',
      drainageCapacity: 0.75,
      rainfallIntensity: 1.8
    },
    historicalFloods: [],
    mitigationSuggestions: []
  },
  {
    stationId: '33rd St-6',
    stationName: '33rd St',
    floodProbability: 28,
    riskLevel: 'low',
    severityScore: 3.1,
    contributingFactors: {
      elevation: 48,
      distanceToWater: 1800,
      imperviousSurface: 0.72,
      femaZone: 'X',
      drainageCapacity: 0.80,
      rainfallIntensity: 1.8
    },
    historicalFloods: [],
    mitigationSuggestions: []
  },
  {
    stationId: '5th Ave/53rd St-E-M',
    stationName: '5th Ave/53rd St',
    floodProbability: 42,
    riskLevel: 'medium',
    severityScore: 4.8,
    timeToFlood: 95,
    contributingFactors: {
      elevation: 38,
      distanceToWater: 1200,
      imperviousSurface: 0.85,
      femaZone: 'X',
      drainageCapacity: 0.70,
      rainfallIntensity: 1.8
    },
    historicalFloods: [],
    mitigationSuggestions: []
  },
  {
    stationId: '47-50th Sts - Rockefeller Ctr-B-D-F-M',
    stationName: '47-50th Sts - Rockefeller Ctr',
    floodProbability: 55,
    riskLevel: 'medium',
    severityScore: 5.5,
    timeToFlood: 75,
    contributingFactors: {
      elevation: 35,
      distanceToWater: 1100,
      imperviousSurface: 0.88,
      femaZone: 'A',
      drainageCapacity: 0.60,
      rainfallIntensity: 1.8
    },
    historicalFloods: [
      {
        date: '2021-09-01',
        severity: 'moderate',
        duration: 6,
        description: 'Concourse level flooding during Hurricane Ida',
        source: 'MTA'
      }
    ],
    mitigationSuggestions: []
  }
];

// Mock flood alerts for demo
export const DEMO_FLOOD_ALERTS: FloodAlert[] = [
  {
    id: 'alert_gct_urgent_2024',
    station_id: '42nd St - Grand Central-4-5-6-7-S',
    alert_level: 'warning',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    title: 'FLOOD WARNING: Grand Central Terminal',
    description: '72% chance of platform flooding in next 3 hours due to heavy rainfall forecast. Water accumulation expected in lower concourse areas.',
    source: 'system',
    actions_recommended: [
      'Use alternative routes if possible',
      'Allow extra travel time',
      'Stay on upper level platforms when possible',
      'Monitor MTA alerts for service changes'
    ],
    affected_lines: ['4', '5', '6', '7', 'S']
  },
  {
    id: 'alert_tsq_critical_2024',
    station_id: 'Times Sq - 42nd St-N-Q-R-W-S-1-2-3-7',
    alert_level: 'emergency',
    issued_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    title: 'EMERGENCY: Times Square Flooding Risk',
    description: '85% chance of severe flooding within 25 minutes. Multiple platform levels at risk of water accumulation.',
    source: 'MTA',
    actions_recommended: [
      'AVOID this station immediately',
      'Use Penn Station or Grand Central instead',
      'Check MTA website for service updates'
    ],
    affected_lines: ['N', 'Q', 'R', 'W', 'S', '1', '2', '3', '7']
  }
];