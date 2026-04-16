import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { InMemoryNotificationGateway } from "../../gateways/in-memory/gateway";
import type { NotificationDTO } from "@mirai-app/use-cases";
import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";
import { decodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

/**
 * Test helpers for creating mock notifications
 */
function createMockNotification(
  id: string,
  createdById: string,
  overrides: Partial<NotificationDTO> = {},
): NotificationDTO {
  const now = new Date();
  return {
    id,
    tripId: null,
    title: `Test Notification ${id}`,
    content: "Test content",
    type: "BROADCAST",
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    scheduledAt: null,
    sentAt: null,
    createdById,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("[UNIT] InMemoryNotificationGateway - Cursor Pagination", () => {
  describe("findByUserIdConnection", () => {
    it("returns first page with hasNextPage=true when more items exist", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(`notif-${i + 1}`, userId, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(`notif-${i + 1}`, userId, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(notifications));

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
      expect(secondPage.nodes).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);

      // Verify different items
      const firstNode = firstPage.nodes[0];
      const secondNode = secondPage.nodes[0];
      expect(firstNode).toBeDefined();
      expect(secondNode).toBeDefined();
      expect(secondNode!.id).not.toBe(firstNode!.id);
    });

    it("returns hasNextPage=false on last page", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const notifications = Array.from({ length: 15 }, (_, i) =>
        createMockNotification(`notif-${i + 1}`, userId, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("handles empty result", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("cursors are valid and decodable", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const notification = createMockNotification("notif-1", userId);
      await Effect.runPromise(gateway.seed([notification]));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 10 }),
      );

      const firstEdge = result.edges[0];
      expect(firstEdge).toBeDefined();
      const cursor = firstEdge!.cursor;
      const decoded = decodeCursor(cursor);

      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe("notif-1");
      expect(decoded!.createdAt).toBe(notification.createdAt.toISOString());
    });

    it("respects max page size limit of 100", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const notifications = Array.from({ length: 150 }, (_, i) =>
        createMockNotification(`notif-${i + 1}`, userId, {
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 200 }),
      );

      expect(result.edges.length).toBeLessThanOrEqual(100);
    });

    it("filters by userId only", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId1 = "user-123";
      const userId2 = "user-456";

      await Effect.runPromise(
        gateway.seed([
          createMockNotification("notif-1", userId1),
          createMockNotification("notif-2", userId1),
          createMockNotification("notif-3", userId2),
        ]),
      );

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId1, { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes.every((n) => n.createdById === userId1)).toBe(true);
    });
  });

  describe("findUnreadByUserIdConnection", () => {
    it("returns only unread notifications (DRAFT/READY status)", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const now = new Date();

      await Effect.runPromise(
        gateway.seed([
          createMockNotification("notif-1", userId, {
            status: NotificationStatus.DRAFT,
            scheduledAt: null,
            createdAt: now,
          }),
          createMockNotification("notif-2", userId, {
            status: NotificationStatus.READY,
            scheduledAt: new Date(now.getTime() - 1000),
            createdAt: new Date(now.getTime() - 1000),
          }),
          createMockNotification("notif-3", userId, {
            status: NotificationStatus.SENT,
            sentAt: now,
            createdAt: new Date(now.getTime() - 2000),
          }),
          createMockNotification("notif-4", userId, {
            status: NotificationStatus.DRAFT,
            scheduledAt: new Date(now.getTime() + 1000), // Future scheduled
            createdAt: new Date(now.getTime() - 3000),
          }),
        ]),
      );

      const result = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId, { first: 10 }),
      );

      // Should only return DRAFT (no schedule) and READY (scheduled in past)
      expect(result.edges).toHaveLength(2);
      expect(result.nodes.some((n) => n.id === "notif-1")).toBe(true);
      expect(result.nodes.some((n) => n.id === "notif-2")).toBe(true);
      expect(result.nodes.some((n) => n.id === "notif-3")).toBe(false); // SENT
      expect(result.nodes.some((n) => n.id === "notif-4")).toBe(false); // Future scheduled
    });

    it("paginates unread notifications correctly", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const now = new Date();

      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(`notif-${i + 1}`, userId, {
          status: NotificationStatus.DRAFT,
          scheduledAt: null,
          createdAt: new Date(2024, 0, i + 1),
        }),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const firstPage = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId, { first: 10 }),
      );

      expect(firstPage.edges).toHaveLength(10);
      expect(firstPage.pageInfo.hasNextPage).toBe(true);

      const secondPage = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId, {
          first: 10,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("combines unread filter with pagination correctly", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const now = new Date();

      // Mix of read and unread notifications
      await Effect.runPromise(gateway.seed([
        ...Array.from({ length: 15 }, (_, i) =>
          createMockNotification(`unread-${i + 1}`, userId, {
            status: NotificationStatus.DRAFT,
            scheduledAt: null,
            createdAt: new Date(2024, 0, i + 1),
          }),
        ),
        ...Array.from({ length: 10 }, (_, i) =>
          createMockNotification(`read-${i + 1}`, userId, {
            status: NotificationStatus.SENT,
            sentAt: now,
            createdAt: new Date(2024, 0, i + 16),
          }),
        ),
      ]));

      const result = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes.every((n) => n.id.startsWith("unread-"))).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(true);

      // Get next page
      const secondPage = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId, {
          first: 10,
          after: result.pageInfo.endCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(5);
      expect(secondPage.nodes.every((n) => n.id.startsWith("unread-"))).toBe(
        true,
      );
      expect(secondPage.pageInfo.hasNextPage).toBe(false);
    });

    it("handles empty unread result", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const now = new Date();

      // Only add "read" (SENT) notifications
      await Effect.runPromise(gateway.seed([
        createMockNotification("notif-1", userId, {
          status: NotificationStatus.SENT,
          sentAt: now,
        }),
      ]));

      const result = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId, { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("filters by userId for unread notifications", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId1 = "user-123";
      const userId2 = "user-456";

      await Effect.runPromise(gateway.seed([
        createMockNotification("notif-1", userId1, {
          status: NotificationStatus.DRAFT,
          scheduledAt: null,
        }),
        createMockNotification("notif-2", userId2, {
          status: NotificationStatus.DRAFT,
          scheduledAt: null,
        }),
      ]));

      const result = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection(userId1, { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      const firstNode = result.nodes[0];
      expect(firstNode).toBeDefined();
      expect(firstNode!.createdById).toBe(userId1);
    });
  });

  describe("cursor stability", () => {
    it("maintains stable ordering when items have same createdAt", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const sameTime = new Date();

      await Effect.runPromise(gateway.seed([
        createMockNotification("notif-1", userId, { createdAt: sameTime }),
        createMockNotification("notif-2", userId, { createdAt: sameTime }),
        createMockNotification("notif-3", userId, { createdAt: sameTime }),
      ]));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 2 }),
      );

      expect(result.edges).toHaveLength(2);
      // Items should be ordered by id as tiebreaker
      const ids = result.nodes.map((n) => n.id);
      expect(ids).toEqual(ids.slice().sort()); // Should be sorted by id
    });

    it("cursor works correctly with same timestamp items", async () => {
      const gateway = new InMemoryNotificationGateway();
      const userId = "user-123";
      const sameTime = new Date();

      await Effect.runPromise(gateway.seed([
        createMockNotification("notif-a", userId, { createdAt: sameTime }),
        createMockNotification("notif-b", userId, { createdAt: sameTime }),
        createMockNotification("notif-c", userId, { createdAt: sameTime }),
      ]));

      const firstPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, { first: 1 }),
      );

      const secondPage = await Effect.runPromise(
        gateway.findByUserIdConnection(userId, {
          first: 1,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      const firstNode = firstPage.nodes[0];
      const secondNode = secondPage.nodes[0];
      expect(firstNode).toBeDefined();
      expect(secondNode).toBeDefined();
      expect(secondNode!.id).not.toBe(firstNode!.id);
    });
  });
});
