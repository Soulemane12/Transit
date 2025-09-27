'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { DataService } from '../lib/dataService';
import { SubwayEntrance, FloodRiskAssessment, DashboardStats } from '../types';
import StatusHeader from './StatusHeader';
import FloodMap from './FloodMap';
import type { MapRef } from './FloodMap';
import EntrancePanel from './EntrancePanel';


export default function Dashboard() {
  const [floodAssessments, setFloodAssessments] = useState<FloodRiskAssessment[]>([]);
  const [entrances, setEntrances] = useState<SubwayEntrance[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<{assessment: FloodRiskAssessment, entrance?: SubwayEntrance} | null>(null);
  const [showFEMAFloodZones, setShowFEMAFloodZones] = useState(false);
  const [showStormwaterFlood, setShowStormwaterFlood] = useState(false);
  const [userLocation, setUserLocation] = useState<{lng: number; lat: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearestStations, setNearestStations] = useState<Array<{
    station: SubwayEntrance;
    distance: number; // in meters
  }>>([]);

  const mapRef = useRef<MapRef>(null);
  const dataService = DataService.getInstance();
  
  // Request user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lng: position.coords.longitude,
            lat: position.coords.latitude
          });
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

  // Calculate distance between two points in meters using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Find nearest stations to user's location
  const findNearestStations = useCallback(() => {
    if (!userLocation || entrances.length === 0) return [];

    const stationsWithDistance = entrances.map(entrance => ({
      station: entrance,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        Number(entrance.Entrance_Latitude),
        Number(entrance.Entrance_Longitude)
      )
    }));

    // Sort by distance and take top 5
    return stationsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [userLocation, entrances]);

  // Update nearest stations when user location or entrances change
  useEffect(() => {
    if (userLocation && entrances.length > 0) {
      const stations = findNearestStations();
      setNearestStations(stations);
    }
  }, [userLocation, entrances, findNearestStations]);

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
          showFEMAFloodZones={showFEMAFloodZones}
          showStormwaterFlood={showStormwaterFlood}
          forecastTime={0} // Default value since we removed the forecast slider
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

        {/* Nearest Stations Panel */}
        {userLocation && nearestStations.length > 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-md rounded-xl px-5 py-4 shadow-xl border border-gray-200/50 z-10">
            <h3 className="font-bold text-base mb-3 text-gray-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Nearest Stations
            </h3>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {nearestStations.map(({ station, distance }) => {
                const assessment = floodAssessments.find(a => a.stationId === `${station.Station_Name}-${station.Line}`);
                const riskLevel = assessment?.riskLevel || 'low';
                const riskColors = {
                  critical: 'bg-red-500',
                  high: 'bg-orange-500',
                  medium: 'bg-yellow-500',
                  low: 'bg-green-500'
                };
                
                return (
                  <div 
                    key={`${station.ENTRY_ID || station.Station_Name}`}
                    className="flex-shrink-0 w-48 bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      if (assessment) {
                        setSelectedStation({ assessment, entrance: station });
                        // Center map on selected station
                        if (mapRef.current) {
                          mapRef.current.flyTo({
                            center: [Number(station.Entrance_Longitude), Number(station.Entrance_Latitude)] as [number, number],
                            zoom: 15
                          });
                        }
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900 truncate">{station.Station_Name}</h4>
                      <span className={`w-3 h-3 rounded-full ${riskColors[riskLevel] || 'bg-gray-300'}`}></span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {station.Line} Line • {(distance / 1000).toFixed(1)} km
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {station.Entrance_Type || 'Entrance'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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