import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "@integral-2025-app/db";

export function createContext() {
  return { db };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
