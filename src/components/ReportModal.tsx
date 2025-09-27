'use client';

import { useState } from 'react';
import { X, AlertTriangle, MapPin, Camera, Send } from 'lucide-react';
import { CrowdsourcedReport } from '../types';

interface ReportModalProps {
  stationId: string;
  stationName: string;
  onClose: () => void;
  onSubmit: (report: Omit<CrowdsourcedReport, 'id' | 'timestamp'>) => void;
}

export default function ReportModal({ stationId, stationName, onClose, onSubmit }: ReportModalProps) {
  const [type, setType] = useState<'standing_water' | 'blocked_drain' | 'overflowing_sewer' | 'infrastructure_damage' | 'other'>('standing_water');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major' | 'critical'>('minor');
  const [description, setDescription] = useState('');
  const [reporter, setReporter] = useState('');
  const [waterLevel, setWaterLevel] = useState<number>(0);
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get current location if not set
      if (location.lat === 0 && location.lng === 0) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // Fallback to NYC coordinates
            setLocation({ lat: 40.7589, lng: -73.9851 });
          }
        );
      }

      const report: Omit<CrowdsourcedReport, 'id' | 'timestamp'> = {
        stationId,
        type,
        severity,
        description: description || undefined,
        reporter: reporter || 'Anonymous',
        verified: false,
        location: {
          coordinates: location,
          address: `Near ${stationName}`
        },
        waterLevel: waterLevel > 0 ? waterLevel : undefined
      };

      await onSubmit(report);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'major': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Report Flooding</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Station: {stationName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Severity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flood Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['minor', 'moderate', 'major'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                    severity === level
                      ? getSeverityColor(level)
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className={`w-3 h-3 rounded-full ${
                      level === 'major' ? 'bg-red-500' :
                      level === 'moderate' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="capitalize">{level}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the flooding conditions you're observing..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Reporter Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="Anonymous"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {location.latitude !== 0 ? 
                  `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` :
                  'Getting location...'
                }
              </span>
            </div>
          </div>

          {/* Photo Upload (Future Enhancement) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo Evidence (Coming Soon)
            </label>
            <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Photo upload coming soon</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Your report will help improve flood monitoring and emergency response.
            All reports are verified before being displayed.
          </p>
        </div>
      </div>
    </div>
  );
}
