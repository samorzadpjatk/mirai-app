/**
 * User Domain Module Tests
 *
 * Tests for the user GraphQL types module. Verifies that:
 * - Types register correctly with Pothos builder
 * - Schema can be built with user module imported
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
 * Import user module to trigger side-effect registration.
 * This is the key pattern being tested - importing the module
 * should register all user types with the Pothos builder.
 */
import "./index.js";

// Import schema after user module to verify assembly works
import { schema } from "../../schema.js";

/**
 * Helper to convert schema to SDL string
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] User Domain Module", () => {
  it("registers User type with the schema builder", () => {
    // Schema should be defined after importing user module
    expect(schema).toBeDefined();

    // Convert to SDL to verify types are registered
    const sdl = getSDL();

    // Verify User type exists in schema (printSchema omits ! for non-null in output)
    expect(sdl).toContain("type User");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("authUserId: ID");
    expect(sdl).toContain("email: String");
    expect(sdl).toContain("role: String");
  });

  it("registers UserConnection type for pagination", () => {
    const sdl = getSDL();

    // Verify connection types exist
    expect(sdl).toContain("type UserConnection");
    expect(sdl).toContain("edges: [UserEdge!]");
    expect(sdl).toContain("nodes: [User!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers UserEdge type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type UserEdge");
    expect(sdl).toContain("node: User");
    expect(sdl).toContain("cursor: String");
  });

  it("registers user queries on Query type", () => {
    const sdl = getSDL();

    // Verify Query type has user queries
    expect(sdl).toContain("users(");
    expect(sdl).toContain("usersByRole(");
  });
});

describe("[UNIT] User Type Fields", () => {
  it("exposes all expected user fields in schema", () => {
    const sdl = getSDL();

    // Core identity fields
    expect(sdl).toContain("firstName: String");
    expect(sdl).toContain("lastName: String");
    expect(sdl).toContain("nickname: String");

    // Contact fields
    expect(sdl).toContain("phone: String");
    expect(sdl).toContain("avatarUrl: String");

    // Status and role
    expect(sdl).toContain("status: String");
    expect(sdl).toContain("role: String");

    // Profile fields
    expect(sdl).toContain("bio: String");
    expect(sdl).toContain("birthDate: DateTime");
    expect(sdl).toContain("shirtSize: String");
    expect(sdl).toContain("dietaryRequirements: String");
    expect(sdl).toContain("medicalInfo: String");

    // Timestamps
    expect(sdl).toContain("createdAt: DateTime");
    expect(sdl).toContain("updatedAt: DateTime");

    // Group association
    expect(sdl).toContain("groupId: ID");
  });
});
