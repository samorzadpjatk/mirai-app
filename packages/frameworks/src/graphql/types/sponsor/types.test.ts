/**
 * Sponsor Domain Module Tests
 *
 * Tests for the sponsor GraphQL types module. Verifies that:
 * - Types register correctly with Pothos builder
 * - Schema can be built with sponsor module imported
 * - Types are accessible in the schema
 * - Cross-domain reference (TripSponsor.sponsor -> SponsorType) works
 *
 * ## Test Tagging
 *
 * - [UNIT]: Pure domain tests with no external dependencies
 * - [INTEGRATION]: Tests that verify module integration with schema
 */

import { describe, it, expect } from "bun:test";
import { printSchema } from "graphql";

/**
 * Import sponsor module to trigger side-effect registration.
 * This is the key pattern being tested - importing the module
 * should register all sponsor types with the Pothos builder.
 */
import "./index.js";

// Import schema after sponsor module to verify assembly works
import { schema } from "../../schema.js";

/**
 * Helper to convert schema to SDL string
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] Sponsor Domain Module", () => {
  it("registers Sponsor type with the schema builder", () => {
    // Schema should be defined after importing sponsor module
    expect(schema).toBeDefined();

    // Convert to SDL to verify types are registered
    const sdl = getSDL();

    // Verify Sponsor type exists in schema
    expect(sdl).toContain("type Sponsor");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("name: String");
  });

  it("registers TripSponsor type with cross-domain reference", () => {
    const sdl = getSDL();

    // Verify TripSponsor type exists
    expect(sdl).toContain("type TripSponsor");
    expect(sdl).toContain("tripId: ID");
    expect(sdl).toContain("sponsorId: ID");

    // Cross-domain reference: TripSponsor.sponsor field references SponsorType
    expect(sdl).toContain("sponsor: Sponsor");
  });

  it("registers SponsorConnection type for pagination", () => {
    const sdl = getSDL();

    // Verify connection types exist
    expect(sdl).toContain("type SponsorConnection");
    expect(sdl).toContain("edges: [SponsorEdge!]");
    expect(sdl).toContain("nodes: [Sponsor!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers TripSponsorConnection type for pagination", () => {
    const sdl = getSDL();

    // Verify connection types exist
    expect(sdl).toContain("type TripSponsorConnection");
    expect(sdl).toContain("edges: [TripSponsorEdge!]");
    expect(sdl).toContain("nodes: [TripSponsor!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers SponsorEdge type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type SponsorEdge");
    expect(sdl).toContain("node: Sponsor");
    expect(sdl).toContain("cursor: String");
  });

  it("registers TripSponsorEdge type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type TripSponsorEdge");
    expect(sdl).toContain("node: TripSponsor");
    expect(sdl).toContain("cursor: String");
  });

  it("registers sponsor queries on Query type", () => {
    const sdl = getSDL();

    // Verify Query type has sponsor queries
    expect(sdl).toContain("sponsors(");
    expect(sdl).toContain("sponsorsByTrip(");
  });
});

describe("[UNIT] Sponsor Type Fields", () => {
  it("exposes all expected sponsor fields in schema", () => {
    const sdl = getSDL();

    // Core fields
    expect(sdl).toContain("name: String");
    expect(sdl).toContain("description: String");
    expect(sdl).toContain("logoUrl: String");
    expect(sdl).toContain("websiteUrl: String");
    expect(sdl).toContain("contactEmail: String");
    expect(sdl).toContain("contactPhone: String");

    // Timestamps
    expect(sdl).toContain("createdAt: DateTime");
    expect(sdl).toContain("updatedAt: DateTime");
  });

  it("exposes all expected TripSponsor fields in schema", () => {
    const sdl = getSDL();

    // Core fields
    expect(sdl).toContain("tier: String");
    expect(sdl).toContain("benefits: String");
    expect(sdl).toContain("displayOrder: Int");
    expect(sdl).toContain("isActive: Boolean");

    // Reference fields
    expect(sdl).toContain("linkedAt: DateTime");
    expect(sdl).toContain("linkedById: ID");

    // Cross-domain reference to Sponsor
    expect(sdl).toContain("sponsor: Sponsor");
  });
});
