import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  TripAccessChecker,
  type GroupLeaderCheckResult,
} from "./access-checker";
import { UseCaseError } from "../../system/errors";

/**
 * Creates a mock DrizzleDb for isStaff queries
 */
function createMockDrizzleDbForIsStaff(
  role: string | null,
  shouldFail = false,
): DrizzleDb {
  return {
    select: (_fields: Record<string, unknown>) => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => ({
          limit: (_n: number) => {
            if (shouldFail) {
              throw new Error("Database error");
            }
            return Promise.resolve(role ? [{ role }] : []);
          },
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Creates a mock DrizzleDb for isGroupLeader queries
 */
function createMockDrizzleDbForGroupLeader(
  participant: {
    userId: string;
    tripId: string;
    groupId: string | null;
  } | null,
  group: {
    id: string;
    name: string;
    coins: number;
    organizerId: string;
  } | null,
  shouldFail = false,
): DrizzleDb {
  let queryCount = 0;

  return {
    select: (_fields: Record<string, unknown>) => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => ({
          limit: (_n: number) => {
            if (shouldFail) {
              throw new Error("Database error");
            }

            queryCount++;

            // First query: tripParticipants
            if (queryCount === 1) {
              return Promise.resolve(
                participant && participant.groupId
                  ? [{ groupId: participant.groupId }]
                  : [],
              );
            }

            // Second query: groups
            if (queryCount === 2) {
              return Promise.resolve(
                group
                  ? [
                      {
                        id: group.id,
                        name: group.name,
                        coins: group.coins,
                        organizerId: group.organizerId,
                      },
                    ]
                  : [],
              );
            }

            return Promise.resolve([]);
          },
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

/**
 * Creates a mock DrizzleDb for hasTripEnded queries
 */
function createMockDrizzleDbForHasTripEnded(
  endDate: Date | null,
  shouldFail = false,
): DrizzleDb {
  return {
    select: (_fields: Record<string, unknown>) => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => ({
          limit: (_n: number) => {
            if (shouldFail) {
              throw new Error("Database error");
            }
            return Promise.resolve(endDate !== undefined ? [{ endDate }] : []);
          },
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

describe("[UNIT] TripAccessChecker", () => {
  describe("isStaff", () => {
    it("should return true for ADMIN user", async () => {
      const mockDb = createMockDrizzleDbForIsStaff("ADMIN");
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(checker.isStaff("admin-123"));
      expect(result).toBe(true);
    });

    it("should return true for MODERATOR user", async () => {
      const mockDb = createMockDrizzleDbForIsStaff("MODERATOR");
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(checker.isStaff("mod-123"));
      expect(result).toBe(true);
    });

    it("should return false for regular USER", async () => {
      const mockDb = createMockDrizzleDbForIsStaff("USER");
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(checker.isStaff("user-123"));
      expect(result).toBe(false);
    });

    it("should return false when user not found", async () => {
      const mockDb = createMockDrizzleDbForIsStaff(null);
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(
        checker.isStaff("non-existent-user"),
      );
      expect(result).toBe(false);
    });

    it("should fail with UseCaseError on database error", async () => {
      const mockDb = createMockDrizzleDbForIsStaff("USER", true);
      const checker = new TripAccessChecker(mockDb);

      const either = await Effect.runPromise(
        Effect.either(checker.isStaff("user-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(UseCaseError);
        if (either.left instanceof UseCaseError) {
          expect(either.left.operation).toBe("isStaff");
        }
      }
    });
  });

  describe("isGroupLeader", () => {
    it("should return isLeader true when user is group organizer", async () => {
      const mockDb = createMockDrizzleDbForGroupLeader(
        { userId: "leader-123", tripId: "trip-456", groupId: "group-789" },
        {
          id: "group-789",
          name: "Test Group",
          coins: 100,
          organizerId: "leader-123",
        },
      );
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(
        checker.isGroupLeader("leader-123", "trip-456"),
      );

      expect(result.isLeader).toBe(true);
      expect(result.groupId).toBe("group-789");
      expect(result.groupName).toBe("Test Group");
      expect(result.coins).toBe(100);
    });

    it("should return isLeader false when user is not group organizer", async () => {
      const mockDb = createMockDrizzleDbForGroupLeader(
        { userId: "member-123", tripId: "trip-456", groupId: "group-789" },
        {
          id: "group-789",
          name: "Test Group",
          coins: 100,
          organizerId: "leader-123",
        },
      );
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(
        checker.isGroupLeader("member-123", "trip-456"),
      );

      expect(result.isLeader).toBe(false);
      expect(result.groupId).toBe("group-789");
    });

    it("should return isLeader false when user is not a participant", async () => {
      const mockDb = createMockDrizzleDbForGroupLeader(null, null);
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(
        checker.isGroupLeader("user-123", "trip-456"),
      );

      expect(result.isLeader).toBe(false);
      expect(result.groupId).toBeUndefined();
    });

    it("should return isLeader false when group not found", async () => {
      const mockDb = createMockDrizzleDbForGroupLeader(
        { userId: "user-123", tripId: "trip-456", groupId: "group-789" },
        null,
      );
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(
        checker.isGroupLeader("user-123", "trip-456"),
      );

      expect(result.isLeader).toBe(false);
    });

    it("should fail with UseCaseError on database error", async () => {
      const mockDb = createMockDrizzleDbForGroupLeader(null, null, true);
      const checker = new TripAccessChecker(mockDb);

      const either = await Effect.runPromise(
        Effect.either(checker.isGroupLeader("user-123", "trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(UseCaseError);
        if (either.left instanceof UseCaseError) {
          expect(either.left.operation).toBe("isGroupLeader");
        }
      }
    });
  });

  describe("hasTripEnded", () => {
    it("should return true when trip end date is in the past", async () => {
      const pastDate = new Date("2024-01-01");
      const mockDb = createMockDrizzleDbForHasTripEnded(pastDate);
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(checker.hasTripEnded("trip-123"));
      expect(result).toBe(true);
    });

    it("should return false when trip end date is in the future", async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const mockDb = createMockDrizzleDbForHasTripEnded(futureDate);
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(checker.hasTripEnded("trip-123"));
      expect(result).toBe(false);
    });

    it("should return false when trip has no end date", async () => {
      const mockDb = createMockDrizzleDbForHasTripEnded(null);
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(checker.hasTripEnded("trip-123"));
      expect(result).toBe(false);
    });

    it("should return false when trip not found", async () => {
      const mockDb = createMockDrizzleDbForHasTripEnded(
        undefined as unknown as null,
      );
      const checker = new TripAccessChecker(mockDb);

      const result = await Effect.runPromise(
        checker.hasTripEnded("non-existent"),
      );
      expect(result).toBe(false);
    });

    it("should fail with UseCaseError on database error", async () => {
      const mockDb = createMockDrizzleDbForHasTripEnded(null, true);
      const checker = new TripAccessChecker(mockDb);

      const either = await Effect.runPromise(
        Effect.either(checker.hasTripEnded("trip-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(UseCaseError);
        if (either.left instanceof UseCaseError) {
          expect(either.left.operation).toBe("hasTripEnded");
        }
      }
    });
  });
});
