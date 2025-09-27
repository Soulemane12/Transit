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
  const [selectedStation, setSelectedStation] = useState<FloodRiskAssessment | null>(null);

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
    if (onUserLocationFound) {
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      });

      map.current.addControl(geolocate);
      
      const onGeolocate = (e: GeolocationPosition) => {
        const location = { 
          lng: e.coords.longitude, 
          lat: e.coords.latitude 
        };
        
        onUserLocationFound(location);
        
        // Update or create user location marker
        if (map.current) {
          if (userLocationMarker.current) {
            userLocationMarker.current.setLngLat([location.lng, location.lat]);
          } else {
            const el = document.createElement('div');
            el.className = 'user-location-marker';
            userLocationMarker.current = new mapboxgl.Marker(el)
              .setLngLat([location.lng, location.lat])
              .addTo(map.current);
          }
        }
      };
      
      geolocate.on('geolocate', onGeolocate);
      
      // Cleanup function
      return () => {
        geolocate.off('geolocate', onGeolocate);
      };
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onUserLocationFound]);

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
        onStationClick(stationAssessment);
      }
    };

    // Add event listeners
    map.current.on('click', 'stations-layer', onStationClickHandler);
    
    // Change cursor on hover
    const onMouseEnter = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    };

    const onMouseLeave = () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
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
    
    // Add markers for each entrance
    stationEntrances.forEach(entrance => {
      const container = document.createElement('div');
      container.className = 'exit-marker';
      
      const marker = new mapboxgl.Marker({
        element: container,
        anchor: 'center'
      })
        .setLngLat([
          parseFloat(entrance.Entrance_Longitude.toString()),
          parseFloat(entrance.Entrance_Latitude.toString())
        ])
        .addTo(map.current!);
      
      // Add click handler
      container.addEventListener('click', () => {
        onStationClick(selectedStation, entrance);
      });
      
      exitMarkers.current.push(marker as CustomMarker);
    });
  }, [selectedStation, entrances, onStationClick]);

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
    } else {
      const onLoad = () => {
        updateMapData();
        map.current?.off('load', onLoad);
      };
      map.current.on('load', onLoad);
    }
  }, [entrances, assessments, forecastTime, addStationsToMap, addExitMarkers, selectedStation]);

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
    getMap: () => map.current
  }));

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
    />
  );
});

FloodMap.displayName = 'FloodMap';

export default FloodMap;
