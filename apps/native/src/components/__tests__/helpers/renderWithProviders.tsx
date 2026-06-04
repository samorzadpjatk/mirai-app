import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import type React from "react";
import type { ReactNode } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

interface WrapperProps {
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
 * Wrapper component that provides all necessary providers for component tests
 */
const ProvidersWrapper: React.FC<WrapperProps> = ({ children }) => {
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
 * Renders a component with all necessary providers wrapped around it
 * @param component - The component to render
 * @returns The rendered component with testing utilities
 */
export function renderWithProviders(component: React.ReactElement) {
  return render(component, { wrapper: ProvidersWrapper });
}

export { createTestQueryClient };
