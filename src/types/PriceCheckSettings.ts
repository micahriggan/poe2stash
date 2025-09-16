export interface PriceCheckSettings {
  // Roll tolerance settings
  rollTolerance: {
    enabled: boolean;
    percentage: number; // 0-100% tolerance for roll values
    minRolls: number; // Minimum number of matching rolls required
    maxRolls: number; // Maximum number of rolls to consider
  };
  
  // Search settings
  searchSettings: {
    maxResults: number; // Maximum number of similar items to fetch
    minResults: number; // Minimum results before falling back to broader search
    fallbackEnabled: boolean; // Enable fallback to broader searches
    fallbackSteps: number; // Number of fallback attempts
  };
  
  // Confidence scoring
  confidence: {
    enabled: boolean;
    minConfidence: number; // Minimum confidence score (0-1) to show estimate
    showConfidence: boolean; // Show confidence score in UI
    confidenceFactors: {
      rollMatch: number; // Weight for roll matching (0-1)
      itemLevel: number; // Weight for item level similarity (0-1)
      baseType: number; // Weight for base type matching (0-1)
      rarity: number; // Weight for rarity matching (0-1)
    };
  };
  
  // Price estimation
  priceEstimation: {
    method: 'mean' | 'median' | 'weighted'; // Price calculation method
    outlierRemoval: boolean; // Remove outlier prices
    outlierThreshold: number; // Standard deviations for outlier detection
    currencyPreference: string[]; // Preferred currencies in order
  };
  
  // Advanced settings
  advanced: {
    cacheResults: boolean; // Cache price check results
    cacheDuration: number; // Cache duration in minutes
    rateLimitDelay: number; // Delay between API calls in ms
    retryAttempts: number; // Number of retry attempts for failed requests
  };
}

export const DEFAULT_PRICE_CHECK_SETTINGS: PriceCheckSettings = {
  rollTolerance: {
    enabled: true,
    percentage: 15, // 15% tolerance by default
    minRolls: 2, // Require at least 2 matching rolls
    maxRolls: 6, // Consider up to 6 rolls
  },
  searchSettings: {
    maxResults: 20,
    minResults: 5,
    fallbackEnabled: true,
    fallbackSteps: 3,
  },
  confidence: {
    enabled: true,
    minConfidence: 0.3, // 30% minimum confidence
    showConfidence: true,
    confidenceFactors: {
      rollMatch: 0.4, // 40% weight for roll matching
      itemLevel: 0.2, // 20% weight for item level
      baseType: 0.3, // 30% weight for base type
      rarity: 0.1, // 10% weight for rarity
    },
  },
  priceEstimation: {
    method: 'weighted',
    outlierRemoval: true,
    outlierThreshold: 2.0, // Remove prices >2 standard deviations
    currencyPreference: ['exalted', 'divine', 'chaos'],
  },
  advanced: {
    cacheResults: true,
    cacheDuration: 60, // 1 hour cache
    rateLimitDelay: 1000, // 1 second between calls
    retryAttempts: 3,
  },
};

export interface PriceCheckResult {
  estimate: {
    price: {
      amount: number;
      currency: string;
    };
    confidence: number; // 0-1 confidence score
    method: string; // How the price was calculated
    sampleSize: number; // Number of similar items found
  };
  similarItems: {
    id: string;
    price: { amount: number; currency: string };
    similarity: number; // 0-1 similarity score
    matchingRolls: number;
  }[];
  searchMetadata: {
    totalSearches: number;
    fallbackUsed: boolean;
    cacheHit: boolean;
    searchTime: number; // Time taken in ms
  };
}
