'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, MapPin, Calendar, MessageSquare, Eye } from 'lucide-react';
import { CrowdsourcedReport } from '../types';

interface FloodReportsPanelProps {
  onClose: () => void;
}

export default function FloodReportsPanel({ onClose }: FloodReportsPanelProps) {
  const [reports, setReports] = useState<CrowdsourcedReport[]>([]);

  useEffect(() => {
    // Load reports from local storage
    try {
      const savedReports = JSON.parse(localStorage.getItem('floodReports') || '[]');
      setReports(savedReports.sort((a: CrowdsourcedReport, b: CrowdsourcedReport) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('Error loading flood reports:', error);
    }
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="absolute top-20 left-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 flex flex-col"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Flood Reports</h2>
              <p className="text-sm text-gray-600">{reports.length} community reports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
            <p className="text-gray-600">Community flood reports will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Report Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{report.stationName}</h3>
                      <p className="text-xs text-gray-600">Station ID: {report.stationId}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                </div>

                {/* Report Type */}
                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {report.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                {report.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700">{report.description}</p>
                  </div>
                )}

                {/* Location Details */}
                {report.location && (
                  <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Location:</span> {report.location.address}
                    </p>
                    <p className="text-xs text-blue-600">
                      Lat: {report.location.coordinates.lat.toFixed(6)},
                      Lng: {report.location.coordinates.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Water Level */}
                {report.waterLevel && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Water Level:</span>
                      <span className="font-medium text-gray-900">{report.waterLevel} inches</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          report.waterLevel > 12 ? 'bg-red-500' :
                          report.waterLevel > 6 ? 'bg-orange-500' :
                          report.waterLevel > 3 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min((report.waterLevel / 24) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(report.timestamp)}</span>
                  </div>
                  {report.contactInfo && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      <span>Contact available</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Reports are stored locally and help improve flood monitoring
          </p>
        </div>
      </div>
    </div>
  );
}