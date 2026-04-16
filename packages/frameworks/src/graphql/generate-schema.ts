#!/usr/bin/env bun
/**
 * Schema Generation Script
 *
 * Generates GraphQL SDL from the Pothos schema and writes it to the
 * graphql-client package for codegen consumption.
 *
 * Usage:
 *   bun run packages/frameworks/src/graphql/generate-schema.ts
 *   # or from root:
 *   bun packages/frameworks/src/graphql/generate-schema.ts
 */

import { schema } from "./schema.js";
import { writeSchemaToFile } from "./schema-output.js";
import { printSchema } from "graphql";

const OUTPUT_PATH = "../../graphql-client/src/generated/graphql/schema.graphql";

async function generateSchema(): Promise<void> {
  console.log("Generating GraphQL schema...");

  try {
    // First verify schema can be built
    const sdl = printSchema(schema);
    console.log(`Schema generated successfully (${sdl.length} characters)`);

    // Count types in schema
    const typeCount = (sdl.match(/^type\s+\w+/gm) || []).length;
    const inputCount = (sdl.match(/^input\s+\w+/gm) || []).length;
    const enumCount = (sdl.match(/^enum\s+\w+/gm) || []).length;
    const scalarCount = (sdl.match(/^scalar\s+\w+/gm) || []).length;

    console.log(`  - Types: ${typeCount}`);
    console.log(`  - Inputs: ${inputCount}`);
    console.log(`  - Enums: ${enumCount}`);
    console.log(`  - Scalars: ${scalarCount}`);

    // Write to file
    await writeSchemaToFile(schema, {
      path: OUTPUT_PATH,
      header: [
        "GraphQL Schema - Mirai App API",
        "Generated automatically from Pothos type definitions",
        "Do not edit manually - changes will be overwritten",
      ].join("\n"),
      includeDescriptions: true,
    });

    console.log(`\nSchema written to: ${OUTPUT_PATH}`);
    console.log("Schema generation complete!");
  } catch (error) {
    console.error("Failed to generate schema:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  generateSchema();
}

export { generateSchema };
