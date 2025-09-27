'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataService } from '../lib/dataService';
import { SubwayEntrance, FloodRiskAssessment, DashboardStats } from '../types';
import StatusHeader from './StatusHeader';
import FloodMap from './FloodMap';
import EntrancePanel from './EntrancePanel';
import ForecastSlider from './ForecastSlider';

export default function Dashboard() {
  const [floodAssessments, setFloodAssessments] = useState<FloodRiskAssessment[]>([]);
  const [entrances, setEntrances] = useState<SubwayEntrance[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<{assessment: FloodRiskAssessment, entrance?: SubwayEntrance} | null>(null);
  const [showFEMAFloodZones, setShowFEMAFloodZones] = useState(false);
  const [showStormwaterFlood, setShowStormwaterFlood] = useState(false);
  const [forecastTime, setForecastTime] = useState(0); // hours ahead

  const dataService = DataService.getInstance();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [entrances, weatherForecast, femaZones, stormwaterZones] = await Promise.all([
        dataService.fetchSubwayEntrances(),
        dataService.fetchWeatherForecast(),
        dataService.fetchFEMAFloodZones(),
        dataService.fetchStormwaterFlood()
      ]);

      // Store entrances
      setEntrances(entrances);

      // Calculate flood risk assessments
      const assessments: FloodRiskAssessment[] = entrances.map(entrance => 
        dataService.calculateFloodRisk(entrance, weatherForecast, [...femaZones, ...stormwaterZones])
      );

      setFloodAssessments(assessments);
      setDashboardStats(dataService.getDashboardStats(assessments));

      // Data loaded successfully
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [dataService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      <div className="relative h-full">
        <FloodMap
          entrances={entrances}
          assessments={floodAssessments}
          onStationClick={(assessment, entrance) => setSelectedStation({assessment, entrance})}
          showFEMAFloodZones={showFEMAFloodZones}
          showStormwaterFlood={showStormwaterFlood}
          forecastTime={forecastTime}
        />
        
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
            Map Layers
          </h3>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showFEMAFloodZones}
                onChange={() => setShowFEMAFloodZones(!showFEMAFloodZones)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-500"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">FEMA Flood Zones</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showStormwaterFlood}
                onChange={() => setShowStormwaterFlood(!showStormwaterFlood)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Stormwater Flood</span>
            </label>
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
          assessment={selectedStation.assessment}
          entrance={selectedStation.entrance}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}