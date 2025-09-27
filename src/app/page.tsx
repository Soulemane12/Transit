'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface SubwayEntrance {
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

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [subwayEntrances, setSubwayEntrances] = useState<SubwayEntrance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch MTA GTFS subway entrance data
  const fetchSubwayEntrances = async () => {
    try {
      const response = await fetch('https://data.ny.gov/api/views/i9wp-a4ja/rows.csv?accessType=DOWNLOAD');
      const csvText = await response.text();
      
      // Parse CSV data
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const entrances: SubwayEntrance[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          if (values.length >= headers.length) {
            const entrance: Record<string, string> = {};
            headers.forEach((header, index) => {
              entrance[header] = values[index];
            });
            
            // Convert coordinates to numbers and filter valid entries
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
      
      setSubwayEntrances(entrances);
      setLoading(false);
      return entrances;
    } catch (error) {
      console.error('Error fetching subway entrances:', error);
      setLoading(false);
      return [];
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // You'll need to set your Mapbox token in .env.local
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-73.9851, 40.7589], // NYC center
      zoom: 11
    });

    // Load subway entrances when map is ready
    map.current.on('load', async () => {
      const entrances = await fetchSubwayEntrances();
      
      if (entrances.length > 0 && map.current) {
        // Group entrances by station for better visualization
        const stationGroups: Record<string, SubwayEntrance[]> = {};
        entrances.forEach(entrance => {
          const stationKey = `${entrance.Station_Name}-${entrance.Line}`;
          if (!stationGroups[stationKey]) {
            stationGroups[stationKey] = [];
          }
          stationGroups[stationKey].push(entrance);
        });

        // Convert to GeoJSON format with station grouping
        const geoJSONData = {
          type: 'FeatureCollection' as const,
          features: entrances.map((entrance, index) => ({
            type: 'Feature' as const,
            id: index,
            geometry: {
              type: 'Point' as const,
              coordinates: [entrance.Entrance_Longitude, entrance.Entrance_Latitude]
            },
            properties: {
              stationName: entrance.Station_Name,
              line: entrance.Line,
              stationKey: `${entrance.Station_Name}-${entrance.Line}`,
              routes: [
                entrance.Route1, entrance.Route2, entrance.Route3, entrance.Route4, entrance.Route5,
                entrance.Route6, entrance.Route7, entrance.Route8, entrance.Route9, entrance.Route10, entrance.Route11
              ].filter(route => route && route.trim() !== ''),
              entranceType: entrance.Entrance_Type,
              ada: entrance.ADA === 'Yes',
              vending: entrance.Vending === 'Yes',
              exitOnly: entrance.Exit_Only === 'Yes',
              entry: entrance.Entry === 'Yes',
              staffing: entrance.Staffing === 'Yes',
              northSouthStreet: entrance.North_South_Street,
              eastWestStreet: entrance.East_West_Street,
              corner: entrance.Corner,
              totalEntrances: stationGroups[`${entrance.Station_Name}-${entrance.Line}`].length,
              stationEntrances: stationGroups[`${entrance.Station_Name}-${entrance.Line}`]
            }
          }))
        };

        // Add subway entrances source
        map.current!.addSource('subway-entrances', {
          type: 'geojson',
          data: geoJSONData
        });

        // Add subway entrances layer with clustering
        map.current!.addLayer({
          id: 'subway-entrances-layer',
          type: 'circle',
          source: 'subway-entrances',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 3,
              15, 5,
              20, 8
            ],
            'circle-color': [
              'case',
              ['>', ['get', 'totalEntrances'], 5], '#dc2626', // Red for stations with many entrances
              ['>', ['get', 'totalEntrances'], 2], '#ea580c', // Orange for medium entrances
              '#1e40af' // Blue for single/few entrances
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.8
          }
        });

        // Add station labels
        map.current!.addLayer({
          id: 'station-labels',
          type: 'symbol',
          source: 'subway-entrances',
          layout: {
            'text-field': ['concat', ['get', 'stationName'], '\n', ['get', 'totalEntrances'], ' entrances'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'text-anchor': 'top',
            'text-offset': [0, 1.5],
            'text-allow-overlap': false,
            'text-ignore-placement': false
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          },
          filter: ['==', ['get', 'totalEntrances'], ['get', 'totalEntrances']] // Show labels for all features
        });

        // Add click interaction for subway entrances
        map.current!.on('click', 'subway-entrances-layer', (e) => {
          const coordinates = e.lngLat;
          const properties = e.features?.[0]?.properties;

          if (properties) {
            // Get all entrances for this station
            const stationEntrances = properties.stationEntrances || [properties];
            
            const entrancesList = stationEntrances.map((entrance: SubwayEntrance, index: number) => `
              <div class="border-b border-gray-200 py-2 ${index === stationEntrances.length - 1 ? 'border-b-0' : ''}">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium">${entrance.Entrance_Type || 'Entrance'}</p>
                    <p class="text-xs text-gray-500">${entrance.North_South_Street} & ${entrance.East_West_Street}</p>
                  </div>
                  <div class="text-right">
                    ${entrance.ADA === 'Yes' ? '<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ADA</span>' : ''}
                    ${entrance.Exit_Only === 'Yes' ? '<span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded ml-1">Exit Only</span>' : ''}
                    ${entrance.Vending === 'Yes' ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-1">Vending</span>' : ''}
                  </div>
                </div>
              </div>
            `).join('');

            new mapboxgl.Popup({ maxWidth: '400px' })
              .setLngLat(coordinates)
              .setHTML(`
                <div class="p-3">
                  <div class="mb-3">
                    <h3 class="font-bold text-lg">${properties.stationName}</h3>
                    <p class="text-sm text-gray-600">${properties.line}</p>
                    <p class="text-sm"><strong>Routes:</strong> ${properties.routes.join(', ')}</p>
                    <p class="text-sm text-blue-600 font-medium">${properties.totalEntrances} entrances total</p>
                  </div>
                  <div class="max-h-60 overflow-y-auto">
                    <h4 class="font-semibold text-sm mb-2 text-gray-700">All Entrances:</h4>
                    ${entrancesList}
                  </div>
                </div>
              `)
              .addTo(map.current!);
          }
        });

        // Change cursor on hover
        map.current!.on('mouseenter', 'subway-entrances-layer', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current!.on('mouseleave', 'subway-entrances-layer', () => {
          map.current!.getCanvas().style.cursor = '';
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="h-screen w-full relative">
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm text-gray-600">Loading subway entrances...</p>
        </div>
      )}
      
      {/* Info panel */}
      {!loading && subwayEntrances.length > 0 && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <h2 className="font-bold text-lg">NYC Subway Stations</h2>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{new Set(subwayEntrances.map(e => `${e.Station_Name}-${e.Line}`)).size}</span> stations
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{subwayEntrances.length.toLocaleString()}</span> total entrances
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{subwayEntrances.filter(e => e.ADA === 'Yes').length}</span> ADA accessible
            </p>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>5+ entrances</p>
            <p><span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>2-4 entrances</p>
            <p><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>1 entrance</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">Click on markers for station details</p>
        </div>
      )}
    </div>
  );
}
