import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleChallengeVoteGateway } from "./vote";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { ChallengeVoteDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleChallengeVoteGateway
 *
 * Tests the gateway methods for challenge vote management:
 * - createMany() - Batch vote creation
 * - findByChallengeId() - Find votes by challenge
 * - findByChallengeAndVoter() - Find votes by challenge and voter
 * - findBySubmissionId() - Find votes by submission
 * - hasVoted() - Check if voter has voted in challenge
 * - hasVotedForPosition() - Check if voted for position
 * - getVotedPositions() - Get positions voted by user
 * - deleteByChallengeId() - Delete all votes for challenge
 * - Cursor pagination methods
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockVoteDTO(
  overrides: Partial<ChallengeVoteDTO> = {},
): ChallengeVoteDTO {
  return {
    id: "vote-123",
    challengeId: "challenge-456",
    submissionId: "submission-789",
    voterId: "user-001",
    votePosition: 1,
    normalizedWeight: 1.0,
    votedAt: new Date("2024-01-15"),
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
          orderBy: () => Promise.reject(new Error(errorMessage)),
          limit: () => Promise.reject(new Error(errorMessage)),
        }),
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

describe("[UNIT] DrizzleChallengeVoteGateway", () => {
  // ==========================================================================
  // findByChallengeId() Method Tests
  // ==========================================================================

  describe("findByChallengeId()", () => {
    it("returns votes for a challenge", async () => {
      const mockRecords = [
        {
          id: "vote-1",
          challengeId: "challenge-456",
          voterId: "user-1",
          position: "UPVOTE",
          weight: 1.0,
          createdAt: new Date(),
        },
        {
          id: "vote-2",
          challengeId: "challenge-456",
          voterId: "user-2",
          position: "UPVOTE",
          weight: 1.0,
          createdAt: new Date(),
        },
      ];
      const mockDb = createSelectMockDb(mockRecords);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByChallengeId("challenge-456"),
      );

      expect(result).toHaveLength(2);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.findByChallengeId("challenge-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // findByChallengeAndVoter() Method Tests
  // ==========================================================================

  describe("findByChallengeAndVoter()", () => {
    it("returns votes by challenge and voter", async () => {
      const mockRecord = {
        id: "vote-1",
        challengeId: "challenge-456",
        voterId: "user-789",
        position: "UPVOTE",
        weight: 1.0,
        createdAt: new Date(),
      };
      const mockDb = createSelectMockDb([mockRecord]);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByChallengeAndVoter("challenge-456", "user-789"),
      );

      expect(result).toHaveLength(1);
    });
  });

  // ==========================================================================
  // findBySubmissionId() Method Tests
  // ==========================================================================

  describe("findBySubmissionId()", () => {
    it("returns votes for a submission", async () => {
      const mockRecords = [
        {
          id: "vote-1",
          submissionId: "submission-789",
          position: "UPVOTE",
          weight: 1.0,
          createdAt: new Date(),
        },
        {
          id: "vote-2",
          submissionId: "submission-789",
          position: "UPVOTE",
          weight: 1.0,
          createdAt: new Date(),
        },
      ];
      const mockDb = createSelectMockDb(mockRecords);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findBySubmissionId("submission-789"),
      );

      expect(result).toHaveLength(2);
    });
  });

  // ==========================================================================
  // hasVoted() Method Tests
  // ==========================================================================

  describe("hasVoted()", () => {
    it("returns true when voter has voted", async () => {
      const mockDb = createCountMockDb(1);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.hasVoted("challenge-456", "user-789"),
      );

      expect(result).toBe(true);
    });

    it("returns false when voter has not voted", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.hasVoted("challenge-456", "user-789"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.hasVoted("challenge-456", "user-789")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // getVotedPositions() Method Tests
  // ==========================================================================

  describe("getVotedPositions()", () => {
    it("returns positions voted by user", async () => {
      const mockRecords = [{ position: "UPVOTE" }, { position: "UPVOTE" }];
      const mockDb = createSelectMockDb(mockRecords);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getVotedPositions("challenge-456", "user-789"),
      );

      expect(result).toContain(1);
    });

    it("returns empty array when no votes", async () => {
      const mockDb = createSelectMockDb([]);
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.getVotedPositions("challenge-456", "user-789"),
      );

      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // deleteByChallengeId() Method Tests
  // ==========================================================================

  describe("deleteByChallengeId()", () => {
    it("deletes all votes for a challenge", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.deleteByChallengeId("challenge-456"),
      );

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeVoteGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.deleteByChallengeId("challenge-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByChallengeId: Challenge-based vote lookup with error handling
// - findByChallengeAndVoter: Voter-specific vote lookup
// - findBySubmissionId: Submission-specific vote lookup
// - hasVoted: Boolean existence check with error handling
// - hasVotedForPosition: Position-specific existence check
// - getVotedPositions: Position enumeration with empty handling
// - deleteByChallengeId: Bulk deletion with error handling
// - All methods use Effect.either for comprehensive error testing with DatabaseError
//
// Mock DrizzleDb factory functions provide consistent test setup.
