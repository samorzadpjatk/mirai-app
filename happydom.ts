import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Skip happy-dom for backend-server tests that need native fetch
// Backend tests run HTTP servers and need native Node.js/Bun fetch,
// not browser fetch which causes CORS issues
const cwd = process.cwd();
const isBackendTest =
  cwd.includes("apps/backend-server") ||
  process.argv.some((arg) => arg.includes("backend-server"));

if (!isBackendTest) {
  // Preserve native Bun fetch-related globals before happy-dom registration
  // happy-dom replaces these with browser versions that are incompatible with Bun's test runner
  const nativeFetch = globalThis.fetch;
  const nativeResponse = globalThis.Response;
  const nativeRequest = globalThis.Request;
  const nativeHeaders = globalThis.Headers;

  GlobalRegistrator.register();

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

// Suppress console output during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  const noop = () => {};
  globalThis.console.log = noop;
  globalThis.console.info = noop;
  globalThis.console.debug = noop;
  globalThis.console.warn = noop;
}
