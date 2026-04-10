"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * QueryProvider - TanStack Query Client Provider
 *
 * Wraps the application with QueryClientProvider for React Query hooks.
 * This provider should be placed high in the component tree, ideally in
 * the root layout or main app component.
 *
 * @example
 * ```tsx
 * // In your root layout or app component
 * import { QueryProvider } from "@/components/QueryProvider";
 *
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <YourApp />
 *     </QueryProvider>
 *   );
 * }
 * ```
 */

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Default QueryClient configuration
 *
 * These defaults optimize for data that doesn't change frequently
 * and reduce unnecessary network requests:
 *
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - refetchOnWindowFocus: false - Don't refetch when window regains focus
 * - retry: 1 - Only retry failed requests once
 * - refetchOnReconnect: true - Refetch when network reconnects
 */
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Don't refetch when window regains focus
        refetchOnWindowFocus: false,
        // Refetch when network reconnects
        refetchOnReconnect: true,
        // Only retry once on failure
        retry: 1,
        // Cache data for 10 minutes
        gcTime: 10 * 60 * 1000,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
      },
    },
  });

/**
 * QueryProvider Component
 *
 * Provides TanStack Query functionality to all child components.
 * Uses React state to ensure the QueryClient is only created once.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Use state to ensure QueryClient is only created once per component lifecycle
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/**
 * Hook to access the QueryClient instance directly.
 * Useful for programmatic cache management.
 *
 * @example
 * ```tsx
 * import { useQueryClient } from "@tanstack/react-query";
 *
 * function MyComponent() {
 *   const queryClient = useQueryClient();
 *
 *   const handleLogout = () => {
 *     // Clear all cached queries on logout
 *     queryClient.clear();
 *   };
 *
 *   return <button onClick={handleLogout}>Logout</button>;
 * }
 * ```
 */
export { useQueryClient } from "@tanstack/react-query";

export default QueryProvider;
