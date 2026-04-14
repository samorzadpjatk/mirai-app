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
import { serverLogger } from "@mirai-app/shared";

const SDL_PATH = join(process.cwd(), "graphql-sdl", "schema.graphql");

serverLogger.info("📝 Generating GraphQL SDL...");

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

  serverLogger.info(`✅ SDL written to: ${SDL_PATH}`);
  serverLogger.info(`📊 Schema stats:`, {
    types: sdl.match(/type\s+\w+/g)?.length ?? 0,
    inputs: sdl.match(/input\s+\w+/g)?.length ?? 0,
    enums: sdl.match(/enum\s+\w+/g)?.length ?? 0,
    queries: sdl.match(/\w+\(.*\):\s+\w+!?\s*$/gm)?.length ?? 0,
    mutations: sdl.match(/\w+\(.*\):\s+\w+!?\s*$/gm)?.length ?? 0,
  });
} catch (error) {
  serverLogger.error(
    "❌ Failed to generate SDL:",
    error instanceof Error ? error : new Error(String(error)),
  );
  process.exit(1);
}
