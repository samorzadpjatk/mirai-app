import { Effect } from "effect";
import { createDrizzleClient } from "@mirai-app/frameworks/drizzle";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
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
 * Create Supabase client
 */
export const createSupabaseServiceClient = (url: string, key: string) =>
  Effect.try({
    try: () => createSupabaseClient(url, key) as SupabaseClient,
    catch: (error) => new ServerStartupError({ cause: error, phase: "supabase" }),
  }).pipe(
    Effect.tap(() => Effect.log("Supabase client initialized"))
  );
