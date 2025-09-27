'use client';

import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SubwayEntrance, FloodRiskAssessment } from '../types';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM, MAP_STYLES } from '../lib/constants';

interface FloodMapProps {
  entrances: SubwayEntrance[];
  assessments: FloodRiskAssessment[];
  onStationClick: (assessment: FloodRiskAssessment) => void;
  showFEMAFloodZones: boolean;
  showStormwaterFlood: boolean;
  forecastTime: number;
}

export default function FloodMap({
  entrances,
  assessments,
  onStationClick,
  showFEMAFloodZones,
  showStormwaterFlood,
  forecastTime
}: FloodMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.STREETS,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_ZOOM
    });

    map.current.on('load', () => {
      addStationsToMap();
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (map.current && entrances.length > 0 && assessments.length > 0) {
      addStationsToMap();
    }
  }, [entrances, assessments, forecastTime]);

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
              drainageCapacity: 0
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

    // Add click interaction
    map.current.on('click', 'stations-layer', (e) => {
      const properties = e.features?.[0]?.properties;
      if (properties) {
        onStationClick(properties.assessment);
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

  return (
    <div ref={mapContainer} className="h-full w-full" />
  );
}
