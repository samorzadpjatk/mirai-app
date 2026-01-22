"use client";

import { useSubscription, createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../api/root";

const trpcContext = createTRPCContext<AppRouter>();

export const TRPCProvider = trpcContext.TRPCProvider;
export const useTRPC = trpcContext.useTRPC;
export const useTRPCClient = trpcContext.useTRPCClient;

export { useSubscription };


