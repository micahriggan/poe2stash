export type Poe2ItemSearch = Partial<{
  baseType: string;
  category: string;
  rarity: string;
  ilvl: number;
  quality: number;

  explicit?: Array<{ id: string; min?: number; max?: number }>;

  // equipment
  ar: number;
  es: number;
  ev: number;
  damage: number;
  crit: number;
  pdps: number;
  edps: number;
  dps: number;
  aps: number;
  block: number;
  rune_sockets: number;
  spirit: number;

  // requirements
  lvl: number;
  dex: number;
  str: number;
  int: number;

  //maps
  map_tier: number;

  // misc
  gem_level: number;
  gem_sockets: number;
  area_level: number;
  stack_size: number;
  corrupted: "true" | "false" | "any";

  status: "online" | "any" | "securable" | "available";

  price: number;
  currency: string;

  sort: string;
  direction: "asc" | "desc";
}>;

export interface Poe2TradeSearch {
  id: string;
  complexity: number;
  result: string[];
  total: number;
}

export interface Poe2FetchItems {
  result: Poe2Item[];
}

export interface Poe2ExchangeSearch {
  id: string;
  result: Record<string, ExchangeItem>;
}

export interface ExchangeItem {
  id: string;
  listing: ExchangeListing;
}

export interface ExchangeListing {
  indexed: string; // ISO date string
  account: Account;
  offers: Offer[];
  whisper: string;
  whisper_token: string;
}

export interface Account {
  name: string;
  online: {
    league: string;
  };
  lastCharacterName: string;
  language: string;
  realm: string;
}

export interface Offer {
  exchange: ExchangeCurrencyOffer;
  item: ExchangeCurrencyItem;
}

export interface ExchangeCurrencyOffer {
  currency: string;
  amount: number;
  whisper: string;
}

export interface ExchangeCurrencyItem {
  currency: string;
  amount: number;
  stock: number;
  id: string;
  whisper: string;
}

export type Price = {
  amount: number;
  currency: string;
};

export interface Poe2Item {
  id: string;
  listing: {
    method: string;
    indexed: string; // ISO date string
    stash: {
      name: string;
      x: number;
      y: number;
    };
    account: {
      name: string;
      online: null | boolean;
      current: boolean;
    };
    price: {
      type: string;
      amount: number;
      currency: string;
    };
  };
  item: {
    realm: string;
    corrupted: boolean;
    verified: boolean;
    w: number;
    h: number;
    icon: string;
    league: string;
    id: string;
    name: string;
    typeLine: string;
    baseType: string;
    rarity: string;
    ilvl: number;
    identified: boolean;
    properties: ItemProperty[];
    requirements: ItemRequirement[];
    implicitMods?: ItemMod[];
    explicitMods?: ItemMod[];
    enchantMods?: ItemMod[];
    frameType: number;
    extended: {
      // The trade API stopped sending `extended.mods` when mods became structured
      // objects; the same tier/level data now lives on each mod itself.
      mods?: {
        explicit: ExtendedMod[];
        implicit?: ExtendedMod[];
        enchant?: ExtendedMod[];
      };
      hashes: {
        explicit: Array<[string, number[]]>;
        implicit?: Array<[string, number[]]>;
        enchant?: Array<[string, number[]]>;
      };
    };
  };
}

export interface ItemProperty {
  name: string;
  values: Array<[string, number]>;
  displayMode: number;
}

export interface ItemRequirement {
  name: string;
  values: Array<[string, number]>;
  displayMode: number;
  type: number;
}

/**
 * A mod as the trade API returns it. `description` carries the rolled values, while each
 * entry in `mods` describes the affix that produced them (its tier and possible range).
 */
export interface ItemMod {
  description: string;
  domain: string;
  /** Prefixed stat id, e.g. `stat.explicit.stat_53045048`. */
  hash: string;
  mods: Array<{
    name: string;
    tier: string;
    level: number;
    magnitudes: Array<{ min: string; max: string }>;
  }>;
}

export interface ExtendedMod {
  name: string;
  tier: string;
  level: number;
  magnitudes: Array<{
    hash: string;
    min: string;
    max: string;
  }>;
}

export interface ChatOffer {
  message: string;
  timestamp: string;
  characterName: string;
  item: {
    name: string;
    price: string;
    stashTab: string;
    position: {
      left: number;
      top: number;
    };
  };
}
