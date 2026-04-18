import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit Configuration
 *
 * This configuration file defines how Drizzle Kit interacts with the database
 * for migrations, schema pushing, and studio access.
 *
 * Migration Strategy:
 * - Schema is defined in TypeScript files in src/drizzle/schema/
 * - drizzle-kit generate creates SQL migration files
 * - drizzle-kit migrate applies pending migrations
 * - drizzle-kit push syncs schema directly (development only)
 */
export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/drizzle/schema/index.ts",
    "./src/better-auth/schema.ts",
  ],
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Enable strict mode for better type safety
  strict: true,
  // Enable verbose logging for debugging
  verbose: true,
});
