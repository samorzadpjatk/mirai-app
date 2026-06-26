/** @jsxImportSource react */
"use client";

import type { AuthUser } from "@mirai-app/common/stores";
import { authStore, type SupabaseClient } from "@mirai-app/common/stores";
import { type ReactNode, useEffect, useRef } from "react";

export interface AuthStoreProviderProps {
  children: ReactNode;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseClient?: SupabaseClient;
  storageOptions?: {
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  };
  onUserFetch?: (authUserId: string) => Promise<AuthUser | null>;
}

/**
 * Initializes the Zustand auth store with the Supabase client.
 * Drop-in replacement for the old AuthProvider context component.
 */
export function AuthStoreProvider({
  children,
  supabaseClient,
  onUserFetch,
  storageOptions,
}: AuthStoreProviderProps) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!supabaseClient) return;

    const cleanup = authStore.getState().initialize({
      client: supabaseClient,
      onUserFetch,
      storage: storageOptions?.storage,
    });

    cleanupRef.current = cleanup;

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [supabaseClient, onUserFetch, storageOptions]);

  return <>{children}</>;
}
