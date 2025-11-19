/**
 * Web app-specific tRPC configuration
 * 
 * This file extends the common package's tRPC utilities with web-specific context
 * (database, auth session) that is required by web push notification routers.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Web app-specific context that includes database and session
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

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
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Moderator procedure
 */
export const moderatorProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user?.isAdmin && !ctx.session?.user?.isModerator) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Admin procedure
 */
export const adminProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user?.isAdmin) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Service account procedure for scheduled tasks
 */
export const serviceAccountProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    // Optional: Add some basic authentication/API key check
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
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: user },
      },
    });
  });
