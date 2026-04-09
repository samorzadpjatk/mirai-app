import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();

// Suppress console output during tests unless explicitly enabled
if (!process.env.ENABLE_TEST_LOGS) {
  const noop = () => {};
  globalThis.console.log = noop;
  globalThis.console.info = noop;
  globalThis.console.debug = noop;
  globalThis.console.warn = noop;
}
