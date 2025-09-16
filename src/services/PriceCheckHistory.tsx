import { Poe2Item } from "./types";
import { PriceCheckResult } from "../types/PriceCheckSettings";
import { Cache } from "./Cache";

export interface PriceCheckHistoryEntry {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  timestamp: number;
  result: PriceCheckResult;
  userFeedback?: {
    actualPrice?: { amount: number; currency: string };
    accuracy: 'accurate' | 'overpriced' | 'underpriced' | 'unknown';
    notes?: string;
  };
  searchMetadata: {
    totalSearches: number;
    fallbackUsed: boolean;
    cacheHit: boolean;
    searchTime: number;
  };
}

export interface PriceCheckAnalytics {
  totalChecks: number;
  averageConfidence: number;
  accuracyByConfidence: Record<string, number>;
  mostSearchedItems: Array<{ itemType: string; count: number }>;
  averageSearchTime: number;
  cacheHitRate: number;
  fallbackUsageRate: number;
}

class PriceCheckHistoryService {
  private readonly CACHE_KEY = 'price_check_history';
  private readonly MAX_HISTORY_ENTRIES = 1000;
  private readonly ANALYTICS_CACHE_KEY = 'price_check_analytics';

  addHistoryEntry(item: Poe2Item, result: PriceCheckResult): void {
    const entry: PriceCheckHistoryEntry = {
      id: this.generateId(),
      itemId: item.id,
      itemName: item.item.name || item.item.typeLine,
      itemType: item.item.baseType,
      timestamp: Date.now(),
      result,
      searchMetadata: result.searchMetadata,
    };

    const history = this.getHistory();
    history.unshift(entry); // Add to beginning

    // Keep only the most recent entries
    if (history.length > this.MAX_HISTORY_ENTRIES) {
      history.splice(this.MAX_HISTORY_ENTRIES);
    }

    this.saveHistory(history);
    this.updateAnalytics();
  }

  addUserFeedback(entryId: string, feedback: PriceCheckHistoryEntry['userFeedback']): void {
    const history = this.getHistory();
    const entry = history.find(e => e.id === entryId);
    
    if (entry) {
      entry.userFeedback = feedback;
      this.saveHistory(history);
      this.updateAnalytics();
    }
  }

  getHistory(): PriceCheckHistoryEntry[] {
    return Cache.getJson<PriceCheckHistoryEntry[]>(this.CACHE_KEY) || [];
  }

  getHistoryForItem(itemId: string): PriceCheckHistoryEntry[] {
    return this.getHistory().filter(entry => entry.itemId === itemId);
  }

  getRecentHistory(limit: number = 50): PriceCheckHistoryEntry[] {
    return this.getHistory().slice(0, limit);
  }

  getAnalytics(): PriceCheckAnalytics {
    const cached = Cache.getJson<PriceCheckAnalytics>(this.ANALYTICS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    return this.calculateAnalytics();
  }

  private calculateAnalytics(): PriceCheckAnalytics {
    const history = this.getHistory();
    
    if (history.length === 0) {
      return {
        totalChecks: 0,
        averageConfidence: 0,
        accuracyByConfidence: {},
        mostSearchedItems: [],
        averageSearchTime: 0,
        cacheHitRate: 0,
        fallbackUsageRate: 0,
      };
    }

    // Calculate average confidence
    const totalConfidence = history.reduce((sum, entry) => sum + entry.result.estimate.confidence, 0);
    const averageConfidence = totalConfidence / history.length;

    // Calculate accuracy by confidence ranges
    const accuracyByConfidence: Record<string, number> = {};
    const confidenceRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'];
    
    confidenceRanges.forEach(range => {
      const [min, max] = range.split('-').map(s => parseInt(s.replace('%', '')) / 100);
      const entriesInRange = history.filter(entry => {
        const confidence = entry.result.estimate.confidence;
        return confidence >= min && confidence <= max;
      });
      
      if (entriesInRange.length > 0) {
        const accurateEntries = entriesInRange.filter(entry => 
          entry.userFeedback?.accuracy === 'accurate'
        ).length;
        accuracyByConfidence[range] = accurateEntries / entriesInRange.length;
      } else {
        accuracyByConfidence[range] = 0;
      }
    });

    // Calculate most searched items
    const itemTypeCounts: Record<string, number> = {};
    history.forEach(entry => {
      itemTypeCounts[entry.itemType] = (itemTypeCounts[entry.itemType] || 0) + 1;
    });
    
    const mostSearchedItems = Object.entries(itemTypeCounts)
      .map(([itemType, count]) => ({ itemType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average search time
    const totalSearchTime = history.reduce((sum, entry) => sum + entry.searchMetadata.searchTime, 0);
    const averageSearchTime = totalSearchTime / history.length;

    // Calculate cache hit rate
    const cacheHits = history.filter(entry => entry.searchMetadata.cacheHit).length;
    const cacheHitRate = cacheHits / history.length;

    // Calculate fallback usage rate
    const fallbackUsed = history.filter(entry => entry.searchMetadata.fallbackUsed).length;
    const fallbackUsageRate = fallbackUsed / history.length;

    const analytics: PriceCheckAnalytics = {
      totalChecks: history.length,
      averageConfidence,
      accuracyByConfidence,
      mostSearchedItems,
      averageSearchTime,
      cacheHitRate,
      fallbackUsageRate,
    };

    // Cache analytics for 1 hour
    Cache.setJson(this.ANALYTICS_CACHE_KEY, analytics, Cache.times.hour);
    
    return analytics;
  }

  private updateAnalytics(): void {
    // Invalidate cached analytics
    Cache.remove(this.ANALYTICS_CACHE_KEY);
    // Recalculate and cache
    this.calculateAnalytics();
  }

  private saveHistory(history: PriceCheckHistoryEntry[]): void {
    Cache.setJson(this.CACHE_KEY, history, Cache.times.week);
  }

  private generateId(): string {
    return `pch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Learning system methods
  getLearningInsights(): {
    recommendedTolerance: number;
    confidenceThreshold: number;
    performanceTips: string[];
  } {
    const analytics = this.getAnalytics();
    const history = this.getRecentHistory(100); // Last 100 entries

    // Analyze performance patterns
    const lowConfidenceEntries = history.filter(entry => entry.result.estimate.confidence < 0.5);
    const highConfidenceEntries = history.filter(entry => entry.result.estimate.confidence >= 0.7);
    
    // Recommend tolerance based on fallback usage
    let recommendedTolerance = 15; // Default
    if (analytics.fallbackUsageRate > 0.3) {
      recommendedTolerance = 25; // Increase tolerance if fallback is used frequently
    } else if (analytics.fallbackUsageRate < 0.1) {
      recommendedTolerance = 10; // Decrease tolerance if fallback is rarely used
    }

    // Recommend confidence threshold based on accuracy
    let confidenceThreshold = 0.3; // Default
    if (analytics.averageConfidence > 0.7) {
      confidenceThreshold = 0.5; // Higher threshold if generally high confidence
    } else if (analytics.averageConfidence < 0.4) {
      confidenceThreshold = 0.2; // Lower threshold if generally low confidence
    }

    // Generate performance tips
    const performanceTips: string[] = [];
    
    if (analytics.cacheHitRate < 0.3) {
      performanceTips.push("Consider increasing cache duration to improve performance");
    }
    
    if (analytics.averageSearchTime > 3000) {
      performanceTips.push("Search times are high - consider reducing max results or increasing rate limit delay");
    }
    
    if (analytics.fallbackUsageRate > 0.5) {
      performanceTips.push("High fallback usage - consider increasing roll tolerance for better initial matches");
    }
    
    if (lowConfidenceEntries.length > highConfidenceEntries.length) {
      performanceTips.push("Many low-confidence results - consider adjusting search settings for better matches");
    }

    return {
      recommendedTolerance,
      confidenceThreshold,
      performanceTips,
    };
  }

  // Export/Import functionality
  exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  importHistory(jsonData: string): boolean {
    try {
      const history = JSON.parse(jsonData) as PriceCheckHistoryEntry[];
      
      // Validate data structure
      if (!Array.isArray(history)) {
        throw new Error('Invalid data format');
      }
      
      // Validate each entry
      for (const entry of history) {
        if (!entry.id || !entry.itemId || !entry.timestamp || !entry.result) {
          throw new Error('Invalid entry format');
        }
      }
      
      this.saveHistory(history);
      this.updateAnalytics();
      return true;
    } catch (error) {
      console.error('Failed to import history:', error);
      return false;
    }
  }

  clearHistory(): void {
    Cache.remove(this.CACHE_KEY);
    Cache.remove(this.ANALYTICS_CACHE_KEY);
  }
}

export const PriceCheckHistory = new PriceCheckHistoryService();
