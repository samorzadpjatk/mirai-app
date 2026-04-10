"use client";

import { Provider as UrqlProvider, useClient } from "urql";
import { type ReactNode } from "react";
import { urqlClient } from "../lib/urql-client";

/**
 * QueryProvider - urql GraphQL Client Provider
 *
 * Wraps the application with urql Provider for GraphQL hooks.
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
 * QueryProvider Component
 *
 * Provides urql GraphQL functionality to all child components.
 * Uses the preconfigured urql client from lib/urql-client.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return <UrqlProvider value={urqlClient}>{children}</UrqlProvider>;
}

/**
 * Hook to access the urql client instance directly.
 * Useful for programmatic cache management.
 *
 * @example
 * ```tsx
 * import { useUrqlClient } from "@/components/QueryProvider";
 *
 * function MyComponent() {
 *   const client = useUrqlClient();
 *
 *   const handleLogout = () => {
 *     // Clear all cached queries on logout
 *     // urql doesn't have a clear() method like react-query
 *     // Instead, invalidate specific queries or reload the page
 *   };
 *
 *   return <button onClick={handleLogout}>Logout</button>;
 * }
 * ```
 */
export { useClient as useUrqlClient } from "urql";

export default QueryProvider;
