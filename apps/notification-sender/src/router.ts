import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
});

export type AppRouter = typeof appRouter;
