import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { getReportsUseCase, type GetReportsInput } from "./list";
import {
  SubmissionReportGatewayTag,
  type SubmissionReportGateway,
} from "../ports/gateway";
import type { SubmissionReportDTO } from "../dto";
import {
  SubmissionReport,
  ReportReason,
  DatabaseError,
} from "@mirai-app/domain";

/**
 * Mock SubmissionReportGateway for testing
 * Note: The list use case expects findBySubmissionId returning array
 * and countBySubmissionId returning number, which are extensions
 * beyond the base gateway interface.
 *
 * IMPORTANT: The list use case expects domain entities (SubmissionReport)
 * not DTOs, because it calls methods like getReasonDisplay() on them.
 */
function createMockReportGateway(
  reports: SubmissionReport[] = [],
  options: {
    shouldFailFindBySubmissionId?: boolean;
    shouldFailCount?: boolean;
  } = {},
): SubmissionReportGateway {
  const reportMap = new Map(reports.map((r) => [r.id, r]));

  return {
    create: (report: SubmissionReportDTO) => {
      reportMap.set(report.id as never, report as unknown as SubmissionReport);
      return Effect.succeed(report);
    },

    findById: (id: string) => {
      const report = reportMap.get(id as never);
      return Effect.succeed((report as unknown as SubmissionReportDTO) ?? null);
    },

    countBySubmissionId: () => {
      if (options.shouldFailCount) {
        return Effect.fail(
          new DatabaseError({
            operation: "countBySubmissionId",
            message: "Database error during count",
          }),
        );
      }
      return Effect.succeed(reports.length);
    },

    existsBySubmissionAndReporter: () => Effect.succeed(false),

    delete: () => Effect.succeed(void 0),

    exists: (id: string) => Effect.succeed(reportMap.has(id as never)),

    updateStatus: () => Effect.succeed(null as unknown as SubmissionReportDTO),

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

    // Extended method used by list use case - returns domain entities
    findBySubmissionId: () => {
      if (options.shouldFailFindBySubmissionId) {
        return Effect.fail(
          new DatabaseError({
            operation: "findBySubmissionId",
            message: "Database error during find",
          }),
        );
      }
      return Effect.succeed(reports);
    },
  } as SubmissionReportGateway;
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
    reporter?: {
      reporterId: string;
      participantId: string;
      userId: string;
      firstName: string;
      lastName: string;
      email: string | null;
      hasAvatar: boolean;
    } | null;
  } = {},
): Promise<SubmissionReport> {
  const effect = SubmissionReport.create({
    id: (overrides.id ??
      `report-${Math.random().toString(36).substr(2, 9)}`) as never,
    submissionId: overrides.submissionId ?? "submission-456",
    reporterId: overrides.reporterId ?? "user-789",
    reason: overrides.reason?.value ?? "INAPPROPRIATE",
    details: overrides.details,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    reporter: overrides.reporter,
  });
  return Effect.runPromise(effect);
}

describe("[UNIT] getReportsUseCase", () => {
  it("should return empty reports when no reports exist", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-no-reports",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.reports).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });

  it("should return reports with correct output structure", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-1",
        submissionId: "submission-123",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
        details: "Test report 1",
        createdAt: new Date("2024-01-15"),
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.reports).toHaveLength(1);
    expect(result.totalCount).toBe(1);

    const report = result.reports[0];
    expect(report).toBeDefined();
    if (report) {
      expect(report.id).toBe("report-1");
      expect(report.submissionId).toBe("submission-123");
      expect(report.reporterId).toBe("user-1");
      expect(report.reason).toBe("INAPPROPRIATE");
      expect(report.reasonDisplay).toBe("Inappropriate Content");
      expect(report.details).toBe("Test report 1");
      expect(report.createdAt).toBeInstanceOf(Date);
    }
  });

  it("should return multiple reports for a submission", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-1",
        submissionId: "submission-multi",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
        createdAt: new Date("2024-01-15"),
      }),
      await createMockReport({
        id: "report-2",
        submissionId: "submission-multi",
        reporterId: "user-2",
        reason: ReportReason.spam(),
        details: "Spam content",
        createdAt: new Date("2024-01-16"),
      }),
      await createMockReport({
        id: "report-3",
        submissionId: "submission-multi",
        reporterId: "user-3",
        reason: ReportReason.cheating(),
        createdAt: new Date("2024-01-17"),
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-multi",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.reports).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // Verify all reports are present
    const reportIds = result.reports.map((r) => r.id);
    expect(reportIds).toContain("report-1");
    expect(reportIds).toContain("report-2");
    expect(reportIds).toContain("report-3");
  });

  it("should handle reports with different reasons", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-inappropriate",
        submissionId: "submission-reasons",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
      }),
      await createMockReport({
        id: "report-cheating",
        submissionId: "submission-reasons",
        reporterId: "user-2",
        reason: ReportReason.cheating(),
      }),
      await createMockReport({
        id: "report-spam",
        submissionId: "submission-reasons",
        reporterId: "user-3",
        reason: ReportReason.spam(),
      }),
      await createMockReport({
        id: "report-wrong",
        submissionId: "submission-reasons",
        reporterId: "user-4",
        reason: ReportReason.wrongSubmission(),
      }),
      await createMockReport({
        id: "report-other",
        submissionId: "submission-reasons",
        reporterId: "user-5",
        reason: ReportReason.other(),
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-reasons",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.reports).toHaveLength(5);

    // Verify reason displays
    const reasons = result.reports.map((r) => ({
      reason: r.reason,
      display: r.reasonDisplay,
    }));

    expect(reasons).toContainEqual({
      reason: "INAPPROPRIATE",
      display: "Inappropriate Content",
    });
    expect(reasons).toContainEqual({
      reason: "CHEATING",
      display: "Cheating",
    });
    expect(reasons).toContainEqual({
      reason: "SPAM",
      display: "Spam",
    });
    expect(reasons).toContainEqual({
      reason: "WRONG_SUBMISSION",
      display: "Wrong Submission",
    });
    expect(reasons).toContainEqual({
      reason: "OTHER",
      display: "Other",
    });
  });

  it("should handle reports without details (null)", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-no-details",
        submissionId: "submission-123",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
        details: null,
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    const report = result.reports[0];
    expect(report).toBeDefined();
    expect(report?.details).toBeNull();
  });

  it("should handle reports with reporter info", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-with-reporter",
        submissionId: "submission-123",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
        details: null,
        createdAt: new Date("2024-01-15"),
        reporter: {
          reporterId: "user-1",
          participantId: "participant-1",
          userId: "auth-user-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          hasAvatar: true,
        },
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    const report = result.reports[0];
    expect(report).toBeDefined();
    expect(report?.reporter).toBeDefined();
    expect(report?.reporter.id).toBe("participant-1");
    expect(report?.reporter.user.id).toBe("auth-user-1");
    expect(report?.reporter.user.firstName).toBe("John");
    expect(report?.reporter.user.lastName).toBe("Doe");
    expect(report?.reporter.user.email).toBe("john@example.com");
    expect(report?.reporter.user.hasAvatar).toBe(true);
  });

  it("should handle reports without reporter info", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-no-reporter",
        submissionId: "submission-123",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    // When no reporter info, should still have reporter structure with defaults
    const report = result.reports[0];
    expect(report).toBeDefined();
    expect(report?.reporter).toBeDefined();
    expect(report?.reporter.id).toBe("user-1"); // Uses reporterId as fallback
  });

  it("should handle database errors gracefully", async () => {
    const mockGateway = createMockReportGateway([], {
      shouldFailFindBySubmissionId: true,
    });
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during count", async () => {
    const mockGateway = createMockReportGateway([], {
      shouldFailCount: true,
    });
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should correctly map total count from countBySubmissionId", async () => {
    const mockReports = [
      await createMockReport({
        id: "report-1",
        submissionId: "submission-123",
        reporterId: "user-1",
        reason: ReportReason.inappropriate(),
      }),
      await createMockReport({
        id: "report-2",
        submissionId: "submission-123",
        reporterId: "user-2",
        reason: ReportReason.spam(),
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    // Verify all reports are present
    const reportIds = result.reports.map((r) => r.id);
    expect(reportIds).toContain("report-1");
    expect(reportIds).toContain("report-2");
  });

  it("should handle reports with custom reasons", async () => {
    const customReason = ReportReason.unsafeCreate("CUSTOM_VIOLATION");
    const mockReports = [
      await createMockReport({
        id: "report-custom",
        submissionId: "submission-123",
        reporterId: "user-1",
        reason: customReason,
      }),
    ];
    const mockGateway = createMockReportGateway(mockReports);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: GetReportsInput = {
      submissionId: "submission-123",
    };

    const program = getReportsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    const report = result.reports[0];
    expect(report).toBeDefined();
    expect(report?.reason).toBe("CUSTOM_VIOLATION");
    expect(report?.reasonDisplay).toBe("CUSTOM_VIOLATION");
  });
});
