import { vi } from "vitest";

// Suppress expected console output during tests
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

const shouldSuppress = (message: string): boolean => {
  const suppressedPatterns = [
    /\[Supabase\]/,
    /Creating client with URL/,
    /Created server singleton client/,
  ];
  return suppressedPatterns.some((pattern) => pattern.test(message));
};

console.log = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalConsoleLog.apply(console, args);
  }
};

console.info = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalConsoleInfo.apply(console, args);
  }
};

// Restore after all tests
vi.restoreAllMocks();
