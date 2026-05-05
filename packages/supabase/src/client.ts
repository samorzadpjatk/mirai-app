import createBaseSupabaseClient from "./base";
import type { StorageAdapter, SupabaseClientOptions } from "./types";

const createInMemoryStorage = (): StorageAdapter => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
};

const getGlobalLocalStorage = (): StorageAdapter | undefined => {
  if (typeof globalThis === "undefined") return undefined;
  const g = globalThis as unknown as { localStorage?: StorageAdapter };
  return g.localStorage;
};

const getStorage = (userStorage?: StorageAdapter): StorageAdapter => {
  if (userStorage) {
    return userStorage;
  }

  const globalLocalStorage = getGlobalLocalStorage();
  if (globalLocalStorage) {
    return globalLocalStorage;
  }

  return createInMemoryStorage();
};

/**
 * Create a Supabase client.
 * - `storage` is used for auth persistence in browser-like environments
 * - `options` allows overriding client options (useful for server/service-role client)
 */
export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseKey: string,
  storage?: StorageAdapter,
  options?: SupabaseClientOptions,
) => {
  const selectedStorage = getStorage(storage);

  const mergedOptions: SupabaseClientOptions = {
    ...options,
    auth: {
      storage: selectedStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
  };

  return createBaseSupabaseClient(supabaseUrl, supabaseKey, mergedOptions);
};
