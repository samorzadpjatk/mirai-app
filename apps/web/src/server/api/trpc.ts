/**
 * Web app-specific tRPC configuration
 * 
 * This file extends the common package's tRPC utilities with web-specific context
 * (database, auth session) that is required by web push notification routers.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@integral-2025-app/db";
import {
  getSession,
  requireAuth,
  requireAdmin,
  requireModerator,
} from "~/server/auth";

/**
 * Web app-specific context that includes database and session
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getSession();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * Initialize tRPC with web app context
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
 * Create a server-side caller
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Router and procedure utilities
 */
export const createTRPCRouter = t.router;

/**
 * Timing middleware
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ next }) => {
    try {
      const { user, dbUser } = await requireAuth();

      return next({
        ctx: {
          session: { user, authUserId: dbUser.authUserId! },
          user: dbUser,
        },
      });
    } catch {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
  });

/**
 * Moderator procedure
 */
export const moderatorProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ next }) => {
    try {
      const dbUser = await requireModerator();

      return next({
        ctx: {
          session: {
            user: {
              id: dbUser.id,
              authUserId: dbUser.authUserId!,
              email: dbUser.email,
              name: dbUser.name,
              emailVerified: dbUser.emailVerified,
            },
            authUserId: dbUser.authUserId!,
          },
          user: dbUser,
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message:
          error instanceof Error ? error.message : "Moderator access required",
      });
    }
  });

/**
 * Admin procedure
 */
export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ next }) => {
    try {
      const dbUser = await requireAdmin();

      return next({
        ctx: {
          session: {
            user: {
              id: dbUser.id,
              authUserId: dbUser.authUserId!,
              email: dbUser.email,
              name: dbUser.name,
              emailVerified: dbUser.emailVerified,
            },
            authUserId: dbUser.authUserId!,
          },
          user: dbUser,
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message:
          error instanceof Error ? error.message : "Admin access required",
      });
    }
  });

/**
 * Service account procedure for scheduled tasks
 */
export const serviceAccountProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const authHeader = ctx.headers.get("authorization");
    // const expectedAuth = process.env.SCHEDULER_API_KEY;

    // if (authHeader !== `Bearer ${expectedAuth}`) {
    //   throw new TRPCError({ code: "UNAUTHORIZED" });
    // }
    const user = await db.user.findFirstOrThrow({
      where: { isServiceAccount: true },
    });
    return next({
      ctx: {
        session: ctx.session,
        user: user,
      },
    });
  });
