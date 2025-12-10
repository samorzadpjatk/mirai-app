/**
 * tRPC client utilities for the native app.
 * 
 * This module re-exports tRPC utilities from the shared package
 * and provides app-specific configuration.
 */

import Constants from "expo-constants";
import { 
  createExpoTRPCClient as baseCreateExpoTRPCClient 
} from "@integral-2025-app/trpc/client/expo";

export { api } from "@integral-2025-app/trpc/client";
export { TRPCProvider } from "@integral-2025-app/trpc/client";

/**
 * Create tRPC client configuration for this Expo app.
 * Uses the app's Expo configuration to determine the API URL.
 */
export function createTRPCClientConfig() {
  return baseCreateExpoTRPCClient({
    expoConfig: Constants.expoConfig ?? undefined,
  });
}
