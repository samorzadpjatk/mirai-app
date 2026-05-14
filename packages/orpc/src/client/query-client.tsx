/** @jsxImportSource react */
"use client";

import {
  QueryClient,
  QueryClientProvider,
  type QueryCacheNotifyEvent,
  type MutationCacheNotifyEvent,
} from "@tanstack/react-query";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterUtils } from "@orpc/tanstack-query";
import { ORPCError } from "@orpc/client";
import { getORPCClient } from "./vanilia";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../api/root";
import React, { useEffect, useMemo, useRef } from "react";
import { useSession, useAuth } from "@mirai-app/auth/client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchInterval: 30 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof globalThis === "undefined" || !("window" in globalThis)) {
    return makeQueryClient();
  } else {
    browserQueryClient ??= makeQueryClient();
    return browserQueryClient;
  }
}

export const queryClient = getQueryClient();

export let orpc: RouterUtils<RouterClient<AppRouter>>;

const isUnauthorizedError = (error: unknown) => {
  if (error instanceof ORPCError) {
    return error.code === "UNAUTHORIZED";
  }
  const anyError = error as {
    data?: { code?: string };
    shape?: { data?: { code?: string } };
  };
  const code = anyError?.data?.code ?? anyError?.shape?.data?.code;
  return code === "UNAUTHORIZED";
};

export function QueryProvider({
  httpUrl,
  wsUrl,
  children,
}: {
  httpUrl: string;
  wsUrl: string;
  children: React.ReactNode;
}) {
  const session = useSession();
  const { signOut, refreshSession } = useAuth();
  const authToken = session?.access_token;
  const cleanupRef = useRef<(() => Promise<void>) | null>(null);
  const isRefreshingRef = useRef(false);

  const { client, cleanup } = useMemo(
    () => getORPCClient(httpUrl, wsUrl, authToken),
    [authToken, httpUrl, wsUrl],
  );

  const orpcUtils = useMemo(
    () => createTanstackQueryUtils(client),
    [client],
  );

  orpc = orpcUtils;

  useEffect(() => {
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    const handleUnauthorized = async () => {
      if (!authToken) {
        return;
      }

      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      try {
        await refreshSession();
      } catch (error) {
        console.warn(
          "[QueryProvider] Refresh session failed after unauthorized, signing out",
          error,
        );
        await signOut();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    const handleError = (error: unknown) => {
      if (isUnauthorizedError(error)) {
        void handleUnauthorized();
      }
    };

    const unsubscribeQuery = queryCache.subscribe(
      (event: QueryCacheNotifyEvent | undefined) => {
        const error: unknown = event?.query?.state?.error;
        if (error) {
          handleError(error);
        }
      },
    );

    const unsubscribeMutation = mutationCache.subscribe(
      (event: MutationCacheNotifyEvent | undefined) => {
        const error: unknown = event?.mutation?.state?.error;
        if (error) {
          handleError(error);
        }
      },
    );

    if (cleanupRef.current) {
      cleanupRef
        .current()
        .then(() => {
          cleanupRef.current = null;
        })
        .catch((error) => {
          console.error(
            "[QueryProvider] Error cleaning up previous WebSocket connection:",
            error,
          );
        });
    }

    if (cleanup) {
      cleanupRef.current = cleanup;
    }

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
      if (cleanupRef.current) {
        cleanupRef
          .current()
          .then(() => {
            cleanupRef.current = null;
          })
          .catch((error) => {
            console.error(
              "[QueryProvider] Error cleaning up WebSocket connection:",
              error,
            );
          });
      }
    };
  }, [cleanup, signOut, refreshSession, authToken]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
