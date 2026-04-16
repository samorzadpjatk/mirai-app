/**
 * Unit tests for InMemoryCoinTransactionGateway cursor-based pagination
 *
 * Tests the findManyConnection method with filters and cursor pagination
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryCoinTransactionGateway } from "./gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";

describe("[UNIT] CoinTransactionGateway Cursor Pagination", () => {
  let gateway: InMemoryCoinTransactionGateway;

  beforeEach(() => {
    gateway = new InMemoryCoinTransactionGateway();
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  function createMockTransaction(
    id: string,
    tripId: string,
    groupId: string,
    createdAt: Date,
    overrides?: Partial<CoinTransactionDTO>,
  ): CoinTransactionDTO {
    return {
      id,
      groupId,
      amount: 100,
      reason: "Test transaction",
      adminId: "admin-1",
      createdAt,
      updatedAt: new Date(),
      group: {
        id: tripId, // In-memory gateway uses group.id to match tripId
        name: `Group ${groupId}`,
        coins: 500,
      },
      admin: {
        id: "admin-1",
        firstName: "Admin",
        lastName: "User",
      },
      ...overrides,
    };
  }

  function createTransactionsForTrip(
    tripId: string,
    count: number,
    startDate: Date,
  ): CoinTransactionDTO[] {
    const transactions: CoinTransactionDTO[] = [];
    for (let i = 0; i < count; i++) {
      // Create transactions with descending createdAt (newest first)
      const createdAt = new Date(startDate.getTime() - i * 60 * 60 * 1000); // 1 hour apart
      transactions.push(
        createMockTransaction(
          `tx-${tripId}-${i + 1}`,
          tripId,
          `group-${tripId}`,
          createdAt,
        ),
      );
    }
    return transactions;
  }

  // ============================================================================
  // findManyConnection Tests
  // ============================================================================

  describe("findManyConnection", () => {
    it("returns empty result when no transactions match", async () => {
      const result = await Effect.runPromise(
        gateway.findManyConnection({ tripId: "trip-empty" }, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns first page with hasNextPage=true when more items exist", async () => {
      const tripId = "trip-1";
      const transactions = createTransactionsForTrip(
        tripId,
        25,
        new Date("2024-06-01T12:00:00Z"),
      );

      gateway.seed(transactions);

      const result = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const tripId = "trip-2";
      const transactions = createTransactionsForTrip(
        tripId,
        25,
        new Date("2024-06-01T12:00:00Z"),
      );

      gateway.seed(transactions);

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 10 }),
      );

      // Get second page using endCursor from first page
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      if (!lastEdge) {
        throw new Error("Expected at least one edge in first page");
      }
      const cursor = {
        id: lastEdge.node.id,
        createdAt: lastEdge.node.createdAt.toISOString(),
      };

      const secondPage = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 10, after: cursor }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify different items
      expect(secondPage.nodes[0]?.id).not.toBe(firstPage.nodes[0]?.id);
    });

    it("returns hasNextPage=false on last page", async () => {
      const tripId = "trip-3";
      const transactions = createTransactionsForTrip(
        tripId,
        15,
        new Date("2024-06-01T12:00:00Z"),
      );

      gateway.seed(transactions);

      // Get all items in one page
      const result = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.nodes).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("respects groupId filter with cursor pagination", async () => {
      const tripId = "trip-4";
      const group1Transactions = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction(
          `tx-g1-${i + 1}`,
          tripId,
          "group-1",
          new Date(2024, 5, 1, 12 - i),
        ),
      );
      const group2Transactions = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction(
          `tx-g2-${i + 1}`,
          tripId,
          "group-2",
          new Date(2024, 5, 1, 11 - i),
        ),
      );

      gateway.seed([...group1Transactions, ...group2Transactions]);

      // Get first page filtered by groupId
      const result = await Effect.runPromise(
        gateway.findManyConnection(
          { tripId, groupId: "group-1" },
          { first: 5 },
        ),
      );

      expect(result.edges).toHaveLength(5);
      expect(result.nodes.every((n) => n.groupId === "group-1")).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("respects date range filter with cursor pagination", async () => {
      const tripId = "trip-5";
      const transactions = [
        createMockTransaction(
          "tx-1",
          tripId,
          "group-1",
          new Date("2024-06-01T10:00:00Z"),
        ),
        createMockTransaction(
          "tx-2",
          tripId,
          "group-1",
          new Date("2024-06-02T10:00:00Z"),
        ),
        createMockTransaction(
          "tx-3",
          tripId,
          "group-1",
          new Date("2024-06-03T10:00:00Z"),
        ),
        createMockTransaction(
          "tx-4",
          tripId,
          "group-1",
          new Date("2024-06-04T10:00:00Z"),
        ),
      ];

      gateway.seed(transactions);

      // Filter by date range
      const result = await Effect.runPromise(
        gateway.findManyConnection(
          {
            tripId,
            startDate: new Date("2024-06-02T00:00:00Z"),
            endDate: new Date("2024-06-03T23:59:59Z"),
          },
          { first: 10 },
        ),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes[0]?.id).toBe("tx-3"); // Most recent in range
      expect(result.nodes[1]?.id).toBe("tx-2"); // Second most recent
    });

    it("combines multiple filters with cursor pagination", async () => {
      const tripId = "trip-6";
      const transactions = [
        createMockTransaction(
          "tx-g1-1",
          tripId,
          "group-1",
          new Date("2024-06-01T10:00:00Z"),
        ),
        createMockTransaction(
          "tx-g1-2",
          tripId,
          "group-1",
          new Date("2024-06-03T10:00:00Z"),
        ),
        createMockTransaction(
          "tx-g2-1",
          tripId,
          "group-2",
          new Date("2024-06-02T10:00:00Z"),
        ),
        createMockTransaction(
          "tx-g2-2",
          tripId,
          "group-2",
          new Date("2024-06-04T10:00:00Z"),
        ),
      ];

      gateway.seed(transactions);

      // Filter by tripId, groupId, and date range
      const result = await Effect.runPromise(
        gateway.findManyConnection(
          {
            tripId,
            groupId: "group-1",
            startDate: new Date("2024-06-01T00:00:00Z"),
            endDate: new Date("2024-06-02T23:59:59Z"),
          },
          { first: 10 },
        ),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0]?.id).toBe("tx-g1-1");
    });

    it("returns correct cursors that can be decoded", async () => {
      const tripId = "trip-7";
      const transactions = createTransactionsForTrip(
        tripId,
        5,
        new Date("2024-06-01T12:00:00Z"),
      );

      gateway.seed(transactions);

      const result = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 3 }),
      );

      // Each edge should have a non-null cursor
      for (const edge of result.edges) {
        expect(edge.cursor).toBeTruthy();
        expect(typeof edge.cursor).toBe("string");
      }

      // pageInfo cursors should match first and last edge
      expect(result.pageInfo.startCursor).toBe(result.edges[0]?.cursor ?? null);
      expect(result.pageInfo.endCursor).toBe(
        result.edges[result.edges.length - 1]?.cursor ?? null,
      );
    });

    it("sorts by createdAt descending with id as tiebreaker", async () => {
      const tripId = "trip-8";
      const sameTime = new Date("2024-06-01T12:00:00Z");

      // Create transactions with same createdAt but different ids
      const transactions = [
        createMockTransaction("tx-c", tripId, "group-1", sameTime),
        createMockTransaction("tx-a", tripId, "group-1", sameTime),
        createMockTransaction("tx-b", tripId, "group-1", sameTime),
      ];

      gateway.seed(transactions);

      const result = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 10 }),
      );

      // When createdAt is equal, should sort by id descending
      // Expected order: tx-c, tx-b, tx-a (descending id)
      expect(result.nodes[0]?.id).toBe("tx-c");
      expect(result.nodes[1]?.id).toBe("tx-b");
      expect(result.nodes[2]?.id).toBe("tx-a");
    });

    it("handles cursor at end of list (no more items)", async () => {
      const tripId = "trip-9";
      const transactions = createTransactionsForTrip(
        tripId,
        5,
        new Date("2024-06-01T12:00:00Z"),
      );

      gateway.seed(transactions);

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findManyConnection({ tripId }, { first: 3 }),
      );

      // Get second page using cursor
      const lastEdge = firstPage.edges[firstPage.edges.length - 1];
      if (!lastEdge) {
        throw new Error("Expected at least one edge in first page");
      }
      const secondPage = await Effect.runPromise(
        gateway.findManyConnection(
          { tripId },
          {
            first: 3,
            after: {
              id: lastEdge.node.id,
              createdAt: lastEdge.node.createdAt.toISOString(),
            },
          },
        ),
      );

      // Third page should be empty
      const secondLastEdge = secondPage.edges[secondPage.edges.length - 1];
      if (!secondLastEdge) {
        throw new Error("Expected at least one edge in second page");
      }
      const thirdPage = await Effect.runPromise(
        gateway.findManyConnection(
          { tripId },
          {
            first: 3,
            after: {
              id: secondLastEdge.node.id,
              createdAt: secondLastEdge.node.createdAt.toISOString(),
            },
          },
        ),
      );

      expect(thirdPage.edges).toHaveLength(0);
      expect(thirdPage.pageInfo.hasNextPage).toBe(false);
    });
  });
});
