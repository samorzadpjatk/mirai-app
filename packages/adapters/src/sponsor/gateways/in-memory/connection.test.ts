/**
 * Integration tests for SponsorGateway Connection methods
 *
 * Tests verify:
 * - GraphQL Connection structure (edges, nodes, pageInfo)
 * - Cursor-based pagination
 * - Error handling
 * - Pagination + filtering combinations
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemorySponsorGateway } from "./gateway";
import type {
  SponsorDTO,
  TripSponsorDTO,
  SponsorCursorData,
} from "@mirai-app/use-cases";

describe("[INTEGRATION] SponsorGateway - Connection Methods", () => {
  let gateway: InMemorySponsorGateway;

  beforeEach(async () => {
    gateway = new InMemorySponsorGateway();
    await Effect.runPromise(gateway.reset());
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  const createMockSponsor = (
    id: string,
    overrides?: Partial<SponsorDTO>,
  ): SponsorDTO => ({
    id,
    name: `Sponsor ${id}`,
    description: "Test sponsor description",
    logoUrl: "https://example.com/logo.png",
    websiteUrl: "https://example.com",
    contactEmail: null,
    contactPhone: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  });

  const createMockTripSponsor = (
    id: string,
    tripId: string,
    sponsorId: string,
    overrides?: Partial<TripSponsorDTO>,
  ): TripSponsorDTO => ({
    id,
    tripId,
    sponsorId,
    tier: "GOLD",
    benefits: null,
    displayOrder: 0,
    isActive: true,
    linkedAt: new Date(),
    linkedById: "user-1",
    sponsor: null,
    ...overrides,
  });

  // ============================================================================
  // GraphQL Connection Structure Tests
  // ============================================================================

  describe("Connection structure verification", () => {
    it("returns proper Connection structure with edges, nodes, pageInfo", async () => {
      const sponsor = createMockSponsor("sponsor-1");
      await Effect.runPromise(gateway.create(sponsor));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      // Verify edges array structure
      expect(result.edges).toBeDefined();
      expect(Array.isArray(result.edges)).toBe(true);

      if (result.edges.length > 0) {
        const edge = result.edges[0];
        expect(edge).toBeDefined();
        expect(edge.node).toBeDefined();
        expect(edge.cursor).toBeDefined();
        expect(typeof edge.cursor).toBe("string");
      }

      // Verify nodes array
      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.nodes.length).toBe(result.edges.length);

      // Verify pageInfo structure
      expect(result.pageInfo).toBeDefined();
      expect(typeof result.pageInfo.hasNextPage).toBe("boolean");
      expect(typeof result.pageInfo.hasPreviousPage).toBe("boolean");
      expect(result.pageInfo.startCursor !== undefined).toBe(true);
      expect(result.pageInfo.endCursor !== undefined).toBe(true);
    });

    it("cursors are valid base64 encoded strings", async () => {
      const sponsor = createMockSponsor("sponsor-1", {
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });
      await Effect.runPromise(gateway.create(sponsor));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      if (result.edges.length > 0) {
        const edge = result.edges[0];
        expect(edge).toBeDefined();
        const cursor = edge.cursor;
        // Verify cursor is base64url encoded
        expect(() => {
          const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
          const data = JSON.parse(decoded);
          expect(data.id).toBe("sponsor-1");
          expect(data.createdAt).toBeDefined();
        }).not.toThrow();
      }
    });
  });

  // ============================================================================
  // Cursor-based Pagination Tests
  // ============================================================================

  describe("findActiveConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns hasNextPage=false on last page", async () => {
      const sponsors = Array.from({ length: 15 }, (_, i) =>
        createMockSponsor(`sponsor-${i}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns subsequent page using endCursor", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      // Decode cursor to get SponsorCursorData
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: SponsorCursorData = JSON.parse(cursorStr);

      // Get second page using cursor data
      const secondPage = await Effect.runPromise(
        gateway.findActiveConnection({
          first: 10,
          after: cursorData,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify no overlap
      const firstPageIds = new Set(firstPage.nodes.map((n) => n.id));
      for (const node of secondPage.nodes) {
        expect(firstPageIds.has(node.id)).toBe(false);
      }
    });

    it("respects max page size of 100", async () => {
      const sponsors = Array.from({ length: 150 }, (_, i) =>
        createMockSponsor(`sponsor-${i}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 200 }),
      );

      expect(result.edges.length).toBeLessThanOrEqual(100);
    });
  });

  describe("findByTripIdConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const tripId = "trip-123";
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      // Link sponsors to trip
      for (const sponsor of sponsors) {
        await Effect.runPromise(gateway.linkToTrip(tripId, sponsor.id, "GOLD"));
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns empty result for trip with no sponsors", async () => {
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const tripId = "trip-123";
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      for (const sponsor of sponsors) {
        await Effect.runPromise(
          gateway.linkToTrip(tripId, sponsor.id, "SILVER"),
        );
      }

      const firstPage = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 10 }),
      );

      // Decode cursor
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: SponsorCursorData = JSON.parse(cursorStr);

      const secondPage = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, {
          first: 10,
          after: cursorData,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("error handling", () => {
    it("handles invalid cursor gracefully", async () => {
      const sponsors = Array.from({ length: 5 }, (_, i) =>
        createMockSponsor(`sponsor-${i}`),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      // Should handle invalid cursor without crashing
      const result = await Effect.runPromise(
        gateway.findActiveConnection({
          first: 10,
          after: { id: "invalid", createdAt: "invalid-date" },
        }),
      );

      // Should handle gracefully without crashing - may return empty or results
      expect(result.edges).toBeDefined();
      expect(result.pageInfo).toBeDefined();
    });

    it("handles empty result", async () => {
      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });
  });

  // ============================================================================
  // Pagination + Filtering Tests
  // ============================================================================

  describe("pagination + filtering combinations", () => {
    it("paginates trip sponsors correctly", async () => {
      const tripId = "trip-abc";
      const otherTripId = "trip-xyz";

      // Create sponsors for trip-abc
      const tripSponsors = Array.from({ length: 12 }, (_, i) =>
        createMockSponsor(`trip-sponsor-${i}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      // Create sponsors for other trip
      const otherSponsors = Array.from({ length: 8 }, (_, i) =>
        createMockSponsor(`other-sponsor-${i}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      await Effect.runPromise(
        gateway.seed([...tripSponsors, ...otherSponsors]),
      );

      // Link to respective trips
      for (const sponsor of tripSponsors) {
        await Effect.runPromise(gateway.linkToTrip(tripId, sponsor.id, "GOLD"));
      }
      for (const sponsor of otherSponsors) {
        await Effect.runPromise(
          gateway.linkToTrip(otherTripId, sponsor.id, "SILVER"),
        );
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection(tripId, { first: 10 }),
      );

      expect(result.edges.length).toBe(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });

  // ============================================================================
  // Cursor Stability Tests
  // ============================================================================

  describe("cursor stability", () => {
    it("maintains stable sort with id tiebreaker when timestamps collide", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const sponsors = [
        createMockSponsor("sponsor-c", { createdAt: sameTime }),
        createMockSponsor("sponsor-a", { createdAt: sameTime }),
        createMockSponsor("sponsor-b", { createdAt: sameTime }),
      ];
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      // Should be sorted by id when timestamps are equal
      expect(result.nodes.map((n) => n.id)).toEqual([
        "sponsor-a",
        "sponsor-b",
        "sponsor-c",
      ]);
    });

    it("cursor works correctly with same timestamp items", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const sponsors = [
        createMockSponsor("sponsor-a", { createdAt: sameTime }),
        createMockSponsor("sponsor-b", { createdAt: sameTime }),
        createMockSponsor("sponsor-c", { createdAt: sameTime }),
      ];
      await Effect.runPromise(gateway.seed(sponsors));

      const firstPage = await Effect.runPromise(
        gateway.findActiveConnection({ first: 1 }),
      );

      // Decode cursor for second page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: SponsorCursorData = JSON.parse(cursorStr);

      const secondPage = await Effect.runPromise(
        gateway.findActiveConnection({
          first: 1,
          after: cursorData,
        }),
      );

      expect(secondPage.nodes[0].id).not.toBe(firstPage.nodes[0].id);
    });
  });
});
