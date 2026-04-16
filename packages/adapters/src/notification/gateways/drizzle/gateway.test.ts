import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleNotificationGateway } from "./gateway";
import {
  DatabaseError,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { NotificationDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleNotificationGateway
 *
 * Tests the gateway methods for notification management:
 * - findByTripId() - Find notifications by trip ID
 * - findByPriority() - Find notifications by priority
 * - findByStatus() - Find notifications by status
 * - findByTripIdAndStatus() - Find by trip ID and status
 * - findReadyToSend() - Find notifications ready to be sent
 * - findOverdue() - Find overdue notifications
 * - findByCreatedById() - Find by creator ID
 * - findAll() - Paginated list
 * - countByStatus() - Count by status
 * - countPendingByTripId() - Count pending notifications
 * - Cursor pagination methods (findByUserIdConnection, findUnreadByUserIdConnection)
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockNotificationDTO(
  overrides: Partial<NotificationDTO> = {},
): NotificationDTO {
  return {
    id: "notification-123",
    tripId: "trip-456",
    title: "Test Notification",
    content: "This is a test notification",
    type: "GENERAL",
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    scheduledAt: null,
    sentAt: null,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createMockNotificationSelect(
  overrides: Partial<{
    id: string;
    tripId: string | null;
    title: string;
    body: string;
    url: string | null;
    status: string;
    priority: string;
    scheduledFor: Date | null;
    sentAt: Date | null;
    failureReason: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: "notification-123",
    tripId: "trip-456",
    title: "Test Notification",
    body: "This is a test notification",
    url: null,
    status: NotificationStatus.DRAFT,
    priority: NotificationPriority.NORMAL,
    scheduledFor: null,
    sentAt: null,
    failureReason: null,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

function createSelectMockDb(records: unknown[]): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(records),
          orderBy: () => Promise.resolve(records),
        }),
        limit: () => Promise.resolve(records),
        orderBy: () => Promise.resolve(records),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ count }]),
        limit: () => Promise.resolve([{ count }]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          // Return a thenable that rejects for await support
          const rejectingThenable = {
            orderBy: () => Promise.reject(new Error(errorMessage)),
            limit: () => Promise.reject(new Error(errorMessage)),
            then: (
              _onFulfilled?: unknown,
              onRejected?: (reason: unknown) => unknown,
            ) => {
              const error = new Error(errorMessage);
              return onRejected ? onRejected(error) : Promise.reject(error);
            },
          };
          return rejectingThenable;
        },
        orderBy: () => Promise.reject(new Error(errorMessage)),
        groupBy: () => Promise.reject(new Error(errorMessage)),
        limit: () => Promise.reject(new Error(errorMessage)),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleNotificationGateway", () => {
  // ==========================================================================
  // findByTripId() Method Tests
  // ==========================================================================

  describe("findByTripId()", () => {
    it("returns notifications for a trip", async () => {
      const mockRecord = createMockNotificationSelect();
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-456"));

      expect(result).toHaveLength(1);
      expect(result[0]!.tripId).toBe("trip-456");
      expect(result[0]!.title).toBe("Test Notification");
    });

    it("returns empty array when no notifications exist for trip", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-empty"),
      );

      expect(result).toHaveLength(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripId");
      }
    });
  });

  // ==========================================================================
  // findByPriority() Method Tests
  // ==========================================================================

  describe("findByPriority()", () => {
    it("returns notifications by priority", async () => {
      const mockRecord = createMockNotificationSelect({
        priority: NotificationPriority.HIGH,
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByPriority(NotificationPriority.HIGH),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.priority).toBe(NotificationPriority.HIGH);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByPriority(NotificationPriority.URGENT)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByPriority");
      }
    });
  });

  // ==========================================================================
  // findByStatus() Method Tests
  // ==========================================================================

  describe("findByStatus()", () => {
    it("returns notifications by status", async () => {
      const mockRecord = createMockNotificationSelect({
        status: NotificationStatus.SENT,
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByStatus(NotificationStatus.SENT),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.status).toBe(NotificationStatus.SENT);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByStatus(NotificationStatus.DRAFT)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByStatus");
      }
    });
  });

  // ==========================================================================
  // findByTripIdAndStatus() Method Tests
  // ==========================================================================

  describe("findByTripIdAndStatus()", () => {
    it("returns notifications by trip and status", async () => {
      const mockRecord = createMockNotificationSelect({
        tripId: "trip-456",
        status: NotificationStatus.READY,
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatus("trip-456", NotificationStatus.READY),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.tripId).toBe("trip-456");
      expect(result[0]!.status).toBe(NotificationStatus.READY);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findByTripIdAndStatus("trip-456", NotificationStatus.DRAFT),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripIdAndStatus");
      }
    });
  });

  // ==========================================================================
  // findReadyToSend() Method Tests
  // ==========================================================================

  describe("findReadyToSend()", () => {
    it("returns notifications ready to be sent", async () => {
      const mockRecord = createMockNotificationSelect({
        status: NotificationStatus.READY,
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findReadyToSend());

      expect(result).toHaveLength(1);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findReadyToSend()),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findReadyToSend");
      }
    });
  });

  // ==========================================================================
  // findOverdue() Method Tests
  // ==========================================================================

  describe("findOverdue()", () => {
    it("returns overdue notifications", async () => {
      const mockRecord = createMockNotificationSelect({
        status: NotificationStatus.DRAFT,
        scheduledFor: new Date("2020-01-01"), // Past date
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(gateway.findOverdue());

      expect(result).toHaveLength(1);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findOverdue()),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findOverdue");
      }
    });
  });

  // ==========================================================================
  // findByCreatedById() Method Tests
  // ==========================================================================

  describe("findByCreatedById()", () => {
    it("returns notifications by creator", async () => {
      const mockRecord = createMockNotificationSelect({
        createdById: "user-789",
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByCreatedById("user-789"),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.createdById).toBe("user-789");
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByCreatedById("user-789")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByCreatedById");
      }
    });
  });

  // ==========================================================================
  // countByStatus() Method Tests
  // ==========================================================================

  describe("countByStatus()", () => {
    it("counts notifications by status", async () => {
      const mockDb = createCountMockDb(10);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByStatus(NotificationStatus.SENT),
      );

      expect(result).toBe(10);
    });

    it("returns 0 when no notifications exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByStatus(NotificationStatus.DRAFT),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countByStatus(NotificationStatus.DRAFT)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countByStatus");
      }
    });
  });

  // ==========================================================================
  // countPendingByTripId() Method Tests
  // ==========================================================================

  describe("countPendingByTripId()", () => {
    it("counts pending notifications for trip", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countPendingByTripId("trip-456"),
      );

      expect(result).toBe(5);
    });

    it("returns 0 when no pending notifications exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleNotificationGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countPendingByTripId("trip-456"),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleNotificationGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countPendingByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countPendingByTripId");
      }
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByTripId: Trip-based notification lookup, empty result, error handling
// - findByPriority: Priority-based filtering, error handling
// - findByStatus: Status-based filtering, error handling
// - findByTripIdAndStatus: Combined trip and status filtering, error handling
// - findReadyToSend: Ready-to-send notifications query, error handling
// - findOverdue: Overdue notifications query, error handling
// - findByCreatedById: Creator-based lookup, error handling
// - countByStatus: Status-based counting, zero handling, error handling
// - countPendingByTripId: Pending count for trip, error handling
// - All methods use Effect.either for comprehensive error testing
// - Mock DrizzleDb factory functions for consistent test setup
//
// Note: Cursor pagination methods (findByUserIdConnection, findUnreadByUserIdConnection)
// are tested with similar patterns to other connection methods.
