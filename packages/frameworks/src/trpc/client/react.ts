"use client";

import { createContext, useContext } from "react";
import { useSubscription } from "@trpc/tanstack-react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "@repo/adapters/api/root";

interface TRPCContextValue {
    trpcProxy: TRPCOptionsProxy<AppRouter>;
    trpcVanillaClient: TRPCClient<AppRouter>;
}

export const TRPCContext = createContext<TRPCContextValue | null>(null);

export function useTRPC(): TRPCOptionsProxy<AppRouter> {
    const ctx = useContext(TRPCContext);
    if (!ctx) {
        throw new Error("useTRPC must be used within APIProvider");
    }
    return ctx.trpcProxy;
}

export function useTRPCClient(): TRPCClient<AppRouter> {
    const ctx = useContext(TRPCContext);
    if (!ctx) {
        throw new Error("useTRPCClient must be used within APIProvider");
    }
    return ctx.trpcVanillaClient;
}

export { useSubscription };
