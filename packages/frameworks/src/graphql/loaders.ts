import * as DataLoader from "dataloader";
import type { GraphQLContext } from "./context";

/**
 * DataLoader configuration
 */
export interface LoaderConfig<K, V> {
  /**
   * Batch loading function
   */
  batchLoadFn: (keys: readonly K[]) => Promise<(V | Error)[]>;

  /**
   * Cache key function
   */
  cacheKeyFn?: (key: K) => string;

  /**
   * Batch schedule function
   */
  batchScheduleFn?: (callback: () => void) => void;
}

/**
 * Loader cache interface
 */
export interface LoaderCache {
  get<K, V>(key: string): DataLoader<K, V> | undefined;
  set<K, V>(key: string, loader: DataLoader<K, V>): void;
  clear(): void;
}

/**
 * Simple in-memory loader cache
 */
class SimpleLoaderCache implements LoaderCache {
  private cache = new Map<string, DataLoader<unknown, unknown>>();

  get<K, V>(key: string): DataLoader<K, V> | undefined {
    return this.cache.get(key) as DataLoader<K, V> | undefined;
  }

  set<K, V>(key: string, loader: DataLoader<K, V>): void {
    this.cache.set(key, loader as DataLoader<unknown, unknown>);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Global loader cache (per-request caching recommended instead)
 */
const globalCache = new SimpleLoaderCache();

/**
 * Create a DataLoader instance
 *
 * @param config - Loader configuration
 * @returns DataLoader instance
 */
export function createLoader<K, V>(
  config: LoaderConfig<K, V>,
): DataLoader<K, V> {
  return new DataLoader(config.batchLoadFn, {
    cacheKeyFn: config.cacheKeyFn,
    batchScheduleFn: config.batchScheduleFn,
  });
}

/**
 * Create a cached DataLoader that persists across requests
 * Use with caution - consider memory implications
 *
 * @param name - Unique name for the loader
 * @param config - Loader configuration
 * @returns DataLoader instance
 */
export function createCachedLoader<K, V>(
  name: string,
  config: LoaderConfig<K, V>,
): DataLoader<K, V> {
  const cached = globalCache.get<K, V>(name);
  if (cached) {
    return cached;
  }

  const loader = createLoader(config);
  globalCache.set(name, loader);
  return loader;
}

/**
 * Create a batch loading function from a fetcher
 *
 * @param fetcher - Function to fetch multiple items by keys
 * @returns Batch load function for DataLoader
 */
export function batchLoadFn<K, V>(
  fetcher: (keys: readonly K[]) => Promise<V[]>,
  keyExtractor: (item: V) => K,
): (keys: readonly K[]) => Promise<(V | Error)[]> {
  return async (keys: readonly K[]): Promise<(V | Error)[]> => {
    try {
      const items = await fetcher(keys);
      const itemMap = new Map<K, V>();

      for (const item of items) {
        const key = keyExtractor(item);
        itemMap.set(key, item);
      }

      return keys.map((key) => {
        const item = itemMap.get(key);
        if (item === undefined) {
          return new Error(`Item not found for key: ${String(key)}`);
        }
        return item;
      });
    } catch (error) {
      return keys.map(() =>
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };
}

/**
 * Get or create a request-scoped loader
 *
 * This stores loaders in the GraphQL context for request-scoped caching.
 *
 * @param context - GraphQL context
 * @param name - Loader name
 * @param factory - Factory function to create the loader
 * @returns DataLoader instance
 */
export function getOrCreateLoader<K, V>(
  context: GraphQLContext,
  name: string,
  factory: () => DataLoader<K, V>,
): DataLoader<K, V> {
  // Store in a WeakMap attached to context (would need context extension)
  // For now, use the factory directly
  return factory();
}
