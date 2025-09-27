'use client';

import { useState, useEffect } from 'react';
import { FloodReport, addFloodReport, getFloodReports } from '../lib/floodData';

interface FloodRiskPanelProps {
  selectedEntrance?: {
    id: number;
    name: string;
    stationName: string;
    latitude: number;
    longitude: number;
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    riskScore: number;
    factors: string[];
  };
  onClose: () => void;
}

export default function FloodRiskPanel({ selectedEntrance, onClose }: FloodRiskPanelProps) {
  const [floodReports, setFloodReports] = useState<FloodReport[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [newReport, setNewReport] = useState<{
    severity: 'low' | 'medium' | 'high' | 'extreme';
    description: string;
  }>({
    severity: 'medium',
    description: ''
  });

  useEffect(() => {
    setFloodReports(getFloodReports());
  }, []);

  const handleSubmitReport = () => {
    if (selectedEntrance && newReport.description.trim()) {
      addFloodReport({
        location: {
          latitude: selectedEntrance.latitude,
          longitude: selectedEntrance.longitude
        },
        severity: newReport.severity,
        description: newReport.description,
        verified: false
      });
      setFloodReports(getFloodReports());
      setShowReportForm(false);
      setNewReport({ severity: 'medium', description: '' });
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'extreme': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMitigationSuggestions = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return [
          'Monitor weather conditions',
          'Install basic drainage improvements'
        ];
      case 'medium':
        return [
          'Install modular flood barriers',
          'Add permeable pavement nearby',
          'Create rain gardens in surrounding area'
        ];
      case 'high':
        return [
          'Install permanent flood barriers',
          'Implement green infrastructure (bioswales)',
          'Add pump stations for drainage',
          'Create elevated walkways'
        ];
      case 'extreme':
        return [
          'Install advanced flood protection systems',
          'Implement comprehensive green infrastructure',
          'Add emergency pumping capacity',
          'Consider entrance elevation or relocation',
          'Install flood sensors and early warning systems'
        ];
      default:
        return [];
    }
  };

  if (!selectedEntrance) return null;

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-lg shadow-lg p-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Flood Risk Assessment</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Station Info */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">{selectedEntrance.stationName}</h3>
        <p className="text-sm text-gray-600">{selectedEntrance.name}</p>
      </div>

      {/* Risk Level */}
      <div className={`mb-4 p-3 rounded-lg ${getRiskColor(selectedEntrance.riskLevel)}`}>
        <div className="flex justify-between items-center">
          <span className="font-semibold capitalize">Risk Level: {selectedEntrance.riskLevel}</span>
          <span className="text-sm">Score: {selectedEntrance.riskScore}</span>
        </div>
      </div>

      {/* Risk Factors */}
      {selectedEntrance.factors.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">Risk Factors:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedEntrance.factors.map((factor, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mitigation Suggestions */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-800 mb-2">Recommended Actions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {getMitigationSuggestions(selectedEntrance.riskLevel).map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">→</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Crowd Reports */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-gray-800">Recent Reports:</h4>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Report Flood
          </button>
        </div>

        {showReportForm && (
          <div className="mb-3 p-3 border rounded-lg">
            <select
              value={newReport.severity}
              onChange={(e) => setNewReport({ ...newReport, severity: e.target.value as typeof newReport.severity })}
              className="w-full mb-2 p-2 border rounded text-sm"
            >
              <option value="low">Low Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="high">High Severity</option>
              <option value="extreme">Extreme Severity</option>
            </select>
            <textarea
              value={newReport.description}
              onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
              placeholder="Describe the flooding conditions..."
              className="w-full mb-2 p-2 border rounded text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitReport}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
              >
                Submit
              </button>
              <button
                onClick={() => setShowReportForm(false)}
                className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {floodReports
            .filter(report => {
              const distance = Math.sqrt(
                Math.pow(report.location.latitude - selectedEntrance.latitude, 2) +
                Math.pow(report.location.longitude - selectedEntrance.longitude, 2)
              );
              return distance < 0.01;
            })
            .slice(0, 5)
            .map((report) => (
              <div key={report.id} className="p-2 bg-gray-50 rounded text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-semibold capitalize ${getRiskColor(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className="text-gray-500">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600">{report.description}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-500 border-t pt-2">
        <p className="mb-1">Risk Levels:</p>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Low (0-19)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Medium (20-49)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
            <span>High (50-79)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span>Extreme (80+)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
