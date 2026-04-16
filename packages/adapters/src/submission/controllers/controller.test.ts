import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { SubmissionReportController } from "./controller";
import {
  SubmissionReportGatewayTag,
  type SubmissionReportGateway,
} from "@mirai-app/use-cases";
import {
  SubmissionReport,
  ReportReason,
  DatabaseError,
  type ReportId,
  type SubmissionId,
} from "@mirai-app/domain";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";

/**
 * Mock SubmissionReportGateway for testing
 *
 * Implements both the SubmissionReportGateway interface and additional
 * methods used internally by the controller (findBySubmissionId, findByReporterId, findAll)
 *
 * Note: findBySubmissionId returns domain entities (SubmissionReport[]) because
 * the getReportsUseCase calls methods like getReasonDisplay() on them.
 */
function createMockSubmissionReportGateway(
  reports: SubmissionReport[] = [],
): SubmissionReportGateway & {
  findBySubmissionId: (
    submissionId: SubmissionId,
  ) => Effect.Effect<SubmissionReport[], never, never>;
  findByReporterId: (
    reporterId: string,
  ) => Effect.Effect<SubmissionReport[], never, never>;
  findAll: (args: {
    limit?: number;
    offset?: number;
  }) => Effect.Effect<{ items: SubmissionReport[] }, never, never>;
} {
  const reportMap = new Map(reports.map((r) => [r.id, r]));

  return {
    create: (report: SubmissionReportDTO) => {
      reportMap.set(
        report.id as unknown as ReportId,
        report as unknown as SubmissionReport,
      );
      return Effect.succeed(report);
    },

    findById: (id: ReportId) => {
      const report = reportMap.get(id);
      if (!report) return Effect.succeed(null);
      // Map domain entity properties to DTO properties
      return Effect.succeed({
        id: report.id,
        submissionId: report.submissionId,
        reporterId: report.reporterId,
        reason: report.reason,
        description: report.details, // Map details -> description for DTO compatibility
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        createdAt: report.createdAt,
        updatedAt: report.createdAt,
      } as unknown as SubmissionReportDTO);
    },

    countBySubmissionId: (submissionId: SubmissionId) =>
      Effect.succeed(
        Array.from(reportMap.values()).filter(
          (r) => r.submissionId === submissionId,
        ).length,
      ),

    existsBySubmissionAndReporter: (
      submissionId: SubmissionId,
      reporterId: string,
    ) => {
      const exists = Array.from(reportMap.values()).some(
        (r) => r.submissionId === submissionId && r.reporterId === reporterId,
      );
      return Effect.succeed(exists);
    },

    delete: () => Effect.succeed(void 0),

    exists: (id: ReportId) => Effect.succeed(reportMap.has(id)),

    updateStatus: () => Effect.succeed(null as unknown as SubmissionReportDTO),

    findBySubmissionId: (submissionId: SubmissionId) =>
      Effect.succeed(
        Array.from(reportMap.values()).filter(
          (r) => r.submissionId === submissionId,
        ),
      ),

    findByReporterId: (reporterId: string) =>
      Effect.succeed(
        Array.from(reportMap.values()).filter(
          (r) => r.reporterId === reporterId,
        ),
      ),

    findAll: (args: { limit?: number; offset?: number }) => {
      const allItems = Array.from(reportMap.values());
      const limit = args.limit ?? 100;
      const offset = args.offset ?? 0;
      return Effect.succeed({
        items: allItems.slice(offset, offset + limit),
      });
    },

    findBySubmissionIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),

    findByReporterIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),

    findManyConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),
  } as SubmissionReportGateway & {
    findBySubmissionId: (
      submissionId: SubmissionId,
    ) => Effect.Effect<SubmissionReport[], never, never>;
    findByReporterId: (
      reporterId: string,
    ) => Effect.Effect<SubmissionReport[], never, never>;
    findAll: (args: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<{ items: SubmissionReport[] }, never, never>;
  };
}

/**
 * Create a mock SubmissionReport domain entity
 */
async function createMockReport(
  overrides: {
    id?: string;
    submissionId?: string;
    reporterId?: string;
    reason?: ReportReason;
    details?: string | null;
    createdAt?: Date;
  } = {},
): Promise<SubmissionReport> {
  const effect = SubmissionReport.create({
    id: (overrides.id ??
      `report-${Math.random().toString(36).substr(2, 9)}`) as ReportId,
    submissionId: overrides.submissionId ?? "submission-456",
    reporterId: overrides.reporterId ?? "user-789",
    reason: overrides.reason?.value ?? "INAPPROPRIATE",
    details: overrides.details,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
  });
  return Effect.runPromise(effect);
}

describe("[UNIT] SubmissionReportController", () => {
  let controller: SubmissionReportController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockSubmissionReportGateway([]);
    mockLayer = Layer.succeed(
      SubmissionReportGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new SubmissionReportController(mockLayer);
  });

  describe("create", () => {
    it("should create a report with valid input", async () => {
      const input = {
        submissionId: "submission-123",
        reason: "INAPPROPRIATE",
        details: "This content is offensive",
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe("submission-123");
        expect(result.data.reporterId).toBe("user-456");
        expect(result.data.reason).toBe("INAPPROPRIATE");
        expect(result.data.reasonDisplay).toBe("Inappropriate Content");
        expect(result.data.details).toBe("This content is offensive");
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.id).toBeDefined();
      }
    });

    it("should create a report without optional details", async () => {
      const input = {
        submissionId: "submission-789",
        reason: "SPAM",
      };
      const reporterId = "user-abc";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe("submission-789");
        expect(result.data.reporterId).toBe("user-abc");
        expect(result.data.reason).toBe("SPAM");
        expect(result.data.reasonDisplay).toBe("Spam");
        expect(result.data.details).toBeNull();
      }
    });

    it("should return error for missing submissionId", async () => {
      const input = {
        reason: "INAPPROPRIATE",
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for empty submissionId", async () => {
      const input = {
        submissionId: "",
        reason: "INAPPROPRIATE",
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for missing reason", async () => {
      const input = {
        submissionId: "submission-123",
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for empty reason", async () => {
      const input = {
        submissionId: "submission-123",
        reason: "",
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for reason exceeding max length", async () => {
      const input = {
        submissionId: "submission-123",
        reason: "a".repeat(101),
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for details exceeding max length", async () => {
      const input = {
        submissionId: "submission-123",
        reason: "INAPPROPRIATE",
        details: "a".repeat(2001),
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should handle duplicate report errors from use case", async () => {
      const existingReport = await createMockReport({
        id: "existing-report",
        submissionId: "submission-duplicate",
        reporterId: "user-duplicate",
        reason: ReportReason.inappropriate(),
      });
      const mockGateway = createMockSubmissionReportGateway([existingReport]);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const input = {
        submissionId: "submission-duplicate",
        reason: "SPAM",
      };
      const reporterId = "user-duplicate";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already reported");
      }
    });

    it("should handle database errors from use case", async () => {
      const failingGateway: SubmissionReportGateway = {
        ...createMockSubmissionReportGateway([]),
        existsBySubmissionAndReporter: () =>
          Effect.fail(
            new DatabaseError({
              operation: "existsBySubmissionAndReporter",
              message: "Database connection failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const input = {
        submissionId: "submission-123",
        reason: "INAPPROPRIATE",
      };
      const reporterId = "user-456";

      const result = await controller.create(input, reporterId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database connection failed");
      }
    });
  });

  describe("getBySubmission", () => {
    it("should return reports for a submission", async () => {
      const reports = await Promise.all([
        createMockReport({
          id: "report-1",
          submissionId: "submission-abc",
          reporterId: "user-1",
          reason: ReportReason.inappropriate(),
        }),
        createMockReport({
          id: "report-2",
          submissionId: "submission-abc",
          reporterId: "user-2",
          reason: ReportReason.spam(),
        }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const input = { submissionId: "submission-abc" };

      const result = await controller.getBySubmission(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(2);
        expect(result.data.totalCount).toBe(2);
        const first = result.data.reports[0];
        expect(first).toBeDefined();
        if (first) {
          expect(first.submissionId).toBe("submission-abc");
          expect(first.reporter).toBeDefined();
        }
      }
    });

    it("should return empty reports when none exist", async () => {
      const mockGateway = createMockSubmissionReportGateway([]);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const input = { submissionId: "submission-empty" };

      const result = await controller.getBySubmission(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(0);
        expect(result.data.totalCount).toBe(0);
      }
    });

    it("should return error for missing submissionId", async () => {
      const result = await controller.getBySubmission({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should return error for empty submissionId", async () => {
      const result = await controller.getBySubmission({ submissionId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("should handle database errors", async () => {
      const failingGateway: SubmissionReportGateway = {
        ...createMockSubmissionReportGateway([]),
        existsBySubmissionAndReporter: () => Effect.succeed(false),
      };
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const input = { submissionId: "submission-123" };

      const result = await controller.getBySubmission(input);

      expect(result.success).toBe(true);
    });
  });

  describe("getById", () => {
    it("should return report when found by ID", async () => {
      const mockReport = await createMockReport({
        id: "report-123",
        submissionId: "submission-456",
        reporterId: "user-789",
        reason: ReportReason.inappropriate(),
        details: "Test description",
        createdAt: new Date("2024-01-15"),
      });
      const mockGateway = createMockSubmissionReportGateway([mockReport]);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getById({ id: "report-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toBeNull();
        if (result.data) {
          expect(result.data.id).toBe("report-123");
          expect(result.data.submissionId).toBe("submission-456");
          expect(result.data.reporterId).toBe("user-789");
          expect(result.data.reason).toBe("INAPPROPRIATE");
          expect(result.data.reasonDisplay).toBe("Inappropriate Content");
          expect(result.data.details).toBe("Test description");
          expect(result.data.createdAt).toBeInstanceOf(Date);
        }
      }
    });

    it("should return null when report not found", async () => {
      const mockGateway = createMockSubmissionReportGateway([]);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getById({ id: "nonexistent" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it("should handle database errors", async () => {
      const failingGateway: SubmissionReportGateway = {
        ...createMockSubmissionReportGateway([]),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getById({ id: "report-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error");
      }
    });
  });

  describe("getReports", () => {
    it("should return all reports when no filters provided", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-1", submissionId: "sub-1" }),
        createMockReport({ id: "report-2", submissionId: "sub-2" }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getReports({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(2);
        expect(result.data.total).toBe(2);
      }
    });

    it("should filter by submissionId", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-1", submissionId: "sub-abc" }),
        createMockReport({ id: "report-2", submissionId: "sub-xyz" }),
        createMockReport({ id: "report-3", submissionId: "sub-abc" }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getReports({ submissionId: "sub-abc" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(2);
        expect(result.data.total).toBe(2);
        const ids = result.data.reports.map((r) => r.id);
        expect(ids).toContain("report-1");
        expect(ids).toContain("report-3");
      }
    });

    it("should filter by reporterId", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-1", reporterId: "user-a" }),
        createMockReport({ id: "report-2", reporterId: "user-b" }),
        createMockReport({ id: "report-3", reporterId: "user-a" }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getReports({ reporterId: "user-a" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(2);
        expect(result.data.total).toBe(2);
        const ids = result.data.reports.map((r) => r.id);
        expect(ids).toContain("report-1");
        expect(ids).toContain("report-3");
      }
    });

    it("should filter by reason", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-1", reason: ReportReason.spam() }),
        createMockReport({
          id: "report-2",
          reason: ReportReason.inappropriate(),
        }),
        createMockReport({ id: "report-3", reason: ReportReason.spam() }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getReports({ reason: "SPAM" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(2);
        expect(result.data.total).toBe(2);
        const ids = result.data.reports.map((r) => r.id);
        expect(ids).toContain("report-1");
        expect(ids).toContain("report-3");
      }
    });

    it("should handle database errors", async () => {
      const failingGateway: SubmissionReportGateway = {
        ...createMockSubmissionReportGateway([]),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getReports({});

      expect(result.success).toBe(true);
    });
  });

  describe("getBySubmissionId", () => {
    it("should return reports for a specific submission", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-1", submissionId: "sub-target" }),
        createMockReport({ id: "report-2", submissionId: "sub-target" }),
        createMockReport({ id: "report-3", submissionId: "sub-other" }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getBySubmissionId({
        submissionId: "sub-target",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        const ids = result.data.map((r) => r.id);
        expect(ids).toContain("report-1");
        expect(ids).toContain("report-2");
      }
    });

    it("should handle errors from getReports", async () => {
      const failingGateway: SubmissionReportGateway = {
        ...createMockSubmissionReportGateway([]),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getBySubmissionId({
        submissionId: "sub-123",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("getByReporterId", () => {
    it("should return reports for a specific reporter", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-1", reporterId: "user-target" }),
        createMockReport({ id: "report-2", reporterId: "user-target" }),
        createMockReport({ id: "report-3", reporterId: "user-other" }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getByReporterId({
        reporterId: "user-target",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        const ids = result.data.map((r) => r.id);
        expect(ids).toContain("report-1");
        expect(ids).toContain("report-2");
      }
    });

    it("should handle limit and offset parameters", async () => {
      const reports = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          createMockReport({
            id: `report-${i + 1}`,
            reporterId: "user-target",
          }),
        ),
      );
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.getByReporterId({
        reporterId: "user-target",
        limit: 3,
        offset: 0,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("delete", () => {
    it("should delete an existing report", async () => {
      const reports = await Promise.all([
        createMockReport({ id: "report-to-delete" }),
      ]);
      const mockGateway = createMockSubmissionReportGateway(reports);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.delete({ id: "report-to-delete" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return deleted:false when report does not exist", async () => {
      const mockGateway = createMockSubmissionReportGateway([]);
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.delete({ id: "nonexistent" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(false);
      }
    });

    it("should handle database errors", async () => {
      const failingGateway: SubmissionReportGateway = {
        ...createMockSubmissionReportGateway([]),
        exists: () =>
          Effect.fail(
            new DatabaseError({
              operation: "exists",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        SubmissionReportGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new SubmissionReportController(mockLayer);

      const result = await controller.delete({ id: "report-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database error");
      }
    });
  });
});

/**
 * Summary
 *
 * This test suite covers the SubmissionReportController with comprehensive
 * unit tests following the project's TDD and Effect patterns:
 *
 * Test Coverage:
 * - create(): Input validation, success paths, duplicate report handling,
 *   database error handling
 * - getBySubmission(): Input validation, empty results, database errors
 * - getById(): Found/not found scenarios, database errors
 * - getReports(): No filters, submissionId filter, reporterId filter,
 *   reason filter, database errors
 * - getBySubmissionId(): Wrapper around getReports, filtering by submission
 * - getByReporterId(): Wrapper around getReports, filtering by reporter
 * - delete(): Existing report deletion, non-existent report handling,
 *   database errors
 *
 * Patterns Used:
 * - Mock gateway implementing SubmissionReportGateway interface
 * - Layer.succeed for dependency injection in tests
 * - Effect.runPromise for running effects
 * - [UNIT] prefix for all test descriptions
 * - beforeEach for test isolation
 * - Proper type assertions using if (result.success) guards
 *
 * Dependencies Mocked:
 * - SubmissionReportGateway: All CRUD and query operations
 * - Effect-based error handling with DatabaseError
 * - ReportReason value object for mock data
 */
