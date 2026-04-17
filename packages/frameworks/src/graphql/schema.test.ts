/**
 * Schema Assembly Tests
 *
 * Tests for the central schema assembly point. Verifies that:
 * - Schema module can be imported without errors
 * - Schema can be built without errors
 * - Schema is a valid GraphQLSchema object
 * - All domain modules are registered via side-effect imports
 * - Scalars (DateTime, JSON) are properly registered
 * - Relay types (PageInfo) are defined
 * - Query type exists and is valid
 *
 * ## Test Tagging
 *
 * - [UNIT]: Pure schema assembly tests with no external dependencies
 */

import { describe, it, expect } from "bun:test";
import { printSchema, GraphQLSchema, isSchema } from "graphql";

/**
 * Import module under test first to trigger side-effect registration.
 * This registers all types, scalars, and relay types with the Pothos builder.
 */
import "./schema.js";

/**
 * Import schema after all side-effects are registered.
 * This creates the complete GraphQL schema with all registered types.
 */
import { schema } from "./schema.js";

/**
 * Helper to convert schema to SDL string for verification
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] Schema Module", () => {
  it("can be imported without errors", () => {
    // If we reach this point, the import succeeded
    expect(true).toBe(true);
  });
});

describe("[UNIT] Schema Assembly", () => {
  it("exports a defined schema object", () => {
    expect(schema).toBeDefined();
    expect(schema).not.toBeNull();
  });

  it("exports a valid GraphQLSchema instance", () => {
    expect(schema).toBeInstanceOf(GraphQLSchema);
    expect(isSchema(schema)).toBe(true);
  });

  it("builds schema without errors", () => {
    // Getting SDL should not throw
    let sdl: string;
    expect(() => {
      sdl = getSDL();
    }).not.toThrow();
    expect(sdl!).toBeDefined();
    expect(sdl!.length).toBeGreaterThan(0);
  });
});

describe("[UNIT] Schema Structure", () => {
  it("contains Query type", () => {
    const queryType = schema.getQueryType();
    expect(queryType).toBeDefined();
    expect(queryType?.name).toBe("Query");
  });

  it("Query type has correct description", () => {
    const queryType = schema.getQueryType();
    expect(queryType?.description).toBe("Root Query type");
  });
});

describe("[UNIT] Scalar Registration", () => {
  it("registers DateTime scalar", () => {
    const sdl = getSDL();
    expect(sdl).toContain("scalar DateTime");
  });

  it("registers EmailAddress scalar", () => {
    const sdl = getSDL();
    expect(sdl).toContain("scalar EmailAddress");
  });

  it("registers UUID scalar", () => {
    const sdl = getSDL();
    expect(sdl).toContain("scalar UUID");
  });

  it("registers JSONObject scalar", () => {
    const sdl = getSDL();
    expect(sdl).toContain("scalar JSONObject");
  });

  it("registers URL scalar", () => {
    const sdl = getSDL();
    expect(sdl).toContain("scalar URL");
  });

  it("registers BigInt scalar", () => {
    const sdl = getSDL();
    expect(sdl).toContain("scalar BigInt");
  });
});

describe("[UNIT] Relay Types", () => {
  it("registers PageInfo type", () => {
    const sdl = getSDL();
    expect(sdl).toContain("type PageInfo");
    expect(sdl).toContain("hasNextPage: Boolean");
    expect(sdl).toContain("hasPreviousPage: Boolean");
    expect(sdl).toContain("startCursor: String");
    expect(sdl).toContain("endCursor: String");
  });

  it("PageInfo type has correct description", () => {
    const sdl = getSDL();
    expect(sdl).toContain("PageInfo for Relay-compliant pagination");
  });
});

describe("[UNIT] Domain Module Registration", () => {
  describe("User Domain", () => {
    it("registers User type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type User");
      expect(sdl).toContain("id: ID");
    });

    it("registers UserConnection type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type UserConnection");
    });

    it("registers UserEdge type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type UserEdge");
    });

    it("registers user queries", () => {
      const sdl = getSDL();
      expect(sdl).toContain("users(");
      expect(sdl).toContain("usersByRole(");
    });
  });

  describe("Sponsor Domain", () => {
    it("registers Sponsor type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type Sponsor");
      expect(sdl).toContain("id: ID");
    });

    it("registers TripSponsor type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type TripSponsor");
      expect(sdl).toContain("id: ID");
    });

    it("registers SponsorConnection type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type SponsorConnection");
    });

    it("registers TripSponsorConnection type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type TripSponsorConnection");
    });

    it("registers sponsor queries", () => {
      const sdl = getSDL();
      expect(sdl).toContain("sponsors(");
      expect(sdl).toContain("sponsorsByTrip(");
    });
  });

  describe("CoinTransaction Domain", () => {
    it("registers CoinTransaction type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type CoinTransaction");
      expect(sdl).toContain("id: ID");
    });

    it("registers CoinTransactionGroup type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type CoinTransactionGroup");
    });

    it("registers CoinTransactionAdmin type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type CoinTransactionAdmin");
    });

    it("registers CoinTransactionConnection type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type CoinTransactionConnection");
    });

    it("registers coinTransaction queries", () => {
      const sdl = getSDL();
      expect(sdl).toContain("coinTransactions(");
    });
  });

  describe("Notification Domain", () => {
    it("registers Notification type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type Notification");
      expect(sdl).toContain("id: ID");
    });

    it("registers NotificationConnection type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type NotificationConnection");
    });

    it("registers NotificationEdge type", () => {
      const sdl = getSDL();
      expect(sdl).toContain("type NotificationEdge");
    });

    it("registers notification queries", () => {
      const sdl = getSDL();
      expect(sdl).toContain("notificationsByUser(");
      expect(sdl).toContain("unreadNotificationsByUser(");
    });
  });
});
