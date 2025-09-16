import { Cache } from './Cache';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  priority: CachePriority;
  size: number;
}

export enum CachePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableCompression: boolean;
  enableLRU: boolean;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  compressions: number;
  lastCleanup: number;
}

class IntelligentCacheService {
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private accessLog: Map<string, number[]> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 10000,
      defaultTTL: 60 * 60 * 1000, // 1 hour default
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      enableCompression: true,
      enableLRU: true,
      ...config,
    };

    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      compressions: 0,
      lastCleanup: Date.now(),
    };

    this.startCleanupTimer();
  }

  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      priority?: CachePriority;
      compress?: boolean;
    } = {}
  ): void {
    const {
      ttl = this.config.defaultTTL,
      tags = [],
      priority = CachePriority.NORMAL,
      compress = this.config.enableCompression,
    } = options;

    const serializedData = JSON.stringify(data);
    const compressedData = compress ? this.compress(serializedData) : serializedData;
    const size = new Blob([compressedData]).size;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      priority,
      size,
    };

    // Check if we need to evict entries
    this.ensureSpace(size);

    // Store the entry
    const cacheKey = this.getCacheKey(key);
    Cache.setJson(cacheKey, entry, ttl);

    // Update stats
    this.stats.totalEntries++;
    this.stats.totalSize += size;
    if (compress) {
      this.stats.compressions++;
    }

    // Log access pattern
    this.logAccess(key);
  }

  get<T>(key: string): T | null {
    const cacheKey = this.getCacheKey(key);
    const entry = Cache.getJson<CacheEntry<T>>(cacheKey);

    if (!entry) {
      this.stats.missRate++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.remove(key);
      this.stats.missRate++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    Cache.setJson(cacheKey, entry, entry.ttl);

    this.stats.hitRate++;
    this.logAccess(key);

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  remove(key: string): boolean {
    const cacheKey = this.getCacheKey(key);
    const entry = Cache.getJson<CacheEntry>(cacheKey);
    
    if (entry) {
      this.stats.totalEntries--;
      this.stats.totalSize -= entry.size;
    }

    Cache.remove(cacheKey);
    return entry !== null;
  }

  invalidateByTag(tag: string): number {
    const allKeys = this.getAllKeys();
    let invalidated = 0;

    for (const key of allKeys) {
      const entry = this.getEntry(key);
      if (entry && entry.tags.includes(tag)) {
        this.remove(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    const allKeys = this.getAllKeys();
    let invalidated = 0;

    for (const key of allKeys) {
      if (regex.test(key)) {
        this.remove(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  clear(): void {
    const allKeys = this.getAllKeys();
    for (const key of allKeys) {
      this.remove(key);
    }
    
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictions: 0,
      compressions: 0,
      lastCleanup: Date.now(),
    };
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hitRate + this.stats.missRate;
    return {
      ...this.stats,
      hitRate: totalRequests > 0 ? this.stats.hitRate / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.missRate / totalRequests : 0,
    };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      this.stopCleanupTimer();
      this.startCleanupTimer();
    }
  }

  // Intelligent cache warming
  async warmCache<T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    options: {
      batchSize?: number;
      delay?: number;
      priority?: CachePriority;
      tags?: string[];
    } = {}
  ): Promise<void> {
    const {
      batchSize = 5,
      delay = 100,
      priority = CachePriority.NORMAL,
      tags = [],
    } = options;

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (key) => {
          if (!this.has(key)) {
            try {
              const data = await fetcher(key);
              this.set(key, data, { priority, tags });
            } catch (error) {
              console.warn(`Failed to warm cache for key: ${key}`, error);
            }
          }
        })
      );

      if (delay > 0 && i + batchSize < keys.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Predictive cache prefetching
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      priority?: CachePriority;
      tags?: string[];
      ttl?: number;
    } = {}
  ): Promise<T | null> {
    if (this.has(key)) {
      return this.get<T>(key);
    }

    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      console.warn(`Failed to prefetch key: ${key}`, error);
      return null;
    }
  }

  // Cache optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const stats = this.getStats();

    if (stats.hitRate < 0.7) {
      suggestions.push('Consider increasing TTL for frequently accessed data');
    }

    if (stats.totalSize > this.config.maxSize * 0.8) {
      suggestions.push('Cache size is high - consider increasing maxSize or reducing TTL');
    }

    if (stats.evictions > stats.totalEntries * 0.1) {
      suggestions.push('High eviction rate - consider increasing maxSize or optimizing entry sizes');
    }

    const avgAccessTime = this.getAverageAccessTime();
    if (avgAccessTime > 1000) {
      suggestions.push('Slow cache access - consider enabling compression or reducing entry complexity');
    }

    return suggestions;
  }

  private getCacheKey(key: string): string {
    return `intelligent_cache_${key}`;
  }

  private getEntry<T>(key: string): CacheEntry<T> | null {
    const cacheKey = this.getCacheKey(key);
    return Cache.getJson<CacheEntry<T>>(cacheKey);
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private compress(data: string): string {
    // Simple compression using JSON.stringify with replacer
    // In a real implementation, you might use a proper compression library
    try {
      return JSON.stringify(JSON.parse(data));
    } catch {
      return data;
    }
  }


  private ensureSpace(requiredSize: number): void {
    if (this.stats.totalSize + requiredSize <= this.config.maxSize && 
        this.stats.totalEntries < this.config.maxEntries) {
      return;
    }

    // Evict entries using LRU and priority
    const entries = this.getAllEntries();
    entries.sort((a, b) => {
      // Sort by priority first, then by last accessed time
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.lastAccessed - b.lastAccessed;
    });

    let freedSize = 0;
    let freedEntries = 0;

    for (const entry of entries) {
      if (freedSize >= requiredSize && 
          this.stats.totalEntries - freedEntries < this.config.maxEntries) {
        break;
      }

      this.remove(entry.key);
      freedSize += entry.size;
      freedEntries++;
      this.stats.evictions++;
    }
  }

  private getAllKeys(): string[] {
    // This is a simplified implementation
    // In a real implementation, you'd maintain an index of all keys
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('intelligent_cache_')) {
        keys.push(key.replace('intelligent_cache_', ''));
      }
    }
    return keys;
  }

  private getAllEntries(): Array<{ key: string; size: number; priority: CachePriority; lastAccessed: number }> {
    const entries: Array<{ key: string; size: number; priority: CachePriority; lastAccessed: number }> = [];
    
    for (const key of this.getAllKeys()) {
      const entry = this.getEntry(key);
      if (entry) {
        entries.push({
          key,
          size: entry.size,
          priority: entry.priority,
          lastAccessed: entry.lastAccessed,
        });
      }
    }

    return entries;
  }

  private logAccess(key: string): void {
    const now = Date.now();
    const accesses = this.accessLog.get(key) || [];
    accesses.push(now);
    
    // Keep only recent accesses (last hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentAccesses = accesses.filter(time => time > oneHourAgo);
    
    this.accessLog.set(key, recentAccesses);
  }

  private getAverageAccessTime(): number {
    // Calculate average time between accesses
    let totalTime = 0;
    let totalIntervals = 0;

    for (const accesses of this.accessLog.values()) {
      for (let i = 1; i < accesses.length; i++) {
        totalTime += accesses[i] - accesses[i - 1];
        totalIntervals++;
      }
    }

    return totalIntervals > 0 ? totalTime / totalIntervals : 0;
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const key of this.getAllKeys()) {
      const entry = this.getEntry(key);
      if (entry && this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.remove(key);
    }

    this.stats.lastCleanup = now;

    // Clean up access log
    const oneHourAgo = now - 60 * 60 * 1000;
    for (const [key, accesses] of this.accessLog.entries()) {
      const recentAccesses = accesses.filter(time => time > oneHourAgo);
      if (recentAccesses.length === 0) {
        this.accessLog.delete(key);
      } else {
        this.accessLog.set(key, recentAccesses);
      }
    }
  }

  // Cleanup on destroy
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

// Export singleton instance
export const IntelligentCache = new IntelligentCacheService();
