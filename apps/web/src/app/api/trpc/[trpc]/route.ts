import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { appRouter, createTRPCContext } from "@integral-2025-app/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) =>
  createTRPCContext({
    headers: req.headers,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }: { path?: string; error: Error }) =>
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            )
        : undefined,
  });

export { handler as GET, handler as POST };
