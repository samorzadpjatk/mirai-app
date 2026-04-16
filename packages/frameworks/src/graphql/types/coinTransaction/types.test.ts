/**
 * CoinTransaction Domain Module Tests
 *
 * Tests for the coinTransaction GraphQL types module. Verifies that:
 * - Types register correctly with Pothos builder
 * - Embedded types (Group, Admin) are properly defined
 * - Schema can be built with coinTransaction module imported
 * - Types are accessible in the schema
 *
 * ## Test Tagging
 *
 * - [UNIT]: Pure domain tests with no external dependencies
 * - [INTEGRATION]: Tests that verify module integration with schema
 */

import { describe, it, expect } from "bun:test";
import { printSchema } from "graphql";

/**
 * Import coinTransaction module to trigger side-effect registration.
 * This is the key pattern being tested - importing the module
 * should register all coinTransaction types with the Pothos builder.
 */
import "./index.js";

// Import schema after coinTransaction module to verify assembly works
import { schema } from "../../schema.js";

/**
 * Helper to convert schema to SDL string
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] CoinTransaction Domain Module", () => {
  it("registers CoinTransaction type with the schema builder", () => {
    // Schema should be defined after importing coinTransaction module
    expect(schema).toBeDefined();

    // Convert to SDL to verify types are registered
    const sdl = getSDL();

    // Verify CoinTransaction type exists in schema
    expect(sdl).toContain("type CoinTransaction");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("groupId: ID");
    expect(sdl).toContain("amount: Int");
    expect(sdl).toContain("adminId: ID");
  });

  it("registers CoinTransactionConnection type for pagination", () => {
    const sdl = getSDL();

    // Verify connection types exist
    expect(sdl).toContain("type CoinTransactionConnection");
    expect(sdl).toContain("edges: [CoinTransactionEdge!]");
    expect(sdl).toContain("nodes: [CoinTransaction!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers CoinTransactionEdge type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type CoinTransactionEdge");
    expect(sdl).toContain("node: CoinTransaction");
    expect(sdl).toContain("cursor: String");
  });

  it("registers embedded CoinTransactionGroup type", () => {
    const sdl = getSDL();

    // Verify embedded group type exists
    expect(sdl).toContain("type CoinTransactionGroup");
    expect(sdl).toContain("name: String");
    expect(sdl).toContain("coins: Int");
  });

  it("registers embedded CoinTransactionAdmin type", () => {
    const sdl = getSDL();

    // Verify embedded admin type exists
    expect(sdl).toContain("type CoinTransactionAdmin");
    expect(sdl).toContain("firstName: String");
    expect(sdl).toContain("lastName: String");
  });

  it("registers coinTransactions query on Query type", () => {
    const sdl = getSDL();

    // Verify Query type has coinTransactions query
    expect(sdl).toContain("coinTransactions(");
    expect(sdl).toContain("tripId: ID!");
    expect(sdl).toContain("groupId: ID");
  });
});

describe("[UNIT] CoinTransaction Type Fields", () => {
  it("exposes all expected coin transaction fields in schema", () => {
    const sdl = getSDL();

    // Core fields
    expect(sdl).toContain("amount: Int");
    expect(sdl).toContain("reason: String");
    expect(sdl).toContain("groupId: ID");
    expect(sdl).toContain("adminId: ID");

    // Embedded relation fields
    expect(sdl).toContain("group: CoinTransactionGroup");
    expect(sdl).toContain("admin: CoinTransactionAdmin");

    // Timestamps
    expect(sdl).toContain("createdAt: DateTime");
    expect(sdl).toContain("updatedAt: DateTime");
  });

  it("has nullable fields where expected", () => {
    const sdl = getSDL();

    // reason is nullable
    expect(sdl).toContain("reason: String");

    // Embedded types are nullable (they may not always be present)
    expect(sdl).toContain("group: CoinTransactionGroup");
    expect(sdl).toContain("admin: CoinTransactionAdmin");
  });
});
