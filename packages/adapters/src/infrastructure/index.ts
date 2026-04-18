/**
 * Infrastructure Module - Adapters Layer
 *
 * This module contains infrastructure concerns that support the adapters layer:
 * - Database schema types (Drizzle)
 * - External service client types (Supabase)
 * - Effect Context patterns
 *
 * Previously these were in frameworks, but they belong with the adapters
 * that use them for gateway implementations.
 */

// Drizzle database infrastructure
export * from "./drizzle";

// Supabase client types
export * from "./supabase";

// Effect context patterns
export * from "./effect";
