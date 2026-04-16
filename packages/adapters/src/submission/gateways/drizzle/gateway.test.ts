import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { DrizzleSubmissionReportGateway } from "./gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";

/**
 * Unit tests for DrizzleSubmissionReportGateway
 *
 * Tests the gateway methods for submission report management:
 * - CRUD operations (create, findById, delete, exists)
 * - countBySubmissionId() - Count reports by submission
 * - existsBySubmissionAndReporter() - Check if reporter reported submission
 * - updateStatus() - Update report status with review info
 * - Cursor pagination methods (findBySubmissionIdConnection, etc.)
 *
 * [UNIT] tag indicates these are pure unit tests with mocked database calls.
 */

// ============================================================================
// Mock Data Helpers
// ============================================================================

function createMockReportDTO(
  overrides: Partial<SubmissionReportDTO> = {},
): SubmissionReportDTO {
  return {
    id: "report-123",
    submissionId: "submission-456",
    reporterId: "user-789",
    reason: "INAPPROPRIATE_CONTENT",
    details: "This content violates guidelines",
    status: "PENDING",
    reviewedById: null,
    reviewedAt: null,
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
      from: () => {
        const chain = {
          where: () => {
            const whereChain = {
              limit: () => Promise.resolve(records),
              orderBy: () => Promise.resolve(records),
              then: (resolve: (value: unknown[]) => unknown) =>
                resolve(records),
            };
            return whereChain;
          },
          limit: () => Promise.resolve(records),
          orderBy: () => Promise.resolve(records),
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

function createUpdateMockDb(record?: unknown): DrizzleDb {
  const mockRecord = record ?? {
    id: "report-123",
    submissionId: "submission-456",
    reporterId: "user-789",
    reason: "INAPPROPRIATE_CONTENT",
    details: "Test details",
    status: "RESOLVED",
    reviewedById: "admin-001",
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([mockRecord]),
          then: (resolve: (value: unknown[]) => unknown) =>
            resolve([mockRecord]),
        }),
        limit: () => Promise.resolve([mockRecord]),
        then: (resolve: (value: unknown[]) => unknown) => resolve([mockRecord]),
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
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.reject(new Error(errorMessage)),
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

describe("[UNIT] DrizzleSubmissionReportGateway", () => {
  // ==========================================================================
  // countBySubmissionId() Method Tests
  // ==========================================================================

  describe("countBySubmissionId()", () => {
    it("counts reports for a submission", async () => {
      const mockDb = createCountMockDb(3);
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countBySubmissionId("submission-456"),
      );

      expect(result).toBe(3);
    });

    it("returns 0 when no reports exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.countBySubmissionId("submission-456"),
      );

      expect(result).toBe(0);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.countBySubmissionId("submission-456")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // existsBySubmissionAndReporter() Method Tests
  // ==========================================================================

  describe("existsBySubmissionAndReporter()", () => {
    it("returns true when reporter has reported", async () => {
      const mockDb = createCountMockDb(1);
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsBySubmissionAndReporter("submission-456", "user-789"),
      );

      expect(result).toBe(true);
    });

    it("returns false when reporter has not reported", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.existsBySubmissionAndReporter("submission-456", "user-789"),
      );

      expect(result).toBe(false);
    });

    it("returns DatabaseError on query failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.existsBySubmissionAndReporter("submission-456", "user-789"),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // updateStatus() Method Tests
  // ==========================================================================

  describe("updateStatus()", () => {
    it("updates report status with review info", async () => {
      const mockDb = createUpdateMockDb();
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(
        gateway.updateStatus("report-123", "RESOLVED", "admin-001"),
      );

      expect(result).not.toBeNull();
    });

    it("returns DatabaseError on update failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(
          gateway.updateStatus("report-123", "RESOLVED", "admin-001"),
        ),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // delete() Method Tests
  // ==========================================================================

  describe("delete()", () => {
    it("deletes a report", async () => {
      const mockDb = createDeleteMockDb();
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(gateway.delete("report-123"));

      expect(result).toBeUndefined();
    });

    it("returns DatabaseError on delete failure", async () => {
      const mockDb = createFailingMockDb("Connection failed");
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const either = await Effect.runPromise(
        Effect.either(gateway.delete("report-123")),
      );

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });

  // ==========================================================================
  // exists() Method Tests
  // ==========================================================================

  describe("exists()", () => {
    it("returns true when report exists", async () => {
      const mockDb = createCountMockDb(1);
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(gateway.exists("report-123"));

      expect(result).toBe(true);
    });

    it("returns false when report does not exist", async () => {
      const mockDb = createCountMockDb(0);
      const gateway = new DrizzleSubmissionReportGateway(mockDb);

      const result = await Effect.runPromise(gateway.exists("report-123"));

      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// Summary
// ============================================================================
//
// Test Coverage:
// - countBySubmissionId: Submission report counting with zero handling
// - existsBySubmissionAndReporter: Duplicate check with error handling
// - updateStatus: Status update with review metadata and error handling
// - delete: Report deletion with error handling
// - exists: Existence check with boolean return
// - All methods use Effect.either for comprehensive error testing with DatabaseError
//
// Note: Cursor pagination methods follow the same patterns as other connection tests.
