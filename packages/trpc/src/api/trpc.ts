/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import {
  requireAdmin,
  requireAuth,
  requireModerator,
} from "@integral-2025-app/auth";
import { createSupabaseClient } from "@integral-2025-app/supabase";
import { db } from "@integral-2025-app/db";

const getAccessTokenFromHeaders = (headers: Headers): string | null => {
  const authorization =
    headers.get("authorization") ?? headers.get("Authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
};

const getAccessToken = (
  headers: Headers,
  connectionParams?: unknown,
): string | null => {
  const headerToken = getAccessTokenFromHeaders(headers);
  if (headerToken) {
    return headerToken;
  }

  if (
    connectionParams &&
    typeof connectionParams === "object" &&
    "authToken" in connectionParams
  ) {
    const token = (connectionParams as { authToken?: unknown }).authToken;

    if (typeof token === "string" && token.trim().length > 0) {
      return token.trim();
    }
  }

  return null;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = (opts: {
  headers: Headers;
  supabaseUrl: string;
  supabaseKey: string;
  connectionParams?: unknown;
}) => {
  const supabase = createSupabaseClient(opts.supabaseUrl, opts.supabaseKey);
  const accessToken = getAccessToken(opts.headers, opts.connectionParams);
  console.log(
    "Creating tRPC context with access token:",
    accessToken ? "YES" : "NO",
  );
  return {
    db,
    supabase,
    headers: opts.headers,
    accessToken,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { user, dbUser } = await requireAuth(
    ctx.supabase,
    ctx.accessToken ?? undefined,
  );
  return next({
    ctx: {
      user,
      dbUser,
    },
  });
});

/**
 * Admin (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees the caller has the required role.
 *
 * @see https://trpc.io/docs/procedures
 */
export const moderatorProcedure = t.procedure.use(async ({ ctx, next }) => {
  const dbUser = await requireModerator(
    ctx.supabase,
    ctx.accessToken ?? undefined,
  );
  return next({
    ctx: {
      dbUser,
    },
  });
});

export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  const dbUser = await requireAdmin(ctx.supabase, ctx.accessToken ?? undefined);
  return next({
    ctx: {
      dbUser,
    },
  });
});
