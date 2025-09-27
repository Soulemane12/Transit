'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchSubwayEntrances, convertToGeoJSON } from '../lib/subwayData';
import { 
  fetchNYCStormwaterFloods, 
  fetchFEMAFloodZones, 
  getFloodReports,
  calculateFloodRisk 
} from '../lib/floodData';
import LayerControl from '../components/LayerControl';
import FloodRiskPanel from '../components/FloodRiskPanel';

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // State management
  const [layers, setLayers] = useState({
    subwayEntrances: true,
    floodZones: false,
    femaZones: false,
    mtaAlerts: false,
    floodReports: false
  });
  const [selectedEntrance, setSelectedEntrance] = useState<{
    id: number;
    name: string;
    stationName: string;
    latitude: number;
    longitude: number;
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    riskScore: number;
    factors: string[];
  } | null>(null);
  const [showRiskPanel, setShowRiskPanel] = useState(false);

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

    // Load all data when map is ready
    map.current.on('load', async () => {
      try {
        // Load subway entrances with flood risk assessment
        const entrances = await fetchSubwayEntrances();
        const floodZones = await fetchNYCStormwaterFloods();
        const femaZones = await fetchFEMAFloodZones();
        const floodReports = getFloodReports();

        // Calculate flood risk for each entrance
        const entrancesWithRisk = entrances.map(entrance => {
          const risk = calculateFloodRisk(
            entrance.entrance_latitude,
            entrance.entrance_longitude,
            floodZones,
            femaZones,
            floodReports
          );
          return {
            ...entrance,
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            riskFactors: risk.factors
          };
        });

        const geoJSONData = convertToGeoJSON(entrancesWithRisk);

        // Add subway entrances source with risk-based styling
        map.current?.addSource('subway-entrances', {
          type: 'geojson',
          data: geoJSONData
        });

        // Add subway entrance layer with risk-based colors
        map.current?.addLayer({
          id: 'subway-entrances-layer',
          type: 'circle',
          source: 'subway-entrances',
          paint: {
            'circle-radius': [
              'case',
              ['==', ['get', 'riskLevel'], 'extreme'], 8,
              ['==', ['get', 'riskLevel'], 'high'], 6,
              ['==', ['get', 'riskLevel'], 'medium'], 4,
              3
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'riskLevel'], 'extreme'], '#dc2626',
              ['==', ['get', 'riskLevel'], 'high'], '#ea580c',
              ['==', ['get', 'riskLevel'], 'medium'], '#d97706',
              '#16a34a'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.8
          }
        });

        // Add flood zones layer
        if (floodZones.length > 0) {
          map.current?.addSource('flood-zones', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: floodZones.map(zone => ({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[[-74.1, 40.6], [-73.7, 40.6], [-73.7, 40.9], [-74.1, 40.9], [-74.1, 40.6]]]
                },
                properties: {
                  depth: zone.flood_depth,
                  scenario: zone.flood_scenario
                }
              }))
            }
          });

          map.current?.addLayer({
            id: 'flood-zones-layer',
            type: 'fill',
            source: 'flood-zones',
            paint: {
              'fill-color': '#0ea5e9',
              'fill-opacity': 0.3
            }
          });
        }

        // Add click interaction for subway entrances
        map.current?.on('click', 'subway-entrances-layer', (e) => {
          const properties = e.features?.[0]?.properties;

          if (properties) {
            setSelectedEntrance({
              id: properties.id,
              name: properties.name,
              stationName: properties.stationName,
              latitude: properties.entrance_latitude,
              longitude: properties.entrance_longitude,
              riskLevel: properties.riskLevel,
              riskScore: properties.riskScore,
              factors: properties.riskFactors || []
            });
            setShowRiskPanel(true);
          }
        });

        // Change cursor on hover
        map.current?.on('mouseenter', 'subway-entrances-layer', () => {
          map.current!.getCanvas().style.cursor = 'pointer';
        });

        map.current?.on('mouseleave', 'subway-entrances-layer', () => {
          map.current!.getCanvas().style.cursor = '';
        });

      } catch (error) {
        console.error('Error loading flood risk data:', error);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Handle layer toggles
  const handleLayerToggle = (layerName: keyof typeof layers) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));

    if (map.current) {
      const visibility = layers[layerName] ? 'none' : 'visible';
      
      switch (layerName) {
        case 'subwayEntrances':
          map.current.setLayoutProperty('subway-entrances-layer', 'visibility', visibility);
          break;
        case 'floodZones':
          map.current.setLayoutProperty('flood-zones-layer', 'visibility', visibility);
          break;
        case 'femaZones':
          // FEMA zones layer implementation
          break;
        case 'mtaAlerts':
          // MTA alerts layer implementation
          break;
        case 'floodReports':
          // Flood reports layer implementation
          break;
      }
    }
  };

  const handleShowRiskRanking = () => {
    // Sort entrances by risk and highlight highest risk
    console.log('Showing risk ranking...');
  };

  return (
    <div className="h-screen w-full relative">
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Layer Control Panel */}
      <LayerControl 
        layers={layers}
        onLayerToggle={handleLayerToggle}
        onShowRiskRanking={handleShowRiskRanking}
      />
      
      {/* Flood Risk Assessment Panel */}
      {showRiskPanel && selectedEntrance && (
        <FloodRiskPanel 
          selectedEntrance={selectedEntrance}
          onClose={() => setShowRiskPanel(false)}
        />
      )}
      
      {/* Title Banner */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
        <h1 className="text-lg font-bold text-gray-800">NYC Subway Flood Risk Map</h1>
        <p className="text-sm text-gray-600">Real-time flood risk assessment for subway entrances</p>
      </div>
    </div>
  );
}
