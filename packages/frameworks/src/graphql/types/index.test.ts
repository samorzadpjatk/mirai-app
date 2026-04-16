/**
 * Types Index Barrel Export Tests
 *
 * Tests for the central types barrel export that aggregates all domain modules.
 * Verifies that:
 * - The barrel module can be imported without errors
 * - All 5 domain type modules register correctly via side-effect imports
 * - Schema contains types from all domains after import
 * - Exports work correctly (types are accessible from barrel)
 *
 * ## Test Tagging
 *
 * - [UNIT]: Pure domain tests with no external dependencies
 */

import { describe, it, expect } from "bun:test";
import { printSchema } from "graphql";

/**
 * Import the types barrel module to trigger side-effect registration.
 * This is the key pattern being tested - importing the barrel should
 * register ALL domain types with the Pothos builder.
 *
 * The barrel uses side-effect exports:
 * - User domain types
 * - Event domain types
 * - Sponsor domain types
 * - Notification domain types
 * - CoinTransaction domain types
 */
import "./index.js";

// Import schema after barrel module to verify assembly works
import { schema } from "../schema.js";

/**
 * Helper to convert schema to SDL string for verification
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] Types Barrel Export", () => {
  it("imports without errors", () => {
    // If we reach this point, the import succeeded
    expect(true).toBe(true);
  });

  it("produces a defined schema", () => {
    expect(schema).toBeDefined();
    expect(schema).not.toBeNull();
  });
});

describe("[UNIT] User Domain Types Registration", () => {
  it("registers User type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type User");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("email: String");
    expect(sdl).toContain("role: String");
  });

  it("registers UserConnection type for pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type UserConnection");
    expect(sdl).toContain("edges: [UserEdge!]");
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

    expect(sdl).toContain("users(");
    expect(sdl).toContain("usersByRole(");
  });
});

describe("[UNIT] Event Domain Types Registration", () => {
  it("registers Event type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type Event");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("tripId: ID");
    expect(sdl).toContain("title: String");
    expect(sdl).toContain("type: String");
    expect(sdl).toContain("status: String");
  });

  it("registers EventConnection type for pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type EventConnection");
    expect(sdl).toContain("edges: [EventEdge!]");
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

    expect(sdl).toContain("eventsByTrip(");
    expect(sdl).toContain("ongoingEventsByTrip(");
    expect(sdl).toContain("pastEventsByTrip(");
    expect(sdl).toContain("upcomingEventsByTrip(");
  });
});

describe("[UNIT] Sponsor Domain Types Registration", () => {
  it("registers Sponsor type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type Sponsor");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("name: String");
    expect(sdl).toContain("tier: String");
  });

  it("registers TripSponsor type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type TripSponsor");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("sponsorId: ID");
    expect(sdl).toContain("tripId: ID");
  });

  it("registers SponsorConnection type for pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type SponsorConnection");
    expect(sdl).toContain("edges: [SponsorEdge!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers TripSponsorConnection type for pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type TripSponsorConnection");
    expect(sdl).toContain("edges: [TripSponsorEdge!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers sponsor queries on Query type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("sponsors(");
    expect(sdl).toContain("sponsorsByTrip(");
  });
});

describe("[UNIT] Notification Domain Types Registration", () => {
  it("registers Notification type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type Notification");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("title: String");
    expect(sdl).toContain("content: String");
    expect(sdl).toContain("type: String");
    expect(sdl).toContain("status: String");
  });

  it("registers NotificationConnection type for pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type NotificationConnection");
    expect(sdl).toContain("edges: [NotificationEdge!]");
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

    expect(sdl).toContain("notificationsByUser(");
    expect(sdl).toContain("unreadNotificationsByUser(");
  });
});

describe("[UNIT] CoinTransaction Domain Types Registration", () => {
  it("registers CoinTransaction type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type CoinTransaction");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("userId: ID");
    expect(sdl).toContain("amount: Int");
    expect(sdl).toContain("type: String");
    expect(sdl).toContain("status: String");
  });

  it("registers CoinTransactionGroup type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type CoinTransactionGroup");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("name: String");
    expect(sdl).toContain("coins: Int");
  });

  it("registers CoinTransactionAdmin type with the schema", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type CoinTransactionAdmin");
    expect(sdl).toContain("id: ID");
    expect(sdl).toContain("userId: ID");
    expect(sdl).toContain("amount: Int");
    expect(sdl).toContain("reason: String");
  });

  it("registers CoinTransactionConnection type for pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type CoinTransactionConnection");
    expect(sdl).toContain("edges: [CoinTransactionEdge!]");
    expect(sdl).toContain("pageInfo: PageInfo");
  });

  it("registers coinTransaction queries on Query type", () => {
    const sdl = getSDL();

    expect(sdl).toContain("coinTransactions(");
  });
});

describe("[UNIT] Relay and Common Types", () => {
  it("registers PageInfo type for Relay pagination", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type PageInfo");
    expect(sdl).toContain("hasNextPage: Boolean");
    expect(sdl).toContain("hasPreviousPage: Boolean");
    expect(sdl).toContain("startCursor: String");
    expect(sdl).toContain("endCursor: String");
  });

  it("registers DateTime scalar", () => {
    const sdl = getSDL();

    expect(sdl).toContain("scalar DateTime");
  });
});

describe("[UNIT] Barrel Export Functionality", () => {
  it("exports are accessible from module", async () => {
    // Dynamic import to verify exports without side-effect interference
    const barrel = await import("./index.js");

    // Verify User domain exports
    expect(barrel.UserType).toBeDefined();
    expect(barrel.UserEdgeType).toBeDefined();
    expect(barrel.UserConnectionType).toBeDefined();
    expect(barrel.encodeUserCursor).toBeDefined();
    expect(barrel.buildUserConnection).toBeDefined();

    // Verify Event domain exports
    expect(barrel.EventType).toBeDefined();
    expect(barrel.EventEdgeType).toBeDefined();
    expect(barrel.EventConnectionType).toBeDefined();
    expect(barrel.encodeEventCursor).toBeDefined();
    expect(barrel.buildEventConnection).toBeDefined();

    // Verify Sponsor domain exports
    expect(barrel.SponsorType).toBeDefined();
    expect(barrel.TripSponsorType).toBeDefined();
    expect(barrel.SponsorEdgeType).toBeDefined();
    expect(barrel.TripSponsorEdgeType).toBeDefined();
    expect(barrel.SponsorConnectionType).toBeDefined();
    expect(barrel.TripSponsorConnectionType).toBeDefined();
    expect(barrel.encodeSponsorCursor).toBeDefined();
    expect(barrel.encodeTripSponsorCursor).toBeDefined();
    expect(barrel.buildSponsorConnection).toBeDefined();
    expect(barrel.buildTripSponsorConnection).toBeDefined();

    // Verify Notification domain exports
    expect(barrel.NotificationType).toBeDefined();
    expect(barrel.NotificationEdgeType).toBeDefined();
    expect(barrel.NotificationConnectionType).toBeDefined();
    expect(barrel.encodeNotificationCursor).toBeDefined();
    expect(barrel.buildNotificationConnection).toBeDefined();

    // Verify CoinTransaction domain exports
    expect(barrel.CoinTransactionType).toBeDefined();
    expect(barrel.CoinTransactionConnectionType).toBeDefined();
    expect(barrel.CoinTransactionEdgeType).toBeDefined();
    expect(barrel.CoinTransactionGroupType).toBeDefined();
    expect(barrel.CoinTransactionAdminType).toBeDefined();
    expect(barrel.encodeCoinTransactionCursor).toBeDefined();
    expect(barrel.buildCoinTransactionConnection).toBeDefined();
  });
});

describe("[UNIT] Schema Completeness", () => {
  it("contains all five domain Query fields", () => {
    const sdl = getSDL();

    // Each domain should register at least one query field
    expect(sdl).toContain("users(");
    expect(sdl).toContain("eventsByTrip(");
    expect(sdl).toContain("sponsors(");
    expect(sdl).toContain("notificationsByUser(");
    expect(sdl).toContain("coinTransactions(");
  });

  it("contains all five domain Connection types", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type UserConnection");
    expect(sdl).toContain("type EventConnection");
    expect(sdl).toContain("type SponsorConnection");
    expect(sdl).toContain("type NotificationConnection");
    expect(sdl).toContain("type CoinTransactionConnection");
  });

  it("contains all five domain Edge types", () => {
    const sdl = getSDL();

    expect(sdl).toContain("type UserEdge");
    expect(sdl).toContain("type EventEdge");
    expect(sdl).toContain("type SponsorEdge");
    expect(sdl).toContain("type NotificationEdge");
    expect(sdl).toContain("type CoinTransactionEdge");
  });
});
