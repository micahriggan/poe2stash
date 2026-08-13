import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import { Poe2Trade } from "../services/poe2trade";
import { PriceChecker, Estimate } from "../services/PriceEstimator";
import { Poe2Item, Price } from "../services/types";
import { SyncAccount } from "../jobs/SyncAccount";
import { RefreshAllItems } from "../jobs/RefreshAllItems";
import { PriceCheckAllItems } from "../jobs/PriceCheckAllItems";
import { Job } from "../jobs/Job";
import { handleJob } from "../components/JobQueue";
import { Leagues, League } from "../data/leagues";
import { Poe2Client } from "../services/Poe2TradeClient";

interface AppContextType {
  accountName: string;
  setAccountName: Dispatch<SetStateAction<string>>;
  leagues: League[];
  selectedLeague: League;
  setSelectedLeague: Dispatch<SetStateAction<League>>;
  items: Poe2Item[];
  setItems: Dispatch<SetStateAction<Poe2Item[]>>;
  liveSearchItems: Poe2Item[];
  setLiveSearchItems: Dispatch<SetStateAction<Poe2Item[]>>;
  stashTabs: string[];
  selectedStash: string;
  setSelectedStash: Dispatch<SetStateAction<string>>;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  isLiveMonitoring: boolean;
  setIsLiveMonitoring: Dispatch<SetStateAction<boolean>>;
  isPriceChecking: boolean;
  priceEstimates: Record<string, Estimate>;
  errorMessage: string | null;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  jobs: Job<any>[];
  setJobs: Dispatch<SetStateAction<Job<any>[]>>;
  getItems: (name: string) => Promise<void>;
  filterByStash: (stash: string) => void;
  priceCheckItem: (item: Poe2Item) => Promise<void>;
  refreshItem: (item: Poe2Item) => Promise<void>;
  refreshAllItems: () => Promise<void>;
  priceCheckAllItems: (force?: boolean) => Promise<void>;
  filteredItems: Poe2Item[];
  stashTotals: StashTotals;
}

export type StashTotals = {
  /** What the items are currently listed for. */
  listed: Price;
  /** What the price checker thinks they are worth. */
  estimated: Price;
  /** How many of the items have an estimate, out of how many are shown. */
  estimatedCount: number;
  itemCount: number;
};

const AppContext = createContext<AppContextType | undefined>(
  undefined,
);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppContextProvider");
  }
  return context;
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accountName, setAccountName] = useState("");
  const [leagues, setLeagues] = useState<League[]>([...Leagues]);
  const [selectedLeague, setSelectedLeague] = useState<League>(Leagues[0]);
  const [items, setItems] = useState<Poe2Item[]>([]);
  const [liveSearchItems, setLiveSearchItems] = useState<Poe2Item[]>([]);
  const [stashTabs, setStashTabs] = useState<string[]>([]);
  const [selectedStash, setSelectedStash] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(false);
  const [isPriceChecking, setIsPriceChecking] = useState<boolean>(false);
  const [priceEstimates, setPriceEstimates] = useState<
    Record<string, Estimate>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stashTotals, setStashTotals] = useState<StashTotals>({
    listed: { amount: 0, currency: "exalted" },
    estimated: { amount: 0, currency: "exalted" },
    estimatedCount: 0,
    itemCount: 0,
  });
  const [jobs, setJobs] = useState<Job<any>[]>([]);

  const updateStashTabs = (items: Poe2Item[]) => {
    const stashes = Poe2Trade.getStashTabs(items);
    setStashTabs(["All", ...Object.keys(stashes).sort()]);
    setSelectedStash("All");
  };

  const getItems = async (name: string) => {
    setErrorMessage("");

    const sync = new SyncAccount(name, selectedLeague);

    sync.onStep = async (progress) => {
      console.log("Sync step", progress);
      const items = await Poe2Trade.fetchAllItems(name, progress.data);
      setItems(items);
      updateStashTabs(items);
    };

    await handleJob(sync, setJobs, setErrorMessage);
  };

  const filterByStash = (stash: string) => {
    setSelectedStash(stash);
  };

  const priceCheckItem = async (item: Poe2Item) => {
    const price = await PriceChecker.estimateItemPrice(item, selectedLeague);
    setPriceEstimates(PriceChecker.getCachedEstimates());
    console.log(price);
  };

  const refreshItem = async (item: Poe2Item) => {
    await Poe2Trade.fetchAllItems(accountName, [item.id], true);
    const accountItems = await Poe2Trade.getAllCachedAccountItems(accountName);
    setItems(accountItems);
  };

  const refreshAllItems = async () => {
    const refresh = new RefreshAllItems(accountName, filteredItems);

    refresh.onStep = async (progress) => {
      setItems(progress.data);
    };

    await handleJob(refresh, setJobs, setErrorMessage);
  };

  // `force` re-checks items that already have a cached estimate, for when the estimates
  // themselves are stale rather than missing.
  const priceCheckAllItems = async (force = false) => {
    setIsPriceChecking(true);
    const priceCheck = new PriceCheckAllItems(
      filteredItems,
      !force,
      selectedLeague,
    );

    priceCheck.onStep = async (progress) => {
      console.log("price check", progress);
      setPriceEstimates(PriceChecker.getCachedEstimates());
    };

    await handleJob(priceCheck, setJobs, setErrorMessage);
    setPriceEstimates(PriceChecker.getCachedEstimates());

    setIsPriceChecking(false);
  };

  const filterItems = (items: Poe2Item[], stash: string, search: string) => {
    return items
      .filter((item) => stash === "All" || item.listing.stash.name === stash)
      .filter((item) => {
        if (!search) return true;
        const itemString = JSON.stringify(item).toLowerCase();
        return search
          .toLowerCase()
          .split(/\s+/)
          .every((term) => itemString.includes(term));
      });
  };

  // Memoized so effects can depend on it without re-running on every render.
  const filteredItems = useMemo(
    () => filterItems(items, selectedStash, searchTerm),
    [items, selectedStash, searchTerm],
  );

  // Roll the currently visible items up into a single value, so the stash (or a single
  // tab, when one is selected) can be valued as a whole.
  useEffect(() => {
    let cancelled = false;

    const calculateTotals = async () => {
      const estimates = filteredItems
        .map((item) => priceEstimates[item.id]?.price)
        .filter(Boolean) as Price[];

      const [listed, estimated] = await Promise.all([
        PriceChecker.totalValue(filteredItems.map((item) => item.listing.price)),
        PriceChecker.totalValue(estimates),
      ]);

      if (cancelled) return;

      setStashTotals({
        listed,
        estimated,
        estimatedCount: estimates.length,
        itemCount: filteredItems.length,
      });
    };

    calculateTotals();

    return () => {
      cancelled = true;
    };
  }, [filteredItems, priceEstimates]);

  useEffect(() => {
    const getCachedItems = async (name: string) => {
      const accountItems = await Poe2Trade.getAllCachedAccountItems(name);
      setItems(accountItems);
    };

    setPriceEstimates(PriceChecker.getCachedEstimates());

    if (accountName) {
      getCachedItems(accountName);
    }
  }, [accountName]);

  // The hardcoded list in `data/leagues` goes stale every league rotation, so take the
  // authoritative ids from the trade API and keep the static list only as a fallback.
  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const apiLeagues = await Poe2Client.getLeagues();
        if (!apiLeagues.length) return;

        setLeagues(apiLeagues);
        setSelectedLeague((current) =>
          apiLeagues.includes(current) ? current : apiLeagues[0]
        );
      } catch (error) {
        console.error("Could not load leagues from the trade API", error);
      }
    };

    loadLeagues();
  }, []);

  useEffect(() => {
    const savedAccountName = localStorage.getItem("accountName");
    if (savedAccountName) {
      setAccountName(savedAccountName);
    }
  }, []);

  useEffect(() => {
    updateStashTabs(items);
  }, [items]);

  const value: AppContextType = {
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
    setSelectedStash,
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
