/**
 * GraphQL Module
 *
 * Central export for all GraphQL-related functionality.
 * Provides Pothos schema builder, type definitions, and schema generation.
 *
 * ## Exports
 *
 * - `builder` - Pothos schema builder instance
 * - `schema` - Executable GraphQL schema
 * - `generateSDL` - Generate SDL string
 * - `saveSchemaToFile` - Save SDL to file
 * - `generateAndSaveSchema` - Generate and save in one call
 *
 * @module graphql
 */

// Builder
export { builder, UserRoleEnum, type PothosTypes } from "./builder";

// Schema
export {
  schema,
  generateSDL,
  saveSchemaToFile,
  generateAndSaveSchema,
} from "./schema";

// Types (re-export for convenience)
export { UserType } from "./types/User";
