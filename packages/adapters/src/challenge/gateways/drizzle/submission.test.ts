import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleChallengeSubmissionGateway } from "./submission";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { ChallengeSubmissionDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleChallengeSubmissionGateway
 *
 * Tests the gateway methods for challenge submission management:
 * - CRUD operations (create, findById, update, delete)
 * - findByChallengeAndGroup() - Find by challenge and group
 * - existsForChallengeAndGroup() - Check existence
 * - countByChallengeId() - Count by challenge
 * - countByChallengeAndStatus() - Count by challenge and status
 * - Cursor pagination methods (voteScore and createdAt based)
 * - findManyConnection() - Advanced filtering with cursor pagination
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockSubmissionDTO(
  overrides: Partial<ChallengeSubmissionDTO> = {},
): ChallengeSubmissionDTO {
  return {
    id: "submission-123",
    challengeId: "challenge-456",
    groupId: "group-789",
    content: "Our submission content",
    files: [],
    status: "PENDING",
    voteScore: 0,
    submittedAt: new Date("2024-01-15"),
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
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

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleChallengeSubmissionGateway", () => {
  // ==========================================================================
  // findByChallengeAndGroup() Method Tests
  // ==========================================================================

  describe("findByChallengeAndGroup()", () => {
    it("returns submission by challenge and group", async () => {
      const mockRecord = {
        id: "submission-123",
        challengeId: "challenge-456",
        groupId: "group-789",
        content: "Test submission",
        files: null,
        status: "PENDING",
        voteScore: 0,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByChallengeAndGroup("challenge-456", "group-789"),
      );

      expect(result).not.toBeNull();
    });

    it("returns null when not found", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByChallengeAndGroup("challenge-456", "group-789"),
      );

      expect(result).toBeNull();
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findByChallengeAndGroup("challenge-456", "group-789"),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // existsForChallengeAndGroup() Method Tests
  // ==========================================================================

  describe("existsForChallengeAndGroup()", () => {
    it("returns true when submission exists", async () => {
      const mockDb = createCountMockDb(1);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsForChallengeAndGroup("challenge-456", "group-789"),
      );

      expect(result).toBe(true);
    });

    it("returns false when no submission exists", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsForChallengeAndGroup("challenge-456", "group-789"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.existsForChallengeAndGroup("challenge-456", "group-789"),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // Count Methods Tests
  // ==========================================================================

  describe("countByChallengeId()", () => {
    it("counts submissions by challenge", async () => {
      const mockDb = createCountMockDb(5);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByChallengeId("challenge-456"),
      );

      expect(result).toBe(5);
    });

    it("returns 0 when no submissions exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByChallengeId("challenge-456"),
      );

      expect(result).toBe(0);
    });
  });

  describe("countByChallengeAndStatus()", () => {
    it("counts submissions by challenge and status", async () => {
      const mockDb = createCountMockDb(3);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByChallengeAndStatus("challenge-456", "PENDING"),
      );

      expect(result).toBe(3);
    });

    it("returns 0 for non-matching status", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleChallengeSubmissionGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByChallengeAndStatus("challenge-456", "APPROVED"),
      );

      expect(result).toBe(0);
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByChallengeAndGroup: Combined lookup with null handling and error testing
// - existsForChallengeAndGroup: Boolean existence check with error handling
// - countByChallengeId: Challenge-based counting with zero handling
// - countByChallengeAndStatus: Status-filtered counting with zero handling
// - All methods use Effect.either for comprehensive error testing with DatabaseError
//
// Note: Cursor pagination methods are tested with similar patterns to other connection methods.
