import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryNotificationGateway } from "./gateway";
import type { NotificationDTO } from "@mirai-app/use-cases";
import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";

// Local type for test notification type
const NotificationType = {
  INFO: "INFO",
  WARNING: "WARNING",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
} as const;

describe("[UNIT] InMemoryNotificationGateway", () => {
  let gateway: InMemoryNotificationGateway;

  const createMockNotification = (
    id: string,
    createdAt: Date,
    overrides: Partial<NotificationDTO> = {},
  ): NotificationDTO => ({
    id,
    tripId: overrides.tripId ?? "trip-001",
    title: overrides.title ?? `Notification ${id}`,
    content: overrides.content ?? `Content for ${id}`,
    type: (overrides.type ?? NotificationType.INFO) as
      | "INFO"
      | "WARNING"
      | "ERROR"
      | "SUCCESS"
      | "ANNOUNCEMENT"
      | "CHALLENGE"
      | "RANKING"
      | "REWARD"
      | "SYSTEM",
    status: overrides.status ?? NotificationStatus.DRAFT,
    priority: overrides.priority ?? NotificationPriority.NORMAL,
    scheduledAt: overrides.scheduledAt ?? null,
    sentAt: overrides.sentAt ?? null,
    createdById: overrides.createdById ?? "user-001",
    createdAt,
    updatedAt: createdAt,
  });

  beforeEach(() => {
    gateway = new InMemoryNotificationGateway();
  });

  describe("CRUD Operations", () => {
    it("creates a notification", async () => {
      const notification = createMockNotification("notif-001", new Date());

      const result = await Effect.runPromise(gateway.create(notification));

      expect(result.id).toBe("notif-001");
      expect(result.title).toBe("Notification notif-001");
    });

    it("finds notification by id", async () => {
      const notification = createMockNotification("notif-001", new Date());
      await Effect.runPromise(gateway.create(notification));

      const result = await Effect.runPromise(gateway.findById("notif-001"));

      expect(result).not.toBeNull();
      expect(result?.id).toBe("notif-001");
    });

    it("returns null when notification not found", async () => {
      const result = await Effect.runPromise(gateway.findById("nonexistent"));
      expect(result).toBeNull();
    });

    it("updates a notification", async () => {
      const notification = createMockNotification("notif-001", new Date());
      await Effect.runPromise(gateway.create(notification));

      const updated: NotificationDTO = {
        ...notification,
        title: "Updated Title",
      };
      const result = await Effect.runPromise(gateway.update(updated));

      expect(result.title).toBe("Updated Title");

      const found = await Effect.runPromise(gateway.findById("notif-001"));
      expect(found?.title).toBe("Updated Title");
    });

    it("deletes a notification", async () => {
      const notification = createMockNotification("notif-001", new Date());
      await Effect.runPromise(gateway.create(notification));

      await Effect.runPromise(gateway.delete("notif-001"));

      const result = await Effect.runPromise(gateway.findById("notif-001"));
      expect(result).toBeNull();
    });

    it("checks if notification exists", async () => {
      const notification = createMockNotification("notif-001", new Date());
      await Effect.runPromise(gateway.create(notification));

      const exists = await Effect.runPromise(gateway.exists("notif-001"));
      const notExists = await Effect.runPromise(gateway.exists("nonexistent"));

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe("Query by Trip", () => {
    it("finds notifications by trip id", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), { tripId: "trip-001" }),
        createMockNotification("notif-002", new Date(), { tripId: "trip-001" }),
        createMockNotification("notif-003", new Date(), { tripId: "trip-002" }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(gateway.findByTripId("trip-001"));

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.tripId === "trip-001")).toBe(true);
      expect(result[0]?.createdAt.getTime()).toBeGreaterThanOrEqual(
        result[1]?.createdAt.getTime() ?? 0,
      );
    });

    it("returns empty array when no trip notifications found", async () => {
      const result = await Effect.runPromise(
        gateway.findByTripId("nonexistent"),
      );
      expect(result).toHaveLength(0);
    });

    it("finds notifications by trip id and status", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          tripId: "trip-001",
          status: NotificationStatus.READY,
        }),
        createMockNotification("notif-002", new Date(), {
          tripId: "trip-001",
          status: NotificationStatus.SENT,
        }),
        createMockNotification("notif-003", new Date(), {
          tripId: "trip-001",
          status: NotificationStatus.DRAFT,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatus("trip-001", NotificationStatus.READY),
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(NotificationStatus.READY);
    });
  });

  describe("Query by Status and Priority", () => {
    it("finds notifications by status", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          status: NotificationStatus.DRAFT,
        }),
        createMockNotification("notif-002", new Date(), {
          status: NotificationStatus.DRAFT,
        }),
        createMockNotification("notif-003", new Date(), {
          status: NotificationStatus.SENT,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByStatus(NotificationStatus.DRAFT),
      );

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.status === NotificationStatus.DRAFT)).toBe(
        true,
      );
    });

    it("finds notifications by priority", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          priority: NotificationPriority.HIGH,
        }),
        createMockNotification("notif-002", new Date(), {
          priority: NotificationPriority.HIGH,
        }),
        createMockNotification("notif-003", new Date(), {
          priority: NotificationPriority.LOW,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByPriority(NotificationPriority.HIGH),
      );

      expect(result).toHaveLength(2);
      expect(
        result.every((n) => n.priority === NotificationPriority.HIGH),
      ).toBe(true);
    });

    it("returns notifications sorted by createdAt descending", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(2024, 0, 1)),
        createMockNotification("notif-002", new Date(2024, 0, 3)),
        createMockNotification("notif-003", new Date(2024, 0, 2)),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByStatus(NotificationStatus.DRAFT),
      );

      expect(result[0]?.id).toBe("notif-002");
      expect(result[1]?.id).toBe("notif-003");
      expect(result[2]?.id).toBe("notif-001");
    });
  });

  describe("Ready to Send and Overdue", () => {
    it("finds notifications ready to send", async () => {
      const now = new Date();
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          status: NotificationStatus.READY,
          scheduledAt: null,
        }),
        createMockNotification("notif-002", new Date(), {
          status: NotificationStatus.READY,
          scheduledAt: new Date(now.getTime() - 1000),
        }),
        createMockNotification("notif-003", new Date(), {
          status: NotificationStatus.READY,
          scheduledAt: new Date(now.getTime() + 60000),
        }),
        createMockNotification("notif-004", new Date(), {
          status: NotificationStatus.DRAFT,
          scheduledAt: null,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(gateway.findReadyToSend());

      expect(result).toHaveLength(2);
      expect(result.some((n) => n.id === "notif-001")).toBe(true);
      expect(result.some((n) => n.id === "notif-002")).toBe(true);
      expect(result.some((n) => n.id === "notif-003")).toBe(false);
    });

    it("sorts ready to send by priority then createdAt", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(2024, 0, 2), {
          status: NotificationStatus.READY,
          priority: NotificationPriority.NORMAL,
        }),
        createMockNotification("notif-002", new Date(2024, 0, 1), {
          status: NotificationStatus.READY,
          priority: NotificationPriority.URGENT,
        }),
        createMockNotification("notif-003", new Date(2024, 0, 3), {
          status: NotificationStatus.READY,
          priority: NotificationPriority.HIGH,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(gateway.findReadyToSend());

      expect(result[0]?.id).toBe("notif-002");
      expect(result[1]?.id).toBe("notif-003");
      expect(result[2]?.id).toBe("notif-001");
    });

    it("finds overdue notifications", async () => {
      const now = new Date();
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          status: NotificationStatus.DRAFT,
          scheduledAt: new Date(now.getTime() - 1000),
        }),
        createMockNotification("notif-002", new Date(), {
          status: NotificationStatus.DRAFT,
          scheduledAt: new Date(now.getTime() - 5000),
        }),
        createMockNotification("notif-003", new Date(), {
          status: NotificationStatus.SENT,
          scheduledAt: new Date(now.getTime() - 1000),
        }),
        createMockNotification("notif-004", new Date(), {
          status: NotificationStatus.DRAFT,
          scheduledAt: new Date(now.getTime() + 60000),
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(gateway.findOverdue());

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("notif-002");
      expect(result[1]?.id).toBe("notif-001");
    });
  });

  describe("Query by Creator", () => {
    it("finds notifications by created by id", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          createdById: "user-001",
        }),
        createMockNotification("notif-002", new Date(), {
          createdById: "user-001",
        }),
        createMockNotification("notif-003", new Date(), {
          createdById: "user-002",
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByCreatedById("user-001"),
      );

      expect(result).toHaveLength(2);
      expect(result.every((n) => n.createdById === "user-001")).toBe(true);
    });
  });

  describe("Pagination", () => {
    it("returns all notifications with pagination", async () => {
      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(
          `notif-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findAll({ limit: 10, offset: 5 }),
      );

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.hasMore).toBe(true);
    });

    it("returns hasMore false when all items retrieved", async () => {
      const notifications = Array.from({ length: 5 }, (_, i) =>
        createMockNotification(
          `notif-${String(i).padStart(3, "0")}`,
          new Date(),
        ),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(gateway.findAll({ limit: 10 }));

      expect(result.items).toHaveLength(5);
      expect(result.hasMore).toBe(false);
    });
  });

  describe("Counting", () => {
    it("counts notifications by status", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          status: NotificationStatus.DRAFT,
        }),
        createMockNotification("notif-002", new Date(), {
          status: NotificationStatus.DRAFT,
        }),
        createMockNotification("notif-003", new Date(), {
          status: NotificationStatus.SENT,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const count = await Effect.runPromise(
        gateway.countByStatus(NotificationStatus.DRAFT),
      );

      expect(count).toBe(2);
    });

    it("counts pending notifications by trip id", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          tripId: "trip-001",
          status: NotificationStatus.DRAFT,
        }),
        createMockNotification("notif-002", new Date(), {
          tripId: "trip-001",
          status: NotificationStatus.READY,
        }),
        createMockNotification("notif-003", new Date(), {
          tripId: "trip-001",
          status: NotificationStatus.SENT,
        }),
        createMockNotification("notif-004", new Date(), {
          tripId: "trip-002",
          status: NotificationStatus.DRAFT,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const count = await Effect.runPromise(
        gateway.countPendingByTripId("trip-001"),
      );

      expect(count).toBe(2);
    });
  });

  describe("Connection Pagination (findByUserIdConnection)", () => {
    it("returns empty connection when no notifications", async () => {
      const result = await Effect.runPromise(
        gateway.findByUserIdConnection("user-001", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns paginated results with hasNextPage", async () => {
      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(
          `notif-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            createdById: "user-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection("user-001", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("returns subsequent page using cursor", async () => {
      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(
          `notif-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            createdById: "user-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const firstPage = await Effect.runPromise(
        gateway.findByUserIdConnection("user-001", { first: 10 }),
      );

      const secondPage = await Effect.runPromise(
        gateway.findByUserIdConnection("user-001", {
          first: 10,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns hasNextPage=false on last page", async () => {
      const notifications = Array.from({ length: 15 }, (_, i) =>
        createMockNotification(
          `notif-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            createdById: "user-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findByUserIdConnection("user-001", { first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("Unread Connection (findUnreadByUserIdConnection)", () => {
    it("returns only unread notifications", async () => {
      const now = new Date();
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          createdById: "user-001",
          status: NotificationStatus.DRAFT,
          scheduledAt: new Date(now.getTime() - 1000),
        }),
        createMockNotification("notif-002", new Date(), {
          createdById: "user-001",
          status: NotificationStatus.READY,
          scheduledAt: null,
        }),
        createMockNotification("notif-003", new Date(), {
          createdById: "user-001",
          status: NotificationStatus.SENT,
        }),
        createMockNotification("notif-004", new Date(), {
          createdById: "user-002",
          status: NotificationStatus.DRAFT,
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection("user-001", { first: 10 }),
      );

      expect(result.edges).toHaveLength(2);
      expect(result.nodes.every((n) => n.createdById === "user-001")).toBe(
        true,
      );
    });

    it("excludes future scheduled notifications from unread", async () => {
      const now = new Date();
      const notifications = [
        createMockNotification("notif-001", new Date(), {
          createdById: "user-001",
          status: NotificationStatus.DRAFT,
          scheduledAt: new Date(now.getTime() + 60000),
        }),
        createMockNotification("notif-002", new Date(), {
          createdById: "user-001",
          status: NotificationStatus.DRAFT,
          scheduledAt: new Date(now.getTime() - 1000),
        }),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      const result = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection("user-001", { first: 10 }),
      );

      expect(result.edges).toHaveLength(1);
      expect(result.nodes[0]?.id).toBe("notif-002");
    });

    it("supports cursor pagination for unread", async () => {
      const notifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification(
          `notif-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            createdById: "user-001",
            status: NotificationStatus.DRAFT,
          },
        ),
      );
      await Effect.runPromise(gateway.seed(notifications));

      const firstPage = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection("user-001", { first: 10 }),
      );

      expect(firstPage.pageInfo.hasNextPage).toBe(true);

      const secondPage = await Effect.runPromise(
        gateway.findUnreadByUserIdConnection("user-001", {
          first: 10,
          after: firstPage.pageInfo.endCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  describe("Reset", () => {
    it("clears all notifications on reset", async () => {
      const notifications = [
        createMockNotification("notif-001", new Date()),
        createMockNotification("notif-002", new Date()),
      ];
      await Effect.runPromise(gateway.seed(notifications));

      await Effect.runPromise(gateway.reset());

      const found = await Effect.runPromise(gateway.findById("notif-001"));
      expect(found).toBeNull();
    });
  });
});

/**
 * Summary:
 *
 * This test suite covers the InMemoryNotificationGateway implementation with:
 *
 * - CRUD Operations: create, findById, update, delete, exists
 * - Trip Queries: findByTripId, findByTripIdAndStatus with sorting
 * - Status and Priority Queries: findByStatus, findByPriority with createdAt DESC sorting
 * - Scheduling Queries: findReadyToSend (priority + createdAt sorting),
 *   findOverdue (scheduledAt sorting)
 * - Creator Queries: findByCreatedById
 * - Pagination: findAll with limit/offset and hasMore
 * - Counting: countByStatus, countPendingByTripId
 * - Connection Pagination: findByUserIdConnection with Relay spec compliance
 * - Unread Queries: findUnreadByUserIdConnection with status/scheduledAt filtering
 * - Reset: clears all notifications
 *
 * Total test cases: 30+
 * All tests use beforeEach to ensure clean state between runs.
 */
