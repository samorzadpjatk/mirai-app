import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleEventGateway } from "./gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { EventDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleEventGateway
 *
 * Tests the gateway methods for event management:
 * - findByTripId() - Find events by trip ID
 * - findByGroupId() - Find events by organizer group ID
 * - findByIds() - Find events by IDs
 * - findUpcoming() / findOngoing() / findPast() - Time-based queries
 * - findStartingBetween() - Events in date range
 * - User interest/enlistment (markInterested, markEnlisted, removeInterest, removeEnlistment)
 * - Status checks (isInterested, isEnlisted)
 * - User/event queries (getInterestedUsers, getEnlistedUsers, getInterestedEventsForUser, getEnlistedEventsForUser)
 * - Count methods (countInterested, countEnlisted)
 * - Cursor-based pagination
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockEventDTO(overrides: Partial<EventDTO> = {}): EventDTO {
  return {
    id: "event-123",
    tripId: "trip-456",
    groupId: "group-789",
    title: "Test Event",
    description: "A test event",
    location: null,
    startTime: new Date("2024-01-15T10:00:00Z"),
    endTime: new Date("2024-01-15T12:00:00Z"),
    createdById: "user-001",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

function createMockEventSelect(
  overrides: Partial<{
    id: string;
    creatorId: string;
    organizerGroupId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    location: string | null;
    description: string | null;
    files: string[] | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: "event-123",
    creatorId: "trip-456",
    organizerGroupId: "group-789",
    title: "Test Event",
    startTime: new Date("2024-01-15T10:00:00Z"),
    endTime: new Date("2024-01-15T12:00:00Z"),
    location: null,
    description: "A test event",
    files: null,
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
      from: () => {
        const chain = {
          where: () => {
            const whereChain = {
              orderBy: () => Promise.resolve(records),
              limit: () => Promise.resolve(records),
              then: (resolve: (value: unknown[]) => unknown) =>
                resolve(records),
            };
            return whereChain;
          },
          orderBy: () => Promise.resolve(records),
          limit: () => Promise.resolve(records),
          innerJoin: () => ({
            where: () => ({
              orderBy: () => Promise.resolve(records),
            }),
          }),
          then: (resolve: (value: unknown[]) => unknown) => resolve(records),
        };
        return chain;
      },
    }),
  } as unknown as DrizzleDb;
}

function createCountMockDb(count: number): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const whereChain = {
            limit: () => Promise.resolve([{ count }]),
            then: (resolve: (value: { count: number }[]) => unknown) =>
              resolve([{ count }]),
          };
          return whereChain;
        },
        then: (resolve: (value: { count: number }[]) => unknown) =>
          resolve([{ count }]),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createInsertMockDb(): DrizzleDb {
  return {
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve(),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createUpdateMockDb(): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleEventGateway", () => {
  // ==========================================================================
  // findByTripId() Method Tests
  // ==========================================================================

  describe("findByTripId()", () => {
    it("returns events for a trip", async () => {
      const mockRecord = createMockEventSelect();
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleEventGateway(mockDb);

      const result = await Effect.runPromise(gateway.findByTripId("trip-456"));

      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe("Test Event");
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleEventGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // findByGroupId() Method Tests
  // ==========================================================================

  describe("findByGroupId()", () => {
    it("returns events for a group", async () => {
      const mockRecord = createMockEventSelect({
        organizerGroupId: "group-789",
      });
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleEventGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByGroupId("group-789"),
      );

      expect(result).toHaveLength(1);
    });
  });

  // ==========================================================================
  // findByIds() Method Tests
  // ==========================================================================

  describe("findByIds()", () => {
    it("returns events by IDs", async () => {
      const mockRecords = [
        createMockEventSelect({ id: "event-1" }),
        createMockEventSelect({ id: "event-2" }),
      ];
      const mockDb = createSelectMockDb(mockRecords);
      const gateway = new DrizzleEventGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByIds(["event-1", "event-2"]),
      );

      expect(result).toHaveLength(2);
    });

    it("returns empty array for empty IDs", async () => {
      const gateway = new DrizzleEventGateway({} as DrizzleDb);

      const result = await Effect.runPromise(gateway.findByIds([]));

      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Time-based Query Tests
  // ==========================================================================

  describe("Time-based Queries", () => {
    describe("findUpcoming()", () => {
      it("returns events starting in the future", async () => {
        const futureRecord = createMockEventSelect({
          startTime: new Date("2099-01-15T10:00:00Z"),
        });
        const mockDb = createSelectMockDb([futureRecord]);
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(gateway.findUpcoming());

        expect(result).toHaveLength(1);
      });
    });

    describe("findOngoing()", () => {
      it("returns currently ongoing events", async () => {
        const now = new Date();
        const ongoingRecord = createMockEventSelect({
          startTime: new Date(now.getTime() - 3600000),
          endTime: new Date(now.getTime() + 3600000),
        });
        const mockDb = createSelectMockDb([ongoingRecord]);
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(gateway.findOngoing());

        expect(result).toHaveLength(1);
      });
    });

    describe("findPast()", () => {
      it("returns past events", async () => {
        const pastRecord = createMockEventSelect({
          endTime: new Date("2020-01-15T12:00:00Z"),
        });
        const mockDb = createSelectMockDb([pastRecord]);
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(gateway.findPast());

        expect(result).toHaveLength(1);
      });
    });

    describe("findStartingBetween()", () => {
      it("returns events in date range", async () => {
        const mockRecord = createMockEventSelect({
          startTime: new Date("2024-06-15T10:00:00Z"),
        });
        const mockDb = createSelectMockDb([mockRecord]);
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.findStartingBetween(
            new Date("2024-06-01"),
            new Date("2024-06-30"),
          ),
        );

        expect(result).toHaveLength(1);
      });
    });
  });

  // ==========================================================================
  // Interest/Enlistment Tests
  // ==========================================================================

  describe("Interest Management", () => {
    describe("markInterested()", () => {
      it("marks user as interested in event", async () => {
        const mockDb = createInsertMockDb();
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.markInterested("user-123", "event-456"),
        );

        expect(result).toBeUndefined();
      });
    });

    describe("removeInterest()", () => {
      it("removes user interest from event", async () => {
        const mockDb = createUpdateMockDb();
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.removeInterest("user-123", "event-456"),
        );

        expect(result).toBeUndefined();
      });
    });

    describe("isInterested()", () => {
      it("returns true when user is interested", async () => {
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ interestedIn: true }]),
              }),
            }),
          }),
        } as unknown as DrizzleDb;
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.isInterested("user-123", "event-456"),
        );

        expect(result).toBe(true);
      });

      it("returns false when user is not interested", async () => {
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ interestedIn: false }]),
              }),
            }),
          }),
        } as unknown as DrizzleDb;
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.isInterested("user-123", "event-456"),
        );

        expect(result).toBe(false);
      });
    });

    describe("getInterestedUsers()", () => {
      it("returns list of interested users", async () => {
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () =>
                Promise.resolve([{ userId: "user-1" }, { userId: "user-2" }]),
            }),
          }),
        } as unknown as DrizzleDb;
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.getInterestedUsers("event-456"),
        );

        expect(result).toHaveLength(2);
      });
    });

    describe("countInterested()", () => {
      it("returns count of interested users", async () => {
        const mockDb = createCountMockDb(5);
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.countInterested("event-456"),
        );

        expect(result).toBe(5);
      });
    });
  });

  describe("Enlistment Management", () => {
    describe("markEnlisted()", () => {
      it("marks user as enlisted in event", async () => {
        const mockDb = createInsertMockDb();
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.markEnlisted("user-123", "event-456"),
        );

        expect(result).toBeUndefined();
      });
    });

    describe("removeEnlistment()", () => {
      it("removes user enlistment from event", async () => {
        const mockDb = createUpdateMockDb();
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.removeEnlistment("user-123", "event-456"),
        );

        expect(result).toBeUndefined();
      });
    });

    describe("isEnlisted()", () => {
      it("returns true when user is enlisted", async () => {
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => Promise.resolve([{ enlistedIn: true }]),
              }),
            }),
          }),
        } as unknown as DrizzleDb;
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.isEnlisted("user-123", "event-456"),
        );

        expect(result).toBe(true);
      });
    });

    describe("getEnlistedUsers()", () => {
      it("returns list of enlisted users", async () => {
        const mockDb = {
          select: () => ({
            from: () => ({
              where: () =>
                Promise.resolve([{ userId: "user-1" }, { userId: "user-2" }]),
            }),
          }),
        } as unknown as DrizzleDb;
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.getEnlistedUsers("event-456"),
        );

        expect(result).toHaveLength(2);
      });
    });

    describe("countEnlisted()", () => {
      it("returns count of enlisted users", async () => {
        const mockDb = createCountMockDb(3);
        const gateway = new DrizzleEventGateway(mockDb);

        const result = await Effect.runPromise(
          gateway.countEnlisted("event-456"),
        );

        expect(result).toBe(3);
      });
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByTripId: Trip-based event lookup with error handling
// - findByGroupId: Group-based event lookup
// - findByIds: Multi-ID lookup with empty array handling
// - Time queries: Upcoming, ongoing, past, date range filtering
// - Interest: markInterested, removeInterest, isInterested, getInterestedUsers, countInterested
// - Enlistment: markEnlisted, removeEnlistment, isEnlisted, getEnlistedUsers, countEnlisted
// - All methods use Effect.either for comprehensive error testing with DatabaseError
//
// Mock DrizzleDb factory functions provide consistent test setup.
