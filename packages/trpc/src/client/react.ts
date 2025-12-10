import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "~/api/root";

/**
 * Create tRPC React hooks for your API.
 * This is the base client that can be used in any React environment.
 */
export const api: ReturnType<typeof createTRPCReact<AppRouter>> =
  createTRPCReact<AppRouter>();

/**
 * Configuration options for creating a tRPC client.
 */
export interface TRPCClientConfig {
  /**
   * The base URL for the tRPC API endpoint.
   * @example "http://localhost:3000"
   */
  baseUrl: string;

  /**
   * Optional custom headers to include with requests.
   * Can be an object or a function returning headers (sync or async).
   */
  headers?:
    | Record<string, string>
    | (() => Promise<Record<string, string>> | Record<string, string>);

  /**
   * Source identifier for the client (used in headers).
   * @default "react-client"
   */
  source?: string;
}

/**
 * Create a tRPC client for React Query.
 * 
 * @param config - Configuration options for the client
 * @returns A configured tRPC client instance
 * 
 * @example
 * ```tsx
 * const client = createTRPCClient({
 *   baseUrl: "http://localhost:3000",
 *   source: "web-app"
 * });
 * ```
 */
export function createTRPCClient(config: TRPCClientConfig) {
  const { baseUrl, headers, source = "react-client" } = config;

  return api.createClient({
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
      }),
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: SuperJSON,
        async headers() {
          let resolvedHeaders: Record<string, string> = {};
          if (typeof headers === "function") {
            resolvedHeaders = await headers();
          } else if (headers) {
            resolvedHeaders = headers;
          }
          return {
            "x-trpc-source": source,
            ...resolvedHeaders,
          };
        },
      }),
    ],
  });
}
