import React, { useState, useEffect } from 'react';
import { PriceCheckHistory, PriceCheckHistoryEntry } from '../../services/PriceCheckHistory';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PriceCheckHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PriceCheckHistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, searchTerm, dateFilter, sortBy, sortOrder]);

  const loadHistory = () => {
    const allHistory = PriceCheckHistory.getHistory();
    setHistory(allHistory);
  };

  const filterAndSortHistory = () => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.itemType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(entry => now - entry.timestamp < oneDay);
        break;
      case 'week':
        filtered = filtered.filter(entry => now - entry.timestamp < oneWeek);
        break;
      case 'month':
        filtered = filtered.filter(entry => now - entry.timestamp < oneMonth);
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'confidence':
          comparison = a.result.estimate.confidence - b.result.estimate.confidence;
          break;
        case 'price':
          comparison = a.result.estimate.price.amount - b.result.estimate.price.amount;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredHistory(filtered);
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
          loadHistory();
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
      loadHistory();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(timestamp)
    };
  };

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <History size={32} className="text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Price Check History</h1>
                <p className="text-slate-400 mt-1">Complete history of all price checks and analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadHistory}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={24} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Checks</p>
                  <p className="text-3xl font-bold text-white mt-2">{history.length}</p>
                </div>
                <History size={32} className="text-blue-400" />
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Filtered Results</p>
                  <p className="text-3xl font-bold text-white mt-2">{filteredHistory.length}</p>
                </div>
                <Filter size={32} className="text-green-400" />
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Confidence</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {history.length > 0 ? Math.round(
                      history.reduce((sum, entry) => sum + entry.result.estimate.confidence, 0) / history.length * 100
                    ) : 0}%
                  </p>
                </div>
                <Target size={32} className="text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Search Time</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {history.length > 0 ? Math.round(
                      history.reduce((sum, entry) => sum + entry.searchMetadata.searchTime, 0) / history.length
                    ) : 0}ms
                  </p>
                </div>
                <Clock size={32} className="text-purple-400" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by item name or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-4">
                <Calendar size={20} className="text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-4">
                <TrendingUp size={20} className="text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="date">Sort by Date</option>
                  <option value="confidence">Sort by Confidence</option>
                  <option value="price">Sort by Price</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <TrendingUp size={20} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12">
                  <History size={64} className="text-slate-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-white mb-3">No history found</h3>
                  <p className="text-slate-400 text-lg">
                    {searchTerm || dateFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Start price checking items to build your history'
                    }
                  </p>
                </div>
              </div>
            ) : (
              filteredHistory.map((entry) => {
                const dateInfo = formatDate(entry.timestamp);
                return (
                  <div key={entry.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:bg-slate-800/70 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-white mb-1">{entry.itemName}</h4>
                        <p className="text-slate-400 text-sm">{entry.itemType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">{dateInfo.date}</p>
                        <p className="text-slate-500 text-xs">{dateInfo.relative}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-slate-400 text-sm">Price:</span>
                        <p className="text-white font-semibold">
                          {entry.result.estimate.price.amount.toFixed(1)} {entry.result.estimate.price.currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Confidence:</span>
                        <p className="text-white font-semibold">
                          {Math.round(entry.result.estimate.confidence * 100)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Search Time:</span>
                        <p className="text-white font-semibold">{entry.searchMetadata.searchTime}ms</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Sample Size:</span>
                        <p className="text-white font-semibold">{entry.result.estimate.sampleSize}</p>
                      </div>
                    </div>
                    
                    {entry.userFeedback && (
                      <div className="pt-4 border-t border-slate-600">
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
                          {entry.userFeedback.notes && (
                            <span className="text-slate-400 text-sm italic">"{entry.userFeedback.notes}"</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
