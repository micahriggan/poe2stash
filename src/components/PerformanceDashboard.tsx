import React, { useState, useEffect } from 'react';
import { RequestManager } from '../services/RequestManager';
import { IntelligentCache } from '../services/IntelligentCache';
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
  Settings,
  X
} from 'lucide-react';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const [requestStats, setRequestStats] = useState(RequestManager.getStats());
  const [cacheStats, setCacheStats] = useState(IntelligentCache.getStats());
  const [cacheConfig] = useState(IntelligentCache.getConfig());
  const [pendingRequests, setPendingRequests] = useState(0);
  const [batchInfo, setBatchInfo] = useState(RequestManager.getBatchInfo());
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setRequestStats(RequestManager.getStats());
        setCacheStats(IntelligentCache.getStats());
        setPendingRequests(RequestManager.getPendingRequestCount());
        setBatchInfo(RequestManager.getBatchInfo());
        setOptimizationSuggestions(IntelligentCache.getOptimizationSuggestions());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const successRate = requestStats.totalRequests > 0 
    ? (requestStats.successfulRequests / requestStats.totalRequests) * 100 
    : 0;

  const cacheHitRate = requestStats.totalRequests > 0 
    ? (requestStats.cacheHits / requestStats.totalRequests) * 100 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Activity size={24} className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Performance Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOptimizeCache}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Optimize Cache"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Requests</p>
                  <p className="text-2xl font-bold text-white">{requestStats.totalRequests}</p>
                </div>
                <Database size={24} className="text-blue-400" />
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</p>
                </div>
                <CheckCircle size={24} className="text-green-400" />
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-white">{cacheHitRate.toFixed(1)}%</p>
                </div>
                <Zap size={24} className="text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold text-white">{requestStats.averageResponseTime.toFixed(0)}ms</p>
                </div>
                <Clock size={24} className="text-purple-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Statistics */}
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Request Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Successful Requests</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-white font-medium">{requestStats.successfulRequests}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Failed Requests</span>
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-400" />
                    <span className="text-white font-medium">{requestStats.failedRequests}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Batched Requests</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-400" />
                    <span className="text-white font-medium">{requestStats.batchedRequests}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cache Hits</span>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-white font-medium">{requestStats.cacheHits}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Retries</span>
                  <span className="text-white font-medium">{requestStats.retryCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Pending Requests</span>
                  <span className="text-white font-medium">{pendingRequests}</span>
                </div>
              </div>
            </div>

            {/* Cache Statistics */}
            <div className="bg-slate-700/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Cache Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Entries</span>
                  <span className="text-white font-medium">{cacheStats.totalEntries}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Cache Size</span>
                  <span className="text-white font-medium">
                    {(cacheStats.totalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Hit Rate</span>
                  <span className="text-white font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Evictions</span>
                  <span className="text-white font-medium">{cacheStats.evictions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Compressions</span>
                  <span className="text-white font-medium">{cacheStats.compressions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Max Size</span>
                  <span className="text-white font-medium">
                    {(cacheConfig.maxSize / 1024 / 1024).toFixed(0)} MB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Information */}
          {batchInfo.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Active Batches</h3>
              
              <div className="space-y-3">
                {batchInfo.map((batch) => (
                  <div key={batch.key} className="flex items-center justify-between p-3 bg-slate-600/50 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{batch.key}</span>
                      <p className="text-slate-400 text-sm">
                        {batch.count} requests • {Date.now() - batch.oldestRequest}ms old
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-slate-300 text-sm">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {optimizationSuggestions.length > 0 && (
            <div className="bg-slate-700/50 rounded-lg p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={20} className="text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Optimization Suggestions</h3>
              </div>
              
              <div className="space-y-3">
                {optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-slate-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetStats}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                <RefreshCw size={16} />
                Reset Stats
              </button>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-2 px-4 py-2 text-red-300 hover:text-red-200 transition-colors"
              >
                <Database size={16} />
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
