/**
 * Event Domain Module Tests
 *
 * Tests for the event GraphQL types module. Verifies that:
 * - Types register correctly with Pothos builder
 * - Schema can be built with event module imported
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
 * Import event module to trigger side-effect registration.
 * This is the key pattern being tested - importing the module
 * should register all event types with the Pothos builder.
 */
import "./index.js";

// Import schema after event module to verify assembly works
import { schema } from "../../schema.js";

/**
 * Helper to convert schema to SDL string
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] Event Domain Module", () => {
  it("registers Event type with the schema builder", () => {
    // Schema should be defined after importing event module
    expect(schema).toBeDefined();

    // Convert to SDL to verify types are registered
    const sdl = getSDL();

    // Verify Event type exists in schema
    expect(sdl).toContain("type Event");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("tripId: ID");
    expect(sdl).toContain("title: String");
    expect(sdl).toContain("type: String");
    expect(sdl).toContain("status: String");
  });

  it("registers EventConnection type for pagination", () => {
    const sdl = getSDL();

    // Verify connection types exist
    expect(sdl).toContain("type EventConnection");
    expect(sdl).toContain("edges: [EventEdge!]");
    expect(sdl).toContain("nodes: [Event!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers EventEdge type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type EventEdge");
    expect(sdl).toContain("node: Event");
    expect(sdl).toContain("cursor: String");
  });

  it("registers event queries on Query type", () => {
    const sdl = getSDL();

    // Verify Query type has event queries
    expect(sdl).toContain("eventsByTrip(");
    expect(sdl).toContain("upcomingEventsByTrip(");
    expect(sdl).toContain("ongoingEventsByTrip(");
    expect(sdl).toContain("pastEventsByTrip(");
  });
});

describe("[UNIT] Event Type Fields", () => {
  it("exposes all expected event fields in schema", () => {
    const sdl = getSDL();

    // Core fields
    expect(sdl).toContain("groupId: ID");
    expect(sdl).toContain("description: String");
    expect(sdl).toContain("location: String");
    expect(sdl).toContain("startTime: DateTime");
    expect(sdl).toContain("endTime: DateTime");
    expect(sdl).toContain("maxParticipants: Int");
    expect(sdl).toContain("createdById: ID");

    // Timestamps
    expect(sdl).toContain("createdAt: DateTime");
    expect(sdl).toContain("updatedAt: DateTime");
  });
});
