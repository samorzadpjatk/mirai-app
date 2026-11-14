import {
  type PersistedQueryRoot,
  createPersistedQueryFilter,
  deserializePersistedCache,
  serializePersistedCache,
} from "@mirai-app/orpc/client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { QueryClient } from "@tanstack/react-query";
import { type PersistedClient, persistQueryClient } from "@tanstack/react-query-persist-client";

/**
 * Keeps the queries behind the first screen on disk, so a cold start paints the last
 * known feed immediately and refreshes it in the background, instead of holding a
 * full-screen spinner through session -> trips -> feed -> image URLs -> images.
 */

export const PERSISTED_QUERY_CACHE_KEY = "mirai-query-cache";

/** Bump when a persisted query's data shape changes, so old snapshots are dropped. */
export const PERSISTED_QUERY_CACHE_VERSION = 1;

/** A snapshot older than this is thrown away rather than shown. */
export const PERSISTED_QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Allowlist, not denylist: only what the community screen needs to render on launch.
 * Live locations, admin screens and everything else stay memory-only.
 */
export const PERSISTED_QUERY_ROOTS: readonly PersistedQueryRoot[] = [
  ["home", "getHomeFull"],
  ["user", "getMy"],
  ["trip", "getTheme"],
  "community-feed",
  "cached-image-url",
];

const shouldPersistQuery = createPersistedQueryFilter(PERSISTED_QUERY_ROOTS);

/**
 * The snapshot only holds what is still in the in-memory cache, and the default
 * `gcTime` (5 min) drops a query five minutes after its screen unmounts -- the next
 * write would then erase it from disk too. Persisted roots stay around for a day.
 */
export const PERSISTED_QUERY_GC_TIME_MS = 24 * 60 * 60 * 1000;

export function buildPersistedCacheBuster(userId: string): string {
  return `v${PERSISTED_QUERY_CACHE_VERSION}:${userId}`;
}

export interface KeyValueStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export interface PersistedQueryCacheController {
  /** Call with the signed-in user's id, or `null` when nobody is signed in. */
  setUser: (userId: string | null) => void;
}

/**
 * One snapshot on disk, owned by one user at a time.
 *
 * - Signing in starts restoring and persisting under a buster tied to that user, so a
 *   snapshot left by someone else is discarded instead of shown.
 * - Signing out (or switching user) wipes the in-memory cache and the snapshot.
 *
 * The persister's writes are throttled and cannot be cancelled, so a write scheduled
 * just before sign-out could land after the snapshot was removed and leave the
 * previous user's data on disk. Every write therefore goes through a storage wrapper
 * that drops it unless its user is still the active owner.
 */
export function createPersistedQueryCacheController({
  queryClient,
  storage,
  throttleTime = 2000,
}: {
  queryClient: QueryClient;
  storage: KeyValueStorage;
  throttleTime?: number;
}): PersistedQueryCacheController {
  let activeUserId: string | null = null;
  let unsubscribe: (() => void) | null = null;

  for (const root of PERSISTED_QUERY_ROOTS) {
    // An explicit `gcTime` on the query itself (image URLs set 55 min) still wins.
    queryClient.setQueryDefaults([root], { gcTime: PERSISTED_QUERY_GC_TIME_MS });
  }

  const ownedStorage = (ownerId: string): KeyValueStorage => ({
    getItem: (key) => storage.getItem(key),
    setItem: async (key, value) => {
      if (activeUserId !== ownerId) {
        return;
      }
      await storage.setItem(key, value);
    },
    removeItem: (key) => storage.removeItem(key),
  });

  const stop = () => {
    unsubscribe?.();
    unsubscribe = null;
  };

  return {
    setUser(userId) {
      if (userId === activeUserId) {
        return;
      }

      const previousUserId = activeUserId;
      stop();
      activeUserId = userId;

      if (previousUserId !== null) {
        // The previous user's data must not survive into the next session, on screen
        // or on disk.
        queryClient.clear();
        void storage.removeItem(PERSISTED_QUERY_CACHE_KEY).catch(() => undefined);
      }

      if (userId === null) {
        return;
      }

      const persister = createAsyncStoragePersister({
        storage: ownedStorage(userId),
        key: PERSISTED_QUERY_CACHE_KEY,
        throttleTime,
        serialize: (client: PersistedClient) => serializePersistedCache(client),
        deserialize: (text: string) => deserializePersistedCache<PersistedClient>(text),
      });

      const [unsubscribePersist] = persistQueryClient({
        queryClient,
        persister,
        buster: buildPersistedCacheBuster(userId),
        maxAge: PERSISTED_QUERY_CACHE_MAX_AGE_MS,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      });
      unsubscribe = unsubscribePersist;
    },
  };
}
