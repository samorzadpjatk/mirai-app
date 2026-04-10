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

console.log("📝 Generating GraphQL SDL...");

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

  console.log(`✅ SDL written to: ${SDL_PATH}`);
  console.log(`📊 Schema stats:`);
  console.log(`   - Types: ${sdl.match(/type\s+\w+/g)?.length ?? 0}`);
  console.log(`   - Inputs: ${sdl.match(/input\s+\w+/g)?.length ?? 0}`);
  console.log(`   - Enums: ${sdl.match(/enum\s+\w+/g)?.length ?? 0}`);
  console.log(
    `   - Queries: ${sdl.match(/\w+\(.*\):\s+\w+!?\s*$/gm)?.length ?? 0}`,
  );
  console.log(
    `   - Mutations: ${sdl.match(/\w+\(.*\):\s+\w+!?\s*$/gm)?.length ?? 0}`,
  );
} catch (error) {
  console.error("❌ Failed to generate SDL:", error);
  process.exit(1);
}
