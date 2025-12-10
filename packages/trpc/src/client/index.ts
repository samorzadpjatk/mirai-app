/**
 * tRPC client utilities for React applications.
 * 
 * This module provides client-side utilities for using tRPC with React Query.
 */

// Core client utilities
export { api, createTRPCClient, type TRPCClientConfig } from "./react";

// Query client configuration
export { createQueryClient, type QueryClientConfig } from "./query-client";

// Provider component
export { TRPCProvider, type TRPCProviderConfig } from "./provider";

// Expo-specific utilities (optional, only import if using Expo)
export { 
  getExpoBaseUrl, 
  createExpoTRPCClient,
  type ExpoTRPCClientOptions 
} from "./expo";
