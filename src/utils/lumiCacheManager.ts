export class LumiCacheManager {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;
  private debounceTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(timeout?: number) {
    if (timeout) {
      this.cacheTimeout = timeout;
    }
  }

  async getCachedData<T>(key: string, fetchFunction: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }

  setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  debounce(key: string, callback: () => void, delay: number = 300): void {
    const existingTimeout = this.debounceTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(() => {
      callback();
      this.debounceTimeouts.delete(key);
    }, delay);
    
    this.debounceTimeouts.set(key, timeout);
  }

  clearDebounces(): void {
    this.debounceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.debounceTimeouts.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const lumiCacheManager = new LumiCacheManager();
export default lumiCacheManager;
