import { IntelligentCache, CachePriority } from './IntelligentCache';

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  batchSize?: number;
  batchDelay?: number;
  cache?: boolean;
  cacheTTL?: number;
  cacheTags?: string[];
  priority?: CachePriority;
}

export interface BatchedRequest<T = any> {
  id: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  config: RequestConfig;
  timestamp: number;
}

export interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  batchedRequests: number;
  cacheHits: number;
  averageResponseTime: number;
  retryCount: number;
}

class RequestManagerService {
  private pendingRequests = new Map<string, Promise<any>>();
  private requestBatches = new Map<string, BatchedRequest[]>();
  private batchTimers = new Map<string, NodeJS.Timeout>();
  private stats: RequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    batchedRequests: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    retryCount: 0,
  };

  private responseTimes: number[] = [];

  async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // Check cache first
    if (config.cache !== false) {
      const cached = IntelligentCache.get<T>(key);
      if (cached !== null) {
        this.stats.cacheHits++;
        return cached;
      }
    }

    // Check for duplicate request
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Handle batching
    if (config.batchSize && config.batchSize > 1) {
      return this.handleBatchedRequest(key, requestFn, config);
    }

    // Execute single request
    const requestPromise = this.executeRequest(key, requestFn, config);
    this.pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      this.stats.successfulRequests++;
      
      // Cache the result
      if (config.cache !== false) {
        IntelligentCache.set(key, result, {
          ttl: config.cacheTTL,
          tags: config.cacheTags,
          priority: config.priority,
        });
      }

      return result;
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    } finally {
      this.pendingRequests.delete(key);
      this.recordResponseTime(Date.now() - startTime);
    }
  }

  private async handleBatchedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    config: RequestConfig
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchedRequest: BatchedRequest<T> = {
        id: key,
        request: requestFn,
        resolve,
        reject,
        config,
        timestamp: Date.now(),
      };

      // Add to batch
      if (!this.requestBatches.has(key)) {
        this.requestBatches.set(key, []);
      }
      this.requestBatches.get(key)!.push(batchedRequest);

      // Start batch timer if not already started
      if (!this.batchTimers.has(key)) {
        const timer = setTimeout(() => {
          this.processBatch(key);
        }, config.batchDelay || 100);
        this.batchTimers.set(key, timer);
      }

      // Process batch if it's full
      const batch = this.requestBatches.get(key)!;
      if (batch.length >= (config.batchSize || 5)) {
        this.processBatch(key);
      }
    });
  }

  private async processBatch(key: string): Promise<void> {
    const batch = this.requestBatches.get(key);
    if (!batch || batch.length === 0) return;

    // Clear batch and timer
    this.requestBatches.delete(key);
    const timer = this.batchTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(key);
    }

    this.stats.batchedRequests += batch.length;

    try {
      // Execute the first request (they should all be the same)
      const firstRequest = batch[0];
      const result = await this.executeRequest(key, firstRequest.request, firstRequest.config);

      // Resolve all requests in the batch with the same result
      batch.forEach(req => {
        req.resolve(result);
      });

      // Cache the result
      if (firstRequest.config.cache !== false) {
        IntelligentCache.set(key, result, {
          ttl: firstRequest.config.cacheTTL,
          tags: firstRequest.config.cacheTags,
          priority: firstRequest.config.priority,
        });
      }
    } catch (error) {
      // Reject all requests in the batch
      batch.forEach(req => {
        req.reject(error as Error);
      });
    }
  }

  private async executeRequest<T>(
    _key: string,
    requestFn: () => Promise<T>,
    config: RequestConfig
  ): Promise<T> {
    const maxRetries = config.retries || 0;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.withTimeout(requestFn(), config.timeout || 30000);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          this.stats.retryCount++;
          const delay = config.retryDelay || Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      }),
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }

    // Update average
    this.stats.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  // Batch multiple different requests together
  async batchRequests<T extends Record<string, any>>(
    requests: { [K in keyof T]: () => Promise<T[K]> },
    config: RequestConfig = {}
  ): Promise<T> {
    const keys = Object.keys(requests) as (keyof T)[];
    const promises = keys.map(key => 
      this.request(key as string, requests[key], config)
    );

    const results = await Promise.all(promises);
    
    const result = {} as T;
    keys.forEach((key, index) => {
      result[key] = results[index];
    });

    return result;
  }

  // Preload multiple requests
  async preload<T>(
    requests: Array<{ key: string; request: () => Promise<T>; config?: RequestConfig }>,
    config: RequestConfig = {}
  ): Promise<void> {
    const promises = requests.map(({ key, request, config: reqConfig }) =>
      this.request(key, request, { ...config, ...reqConfig })
    );

    await Promise.allSettled(promises);
  }

  // Cancel pending requests
  cancelRequest(key: string): boolean {
    const batch = this.requestBatches.get(key);
    if (batch) {
      batch.forEach(req => {
        req.reject(new Error('Request cancelled'));
      });
      this.requestBatches.delete(key);
      
      const timer = this.batchTimers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(key);
      }
      
      return true;
    }

    return false;
  }

  // Cancel all pending requests
  cancelAllRequests(): void {
    // Cancel all batches
    for (const [, batch] of this.requestBatches.entries()) {
      batch.forEach(req => {
        req.reject(new Error('All requests cancelled'));
      });
    }
    this.requestBatches.clear();

    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Clear pending requests
    this.pendingRequests.clear();
  }

  // Get request statistics
  getStats(): RequestStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      batchedRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      retryCount: 0,
    };
    this.responseTimes = [];
  }

  // Get pending request count
  getPendingRequestCount(): number {
    return this.pendingRequests.size + 
           Array.from(this.requestBatches.values()).reduce((sum, batch) => sum + batch.length, 0);
  }

  // Get batch information
  getBatchInfo(): Array<{ key: string; count: number; oldestRequest: number }> {
    return Array.from(this.requestBatches.entries()).map(([key, batch]) => ({
      key,
      count: batch.length,
      oldestRequest: Math.min(...batch.map(req => req.timestamp)),
    }));
  }

  // Optimize cache based on request patterns
  optimizeCache(): void {
    const suggestions = IntelligentCache.getOptimizationSuggestions();
    console.log('Cache optimization suggestions:', suggestions);
    
    // Auto-optimize based on common patterns
    const stats = this.getStats();
    if (stats.cacheHits / stats.totalRequests < 0.5) {
      // Low cache hit rate - increase TTL for frequently accessed items
      console.log('Low cache hit rate detected, consider increasing TTL');
    }
  }
}

// Export singleton instance
export const RequestManager = new RequestManagerService();
