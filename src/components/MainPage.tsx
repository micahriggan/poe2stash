import React, { useState, useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";
import { LiveMonitorButton } from "./LiveMonitorButton";
import LiveMonitor from "./LiveMonitor";
import { JobQueue } from "./JobQueue";
import { StatsSkeleton } from "./SkeletonLoader";
import { SmartItemList } from "./SmartItemList";
import { 
  Search, 
  RefreshCw, 
  DollarSign, 
  Eye, 
  EyeOff,
  ChevronDown,
  Grid,
  List
} from "lucide-react";

export const MainPageContent: React.FC = () => {
  const {
    accountName,
    setAccountName,
    items,
    setItems,
    liveSearchItems,
    setLiveSearchItems,
    stashTabs,
    selectedStash,
    searchTerm,
    setSearchTerm,
    isLiveMonitoring,
    setIsLiveMonitoring,
    isPriceChecking,
    priceEstimates,
    errorMessage,
    setErrorMessage,
    jobs,
    setJobs,
    selectedLeague,
    setSelectedLeague,
    availableLeagues,
    getItems,
    filterByStash,
    priceCheckItem,
    refreshItem,
    refreshAllItems,
    priceCheckAllItems,
    filteredItems,
  } = useAppContext();

  // UI State
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("accountName", accountName);
    getItems(accountName);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLeague = e.target.value;
    setSelectedLeague(newLeague);
    localStorage.setItem("selectedLeague", newLeague);
  };

  // Computed values
  const totalValue = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      const price = priceEstimates[item.id]?.price;
      return sum + (price?.amount || 0);
    }, 0);
  }, [filteredItems, priceEstimates]);

  const hasItems = items.length > 0;
  const isLoading = jobs.length > 0 && jobs.some(job => job.status === 'running');

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Account Setup Section */}
        {!hasItems && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to POE2 Stash</h2>
              <p className="text-slate-400">Connect your account to start managing your items</p>
            </div>
            
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="space-y-4">
                <div>
                  <label htmlFor="account-name" className="block text-sm font-medium text-slate-300 mb-2">
                    Account Name
                  </label>
                  <input
                    id="account-name"
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Enter your account name"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="league-select" className="block text-sm font-medium text-slate-300 mb-2">
                    League
                  </label>
                  <div className="relative">
                    <select
                      id="league-select"
                      value={selectedLeague}
                      onChange={handleLeagueChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                    >
                      {availableLeagues.map((league) => (
                        <option key={league} value={league}>
                          {league}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  Connect Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Content */}
        {hasItems && (
          <>
            {/* Stats Cards */}
            {isLoading ? (
              <StatsSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Items</p>
                      <p className="text-3xl font-bold text-white mt-1">{filteredItems.length}</p>
                      <p className="text-slate-500 text-xs mt-1">Filtered items</p>
                    </div>
                    <div className="p-4 bg-blue-500/20 rounded-xl">
                      <Grid size={28} className="text-blue-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Value</p>
                      <p className="text-3xl font-bold text-white mt-1">{totalValue.toFixed(1)}</p>
                      <p className="text-slate-500 text-xs mt-1">exalted orbs</p>
                    </div>
                    <div className="p-4 bg-green-500/20 rounded-xl">
                      <DollarSign size={28} className="text-green-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Stash Tabs</p>
                      <p className="text-3xl font-bold text-white mt-1">{stashTabs.length - 1}</p>
                      <p className="text-slate-500 text-xs mt-1">Active tabs</p>
                    </div>
                    <div className="p-4 bg-purple-500/20 rounded-xl">
                      <List size={28} className="text-purple-400" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Live Monitor</p>
                      <p className={`text-3xl font-bold mt-1 ${isLiveMonitoring ? 'text-green-400' : 'text-slate-400'}`}>
                        {isLiveMonitoring ? 'ON' : 'OFF'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">Real-time updates</p>
                    </div>
                    <div className={`p-4 rounded-xl ${isLiveMonitoring ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
                      {isLiveMonitoring ? <Eye size={28} className="text-green-400" /> : <EyeOff size={28} className="text-slate-400" />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-8">
              <div className="flex flex-col xl:flex-row gap-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search items by name, type, or mods..."
                    className={`w-full pl-10 pr-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none transition-all ${
                      isSearchFocused ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-600'
                    }`}
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <select
                      value={selectedStash}
                      onChange={(e) => filterByStash(e.target.value)}
                      className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none pr-8"
                    >
                      {stashTabs.map((stash) => (
                        <option key={stash} value={stash}>
                          {stash}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={refreshAllItems}
                  disabled={jobs.length > 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh All
                </button>

                <button
                  onClick={priceCheckAllItems}
                  disabled={isPriceChecking || jobs.length > 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <DollarSign size={16} />
                  {isPriceChecking ? "Checking..." : "Price Check All"}
                </button>

                <LiveMonitorButton
                  accountName={accountName}
                  items={items}
                  liveSearchItems={liveSearchItems}
                  isLiveMonitoring={isLiveMonitoring}
                  setIsLiveMonitoring={setIsLiveMonitoring}
                  setLiveSearchItems={setLiveSearchItems}
                  setItems={setItems}
                  onPriceCheck={priceCheckItem}
                  selectedLeague={selectedLeague}
                />
              </div>
            </div>
          </>
        )}

        {/* Job Queue */}
        {jobs.length > 0 && (
          <div className="mb-6">
            <JobQueue
              jobs={jobs}
              setJobs={setJobs}
              setErrorMessage={setErrorMessage}
            />
          </div>
        )}

        {/* Live Monitor */}
        {isLiveMonitoring && (
          <div className="mb-6">
            <LiveMonitor
              items={liveSearchItems}
              priceSuggestions={priceEstimates}
            />
          </div>
        )}

        {/* Status Messages */}
        {isPriceChecking && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span className="text-blue-300">Price checking in progress... Please wait.</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Search size={20} className="text-red-400" />
              <span className="text-red-300">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Items List */}
        <SmartItemList
          items={filteredItems}
          onPriceClick={priceCheckItem}
          onRefreshClick={refreshItem}
          priceEstimates={priceEstimates}
          selectedLeague={selectedLeague}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

const MainPage: React.FC = () => {
  return <MainPageContent />;
};

export default MainPage;
