/**
 * GraphQL Provider Component
 *
 * React context wrapper for the urql GraphQL client.
 * Provides GraphQL client context to all child components,
 * enabling the use of urql hooks throughout the application.
 *
 * This provider integrates with the Better Auth session management
 * to ensure Bearer tokens are attached to all GraphQL requests.
 *
 * ## Usage
 *
 * Wrap your application with GraphQLProvider:
 *
 * ```tsx
 * import { GraphQLProvider } from '@/components/providers/GraphQLProvider';
 * import { AuthProvider } from '@/components/providers/AuthProvider';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <GraphQLProvider>
 *         <YourApp />
 *       </GraphQLProvider>
 *     </AuthProvider>
 *   );
 * }
 * ```
 *
 * The provider expects an AuthProvider ancestor that provides the session
 * token via the auth context. The token is synchronized automatically,
 * and the GraphQL client is recreated when the auth state changes.
 *
 * ## SSR Considerations
 *
 * When using with Astro SSR, mark interactive components with `client:load`:
 *
 * ```astro
 * <GraphQLProvider client:load>
 *   <YourComponent />
 * </GraphQLProvider>
 * ```
 *
 * This ensures the provider is only initialized on the client side,
 * avoiding hydration mismatches with the auth state.
 *
 * @module @mirai-app/web/providers/GraphQLProvider
 */

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { Provider as UrqlProvider } from "urql";
import type { Client } from "urql";
import { createClient, createGraphQLClientWrapper } from "@/lib/graphql-client";
import type { GraphQLClient } from "@/lib/graphql-client";

// =============================================================================
// Auth Context Interface (from Step 2)
// =============================================================================

/**
 * Session data structure from Better Auth
 */
interface Session {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Auth context value shape
 *
 * This interface matches the expected exports from the AuthProvider (Step 2).
 * The GraphQLProvider consumes this context to get the current session token.
 */
interface AuthContextValue {
  /** Current session or null if not authenticated */
  session: Session | null;
  /** Whether auth state is loading */
  isLoading: boolean;
}

// Create a minimal auth context for consumption
// The actual AuthProvider from Step 2 provides the real implementation
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Hook to access auth context
 * This is a placeholder - the real implementation comes from Step 2
 */
function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a default value when auth provider is not available
    // This allows GraphQLProvider to be used standalone during development
    return { session: null, isLoading: false };
  }
  return context;
}

// =============================================================================
// GraphQL Context
// =============================================================================

/**
 * GraphQL context value
 */
interface GraphQLContextValue {
  /** urql client instance */
  client: Client;
  /** Programmatic GraphQL client wrapper */
  graphql: GraphQLClient;
  /** Whether GraphQL is ready (client initialized) */
  isReady: boolean;
}

const GraphQLContext = createContext<GraphQLContextValue | undefined>(undefined);

/**
 * Hook to access the GraphQL client instance
 *
 * @returns Object containing the urql client and programmatic wrapper
 *
 * @example
 * ```tsx
 * import { useGraphQL } from '@/components/providers/GraphQLProvider';
 *
 * function MyComponent() {
 *   const { client, graphql } = useGraphQL();
 *
 *   // Use urql client directly
 *   const handleClick = async () => {
 *     const result = await client.query(SomeQuery, { id: "123" }).toPromise();
 *   };
 *
 *   // Or use programmatic wrapper
 *   const handleSubmit = async () => {
 *     const data = await graphql.mutation(CreateUserMutation, { name: "John" });
 *   };
 *
 *   return <button onClick={handleClick}>Query</button>;
 * }
 * ```
 */
export function useGraphQL(): GraphQLContextValue {
  const context = useContext(GraphQLContext);
  if (!context) {
    throw new Error(
      "useGraphQL must be used within a GraphQLProvider. " +
      "Ensure your component tree is wrapped with GraphQLProvider."
    );
  }
  return context;
}

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Props for GraphQLProvider
 */
interface GraphQLProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Optional custom token getter (overrides auth context) */
  getToken?: () => string | null;
  /** Optional initial client (for SSR hydration) */
  initialClient?: Client;
}

/**
 * GraphQL Provider Component
 *
 * Wraps children with urql Provider and exposes GraphQL client context.
 * Automatically integrates with Better Auth session for token management.
 *
 * Features:
 * - Automatic Bearer token attachment from auth session
 * - Client recreation on auth state change
 * - Programmatic GraphQL client wrapper for imperative operations
 * - SSR-safe initialization
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * // Basic usage
 * <GraphQLProvider>
 *   <App />
 * </GraphQLProvider>
 *
 * // With custom token getter (e.g., for testing)
 * <GraphQLProvider getToken={() => mockToken}>
 *   <TestComponent />
 * </GraphQLProvider>
 * ```
 */
export function GraphQLProvider({
  children,
  getToken: customGetToken,
  initialClient,
}: GraphQLProviderProps): React.ReactElement {
  // Get auth context if available
  const auth = useAuthContext();

  // Track client state for re-creation on auth change
  const [clientKey, setClientKey] = useState(0);

  // Token getter function - uses custom getter, auth session, or returns null
  const getToken = useCallback((): string | null => {
    if (customGetToken) {
      return customGetToken();
    }
    return auth.session?.token ?? null;
  }, [customGetToken, auth.session]);

  // Recreate client when auth token changes
  useEffect(() => {
    // Increment key to force client recreation
    setClientKey((prev) => prev + 1);
  }, [auth.session?.token]);

  // Create memoized urql client
  const client = useMemo(() => {
    // Use initial client for SSR, create new one for client-side
    if (typeof window === "undefined" && initialClient) {
      return initialClient;
    }
    return createClient(getToken);
  }, [getToken, initialClient, clientKey]);

  // Create programmatic wrapper
  const graphql = useMemo(() => createGraphQLClientWrapper(client), [client]);

  // Context value
  const contextValue = useMemo<GraphQLContextValue>(
    () => ({
      client,
      graphql,
      isReady: !auth.isLoading,
    }),
    [client, graphql, auth.isLoading]
  );

  return (
    <GraphQLContext.Provider value={contextValue}>
      <UrqlProvider value={client}>
        {children}
      </UrqlProvider>
    </GraphQLContext.Provider>
  );
}

// =============================================================================
// Export Types
// =============================================================================

export type { GraphQLProviderProps, GraphQLContextValue };
