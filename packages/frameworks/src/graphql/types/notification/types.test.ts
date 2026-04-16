/**
 * Notification Domain Module Tests
 *
 * Tests for the notification GraphQL types module. Verifies that:
 * - Types register correctly with Pothos builder
 * - Schema can be built with notification module imported
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
 * Import notification module to trigger side-effect registration.
 * This is the key pattern being tested - importing the module
 * should register all notification types with the Pothos builder.
 */
import "./index.js";

// Import schema after notification module to verify assembly works
import { schema } from "../../schema.js";

/**
 * Helper to convert schema to SDL string
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] Notification Domain Module", () => {
  it("registers Notification type with the schema builder", () => {
    // Schema should be defined after importing notification module
    expect(schema).toBeDefined();

    // Convert to SDL to verify types are registered
    const sdl = getSDL();

    // Verify Notification type exists in schema
    expect(sdl).toContain("type Notification");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("title: String");
    expect(sdl).toContain("content: String");
    expect(sdl).toContain("type: String");
    expect(sdl).toContain("status: String");
  });

  it("registers NotificationConnection type for pagination", () => {
    const sdl = getSDL();

    // Verify connection types exist
    expect(sdl).toContain("type NotificationConnection");
    expect(sdl).toContain("edges: [NotificationEdge!]");
    expect(sdl).toContain("nodes: [Notification!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers NotificationEdge type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type NotificationEdge");
    expect(sdl).toContain("node: Notification");
    expect(sdl).toContain("cursor: String");
  });

  it("registers notification queries on Query type", () => {
    const sdl = getSDL();

    // Verify Query type has notification queries
    expect(sdl).toContain("notificationsByUser(");
    expect(sdl).toContain("unreadNotificationsByUser(");
  });
});

describe("[UNIT] Notification Type Fields", () => {
  it("exposes all expected notification fields in schema", () => {
    const sdl = getSDL();

    // Core fields
    expect(sdl).toContain("tripId: ID");
    expect(sdl).toContain("title: String");
    expect(sdl).toContain("content: String");
    expect(sdl).toContain("type: String");
    expect(sdl).toContain("status: String");
    expect(sdl).toContain("priority: String");

    // Nullable datetime fields
    expect(sdl).toContain("scheduledAt: DateTime");
    expect(sdl).toContain("sentAt: DateTime");

    // Timestamps
    expect(sdl).toContain("createdAt: DateTime");
    expect(sdl).toContain("updatedAt: DateTime");

    // Creator reference
    expect(sdl).toContain("createdById: ID");
  });
});
