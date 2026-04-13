/**
 * Seed Application Entry Point
 *
 * Entry point for the database seeding application.
 * Seeds the database with initial data for trips, users, rewards, and sponsors.
 *
 * ## Architecture
 *
 * This application uses the Effect framework at the boundary for:
 * - Structured error handling
 * - Resource management
 * - Composable effects
 *
 * ## Environment Variables
 *
 * - `SUPABASE_URL` - Supabase project URL
 * - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
 * - `DATABASE_URL` - PostgreSQL connection string
 * - `GRAPHQL_ENDPOINT` - GraphQL API endpoint
 *
 * ## Usage
 *
 * ```bash
 * # Development seeding
 * bun run index.ts --dev
 *
 * # Production seeding
 * bun run index.ts --prod
 * ```
 *
 * @module index
 */

import { Effect, Layer, Console, Context } from "effect";
import { runSeed } from "./seed";

// =============================================================================
// Environment Validation
// =============================================================================

const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SUPABASE_STORAGE_IMAGE_BUCKET",
  "SUPABASE_STORAGE_VIDEO_BUCKET",
  "SUPABASE_STORAGE_PUBLIC_BUCKET",
  "SEED_GHOST_EMAIL",
  "SEED_GHOST_PASSWORD",
];

class MissingEnvError extends Error {
  readonly _tag = "MissingEnvError";
  constructor(public readonly varName: string) {
    super(`Missing required environment variable: ${varName}`);
  }
}

class SeedError extends Error {
  readonly _tag = "SeedError";
  constructor(public readonly cause: unknown) {
    super(`Seed operation failed: ${String(cause)}`);
  }
}

// =============================================================================
// Effect Programs
// =============================================================================

/**
 * Validate that all required environment variables are present
 */
const validateEnv = Effect.gen(function* () {
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      return yield* Effect.fail(new MissingEnvError(varName));
    }
  }
  yield* Console.log("✓ Environment variables validated");
  return true;
});

/**
 * Run the seed database operation wrapped in Effect
 */
const seedDatabase = Effect.tryPromise({
  try: async () => {
    await runSeed();
    return true;
  },
  catch: (error) => new SeedError(error),
});

/**
 * Main seeding program
 */
const seedProgram = Effect.gen(function* () {
  yield* Console.log("Starting seed application...");

  // Validate environment first
  yield* validateEnv;

  // Run the seed operation
  yield* seedDatabase;

  yield* Console.log("✓ Seeding completed successfully");
  return true;
});

// =============================================================================
// Entry Point
// =============================================================================

/**
 * Main entry point - runs Effects at the boundary
 */
const program = Effect.gen(function* () {
  const result = yield* seedProgram;
  return result;
});

/**
 * Run the seed application
 */
export async function run(): Promise<void> {
  await Effect.runPromise(program);
}

// Run the program with Effect at the boundary only when executed directly
if (import.meta.main) {
  Effect.runPromise(program)
    .then(() => {
      console.log("Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

// Export for testing
export { validateEnv, seedDatabase, seedProgram, MissingEnvError, SeedError };
