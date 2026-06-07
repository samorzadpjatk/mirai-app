import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const PERSISTENCE_KEY = "mirai-offline-cache";
const SCHEMA_VERSION = "1.0.0";

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSISTENCE_KEY,
  throttleTime: 1000,
});

export function shouldDehydrateQuery(query: { queryKey: unknown[] }): boolean {
  const key = query.queryKey;

  // Exclude auth-related queries
  if (Array.isArray(key) && key.includes("auth")) {
    return false;
  }

  // Exclude queries with sensitive data
  if (Array.isArray(key) && key.includes("password")) {
    return false;
  }

  // Only persist queries marked with { persist: true }
  if (
    Array.isArray(key) &&
    key.some((k) => {
      if (k && typeof k === "object") {
        const obj = k as Record<string, unknown>;
        return obj.persist === true;
      }
      return false;
    })
  ) {
    return true;
  }

  // Also persist active trip data queries
  if (
    Array.isArray(key) &&
    (key.includes("trip") || key.includes("group") || key.includes("challenge"))
  ) {
    return true;
  }

  return false;
}
