import { Effect } from "effect";
import { createDrizzleClient } from "@mirai-app/frameworks/drizzle";
import { createBetterAuth, type BetterAuthInstance } from "@mirai-app/frameworks/better-auth";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { ServerStartupError } from "./errors";

/**
 * Create Drizzle database client
 */
export const createDatabaseClient = (url: string) =>
  Effect.try({
    try: () => createDrizzleClient(url),
    catch: (error) => new ServerStartupError({ cause: error, phase: "database" }),
  }).pipe(
    Effect.tap(() => Effect.log("Database client initialized"))
  );

/**
 * Create Better Auth client
 */
export const createBetterAuthClient = (
  db: DrizzleDb,
  secret: string,
  baseUrl: string,
) =>
  Effect.try({
    try: () => createBetterAuth(db, { secret, baseUrl }),
    catch: (error) => new ServerStartupError({ cause: error, phase: "better_auth" }),
  }).pipe(
    Effect.tap(() => Effect.log("Better Auth client initialized"))
  );
