'use client';

import { DashboardStats } from '../types';
import { RefreshCw, AlertTriangle, Droplets, Clock } from 'lucide-react';

interface StatusHeaderProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function StatusHeader({ stats, loading, onRefresh }: StatusHeaderProps) {

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Droplets className="w-4 h-4" />;
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title and Status */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NYC Transit Flood Monitor</h1>
              <p className="text-sm text-gray-600">Real-time flood risk assessment for subway stations</p>
            </div>
            
            {/* Weather Status */}
            {stats && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {stats.weatherConditions}
                </span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="flex items-center space-x-6">
              {/* Total Stations */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalStations}</div>
                <div className="text-xs text-gray-600">Total Stations</div>
              </div>

              {/* High Risk Stations */}
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.highRiskStations}</div>
                <div className="text-xs text-gray-600">High Risk</div>
              </div>

              {/* Active Alerts */}
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.activeAlerts}</div>
                <div className="text-xs text-gray-600">Active Alerts</div>
              </div>

              {/* Average Risk Score */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.averageRiskScore}%</div>
                <div className="text-xs text-gray-600">Avg Risk</div>
              </div>

              {/* Last Updated */}
              <div className="text-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(stats.lastUpdated).toLocaleTimeString()}
                </div>
                <div className="text-xs text-gray-500">Last Updated</div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* Risk Level Indicator */}
        {stats && stats.averageRiskScore > 0 && (
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Overall Risk Level:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                stats.averageRiskScore > 80 ? 'text-red-600 bg-red-50' :
                stats.averageRiskScore > 60 ? 'text-orange-600 bg-orange-50' :
                stats.averageRiskScore > 40 ? 'text-yellow-600 bg-yellow-50' :
                'text-green-600 bg-green-50'
              }`}>
                {getRiskIcon(
                  stats.averageRiskScore > 80 ? 'critical' :
                  stats.averageRiskScore > 60 ? 'high' :
                  stats.averageRiskScore > 40 ? 'medium' : 'low'
                )}
                <span>
                  {stats.averageRiskScore > 80 ? 'Critical' :
                   stats.averageRiskScore > 60 ? 'High' :
                   stats.averageRiskScore > 40 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stats.averageRiskScore > 80 ? 'bg-red-500' :
                    stats.averageRiskScore > 60 ? 'bg-orange-500' :
                    stats.averageRiskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${stats.averageRiskScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
