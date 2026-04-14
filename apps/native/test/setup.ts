/**
 * Test Infrastructure for @mirai-app/native
 *
 * Provides the TestWrapper component with TamaguiProvider for Happy DOM environment.
 * This file is preloaded by bunfig.toml for all tests in this package.
 *
 * **CRITICAL**: `disableInjectCSS` is set to prevent CSS injection issues in test environment.
 *
 * @module test/setup
 *
 * @example
 * ```typescript
 * import { describe, it, expect } from 'bun:test';
 * import { render } from '@testing-library/react-native';
 * import { TestWrapper } from './TestWrapper';
 * import { Button } from '@mirai-app/ui';
 *
 * describe('[UNIT] Button', () => {
 *   it('renders with TamaguiProvider', () => {
 *     const { getByText } = render(
 *       <TestWrapper>
 *         <Button>Click me</Button>
 *       </TestWrapper>
 *     );
 *     expect(getByText('Click me')).toBeDefined();
 *   });
 * });
 * ```
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";

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

// Define React Native / Expo globals
(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ =
  process.env.NODE_ENV === "development";

// Define additional React Native globals that may be expected by native components
if (typeof globalThis.navigator === "undefined") {
  (
    globalThis as typeof globalThis & { navigator: { product: string } }
  ).navigator = {
    product: "ReactNative",
  };
}

// Suppress console output during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  const noop = () => {};
  globalThis.console.log = noop;
  globalThis.console.info = noop;
  globalThis.console.debug = noop;
  // Keep console.warn and console.error for debugging test failures
}

// Export test environment indicator
export const isTestEnvironment = true;

// Note: TestWrapper is now imported from @mirai-app/ui/test
// Re-export here for backwards compatibility during migration
export { TestWrapper } from "@mirai-app/ui/test";
