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
    <div className="w-full h-full overflow-y-auto">
      {/* Station Header */}
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-900">{assessment.stationName}</h2>
        {entrance && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 flex items-start">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{entrance.East_West_Street} & {entrance.North_South_Street}</span>
            </p>
          </div>
        )}
        
        {/* Risk Level Badge */}
        <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          assessment.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
          assessment.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
          assessment.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {assessment.riskLevel.charAt(0).toUpperCase() + assessment.riskLevel.slice(1)} Risk
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
          <div className="px-4 pb-4">
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

      {/* Contributing Factors */}
      <div className="px-4 pb-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Contributing Factors</h3>
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
      </div>

      {/* Mitigation Actions */}
      <div className="px-4 pb-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h3>
          <ul className="space-y-3">
            {assessment.mitigationSuggestions?.slice(0, 3).map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700">{suggestion.description}</span>
              </li>
            ))}
            {entrance && (
              <li className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
                <span className="ml-3 text-sm text-gray-700">
                  {getExitMitigationSuggestion(entrance)}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Report Button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowReportModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors shadow-md"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Report Flooding</span>
        </button>
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
    </div>
  );
};
