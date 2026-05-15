import { vi } from "vitest";

/**
 * No-op function for use as a placeholder callback.
 * Use this instead of empty arrow functions to satisfy ESLint rules.
 */
export function noop(): void {
  // intentionally empty
}

/**
 * Resets all mocks between tests.
 * Call this in beforeEach or afterEach hooks.
 */
export function resetMocks(): void {
  vi.clearAllMocks();
}

/**
 * Mocks console methods during tests.
 * Useful for suppressing expected warnings/errors in tests.
 */
export function mockConsole(
  methods: ("log" | "error" | "warn" | "info" | "debug")[] = ["error", "warn"],
): { restore: () => void } {
  const originals: Partial<Record<(typeof methods)[number], typeof console.log>> = {};

  for (const method of methods) {
    originals[method] = console[method];
    console[method] = vi.fn();
  }

  return {
    restore: () => {
      for (const method of methods) {
        if (originals[method]) {
          console[method] = originals[method]!;
        }
      }
    },
  };
}

/**
 * Creates a delayed promise for testing async operations.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flushes all pending promises.
 * Useful for testing async code with timers.
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Waits for a condition to be true.
 * Useful for testing async state changes.
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await delay(interval);
  }

  throw new Error(`waitFor timeout: condition not met within ${timeout}ms`);
}

/**
 * Creates a mock function that resolves with a delayed value.
 */
export function createDelayedMock<T>(value: T, delayMs = 100): () => Promise<T> {
  return vi.fn().mockImplementation(() => delay(delayMs).then(() => value));
}

/**
 * Creates a mock function that rejects with a delayed error.
 */
export function createDelayedErrorMock(error: Error, delayMs = 100): () => Promise<never> {
  return vi.fn().mockImplementation(() => delay(delayMs).then(() => Promise.reject(error)));
}

/**
 * Type-safe mock builder for creating typed mocks.
 */
export function createTypedMock<T extends (...args: unknown[]) => unknown>(): {
  mock: T;
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => void;
  mockRejectedValue: (error: Error) => void;
  mockImplementation: (impl: T) => void;
} {
  const mockFn = vi.fn();

  return {
    mock: mockFn as unknown as T,
    mockResolvedValue: (value: Awaited<ReturnType<T>>) => {
      mockFn.mockResolvedValue(value);
    },
    mockRejectedValue: (error: Error) => {
      mockFn.mockRejectedValue(error);
    },
    mockImplementation: (impl: T) => {
      mockFn.mockImplementation(impl);
    },
  };
}
