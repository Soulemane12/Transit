'use client';

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SubwayEntrance, FloodRiskAssessment } from '../types';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM, MAP_STYLES } from '../lib/constants';

// Extend the mapboxgl types to include the _element property
interface CustomMarker extends Omit<mapboxgl.Marker, '_element'> {
  _element: HTMLElement;
}

interface FloodMapProps {
  entrances: SubwayEntrance[];
  assessments: FloodRiskAssessment[];
  onStationClick: (assessment: FloodRiskAssessment, entrance?: SubwayEntrance) => void;
  showFEMAFloodZones: boolean;
  showStormwaterFlood: boolean;
  forecastTime: number;
  onUserLocationFound?: (location: { lng: number; lat: number }) => void;
}

export interface MapRef {
  flyTo: (options: { center: [number, number]; zoom: number; essential?: boolean }) => void;
  getMap: () => mapboxgl.Map | null;
}

const FloodMap = forwardRef<MapRef, FloodMapProps>(({
  entrances,
  assessments,
  onStationClick,
  onUserLocationFound,
  showFEMAFloodZones,
  showStormwaterFlood,
  forecastTime
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const exitMarkers = useRef<CustomMarker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    // Initialize map with user's location if available, otherwise use default
    const initialCenter = userLocation || DEFAULT_MAP_CENTER;
    const initialZoom = userLocation ? 13 : DEFAULT_ZOOM;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.STREETS,
      center: initialCenter,
      zoom: initialZoom
    });

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    
    map.current.addControl(geolocate);
    
    // When geolocation is triggered, update the user's location
    geolocate.on('geolocate', (e: GeolocationPosition) => {
      const userLng = e.coords.longitude;
      const userLat = e.coords.latitude;
      const location = { lng: userLng, lat: userLat };
      setUserLocation(location);
      if (onUserLocationFound) {
        onUserLocationFound(location);
      }
      
      // Add or update user location marker
      if (map.current) {
        if (userLocationMarker.current) {
          userLocationMarker.current.setLngLat([userLng, userLat]);
        } else {
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          userLocationMarker.current = new mapboxgl.Marker(el)
            .setLngLat([userLng, userLat])
            .addTo(map.current);
        }
      }
    });

    map.current.on('load', () => {
      addStationsToMap();
      
      // Add navigation control
      map.current?.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add scale control
      map.current?.addControl(new mapboxgl.ScaleControl());
      
      // Add fullscreen control
      map.current?.addControl(new mapboxgl.FullscreenControl());
    });

    // Cleanup function
    return () => {
      // Remove all exit markers
      exitMarkers.current.forEach(marker => marker.remove());
      exitMarkers.current = [];
      
      // Remove the map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (map.current && entrances.length > 0 && assessments.length > 0) {
      addStationsToMap();
      addExitMarkers();
    }
  }, [entrances, assessments, forecastTime]);
  


  const addExitMarkers = useCallback(() => {
    if (!map.current) return;
    
    // Remove any existing exit markers
    exitMarkers.current.forEach(marker => marker.remove());
    exitMarkers.current = [];
    
    // Add exit markers for each exit
    entrances.forEach(entrance => {
      if (entrance.Entrance_Type === 'Exit Only') {
        // Create container for the marker
        const container = document.createElement('div');
        container.className = 'exit-marker-container';
        container.style.position = 'relative';
        container.style.zIndex = '1000'; // High z-index to be above map
        
        // Create the marker element
        const el = document.createElement('div');
        el.className = 'exit-marker';
        el.title = `Exit at ${entrance.East_West_Street} & ${entrance.North_South_Street}`;
        
        // Add click handler to the container
        container.addEventListener('click', (e) => {
          e.stopPropagation();
          const stationKey = `${entrance.Station_Name}-${entrance.Line}`;
          const assessment = assessments.find(a => a.stationId === stationKey);
          if (assessment) {
            onStationClick(assessment, entrance);
          }
        });
        
        // Add hover effect
        container.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
          el.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.8)';
        });
        
        container.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.5)';
        });
        
        container.appendChild(el);
        
        // Create and add the marker to the map
        const marker = new mapboxgl.Marker({
          element: container,
          anchor: 'center'
        })
          .setLngLat([entrance.Entrance_Longitude, entrance.Entrance_Latitude])
          .addTo(map.current!) as unknown as CustomMarker;
          
        // Store the marker for cleanup
        exitMarkers.current.push(marker);
      }
    });
  }, [entrances, assessments, onStationClick]);

  useEffect(() => {
    if (map.current) {
      toggleFEMAFloodZones();
    }
  }, [showFEMAFloodZones]);

  useEffect(() => {
    if (map.current) {
      toggleStormwaterFlood();
    }
  }, [showStormwaterFlood]);

  const addStationsToMap = useCallback(() => {
    if (!map.current) return;
    
    // Remove existing stations layer if it exists
    if (map.current.getLayer('stations-layer')) {
      map.current.removeLayer('stations-layer');
    }
    if (map.current.getSource('stations')) {
      map.current.removeSource('stations');
    }

    // Remove existing layers and sources
    if (map.current.getLayer('stations-layer')) {
      map.current.removeLayer('stations-layer');
    }
    if (map.current.getSource('stations')) {
      map.current.removeSource('stations');
    }

    // Group entrances by station
    const stationGroups: Record<string, { entrances: SubwayEntrance[], assessment: FloodRiskAssessment }> = {};
    
    entrances.forEach(entrance => {
      const stationKey = `${entrance.Station_Name}-${entrance.Line}`;
      if (!stationGroups[stationKey]) {
        const assessment = assessments.find(a => a.stationId === stationKey);
        stationGroups[stationKey] = {
          entrances: [],
                assessment: assessment || {
                  stationId: stationKey,
                  stationName: entrance.Station_Name,
                  floodProbability: 0,
                  riskLevel: 'low',
                  severityScore: 0,
                  contributingFactors: {
                    elevation: 0,
                    distanceToWater: 0,
                    imperviousSurface: 0,
                    femaZone: 'X',
                    drainageCapacity: 0,
                    rainfallIntensity: 0
                  },
                  historicalFloods: [],
                  mitigationSuggestions: []
                }
        };
      }
      stationGroups[stationKey].entrances.push(entrance);
    });

    // Convert to GeoJSON
    const geoJSONData = {
      type: 'FeatureCollection' as const,
      features: Object.values(stationGroups).map(({ entrances, assessment }) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [entrances[0].Entrance_Longitude, entrances[0].Entrance_Latitude]
        },
        properties: {
          stationName: entrances[0].Station_Name,
          line: entrances[0].Line,
          routes: entrances[0].Route1 ? [entrances[0].Route1, entrances[0].Route2, entrances[0].Route3].filter(Boolean) : [],
          totalEntrances: entrances.length,
          floodProbability: assessment.floodProbability,
          riskLevel: assessment.riskLevel,
          severityScore: assessment.severityScore,
          timeToFlood: assessment.timeToFlood,
          assessment: assessment
        }
      }))
    };

    // Add source
    map.current.addSource('stations', {
      type: 'geojson',
      data: geoJSONData
    });

    // Add stations layer with risk-based coloring
    map.current.addLayer({
      id: 'stations-layer',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,
          15, 12,
          20, 18
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'riskLevel'], 'critical'], '#dc2626',
          ['==', ['get', 'riskLevel'], 'high'], '#ea580c',
          ['==', ['get', 'riskLevel'], 'medium'], '#f59e0b',
          '#10b981'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });
    
    // Add layer for station labels
    map.current.addLayer({
      id: 'station-labels',
      type: 'symbol',
      source: 'stations',
      layout: {
        'text-field': ['get', 'stationName'],
        'text-size': 12,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-optional': true
      },
      paint: {
        'text-color': '#1f2937',
        'text-halo-color': 'rgba(255, 255, 255, 0.8)',
        'text-halo-width': 2
      },
      minzoom: 12
    });

    // Add click interaction for stations
    map.current.on('click', 'stations-layer', (e) => {
      if (!e.features || e.features.length === 0 || !map.current) return;
      
      const feature = e.features[0];
      const geometry = feature.geometry as GeoJSON.Point;
      const properties = feature.properties as {stationKey?: string; stationName?: string};
      const stationKey = properties?.stationKey;
      
      if (stationKey && geometry.coordinates) {
        const assessment = assessments.find(a => a.stationId === stationKey);
        if (assessment) {
          // Show all entrances for this station
          const stationEntrances = entrances.filter(e => 
            `${e.Station_Name}-${e.Line}` === stationKey
          );
          
          // If there's only one entrance, select it directly
          if (stationEntrances.length === 1) {
            onStationClick(assessment, stationEntrances[0]);
          } else if (stationEntrances.length > 1) {
            // Show a popup with all entrances
            const popup = new mapboxgl.Popup()
              .setLngLat([
                geometry.coordinates[0],
                geometry.coordinates[1]
              ])
              .setHTML(`
                <div class="station-popup">
                  <h3>${feature.properties?.stationName}</h3>
                  <p>${stationEntrances.length} entrances</p>
                  <div class="entrance-list">
                    ${stationEntrances.map(entrance => `
                      <div class="entrance-item" data-entrance-id="${entrance.ENTRY_ID}">
                        ${entrance.Entrance_Type === 'Exit Only' ? '🚪 ' : '⬆️ '}
                        ${entrance.Entrance_Location || 'Main Entrance'}
                        ${entrance.Entrance_Type === 'Exit Only' ? ' (Exit Only)' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `)
              .addTo(map.current!);
              
            // Add click handler for entrance items
            setTimeout(() => {
              document.querySelectorAll('.entrance-item').forEach(item => {
                item.addEventListener('click', (e) => {
                  const entranceId = (e.currentTarget as HTMLElement)?.dataset.entranceId;
                  const selectedEntrance = stationEntrances.find(e => e.ENTRY_ID === entranceId);
                  if (selectedEntrance) {
                    onStationClick(assessment, selectedEntrance);
                    popup.remove();
                  }
                });
              });
            }, 100);
          }
        }
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'stations-layer', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'stations-layer', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });
  }, [entrances, assessments, onStationClick]);

  const toggleFEMAFloodZones = useCallback(async () => {
    if (!map.current) return;

    if (showFEMAFloodZones) {
      // Add FEMA flood zones (mock data for demo)
      const femaData: GeoJSON.FeatureCollection = {
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
              STATIC_BFE: '12'
            }
          }
        ]
      };

      map.current.addSource('fema-flood-zones', {
        type: 'geojson',
        data: femaData
      });

      map.current.addLayer({
        id: 'fema-flood-zones-layer',
        type: 'fill',
        source: 'fema-flood-zones',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.3,
          'fill-outline-color': '#dc2626'
        }
      });
    } else {
      if (map.current.getLayer('fema-flood-zones-layer')) {
        map.current.removeLayer('fema-flood-zones-layer');
      }
      if (map.current.getSource('fema-flood-zones')) {
        map.current.removeSource('fema-flood-zones');
      }
    }
  }, [showFEMAFloodZones]);

  const toggleStormwaterFlood = useCallback(async () => {
    if (!map.current) return;

    if (showStormwaterFlood) {
      // Add stormwater flood zones (mock data for demo)
      const stormwaterData: GeoJSON.FeatureCollection = {
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
              area: 'Lower Manhattan'
            }
          }
        ]
      };

      map.current.addSource('stormwater-flood-zones', {
        type: 'geojson',
        data: stormwaterData
      });

      map.current.addLayer({
        id: 'stormwater-flood-zones-layer',
        type: 'fill',
        source: 'stormwater-flood-zones',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.4,
          'fill-outline-color': '#2563eb'
        }
      });
    } else {
      if (map.current.getLayer('stormwater-flood-zones-layer')) {
        map.current.removeLayer('stormwater-flood-zones-layer');
      }
      if (map.current.getSource('stormwater-flood-zones')) {
        map.current.removeSource('stormwater-flood-zones');
      }
    }
  }, [showStormwaterFlood]);

  // Expose map methods via ref
  useImperativeHandle(ref, () => ({
    flyTo: (options) => {
      if (map.current) {
        map.current.flyTo({
          duration: 3000,
          ...options
        });
      }
    },
    getMap: () => map.current
  }), []);

  // Cleanup function
  return <div ref={mapContainer} className="map-container" />;
});

export default FloodMap;
