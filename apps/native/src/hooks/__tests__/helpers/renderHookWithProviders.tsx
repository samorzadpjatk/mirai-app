import React, { ReactNode } from "react";
import { renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface HookWrapperProps {
  children: ReactNode;
}

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
 * Wrapper component that provides all necessary providers for hook tests
 */
const HookProvidersWrapper: React.FC<HookWrapperProps> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
          frame: { x: 0, y: 0, width: 390, height: 844 },
        }}
      >
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

/**
 * Renders a hook with all necessary providers wrapped around it
 * @param hook - The hook to render
 * @returns The result of the hook and the queryClient for assertions
 */
export function renderHookWithProviders<T>(hook: () => T) {
  const queryClient = createTestQueryClient();

  const wrapper: React.FC<HookWrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
          frame: { x: 0, y: 0, width: 390, height: 844 },
        }}
      >
        {children}
      </SafeAreaProvider>
    </QueryClientProvider>
  );

  return {
    ...renderHook(hook, { wrapper }),
    queryClient,
  };
}

export { createTestQueryClient };
