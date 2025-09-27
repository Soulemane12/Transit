'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DataService } from '../lib/dataService';
import { SubwayEntrance, FloodRiskAssessment, DashboardStats } from '../types';
import StatusHeader from './StatusHeader';
import FloodMap from './FloodMap';
import type { MapRef } from './FloodMap';
import EntrancePanel from './EntrancePanel';
import NearbyStationsPanel from './NearbyStationsPanel';
import {
  DEMO_USER_LOCATION,
  DEMO_SUBWAY_ENTRANCES,
  DEMO_FLOOD_ASSESSMENTS,
  DEMO_FLOOD_ALERTS
} from '../lib/demoData';


export default function Dashboard() {
  const [floodAssessments, setFloodAssessments] = useState<FloodRiskAssessment[]>([]);
  const [entrances, setEntrances] = useState<SubwayEntrance[]>(DEMO_SUBWAY_ENTRANCES);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false); // Set to false for demo
  const [selectedStation, setSelectedStation] = useState<{assessment: FloodRiskAssessment, entrance?: SubwayEntrance} | null>(null);
  const [showFEMAFloodZones, setShowFEMAFloodZones] = useState(true); // Show by default for demo
  const [showStormwaterFlood, setShowStormwaterFlood] = useState(true); // Show by default for demo
  const [userLocation, setUserLocation] = useState<{lng: number; lat: number} | null>(DEMO_USER_LOCATION);
  const [locationError, setLocationError] = useState<string | null>(null);

  const mapRef = useRef<MapRef>(null);
  const dataService = DataService.getInstance();
  
  // Request user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lng: position.coords.longitude,
            lat: position.coords.latitude
          };
          console.log('Dashboard detected user location:', location);
          setUserLocation(location);
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to access your location. Using default map view.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  const loadData = useCallback(async () => {
    // Use demo data for hackathon presentation
    console.log('🚇 DEMO MODE: Loading Grand Central showcase data...');

    setLoading(true);

    // Simulate loading time for demo effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Use pre-built demo assessments
      setFloodAssessments(DEMO_FLOOD_ASSESSMENTS);

      // Create demo dashboard stats
      const demoStats: DashboardStats = {
        totalStations: DEMO_FLOOD_ASSESSMENTS.length,
        highRiskStations: DEMO_FLOOD_ASSESSMENTS.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length,
        activeAlerts: DEMO_FLOOD_ALERTS.length,
        lastUpdated: new Date().toISOString(),
        weatherConditions: 'Heavy Rain Expected',
        averageRiskScore: Math.round(DEMO_FLOOD_ASSESSMENTS.reduce((sum, a) => sum + a.floodProbability, 0) / DEMO_FLOOD_ASSESSMENTS.length)
      };

      setDashboardStats(demoStats);

      console.log('✅ Demo data loaded successfully:', {
        stations: DEMO_FLOOD_ASSESSMENTS.length,
        alerts: DEMO_FLOOD_ALERTS.length,
        userLocation: DEMO_USER_LOCATION
      });

    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  return (
    <div className="h-screen w-full relative bg-gray-50">
      {/* Demo Mode Banner */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 z-50">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="font-bold">HACKATHON DEMO MODE</span>
          <span className="text-lg">🚇</span>
          <span className="ml-4 text-sm opacity-90">
            Showcasing Grand Central Terminal & Nearby Stations
          </span>
        </div>
      </div>

      {/* Status Header */}
      <div className="pt-12">
        <StatusHeader
          stats={dashboardStats}
          loading={loading}
          onRefresh={loadData}
        />
      </div>

      {/* Main Map */}
      <div className="relative h-full">
        <FloodMap
          ref={mapRef}
          entrances={entrances}
          assessments={floodAssessments}
          onStationClick={(assessment, entrance) => {
            setSelectedStation({assessment, entrance});
            // Close any open popups when a station is selected
            const popups = document.getElementsByClassName('mapboxgl-popup');
            Array.from(popups).forEach(popup => popup.remove());
          }}
          onUserLocationFound={(location) => {
            console.log('FloodMap detected user location:', location);
            setUserLocation(location);
            setLocationError(null);
          }}
          showFEMAFloodZones={showFEMAFloodZones}
          showStormwaterFlood={showStormwaterFlood}
          forecastTime={0}
          floodAlerts={DEMO_FLOOD_ALERTS}
          showFloodAlerts={true}
          enableUserLocation={true}
          autoLocateUser={false}
        />
        
        {/* Location error message */}
        {locationError && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-50 border-l-4 border-yellow-400 p-4 z-10">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <p className="text-sm text-gray-600">Loading flood risk data...</p>
            </div>
          </div>
        )}

        {/* Nearby Stations Panel */}
        <NearbyStationsPanel
          userLocation={userLocation}
          entrances={entrances}
          assessments={floodAssessments}
          onStationSelect={(assessment, entrance) => {
            setSelectedStation({ assessment, entrance });
            // Center map on selected station
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [entrance.Entrance_Longitude, entrance.Entrance_Latitude],
                zoom: 15
              });
            }
          }}
          className="absolute left-4 top-32 w-80 max-w-sm z-10"
        />

        {/* Flood Layer Controls */}
        <div className="absolute top-32 right-4 bg-white/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-gray-200/50">
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