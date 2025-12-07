import createBaseSupabaseClient from "./base";
import type { StorageAdapter } from "./types";

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

const getStorage = (userStorage?: StorageAdapter): StorageAdapter => {
  if (userStorage) {
    return userStorage;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return createInMemoryStorage();
};

export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string, storage?: StorageAdapter) => {
  const selectedStorage = getStorage(storage);

  return createBaseSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      storage: selectedStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};
