import { Price, Poe2Item } from "./types";
import { Poe2Trade } from "./poe2trade";
import { Cache } from "./Cache";
import { Stats } from "../data/stats";
import { PriceCheckSettings, DEFAULT_PRICE_CHECK_SETTINGS, PriceCheckResult } from "../types/PriceCheckSettings";
import { PriceCheckHistory } from "./PriceCheckHistory";

export type Stat = (typeof Stats)[0]["entries"][0];
export type Explicit = Poe2Item["item"]["extended"]["mods"]["explicit"][0];
export type Estimate = { price: Price; stdDev: Price; confidence?: number };

class EnhancedPriceEstimator {
  private settings: PriceCheckSettings;

  constructor(settings: PriceCheckSettings = DEFAULT_PRICE_CHECK_SETTINGS) {
    this.settings = settings;
  }

  updateSettings(newSettings: Partial<PriceCheckSettings>) {
    this.settings = {
      ...this.settings,
      ...newSettings,
      rollTolerance: { ...this.settings.rollTolerance, ...newSettings.rollTolerance },
      searchSettings: { ...this.settings.searchSettings, ...newSettings.searchSettings },
      confidence: {
        ...this.settings.confidence,
        ...newSettings.confidence,
        confidenceFactors: {
          ...this.settings.confidence.confidenceFactors,
          ...newSettings.confidence?.confidenceFactors,
        },
      },
      priceEstimation: { ...this.settings.priceEstimation, ...newSettings.priceEstimation },
      advanced: { ...this.settings.advanced, ...newSettings.advanced },
    };
  }

  getSettings(): PriceCheckSettings {
    return this.settings;
  }

  async estimateItemPrice(item: Poe2Item): Promise<PriceCheckResult> {
    const startTime = Date.now();
    let totalSearches = 0;
    let fallbackUsed = false;
    let cacheHit = false;

    // Check cache first
    if (this.settings.advanced.cacheResults) {
      const cached = this.getCachedPriceEstimate(item.item.id);
      if (cached && this.isCacheValid(cached.timestamp)) {
        cacheHit = true;
        return {
          ...cached.result,
          searchMetadata: {
            ...cached.result.searchMetadata,
            cacheHit: true,
            searchTime: Date.now() - startTime,
          },
        };
      }
    }

    const parsedMods = this.parseItemMods(item);
    const allSimilarItems: Array<{
      id: string;
      price: Price;
      similarity: number;
      matchingRolls: number;
    }> = [];

    // Try different search strategies
    const searchStrategies = this.generateSearchStrategies(item, parsedMods);
    
    for (const strategy of searchStrategies) {
      totalSearches++;
      
      try {
        const searchResult = await this.executeSearchStrategy(strategy, item);
        const similarItems = await this.processSearchResults(searchResult, item, parsedMods);
        
        allSimilarItems.push(...similarItems);
        
        // If we have enough results, break
        if (allSimilarItems.length >= this.settings.searchSettings.maxResults) {
          break;
        }
        
        // Rate limiting
        if (this.settings.advanced.rateLimitDelay > 0) {
          await this.delay(this.settings.advanced.rateLimitDelay);
        }
      } catch (error) {
        console.warn(`Search strategy failed:`, error);
        continue;
      }
    }

    // If we don't have enough results and fallback is enabled, try broader searches
    if (allSimilarItems.length < this.settings.searchSettings.minResults && this.settings.searchSettings.fallbackEnabled) {
      fallbackUsed = true;
      const fallbackResults = await this.executeFallbackSearches(item, parsedMods);
      allSimilarItems.push(...fallbackResults);
    }

    // Calculate price estimate
    const priceEstimate = this.calculatePriceEstimate(allSimilarItems);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(allSimilarItems, item, parsedMods);

    const result: PriceCheckResult = {
      estimate: {
        price: priceEstimate.price,
        confidence,
        method: this.settings.priceEstimation.method,
        sampleSize: allSimilarItems.length,
      },
      similarItems: allSimilarItems.slice(0, 10), // Top 10 most similar
      searchMetadata: {
        totalSearches,
        fallbackUsed,
        cacheHit,
        searchTime: Date.now() - startTime,
      },
    };

    // Cache the result
    if (this.settings.advanced.cacheResults) {
      this.cachePriceEstimate(item.item.id, result, Date.now());
    }

    // Add to history for learning
    PriceCheckHistory.addHistoryEntry(item, result);

    return result;
  }

  private generateSearchStrategies(_item: Poe2Item, parsedMods: any) {
    const strategies = [];
    const rollTolerance = this.settings.rollTolerance;
    
    if (!rollTolerance.enabled) {
      // Exact matching (current behavior)
      strategies.push({
        type: 'exact',
        rolls: parsedMods.explicits?.length || 0,
        tolerance: 0,
      });
    } else {
      // Progressive tolerance matching
      const maxRolls = Math.min(rollTolerance.maxRolls, parsedMods.explicits?.length || 0);
      
      for (let rolls = maxRolls; rolls >= rollTolerance.minRolls; rolls--) {
        strategies.push({
          type: 'tolerance',
          rolls,
          tolerance: rollTolerance.percentage,
        });
      }
    }

    return strategies;
  }

  private async executeSearchStrategy(strategy: any, item: Poe2Item) {
    const topMods = await this.getHighTierMods(item, strategy.rolls);
    const topStats = topMods
      .map((s) => s.magnitudes)
      .flat()
      .map((mag) => mag.hash)
      .map((hash) => this.findModByHash(item, hash))
      .filter((p) => p);

    const searchParams: any = {
      status: "online",
      rarity: item.item.rarity,
      baseType: item.item.baseType,
      explicit: topStats.map((s) => {
        if (strategy.tolerance > 0) {
          // Apply percentage tolerance
          const value = s!.value1;
          if (value !== undefined) {
            const tolerance = (value * strategy.tolerance) / 100;
            return {
              id: s!.hash,
              min: Math.max(0, value - tolerance),
              max: value + tolerance,
            };
          }
          return {
            id: s!.hash,
            ...Poe2Trade.range(s!.value1 || 0),
          };
        } else {
          // Exact matching
          return {
            id: s!.hash,
            ...Poe2Trade.range(s!.value1),
          };
        }
      }),
    };

    return await Poe2Trade.getItemByAttributes(searchParams);
  }

  private async processSearchResults(searchResult: any, item: Poe2Item, parsedMods: any) {
    const filtered = searchResult.result.filter((i: string) => i !== item.id);
    const items = await Poe2Trade.fetchItems(filtered.slice(0, 10));
    
    return items.result.map((similarItem) => {
      const similarity = this.calculateItemSimilarity(item, similarItem, parsedMods);
      const matchingRolls = this.countMatchingRolls(item, similarItem);
      
      return {
        id: similarItem.id,
        price: similarItem.listing.price,
        similarity,
        matchingRolls,
      };
    });
  }

  private calculateItemSimilarity(item1: Poe2Item, item2: Poe2Item, _parsedMods: any): number {
    const factors = this.settings.confidence.confidenceFactors;
    let similarity = 0;

    // Base type similarity
    if (item1.item.baseType === item2.item.baseType) {
      similarity += factors.baseType;
    }

    // Rarity similarity
    if (item1.item.rarity === item2.item.rarity) {
      similarity += factors.rarity;
    }

    // Item level similarity
    const ilvlDiff = Math.abs(item1.item.ilvl - item2.item.ilvl);
    const ilvlSimilarity = Math.max(0, 1 - (ilvlDiff / 50)); // Normalize to 0-1
    similarity += factors.itemLevel * ilvlSimilarity;

    // Roll matching similarity
    const rollSimilarity = this.calculateRollSimilarity(item1, item2);
    similarity += factors.rollMatch * rollSimilarity;

    return Math.min(1, similarity);
  }

  private calculateRollSimilarity(item1: Poe2Item, item2: Poe2Item): number {
    const mods1 = item1.item.explicitMods || [];
    const mods2 = item2.item.explicitMods || [];
    
    if (mods1.length === 0 && mods2.length === 0) return 1;
    if (mods1.length === 0 || mods2.length === 0) return 0;

    let matches = 0;
    const totalMods = Math.max(mods1.length, mods2.length);

    for (const mod1 of mods1) {
      for (const mod2 of mods2) {
        if (this.modifiersMatch(mod1, mod2)) {
          matches++;
          break;
        }
      }
    }

    return matches / totalMods;
  }

  private modifiersMatch(mod1: string, mod2: string): boolean {
    // Extract the base modifier text (without numbers)
    const base1 = mod1.replace(/[-+]?\d+(?:\.\d+)?/g, '#');
    const base2 = mod2.replace(/[-+]?\d+(?:\.\d+)?/g, '#');
    
    return base1 === base2;
  }

  private countMatchingRolls(item1: Poe2Item, item2: Poe2Item): number {
    const mods1 = item1.item.explicitMods || [];
    const mods2 = item2.item.explicitMods || [];
    
    let matches = 0;
    for (const mod1 of mods1) {
      for (const mod2 of mods2) {
        if (this.modifiersMatch(mod1, mod2)) {
          matches++;
          break;
        }
      }
    }
    return matches;
  }

  private calculatePriceEstimate(similarItems: Array<{ price: Price; similarity: number }>): { price: Price; stdDev: Price } {
    if (similarItems.length === 0) {
      return {
        price: { amount: 0, currency: 'exalted' },
        stdDev: { amount: 0, currency: 'exalted' },
      };
    }

    // Convert all prices to the same currency
    const prices = similarItems.map(item => item.price);
    const normalizedPrices = this.normalizePrices(prices);

    // Apply outlier removal if enabled
    const filteredPrices = this.settings.priceEstimation.outlierRemoval 
      ? this.removeOutliers(normalizedPrices)
      : normalizedPrices;

    if (filteredPrices.length === 0) {
      return {
        price: { amount: 0, currency: 'exalted' },
        stdDev: { amount: 0, currency: 'exalted' },
      };
    }

    // Calculate price based on method
    let price: number;
    switch (this.settings.priceEstimation.method) {
      case 'median':
        price = this.median(filteredPrices);
        break;
      case 'weighted':
        price = this.weightedAverage(filteredPrices, similarItems.map(item => item.similarity));
        break;
      default: // 'mean'
        price = this.mean(filteredPrices);
    }

    const stdDev = this.stdDev(filteredPrices);

    return {
      price: { amount: price, currency: 'exalted' },
      stdDev: { amount: stdDev, currency: 'exalted' },
    };
  }

  private calculateConfidence(similarItems: Array<{ similarity: number }>, _item: Poe2Item, _parsedMods: any): number {
    if (similarItems.length === 0) return 0;

    // Base confidence from sample size
    const sampleSizeConfidence = Math.min(1, similarItems.length / 10);
    
    // Average similarity confidence
    const avgSimilarity = this.mean(similarItems.map(item => item.similarity));
    
    // Combine factors
    const confidence = (sampleSizeConfidence * 0.3) + (avgSimilarity * 0.7);
    
    return Math.min(1, Math.max(0, confidence));
  }

  // Utility methods (reused from original PriceEstimator)
  private async getHighTierMods(item: Poe2Item, topN: number) {
    return item.item.extended.mods.explicit
      .map((mod) => ({
        mod: mod.name,
        tier: mod.tier,
        level: mod.level,
        tierNum: Number(mod.tier.replace("S", "").replace("P", "")),
        magnitudes: mod.magnitudes,
      }))
      .sort((a, b) => b.tierNum - a.tierNum)
      .slice(0, topN);
  }

  private findModByHash(item: Poe2Item, hash: string) {
    const parsedMods = this.parseItemMods(item);
    return parsedMods.explicits?.find((p) => p.hash === hash);
  }

  private parseItemMods(item: Poe2Item) {
    // Reuse the existing parsing logic from PriceEstimator
    const explicits = item.item.explicitMods?.map((mod) => this.extractMod(mod));
    const implicits = item.item.implicitMods?.map((mod) => this.extractMod(mod));
    const enchants = item.item.enchantMods?.map((mod) => this.extractMod(mod));

    return { explicits, implicits, enchants };
  }

  private extractMod(mod: string) {
    // Reuse existing extractMod logic from PriceEstimator
    const numberCapture = /^.*?([-+]?\d+(?:\.\d+)?)(.*)$/;
    const bracketCapture = /\[([^|\]]+)\|([^\]]+)\]/g;
    const withoutPipeBrackets = mod.replace(bracketCapture, "$2");
    const singleBracketCapture = /\[([^\]]+)\]/g;
    const withoutBrackets = withoutPipeBrackets.replace(singleBracketCapture, "$1");
    const output = withoutBrackets.replace(/[-+]?\d+(?:\.\d+)?/g, "#");
    const match = mod.match(numberCapture);
    const statEntry = this.getStatEntryForMod(output, withoutBrackets);

    if (!statEntry) {
      throw new Error(`No stat entry found for mod: ${mod}, ${output}`);
    }

    let value1 = match ? Number(match[1]) : undefined;
    let value2 = match && match[2] ? Number(match[2]) : undefined;

    const inverted = (statEntry.text.includes("increased") && output.includes("reduced")) ||
                    (statEntry.text.includes("reduced") && output.includes("increased"));

    if (statEntry.text !== output && inverted) {
      if (value1) value1 = -value1;
      if (value2) value2 = -value2;
    }

    return { mod, parsed: output, value1, value2, hash: statEntry.id };
  }

  private getStatEntryForMod(mod: string, original?: string) {
    const stats = Stats.map((statGroup) =>
      statGroup.entries.filter(
        (entry) =>
          entry.text === mod ||
          entry.text === mod.replace("increased", "reduced") ||
          entry.text === mod.replace("reduced", "increased") ||
          entry.text === mod.replace("in your Maps", "in Area") ||
          entry.text === mod.replace("in your Maps", "in this Area") ||
          (original && entry.text === original),
      ),
    ).flat();
    return stats.length > 0 ? stats[0] : null;
  }

  // Mathematical utility methods
  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private weightedAverage(values: number[], weights: number[]): number {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = values.reduce((sum, value, i) => sum + (value * weights[i]), 0);
    return weightedSum / totalWeight;
  }

  private stdDev(values: number[]): number {
    const mean = this.mean(values);
    const variance = this.mean(values.map((v) => Math.pow(v - mean, 2)));
    return Math.sqrt(variance);
  }

  private removeOutliers(values: number[]): number[] {
    const mean = this.mean(values);
    const stdDev = this.stdDev(values);
    const threshold = this.settings.priceEstimation.outlierThreshold;
    
    return values.filter(value => Math.abs(value - mean) <= threshold * stdDev);
  }

  private normalizePrices(prices: Price[]): number[] {
    // Convert all prices to exalted for comparison
    return prices.map(price => {
      if (price.currency === 'exalted') return price.amount;
      // Add currency conversion logic here
      return price.amount; // Simplified for now
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cache methods
  private getCachedPriceEstimate(itemId: string) {
    const cacheKey = `enhanced_price_estimate_${itemId}`;
    return Cache.getJson<{ result: PriceCheckResult; timestamp: number }>(cacheKey);
  }

  private cachePriceEstimate(itemId: string, result: PriceCheckResult, timestamp: number) {
    const cacheKey = `enhanced_price_estimate_${itemId}`;
    Cache.setJson(cacheKey, { result, timestamp }, this.settings.advanced.cacheDuration * 60 * 1000);
  }

  private isCacheValid(timestamp: number): boolean {
    const cacheAge = Date.now() - timestamp;
    const maxAge = this.settings.advanced.cacheDuration * 60 * 1000;
    return cacheAge < maxAge;
  }

  private async executeFallbackSearches(item: Poe2Item, parsedMods: any) {
    // Implement broader search strategies when exact matches fail
    const fallbackResults = [];
    const maxSteps = this.settings.searchSettings.fallbackSteps;
    
    // Try with fewer rolls, limited by fallbackSteps setting
    for (let step = 0; step < maxSteps; step++) {
      const rolls = Math.max(1, this.settings.rollTolerance.minRolls - step);
      const tolerance = this.settings.rollTolerance.percentage * (1 + step * 0.5); // Increase tolerance with each step
      
      try {
        const strategy = { type: 'fallback', rolls, tolerance };
        const searchResult = await this.executeSearchStrategy(strategy, item);
        const similarItems = await this.processSearchResults(searchResult, item, parsedMods);
        fallbackResults.push(...similarItems);
        
        // Rate limiting between fallback attempts
        if (this.settings.advanced.rateLimitDelay > 0) {
          await this.delay(this.settings.advanced.rateLimitDelay);
        }
        
        if (fallbackResults.length >= this.settings.searchSettings.minResults) {
          break;
        }
      } catch (error) {
        console.warn(`Fallback search step ${step + 1} failed:`, error);
        continue;
      }
    }
    
    return fallbackResults;
  }
}

export const EnhancedPriceChecker = new EnhancedPriceEstimator();
