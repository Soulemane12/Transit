'use client';

import { DashboardStats } from '../types';
import { RefreshCw, Droplets } from 'lucide-react';

interface StatusHeaderProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function StatusHeader({ stats, loading, onRefresh }: StatusHeaderProps) {

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Title and Status */}
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Metro Flood</h1>
              <p className="text-xs text-gray-600">Real-time flood risk assessment</p>
            </div>
            
            {/* Weather Status */}
            {stats && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 rounded-md">
                <Droplets className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">
                  {stats.weatherConditions}
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="flex items-center space-x-3">
              {/* Total Stations */}
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{stats.totalStations}</div>
                <div className="text-xs text-gray-600">Stations</div>
              </div>

              {/* High Risk Stations */}
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{stats.highRiskStations}</div>
                <div className="text-xs text-gray-600">High Risk</div>
              </div>

              {/* Active Alerts */}
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.activeAlerts}</div>
                <div className="text-xs text-gray-600">Alerts</div>
              </div>

              {/* Average Risk Score */}
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{stats.averageRiskScore}%</div>
                <div className="text-xs text-gray-600">Avg Risk</div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
