/**
 * Unit tests for InMemoryRewardPurchaseGateway cursor-based pagination
 *
 * Tests all 3 Connection methods:
 * - findByRewardIdConnection
 * - findByGroupIdConnection
 * - findByTripIdConnection
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryRewardPurchaseGateway } from "./gateway";
import type { RewardPurchaseDTO } from "@mirai-app/use-cases";
import { RewardPurchaseStatus, type RewardId } from "@mirai-app/domain";

// Helper to create RewardId from string (for testing)
function createRewardId(id: string): RewardId {
  return id as unknown as RewardId;
}

describe("[UNIT] RewardPurchaseGateway Cursor Pagination", () => {
  let gateway: InMemoryRewardPurchaseGateway;

  beforeEach(() => {
    gateway = new InMemoryRewardPurchaseGateway();
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  function createMockPurchase(
    id: string,
    rewardId: string,
    groupId: string,
    purchasedAt: Date,
    overrides?: Partial<RewardPurchaseDTO>,
  ): RewardPurchaseDTO {
    return {
      id,
      rewardId,
      groupId,
      userId: "user-1",
      pointsSpent: 100,
      status: RewardPurchaseStatus.BOUGHT,
      quantity: 1,
      collectionMethod: null,
      collectedAt: null,
      collectedById: null,
      notes: null,
      purchasedAt,
      updatedAt: new Date("2024-01-01T00:00:00Z"),
      ...overrides,
    };
  }

  function createPurchasesForReward(
    rewardId: string,
    groupId: string,
    count: number,
    startDate: Date,
  ): RewardPurchaseDTO[] {
    const purchases: RewardPurchaseDTO[] = [];
    for (let i = 0; i < count; i++) {
      const purchasedAt = new Date(startDate.getTime() + i * 60 * 60 * 1000); // 1 hour apart
      purchases.push(
        createMockPurchase(
          `purchase-${rewardId}-${groupId}-${i + 1}`,
          rewardId,
          groupId,
          purchasedAt,
        ),
      );
    }
    return purchases;
  }

  // ============================================================================
  // findByRewardIdConnection Tests
  // ============================================================================

  describe("findByRewardIdConnection", () => {
    it("returns empty result for reward with no purchases", async () => {
      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-empty"), {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        25,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns hasNextPage=false when all items fit in one page", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        5,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 10,
        }),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns subsequent page using cursor", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        25,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 10,
        }),
      );

      // Get second page using endCursor
      const secondPage = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 10,
          after: {
            id: firstPage.edges[9].node.id,
            purchasedAt: firstPage.edges[9].node.purchasedAt.toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
      expect(secondPage.edges[0].node.id).not.toBe(firstPage.edges[0].node.id);
    });

    it("caps first at maximum 100", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        150,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 200,
        }),
      );

      expect(result.edges.length).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // findByGroupIdConnection Tests
  // ============================================================================

  describe("findByGroupIdConnection", () => {
    it("returns empty result for group with no purchases", async () => {
      const result = await Effect.runPromise(
        gateway.findByGroupIdConnection("group-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns purchases for a specific group", async () => {
      const group1Purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        10,
        new Date("2024-01-01T00:00:00Z"),
      );
      const group2Purchases = createPurchasesForReward(
        "reward-1",
        "group-2",
        5,
        new Date("2024-01-02T00:00:00Z"),
      );
      await Effect.runPromise(
        gateway.seed([...group1Purchases, ...group2Purchases]),
      );

      const result = await Effect.runPromise(
        gateway.findByGroupIdConnection("group-1", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes.every((n) => n.groupId === "group-1")).toBe(true);
    });

    it("paginates correctly with cursor", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        25,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const firstPage = await Effect.runPromise(
        gateway.findByGroupIdConnection("group-1", { first: 10 }),
      );

      const secondPage = await Effect.runPromise(
        gateway.findByGroupIdConnection("group-1", {
          first: 10,
          after: {
            id: firstPage.edges[9].node.id,
            purchasedAt: firstPage.edges[9].node.purchasedAt.toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  // ============================================================================
  // findByTripIdConnection Tests
  // ============================================================================

  describe("findByTripIdConnection", () => {
    it("returns purchases (in-memory returns all, no trip filter)", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        15,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      // Note: In-memory implementation doesn't filter by tripId
      // since RewardPurchaseDTO doesn't have a tripId field
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("returns empty result when no purchases exist", async () => {
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-empty", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("paginates with cursor correctly", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        25,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const firstPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", { first: 10 }),
      );

      const secondPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-1", {
          first: 10,
          after: {
            id: firstPage.edges[9].node.id,
            purchasedAt: firstPage.edges[9].node.purchasedAt.toISOString(),
          },
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  // ============================================================================
  // Sort Stability Tests
  // ============================================================================

  describe("sort stability", () => {
    it("uses id as tiebreaker when purchasedAt is equal", async () => {
      const sameTime = new Date("2024-01-01T12:00:00Z");
      const purchases: RewardPurchaseDTO[] = [
        createMockPurchase("purchase-c", "reward-1", "group-1", sameTime),
        createMockPurchase("purchase-a", "reward-1", "group-1", sameTime),
        createMockPurchase("purchase-b", "reward-1", "group-1", sameTime),
      ];
      await Effect.runPromise(gateway.seed(purchases));

      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 10,
        }),
      );

      // Should be sorted by id when purchasedAt is equal
      expect(result.edges[0].node.id).toBe("purchase-a");
      expect(result.edges[1].node.id).toBe("purchase-b");
      expect(result.edges[2].node.id).toBe("purchase-c");
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("edge cases", () => {
    it("handles cursor pointing to last item", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        5,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {
          first: 10,
          after: {
            id: "purchase-reward-1-group-1-5",
            purchasedAt: purchases[4].purchasedAt.toISOString(),
          },
        }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("uses default first value of 20 when not specified", async () => {
      const purchases = createPurchasesForReward(
        "reward-1",
        "group-1",
        25,
        new Date("2024-01-01T00:00:00Z"),
      );
      await Effect.runPromise(gateway.seed(purchases));

      const result = await Effect.runPromise(
        gateway.findByRewardIdConnection(createRewardId("reward-1"), {}),
      );

      expect(result.edges).toHaveLength(20);
    });
  });
});
