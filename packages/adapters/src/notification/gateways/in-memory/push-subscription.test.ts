import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryPushSubscriptionGateway } from "./push-subscription";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Factory for creating mock PushSubscriptionDTOs
 */
const createMockPushSubscription = (
  overrides: Partial<
    Parameters<typeof InMemoryPushSubscriptionGateway.prototype.seed>[0][0]
  > = {},
): {
  id: string;
  userId: string;
  token: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
} => ({
  id: `sub-${Math.random().toString(36).substring(7)}`,
  userId: "user-123",
  token: `ExponentPushToken[${Math.random().toString(36).substring(7)}]`,
  platform: "ios",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  ...overrides,
});

describe("[UNIT] InMemoryPushSubscriptionGateway", () => {
  let gateway: InMemoryPushSubscriptionGateway;

  beforeEach(() => {
    gateway = new InMemoryPushSubscriptionGateway();
  });

  describe("create", () => {
    it("creates a new push subscription", async () => {
      const subscription = createMockPushSubscription();

      const result = await Effect.runPromise(gateway.create(subscription));

      expect(result.id).toBe(subscription.id);
      expect(result.userId).toBe(subscription.userId);
      expect(result.token).toBe(subscription.token);
      expect(result.platform).toBe(subscription.platform);
    });

    it("stores subscription in storage", async () => {
      const subscription = createMockPushSubscription({ id: "sub-1" });

      await Effect.runPromise(gateway.create(subscription));
      const found = await Effect.runPromise(gateway.findById("sub-1"));

      expect(found).not.toBeNull();
      expect(found?.id).toBe("sub-1");
    });
  });

  describe("findById", () => {
    it("returns subscription when found", async () => {
      const subscription = createMockPushSubscription({ id: "sub-1" });
      await Effect.runPromise(gateway.create(subscription));

      const result = await Effect.runPromise(gateway.findById("sub-1"));

      expect(result).not.toBeNull();
      expect(result?.id).toBe("sub-1");
    });

    it("returns null when not found", async () => {
      const result = await Effect.runPromise(gateway.findById("nonexistent"));

      expect(result).toBeNull();
    });
  });

  describe("findByUserId", () => {
    it("returns subscriptions for user", async () => {
      const sub1 = createMockPushSubscription({
        id: "sub-1",
        userId: "user-123",
      });
      const sub2 = createMockPushSubscription({
        id: "sub-2",
        userId: "user-123",
      });
      const sub3 = createMockPushSubscription({
        id: "sub-3",
        userId: "user-456",
      });

      await Effect.runPromise(gateway.create(sub1));
      await Effect.runPromise(gateway.create(sub2));
      await Effect.runPromise(gateway.create(sub3));

      const result = await Effect.runPromise(gateway.findByUserId("user-123"));

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain("sub-1");
      expect(result.map((s) => s.id)).toContain("sub-2");
    });

    it("returns empty array when user has no subscriptions", async () => {
      const result = await Effect.runPromise(gateway.findByUserId("user-999"));

      expect(result).toHaveLength(0);
    });

    it("sorts by createdAt ascending, then by id", async () => {
      const sub1 = createMockPushSubscription({
        id: "sub-a",
        userId: "user-123",
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });
      const sub2 = createMockPushSubscription({
        id: "sub-b",
        userId: "user-123",
        createdAt: new Date("2024-01-15T09:00:00Z"),
      });
      const sub3 = createMockPushSubscription({
        id: "sub-c",
        userId: "user-123",
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });

      await Effect.runPromise(gateway.create(sub1));
      await Effect.runPromise(gateway.create(sub2));
      await Effect.runPromise(gateway.create(sub3));

      const result = await Effect.runPromise(gateway.findByUserId("user-123"));

      expect(result[0].id).toBe("sub-b"); // Earliest createdAt
      expect(result[1].id).toBe("sub-a"); // Same createdAt, alphabetically first
      expect(result[2].id).toBe("sub-c"); // Same createdAt, alphabetically second
    });
  });

  describe("findByPlatform", () => {
    it("returns subscriptions for platform", async () => {
      const sub1 = createMockPushSubscription({
        id: "sub-1",
        platform: "ios",
      });
      const sub2 = createMockPushSubscription({
        id: "sub-2",
        platform: "ios",
      });
      const sub3 = createMockPushSubscription({
        id: "sub-3",
        platform: "android",
      });

      await Effect.runPromise(gateway.create(sub1));
      await Effect.runPromise(gateway.create(sub2));
      await Effect.runPromise(gateway.create(sub3));

      const result = await Effect.runPromise(gateway.findByPlatform("ios"));

      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id)).toContain("sub-1");
      expect(result.map((s) => s.id)).toContain("sub-2");
    });

    it("returns empty array when platform has no subscriptions", async () => {
      const result = await Effect.runPromise(gateway.findByPlatform("web"));

      expect(result).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("updates existing subscription", async () => {
      const subscription = createMockPushSubscription({
        id: "sub-1",
        token: "old-token",
      });
      await Effect.runPromise(gateway.create(subscription));

      const updated = {
        ...subscription,
        token: "new-token",
        updatedAt: new Date(),
      };
      const result = await Effect.runPromise(gateway.update(updated));

      expect(result.token).toBe("new-token");
    });
  });

  describe("delete", () => {
    it("removes subscription from storage", async () => {
      const subscription = createMockPushSubscription({ id: "sub-1" });
      await Effect.runPromise(gateway.create(subscription));

      await Effect.runPromise(gateway.delete("sub-1"));
      const found = await Effect.runPromise(gateway.findById("sub-1"));

      expect(found).toBeNull();
    });
  });

  describe("deleteByUserId", () => {
    it("removes all subscriptions for user", async () => {
      const sub1 = createMockPushSubscription({
        id: "sub-1",
        userId: "user-123",
      });
      const sub2 = createMockPushSubscription({
        id: "sub-2",
        userId: "user-123",
      });
      const sub3 = createMockPushSubscription({
        id: "sub-3",
        userId: "user-456",
      });

      await Effect.runPromise(gateway.create(sub1));
      await Effect.runPromise(gateway.create(sub2));
      await Effect.runPromise(gateway.create(sub3));

      await Effect.runPromise(gateway.deleteByUserId("user-123"));

      const found1 = await Effect.runPromise(gateway.findById("sub-1"));
      const found2 = await Effect.runPromise(gateway.findById("sub-2"));
      const found3 = await Effect.runPromise(gateway.findById("sub-3"));

      expect(found1).toBeNull();
      expect(found2).toBeNull();
      expect(found3).not.toBeNull();
    });
  });

  describe("exists", () => {
    it("returns true when subscription exists", async () => {
      const subscription = createMockPushSubscription({ id: "sub-1" });
      await Effect.runPromise(gateway.create(subscription));

      const result = await Effect.runPromise(gateway.exists("sub-1"));

      expect(result).toBe(true);
    });

    it("returns false when subscription does not exist", async () => {
      const result = await Effect.runPromise(gateway.exists("nonexistent"));

      expect(result).toBe(false);
    });
  });

  describe("hasSubscriptions", () => {
    it("returns true when user has subscriptions", async () => {
      const subscription = createMockPushSubscription({ userId: "user-123" });
      await Effect.runPromise(gateway.create(subscription));

      const result = await Effect.runPromise(
        gateway.hasSubscriptions("user-123"),
      );

      expect(result).toBe(true);
    });

    it("returns false when user has no subscriptions", async () => {
      const result = await Effect.runPromise(
        gateway.hasSubscriptions("user-999"),
      );

      expect(result).toBe(false);
    });
  });

  describe("countByUserId", () => {
    it("returns count of user subscriptions", async () => {
      const sub1 = createMockPushSubscription({ userId: "user-123" });
      const sub2 = createMockPushSubscription({ userId: "user-123" });
      const sub3 = createMockPushSubscription({ userId: "user-456" });

      await Effect.runPromise(gateway.create(sub1));
      await Effect.runPromise(gateway.create(sub2));
      await Effect.runPromise(gateway.create(sub3));

      const result = await Effect.runPromise(gateway.countByUserId("user-123"));

      expect(result).toBe(2);
    });

    it("returns 0 when user has no subscriptions", async () => {
      const result = await Effect.runPromise(gateway.countByUserId("user-999"));

      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Cursor-based Pagination Tests (Relay Connection Spec)
  // ============================================================================

  describe("findByUserIdConnection", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const userId = "user-123";
      // Create 25 subscriptions for user
      for (let i = 0; i < 25; i++) {
        const sub = createMockPushSubscription({
          id: `sub-${i}`,
          userId,
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const userId = "user-123";
      // Create 25 subscriptions for user
      for (let i = 0; i < 25; i++) {
        const sub = createMockPushSubscription({
          id: `sub-${i}`,
          userId,
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      // Get second page using endCursor
      const secondPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, {
          first: 10,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify different items
      const firstPageIds = firstPage.edges.map((e) => e.node.id);
      const secondPageIds = secondPage.edges.map((e) => e.node.id);
      expect(firstPageIds).not.toEqual(secondPageIds);
    });

    it("returns hasNextPage=false on last page", async () => {
      const userId = "user-123";
      // Create 25 subscriptions for user
      for (let i = 0; i < 25; i++) {
        const sub = createMockPushSubscription({
          id: `sub-${i}`,
          userId,
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      // Get first page
      const firstPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      // Get second page
      const secondPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, {
          first: 10,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      // Get third page (last page, only 5 items)
      const thirdPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, {
          first: 10,
          after: secondPage.pageInfo.endCursor,
        }),
      );

      expect(thirdPage.edges).toHaveLength(5);
      expect(thirdPage.pageInfo.hasNextPage).toBe(false);
      expect(thirdPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("handles empty result", async () => {
      const result = await Effect.runPromise(
        gateway.findByUserIdConnection("user-999", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("returns hasNextPage=false when exact page size", async () => {
      const userId = "user-123";
      // Create exactly 10 subscriptions
      for (let i = 0; i < 10; i++) {
        const sub = createMockPushSubscription({
          id: `sub-${i}`,
          userId,
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("caps first to maximum of 100", async () => {
      const userId = "user-123";
      // Create 150 subscriptions
      for (let i = 0; i < 150; i++) {
        const sub = createMockPushSubscription({
          id: `sub-${i}`,
          userId,
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 200 }),
      );

      // Should be capped to 100
      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("each edge has unique cursor", async () => {
      const userId = "user-123";
      for (let i = 0; i < 5; i++) {
        const sub = createMockPushSubscription({
          id: `sub-${i}`,
          userId,
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 5 }),
      );

      const cursors = result.edges.map((e) => e.cursor);
      const uniqueCursors = new Set(cursors);
      expect(uniqueCursors.size).toBe(cursors.length);
    });

    it("cursor contains valid data", async () => {
      const userId = "user-123";
      const sub = createMockPushSubscription({
        id: "sub-1",
        userId,
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });
      await Effect.runPromise(gateway.create(sub));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 5 }),
      );

      expect(result.edges[0].cursor).toBeTruthy();
      // Cursor should be a valid base64 string
      const decoded = Buffer.from(result.edges[0].cursor, "base64url").toString(
        "utf-8",
      );
      const cursorData = JSON.parse(decoded);
      expect(cursorData.id).toBe("sub-1");
      expect(cursorData.createdAt).toBe("2024-01-15T10:00:00.000Z");
    });
  });

  describe("findByPlatformConnection", () => {
    it("returns paginated results by platform", async () => {
      // Create ios subscriptions
      for (let i = 0; i < 15; i++) {
        const sub = createMockPushSubscription({
          id: `ios-sub-${i}`,
          platform: "ios",
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      // Create android subscriptions
      for (let i = 0; i < 10; i++) {
        const sub = createMockPushSubscription({
          id: `android-sub-${i}`,
          platform: "android",
          createdAt: new Date(2024, 0, 15, 11, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      const result = await Effect.runPromise(
        gateway.findByPlatformConnection("ios", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      // All results should be iOS
      result.edges.forEach((edge) => {
        expect(edge.node.platform).toBe("ios");
      });
    });

    it("returns empty result for platform with no subscriptions", async () => {
      const result = await Effect.runPromise(
        gateway.findByPlatformConnection("web", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("supports pagination through multiple pages", async () => {
      // Create 30 ios subscriptions
      for (let i = 0; i < 30; i++) {
        const sub = createMockPushSubscription({
          id: `ios-sub-${i}`,
          platform: "ios",
          createdAt: new Date(2024, 0, 15, 10, i),
        });
        await Effect.runPromise(gateway.create(sub));
      }

      // Page 1
      const page1 = await Effect.runPromise(
        gateway.findByPlatformConnection("ios", { first: 10 }),
      );
      expect(page1.edges).toHaveLength(10);
      expect(page1.pageInfo.hasNextPage).toBe(true);

      // Page 2
      const page2 = await Effect.runPromise(
        gateway.findByPlatformConnection("ios", {
          first: 10,
          after: page1.pageInfo.endCursor,
        }),
      );
      expect(page2.edges).toHaveLength(10);
      expect(page2.pageInfo.hasNextPage).toBe(true);
      expect(page2.pageInfo.hasPreviousPage).toBe(true);

      // Page 3
      const page3 = await Effect.runPromise(
        gateway.findByPlatformConnection("ios", {
          first: 10,
          after: page2.pageInfo.endCursor,
        }),
      );
      expect(page3.edges).toHaveLength(10);
      expect(page3.pageInfo.hasNextPage).toBe(false);
      expect(page3.pageInfo.hasPreviousPage).toBe(true);
    });
  });
});
