import { builder } from "./builder";

// Import types to register them
import "./types/User";
import "./types/Challenge";

// Import resolvers to register queries and mutations
import "./resolvers/User";
import "./resolvers/Challenge";

/**
 * GraphQL Schema
 *
 * Pothos code-first schema definition.
 * Combines all types, queries, mutations, and subscriptions.
 *
 * Phase 3: API Layer
 * - Schema built from TypeScript code (not SDL)
 * - Type-safe throughout
 * - Integrates with existing use cases via DI
 *
 * Usage:
 * ```typescript
 * import { schema } from "./schema";
 * const yoga = createYoga({ schema });
 * ```
 */
export const schema = builder.toSchema();

/**
 * Schema type export
 */
export type Schema = typeof schema;

/**
 * Generate SDL (Schema Definition Language)
 *
 * Generates GraphQL SDL string from the Pothos schema.
 * Useful for external clients and documentation.
 *
 * @returns GraphQL SDL string
 */
export function generateSDL(): string {
  const { printSchema } = require("graphql");
  return printSchema(schema);
}

/**
 * Write SDL to file
 *
 * @param path - File path to write SDL
 */
export async function writeSDLToFile(path: string): Promise<void> {
  const fs = await import("fs");
  const sdl = generateSDL();
  fs.writeFileSync(path, sdl, "utf-8");
}
