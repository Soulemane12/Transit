'use client';

import { useEffect, useRef, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SubwayEntrance, FloodRiskAssessment, FloodAlert } from '../types';
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
  enableUserLocation?: boolean;
  autoLocateUser?: boolean;
  floodAlerts?: FloodAlert[];
  showFloodAlerts?: boolean;
}

export interface MapRef {
  flyTo: (options: { center: [number, number]; zoom: number; essential?: boolean }) => void;
  getMap: () => mapboxgl.Map | null;
  getUserLocation: () => { lng: number; lat: number } | null;
}

const FloodMap = forwardRef<MapRef, FloodMapProps>(({
  entrances,
  assessments,
  onStationClick,
  onUserLocationFound,
  showFEMAFloodZones,
  showStormwaterFlood,
  forecastTime,
  enableUserLocation = true,
  autoLocateUser = false,
  floodAlerts = [],
  showFloodAlerts = true
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const exitMarkers = useRef<CustomMarker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const alertMarkers = useRef<CustomMarker[]>([]);
  const currentPopup = useRef<mapboxgl.Popup | null>(null);
  const [selectedStation, setSelectedStation] = useState<FloodRiskAssessment | null>(null);
  const [, setHoveredStation] = useState<string | null>(null);
  const [, setActiveAlerts] = useState<FloodAlert[]>([]);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);

  // Create detailed popup content for stations
  const createStationPopupContent = (assessment: FloodRiskAssessment, stationEntrances: SubwayEntrance[]) => {
    const riskColor = {
      'low': '#16a34a',
      'medium': '#d97706',
      'high': '#ea580c',
      'critical': '#dc2626'
    }[assessment.riskLevel];

    const nearestEntrance = stationEntrances[0];
    const routes = [nearestEntrance.Route1, nearestEntrance.Route2, nearestEntrance.Route3, nearestEntrance.Route4, nearestEntrance.Route5]
      .filter(route => route && route.trim() !== '')
      .join(' • ');

    return `
      <div style="min-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="border-bottom: 2px solid ${riskColor}; padding-bottom: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">${assessment.stationName}</h3>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${routes}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: ${riskColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase;">
              ${assessment.riskLevel} Risk
            </span>
            <span style="font-size: 13px; font-weight: 600;">${Math.round(assessment.floodProbability)}% Flood Risk</span>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">Risk Factors:</div>
          <div style="font-size: 12px; color: #555; line-height: 1.4;">
            • Elevation: ${Math.round(assessment.contributingFactors.elevation)}ft above sea level<br>
            • Distance to water: ${Math.round(assessment.contributingFactors.distanceToWater)}m<br>
            • FEMA Zone: ${assessment.contributingFactors.femaZone}<br>
            • Current rainfall: ${assessment.contributingFactors.rainfallIntensity?.toFixed(1) || '0.0'}" per hour
          </div>
        </div>

        ${assessment.timeToFlood ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 8px; margin-bottom: 12px;">
            <div style="font-size: 12px; font-weight: 500; color: #d97706;">⚠️ Estimated time to flood: ${Math.round(assessment.timeToFlood)} minutes</div>
          </div>
        ` : ''}

        <div style="margin-bottom: 12px;">
          <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px;">Entrances (${stationEntrances.length}):</div>
          <div style="max-height: 80px; overflow-y: auto; font-size: 11px; color: #666;">
            ${stationEntrances.slice(0, 3).map(entrance => `
              <div style="margin-bottom: 2px;">• ${entrance.Entrance_Type} - ${entrance.Corner || 'Station entrance'}</div>
            `).join('')}
            ${stationEntrances.length > 3 ? `<div style="font-style: italic;">+${stationEntrances.length - 3} more...</div>` : ''}
          </div>
        </div>

        <div style="text-align: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #888;">Click station for detailed info • Click exits for specific entrance data</div>
        </div>
      </div>
    `;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.STREETS,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_ZOOM
    });

    // Add map controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl());
    map.current.addControl(new mapboxgl.FullscreenControl());

    // Add geolocate control if user location is enabled
    if (enableUserLocation) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
        fitBoundsOptions: {
          maxZoom: 15
        }
      });

      map.current.addControl(geolocate, 'top-right');

      const onGeolocate = (e: GeolocationPosition) => {
        const location = {
          lng: e.coords.longitude,
          lat: e.coords.latitude
        };

        setUserLocation(location);

        if (onUserLocationFound) {
          onUserLocationFound(location);
        }

        // Update or create user location marker with custom styling
        if (map.current) {
          if (userLocationMarker.current) {
            userLocationMarker.current.setLngLat([location.lng, location.lat]);
          } else {
            const el = document.createElement('div');
            el.className = 'user-location-marker';
            el.style.cssText = `
              width: 20px;
              height: 20px;
              background: #007cbf;
              border: 3px solid #fff;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(0, 124, 191, 0.5);
              cursor: pointer;
            `;

            userLocationMarker.current = new mapboxgl.Marker(el)
              .setLngLat([location.lng, location.lat])
              .addTo(map.current);

            // Add click handler to user location marker
            el.addEventListener('click', () => {
              if (map.current) {
                map.current.flyTo({
                  center: [location.lng, location.lat],
                  zoom: 16,
                  duration: 2000
                });
              }
            });
          }
        }
      };

      const onError = (error: GeolocationPositionError) => {
        console.warn('Geolocation error:', error.message);
      };

      geolocate.on('geolocate', onGeolocate);
      geolocate.on('error', onError);

      // Auto-locate user if requested
      if (autoLocateUser) {
        map.current.on('load', () => {
          setTimeout(() => {
            geolocate.trigger();
          }, 1000);
        });
      }

      // Cleanup function
      return () => {
        geolocate.off('geolocate', onGeolocate);
        geolocate.off('error', onError);
      };
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onUserLocationFound, enableUserLocation, autoLocateUser]);

  // Add stations to map
  const addStationsToMap = useCallback(() => {
    if (!map.current || entrances.length === 0 || assessments.length === 0) return;
    
    // Remove existing layers and sources
    if (map.current.getLayer('stations-layer')) {
      map.current.removeLayer('stations-layer');
    }
    if (map.current.getSource('stations')) {
      map.current.removeSource('stations');
    }

    // Group entrances by station
    const stationGroups = entrances.reduce<Record<string, { entrances: SubwayEntrance[]; assessment?: FloodRiskAssessment }>>((acc, entrance) => {
      const stationKey = `${entrance.Station_Name}-${entrance.Line}`;
      if (!acc[stationKey]) {
        acc[stationKey] = {
          entrances: [],
          assessment: assessments.find(a => a.stationId === stationKey)
        };
      }
      acc[stationKey].entrances.push(entrance);
      return acc;
    }, {});

    // Create GeoJSON data source
    const geoJsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: Object.entries(stationGroups).map(([key, { entrances, assessment }]) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [
            parseFloat(entrances[0].Entrance_Longitude.toString()),
            parseFloat(entrances[0].Entrance_Latitude.toString())
          ]
        },
        properties: {
          id: key,
          name: entrances[0].Station_Name,
          line: entrances[0].Line,
          floodProbability: assessment?.floodProbability || 0,
          riskLevel: assessment?.riskLevel || 'low',
          entrances: entrances.map(e => ({
            id: e.ENTRY_ID,
            name: e.Entrance_Type,
            coordinates: [
              parseFloat(e.Entrance_Longitude.toString()),
              parseFloat(e.Entrance_Latitude.toString())
            ]
          }))
        }
      }))
    };

    // Add source and layer to map
    map.current.addSource('stations', {
      type: 'geojson',
      data: geoJsonData
    });

    map.current.addLayer({
      id: 'stations-layer',
      type: 'circle',
      source: 'stations',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'floodProbability'],
          0, 6,
          100, 12
        ],
        'circle-color': [
          'match',
          ['get', 'riskLevel'],
          'critical', '#dc2626',
          'high', '#ea580c',
          'medium', '#d97706',
          '#16a34a' // default color for low
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-opacity': 0.8
      }
    });

    // Add click handler for stations
    const onStationClickHandler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0 || !map.current) return;

      const feature = e.features[0];
      const properties = feature.properties;

      if (!properties) return;

      const stationAssessment = assessments.find(a => a.stationId === properties.id);
      if (stationAssessment) {
        setSelectedStation(stationAssessment);

        // Find all entrances for this station
        const stationEntrances = entrances.filter(
          entrance => `${entrance.Station_Name}-${entrance.Line}` === stationAssessment.stationId
        );

        // Close existing popup
        if (currentPopup.current) {
          currentPopup.current.remove();
        }

        // Create and show detailed popup
        const popupContent = createStationPopupContent(stationAssessment, stationEntrances);
        const coordinates: [number, number] = feature.geometry.type === 'Point' ?
          [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] : [0, 0];

        currentPopup.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '320px',
          className: 'station-popup'
        })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);

        // Fly to station
        map.current.flyTo({
          center: coordinates,
          zoom: Math.max(map.current.getZoom(), 14),
          duration: 1500
        });

        onStationClick(stationAssessment);
      }
    };

    // Add event listeners
    map.current.on('click', 'stations-layer', onStationClickHandler);
    
    // Add hover effects and cursor changes
    const onMouseEnter = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features.length > 0) {
          const properties = e.features[0].properties;
          if (properties) {
            setHoveredStation(properties.id);

            // Add visual feedback - increase circle size and add glow
            map.current.setPaintProperty('stations-layer', 'circle-stroke-width', [
              'case',
              ['==', ['get', 'id'], properties.id],
              4,
              2
            ]);

            map.current.setPaintProperty('stations-layer', 'circle-radius', [
              'case',
              ['==', ['get', 'id'], properties.id],
              [
                'interpolate',
                ['linear'],
                ['get', 'floodProbability'],
                0, 8,
                100, 16
              ],
              [
                'interpolate',
                ['linear'],
                ['get', 'floodProbability'],
                0, 6,
                100, 12
              ]
            ]);
          }
        }
      }
    };

    const onMouseLeave = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
        setHoveredStation(null);

        // Reset visual feedback
        map.current.setPaintProperty('stations-layer', 'circle-stroke-width', 2);
        map.current.setPaintProperty('stations-layer', 'circle-radius', [
          'interpolate',
          ['linear'],
          ['get', 'floodProbability'],
          0, 6,
          100, 12
        ]);
      }
    };

    map.current.on('mouseenter', 'stations-layer', onMouseEnter);
    map.current.on('mouseleave', 'stations-layer', onMouseLeave);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.off('click', 'stations-layer', onStationClickHandler);
        map.current.off('mouseenter', 'stations-layer', onMouseEnter);
        map.current.off('mouseleave', 'stations-layer', onMouseLeave);
      }
    };
  }, [entrances, assessments, onStationClick]);

  // Create entrance popup content
  const createEntrancePopupContent = useCallback((entrance: SubwayEntrance, assessment: FloodRiskAssessment) => {
    const riskColor = {
      'low': '#16a34a',
      'medium': '#d97706',
      'high': '#ea580c',
      'critical': '#dc2626'
    }[assessment.riskLevel];

    const adaStatus = entrance.ADA === 'Yes' ? '♿ ADA Accessible' : '❌ Not ADA Accessible';
    const adaColor = entrance.ADA === 'Yes' ? '#16a34a' : '#dc2626';

    return `
      <div style="min-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="border-bottom: 2px solid ${riskColor}; padding-bottom: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${entrance.Station_Name}</h3>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${entrance.Entrance_Type}</div>
          <div style="font-size: 11px; color: ${adaColor}; font-weight: 500;">${adaStatus}</div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #555; line-height: 1.4;">
            <strong>Location:</strong> ${entrance.Corner || 'Station entrance'}<br>
            ${entrance.North_South_Street ? `<strong>Address:</strong> ${entrance.North_South_Street}${entrance.East_West_Street ? ` & ${entrance.East_West_Street}` : ''}<br>` : ''}
            <strong>Access:</strong> ${entrance.Entry === 'Yes' ? 'Entry' : ''}${entrance.Entry === 'Yes' && entrance.Exit_Only === 'No' ? ' & Exit' : entrance.Exit_Only === 'Yes' ? 'Exit Only' : ''}<br>
            <strong>Services:</strong> ${[
              entrance.Vending === 'Yes' ? 'MetroCard/OMNY' : null,
              entrance.Staffing !== 'None' ? `Staffed (${entrance.Staffing})` : 'Unstaffed'
            ].filter(Boolean).join(', ')}
          </div>
        </div>

        ${entrance.Staff_Hours && entrance.Staffing !== 'None' ? `
          <div style="background: #f3f4f6; border-radius: 6px; padding: 6px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 500; color: #374151;">Staff Hours: ${entrance.Staff_Hours}</div>
          </div>
        ` : ''}

        ${entrance.ADA_Notes ? `
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 6px; margin-bottom: 12px;">
            <div style="font-size: 11px; color: #0c4a6e;"><strong>Accessibility:</strong> ${entrance.ADA_Notes}</div>
          </div>
        ` : ''}

        <div style="background: ${riskColor}20; border: 1px solid ${riskColor}; border-radius: 6px; padding: 6px; margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: 500; color: ${riskColor};">Station Flood Risk: ${Math.round(assessment.floodProbability)}% (${assessment.riskLevel.toUpperCase()})</div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #888;">
          Entry ID: ${entrance.ENTRY_ID}
        </div>
      </div>
    `;
  }, []);

  // Add exit markers for the selected station
  const addExitMarkers = useCallback(() => {
    if (!map.current || !selectedStation) return;

    // Clear existing markers
    exitMarkers.current.forEach(marker => marker.remove());
    exitMarkers.current = [];

    // Find entrances for the selected station
    const stationEntrances = entrances.filter(
      e => `${e.Station_Name}-${e.Line}` === selectedStation.stationId
    );

    // Add markers for each entrance with enhanced styling
    stationEntrances.forEach((entrance, index) => {
      const container = document.createElement('div');
      container.className = 'exit-marker';

      // Style the exit marker based on entrance type and accessibility
      const isADA = entrance.ADA === 'Yes';
      const isExitOnly = entrance.Exit_Only === 'Yes';

      container.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #fff;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        background: ${isADA ? '#10b981' : isExitOnly ? '#f59e0b' : '#3b82f6'};
        position: relative;
      `;

      // Add number label for multiple entrances
      if (stationEntrances.length > 1) {
        const label = document.createElement('div');
        label.style.cssText = `
          position: absolute;
          top: -2px;
          left: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: ${isADA ? '#10b981' : isExitOnly ? '#f59e0b' : '#3b82f6'};
          color: white;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        `;
        label.textContent = (index + 1).toString();
        container.appendChild(label);
      }

      const marker = new mapboxgl.Marker({
        element: container,
        anchor: 'center'
      })
        .setLngLat([
          parseFloat(entrance.Entrance_Longitude.toString()),
          parseFloat(entrance.Entrance_Latitude.toString())
        ])
        .addTo(map.current!);

      // Add hover effects
      container.addEventListener('mouseenter', () => {
        container.style.transform = 'scale(1.2)';
        container.style.zIndex = '1000';
      });

      container.addEventListener('mouseleave', () => {
        container.style.transform = 'scale(1)';
        container.style.zIndex = 'auto';
      });

      // Add click handler with popup
      container.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close existing popup
        if (currentPopup.current) {
          currentPopup.current.remove();
        }

        // Create entrance popup
        const popupContent = createEntrancePopupContent(entrance, selectedStation);

        currentPopup.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '280px',
          className: 'entrance-popup',
          offset: [0, -15]
        })
          .setLngLat([
            parseFloat(entrance.Entrance_Longitude.toString()),
            parseFloat(entrance.Entrance_Latitude.toString())
          ])
          .setHTML(popupContent)
          .addTo(map.current!);

        // Also call the original handler
        onStationClick(selectedStation, entrance);
      });

      exitMarkers.current.push(marker as CustomMarker);
    });
  }, [selectedStation, entrances, onStationClick, createEntrancePopupContent]);

  // Add flood alert markers
  const addFloodAlertMarkers = useCallback(() => {
    if (!map.current || !showFloodAlerts) return;

    // Clear existing alert markers
    alertMarkers.current.forEach(marker => marker.remove());
    alertMarkers.current = [];

    floodAlerts.forEach(alert => {
      // Find the station for this alert
      const station = entrances.find(e =>
        `${e.Station_Name}-${e.Line}` === alert.station_id
      );

      if (!station) return;

      // Create alert marker
      const alertContainer = document.createElement('div');
      alertContainer.className = 'flood-alert-marker';

      const alertColors = {
        'watch': '#f59e0b',
        'warning': '#ea580c',
        'emergency': '#dc2626'
      };

      const alertColor = alertColors[alert.alert_level];

      alertContainer.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${alertColor};
        border: 3px solid #fff;
        box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
        cursor: pointer;
        animation: pulse 2s infinite;
        position: relative;
        z-index: 1000;
      `;

      // Add alert icon
      const icon = document.createElement('div');
      icon.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-weight: bold;
        font-size: 12px;
        line-height: 1;
      `;
      icon.textContent = '⚠';
      alertContainer.appendChild(icon);

      const marker = new mapboxgl.Marker({
        element: alertContainer,
        anchor: 'center'
      })
        .setLngLat([
          parseFloat(station.Entrance_Longitude.toString()),
          parseFloat(station.Entrance_Latitude.toString())
        ])
        .addTo(map.current!);

      // Add click handler for alert
      alertContainer.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close existing popup
        if (currentPopup.current) {
          currentPopup.current.remove();
        }

        // Create alert popup
        const alertPopupContent = createAlertPopupContent(alert, station);

        currentPopup.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
          className: 'alert-popup',
          offset: [0, -30]
        })
          .setLngLat([
            parseFloat(station.Entrance_Longitude.toString()),
            parseFloat(station.Entrance_Latitude.toString())
          ])
          .setHTML(alertPopupContent)
          .addTo(map.current!);
      });

      alertMarkers.current.push(marker as CustomMarker);
    });
  }, [floodAlerts, entrances, showFloodAlerts]);

  // Create alert popup content
  const createAlertPopupContent = (alert: FloodAlert, station: SubwayEntrance) => {
    const alertColors = {
      'watch': '#f59e0b',
      'warning': '#ea580c',
      'emergency': '#dc2626'
    };

    const alertColor = alertColors[alert.alert_level];
    const issuedTime = new Date(alert.issued_at).toLocaleTimeString();
    const expiresTime = alert.expires_at ? new Date(alert.expires_at).toLocaleTimeString() : 'No expiration';

    return `
      <div style="min-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: ${alertColor}; color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 6px 6px 0 0;">
          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">🚨 ${alert.title}</h3>
          <div style="font-size: 12px; opacity: 0.9;">
            ${alert.alert_level.toUpperCase()} Alert • ${alert.source.toUpperCase()}
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 14px; color: #374151; line-height: 1.4;">
            ${alert.description}
          </div>
        </div>

        <div style="background: #f3f4f6; border-radius: 6px; padding: 8px; margin-bottom: 12px;">
          <div style="font-size: 12px; color: #374151;">
            <strong>Station:</strong> ${station.Station_Name}<br>
            <strong>Lines:</strong> ${alert.affected_lines.join(', ')}<br>
            <strong>Issued:</strong> ${issuedTime}<br>
            <strong>Expires:</strong> ${expiresTime}
          </div>
        </div>

        ${alert.actions_recommended.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #374151;">Recommended Actions:</div>
            <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #555;">
              ${alert.actions_recommended.map(action => `<li style="margin-bottom: 2px;">${action}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="text-align: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 11px; color: #888;">
            Alert ID: ${alert.id.split('_').pop()}
          </div>
        </div>
      </div>
    `;
  };

  // Update alerts when floodAlerts prop changes
  useEffect(() => {
    setActiveAlerts(floodAlerts);
    if (map.current && map.current.loaded()) {
      addFloodAlertMarkers();
    }
  }, [floodAlerts, addFloodAlertMarkers]);

  // Toggle FEMA flood zones layer
  const toggleFEMAFloodZones = useCallback((show: boolean) => {
    if (!map.current) return;
    
    if (show) {
      // Add FEMA flood zones layer
      if (!map.current.getSource('fema-flood-zones')) {
        map.current.addSource('fema-flood-zones', {
          type: 'geojson',
          data: 'path/to/fema-flood-zones.geojson' // Replace with actual path
        });
        
        map.current.addLayer({
          id: 'fema-flood-zones-layer',
          type: 'fill',
          source: 'fema-flood-zones',
          paint: {
            'fill-color': '#088',
            'fill-opacity': 0.3
          }
        });
      } else {
        map.current.setLayoutProperty('fema-flood-zones-layer', 'visibility', 'visible');
      }
    } else if (map.current.getLayer('fema-flood-zones-layer')) {
      map.current.setLayoutProperty('fema-flood-zones-layer', 'visibility', 'none');
    }
  }, []);

  // Toggle stormwater flood layer
  const toggleStormwaterFlood = useCallback((show: boolean) => {
    if (!map.current) return;
    
    if (show) {
      // Add stormwater flood layer
      if (!map.current.getSource('stormwater-flood')) {
        map.current.addSource('stormwater-flood', {
          type: 'geojson',
          data: 'path/to/stormwater-flood.geojson' // Replace with actual path
        });
        
        map.current.addLayer({
          id: 'stormwater-flood-layer',
          type: 'fill',
          source: 'stormwater-flood',
          paint: {
            'fill-color': '#00f',
            'fill-opacity': 0.2
          }
        });
      } else {
        map.current.setLayoutProperty('stormwater-flood-layer', 'visibility', 'visible');
      }
    } else if (map.current.getLayer('stormwater-flood-layer')) {
      map.current.setLayoutProperty('stormwater-flood-layer', 'visibility', 'none');
    }
  }, []);

  // Update map when data changes
  useEffect(() => {
    if (!map.current) return;

    const updateMapData = () => {
      addStationsToMap();
      if (selectedStation) {
        addExitMarkers();
      }
    };
    
    if (map.current.loaded()) {
      updateMapData();
      addFloodAlertMarkers();
    } else {
      const onLoad = () => {
        updateMapData();
        addFloodAlertMarkers();
        map.current?.off('load', onLoad);
      };
      map.current.on('load', onLoad);
    }
  }, [entrances, assessments, forecastTime, addStationsToMap, addExitMarkers, selectedStation, addFloodAlertMarkers]);

  // Toggle flood layers when visibility changes
  useEffect(() => {
    toggleFEMAFloodZones(showFEMAFloodZones);
    toggleStormwaterFlood(showStormwaterFlood);
  }, [showFEMAFloodZones, showStormwaterFlood, toggleFEMAFloodZones, toggleStormwaterFlood]);

  // Expose map methods via ref
  useImperativeHandle(ref, () => ({
    flyTo: (options: { center: [number, number]; zoom: number; essential?: boolean }) => {
      if (map.current) {
        map.current.flyTo({
          duration: 3000,
          ...options
        });
      }
    },
    getMap: () => map.current,
    getUserLocation: () => userLocation
  }));

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
          }
          50% {
            box-shadow: 0 0 25px rgba(220, 38, 38, 0.9), 0 0 35px rgba(220, 38, 38, 0.3);
          }
          100% {
            box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
          }
        }

        .flood-alert-marker {
          animation: pulse 2s infinite;
        }

        .mapboxgl-popup-content {
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .station-popup .mapboxgl-popup-content {
          max-width: 320px;
        }

        .entrance-popup .mapboxgl-popup-content {
          max-width: 280px;
        }

        .alert-popup .mapboxgl-popup-content {
          max-width: 300px;
          border-left: 4px solid #dc2626;
        }

        .user-location-marker {
          transition: all 0.2s ease;
        }

        .user-location-marker:hover {
          transform: scale(1.1);
        }

        .exit-marker {
          transition: all 0.2s ease;
        }
      `}</style>
      <div
        ref={mapContainer}
        className="w-full h-full"
      />
    </>
  );
});

FloodMap.displayName = 'FloodMap';

export default FloodMap;
