import React, { useState, useEffect } from 'react';
import { RequestManager } from '../../services/RequestManager';
import { IntelligentCache } from '../../services/IntelligentCache';
import { 
  Activity, 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const [requestStats, setRequestStats] = useState(RequestManager.getStats());
  const [cacheStats, setCacheStats] = useState(IntelligentCache.getStats());
  const [cacheConfig] = useState(IntelligentCache.getConfig());
  const [pendingRequests, setPendingRequests] = useState(0);
  const [batchInfo, setBatchInfo] = useState(RequestManager.getBatchInfo());
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        setRequestStats(RequestManager.getStats());
        setCacheStats(IntelligentCache.getStats());
        setPendingRequests(RequestManager.getPendingRequestCount());
        setBatchInfo(RequestManager.getBatchInfo());
        setOptimizationSuggestions(IntelligentCache.getOptimizationSuggestions());
      } catch (error) {
        console.error('Error updating performance stats:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOptimizeCache = () => {
    RequestManager.optimizeCache();
    setOptimizationSuggestions(IntelligentCache.getOptimizationSuggestions());
  };

  const handleResetStats = () => {
    RequestManager.resetStats();
    setRequestStats(RequestManager.getStats());
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cache? This will remove all cached data.')) {
      IntelligentCache.clear();
      setCacheStats(IntelligentCache.getStats());
    }
  };

  const successRate = requestStats.totalRequests > 0 
    ? (requestStats.successfulRequests / requestStats.totalRequests) * 100 
    : 0;

  const cacheHitRate = requestStats.totalRequests > 0 
    ? (requestStats.cacheHits / requestStats.totalRequests) * 100 
    : 0;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Activity size={32} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Performance Dashboard</h1>
                <p className="text-slate-400 mt-1">Real-time monitoring of application performance and optimization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOptimizeCache}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Optimize Cache"
              >
                <Settings size={24} />
              </button>
              <button
                onClick={() => {
                  setRequestStats(RequestManager.getStats());
                  setCacheStats(IntelligentCache.getStats());
                }}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={24} />
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Requests</p>
                  <p className="text-3xl font-bold text-white mt-2">{requestStats.totalRequests}</p>
                </div>
                <Database size={32} className="text-blue-400" />
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold text-white mt-2">{successRate.toFixed(1)}%</p>
                </div>
                <CheckCircle size={32} className="text-green-400" />
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Cache Hit Rate</p>
                  <p className="text-3xl font-bold text-white mt-2">{cacheHitRate.toFixed(1)}%</p>
                </div>
                <Zap size={32} className="text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Avg Response Time</p>
                  <p className="text-3xl font-bold text-white mt-2">{requestStats.averageResponseTime.toFixed(0)}ms</p>
                </div>
                <Clock size={32} className="text-purple-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Request Statistics */}
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-6">Request Statistics</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Successful Requests</span>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-white font-bold text-lg">{requestStats.successfulRequests}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Failed Requests</span>
                  <div className="flex items-center gap-3">
                    <XCircle size={20} className="text-red-400" />
                    <span className="text-white font-bold text-lg">{requestStats.failedRequests}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Batched Requests</span>
                  <div className="flex items-center gap-3">
                    <TrendingUp size={20} className="text-blue-400" />
                    <span className="text-white font-bold text-lg">{requestStats.batchedRequests}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cache Hits</span>
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-yellow-400" />
                    <span className="text-white font-bold text-lg">{requestStats.cacheHits}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Retries</span>
                  <span className="text-white font-bold text-lg">{requestStats.retryCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Pending Requests</span>
                  <span className="text-white font-bold text-lg">{pendingRequests}</span>
                </div>
              </div>
            </div>

            {/* Cache Statistics */}
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-6">Cache Statistics</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Entries</span>
                  <span className="text-white font-bold text-lg">{cacheStats.totalEntries}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cache Size</span>
                  <span className="text-white font-bold text-lg">
                    {(cacheStats.totalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Hit Rate</span>
                  <span className="text-white font-bold text-lg">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Evictions</span>
                  <span className="text-white font-bold text-lg">{cacheStats.evictions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Compressions</span>
                  <span className="text-white font-bold text-lg">{cacheStats.compressions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Max Size</span>
                  <span className="text-white font-bold text-lg">
                    {(cacheConfig.maxSize / 1024 / 1024).toFixed(0)} MB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Information */}
          {batchInfo.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 mt-8">
              <h3 className="text-xl font-semibold text-white mb-6">Active Batches</h3>
              
              <div className="space-y-4">
                {batchInfo.map((batch) => (
                  <div key={batch.key} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{batch.key}</span>
                      <p className="text-slate-400 text-sm">
                        {batch.count} requests • {Date.now() - batch.oldestRequest}ms old
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-slate-300 text-sm">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {optimizationSuggestions.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 mt-8">
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle size={24} className="text-yellow-400" />
                <h3 className="text-xl font-semibold text-white">Optimization Suggestions</h3>
              </div>
              
              <div className="space-y-4">
                {optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-slate-300 text-lg">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-700">
            <div className="flex items-center gap-4">
              <button
                onClick={handleResetStats}
                className="flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
                Reset Stats
              </button>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-3 px-6 py-3 text-red-300 hover:text-red-200 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Database size={20} />
                Clear Cache
              </button>
            </div>
            
            <div className="text-slate-400 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
