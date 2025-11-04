import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "~/server/api/root";

export function getBaseUrl() {
  return globalThis.location?.origin ?? "http://localhost:3000";
}

// Service Worker tRPC client: send same-site/http-only session cookie from AuthJS
// by making fetch include credentials. Do NOT attempt to read the cookie in JS;
// instead let the browser attach it automatically.
export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getBaseUrl() + "/api/trpc",
      transformer: SuperJSON,
      // wrap global fetch to ensure credentials (cookies) are sent with requests
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        // ensure the SW's global fetch is still used but with credentials included
        globalThis.fetch(input, {
          ...init,
          credentials: "include",
        }),
      headers: {
        "x-trpc-source": "service-worker",
      },
    }),
  ],
});
