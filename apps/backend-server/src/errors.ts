import { Data } from "effect";

/**
 * Server Startup Error
 * Thrown when the server fails to start during a specific phase
 */
export class ServerStartupError extends Data.TaggedError("ServerStartupError")<{
  readonly cause: unknown;
  readonly phase: "database" | "supabase" | "better_auth" | "app_layer" | "handlers" | "server";
}> {}

/**
 * Server Runtime Error
 * Thrown during server operation
 */
export class ServerRuntimeError extends Data.TaggedError("ServerRuntimeError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}
