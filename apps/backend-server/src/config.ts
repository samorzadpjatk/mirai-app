import { Effect } from "effect";

/**
 * Server Configuration Interface
 */
export interface ServerConfig {
  port: number;
  databaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
}

/**
 * Load server configuration from environment variables
 */
export const getServerConfig = Effect.sync((): ServerConfig => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "",
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "",
}));
