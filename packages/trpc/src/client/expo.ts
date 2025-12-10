/**
 * Expo/React Native specific utilities for tRPC client.
 * 
 * This module provides helper functions for using tRPC in Expo React Native apps.
 */

/**
 * Detect if we're running in a web browser environment
 */
function isWeb(): boolean {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}

/**
 * Get the base API URL for tRPC in an Expo environment.
 * 
 * This function determines the appropriate API URL based on the platform:
 * - Web: uses localhost (browsers run on the same machine)
 * - iOS Simulator: uses localhost
 * - Android Emulator: uses 10.0.2.2 (special alias to host machine)
 * - Production: reads from app.json extra.apiUrl
 * 
 * @param options - Configuration options
 * @param options.defaultPort - Default port for development (default: 3000)
 * @param options.expoConfig - Expo configuration object (defaults to Constants.expoConfig)
 * @returns The base URL for the API
 * 
 * @example
 * ```tsx
 * import Constants from "expo-constants";
 * import { getExpoBaseUrl } from "@integral-2025-app/trpc/client/expo";
 * 
 * const baseUrl = getExpoBaseUrl({
 *   expoConfig: Constants.expoConfig
 * });
 * ```
 */
export function getExpoBaseUrl(options: {
  defaultPort?: number;
  expoConfig?: {
    extra?: Record<string, unknown>;
    ios?: unknown;
  };
} = {}): string {
  const { defaultPort = 11000, expoConfig } = options;
  
  // Check for environment variable first
  const apiUrl = expoConfig?.extra?.apiUrl as string | undefined;
  if (apiUrl) {
    return apiUrl;
  }

  // Default to localhost for development
  // Web and iOS use localhost directly
  // On Android emulator, use 10.0.2.2 to reach host machine
  // Check if we're on web first, then fall back to checking iOS config
  const localhost = isWeb() || expoConfig?.ios ? "localhost" : "10.0.2.2";
  return `http://${localhost}:${defaultPort}`;
}

/**
 * Configuration options for createExpoTRPCClient.
 */
export interface ExpoTRPCClientOptions {
  /**
   * Expo configuration object.
   * Typically imported from 'expo-constants'.
   */
  expoConfig?: {
    extra?: Record<string, unknown>;
    ios?: unknown;
  };
  
  /**
   * Default port for development.
   * @default 3000
   */
  defaultPort?: number;
  
  /**
   * Optional base URL override.
   * If provided, this will be used instead of auto-detection.
   */
  baseUrl?: string;
}

/**
 * Create tRPC client configuration for Expo React Native.
 * 
 * @param options - Configuration options
 * @returns Configuration object to pass to TRPCProvider
 * 
 * @example
 * ```tsx
 * import Constants from "expo-constants";
 * import { TRPCProvider } from "@integral-2025-app/trpc/client";
 * import { createExpoTRPCClient } from "@integral-2025-app/trpc/client/expo";
 * 
 * function App() {
 *   return (
 *     <TRPCProvider client={createExpoTRPCClient({ expoConfig: Constants.expoConfig })}>
 *       <MyApp />
 *     </TRPCProvider>
 *   );
 * }
 * ```
 */
export function createExpoTRPCClient(options: ExpoTRPCClientOptions = {}) {
  const { expoConfig, defaultPort, baseUrl: customBaseUrl } = options;
  
  const baseUrl = customBaseUrl ?? getExpoBaseUrl({ 
    expoConfig, 
    defaultPort 
  });
  
  return {
    baseUrl,
    source: "expo-react-native",
  };
}
