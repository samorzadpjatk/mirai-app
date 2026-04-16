/**
 * Unit tests for InMemoryLocationGateway cursor-based pagination
 *
 * Tests both Connection methods:
 * - findSharingWithUserConnection
 * - findByUserIdsConnection
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryLocationGateway } from "./gateway";
import type { LocationDTO } from "@mirai-app/use-cases";

describe("[UNIT] LocationGateway Cursor Pagination", () => {
  let gateway: InMemoryLocationGateway;

  beforeEach(() => {
    gateway = new InMemoryLocationGateway();
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  function createMockLocation(
    id: string,
    userId: string,
    recordedAt: Date,
    overrides?: Partial<LocationDTO>,
  ): LocationDTO {
    return {
      id,
      userId,
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      altitude: null,
      speed: null,
      heading: null,
      recordedAt,
      createdAt: recordedAt,
      ...overrides,
    };
  }

  function createLocationsForUsers(
    userIds: string[],
    countPerUser: number,
    startDate: Date,
  ): LocationDTO[] {
    const locations: LocationDTO[] = [];
    for (const userId of userIds) {
      for (let i = 0; i < countPerUser; i++) {
        const recordedAt = new Date(startDate.getTime() + i * 60 * 60 * 1000); // 1 hour apart
        locations.push(
          createMockLocation(`loc-${userId}-${i + 1}`, userId, recordedAt),
        );
      }
    }
    return locations;
  }

  // ============================================================================
  // findSharingWithUserConnection Tests
  // ============================================================================

  describe("findSharingWithUserConnection", () => {
    it("returns empty result when no locations exist", async () => {
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("user-123", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      const userIds = ["user-1", "user-2", "user-3"];
      const locations = createLocationsForUsers(
        userIds,
        10,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("viewer-123", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const userIds = ["user-1", "user-2"];
      const locations = createLocationsForUsers(
        userIds,
        15,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findSharingWithUserConnection("viewer-123", { first: 10 }),
      );

      // Get second page using cursor from first page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      if (!lastEdge) throw new Error("Expected lastEdge to exist");
      const secondPage = await Effect.runPromise(
        gateway.findSharingWithUserConnection("viewer-123", {
          first: 10,
          after: {
            id: lastEdge.node.id,
            createdAt: lastEdge.node.recordedAt.toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true); // 30 items total, 20 retrieved, 10 more
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify different items
      expect(secondPage.nodes[0]?.id).not.toBe(firstPage.nodes[0]?.id);
    });

    it("returns hasNextPage=false on last page", async () => {
      const userIds = ["user-1"];
      const locations = createLocationsForUsers(
        userIds,
        5,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      // Get all items in one request
      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("viewer-123", { first: 20 }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("sorts by recordedAt, then id", async () => {
      const now = new Date("2024-06-01T08:00:00Z");

      // Create locations with same recordedAt but different ids
      const loc1 = createMockLocation("loc-b", "user-1", now);
      const loc2 = createMockLocation("loc-a", "user-1", now);
      const loc3 = createMockLocation(
        "loc-c",
        "user-1",
        new Date(now.getTime() + 3600000),
      );

      await Effect.runPromise(gateway.create(loc1));
      await Effect.runPromise(gateway.create(loc2));
      await Effect.runPromise(gateway.create(loc3));

      const result = await Effect.runPromise(
        gateway.findSharingWithUserConnection("viewer-123", { first: 10 }),
      );

      // Should be sorted by recordedAt, then id
      // loc-a and loc-b have same recordedAt, so sorted by id: loc-a < loc-b
      // loc-c has later recordedAt
      expect(result.nodes[0]?.id).toBe("loc-a");
      expect(result.nodes[1]?.id).toBe("loc-b");
      expect(result.nodes[2]?.id).toBe("loc-c");
    });
  });

  // ============================================================================
  // findByUserIdsConnection Tests
  // ============================================================================

  describe("findByUserIdsConnection", () => {
    it("returns empty result when no locations exist for user IDs", async () => {
      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1", "user-2"], { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns empty result for empty userIds array", async () => {
      // Seed some data first
      const location = createMockLocation(
        "loc-1",
        "user-1",
        new Date("2024-06-01T08:00:00Z"),
      );
      await Effect.runPromise(gateway.create(location));

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection([], { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns locations for specified user IDs", async () => {
      const userIds = ["user-1", "user-2", "user-3"];
      const locations = createLocationsForUsers(
        userIds,
        5,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1", "user-2"], { first: 10 }),
      );

      // Should return 10 locations (5 from user-1 + 5 from user-2)
      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);

      // All returned items should be from user-1 or user-2
      const returnedUserIds = new Set(result.nodes.map((loc) => loc.userId));
      expect(returnedUserIds.has("user-1")).toBe(true);
      expect(returnedUserIds.has("user-2")).toBe(true);
      expect(returnedUserIds.has("user-3")).toBe(false);
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      const userIds = ["user-1", "user-2"];
      const locations = createLocationsForUsers(
        userIds,
        15,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1", "user-2"], { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns subsequent page using cursor", async () => {
      const userIds = ["user-1"];
      const locations = createLocationsForUsers(
        userIds,
        25,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], { first: 10 }),
      );

      // Get second page using cursor
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      if (!lastEdge) throw new Error("Expected lastEdge to exist");
      const secondPage = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], {
          first: 10,
          after: {
            id: lastEdge.node.id,
            createdAt: lastEdge.node.recordedAt.toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes[0]?.id).not.toBe(firstPage.nodes[0]?.id);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns hasNextPage=false on last page", async () => {
      const userIds = ["user-1"];
      const locations = createLocationsForUsers(
        userIds,
        5,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], { first: 20 }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("sorts by recordedAt, then id", async () => {
      const now = new Date("2024-06-01T08:00:00Z");

      // Create locations for same user with same recordedAt but different ids
      const loc1 = createMockLocation("loc-b", "user-1", now);
      const loc2 = createMockLocation("loc-a", "user-1", now);
      const loc3 = createMockLocation(
        "loc-c",
        "user-1",
        new Date(now.getTime() + 3600000),
      );

      await Effect.runPromise(gateway.create(loc1));
      await Effect.runPromise(gateway.create(loc2));
      await Effect.runPromise(gateway.create(loc3));

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], { first: 10 }),
      );

      // Should be sorted by recordedAt, then id
      expect(result.nodes[0]?.id).toBe("loc-a");
      expect(result.nodes[1]?.id).toBe("loc-b");
      expect(result.nodes[2]?.id).toBe("loc-c");
    });
  });

  // ============================================================================
  // Pagination Limit Tests
  // ============================================================================

  describe("pagination limits", () => {
    it("caps first at 100 items", async () => {
      const userIds = ["user-1"];
      const locations = createLocationsForUsers(
        userIds,
        150,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], { first: 200 }),
      );

      // Should be capped at 100
      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("uses default of 20 when first is not specified", async () => {
      const userIds = ["user-1"];
      const locations = createLocationsForUsers(
        userIds,
        50,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], {}),
      );

      expect(result.edges).toHaveLength(20);
    });

    it("respects first parameter when specified", async () => {
      const userIds = ["user-1"];
      const locations = createLocationsForUsers(
        userIds,
        50,
        new Date("2024-06-01T08:00:00Z"),
      );

      for (const location of locations) {
        await Effect.runPromise(gateway.create(location));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdsConnection(["user-1"], { first: 5 }),
      );

      expect(result.edges).toHaveLength(5);
    });
  });
});
