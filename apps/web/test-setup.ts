/**
 * Test Setup for @mirai-app/web
 *
 * This file is preloaded by Bun test runner and sets up:
 * - Happy DOM environment for browser-like testing
 * - Environment variables for tests
 * - Global mocks for external dependencies
 *
 * For TamaguiProvider wrapper, import from @mirai-app/ui/test
 *
 * @module test-setup
 *
 * @example
 * ```bash
 * bun test --preload ./test-setup.ts
 * # Or via bunfig.toml preload configuration
 * ```
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";

// =============================================================================
// Happy DOM Registration
// =============================================================================

// Use a global flag to prevent double registration when running from root
const HAPPY_DOM_REGISTERED = "__HAPPY_DOM_REGISTERED__";

if (
  !(globalThis as typeof globalThis & { [HAPPY_DOM_REGISTERED]: boolean })[
    HAPPY_DOM_REGISTERED
  ]
) {
  // Preserve native Bun fetch-related globals before happy-dom registration
  const nativeFetch = globalThis.fetch;
  const nativeResponse = globalThis.Response;
  const nativeRequest = globalThis.Request;
  const nativeHeaders = globalThis.Headers;

  try {
    // Register Happy DOM for browser-like environment
    GlobalRegistrator.register();
    (globalThis as typeof globalThis & { [HAPPY_DOM_REGISTERED]: boolean })[
      HAPPY_DOM_REGISTERED
    ] = true;
  } catch {
    // Already registered, ignore error
    (globalThis as typeof globalThis & { [HAPPY_DOM_REGISTERED]: boolean })[
      HAPPY_DOM_REGISTERED
    ] = true;
  }

  // Restore native fetch-related globals to fix "Expected a Response object" errors
  // This keeps happy-dom's DOM APIs (window, document, etc.) while using Bun's native fetch
  globalThis.fetch = nativeFetch;
  globalThis.Response = nativeResponse;
  globalThis.Request = nativeRequest;
  globalThis.Headers = nativeHeaders;

  // Also ensure window uses the native fetch for any requests
  if (globalThis.window) {
    globalThis.window.fetch = nativeFetch;
    globalThis.window.Response = nativeResponse;
    globalThis.window.Request = nativeRequest;
    globalThis.window.Headers = nativeHeaders;
  }
}

// =============================================================================
// Environment Variables
// =============================================================================

process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.PUBLIC_GRAPHQL_URL = "http://localhost:3001/graphql";
process.env.PUBLIC_GRAPHQL_WS_URL = "ws://localhost:3001/graphql";

// =============================================================================
// React Native / Expo Globals (Required for Tamagui)
// =============================================================================

(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ =
  process.env.NODE_ENV === "development";

// =============================================================================
// Global Mocks
// =============================================================================

// Mock react-hot-toast globally
const mockToast = {
  success: () => "success-toast-id",
  error: () => "error-toast-id",
  loading: () => "loading-toast-id",
  custom: () => "custom-toast-id",
  dismiss: () => {},
  remove: () => {},
  promise: () => Promise.resolve("promise-toast-id"),
};

mock.module("react-hot-toast", () => ({
  toast: mockToast,
  Toaster: () => null,
  useToaster: () => ({ toasts: [], handlers: {} }),
}));

// =============================================================================
// Console Suppression
// =============================================================================

// Suppress console output during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  const noop = () => {};
  globalThis.console.log = noop;
  globalThis.console.info = noop;
  globalThis.console.debug = noop;
  // Keep console.warn and console.error for debugging test failures
}
