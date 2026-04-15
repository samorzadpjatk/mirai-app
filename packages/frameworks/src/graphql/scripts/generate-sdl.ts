#!/usr/bin/env bun

/**
 * Generate GraphQL SDL Script
 *
 * Generates the Schema Definition Language (SDL) from the Pothos schema.
 * Run this script to update the schema.graphql file.
 *
 * Usage:
 * ```bash
 * bun run packages/frameworks/src/graphql/scripts/generate-sdl.ts
 * # or
 * ./packages/frameworks/src/graphql/scripts/generate-sdl.ts
 * ```
 */

import { schema, generateSDL } from "../schema";
import { writeFileSync } from "fs";
import { join } from "path";

const SDL_PATH = join(process.cwd(), "graphql-sdl", "schema.graphql");

try {
  const sdl = generateSDL();

  // Ensure directory exists
  const dir = join(process.cwd(), "graphql-sdl");
  try {
    await import("fs").then((fs) => fs.mkdirSync(dir, { recursive: true }));
  } catch {
    // Directory might already exist
  }

  writeFileSync(SDL_PATH, sdl, "utf-8");
} catch {
  process.exit(1);
}
