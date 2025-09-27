'use client';

import { useEffect, useState, useCallback } from 'react';
import * as turf from '@turf/turf';
import { SubwayEntrance, FloodRiskAssessment } from '../types';

interface NearbyStation {
  entrance: SubwayEntrance;
  assessment: FloodRiskAssessment;
  distance: number;
  walkTime: number;
}

interface NearbyStationsPanelProps {
  userLocation: { lng: number; lat: number } | null;
  entrances: SubwayEntrance[];
  assessments: FloodRiskAssessment[];
  onStationSelect: (assessment: FloodRiskAssessment, entrance: SubwayEntrance) => void;
  className?: string;
}

export default function NearbyStationsPanel({
  userLocation,
  entrances,
  assessments,
  onStationSelect,
  className = ''
}: NearbyStationsPanelProps) {
  const [nearbyStations, setNearbyStations] = useState<NearbyStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const findNearbyStations = useCallback(() => {
    console.log('Finding nearby stations...', {
      userLocation,
      entrancesCount: entrances.length,
      assessmentsCount: assessments.length
    });

    if (!userLocation || !entrances.length || !assessments.length) {
      console.log('Missing data for nearby stations');
      setNearbyStations([]);
      return;
    }

    const userPoint = turf.point([userLocation.lng, userLocation.lat]);
    const nearbyData: NearbyStation[] = [];

    // Group entrances by station
    const stationGroups = entrances.reduce<Record<string, SubwayEntrance[]>>((acc, entrance) => {
      const stationKey = `${entrance.Station_Name}-${entrance.Line}`;
      if (!acc[stationKey]) {
        acc[stationKey] = [];
      }
      acc[stationKey].push(entrance);
      return acc;
    }, {});

    Object.entries(stationGroups).forEach(([stationKey, stationEntrances]) => {
      const assessment = assessments.find(a => a.stationId === stationKey);
      if (!assessment) return;

      // Find closest entrance for this station
      let closestEntrance = stationEntrances[0];
      let closestDistance = Infinity;

      stationEntrances.forEach(entrance => {
        const entrancePoint = turf.point([entrance.Entrance_Longitude, entrance.Entrance_Latitude]);
        const distance = turf.distance(userPoint, entrancePoint, { units: 'kilometers' });

        if (distance < closestDistance) {
          closestDistance = distance;
          closestEntrance = entrance;
        }
      });

      // Include stations within 5km (increased range for better coverage)
      if (closestDistance <= 5) {
        const walkTime = Math.round(closestDistance * 12); // ~12 minutes per km
        nearbyData.push({
          entrance: closestEntrance,
          assessment,
          distance: closestDistance,
          walkTime
        });
      }
    });

    // Sort by distance and take closest 10 stations
    const sortedNearby = nearbyData
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    console.log('Found nearby stations:', sortedNearby.length, sortedNearby.map(s => ({
      name: s.assessment.stationName,
      distance: s.distance.toFixed(2) + 'km'
    })));

    setNearbyStations(sortedNearby);
  }, [userLocation, entrances, assessments]);

  useEffect(() => {
    if (userLocation && entrances.length > 0 && assessments.length > 0) {
      setIsSearching(true);
      findNearbyStations();
      setIsSearching(false);
    }
  }, [findNearbyStations, userLocation, entrances.length, assessments.length]);

  const getRiskColor = (riskLevel: string) => {
    const colors = {
      'low': '#16a34a',
      'medium': '#d97706',
      'high': '#ea580c',
      'critical': '#dc2626'
    };
    return colors[riskLevel as keyof typeof colors] || '#6b7280';
  };

  const getRoutes = (entrance: SubwayEntrance) => {
    return [entrance.Route1, entrance.Route2, entrance.Route3, entrance.Route4, entrance.Route5]
      .filter(route => route && route.trim() !== '')
      .slice(0, 3) // Show max 3 routes to save space
      .join(' ');
  };

  if (!userLocation) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📍</span>
          <h3 className="font-semibold text-gray-800">Nearby Stations</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-sm mb-2">Enable location to see nearby stations</p>
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    console.log('Manual location request successful:', position.coords);
                  },
                  (error) => {
                    console.error('Manual location request failed:', error);
                  }
                );
              }
            }}
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
          >
            Request Location
          </button>
        </div>
      </div>
    );
  }

  if (nearbyStations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📍</span>
          <h3 className="font-semibold text-gray-800">Nearby Stations</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🚇</div>
          <p className="text-sm">No stations found within 5km</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <h3 className="font-semibold text-gray-800">Nearby Stations</h3>
          <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {nearbyStations.length} found
          </span>
        </div>
        {userLocation && (
          <div className="mt-2 text-xs text-gray-500">
            Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </div>
        )}
        <div className="mt-1 text-xs text-gray-500">
          Data: {entrances.length} entrances, {assessments.length} assessments
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {nearbyStations.map((station, index) => (
          <div
            key={`${station.assessment.stationId}-${index}`}
            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onStationSelect(station.assessment, station.entrance)}
          >
            <div className="flex items-start gap-3">
              {/* Rank & Risk Indicator */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRiskColor(station.assessment.riskLevel) }}
                  title={`${station.assessment.riskLevel} risk`}
                />
              </div>

              {/* Station Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 text-sm truncate">
                    {station.assessment.stationName}
                  </h4>
                  {station.entrance.ADA === 'Yes' && (
                    <span className="text-green-600 text-xs" title="ADA Accessible">♿</span>
                  )}
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <div className="font-mono font-medium text-blue-600 mb-1">
                    {getRoutes(station.entrance)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span>📏</span>
                      {station.distance.toFixed(1)}km
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🚶</span>
                      {station.walkTime}min
                    </span>
                  </div>
                </div>

                {/* Risk Info */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: getRiskColor(station.assessment.riskLevel) }}
                  >
                    {Math.round(station.assessment.floodProbability)}% risk
                  </span>
                  {station.assessment.timeToFlood && (
                    <span className="text-xs text-orange-600 font-medium">
                      ⚠️ {Math.round(station.assessment.timeToFlood)}min to flood
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 text-xs text-gray-500 text-center">
        Showing stations within 5km • Tap to view details
      </div>
    </div>
  );
}