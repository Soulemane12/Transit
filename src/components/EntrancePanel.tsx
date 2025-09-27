'use client';

import { useState } from 'react';
import { FloodRiskAssessment, SubwayEntrance } from '../types';
import { X, AlertTriangle, MapPin, Droplets, Shield, DollarSign, Calendar, MessageSquare } from 'lucide-react';
import ReportModal from './ReportModal';

interface EntrancePanelProps {
  assessment: FloodRiskAssessment;
  entrance?: SubwayEntrance;
  onClose: () => void;
}

export default function EntrancePanel({ assessment, entrance, onClose }: EntrancePanelProps) {
  const [showReportModal, setShowReportModal] = useState(false);

  const handleReportSubmit = async (report: Omit<import('../types').CrowdsourcedReport, 'id' | 'timestamp'>) => {
    try {
      // Save report to local storage
      const newReport = {
        ...report,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        stationName: assessment.stationName
      };

      // Get existing reports from local storage
      const existingReports = JSON.parse(localStorage.getItem('floodReports') || '[]');

      // Add new report
      existingReports.push(newReport);

      // Save back to local storage
      localStorage.setItem('floodReports', JSON.stringify(existingReports));

      console.log('Flood report saved to local storage:', newReport);
      alert('Report submitted successfully! Thank you for helping improve flood monitoring.');
    } catch (error) {
      console.error('Error saving flood report:', error);
      alert('Error submitting report. Please try again.');
    }
  };

  const getExitMitigationSuggestion = (entrance: SubwayEntrance) => {
    // Simple logic to generate suggestions based on street names
    const streetName = entrance.East_West_Street?.toLowerCase() || '';
    
    if (streetName.includes('14') || streetName.includes('fourteen')) {
      return 'Deploy modular flood barrier at entrance.';
    } else if (streetName.includes('broadway') || streetName.includes('main')) {
      return 'Install permanent flood gates with automatic sensors.';
    } else if (streetName.includes('water') || streetName.includes('river')) {
      return 'Implement elevated walkway and sump pump system.';
    } else {
      return 'Deploy temporary sandbag barriers and install flood sensors.';
    }
  };
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };


  return (
    <div
      className="absolute top-20 right-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 flex flex-col"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{assessment.stationName}</h2>
            <p className="text-sm text-gray-600">Station ID: {assessment.stationId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Flood Risk Assessment</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 border ${getRiskColor(assessment.riskLevel)}`}>
            {getRiskIcon(assessment.riskLevel)}
            <span className="capitalize">{assessment.riskLevel} Risk</span>
          </div>
        </div>

        {/* Predicted Risk */}
        <div className="mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">Predicted Risk</span>
            </div>
            {entrance ? (
              <>
                <p className="text-blue-800 text-lg">
                  {Math.round(assessment.floodProbability * 1.2)}% flooding probability during {assessment.contributingFactors.rainfallIntensity?.toFixed(1) || '2.0'}&quot; /hour rainfall.
                </p>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <span className="font-semibold">Exit Location:</span> {entrance.East_West_Street} & {entrance.North_South_Street}
                  </p>
                  <p className="text-blue-800 text-sm mt-1">
                    <span className="font-semibold">Suggested intervention:</span> {getExitMitigationSuggestion(entrance)}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-blue-800 text-lg">
                {Math.round(assessment.floodProbability)}% flooding probability during {assessment.contributingFactors.rainfallIntensity?.toFixed(1) || '2.0'}&quot; /hour rainfall.
              </p>
            )}
          </div>
        </div>

        {/* Last Major Disruption */}
        {assessment.historicalFloods.length > 0 && (
          <div className="mb-6">
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-lg font-semibold text-orange-900">Last Major Disruption</span>
              </div>
              <p className="text-orange-800 text-lg">
                {assessment.historicalFloods[0].description}, {assessment.historicalFloods[0].date.split('-')[0]}.
              </p>
            </div>
          </div>
        )}

        {/* Suggested Intervention */}
        {assessment.mitigationSuggestions.length > 0 && (
          <div className="mb-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-green-900">Suggested Intervention</span>
              </div>
              <p className="text-green-800 text-lg">
                {assessment.mitigationSuggestions[0].description} at {assessment.stationName} entrance.
              </p>
            </div>
          </div>
        )}

        {/* Risk Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Risk Level</span>
            <span>{Math.round(assessment.floodProbability)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                assessment.riskLevel === 'critical' ? 'bg-red-500' :
                assessment.riskLevel === 'high' ? 'bg-orange-500' :
                assessment.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${assessment.floodProbability}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contributing Factors</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Elevation</span>
            <span className="text-sm font-medium">{assessment.contributingFactors.elevation.toFixed(1)} ft</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Distance to Water</span>
            <span className="text-sm font-medium">{Math.round(assessment.contributingFactors.distanceToWater)}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Impervious Surface</span>
            <span className="text-sm font-medium">{(assessment.contributingFactors.imperviousSurface * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">FEMA Zone</span>
            <span className="text-sm font-medium">{assessment.contributingFactors.femaZone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Drainage Capacity</span>
            <span className="text-sm font-medium">{(assessment.contributingFactors.drainageCapacity * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Historical Floods */}
      {assessment.historicalFloods.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Floods</h3>
          <div className="space-y-3">
            {assessment.historicalFloods.map((flood, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{flood.date}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    flood.severity === 'major' ? 'bg-red-100 text-red-800' :
                    flood.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {flood.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{flood.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Duration: {flood.duration}h</span>
                  <span>Source: {flood.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mitigation Suggestions */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mitigation Suggestions</h3>
        <div className="space-y-4">
          {assessment.mitigationSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {suggestion.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
              
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-gray-600">{formatCurrency(suggestion.cost)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-600">{suggestion.implementationTime}d</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-purple-600" />
                  <span className="text-gray-600">{suggestion.effectiveness}%</span>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Effectiveness</span>
                  <span>{suggestion.effectiveness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${suggestion.effectiveness}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span>Click on map to view other stations</span>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Report Flooding</span>
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          stationId={assessment.stationId}
          stationName={assessment.stationName}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
}
