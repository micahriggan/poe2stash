import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { PriceCheckSettings, DEFAULT_PRICE_CHECK_SETTINGS } from '../../types/PriceCheckSettings';
import { Settings, Save, RotateCcw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { priceCheckSettings, setPriceCheckSettings } = useAppContext();
  const [settings, setSettings] = useState<PriceCheckSettings>(priceCheckSettings);
  const [activeTab, setActiveTab] = useState<'rollTolerance' | 'searchStrategy' | 'confidence' | 'advanced'>('rollTolerance');

  useEffect(() => {
    setSettings(priceCheckSettings);
  }, [priceCheckSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const [category, key] = name.split('.');

    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof PriceCheckSettings],
        [key]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
      },
    }));
  };

  const handleSave = () => {
    setPriceCheckSettings(settings);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    setSettings(DEFAULT_PRICE_CHECK_SETTINGS);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Settings size={32} className="text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Price Check Settings</h1>
                <p className="text-slate-400 mt-1">Configure price checking behavior and optimization settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-3 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                <RotateCcw size={20} />
                Reset
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Save size={20} />
                Save Settings
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700 mb-8">
            {[
              { id: 'rollTolerance', label: 'Roll Tolerance', icon: '🎯' },
              { id: 'searchStrategy', label: 'Search Strategy', icon: '🔍' },
              { id: 'confidence', label: 'Confidence', icon: '📊' },
              { id: 'advanced', label: 'Advanced', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-400 border-green-500'
                    : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-w-4xl">
            {activeTab === 'rollTolerance' && (
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-semibold text-white mb-6">Roll Tolerance</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="rollTolerance.enabled"
                      checked={settings.rollTolerance.enabled}
                      onChange={handleChange}
                      className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                    />
                    <label className="text-slate-300 text-lg">Enable Roll Tolerance</label>
                  </div>
                  
                  {settings.rollTolerance.enabled && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-medium text-slate-300 mb-3">
                          Percentage Tolerance: {settings.rollTolerance.percentage}%
                        </label>
                        <input
                          type="range"
                          name="rollTolerance.percentage"
                          min="0"
                          max="50"
                          value={settings.rollTolerance.percentage}
                          onChange={handleChange}
                          className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <div className="flex justify-between text-sm text-slate-400 mt-2">
                          <span>0% (Exact)</span>
                          <span>50% (Very Loose)</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg font-medium text-slate-300 mb-3">
                            Minimum Rolls to Consider
                          </label>
                          <input
                            type="number"
                            name="rollTolerance.minRolls"
                            min="1"
                            max="10"
                            value={settings.rollTolerance.minRolls}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-lg font-medium text-slate-300 mb-3">
                            Maximum Rolls to Consider
                          </label>
                          <input
                            type="number"
                            name="rollTolerance.maxRolls"
                            min="1"
                            max="10"
                            value={settings.rollTolerance.maxRolls}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'searchStrategy' && (
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-semibold text-white mb-6">Search Strategy</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-slate-300 mb-3">
                      Maximum Results per Search
                    </label>
                    <input
                      type="number"
                      name="searchSettings.maxResults"
                      min="1"
                      max="50"
                      value={settings.searchSettings.maxResults}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium text-slate-300 mb-3">
                      Minimum Results Before Fallback
                    </label>
                    <input
                      type="number"
                      name="searchSettings.minResults"
                      min="1"
                      max="20"
                      value={settings.searchSettings.minResults}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="searchSettings.fallbackEnabled"
                      checked={settings.searchSettings.fallbackEnabled}
                      onChange={handleChange}
                      className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                    />
                    <label className="text-slate-300 text-lg">Enable Fallback Search</label>
                  </div>
                  
                  {settings.searchSettings.fallbackEnabled && (
                    <div>
                      <label className="block text-lg font-medium text-slate-300 mb-3">
                        Fallback Steps
                      </label>
                      <input
                        type="number"
                        name="searchSettings.fallbackSteps"
                        min="1"
                        max="10"
                        value={settings.searchSettings.fallbackSteps}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-lg font-medium text-slate-300 mb-3">
                      API Rate Limit (ms)
                    </label>
                    <input
                      type="number"
                      name="advanced.rateLimitDelay"
                      min="100"
                      max="5000"
                      step="100"
                      value={settings.advanced.rateLimitDelay}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'confidence' && (
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-semibold text-white mb-6">Confidence Scoring</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="confidence.enabled"
                      checked={settings.confidence.enabled}
                      onChange={handleChange}
                      className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                    />
                    <label className="text-slate-300 text-lg">Enable Confidence Scoring</label>
                  </div>
                  
                  {settings.confidence.enabled && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-lg font-medium text-slate-300 mb-3">
                          Minimum Confidence Threshold: {Math.round(settings.confidence.minConfidence * 100)}%
                        </label>
                        <input
                          type="range"
                          name="confidence.minConfidence"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.confidence.minConfidence}
                          onChange={handleChange}
                          className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          name="confidence.showConfidence"
                          checked={settings.confidence.showConfidence}
                          onChange={handleChange}
                          className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                        />
                        <label className="text-slate-300 text-lg">Show Confidence in UI</label>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-medium text-white mb-4">Weight Factors</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-slate-300 mb-2">Roll Match</label>
                            <input
                              type="range"
                              name="confidence.confidenceFactors.rollMatch"
                              min="0"
                              max="1"
                              step="0.1"
                              value={settings.confidence.confidenceFactors.rollMatch}
                              onChange={handleChange}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-2">Base Type Match</label>
                            <input
                              type="range"
                              name="confidence.confidenceFactors.baseType"
                              min="0"
                              max="1"
                              step="0.1"
                              value={settings.confidence.confidenceFactors.baseType}
                              onChange={handleChange}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-2">Rarity Match</label>
                            <input
                              type="range"
                              name="confidence.confidenceFactors.rarity"
                              min="0"
                              max="1"
                              step="0.1"
                              value={settings.confidence.confidenceFactors.rarity}
                              onChange={handleChange}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-300 mb-2">Item Level Match</label>
                            <input
                              type="range"
                              name="confidence.confidenceFactors.itemLevel"
                              min="0"
                              max="1"
                              step="0.1"
                              value={settings.confidence.confidenceFactors.itemLevel}
                              onChange={handleChange}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-semibold text-white mb-6">Advanced Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-slate-300 mb-3">
                      Price Calculation Method
                    </label>
                    <select
                      name="priceEstimation.method"
                      value={settings.priceEstimation.method}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="mean">Mean (Average)</option>
                      <option value="median">Median</option>
                      <option value="weighted">Weighted Average</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="priceEstimation.outlierRemoval"
                      checked={settings.priceEstimation.outlierRemoval}
                      onChange={handleChange}
                      className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                    />
                    <label className="text-slate-300 text-lg">Enable Outlier Removal</label>
                  </div>
                  
                  {settings.priceEstimation.outlierRemoval && (
                    <div>
                      <label className="block text-lg font-medium text-slate-300 mb-3">
                        Outlier Removal Threshold: {settings.priceEstimation.outlierThreshold}σ
                      </label>
                      <input
                        type="range"
                        name="priceEstimation.outlierThreshold"
                        min="0"
                        max="5"
                        step="0.5"
                        value={settings.priceEstimation.outlierThreshold}
                        onChange={handleChange}
                        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                      <div className="flex justify-between text-sm text-slate-400 mt-2">
                        <span>0σ (No removal)</span>
                        <span>5σ (Very strict)</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="advanced.cacheResults"
                      checked={settings.advanced.cacheResults}
                      onChange={handleChange}
                      className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                    />
                    <label className="text-slate-300 text-lg">Cache Results</label>
                  </div>
                  
                  {settings.advanced.cacheResults && (
                    <div>
                      <label className="block text-lg font-medium text-slate-300 mb-3">
                        Cache Duration (minutes)
                      </label>
                      <input
                        type="number"
                        name="advanced.cacheDuration"
                        min="1"
                        max="1440"
                        value={settings.advanced.cacheDuration}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-lg font-medium text-slate-300 mb-3">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      name="advanced.retryAttempts"
                      min="0"
                      max="10"
                      value={settings.advanced.retryAttempts}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
