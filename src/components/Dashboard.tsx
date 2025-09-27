'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DataService } from '../lib/dataService';
import { SubwayEntrance, FloodRiskAssessment, DashboardStats } from '../types';
import StatusHeader from './StatusHeader';
import FloodMap from './FloodMap';
import type { MapRef } from './FloodMap';
import EntrancePanel from './EntrancePanel';
import NearbyStationsPanel from './NearbyStationsPanel';
import FloodReportsPanel from './FloodReportsPanel';
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
  const [showFloodReports, setShowFloodReports] = useState(false);
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
    console.log('Loading flood risk data...');

    setLoading(true);

    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Load flood assessments
      setFloodAssessments(DEMO_FLOOD_ASSESSMENTS);

      // Create dashboard stats
      const dashboardStats: DashboardStats = {
        totalStations: DEMO_FLOOD_ASSESSMENTS.length,
        highRiskStations: DEMO_FLOOD_ASSESSMENTS.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length,
        activeAlerts: DEMO_FLOOD_ALERTS.length,
        lastUpdated: new Date().toISOString(),
        weatherConditions: 'Heavy Rain Expected',
        averageRiskScore: Math.round(DEMO_FLOOD_ASSESSMENTS.reduce((sum, a) => sum + a.floodProbability, 0) / DEMO_FLOOD_ASSESSMENTS.length)
      };

      setDashboardStats(dashboardStats);

      console.log('✅ Data loaded successfully:', {
        stations: DEMO_FLOOD_ASSESSMENTS.length,
        alerts: DEMO_FLOOD_ALERTS.length,
        userLocation: DEMO_USER_LOCATION
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Status Header */}
      <div>
        <StatusHeader
          stats={dashboardStats}
          loading={loading}
          onRefresh={loadData}
        />
      </div>

      {/* Main Map and Panel Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Container */}
        <div className="absolute inset-0">
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
              setUserLocation(location);
              setLocationError(null);
            }}
            floodAlerts={DEMO_FLOOD_ALERTS}
            showFloodAlerts={true}
            enableUserLocation={true}
            autoLocateUser={true}
            forecastTime={0}
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

          {/* Find My Location Button */}
          {userLocation && (
            <button
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [userLocation.lng, userLocation.lat],
                    zoom: 16
                  });
                }
              }}
              className="absolute left-4 top-16 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center z-20 transition-colors group"
              title="Find My Location"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          )}

          {/* View Flood Reports Button */}
          <button
            onClick={() => setShowFloodReports(!showFloodReports)}
            className="absolute right-4 bottom-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 z-20 transition-colors"
            title="View Community Flood Reports"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">Reports</span>
          </button>

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
            className="absolute left-4 top-28 w-80 max-w-sm z-10"
          />

          {/* Flood Layer Controls */}
          <div className="absolute top-16 right-4 bg-white/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-gray-200/50">
            <h3 className="font-bold text-base mb-4 text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Risk Levels
            </h3>
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

        {/* Station Detail Panel - Overlay */}
        {selectedStation && (
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out z-30 overflow-hidden flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Station Details</h2>
              <button 
                onClick={() => setSelectedStation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <EntrancePanel
                assessment={selectedStation.assessment}
                entrance={selectedStation.entrance}
                onClose={() => setSelectedStation(null)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Flood Reports Panel */}
      {showFloodReports && (
        <FloodReportsPanel
          onClose={() => setShowFloodReports(false)}
        />
      )}
    </div>
  );
}