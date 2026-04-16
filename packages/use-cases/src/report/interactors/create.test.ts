import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createReportUseCase,
  type CreateReportInput,
  DuplicateReportError,
  CreateReportValidationError,
} from "./create";
import {
  SubmissionReportGatewayTag,
  type SubmissionReportGateway,
} from "../ports/gateway";
import type { SubmissionReportDTO } from "../dto";
import { ReportReason, DatabaseError } from "@mirai-app/domain";

/**
 * Mock SubmissionReportGateway for testing
 */
function createMockReportGateway(
  reports: SubmissionReportDTO[] = [],
  options: {
    shouldFailCreate?: boolean;
    shouldFailExists?: boolean;
  } = {},
): SubmissionReportGateway {
  const reportMap = new Map(reports.map((r) => [r.id, r]));

  return {
    create: (report: SubmissionReportDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error during create",
          }),
        );
      }
      reportMap.set(report.id, report);
      return Effect.succeed(report);
    },

    findById: (id: string) => {
      const report = reportMap.get(id);
      return Effect.succeed(report ?? null);
    },

    countBySubmissionId: () => Effect.succeed(0),

    existsBySubmissionAndReporter: (
      submissionId: string,
      reporterId: string,
    ) => {
      if (options.shouldFailExists) {
        return Effect.fail(
          new DatabaseError({
            operation: "existsBySubmissionAndReporter",
            message: "Database error during check",
          }),
        );
      }
      const exists = Array.from(reportMap.values()).some(
        (r) => r.submissionId === submissionId && r.reporterId === reporterId,
      );
      return Effect.succeed(exists);
    },

    delete: () => Effect.succeed(void 0),

    exists: (id: string) => Effect.succeed(reportMap.has(id)),

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
  };
}

function createMockReportDTO(
  overrides: Partial<SubmissionReportDTO> = {},
): SubmissionReportDTO {
  return {
    id: overrides.id ?? "report-123",
    submissionId: overrides.submissionId ?? "submission-456",
    reporterId: overrides.reporterId ?? "user-789",
    reason: overrides.reason ?? ReportReason.inappropriate(),
    description: overrides.description ?? null,
    status: overrides.status ?? "PENDING",
    reviewedById: overrides.reviewedById ?? null,
    reviewedAt: overrides.reviewedAt ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

describe("[UNIT] createReportUseCase", () => {
  it("should create a report successfully", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-456",
      reason: "INAPPROPRIATE",
      details: "This content is offensive",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.submissionId).toBe("submission-123");
    expect(result.reporterId).toBe("user-456");
    expect(result.reason).toBe("INAPPROPRIATE");
    expect(result.reasonDisplay).toBe("Inappropriate Content");
    expect(result.details).toBe("This content is offensive");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
  });

  it("should create a report without optional details", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-789",
      reporterId: "user-abc",
      reason: "SPAM",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.submissionId).toBe("submission-789");
    expect(result.reporterId).toBe("user-abc");
    expect(result.reason).toBe("SPAM");
    expect(result.reasonDisplay).toBe("Spam");
    expect(result.details).toBeNull();
  });

  it("should fail with DuplicateReportError when reporter already reported", async () => {
    const existingReport = createMockReportDTO({
      id: "existing-report",
      submissionId: "submission-duplicate",
      reporterId: "user-duplicate",
      reason: ReportReason.cheating(),
    });
    const mockGateway = createMockReportGateway([existingReport]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-duplicate",
      reporterId: "user-duplicate",
      reason: "INAPPROPRIATE",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DuplicateReportError);
      expect(either.left.message).toBe(
        "You have already reported this submission",
      );
    }
  });

  it("should fail with CreateReportValidationError for empty submissionId", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "",
      reporterId: "user-123",
      reason: "INAPPROPRIATE",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateReportValidationError);
    }
  });

  it("should fail with CreateReportValidationError for empty reporterId", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "",
      reason: "INAPPROPRIATE",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateReportValidationError);
    }
  });

  it("should fail with CreateReportValidationError for empty reason", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateReportValidationError);
    }
  });

  it("should fail with CreateReportValidationError for short custom reason", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "AB", // Too short, must be at least 3 characters
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateReportValidationError);
    }
  });

  it("should handle database errors during exists check", async () => {
    const mockGateway = createMockReportGateway([], {
      shouldFailExists: true,
    });
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "INAPPROPRIATE",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during creation", async () => {
    const mockGateway = createMockReportGateway([], {
      shouldFailCreate: true,
    });
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "INAPPROPRIATE",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should create report with all standard reason types", async () => {
    const reasons = [
      { reason: "INAPPROPRIATE", display: "Inappropriate Content" },
      { reason: "CHEATING", display: "Cheating" },
      { reason: "SPAM", display: "Spam" },
      { reason: "WRONG_SUBMISSION", display: "Wrong Submission" },
      { reason: "OTHER", display: "Other" },
    ];

    for (const { reason, display } of reasons) {
      const mockGateway = createMockReportGateway([]);
      const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

      const input: CreateReportInput = {
        submissionId: `submission-${reason}`,
        reporterId: `user-${reason}`,
        reason,
      };

      const program = createReportUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.reason).toBe(reason);
      expect(result.reasonDisplay).toBe(display);
    }
  });

  it("should trim whitespace from reason and validate as valid reason", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "  inappropriate  ", // Whitespace should be trimmed
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.reason).toBe("INAPPROPRIATE");
    expect(result.reasonDisplay).toBe("Inappropriate Content");
  });

  it("should allow custom reason with at least 3 characters", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "CUSTOMREASON",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.reason).toBe("CUSTOMREASON");
    expect(result.reasonDisplay).toBe("CUSTOMREASON");
  });

  it("should trim details when provided", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "INAPPROPRIATE",
      details: "  Some details with whitespace  ",
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.details).toBe("Some details with whitespace");
  });

  it("should treat whitespace-only details as null", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "INAPPROPRIATE",
      details: "   ", // Whitespace only
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.details).toBeNull();
  });

  it("should reject details longer than 2000 characters", async () => {
    const mockGateway = createMockReportGateway([]);
    const mockLayer = Layer.succeed(SubmissionReportGatewayTag, mockGateway);

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "user-123",
      reason: "INAPPROPRIATE",
      details: "a".repeat(2001),
    };

    const program = createReportUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateReportValidationError);
    }
  });
});
