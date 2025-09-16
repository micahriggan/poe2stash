import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { PriceCheckSettings, DEFAULT_PRICE_CHECK_SETTINGS } from '../../types/PriceCheckSettings';
import { Settings, Save, RotateCcw, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { priceCheckSettings, setPriceCheckSettings } = useAppContext();
  const [settings, setSettings] = useState<PriceCheckSettings>(priceCheckSettings);

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

          {/* Single Tab Content */}
          <div className="max-w-6xl">
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
              <div className="space-y-12">
                
                {/* Roll Tolerance Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Roll Tolerance</h3>
                      <p className="text-slate-400">Configure how strictly items must match mod rolls</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <input
                        type="checkbox"
                        name="rollTolerance.enabled"
                        checked={settings.rollTolerance.enabled}
                        onChange={handleChange}
                        className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <label className="text-slate-300 text-lg font-medium">Enable Roll Tolerance</label>
                        <p className="text-slate-400 text-sm">Allow items with similar but not identical mod rolls to be considered matches</p>
                      </div>
                    </div>
                    
                    {settings.rollTolerance.enabled && (
                      <div className="space-y-6 pl-10">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <label className="text-lg font-medium text-slate-300">
                              Percentage Tolerance: {settings.rollTolerance.percentage}%
                            </label>
                            <div className="group relative">
                              <Info size={16} className="text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                How much variation in mod values is acceptable. 0% = exact match only, 50% = very loose matching
                              </div>
                            </div>
                          </div>
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
                            <div className="flex items-center gap-2 mb-3">
                              <label className="text-lg font-medium text-slate-300">Minimum Rolls to Consider</label>
                              <div className="group relative">
                                <Info size={16} className="text-slate-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  Minimum number of mods that must match for an item to be considered similar
                                </div>
                              </div>
                            </div>
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
                            <div className="flex items-center gap-2 mb-3">
                              <label className="text-lg font-medium text-slate-300">Maximum Rolls to Consider</label>
                              <div className="group relative">
                                <Info size={16} className="text-slate-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  Maximum number of mods to compare when looking for similar items
                                </div>
                              </div>
                            </div>
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

                {/* Search Strategy Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Search Strategy</h3>
                      <p className="text-slate-400">Configure how the system searches for similar items</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <label className="text-lg font-medium text-slate-300">Maximum Results per Search</label>
                        <div className="group relative">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Maximum number of similar items to fetch from the trade API per search query
                          </div>
                        </div>
                      </div>
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
                      <div className="flex items-center gap-2 mb-3">
                        <label className="text-lg font-medium text-slate-300">Minimum Results Before Fallback</label>
                        <div className="group relative">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            If fewer results are found, the system will try broader search strategies
                          </div>
                        </div>
                      </div>
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
                      <div>
                        <label className="text-slate-300 text-lg font-medium">Enable Fallback Search</label>
                        <p className="text-slate-400 text-sm">Use broader search criteria when initial searches don't find enough results</p>
                      </div>
                    </div>
                    
                    {settings.searchSettings.fallbackEnabled && (
                      <div className="pl-10">
                        <div className="flex items-center gap-2 mb-3">
                          <label className="text-lg font-medium text-slate-300">Fallback Steps</label>
                          <div className="group relative">
                            <Info size={16} className="text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              Number of progressively broader search attempts to make
                            </div>
                          </div>
                        </div>
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
                      <div className="flex items-center gap-2 mb-3">
                        <label className="text-lg font-medium text-slate-300">API Rate Limit (ms)</label>
                        <div className="group relative">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Delay between API requests to avoid rate limiting. Higher values = slower but more reliable
                          </div>
                        </div>
                      </div>
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

                {/* Confidence Scoring Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Confidence Scoring</h3>
                      <p className="text-slate-400">Configure how confident the system should be in its price estimates</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <input
                        type="checkbox"
                        name="confidence.enabled"
                        checked={settings.confidence.enabled}
                        onChange={handleChange}
                        className="form-checkbox h-6 w-6 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                      />
                      <div>
                        <label className="text-slate-300 text-lg font-medium">Enable Confidence Scoring</label>
                        <p className="text-slate-400 text-sm">Calculate and display confidence levels for price estimates based on match quality</p>
                      </div>
                    </div>
                    
                    {settings.confidence.enabled && (
                      <div className="space-y-6 pl-10">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <label className="text-lg font-medium text-slate-300">
                              Minimum Confidence Threshold: {Math.round(settings.confidence.minConfidence * 100)}%
                            </label>
                            <div className="group relative">
                              <Info size={16} className="text-slate-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Only show price estimates that meet this confidence level. Higher = more accurate but fewer results
                              </div>
                            </div>
                          </div>
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
                          <div>
                            <label className="text-slate-300 text-lg font-medium">Show Confidence in UI</label>
                            <p className="text-slate-400 text-sm">Display confidence percentages next to price estimates in the item list</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-medium text-white mb-4">Confidence Weight Factors</h4>
                          <p className="text-slate-400 text-sm mb-4">Adjust how much each factor contributes to the overall confidence score</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-slate-300">Roll Match</label>
                                <div className="group relative">
                                  <Info size={14} className="text-slate-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    How well mod values match
                                  </div>
                                </div>
                              </div>
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
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-slate-300">Base Type Match</label>
                                <div className="group relative">
                                  <Info size={14} className="text-slate-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Item base type similarity
                                  </div>
                                </div>
                              </div>
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
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-slate-300">Rarity Match</label>
                                <div className="group relative">
                                  <Info size={14} className="text-slate-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Item rarity similarity
                                  </div>
                                </div>
                              </div>
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
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-slate-300">Item Level Match</label>
                                <div className="group relative">
                                  <Info size={14} className="text-slate-400 cursor-help" />
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Item level similarity
                                  </div>
                                </div>
                              </div>
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

                {/* Advanced Settings Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Advanced Settings</h3>
                      <p className="text-slate-400">Fine-tune price calculation and caching behavior</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-6 space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <label className="text-lg font-medium text-slate-300">Price Calculation Method</label>
                        <div className="group relative">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            How to calculate the final price from multiple similar items. Mean = average, Median = middle value, Weighted = confidence-weighted average
                          </div>
                        </div>
                      </div>
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
                      <div>
                        <label className="text-slate-300 text-lg font-medium">Enable Outlier Removal</label>
                        <p className="text-slate-400 text-sm">Remove unusually high or low prices that might skew the estimate</p>
                      </div>
                    </div>
                    
                    {settings.priceEstimation.outlierRemoval && (
                      <div className="pl-10">
                        <div className="flex items-center gap-2 mb-3">
                          <label className="text-lg font-medium text-slate-300">
                            Outlier Removal Threshold: {settings.priceEstimation.outlierThreshold}σ
                          </label>
                          <div className="group relative">
                            <Info size={16} className="text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              Standard deviations from the mean. Higher values = more lenient outlier removal
                            </div>
                          </div>
                        </div>
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
                      <div>
                        <label className="text-slate-300 text-lg font-medium">Cache Results</label>
                        <p className="text-slate-400 text-sm">Store price check results to avoid re-checking the same items</p>
                      </div>
                    </div>
                    
                    {settings.advanced.cacheResults && (
                      <div className="pl-10">
                        <div className="flex items-center gap-2 mb-3">
                          <label className="text-lg font-medium text-slate-300">Cache Duration (minutes)</label>
                          <div className="group relative">
                            <Info size={16} className="text-slate-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              How long to keep cached results before re-checking prices
                            </div>
                          </div>
                        </div>
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
                      <div className="flex items-center gap-2 mb-3">
                        <label className="text-lg font-medium text-slate-300">Retry Attempts</label>
                        <div className="group relative">
                          <Info size={16} className="text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Number of times to retry failed API requests before giving up
                          </div>
                        </div>
                      </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
