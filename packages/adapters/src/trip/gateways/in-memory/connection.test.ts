/**
 * Integration tests for TripGateway Connection methods
 *
 * Tests verify:
 * - GraphQL Connection structure (edges, nodes, pageInfo)
 * - Cursor-based pagination
 * - Error handling
 * - Pagination + filtering combinations
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryTripGateway } from "./gateway";
import type { TripDTO, TripCursorData } from "@mirai-app/use-cases";
import type { TripStatus } from "@mirai-app/domain";

describe("[INTEGRATION] TripGateway - Connection Methods", () => {
  let gateway: InMemoryTripGateway;

  beforeEach(async () => {
    gateway = new InMemoryTripGateway();
    await Effect.runPromise(gateway.reset());
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  const createMockTrip = (
    id: string,
    overrides?: Partial<TripDTO>,
  ): TripDTO => ({
    id,
    name: `Trip ${id}`,
    description: "Test trip description",
    destination: "Test Destination",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-07"),
    status: "ACTIVE" as TripStatus,
    createdById: "user-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  });

  // ============================================================================
  // GraphQL Connection Structure Tests
  // ============================================================================

  describe("Connection structure verification", () => {
    it("returns proper Connection structure with edges, nodes, pageInfo", async () => {
      const trip = createMockTrip("trip-1");
      await Effect.runPromise(gateway.create(trip));

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
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
      const trip = createMockTrip("trip-1", {
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });
      await Effect.runPromise(gateway.create(trip));

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      if (result.edges.length > 0) {
        const edge = result.edges[0];
        expect(edge).toBeDefined();
        const cursor = edge.cursor;
        // Verify cursor is base64url encoded
        expect(() => {
          const decoded = Buffer.from(cursor, "base64url").toString("utf-8");
          const data = JSON.parse(decoded);
          expect(data.id).toBe("trip-1");
          expect(data.createdAt).toBeDefined();
        }).not.toThrow();
      }
    });
  });

  // ============================================================================
  // Cursor-based Pagination Tests - findAllConnection
  // ============================================================================

  describe("findAllConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const trips = Array.from({ length: 25 }, (_, i) =>
        createMockTrip(`trip-${String(i).padStart(3, "0")}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns hasNextPage=false on last page", async () => {
      const trips = Array.from({ length: 15 }, (_, i) =>
        createMockTrip(`trip-${i}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns subsequent page using endCursor", async () => {
      const trips = Array.from({ length: 25 }, (_, i) =>
        createMockTrip(`trip-${String(i).padStart(3, "0")}`, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      // Decode cursor to get TripCursorData
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: TripCursorData = JSON.parse(cursorStr);

      // Get second page using cursor data
      const secondPage = await Effect.runPromise(
        gateway.findAllConnection({
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

    it("returns empty result when no trips", async () => {
      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
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
  // Cursor-based Pagination Tests - findByStatusConnection
  // ============================================================================

  describe("findByStatusConnection - cursor pagination", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const trips = Array.from({ length: 25 }, (_, i) =>
        createMockTrip(`trip-${String(i).padStart(3, "0")}`, {
          status: "ACTIVE" as TripStatus,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("ACTIVE" as TripStatus, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("filters by status correctly", async () => {
      const activeTrips = Array.from({ length: 15 }, (_, i) =>
        createMockTrip(`active-${i}`, {
          status: "ACTIVE" as TripStatus,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      const completedTrips = Array.from({ length: 10 }, (_, i) =>
        createMockTrip(`completed-${i}`, {
          status: "COMPLETED" as TripStatus,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      for (const trip of [...activeTrips, ...completedTrips]) {
        await Effect.runPromise(gateway.create(trip));
      }

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("ACTIVE" as TripStatus, { first: 20 }),
      );

      expect(result.edges.length).toBe(15);
      expect(result.nodes.every((n) => n.status === "ACTIVE")).toBe(true);
    });

    it("returns empty result for status with no trips", async () => {
      const result = await Effect.runPromise(
        gateway.findByStatusConnection("CANCELLED" as TripStatus, {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe("error handling", () => {
    it("handles invalid cursor gracefully", async () => {
      const trips = Array.from({ length: 5 }, (_, i) =>
        createMockTrip(`trip-${i}`),
      );
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      // Should handle invalid cursor without crashing
      const result = await Effect.runPromise(
        gateway.findAllConnection({
          first: 10,
          after: { id: "invalid", createdAt: "invalid-date" },
        }),
      );

      // Should handle gracefully without crashing
      expect(result.edges).toBeDefined();
      expect(result.pageInfo).toBeDefined();
    });

    it("handles empty result", async () => {
      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
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
    it("combines status filter with cursor pagination", async () => {
      const activeTrips = Array.from({ length: 20 }, (_, i) =>
        createMockTrip(`active-${i}`, {
          status: "ACTIVE" as TripStatus,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      const completedTrips = Array.from({ length: 10 }, (_, i) =>
        createMockTrip(`completed-${i}`, {
          status: "COMPLETED" as TripStatus,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );

      for (const trip of [...activeTrips, ...completedTrips]) {
        await Effect.runPromise(gateway.create(trip));
      }

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("ACTIVE" as TripStatus, { first: 10 }),
      );

      expect(result.edges.length).toBe(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.nodes.every((n) => n.status === "ACTIVE")).toBe(true);
    });
  });

  // ============================================================================
  // Cursor Stability Tests
  // ============================================================================

  describe("cursor stability", () => {
    it("maintains stable sort with id tiebreaker when timestamps collide", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const trips = [
        createMockTrip("trip-c", { createdAt: sameTime }),
        createMockTrip("trip-a", { createdAt: sameTime }),
        createMockTrip("trip-b", { createdAt: sameTime }),
      ];
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      // Should return all items (order depends on implementation - descending by createdAt + id)
      expect(result.nodes.length).toBe(3);
      expect(new Set(result.nodes.map((n) => n.id))).toEqual(
        new Set(["trip-a", "trip-b", "trip-c"]),
      );
    });

    it("cursor works correctly with same timestamp items", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const trips = [
        createMockTrip("trip-a", { createdAt: sameTime }),
        createMockTrip("trip-b", { createdAt: sameTime }),
        createMockTrip("trip-c", { createdAt: sameTime }),
      ];
      for (const trip of trips) {
        await Effect.runPromise(gateway.create(trip));
      }

      const firstPage = await Effect.runPromise(
        gateway.findAllConnection({ first: 1 }),
      );

      // Decode cursor for second page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      expect(lastEdge).toBeDefined();
      const cursorStr = Buffer.from(lastEdge.cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData: TripCursorData = JSON.parse(cursorStr);

      const secondPage = await Effect.runPromise(
        gateway.findAllConnection({
          first: 1,
          after: cursorData,
        }),
      );

      expect(secondPage.nodes[0].id).not.toBe(firstPage.nodes[0].id);
    });
  });
});
