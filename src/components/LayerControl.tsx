'use client';

interface LayerControlProps {
  layers: {
    subwayEntrances: boolean;
    floodZones: boolean;
    femaZones: boolean;
    mtaAlerts: boolean;
    floodReports: boolean;
  };
  onLayerToggle: (layer: keyof LayerControlProps['layers']) => void;
  onShowRiskRanking: () => void;
}

export default function LayerControl({ layers, onLayerToggle, onShowRiskRanking }: LayerControlProps) {
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="font-bold text-gray-800 mb-3">Map Layers</h3>
      
      {/* Layer Toggles */}
      <div className="space-y-3">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={layers.subwayEntrances}
            onChange={() => onLayerToggle('subwayEntrances')}
            className="mr-3"
          />
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm">Subway Entrances</span>
          </div>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={layers.floodZones}
            onChange={() => onLayerToggle('floodZones')}
            className="mr-3"
          />
          <div className="flex items-center">
            <div className="w-4 h-4 bg-cyan-500 rounded mr-2"></div>
            <span className="text-sm">NYC Stormwater Floods</span>
          </div>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={layers.femaZones}
            onChange={() => onLayerToggle('femaZones')}
            className="mr-3"
          />
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
            <span className="text-sm">FEMA Flood Zones</span>
          </div>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={layers.mtaAlerts}
            onChange={() => onLayerToggle('mtaAlerts')}
            className="mr-3"
          />
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span className="text-sm">MTA Alerts</span>
          </div>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={layers.floodReports}
            onChange={() => onLayerToggle('floodReports')}
            className="mr-3"
          />
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm">Crowd Reports</span>
          </div>
        </label>
      </div>

      {/* Risk Ranking Button */}
      <div className="mt-4 pt-3 border-t">
        <button
          onClick={onShowRiskRanking}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors text-sm font-semibold"
        >
          Show Risk Ranking
        </button>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Flood Risk Colors:</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Extreme Risk</span>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="mt-4 pt-3 border-t">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Data Sources:</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• NYC Open Data</div>
          <div>• FEMA Flood Maps</div>
          <div>• MTA GTFS-Realtime</div>
          <div>• Crowd-Sourced Reports</div>
        </div>
      </div>
    </div>
  );
}
