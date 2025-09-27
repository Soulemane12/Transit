export interface SubwayEntrance {
  objectid: number;
  name: string;
  the_geom: string;
  url: string;
  entrance_type: string;
  entry: string;
  exit_only: string;
  vending: string;
  staffing: string;
  staff_hours: string;
  ada: string;
  ada_notes: string;
  free_crossover: string;
  north_south_street: string;
  east_west_street: string;
  corner: string;
  latitude: number;
  longitude: number;
  station_name: string;
  line: string;
  division: string;
  routes: string;
  entrance_latitude: number;
  entrance_longitude: number;
}

export async function fetchSubwayEntrances(): Promise<SubwayEntrance[]> {
  try {
    // Try multiple possible API endpoints for MTA Subway Entrances
    const endpoints = [
      'https://data.cityofnewyork.us/resource/arq3-7z49.json?$limit=50000',
      'https://data.cityofnewyork.us/resource/arq3-7z49.json',
      'https://data.cityofnewyork.us/resource/arq3-7z49.json?$limit=1000',
      // Alternative dataset IDs to try
      'https://data.cityofnewyork.us/resource/arq3-7z49.json?$limit=50000',
      'https://data.cityofnewyork.us/resource/arq3-7z49.json?$limit=50000'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data: SubwayEntrance[] = await response.json();
          console.log(`Successfully fetched ${data.length} subway entrances`);
          return data.filter(entrance => 
            entrance.entrance_latitude && 
            entrance.entrance_longitude &&
            entrance.entrance_latitude !== 0 &&
            entrance.entrance_longitude !== 0
          );
        } else {
          console.warn(`Endpoint ${endpoint} returned ${response.status}`);
        }
      } catch (endpointError) {
        console.warn(`Failed to fetch from ${endpoint}:`, endpointError);
      }
    }

    // If all endpoints fail, return sample data for demonstration
    console.warn('All API endpoints failed, returning sample data');
    return getSampleSubwayEntrances();
    
  } catch (error) {
    console.error('Error fetching subway entrances:', error);
    return getSampleSubwayEntrances();
  }
}

function getSampleSubwayEntrances(): SubwayEntrance[] {
  // Sample subway entrances for demonstration when API is unavailable
  return [
    {
      objectid: 1,
      name: "Times Sq-42 St",
      the_geom: "",
      url: "",
      entrance_type: "Stair",
      entry: "YES",
      exit_only: "NO",
      vending: "YES",
      staffing: "Full Time",
      staff_hours: "24/7",
      ada: "YES",
      ada_notes: "ADA accessible",
      free_crossover: "YES",
      north_south_street: "Broadway",
      east_west_street: "42nd St",
      corner: "NW",
      latitude: 40.7589,
      longitude: -73.9851,
      station_name: "Times Sq-42 St",
      line: "1,2,3,7,N,Q,R,W,S",
      division: "IRT",
      routes: "1,2,3,7,N,Q,R,W,S",
      entrance_latitude: 40.7589,
      entrance_longitude: -73.9851
    },
    {
      objectid: 2,
      name: "Grand Central-42 St",
      the_geom: "",
      url: "",
      entrance_type: "Stair",
      entry: "YES",
      exit_only: "NO",
      vending: "YES",
      staffing: "Full Time",
      staff_hours: "24/7",
      ada: "YES",
      ada_notes: "ADA accessible",
      free_crossover: "YES",
      north_south_street: "Lexington Ave",
      east_west_street: "42nd St",
      corner: "SE",
      latitude: 40.7518,
      longitude: -73.9769,
      station_name: "Grand Central-42 St",
      line: "4,5,6,7,S",
      division: "IRT",
      routes: "4,5,6,7,S",
      entrance_latitude: 40.7518,
      entrance_longitude: -73.9769
    },
    {
      objectid: 3,
      name: "Union Sq-14 St",
      the_geom: "",
      url: "",
      entrance_type: "Stair",
      entry: "YES",
      exit_only: "NO",
      vending: "YES",
      staffing: "Full Time",
      staff_hours: "24/7",
      ada: "YES",
      ada_notes: "ADA accessible",
      free_crossover: "YES",
      north_south_street: "Broadway",
      east_west_street: "14th St",
      corner: "SW",
      latitude: 40.7357,
      longitude: -73.9910,
      station_name: "Union Sq-14 St",
      line: "4,5,6,L,N,Q,R,W",
      division: "IRT",
      routes: "4,5,6,L,N,Q,R,W",
      entrance_latitude: 40.7357,
      entrance_longitude: -73.9910
    },
    {
      objectid: 4,
      name: "Penn Station-34 St",
      the_geom: "",
      url: "",
      entrance_type: "Stair",
      entry: "YES",
      exit_only: "NO",
      vending: "YES",
      staffing: "Full Time",
      staff_hours: "24/7",
      ada: "YES",
      ada_notes: "ADA accessible",
      free_crossover: "YES",
      north_south_street: "7th Ave",
      east_west_street: "34th St",
      corner: "SE",
      latitude: 40.7506,
      longitude: -73.9934,
      station_name: "Penn Station-34 St",
      line: "1,2,3,A,C,E",
      division: "IRT",
      routes: "1,2,3,A,C,E",
      entrance_latitude: 40.7506,
      entrance_longitude: -73.9934
    },
    {
      objectid: 5,
      name: "Brooklyn Bridge-City Hall",
      the_geom: "",
      url: "",
      entrance_type: "Stair",
      entry: "YES",
      exit_only: "NO",
      vending: "YES",
      staffing: "Full Time",
      staff_hours: "24/7",
      ada: "YES",
      ada_notes: "ADA accessible",
      free_crossover: "YES",
      north_south_street: "Centre St",
      east_west_street: "Chambers St",
      corner: "NW",
      latitude: 40.7133,
      longitude: -74.0089,
      station_name: "Brooklyn Bridge-City Hall",
      line: "4,5,6",
      division: "IRT",
      routes: "4,5,6",
      entrance_latitude: 40.7133,
      entrance_longitude: -74.0089
    }
  ];
}

export function convertToGeoJSON(entrances: SubwayEntrance[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: entrances.map(entrance => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [entrance.entrance_longitude, entrance.entrance_latitude]
      } as GeoJSON.Point,
      properties: {
        id: entrance.objectid,
        name: entrance.name || 'Unnamed Entrance',
        stationName: entrance.station_name,
        entranceType: entrance.entrance_type,
        entry: entrance.entry,
        exitOnly: entrance.exit_only,
        vending: entrance.vending,
        staffing: entrance.staffing,
        staffHours: entrance.staff_hours,
        ada: entrance.ada,
        adaNotes: entrance.ada_notes,
        routes: entrance.routes,
        line: entrance.line,
        division: entrance.division,
        northSouthStreet: entrance.north_south_street,
        eastWestStreet: entrance.east_west_street,
        corner: entrance.corner,
        url: entrance.url
      }
    } as GeoJSON.Feature<GeoJSON.Point>))
  };
}
