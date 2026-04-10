/**
 * GraphQL Schema Generation
 *
 * Builds the complete GraphQL schema from Pothos type definitions
 * and provides utilities for SDL generation and file output.
 *
 * ## Architecture
 *
 * 1. Import all type definitions (they register themselves with the builder)
 * 2. Build the executable schema
 * 3. Generate SDL (Schema Definition Language) string
 * 4. Optionally save to file for external SDK generation
 *
 * ## Usage
 *
 * ```typescript
 * import { schema, generateSDL } from "./schema";
 *
 * // Get executable schema for Yoga server
 * const yoga = createYoga({ schema });
 *
 * // Generate SDL for external clients
 * const sdl = generateSDL();
 * saveSchemaToFile(sdl, "./graphql-sdl/schema.graphql");
 * ```
 *
 * @module schema
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { printSchema } from "graphql";
import { builder } from "./builder";

// =============================================================================
// Import Type Definitions
// =============================================================================

/**
 * Import all GraphQL type definitions
 *
 * These imports have side effects - they register types with the builder.
 * The order doesn't matter as Pothos resolves type references lazily.
 */
import "./types/User";

/**
 * Import Query type and resolvers
 *
 * This imports all query fields including:
 * - user(id: ID!): User
 * - users(limit: Int, offset: Int): [User!]!
 * - me: User
 */
import "./types/Query";

// =============================================================================
// Schema Building
// =============================================================================

/**
 * Build the executable GraphQL schema
 *
 * This creates a ready-to-use GraphQL schema from all registered
 * Pothos type definitions.
 */
export const schema = builder.toSchema();

// =============================================================================
// SDL Generation
// =============================================================================

/**
 * Generate GraphQL SDL (Schema Definition Language) string
 *
 * Converts the executable schema to a human-readable SDL document
 * suitable for external SDK generation and documentation.
 *
 * @returns GraphQL SDL string
 */
export function generateSDL(): string {
  return printSchema(schema);
}

// =============================================================================
// File Output
// =============================================================================

/**
 * Get default SDL output path
 *
 * Returns the absolute path to the schema.graphql file.
 */
function getDefaultOutputPath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, "../../graphql-sdl/schema.graphql");
}

/**
 * Save SDL to file
 *
 * Writes the GraphQL schema to a file, creating directories if needed.
 *
 * @param sdl - The SDL string to save
 * @param filePath - Optional custom file path (defaults to graphql-sdl/schema.graphql)
 */
export function saveSchemaToFile(sdl: string, filePath?: string): void {
  const outputPath = filePath ?? getDefaultOutputPath();
  const outputDir = dirname(outputPath);

  // Create directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write SDL file
  const content = `# GraphQL Schema - Mirai App API
# Generated automatically from Pothos type definitions
# Do not edit manually - changes will be overwritten

${sdl}`;

  writeFileSync(outputPath, content, "utf-8");
  console.log(`[Schema] SDL written to: ${outputPath}`);
}

/**
 * Generate and save schema to file
 *
 * Convenience function that generates SDL and saves it to the default location.
 */
export function generateAndSaveSchema(): void {
  const sdl = generateSDL();
  saveSchemaToFile(sdl);
}

// =============================================================================
// CLI Support
// =============================================================================

/**
 * Main execution for CLI usage
 *
 * When run directly (e.g., `bun src/graphql/schema.ts`),
 * generates and saves the schema file.
 */
if (import.meta.main) {
  console.log("[Schema] Generating GraphQL SDL...");
  generateAndSaveSchema();
  console.log("[Schema] Done!");
}

// =============================================================================
// Export
// =============================================================================

export default schema;
