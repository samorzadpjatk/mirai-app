#!/usr/bin/env bun
// =============================================================================
// GraphQL Schema Generator
// =============================================================================

/**
 * Generates GraphQL SDL schema from Pothos builder
 *
 * This script:
 * 1. Imports the Pothos schema
 * 2. Prints it to GraphQL SDL format
 * 3. Saves it to schema.graphql for codegen
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { printSchema } from "graphql";

// Import the schema from Pothos
import { schema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate and save schema
 */
async function generateSchema() {
  console.log("Generating GraphQL schema from Pothos...");

  try {
    // Convert schema to SDL
    const sdl = printSchema(schema);

    // Write to file
    const outputPath = join(__dirname, "schema.graphql");
    writeFileSync(outputPath, sdl, "utf-8");

    console.log(`✅ Schema generated: ${outputPath}`);
    console.log(`   Schema has ${Object.keys(schema.getTypeMap()).length} types`);
    
    // Print query types for verification
    const queryType = schema.getQueryType();
    if (queryType) {
      const fields = Object.keys(queryType.getFields());
      console.log(`   Queries: ${fields.length} fields`);
    }
    
    const mutationType = schema.getMutationType();
    if (mutationType) {
      const fields = Object.keys(mutationType.getFields());
      console.log(`   Mutations: ${fields.length} fields`);
    }
    
    const subscriptionType = schema.getSubscriptionType();
    if (subscriptionType) {
      const fields = Object.keys(subscriptionType.getFields());
      console.log(`   Subscriptions: ${fields.length} fields`);
    }

    return true;
  } catch (error) {
    console.error("❌ Failed to generate schema:", error);
    process.exit(1);
  }
}

// Run generation
generateSchema();
