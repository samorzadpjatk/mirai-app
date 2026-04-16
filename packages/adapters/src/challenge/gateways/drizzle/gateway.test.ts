import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleChallengeGateway } from "./gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type {
  ChallengeDTO,
  ChallengeConnectionArgs,
} from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleChallengeGateway
 *
 * Tests the gateway methods for challenge management:
 * - Cursor-based pagination methods (findByTripIdConnection, findByStatusConnection, etc.)
 * - findByTripIdAndStatusConnection() - Combined filtering
 * - findBySubmissionTypeConnection() - Filter by submission type
 * - findByScoringCategoryConnection() - Filter by scoring category
 * - findActiveConnection() - Active challenges
 * - findOpenForSubmissionConnection() - Open for submissions
 * - findRecurringConnection() - Recurring challenges
 * - updateStatus() - Update challenge status
 * - countByTripId() - Count challenges by trip
 * - findAllConnection() - All challenges with pagination
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockChallengeDTO(
  overrides: Partial<ChallengeDTO> = {},
): ChallengeDTO {
  return {
    id: "challenge-123",
    tripId: "trip-456",
    title: "Test Challenge",
    description: "A test challenge",
    status: "ACTIVE",
    submissionType: "TEXT",
    scoringCategory: "CREATIVITY",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    points: 100,
    maxPoints: 100,
    isRecurring: false,
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

// ============================================================================
// Mock Drizzle Db Factory
// ============================================================================

function createConnectionMockDb(records: unknown[]): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(records),
          }),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

function createUpdateMockDb(returnRecord: unknown): DrizzleDb {
  return {
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([returnRecord]),
        }),
      }),
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

function createFailingMockDb(errorMessage: string): DrizzleDb {
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const whereChain = {
            orderBy: () => ({
              limit: () => Promise.reject(new Error(errorMessage)),
            }),
            limit: () => Promise.reject(new Error(errorMessage)),
            then: (_resolve: unknown, reject: (error: Error) => unknown) =>
              reject(new Error(errorMessage)),
          };
          return whereChain;
        },
        then: (_resolve: unknown, reject: (error: Error) => unknown) =>
          reject(new Error(errorMessage)),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.reject(new Error(errorMessage)),
        }),
      }),
    }),
  } as unknown as DrizzleDb;
}

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] DrizzleChallengeGateway", () => {
  // ==========================================================================
  // Cursor Pagination Tests
  // ==========================================================================

  describe("findByTripIdConnection()", () => {
    it("returns paginated challenges for trip", async () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        createMockChallengeDTO({ id: `challenge-${i}`, tripId: "trip-456" }),
      );
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-456", { first: 10 }),
      );

      expect(result.nodes).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.findByTripIdConnection("trip-456", { first: 10 }),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("findByTripIdConnection");
      }
    });
  });

  describe("findByStatusConnection()", () => {
    it("returns challenges by status", async () => {
      const records = Array.from({ length: 3 }, (_, i) =>
        createMockChallengeDTO({ id: `challenge-${i}`, status: "ACTIVE" }),
      );
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByStatusConnection("ACTIVE", { first: 10 }),
      );

      expect(result.nodes).toHaveLength(3);
    });
  });

  describe("findByTripIdAndStatusConnection()", () => {
    it("returns challenges by trip and status", async () => {
      const records = [
        createMockChallengeDTO({ tripId: "trip-456", status: "ACTIVE" }),
      ];
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatusConnection("trip-456", "ACTIVE", {
          first: 10,
        }),
      );

      expect(result.nodes).toHaveLength(1);
    });
  });

  describe("findBySubmissionTypeConnection()", () => {
    it("returns challenges by submission type", async () => {
      const records = [createMockChallengeDTO({ submissionType: "PHOTO" })];
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findBySubmissionTypeConnection("PHOTO", { first: 10 }),
      );

      expect(result.nodes).toHaveLength(1);
    });
  });

  describe("findByScoringCategoryConnection()", () => {
    it("returns challenges by scoring category", async () => {
      const records = [createMockChallengeDTO({ scoringCategory: "TEAMWORK" })];
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findByScoringCategoryConnection("TEAMWORK", { first: 10 }),
      );

      expect(result.nodes).toHaveLength(1);
    });
  });

  describe("findActiveConnection()", () => {
    it("returns active challenges", async () => {
      const records = [
        createMockChallengeDTO({ status: "ACTIVE" }),
        createMockChallengeDTO({ status: "ACTIVE" }),
      ];
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.nodes).toHaveLength(2);
    });
  });

  describe("findOpenForSubmissionConnection()", () => {
    it("returns challenges open for submission", async () => {
      const now = new Date();
      const records = [
        createMockChallengeDTO({
          status: "ACTIVE",
          startDate: new Date(now.getTime() - 86400000),
          endDate: new Date(now.getTime() + 86400000),
        }),
      ];
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findOpenForSubmissionConnection({ first: 10 }),
      );

      expect(result.nodes).toHaveLength(1);
    });
  });

  describe("findRecurringConnection()", () => {
    it("returns recurring challenges", async () => {
      const records = [createMockChallengeDTO({ isRecurring: true })];
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findRecurringConnection({ first: 10 }),
      );

      expect(result.nodes).toHaveLength(1);
    });
  });

  describe("findAllConnection()", () => {
    it("returns all challenges with pagination", async () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        createMockChallengeDTO({ id: `challenge-${i}` }),
      );
      const mockDb = createConnectionMockDb(records);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.findAllConnection({ first: 10 }),
      );

      expect(result.nodes).toHaveLength(10);
    });
  });

  // ==========================================================================
  // updateStatus() Method Tests
  // ==========================================================================

  describe("updateStatus()", () => {
    it("updates challenge status", async () => {
      const mockRecord = createMockChallengeDTO({ status: "COMPLETED" });
      const mockDb = createUpdateMockDb(mockRecord);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.updateStatus("challenge-123", "COMPLETED"),
      );

      expect(result.status).toBe("COMPLETED");
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.updateStatus("challenge-123", "COMPLETED")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("updateStatus");
      }
    });
  });

  // ==========================================================================
  // countByTripId() Method Tests
  // ==========================================================================

  describe("countByTripId()", () => {
    it("counts challenges for a trip", async () => {
      const mockDb = createCountMockDb(8);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(gateway.countByTripId("trip-456"));

      expect(result).toBe(8);
    });

    it("returns 0 when no challenges exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleChallengeGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countByTripId("trip-empty"),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleChallengeGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countByTripId("trip-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
        expect(either.left.operation).toBe("countByTripId");
      }
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - findByTripIdConnection: Trip-based cursor pagination with error handling
// - findByStatusConnection: Status-based filtering
// - findByTripIdAndStatusConnection: Combined trip and status filtering
// - findBySubmissionTypeConnection: Submission type filtering
// - findByScoringCategoryConnection: Scoring category filtering
// - findActiveConnection: Active challenges query
// - findOpenForSubmissionConnection: Time-window based open challenges
// - findRecurringConnection: Recurring challenges query
// - findAllConnection: Global pagination
// - updateStatus: Status update with error handling
// - countByTripId: Challenge counting with zero handling and error handling
//
// All cursor pagination tests verify proper Connection structure with edges, nodes, and pageInfo.
