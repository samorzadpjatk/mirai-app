"use client";

import {
    QueryClient,
    QueryClientProvider,
    type QueryCacheNotifyEvent,
    type MutationCacheNotifyEvent,
} from "@tanstack/react-query";
import { TRPCProvider } from "./react";
import { getTRPCClient } from "./vanilia";
import React, { useEffect, useMemo, useRef } from "react";
import { useSession, useAuthLoading, useAuth } from "@integral-2025-app/auth/client";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 60 * 1000,
                // Keep all active queries fresh with a global polling interval.
                refetchInterval: 30 * 1000,
            },
        },
    });
}
let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
    if (typeof globalThis === 'undefined' || !('window' in globalThis)) {
        // Server: always make a new query client
        return makeQueryClient();
    } else {
        // Browser: make a new query client if we don't already have one
        // This is very important, so we don't re-make a new client if React
        // suspends during the initial render. This may not be needed if we
        // have a suspense boundary BELOW the creation of the query client
        browserQueryClient ??= makeQueryClient();
        return browserQueryClient;
    }
}

const isUnauthorizedError = (error: unknown) => {
    const anyError = error as { data?: { code?: string }; shape?: { data?: { code?: string } } };
    const code = anyError?.data?.code ?? anyError?.shape?.data?.code;
    return code === "UNAUTHORIZED";
};

const APIProvider = ({ httpUrl, wsUrl, getUserAgent, children }: { httpUrl: string; wsUrl: string; getUserAgent: () => Promise<string | null>; children: React.ReactNode }) => {
    const session = useSession();
    const isAuthLoading = useAuthLoading();
    const { signOut, refreshSession } = useAuth();
    const authToken = session?.access_token;
    const queryClient = getQueryClient();
    const cleanupRef = useRef<(() => Promise<void>) | null>(null);
    const isRefreshingRef = useRef(false);

    // Recreate tRPC client when authToken changes to update WebSocket connectionParams
    // Use useMemo unconditionally (always call hooks in same order)
    const trpcClientWrapper = useMemo(
        () => {
            // Don't initialize tRPC client until auth is loaded
            if (isAuthLoading) {
                return null;
            }
            return getTRPCClient(httpUrl, wsUrl, getUserAgent, authToken);
        },
        [authToken, httpUrl, wsUrl, isAuthLoading]
    );

    // Clean up previous client's WebSocket connection when token changes
    useEffect(() => {
        const queryCache = queryClient.getQueryCache();
        const mutationCache = queryClient.getMutationCache();

        const handleUnauthorized = async () => {
            // If there is no token (guest) don't sign out – just ignore
            if (!authToken) {
                return;
            }

            // Avoid multiple simultaneous refresh attempts
            if (isRefreshingRef.current) {
                return;
            }

            isRefreshingRef.current = true;
            try {
                await refreshSession();
            } catch (error) {
                console.warn(
                    "[APIProvider] Refresh session failed after unauthorized, signing out",
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

        const unsubscribeQuery = queryCache.subscribe((event: QueryCacheNotifyEvent | undefined) => {
            const error: unknown = event?.query?.state?.error;
            if (error) {
                handleError(error);
            }
        });

        const unsubscribeMutation = mutationCache.subscribe((event: MutationCacheNotifyEvent | undefined) => {
            const error: unknown = event?.mutation?.state?.error;
            if (error) {
                handleError(error);
            }
        });

        // Clean up previous WebSocket connection if it exists
        if (cleanupRef.current) {
            console.log("[APIProvider] Cleaning up previous WebSocket connection");
            cleanupRef.current().then(() => {
              cleanupRef.current = null;
            }).catch((error) => {
              console.error("[APIProvider] Error cleaning up previous WebSocket connection:", error);
            });

        }

        // Store new cleanup function
        if (trpcClientWrapper) {
            console.log("[APIProvider] Storing new cleanup function");
            cleanupRef.current = trpcClientWrapper.cleanup;
        }

        return () => {
            unsubscribeQuery();
            unsubscribeMutation();
            // Cleanup on unmount
            if (cleanupRef.current) {
              console.log(
                "[APIProvider] Cleaning up previous WebSocket connection",
              );
              cleanupRef
                .current()
                .then(() => {
                  cleanupRef.current = null;
                })
                .catch((error) => {
                  console.error(
                    "[APIProvider] Error cleaning up previous WebSocket connection:",
                    error,
                  );
                });
            }
        };
    }, [trpcClientWrapper, queryClient, signOut, refreshSession, authToken]);

    // Only render TRPCProvider when we have a valid client
    if (isAuthLoading || !trpcClientWrapper) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <TRPCProvider trpcClient={trpcClientWrapper.client} queryClient={queryClient}>
                {children}
            </TRPCProvider>
        </QueryClientProvider>
    );
}

export { APIProvider };
