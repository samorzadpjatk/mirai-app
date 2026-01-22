"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getTRPCClient, TRPCProvider } from "./react";
import React, { useEffect, useMemo, useRef } from "react";
import { useSession, useAuthLoading } from "@integral-2025-app/auth/client";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // With SSR, we usually want to set some default staleTime
                // above 0 to avoid refetching immediately on the client
                staleTime: 60 * 1000,
            },
        },
    });
}
let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
    if (typeof window === 'undefined') {
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

const APIProvider = ({ httpUrl, wsUrl, children }: { httpUrl: string; wsUrl: string; children: React.ReactNode }) => {
    const session = useSession();
    const isAuthLoading = useAuthLoading();
    const authToken = session?.access_token;
    const queryClient = getQueryClient();
    const cleanupRef = useRef<(() => Promise<void>) | null>(null);

    // Recreate tRPC client when authToken changes to update WebSocket connectionParams
    // Use useMemo unconditionally (always call hooks in same order)
    const trpcClientWrapper = useMemo(
        () => {
            // Don't initialize tRPC client until auth is loaded
            if (isAuthLoading) {
                return null;
            }
            return getTRPCClient(httpUrl, wsUrl, authToken);
        },
        [authToken, httpUrl, wsUrl, isAuthLoading]
    );

    // Clean up previous client's WebSocket connection when token changes
    useEffect(() => {
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
    }, [trpcClientWrapper]);

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