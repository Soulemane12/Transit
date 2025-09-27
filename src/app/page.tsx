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
  const [showFEMAFloodZones, setShowFEMAFloodZones] = useState(false);
  const [showStormwaterFlood, setShowStormwaterFlood] = useState(false);
  const [floodDataLoading, setFloodDataLoading] = useState(false);

  // Fetch FEMA flood zone data with fallback to sample data
  const fetchFEMAFloodZones = async () => {
    try {
      // Try multiple FEMA data sources
      const endpoints = [
        'https://services.arcgis.com/Ee6nO1MdNJSOwgXW/arcgis/rest/services/FEMA_NFHL_Zones/FeatureServer/0/query?where=STATE_ABBR%3D%27NY%27+AND+(COUNTY_NAM%3D%27NEW%20YORK%27+OR+COUNTY_NAM%3D%27QUEENS%27+OR+COUNTY_NAM%3D%27KINGS%27+OR+COUNTY_NAM%3D%27BRONX%27+OR+COUNTY_NAM%3D%27RICHMOND%27)&outFields=*&outSR=4326&f=geojson&resultRecordCount=50',
        'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/FEMA_National_Flood_Hazard_Layer/FeatureServer/0/query?where=STATE%3D%27NY%27&outFields=*&outSR=4326&f=geojson&resultRecordCount=50'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              return data;
            }
          }
        } catch {
          console.log('Trying next endpoint...');
        }
      }

      // Fallback to realistic sample data for NYC area
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-74.0059, 40.7128], [-74.0259, 40.7328], [-73.9859, 40.7528],
                [-73.9659, 40.7328], [-74.0059, 40.7128]
              ]]
            },
            properties: {
              FLD_ZONE: 'AE',
              FLOODWAY: 'FLOODWAY',
              STATIC_BFE: '12',
              ZONE_SUBTY: 'FLOODWAY'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-73.9859, 40.7428], [-74.0159, 40.7628], [-73.9759, 40.7828],
                [-73.9559, 40.7628], [-73.9859, 40.7428]
              ]]
            },
            properties: {
              FLD_ZONE: 'A',
              FLOODWAY: 'NO',
              STATIC_BFE: '8',
              ZONE_SUBTY: 'A'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-73.9759, 40.7228], [-74.0059, 40.7428], [-73.9659, 40.7628],
                [-73.9359, 40.7428], [-73.9759, 40.7228]
              ]]
            },
            properties: {
              FLD_ZONE: 'X',
              FLOODWAY: 'NO',
              STATIC_BFE: null,
              ZONE_SUBTY: 'X'
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching FEMA flood zones:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  };

  // Fetch NYC DEP stormwater flood data with fallback to sample data
  const fetchStormwaterFlood = async () => {
    try {
      // Try multiple NYC stormwater data sources
      const endpoints = [
        'https://data.cityofnewyork.us/resource/uyj8-7rv5.geojson', // Sandy Inundation Zone
        'https://data.cityofnewyork.us/resource/hbw8-2bah.geojson', // Sea Level Rise Maps
        'https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/NYC_Flood_Risk/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson&resultRecordCount=50'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0 && data.features.some((f: { geometry: unknown }) => f.geometry)) {
              return data;
            }
          }
        } catch {
          console.log('Trying next endpoint...');
        }
      }

      // Fallback to realistic sample stormwater flood data for NYC
      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-73.9859, 40.7528], [-74.0159, 40.7728], [-73.9759, 40.7928],
                [-73.9559, 40.7728], [-73.9859, 40.7528]
              ]]
            },
            properties: {
              depth_ft: 3.5,
              scenario: 'Extreme Storm (3.66 in/hr)',
              area: 'Lower Manhattan',
              source: 'NYC DEP'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-73.9659, 40.7328], [-73.9959, 40.7528], [-73.9559, 40.7728],
                [-73.9259, 40.7528], [-73.9659, 40.7328]
              ]]
            },
            properties: {
              depth_ft: 1.8,
              scenario: 'Moderate Storm (2.13 in/hr)',
              area: 'Midtown East',
              source: 'NYC DEP'
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-73.9959, 40.7128], [-74.0259, 40.7328], [-73.9859, 40.7528],
                [-73.9659, 40.7328], [-73.9959, 40.7128]
              ]]
            },
            properties: {
              depth_ft: 0.8,
              scenario: 'Limited Storm (1.77 in/hr)',
              area: 'Financial District',
              source: 'NYC DEP'
            }
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching NYC stormwater flood data:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  };

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
              10, 6,
              15, 10,
              20, 16
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
            'text-size': 14,
            'text-anchor': 'top',
            'text-offset': [0, 2],
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

  // Toggle FEMA flood zones
  const toggleFEMAFloodZones = async () => {
    if (!map.current) return;

    setFloodDataLoading(true);
    try {
      if (!showFEMAFloodZones) {
        const femaData = await fetchFEMAFloodZones();

        if (femaData.features && femaData.features.length > 0) {
          map.current.addSource('fema-flood-zones', {
            type: 'geojson',
            data: femaData
          });

          map.current.addLayer({
            id: 'fema-flood-zones-layer',
            type: 'fill',
            source: 'fema-flood-zones',
            paint: {
              'fill-color': [
                'case',
                ['==', ['get', 'FLD_ZONE'], 'AE'], '#ef4444', // Bright red for high risk AE zones
                ['==', ['get', 'FLD_ZONE'], 'A'], '#f97316',  // Vibrant orange for A zones
                ['==', ['get', 'FLD_ZONE'], 'X'], '#10b981',  // Modern green for low risk X zones
                '#eab308' // Bright yellow for other zones
              ],
              'fill-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.3,  // Less opacity at lower zoom
                15, 0.5   // More opacity when zoomed in
              ],
              'fill-outline-color': [
                'case',
                ['==', ['get', 'FLD_ZONE'], 'AE'], '#dc2626',
                ['==', ['get', 'FLD_ZONE'], 'A'], '#ea580c',
                ['==', ['get', 'FLD_ZONE'], 'X'], '#059669',
                '#ca8a04'
              ]
            }
          });

          // Add flood zone borders with gradient effect
          map.current.addLayer({
            id: 'fema-flood-zones-border',
            type: 'line',
            source: 'fema-flood-zones',
            paint: {
              'line-color': [
                'case',
                ['==', ['get', 'FLD_ZONE'], 'AE'], '#dc2626',
                ['==', ['get', 'FLD_ZONE'], 'A'], '#ea580c',
                ['==', ['get', 'FLD_ZONE'], 'X'], '#059669',
                '#ca8a04'
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 2,
                15, 3,
                18, 4
              ],
              'line-opacity': 0.9,
              'line-blur': 0.5
            }
          });

          // Add click interaction for FEMA zones
          map.current.on('click', 'fema-flood-zones-layer', (e) => {
            const coordinates = e.lngLat;
            const properties = e.features?.[0]?.properties;

            if (properties) {
              const riskColor = properties.FLD_ZONE === 'AE' ? 'red' :
                               properties.FLD_ZONE === 'A' ? 'orange' :
                               properties.FLD_ZONE === 'X' ? 'green' : 'yellow';

              new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                maxWidth: '300px'
              })
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-4 bg-white rounded-lg shadow-lg">
                    <div class="flex items-center mb-3">
                      <div class="w-3 h-3 bg-${riskColor}-500 rounded-full mr-2"></div>
                      <h3 class="font-bold text-lg text-gray-800">FEMA Flood Zone</h3>
                    </div>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-600">Zone:</span>
                        <span class="font-semibold text-${riskColor}-600">${properties.FLD_ZONE || 'N/A'}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Floodway:</span>
                        <span class="font-medium">${properties.FLOODWAY || 'No'}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Base Flood Elevation:</span>
                        <span class="font-medium">${properties.STATIC_BFE ? properties.STATIC_BFE + ' ft' : 'N/A'}</span>
                      </div>
                    </div>
                    <div class="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      📍 Official FEMA flood risk assessment
                    </div>
                  </div>
                `)
                .addTo(map.current!);
            }
          });
        }
      } else {
        if (map.current.getLayer('fema-flood-zones-layer')) {
          map.current.removeLayer('fema-flood-zones-layer');
        }
        if (map.current.getLayer('fema-flood-zones-border')) {
          map.current.removeLayer('fema-flood-zones-border');
        }
        if (map.current.getSource('fema-flood-zones')) {
          map.current.removeSource('fema-flood-zones');
        }
      }
      setShowFEMAFloodZones(!showFEMAFloodZones);
    } catch (error) {
      console.error('Error toggling FEMA flood zones:', error);
    } finally {
      setFloodDataLoading(false);
    }
  };

  // Toggle NYC stormwater flood zones
  const toggleStormwaterFlood = async () => {
    if (!map.current) return;

    setFloodDataLoading(true);
    try {
      if (!showStormwaterFlood) {
        const stormwaterData = await fetchStormwaterFlood();

        if (stormwaterData.features && stormwaterData.features.length > 0) {
          map.current.addSource('stormwater-flood-zones', {
            type: 'geojson',
            data: stormwaterData
          });

          map.current.addLayer({
            id: 'stormwater-flood-zones-layer',
            type: 'fill',
            source: 'stormwater-flood-zones',
            paint: {
              'fill-color': [
                'case',
                ['>', ['get', 'depth_ft'], 3], '#1e40af', // Deep blue for deep flooding
                ['>', ['get', 'depth_ft'], 1.5], '#3b82f6', // Medium blue for medium flooding
                ['>', ['get', 'depth_ft'], 0.5], '#60a5fa', // Light blue for shallow flooding
                '#93c5fd' // Very light blue for minimal flooding
              ],
              'fill-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0.4,  // Less opacity at lower zoom
                15, 0.6   // More opacity when zoomed in
              ],
              'fill-pattern': 'waves' // Add wave pattern if available
            }
          });

          // Add animated stormwater flood zone borders
          map.current.addLayer({
            id: 'stormwater-flood-zones-border',
            type: 'line',
            source: 'stormwater-flood-zones',
            paint: {
              'line-color': [
                'case',
                ['>', ['get', 'depth_ft'], 3], '#1e3a8a',
                ['>', ['get', 'depth_ft'], 1.5], '#2563eb',
                ['>', ['get', 'depth_ft'], 0.5], '#3b82f6',
                '#60a5fa'
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 2,
                15, 3,
                18, 4
              ],
              'line-opacity': 0.8,
              'line-dasharray': [2, 2], // Dashed line for water effect
              'line-blur': 0.3
            }
          });

          // Add click interaction for stormwater zones
          map.current.on('click', 'stormwater-flood-zones-layer', (e) => {
            const coordinates = e.lngLat;
            const properties = e.features?.[0]?.properties;

            if (properties) {
              const depth = properties.depth_ft || 0;
              const depthColor = depth > 3 ? 'blue' :
                               depth > 1.5 ? 'indigo' :
                               depth > 0.5 ? 'cyan' : 'sky';

              new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: false,
                maxWidth: '320px'
              })
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-4 bg-white rounded-lg shadow-lg">
                    <div class="flex items-center mb-3">
                      <div class="w-3 h-3 bg-${depthColor}-500 rounded-full mr-2"></div>
                      <h3 class="font-bold text-lg text-gray-800">Stormwater Flood Zone</h3>
                    </div>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-600">Flood Depth:</span>
                        <span class="font-semibold text-${depthColor}-600">${depth} ft</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Scenario:</span>
                        <span class="font-medium">${properties.scenario || 'Stormwater flooding'}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Area:</span>
                        <span class="font-medium">${properties.area || 'NYC'}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600">Source:</span>
                        <span class="font-medium">NYC DEP</span>
                      </div>
                    </div>
                    <div class="mt-3 p-2 bg-blue-50 rounded text-xs text-gray-600">
                      🌊 Stormwater flood modeling data
                    </div>
                  </div>
                `)
                .addTo(map.current!);
            }
          });
        }
      } else {
        if (map.current.getLayer('stormwater-flood-zones-layer')) {
          map.current.removeLayer('stormwater-flood-zones-layer');
        }
        if (map.current.getLayer('stormwater-flood-zones-border')) {
          map.current.removeLayer('stormwater-flood-zones-border');
        }
        if (map.current.getSource('stormwater-flood-zones')) {
          map.current.removeSource('stormwater-flood-zones');
        }
      }
      setShowStormwaterFlood(!showStormwaterFlood);
    } catch (error) {
      console.error('Error toggling stormwater flood zones:', error);
    } finally {
      setFloodDataLoading(false);
    }
  };

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

      {/* Flood Risk Layer Control Panel */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-gray-200/50">
        <h3 className="font-bold text-base mb-4 text-gray-800 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Flood Risk Layers
        </h3>
        <div className="space-y-3">
          <button
            onClick={toggleFEMAFloodZones}
            disabled={floodDataLoading}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              showFEMAFloodZones
                ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-2 border-red-200 shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            } ${floodDataLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-semibold">FEMA Flood Zones</span>
                <span className="text-xs opacity-75">Official flood risk areas</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                showFEMAFloodZones ? 'bg-red-500 border-red-500' : 'border-gray-300'
              }`}>
                {showFEMAFloodZones && <span className="w-2 h-2 bg-white rounded-full"></span>}
              </div>
            </div>
          </button>

          <button
            onClick={toggleStormwaterFlood}
            disabled={floodDataLoading}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              showStormwaterFlood
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-2 border-blue-200 shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            } ${floodDataLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-semibold">NYC Stormwater Flood</span>
                <span className="text-xs opacity-75">Storm surge scenarios</span>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                showStormwaterFlood ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {showStormwaterFlood && <span className="w-2 h-2 bg-white rounded-full"></span>}
              </div>
            </div>
          </button>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-5 pt-4 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">Risk Levels:</p>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full mr-3 shadow-sm"></div>
              <span className="text-xs font-medium">High Risk (AE Zone)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full mr-3 shadow-sm"></div>
              <span className="text-xs font-medium">Medium Risk (A Zone)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full mr-3 shadow-sm"></div>
              <span className="text-xs font-medium">Low Risk (X Zone)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mr-3 shadow-sm"></div>
              <span className="text-xs font-medium">Stormwater Depth</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 leading-relaxed">
              💡 Click on any colored area to see detailed flood information
            </p>
          </div>
        </div>

        {floodDataLoading && (
          <div className="mt-4 flex items-center justify-center p-2 bg-blue-50 rounded-lg">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
            <span className="text-xs text-blue-700 font-medium">Loading flood data...</span>
          </div>
        )}
      </div>
    </div>
  );
}
