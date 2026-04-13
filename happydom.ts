import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Skip happy-dom for backend-server tests that need native fetch
// Backend tests run HTTP servers and need native Node.js/Bun fetch,
// not browser fetch which causes CORS issues
const cwd = process.cwd();
const isBackendTest =
  cwd.includes("apps/backend-server") ||
  process.argv.some((arg) => arg.includes("backend-server"));

if (!isBackendTest) {
  GlobalRegistrator.register();
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
