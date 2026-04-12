import { describe, it, expect, beforeEach } from "bun:test";
import {
  createReportUseCase,
  type CreateReportInput,
  DuplicateReportError,
  CreateReportValidationError,
} from "./CreateReport";
import { Effect, Either } from "effect";
import { SubmissionReportRepositoryTag } from "../ports/SubmissionReportRepository";
import { SubmissionReport } from "@mirai-app/domain";

// Mock SubmissionReport domain object
const createMockReport = (
  overrides?: Partial<SubmissionReport>,
): SubmissionReport =>
  ({
    id: "report-123",
    submissionId: "submission-123",
    reporterId: "reporter-123",
    reason: { value: "inappropriate" },
    details: "Test details",
    getReasonDisplay: () => "Inappropriate Content",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }) as SubmissionReport;

// Helper to create a mock repository service for Effect
const createMockRepoService = (overrides?: {
  existsBySubmissionAndReporter?: (
    submissionId: string,
    reporterId: string,
  ) => Promise<boolean>;
  create?: (report: SubmissionReport) => Promise<SubmissionReport>;
}) => ({
  existsBySubmissionAndReporter: (submissionId: string, reporterId: string) =>
    Effect.promise(() =>
      overrides?.existsBySubmissionAndReporter
        ? overrides.existsBySubmissionAndReporter(submissionId, reporterId)
        : Promise.resolve(false),
    ),
  create: (report: SubmissionReport) =>
    Effect.promise(() =>
      overrides?.create
        ? overrides.create(report)
        : Promise.resolve(createMockReport()),
    ),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findBySubmissionId: () => Effect.promise(() => Promise.resolve([])),
  findByReporterId: () => Effect.promise(() => Promise.resolve([])),
  findByReason: () => Effect.promise(() => Promise.resolve([])),
  findAll: () => Effect.promise(() => Promise.resolve([])),
  countBySubmissionId: () => Effect.promise(() => Promise.resolve(0)),
  delete: () => Effect.promise(() => Promise.resolve()),
  exists: () => Effect.promise(() => Promise.resolve(false)),
});

describe("[UNIT] createReportUseCase (Effect)", () => {
  it("should create report with minimal input", async () => {
    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "reporter-123",
      reason: "inappropriate",
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(
        SubmissionReportRepositoryTag,
        createMockRepoService(),
      ),
    );

    const result = await Effect.runPromise(program);

    expect(result.id).toBe("report-123");
    expect(result.submissionId).toBe("submission-123");
    expect(result.reporterId).toBe("reporter-123");
    expect(result.reason).toBe("inappropriate");
    expect(result.reasonDisplay).toBe("Inappropriate Content");
  });

  it("should create report with details", async () => {
    const mockReport = createMockReport({
      details: "Detailed explanation of the issue",
    });

    const repoService = createMockRepoService({
      create: () => Promise.resolve(mockReport),
    });

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "reporter-123",
      reason: "spam",
      details: "Detailed explanation of the issue",
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(SubmissionReportRepositoryTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.details).toBe("Detailed explanation of the issue");
  });

  it("should return error when user already reported submission", async () => {
    const repoService = createMockRepoService({
      existsBySubmissionAndReporter: () => Promise.resolve(true),
    });

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "reporter-123",
      reason: "inappropriate",
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(SubmissionReportRepositoryTag, repoService),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(DuplicateReportError);
    }
  });

  it("should handle different report reasons", async () => {
    const reasons = [
      "inappropriate",
      "spam",
      "harassment",
      "copyright",
      "other",
    ];

    for (const reason of reasons) {
      const mockReport = createMockReport({
        reason: { value: reason },
        getReasonDisplay: () => reason,
      });

      const repoService = createMockRepoService({
        create: () => Promise.resolve(mockReport),
      });

      const input: CreateReportInput = {
        submissionId: "submission-123",
        reporterId: "reporter-123",
        reason,
      };

      const program = createReportUseCase(input).pipe(
        Effect.provideService(SubmissionReportRepositoryTag, repoService),
      );

      const result = await Effect.runPromise(program);
      expect(result.reason).toBe(reason);
    }
  });

  it("should handle null details", async () => {
    const mockReport = createMockReport({
      details: null,
    });

    const repoService = createMockRepoService({
      create: () => Promise.resolve(mockReport),
    });

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "reporter-123",
      reason: "inappropriate",
      details: null,
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(SubmissionReportRepositoryTag, repoService),
    );

    const result = await Effect.runPromise(program);
    expect(result.details).toBeNull();
  });

  it("should verify duplicate check is called with correct params", async () => {
    const checkCalls: Array<[string, string]> = [];

    const repoService = createMockRepoService({
      existsBySubmissionAndReporter: (submissionId, reporterId) => {
        checkCalls.push([submissionId, reporterId]);
        return Promise.resolve(false);
      },
    });

    const input: CreateReportInput = {
      submissionId: "submission-456",
      reporterId: "reporter-789",
      reason: "spam",
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(SubmissionReportRepositoryTag, repoService),
    );

    await Effect.runPromise(program);

    expect(checkCalls).toContainEqual(["submission-456", "reporter-789"]);
  });

  it("should map reason display correctly", async () => {
    const mockReport = createMockReport({
      reason: { value: "harassment" },
      getReasonDisplay: () => "Harassment or Bullying",
    });

    const repoService = createMockRepoService({
      create: () => Promise.resolve(mockReport),
    });

    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "reporter-123",
      reason: "harassment",
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(SubmissionReportRepositoryTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.reason).toBe("harassment");
    expect(result.reasonDisplay).toBe("Harassment or Bullying");
  });

  it("should return validation error for invalid reason", async () => {
    const input: CreateReportInput = {
      submissionId: "submission-123",
      reporterId: "reporter-123",
      reason: "ab", // Too short - must be at least 3 characters
    };

    const program = createReportUseCase(input).pipe(
      Effect.provideService(
        SubmissionReportRepositoryTag,
        createMockRepoService(),
      ),
    );

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(CreateReportValidationError);
    }
  });
});
