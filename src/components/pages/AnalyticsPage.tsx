import React, { useState, useEffect } from 'react';
import { PriceCheckHistory, PriceCheckHistoryEntry, PriceCheckAnalytics as PriceCheckAnalyticsType } from '../../services/PriceCheckHistory';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Database, 
  Lightbulb,
  Download,
  Upload,
  Trash2,
  RefreshCw
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<PriceCheckAnalyticsType | null>(null);
  const [recentHistory, setRecentHistory] = useState<PriceCheckHistoryEntry[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'insights'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const analyticsData = PriceCheckHistory.getAnalytics();
      const historyData = PriceCheckHistory.getRecentHistory(20);
      const insightsData = PriceCheckHistory.getLearningInsights();
      
      setAnalytics(analyticsData);
      setRecentHistory(historyData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const handleExport = () => {
    const data = PriceCheckHistory.exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-check-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = PriceCheckHistory.importHistory(content);
        if (success) {
          loadData();
          alert('History imported successfully!');
        } else {
          alert('Failed to import history. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all price check history? This action cannot be undone.')) {
      PriceCheckHistory.clearHistory();
      loadData();
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <BarChart3 size={32} className="text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Price Check Analytics</h1>
                <p className="text-slate-400 mt-1">Comprehensive analysis of your price checking performance</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={24} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700 mb-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'history', label: 'Recent History', icon: '📝' },
              { id: 'insights', label: 'AI Insights', icon: '🧠' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-purple-500'
                    : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {activeTab === 'overview' && analytics && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Checks</p>
                        <p className="text-3xl font-bold text-white mt-2">{analytics.totalChecks}</p>
                      </div>
                      <Database size={32} className="text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Avg Confidence</p>
                        <p className="text-3xl font-bold text-white mt-2">{Math.round(analytics.averageConfidence * 100)}%</p>
                      </div>
                      <Target size={32} className="text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Avg Search Time</p>
                        <p className="text-3xl font-bold text-white mt-2">{Math.round(analytics.averageSearchTime)}ms</p>
                      </div>
                      <Clock size={32} className="text-yellow-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Cache Hit Rate</p>
                        <p className="text-3xl font-bold text-white mt-2">{Math.round(analytics.cacheHitRate * 100)}%</p>
                      </div>
                      <TrendingUp size={32} className="text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Accuracy by Confidence */}
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-6">Accuracy by Confidence Level</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.accuracyByConfidence).map(([range, accuracy]) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">{range}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-slate-600 rounded-full h-3">
                            <div 
                              className="bg-green-500 h-3 rounded-full transition-all"
                              style={{ width: `${accuracy * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-bold w-16 text-right">
                            {Math.round(accuracy * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Searched Items */}
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-6">Most Searched Item Types</h3>
                  <div className="space-y-3">
                    {analytics.mostSearchedItems.slice(0, 10).map((item) => (
                      <div key={item.itemType} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-slate-300 truncate flex-1">{item.itemType}</span>
                        <span className="text-white font-bold ml-4 bg-purple-500/20 px-3 py-1 rounded-full">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'history' && (
              <>
                <h3 className="text-2xl font-semibold text-white mb-6">Recent Price Checks</h3>
                <div className="space-y-4">
                  {recentHistory.map((entry) => (
                    <div key={entry.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">{entry.itemName}</h4>
                        <span className="text-slate-400 text-sm">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Price:</span>
                          <span className="text-white ml-2 font-medium">
                            {entry.result.estimate.price.amount.toFixed(1)} {entry.result.estimate.price.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Confidence:</span>
                          <span className="text-white ml-2 font-medium">
                            {Math.round(entry.result.estimate.confidence * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Search Time:</span>
                          <span className="text-white ml-2 font-medium">{entry.searchMetadata.searchTime}ms</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Sample Size:</span>
                          <span className="text-white ml-2 font-medium">{entry.result.estimate.sampleSize}</span>
                        </div>
                      </div>
                      
                      {entry.userFeedback && (
                        <div className="mt-4 pt-4 border-t border-slate-600">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">User Feedback:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              entry.userFeedback.accuracy === 'accurate' ? 'bg-green-500/20 text-green-300' :
                              entry.userFeedback.accuracy === 'overpriced' ? 'bg-red-500/20 text-red-300' :
                              entry.userFeedback.accuracy === 'underpriced' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {entry.userFeedback.accuracy}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'insights' && insights && (
              <>
                <h3 className="text-2xl font-semibold text-white mb-6">AI-Powered Insights</h3>
                
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                  <div className="flex items-center gap-4 mb-6">
                    <Lightbulb size={32} className="text-yellow-400" />
                    <h4 className="text-xl font-semibold text-white">Recommended Settings</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Roll Tolerance</p>
                      <p className="text-4xl font-bold text-white">{insights.recommendedTolerance}%</p>
                      <p className="text-slate-400 text-sm mt-2">
                        Based on your search patterns and fallback usage
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Confidence Threshold</p>
                      <p className="text-4xl font-bold text-white">{Math.round(insights.confidenceThreshold * 100)}%</p>
                      <p className="text-slate-400 text-sm mt-2">
                        Optimal threshold for your accuracy requirements
                      </p>
                    </div>
                  </div>
                </div>

                {insights.performanceTips.length > 0 && (
                  <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
                    <h4 className="text-xl font-semibold text-white mb-6">Performance Tips</h4>
                    <div className="space-y-4">
                      {insights.performanceTips.map((tip: string, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="w-3 h-3 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-slate-300 text-lg">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Data Management */}
          <div className="mt-12 pt-8 border-t border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-6">Data Management</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleExport}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download size={20} />
                Export History
              </button>
              <label className="flex items-center gap-3 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer">
                <Upload size={20} />
                Import History
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleClearHistory}
                className="flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 size={20} />
                Clear History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
