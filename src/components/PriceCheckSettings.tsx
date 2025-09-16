import React, { useState, useEffect } from 'react';
import { PriceCheckSettings, DEFAULT_PRICE_CHECK_SETTINGS } from '../types/PriceCheckSettings';
import { Settings, X, Save, RotateCcw } from 'lucide-react';

interface PriceCheckSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PriceCheckSettings) => void;
  currentSettings?: PriceCheckSettings;
}

export const PriceCheckSettingsPanel: React.FC<PriceCheckSettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings = DEFAULT_PRICE_CHECK_SETTINGS,
}) => {
  const [settings, setSettings] = useState<PriceCheckSettings>(currentSettings);
  const [activeTab, setActiveTab] = useState<'tolerance' | 'search' | 'confidence' | 'advanced'>('tolerance');

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(DEFAULT_PRICE_CHECK_SETTINGS);
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Settings size={24} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Price Check Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900/50 border-r border-slate-700 p-4">
            <nav className="space-y-2">
              {[
                { id: 'tolerance', label: 'Roll Tolerance', icon: '🎯' },
                { id: 'search', label: 'Search Settings', icon: '🔍' },
                { id: 'confidence', label: 'Confidence', icon: '📊' },
                { id: 'advanced', label: 'Advanced', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'tolerance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Roll Tolerance Settings</h3>
                  <p className="text-slate-400 mb-6">
                    Configure how strictly the price checker matches item rolls. Higher tolerance finds more similar items but may be less accurate.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium">Enable Roll Tolerance</label>
                    <input
                      type="checkbox"
                      checked={settings.rollTolerance.enabled}
                      onChange={(e) => updateSettings('rollTolerance.enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Tolerance Percentage: {settings.rollTolerance.percentage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={settings.rollTolerance.percentage}
                      onChange={(e) => updateSettings('rollTolerance.percentage', parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>Exact (0%)</span>
                      <span>Loose (50%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Minimum Matching Rolls</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.rollTolerance.minRolls}
                        onChange={(e) => updateSettings('rollTolerance.minRolls', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Maximum Rolls to Consider</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.rollTolerance.maxRolls}
                        onChange={(e) => updateSettings('rollTolerance.maxRolls', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Search Settings</h3>
                  <p className="text-slate-400 mb-6">
                    Configure how the price checker searches for similar items and handles fallback scenarios.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Maximum Results</label>
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={settings.searchSettings.maxResults}
                        onChange={(e) => updateSettings('searchSettings.maxResults', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2">Minimum Results</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={settings.searchSettings.minResults}
                        onChange={(e) => updateSettings('searchSettings.minResults', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium">Enable Fallback Searches</label>
                    <input
                      type="checkbox"
                      checked={settings.searchSettings.fallbackEnabled}
                      onChange={(e) => updateSettings('searchSettings.fallbackEnabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Fallback Steps</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={settings.searchSettings.fallbackSteps}
                      onChange={(e) => updateSettings('searchSettings.fallbackSteps', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Number of progressively broader searches to try when exact matches fail
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'confidence' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Confidence Scoring</h3>
                  <p className="text-slate-400 mb-6">
                    Configure how confidence scores are calculated and displayed for price estimates.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium">Enable Confidence Scoring</label>
                    <input
                      type="checkbox"
                      checked={settings.confidence.enabled}
                      onChange={(e) => updateSettings('confidence.enabled', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Minimum Confidence: {Math.round(settings.confidence.minConfidence * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.confidence.minConfidence}
                      onChange={(e) => updateSettings('confidence.minConfidence', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Only show price estimates above this confidence level
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium">Show Confidence in UI</label>
                    <input
                      type="checkbox"
                      checked={settings.confidence.showConfidence}
                      onChange={(e) => updateSettings('confidence.showConfidence', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <h4 className="text-white font-medium mb-3">Confidence Factors</h4>
                    <div className="space-y-3">
                      {Object.entries(settings.confidence.confidenceFactors).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-white font-medium mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}: {Math.round(value * 100)}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={value}
                            onChange={(e) => updateSettings(`confidence.confidenceFactors.${key}`, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>
                  <p className="text-slate-400 mb-6">
                    Configure advanced price checking behavior and performance settings.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Price Calculation Method</label>
                    <select
                      value={settings.priceEstimation.method}
                      onChange={(e) => updateSettings('priceEstimation.method', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="mean">Mean (Average)</option>
                      <option value="median">Median</option>
                      <option value="weighted">Weighted Average</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium">Remove Outlier Prices</label>
                    <input
                      type="checkbox"
                      checked={settings.priceEstimation.outlierRemoval}
                      onChange={(e) => updateSettings('priceEstimation.outlierRemoval', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Outlier Threshold</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.5"
                      value={settings.priceEstimation.outlierThreshold}
                      onChange={(e) => updateSettings('priceEstimation.outlierThreshold', parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Standard deviations for outlier detection
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-white font-medium">Cache Results</label>
                    <input
                      type="checkbox"
                      checked={settings.advanced.cacheResults}
                      onChange={(e) => updateSettings('advanced.cacheResults', e.target.checked)}
                      className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Cache Duration (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={settings.advanced.cacheDuration}
                      onChange={(e) => updateSettings('advanced.cacheDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Rate Limit Delay (ms)</label>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      step="100"
                      value={settings.advanced.rateLimitDelay}
                      onChange={(e) => updateSettings('advanced.rateLimitDelay', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Delay between API calls to avoid rate limiting
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
