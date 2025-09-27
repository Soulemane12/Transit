'use client';

import { Clock, Droplets, AlertTriangle } from 'lucide-react';

interface ForecastSliderProps {
  value: number;
  onChange: (hours: number) => void;
  maxHours: number;
}

export default function ForecastSlider({ value, onChange, maxHours }: ForecastSliderProps) {
  const getTimeLabel = (hours: number) => {
    if (hours === 0) return 'Now';
    if (hours < 24) return `+${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `+${days}d ${remainingHours}h`;
  };

  const getWeatherCondition = (hours: number) => {
    // Mock weather conditions based on forecast time
    if (hours < 2) return { condition: 'Clear', intensity: 0, icon: '☀️' };
    if (hours < 6) return { condition: 'Light Rain', intensity: 0.5, icon: '🌦️' };
    if (hours < 12) return { condition: 'Moderate Rain', intensity: 1.2, icon: '🌧️' };
    if (hours < 18) return { condition: 'Heavy Rain', intensity: 2.5, icon: '⛈️' };
    return { condition: 'Storm', intensity: 3.8, icon: '🌪️' };
  };

  const getRiskLevel = (hours: number) => {
    const weather = getWeatherCondition(hours);
    if (weather.intensity > 3) return 'critical';
    if (weather.intensity > 2) return 'high';
    if (weather.intensity > 1) return 'medium';
    return 'low';
  };

  const weather = getWeatherCondition(value);
  const riskLevel = getRiskLevel(value);

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-gray-200/50 z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Forecast Timeline</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{weather.icon}</span>
          <div>
            <div className="text-sm font-medium text-gray-900">{weather.condition}</div>
            <div className="text-xs text-gray-600">{weather.intensity.toFixed(1)} in/hr</div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={maxHours}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Now</span>
          <span>{getTimeLabel(value)}</span>
          <span>{getTimeLabel(maxHours)}</span>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Rainfall Intensity</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-600">Risk Level</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            weather.intensity > 2 ? 'bg-red-100 text-red-800' :
            weather.intensity > 1 ? 'bg-orange-100 text-orange-800' :
            weather.intensity > 0.5 ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {weather.intensity.toFixed(1)} in/hr
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
            riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
            riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {riskLevel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Quick Time Buttons */}
      <div className="mt-4 flex space-x-2">
        {[0, 6, 12, 18, 24].map((hours) => (
          <button
            key={hours}
            onClick={() => onChange(hours)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              value === hours
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getTimeLabel(hours)}
          </button>
        ))}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
