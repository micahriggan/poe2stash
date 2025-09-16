import React, { useState, useEffect } from 'react';
import { PriceCheckHistory, PriceCheckHistoryEntry, PriceCheckAnalytics as PriceCheckAnalyticsType } from '../services/PriceCheckHistory';
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
  RefreshCw,
  X
} from 'lucide-react';

interface PriceCheckAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PriceCheckAnalytics: React.FC<PriceCheckAnalyticsProps> = ({
  isOpen,
  onClose,
}) => {
  const [analytics, setAnalytics] = useState<PriceCheckAnalyticsType | null>(null);
  const [recentHistory, setRecentHistory] = useState<PriceCheckHistoryEntry[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'insights'>('overview');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const analyticsData = PriceCheckHistory.getAnalytics();
    const historyData = PriceCheckHistory.getRecentHistory(20);
    const insightsData = PriceCheckHistory.getLearningInsights();
    
    setAnalytics(analyticsData);
    setRecentHistory(historyData);
    setInsights(insightsData);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Price Check Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900/50 border-r border-slate-700 p-4">
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'history', label: 'Recent History', icon: '📝' },
                { id: 'insights', label: 'AI Insights', icon: '🧠' },
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

            {/* Export/Import Actions */}
            <div className="mt-8 pt-4 border-t border-slate-700">
              <h4 className="text-white font-medium mb-3">Data Management</h4>
              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Export History
                </button>
                <label className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer">
                  <Upload size={16} />
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Clear History
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'overview' && analytics && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Total Checks</p>
                        <p className="text-2xl font-bold text-white">{analytics.totalChecks}</p>
                      </div>
                      <Database size={24} className="text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Avg Confidence</p>
                        <p className="text-2xl font-bold text-white">{Math.round(analytics.averageConfidence * 100)}%</p>
                      </div>
                      <Target size={24} className="text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Avg Search Time</p>
                        <p className="text-2xl font-bold text-white">{Math.round(analytics.averageSearchTime)}ms</p>
                      </div>
                      <Clock size={24} className="text-yellow-400" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Cache Hit Rate</p>
                        <p className="text-2xl font-bold text-white">{Math.round(analytics.cacheHitRate * 100)}%</p>
                      </div>
                      <TrendingUp size={24} className="text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Accuracy by Confidence */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">Accuracy by Confidence Level</h4>
                  <div className="space-y-3">
                    {Object.entries(analytics.accuracyByConfidence).map(([range, accuracy]) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-slate-300">{range}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-600 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${accuracy * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-medium w-12 text-right">
                            {Math.round(accuracy * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Searched Items */}
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">Most Searched Item Types</h4>
                  <div className="space-y-2">
                    {analytics.mostSearchedItems.slice(0, 10).map((item) => (
                      <div key={item.itemType} className="flex items-center justify-between">
                        <span className="text-slate-300 truncate flex-1">{item.itemType}</span>
                        <span className="text-white font-medium ml-4">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">Recent Price Checks</h3>
                
                <div className="space-y-3">
                  {recentHistory.map((entry) => (
                    <div key={entry.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{entry.itemName}</h4>
                        <span className="text-slate-400 text-sm">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Price:</span>
                          <span className="text-white ml-2">
                            {entry.result.estimate.price.amount.toFixed(1)} {entry.result.estimate.price.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Confidence:</span>
                          <span className="text-white ml-2">
                            {Math.round(entry.result.estimate.confidence * 100)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Search Time:</span>
                          <span className="text-white ml-2">{entry.searchMetadata.searchTime}ms</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Sample Size:</span>
                          <span className="text-white ml-2">{entry.result.estimate.sampleSize}</span>
                        </div>
                      </div>
                      
                      {entry.userFeedback && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">User Feedback:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
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
              </div>
            )}

            {activeTab === 'insights' && insights && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
                
                <div className="bg-slate-700/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb size={24} className="text-yellow-400" />
                    <h4 className="text-white font-semibold">Recommended Settings</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Roll Tolerance</p>
                      <p className="text-2xl font-bold text-white">{insights.recommendedTolerance}%</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Based on your search patterns and fallback usage
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-2">Confidence Threshold</p>
                      <p className="text-2xl font-bold text-white">{Math.round(insights.confidenceThreshold * 100)}%</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Optimal threshold for your accuracy requirements
                      </p>
                    </div>
                  </div>
                </div>

                {insights.performanceTips.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">Performance Tips</h4>
                    <div className="space-y-3">
                      {insights.performanceTips.map((tip: string, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-slate-300">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
