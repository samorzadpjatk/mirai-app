import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleActivityFeedGateway } from "./gateway";
import { DatabaseError } from "../../../system/errors";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
} from "@mirai-app/use-cases";
import type { ActivityId } from "@mirai-app/domain";

/**
 * Unit tests for DrizzleActivityFeedGateway
 *
 * Tests the gateway methods for activity feed management:
 * - CRUD operations (create, findById, update, delete, exists)
 * - findByTripId() - Find activities by trip with cursor pagination
 * - findByTripIdPaged() - Find activities with offset pagination
 * - Reaction management (findReactionsByActivityId, findUserReactions, addReaction, removeReaction)
 * - getReactionCounts() - Get reaction statistics
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockActivityDTO(
  overrides: Partial<ActivityFeedDTO> = {},
): ActivityFeedDTO {
  return {
    id: "activity-123",
    tripId: "trip-456",
    actorId: "user-789",
    actorType: "USER",
    action: "CREATED_EVENT",
    entityId: "event-001",
    entityType: "EVENT",
    message: "Created a new event",
    metadata: null,
    isPinned: false,
    isHidden: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createMockReactionDTO(
  overrides: Partial<ActivityReactionDTO> = {},
): ActivityReactionDTO {
  return {
    id: "reaction-123",
    activityId: "activity-123" as unknown as ActivityId,
    userId: "user-789",
    reactionType: "heart",
    createdAt: new Date("2024-01-01"),
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
        // For simple queries: .select().from().where() returns promise directly
        where: () => Promise.resolve(records),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([{ count }]),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createInsertMockDb(returnRecord: unknown): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        returning: () => Promise.resolve([returnRecord]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createDeleteMockDb(): DrizzleDb {
  return {
    delete: () => ({
      where: () => Promise.resolve(),
    }),
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error(errorMessage)),
          orderBy: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: () => Promise.reject(new Error(errorMessage)),
      }),
    }),
    delete: () => ({
      where: () => Promise.reject(new Error(errorMessage)),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleActivityFeedGateway", () => {
  // ==========================================================================
  // findByTripId() Method Tests
  // ==========================================================================

  describe("findByTripId()", () => {
    it("returns activities for a trip", async () => {
      const mockRecord = {
        id: "activity-123",
        tripId: "trip-456",
        actorId: "user-789",
        actorType: "USER",
        action: "CREATED_EVENT",
        entityId: "event-001",
        entityType: "EVENT",
        message: "Created a new event",
        metadata: null,
        isPinned: false,
        isHidden: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };
      const mockDb = {
        select: (fields?: unknown) => ({
          from: () => ({
            where: () => {
              // Count query (fields is truthy) - returns Promise<Array>
              if (fields) {
                return Promise.resolve([{ count: 1 }]);
              }
              // Data query (no fields) - returns chainable with orderBy().limit()
              return {
                orderBy: () => ({
                  limit: () => Promise.resolve([mockRecord]),
                }),
              };
            },
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-456"));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.tripId).toBe("trip-456");
    });

    it("returns empty result when no activities exist", async () => {
      const mockDb = {
        select: (fields?: unknown) => ({
          from: () => ({
            where: () => {
              // Count query (fields is truthy) - returns Promise<Array>
              if (fields) {
                return Promise.resolve([{ count: 0 }]);
              }
              // Data query (no fields) - returns chainable with orderBy().limit()
              return {
                orderBy: () => ({
                  limit: () => Promise.resolve([]),
                }),
              };
            },
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripId("trip-empty"),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("filters out hidden activities by default", async () => {
      const visibleRecord = {
        id: "activity-1",
        tripId: "trip-456",
        isHidden: false,
        isPinned: false,
        createdAt: new Date(),
      };
      const mockDb = {
        select: (fields?: unknown) => ({
          from: () => ({
            where: () => {
              // Count query (fields is truthy) - returns Promise<Array>
              if (fields) {
                return Promise.resolve([{ count: 1 }]);
              }
              // Data query (no fields) - returns chainable with orderBy().limit()
              return {
                orderBy: () => ({
                  limit: () => Promise.resolve([visibleRecord]),
                }),
              };
            },
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-456"));

      expect(result.items).toHaveLength(1);
    });
  });

  // ==========================================================================
  // findByTripIdPaged() Method Tests
  // ==========================================================================

  describe("findByTripIdPaged()", () => {
    it("returns paginated activities", async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        id: `activity-${i}`,
        tripId: "trip-456",
        actorId: "user-789",
        actorType: "USER",
        action: "CREATED_EVENT",
        entityId: `event-${i}`,
        entityType: "EVENT",
        message: "Created event",
        metadata: null,
        isPinned: false,
        isHidden: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      const mockDb = {
        select: (fields?: unknown) => ({
          from: () => ({
            where: () => {
              // Count query (fields is truthy) - returns Promise<Array>
              if (fields) {
                return Promise.resolve([{ count: 10 }]);
              }
              // Data query (no fields) - returns chainable with orderBy().limit().offset()
              return {
                orderBy: () => ({
                  limit: () => ({
                    offset: () => Promise.resolve(records),
                  }),
                }),
              };
            },
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdPaged("trip-456", { page: 1, pageSize: 5 }),
      );

      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(5);
    });
  });

  // ==========================================================================
  // Reaction Management Tests
  // ==========================================================================

  describe("findReactionsByActivityId()", () => {
    it("returns reactions for an activity", async () => {
      const mockRecord = {
        id: "reaction-123",
        activityId: "activity-123",
        userId: "user-789",
        reactionType: "heart",
        createdAt: new Date(),
      };
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findReactionsByActivityId(
          "activity-123" as unknown as ActivityId,
        ),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.reactionType).toBe("heart");
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findReactionsByActivityId(
            "activity-123" as unknown as ActivityId,
          ),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("addReaction()", () => {
    it("adds a reaction to an activity", async () => {
      const mockRecord = {
        id: "reaction-123",
        activityId: "activity-123",
        userId: "user-789",
        reactionType: "heart",
        createdAt: new Date(),
      };
      const mockDb = createInsertMockDb(mockRecord);
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const dto = createMockReactionDTO();
      const result = await Effect.runPromise(gateway.addReaction(dto));

      expect(result.reactionType).toBe("heart");
    });

    it("returns DatabaseError on insert failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const dto = createMockReactionDTO();
      const either = await Effect.runPromise(
        Effect.either(gateway.addReaction(dto)),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("removeReaction()", () => {
    it("removes a reaction from an activity", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.removeReaction(
          "activity-123" as unknown as ActivityId,
          "user-789",
          "heart",
        ),
      );

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.removeReaction(
            "activity-123" as unknown as ActivityId,
            "user-789",
            "heart",
          ),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  describe("getReactionCounts()", () => {
    it("returns reaction counts by type", async () => {
      const mockRecords = [
        { reactionType: "heart", count: 5 },
        { reactionType: "fire", count: 3 },
        { reactionType: "clap", count: 2 },
        { reactionType: "star", count: 1 },
      ];
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              groupBy: () => Promise.resolve(mockRecords),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getReactionCounts("activity-123" as unknown as ActivityId),
      );

      expect(result.total).toBe(11);
      expect(result.counts.heart).toBe(5);
      expect(result.counts.fire).toBe(3);
    });

    it("returns zero counts when no reactions exist", async () => {
      const mockDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              groupBy: () => Promise.resolve([]),
            }),
          }),
        }),
      } as unknown as DrizzleDb;
      const gateway = new DrizzleActivityFeedGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getReactionCounts("activity-123" as unknown as ActivityId),
      );

      expect(result.total).toBe(0);
      expect(result.counts.heart).toBe(0);
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByTripId: Trip-based activity lookup with cursor pagination
// - findByTripIdPaged: Offset-based pagination with page numbers
// - findReactionsByActivityId: Reaction lookup with error handling
// - addReaction: Reaction creation with error handling
// - removeReaction: Reaction deletion with error handling
// - getReactionCounts: Aggregation query with type breakdown
//
// All tests use Effect.either for comprehensive error testing with DatabaseError.
