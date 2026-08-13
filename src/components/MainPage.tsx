import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { PoeListItem } from "./PoeListItem";
import { LiveMonitorButton } from "./LiveMonitorButton";
import LiveMonitor from "./LiveMonitor";
import { JobQueue } from "./JobQueue";
import { League } from "../data/leagues";
import { Price } from "../services/types";

// Divine totals are small numbers where the decimals matter; exalted totals are not.
const formatPrice = (price: Price) =>
  `${
    price.currency === "divine"
      ? Math.round(price.amount * 10) / 10
      : Math.round(price.amount)
  } ${price.currency}`;

const MainPage: React.FC = () => {
  const {
    accountName,
    setAccountName,
    leagues,
    selectedLeague,
    setSelectedLeague,
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
    getItems,
    filterByStash,
    priceCheckItem,
    refreshItem,
    refreshAllItems,
    priceCheckAllItems,
    filteredItems,
    stashTotals,
  } = useAppContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("accountName", accountName);
    getItems(accountName);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 mt-8">Welcome to Poe2Stash</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Enter your account name"
            className="border p-2"
          />
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value as League)}
            className="border p-2"
          >
            {leagues.map((league) => (
              <option key={league} value={league}>{league}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Submit
        </button>
        </div>
      </form>

      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <label htmlFor="stash-select" className="mr-2">
            Filter by Stash Tab:
          </label>
          <select
            className="border p-2"
            id="stash-select"
            value={selectedStash}
            onChange={(e) => filterByStash(e.target.value)}
          >
            {stashTabs.map((stash) => (
              <option key={stash} value={stash} className="bg-gray-600">
                {stash}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search items..."
            className="border p-2"
          />
          <button
            onClick={refreshAllItems}
            className="bg-green-500 text-white p-2 rounded disabled:bg-gray-400"
          >
            Refresh All
          </button>

          <button
            onClick={() => priceCheckAllItems()}
            disabled={isPriceChecking}
            className="bg-green-500 text-white p-2 rounded disabled:bg-gray-400"
          >
            {isPriceChecking ? "Checking Prices..." : "Price Check All"}
          </button>

          <button
            onClick={() => priceCheckAllItems(true)}
            disabled={isPriceChecking}
            title="Re-estimate every item, ignoring cached estimates"
            className="bg-green-700 text-white p-2 rounded disabled:bg-gray-400"
          >
            Recheck All
          </button>
          <LiveMonitorButton
            accountName={accountName}
            league={selectedLeague}
            items={items}
            liveSearchItems={liveSearchItems}
            isLiveMonitoring={isLiveMonitoring}
            setIsLiveMonitoring={setIsLiveMonitoring}
            setLiveSearchItems={setLiveSearchItems}
            setItems={setItems}
            onPriceCheck={priceCheckItem}
          />
          <div className="flex-grow text-right">
            {filteredItems.length} items found
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-8 border-y border-gray-700 py-3">
          <div>
            <div className="text-xs uppercase text-gray-400">
              Listed value{selectedStash !== "All" && ` (${selectedStash})`}
            </div>
            <div className="text-lg font-semibold text-green-600">
              {formatPrice(stashTotals.listed)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-400">
              Estimated value
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {formatPrice(stashTotals.estimated)}
            </div>
            <div className="text-xs text-gray-400">
              {stashTotals.estimatedCount} of {stashTotals.itemCount} price
              checked
            </div>
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <JobQueue
          jobs={jobs}
          setJobs={setJobs}
          setErrorMessage={setErrorMessage}
        />
      )}

      {isLiveMonitoring && (
        <LiveMonitor
          items={liveSearchItems}
          priceSuggestions={priceEstimates}
        />
      )}

      {isPriceChecking && (
        <div className="text-blue-500 mb-4">
          Price checking in progress... Please wait.
        </div>
      )}

      {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}

      {filteredItems.map((item) => (
        <PoeListItem
          key={item.id}
          item={item}
          league={selectedLeague}
          onPriceClick={priceCheckItem}
          onRefreshClick={refreshItem}
          priceSuggestion={priceEstimates[item.id]?.price}
        />
      ))}
    </div>
  );
};

export default MainPage;
