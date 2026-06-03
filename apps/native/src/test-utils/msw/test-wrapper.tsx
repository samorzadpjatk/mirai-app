import React, { type ReactNode } from "react";
import { render, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useORPCClient } from "@mirai-app/orpc/client";

interface HookWrapperProps {
  children: ReactNode;
}

const TEST_HTTP_URL = "http://localhost:9999";
const TEST_WS_URL = "ws://localhost:9999";

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

/**
 * ORPCClientInitializer initializes the oRPC client singleton
 * so that hooks using `orpc` work in tests.
 */
function ORPCClientInitializer() {
  useORPCClient({ httpUrl: TEST_HTTP_URL });
  return null;
}

/**
 * Renders a hook with all necessary providers and oRPC client initialized.
 * Uses MSW to intercept actual HTTP requests instead of mocking @mirai-app/orpc/client.
 *
 * @param hook - The hook to render
 * @returns The result of the hook and the queryClient for assertions
 */
export function renderHookWithMSW<T>(hook: () => T) {
  const queryClient = createTestQueryClient();

  const wrapper: React.FC<HookWrapperProps> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider
          initialMetrics={{
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
            frame: { x: 0, y: 0, width: 390, height: 844 },
          }}
        >
          <ORPCClientInitializer />
          {children}
        </SafeAreaProvider>
      </QueryClientProvider>
    );
  };

  return {
    ...renderHook(hook, { wrapper }),
    queryClient,
  };
}

/**
 * Renders a component with all necessary providers and oRPC client initialized.
 * Uses MSW to intercept actual HTTP requests instead of mocking TanStack Query hooks.
 *
 * @param component - The React element to render
 * @returns The rendered component with testing utilities and the queryClient for assertions
 */
export function renderWithMSW(component: React.ReactElement) {
  const queryClient = createTestQueryClient();

  const wrapper: React.FC<HookWrapperProps> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider
          initialMetrics={{
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
            frame: { x: 0, y: 0, width: 390, height: 844 },
          }}
        >
          <ORPCClientInitializer />
          {children}
        </SafeAreaProvider>
      </QueryClientProvider>
    );
  };

  return {
    ...render(component, { wrapper }),
    queryClient,
  };
}

export { createTestQueryClient, TEST_HTTP_URL, TEST_WS_URL };
