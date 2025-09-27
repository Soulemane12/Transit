'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DataService } from '../lib/dataService';
import { SubwayEntrance, FloodRiskAssessment, DashboardStats } from '../types';
import { DEFAULT_MAP_CENTER, DEFAULT_ZOOM, MAP_STYLES } from '../lib/constants';
import StatusHeader from './StatusHeader';
import FloodMap from './FloodMap';
import EntrancePanel from './EntrancePanel';
import ForecastSlider from './ForecastSlider';

export default function Dashboard() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [subwayEntrances, setSubwayEntrances] = useState<SubwayEntrance[]>([]);
  const [floodAssessments, setFloodAssessments] = useState<FloodRiskAssessment[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<FloodRiskAssessment | null>(null);
  const [showFEMAFloodZones, setShowFEMAFloodZones] = useState(false);
  const [showStormwaterFlood, setShowStormwaterFlood] = useState(false);
  const [forecastTime, setForecastTime] = useState(0); // hours ahead

  const dataService = DataService.getInstance();

  useEffect(() => {
    initializeMap();
    loadData();
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.STREETS,
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_ZOOM
    });

    map.current.on('load', () => {
      console.log('Map loaded successfully');
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [entrances, weatherForecast, femaZones, stormwaterZones] = await Promise.all([
        dataService.fetchSubwayEntrances(),
        dataService.fetchWeatherForecast(),
        dataService.fetchFEMAFloodZones(),
        dataService.fetchStormwaterFlood()
      ]);

      setSubwayEntrances(entrances);

      // Calculate flood risk assessments
      const assessments: FloodRiskAssessment[] = entrances.map(entrance => 
        dataService.calculateFloodRisk(entrance, weatherForecast, [...femaZones, ...stormwaterZones])
      );

      setFloodAssessments(assessments);
      setDashboardStats(dataService.getDashboardStats(assessments));

      // Add stations to map
      if (map.current && entrances.length > 0) {
        addStationsToMap(entrances, assessments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStationsToMap = (entrances: SubwayEntrance[], assessments: FloodRiskAssessment[]) => {
    if (!map.current) return;

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
        setSelectedStation(properties.assessment);
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
  };

  const toggleFEMAFloodZones = async () => {
    if (!map.current) return;
    
    if (!showFEMAFloodZones) {
      const femaZones = await dataService.fetchFEMAFloodZones();
      // Add FEMA zones to map (implementation similar to existing code)
    }
    setShowFEMAFloodZones(!showFEMAFloodZones);
  };

  const toggleStormwaterFlood = async () => {
    if (!map.current) return;
    
    if (!showStormwaterFlood) {
      const stormwaterZones = await dataService.fetchStormwaterFlood();
      // Add stormwater zones to map (implementation similar to existing code)
    }
    setShowStormwaterFlood(!showStormwaterFlood);
  };

  const handleForecastTimeChange = (hours: number) => {
    setForecastTime(hours);
    // Update risk assessments based on forecast time
    // This would involve recalculating with different weather conditions
  };

  return (
    <div className="h-screen w-full relative bg-gray-50">
      {/* Status Header */}
      <StatusHeader 
        stats={dashboardStats} 
        loading={loading}
        onRefresh={loadData}
      />

      {/* Main Map */}
      <div className="h-full w-full">
        <div ref={mapContainer} className="h-full w-full" />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">Loading flood risk data...</p>
            </div>
          </div>
        )}

        {/* Forecast Slider */}
        <ForecastSlider 
          value={forecastTime}
          onChange={handleForecastTimeChange}
          maxHours={24}
        />

        {/* Flood Layer Controls */}
        <div className="absolute top-20 right-4 bg-white/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-gray-200/50">
          <h3 className="font-bold text-base mb-4 text-gray-800 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Flood Risk Layers
          </h3>
          <div className="space-y-3">
            <button
              onClick={toggleFEMAFloodZones}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                showFEMAFloodZones
                  ? 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-2 border-red-200 shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
              }`}
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
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                showStormwaterFlood
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-2 border-blue-200 shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
              }`}
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

          {/* Risk Legend */}
          <div className="mt-5 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">Risk Levels:</p>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span className="text-xs font-medium">Critical Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-xs font-medium">High Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-xs font-medium">Medium Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="text-xs font-medium">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station Detail Panel */}
      {selectedStation && (
        <EntrancePanel 
          assessment={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}
