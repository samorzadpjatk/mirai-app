import { queryClient } from "@mirai-app/orpc/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import {
  type PersistedQueryCacheController,
  createPersistedQueryCacheController,
} from "~/services/queryCache/persistedQueryCache";

let controller: PersistedQueryCacheController | null = null;

const getController = (): PersistedQueryCacheController => {
  controller ??= createPersistedQueryCacheController({ queryClient, storage: AsyncStorage });
  return controller;
};

/**
 * Restore the signed-in user's cached queries on launch and keep them on disk.
 *
 * - `string`: that user is signed in.
 * - `null`: nobody is signed in; clears the cache of whoever was.
 * - `undefined`: not known yet (the session is still being read); changes nothing.
 */
export function usePersistedQueryCache(userId: string | null | undefined): void {
  useEffect(() => {
    if (userId === undefined) {
      return;
    }
    getController().setUser(userId);
  }, [userId]);
}
