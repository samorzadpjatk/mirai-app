/**
 * Mock functions for @mirai-app/orpc/client
 *
 * These provide a flexible structure that tests can customize
 * using mockReturnValue() or mockImplementation().
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
 * Mock function for orpc client access.
 */
export const mockORPCClient = jest.fn(() => {
  return createMockRouterProxy();
});

/**
 * Default mock implementation for the client module.
 */
export const getORPCClient = mockORPCClient;
