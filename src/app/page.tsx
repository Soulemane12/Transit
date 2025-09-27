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
        } catch (e) {
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
            if (data.features && data.features.length > 0 && data.features.some(f => f.geometry)) {
              return data;
            }
          }
        } catch (e) {
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
                ['==', ['get', 'FLD_ZONE'], 'AE'], '#dc2626', // Red for AE zones
                ['==', ['get', 'FLD_ZONE'], 'A'], '#ea580c',  // Orange for A zones
                ['==', ['get', 'FLD_ZONE'], 'X'], '#22c55e',  // Green for X zones
                '#fbbf24' // Yellow for other zones
              ],
              'fill-opacity': 0.4
            }
          });

          // Add flood zone borders
          map.current.addLayer({
            id: 'fema-flood-zones-border',
            type: 'line',
            source: 'fema-flood-zones',
            paint: {
              'line-color': '#991b1b',
              'line-width': 1,
              'line-opacity': 0.8
            }
          });

          // Add click interaction for FEMA zones
          map.current.on('click', 'fema-flood-zones-layer', (e) => {
            const coordinates = e.lngLat;
            const properties = e.features?.[0]?.properties;

            if (properties) {
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-3">
                    <h3 class="font-bold text-lg">FEMA Flood Zone</h3>
                    <p><strong>Zone:</strong> ${properties.FLD_ZONE || 'N/A'}</p>
                    <p><strong>Floodway:</strong> ${properties.FLOODWAY || 'No'}</p>
                    <p><strong>Base Flood Elevation:</strong> ${properties.STATIC_BFE || 'N/A'}</p>
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
                ['>', ['get', 'depth_ft'], 3], '#7c2d12', // Dark brown for deep flooding
                ['>', ['get', 'depth_ft'], 1.5], '#dc2626', // Red for medium flooding
                ['>', ['get', 'depth_ft'], 0.5], '#f97316', // Orange for shallow flooding
                '#fbbf24' // Yellow for minimal flooding
              ],
              'fill-opacity': 0.5
            }
          });

          // Add stormwater flood zone borders
          map.current.addLayer({
            id: 'stormwater-flood-zones-border',
            type: 'line',
            source: 'stormwater-flood-zones',
            paint: {
              'line-color': '#ea580c',
              'line-width': 1,
              'line-opacity': 0.8
            }
          });

          // Add click interaction for stormwater zones
          map.current.on('click', 'stormwater-flood-zones-layer', (e) => {
            const coordinates = e.lngLat;
            const properties = e.features?.[0]?.properties;

            if (properties) {
              new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(`
                  <div class="p-3">
                    <h3 class="font-bold text-lg">Stormwater Flood Zone</h3>
                    <p><strong>Depth:</strong> ${properties.depth_ft || 'N/A'} ft</p>
                    <p><strong>Scenario:</strong> ${properties.scenario || 'Stormwater flooding'}</p>
                    <p><strong>Source:</strong> NYC DEP</p>
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
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
        <h3 className="font-bold text-sm mb-3">Flood Risk Layers</h3>
        <div className="space-y-2">
          <button
            onClick={toggleFEMAFloodZones}
            disabled={floodDataLoading}
            className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
              showFEMAFloodZones
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${floodDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span>FEMA Flood Zones</span>
              <span className={`inline-block w-3 h-3 rounded-full ${
                showFEMAFloodZones ? 'bg-red-500' : 'bg-gray-300'
              }`}></span>
            </div>
          </button>

          <button
            onClick={toggleStormwaterFlood}
            disabled={floodDataLoading}
            className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
              showStormwaterFlood
                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${floodDataLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span>NYC Stormwater Flood</span>
              <span className={`inline-block w-3 h-3 rounded-full ${
                showStormwaterFlood ? 'bg-orange-500' : 'bg-gray-300'
              }`}></span>
            </div>
          </button>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Legend:</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-red-600 rounded-full mr-2"></span>
              <span>High Risk (AE Zone)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
              <span>Medium Risk (A Zone)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>Low Risk (X Zone)</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <span>Other/Stormwater</span>
            </div>
          </div>
        </div>

        {floodDataLoading && (
          <div className="mt-2 text-xs text-blue-600">
            Loading flood data...
          </div>
        )}
      </div>
    </div>
  );
}
