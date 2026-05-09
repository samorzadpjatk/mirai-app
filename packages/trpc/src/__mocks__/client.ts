import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { TRPCClient } from "@trpc/client";
import type { AppRouter } from "../api/root";

/**
 * Mock functions for @mirai-app/trpc/client
 *
 * These mocks provide a flexible structure that tests can customize
 * using mockReturnValue() or mockImplementation().
 *
 * Usage in tests:
 * ```typescript
 * import { mockUseTRPC, mockUseTRPCClient } from "@mirai-app/trpc/client";
 *
 * beforeEach(() => {
 *   jest.clearAllMocks();
 * });
 *
 * it("should fetch trips", () => {
 *   mockUseTRPC.mockReturnValue({
 *     trip: {
 *       getAll: {
 *         queryOptions: jest.fn(() => ({ queryKey: ["trip", "getAll"] })),
 *       },
 *     },
 *   });
 *
 *   // ... test code
 * });
 * ```
 */

// Use global jest - available in Jest test environments
declare const jest: {
  fn: <T extends (...args: unknown[]) => unknown>(implementation?: T) => MockFunction<T>;
};

type MockFunction<T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown> = T & {
  mockReturnValue: (value: ReturnType<T>) => MockFunction<T>;
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockFunction<T>;
  mockImplementation: (implementation: T) => MockFunction<T>;
  mockClear: () => void;
  mockReset: () => void;
};

/**
 * Default mock router proxy that returns jest.fn() for any property access.
 * This allows tests to use any router without pre-defining all possible methods.
 */
const createMockRouterProxy = () => {
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (typeof prop === "string") {
          return {
            queryOptions: jest.fn(() => ({
              queryKey: [prop],
            })),
            mutationOptions: jest.fn(() => ({
              mutationFn: jest.fn(),
            })),
            query: jest.fn().mockResolvedValue({}),
            mutate: jest.fn().mockResolvedValue({}),
            mutateAsync: jest.fn().mockResolvedValue({}),
            subscribe: jest.fn(() => ({
              unsubscribe: jest.fn(),
            })),
          };
        }
        return jest.fn(() => ({}));
      },
    }
  );
};

/**
 * Mock function for useTRPC hook.
 * Returns a TRPCOptionsProxy-like object with jest.fn() for all router methods.
 */
export const mockUseTRPC = jest.fn<() => TRPCOptionsProxy<AppRouter>>(() => {
  return createMockRouterProxy() as TRPCOptionsProxy<AppRouter>;
});

/**
 * Mock function for useTRPCClient hook.
 * Returns a TRPCClient-like object with jest.fn() for all router methods.
 */
export const mockUseTRPCClient = jest.fn<() => TRPCClient<AppRouter>>(() => {
  return createMockRouterProxy() as unknown as TRPCClient<AppRouter>;
});

/**
 * Default mock implementation for the client module.
 * Tests can import and re-configure these mocks as needed.
 */
export const useTRPC = mockUseTRPC;
export const useTRPCClient = mockUseTRPCClient;

/**
 * Re-export useSubscription as a mock (for completeness)
 */
export const useSubscription = jest.fn();

/**
 * Default export for jest.mock compatibility
 */
export default {
  useTRPC: mockUseTRPC,
  useTRPCClient: mockUseTRPCClient,
  useSubscription,
};
