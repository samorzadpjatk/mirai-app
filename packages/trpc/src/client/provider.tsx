"use client";

import { useState } from "react";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api, createTRPCClient, type TRPCClientConfig } from "./react";
import { createQueryClient, type QueryClientConfig } from "./query-client";

/**
 * Configuration for the TRPCProvider component.
 */
export interface TRPCProviderConfig {
  /**
   * Configuration for the tRPC client.
   */
  client: TRPCClientConfig;

  /**
   * Optional configuration for the Query Client.
   */
  queryClient?: QueryClientConfig;

  /**
   * Optional headers (object or factory) forwarded to tRPC client.
   */
  headers?: TRPCClientConfig["headers"];
}

/**
 * TRPCProvider component that wraps your app with React Query and tRPC providers.
 * This should be added at the root of your application.
 *
 * @example
 * ```tsx
 * import { TRPCProvider } from "@integral-2025-app/trpc/client";
 *
 * export default function RootLayout() {
 *   return (
 *     <TRPCProvider
 *       client={{
 *         baseUrl: "http://localhost:3000",
 *         source: "my-app"
 *       }}
 *     >
 *       <App />
 *     </TRPCProvider>
 *   );
 * }
 * ```
 */
export function TRPCProvider({
  children,
  client: clientConfig,
  queryClient: queryClientConfig,
}: {
  children: React.ReactNode;
  client: TRPCClientConfig;
  queryClient?: QueryClientConfig;
}) {
  // Create query client and tRPC client once per app lifecycle
  const [queryClient] = useState<QueryClient>(() => createQueryClient(queryClientConfig));
  const [trpcClient] = useState(() => createTRPCClient({ ...clientConfig }));

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}
