/**
 * Supabase React Provider
 *
 * React context provider for Supabase client integration.
 * Provides the Supabase client to the React component tree.
 *
 * @example
 * ```tsx
 * // In your app root
 * import { SupabaseProvider } from "@mirai-app/frameworks/supabase/react";
 *
 * function App() {
 *   const supabase = createSupabaseClient(url, key);
 *
 *   return (
 *     <SupabaseProvider client={supabase}>
 *       <YourApp />
 *     </SupabaseProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a component
 * import { useSupabase } from "@mirai-app/frameworks/supabase/react";
 *
 * function MyComponent() {
 *   const supabase = useSupabase();
 *
 *   const handleSignIn = async () => {
 *     await supabase.auth.signInWithPassword({ email, password });
 *   };
 *
 *   return <button onClick={handleSignIn}>Sign In</button>;
 * }
 * ```
 */

import React, { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "./types";

/**
 * Context for Supabase client
 */
const SupabaseContext = createContext<SupabaseClient | null>(null);

/**
 * Props for SupabaseProvider
 */
export interface SupabaseProviderProps {
  /** Supabase client instance */
  client: SupabaseClient;
  /** Child components */
  children: React.ReactNode;
}

/**
 * React provider component for Supabase client
 *
 * Makes the Supabase client available to all child components
 * via the useSupabase hook.
 */
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  client,
  children,
}) => {
  const value = useMemo(() => client, [client]);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

/**
 * Hook to access the Supabase client from React components
 *
 * Must be used within a SupabaseProvider.
 *
 * @returns SupabaseClient instance
 * @throws Error if used outside of SupabaseProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const supabase = useSupabase();
 *
 *   useEffect(() => {
 *     supabase.auth.getSession().then(({ data }) => {
 *       console.log(data.session);
 *     });
 *   }, [supabase]);
 *
 *   return <div>Check console for session</div>;
 * }
 * ```
 */
export const useSupabase = (): SupabaseClient => {
  const context = useContext(SupabaseContext);

  if (context === null) {
    throw new Error(
      "useSupabase must be used within a SupabaseProvider. " +
        "Wrap your app with <SupabaseProvider client={supabase}>...</SupabaseProvider>",
    );
  }

  return context;
};

/**
 * Hook to check if component is within SupabaseProvider
 *
 * Useful for conditional logic when Supabase might be optional.
 *
 * @returns boolean indicating if SupabaseProvider is available
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasSupabase = useHasSupabase();
 *
 *   if (!hasSupabase) {
 *     return <div>Supabase not available</div>;
 *   }
 *
 *   const supabase = useSupabase();
 *   // ...
 * }
 * ```
 */
export const useHasSupabase = (): boolean => {
  return useContext(SupabaseContext) !== null;
};
