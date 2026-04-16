import { describe, it, expect, beforeEach } from "bun:test";
import { getReportsUseCase, type GetReportsInput } from "./list";
import { Effect } from "effect";
import { SubmissionReportGatewayTag } from "../ports/gateway";
import type { SubmissionReport } from "@mirai-app/domain";
import { ReportId } from "@mirai-app/domain";

// Mock SubmissionReport domain object
const createMockReport = (
  overrides?: Partial<SubmissionReport>,
): SubmissionReport =>
  ({
    id: ReportId.create(overrides?.id ?? "report-123"),
    submissionId: "submission-123",
    reporterId: "reporter-123",
    reason: { value: "inappropriate" },
    details: "Test details",
    getReasonDisplay: () => "Inappropriate Content",
    createdAt: new Date("2024-01-01"),
    reporter: {
      participantId: "participant-123",
      userId: "user-123",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      hasAvatar: true,
    },
    ...overrides,
  }) as SubmissionReport;

// Helper to create a mock repository service for Effect
const createMockRepoService = (overrides?: {
  findBySubmissionId?: (submissionId: string) => Promise<SubmissionReport[]>;
  countBySubmissionId?: (submissionId: string) => Promise<number>;
}) => ({
  findBySubmissionId: (submissionId: string) =>
    Effect.promise(() =>
      overrides?.findBySubmissionId
        ? overrides.findBySubmissionId(submissionId)
        : Promise.resolve([]),
    ),
  countBySubmissionId: (submissionId: string) =>
    Effect.promise(() =>
      overrides?.countBySubmissionId
        ? overrides.countBySubmissionId(submissionId)
        : Promise.resolve(0),
    ),
  create: () => Effect.promise(() => Promise.resolve(createMockReport())),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findByReporterId: () => Effect.promise(() => Promise.resolve([])),
  findByReason: () => Effect.promise(() => Promise.resolve([])),
  findAll: () => Effect.promise(() => Promise.resolve([])),
  delete: () => Effect.promise(() => Promise.resolve()),
  exists: () => Effect.promise(() => Promise.resolve(false)),
  existsBySubmissionAndReporter: () =>
    Effect.promise(() => Promise.resolve(false)),
});

describe("[UNIT] getReportsUseCase (Effect)", () => {
  it("should return empty reports when none exist", async () => {
    const input: GetReportsInput = { submissionId: "submission-123" };

    const program = getReportsUseCase(input).pipe(
      Effect.provideService(
        SubmissionReportGatewayTag,
        createMockRepoService(),
      ),
    );

    const result = await Effect.runPromise(program);

    expect(result.reports).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should return reports with reporter info", async () => {
    const mockReports = [
      createMockReport({
        id: ReportId.create("report-1"),
        submissionId: "submission-123",
        reporterId: "reporter-1",
        reason: { value: "spam" },
        getReasonDisplay: () => "Spam",
        reporter: {
          participantId: "participant-1",
          userId: "user-1",
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          hasAvatar: true,
        },
      }),
      createMockReport({
        id: ReportId.create("report-2"),
        submissionId: "submission-123",
        reporterId: "reporter-2",
        reason: { value: "inappropriate" },
        getReasonDisplay: () => "Inappropriate Content",
        reporter: {
          participantId: "participant-2",
          userId: "user-2",
          firstName: "Bob",
          lastName: "Jones",
          email: "bob@example.com",
          hasAvatar: false,
        },
      }),
    ];

    const repoService = createMockRepoService({
      findBySubmissionId: () => Promise.resolve(mockReports),
      countBySubmissionId: () => Promise.resolve(2),
    });

    const input: GetReportsInput = { submissionId: "submission-123" };
    const program = getReportsUseCase(input).pipe(
      Effect.provideService(SubmissionReportGatewayTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.reports).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    const report1 = result.reports[0];
    expect(report1.id).toBe("report-1");
    expect(report1.reason).toBe("spam");
    expect(report1.reasonDisplay).toBe("Spam");
    expect(report1.reporter.id).toBe("participant-1");
    expect(report1.reporter.user.firstName).toBe("Alice");
    expect(report1.reporter.user.lastName).toBe("Smith");
    expect(report1.reporter.user.email).toBe("alice@example.com");
    expect(report1.reporter.user.hasAvatar).toBe(true);

    const report2 = result.reports[1];
    expect(report2.id).toBe("report-2");
    expect(report2.reporter.user.hasAvatar).toBe(false);
  });

  it("should handle report without reporter info", async () => {
    const mockReport = createMockReport({
      id: ReportId.create("report-1"),
      reporter: undefined,
    });

    const repoService = createMockRepoService({
      findBySubmissionId: () => Promise.resolve([mockReport]),
      countBySubmissionId: () => Promise.resolve(1),
    });

    const input: GetReportsInput = { submissionId: "submission-123" };
    const program = getReportsUseCase(input).pipe(
      Effect.provideService(SubmissionReportGatewayTag, repoService),
    );

    const result = await Effect.runPromise(program);

    const report = result.reports[0];
    expect(report.reporter.id).toBe("reporter-123"); // falls back to reporterId
    expect(report.reporter.user.firstName).toBe("");
    expect(report.reporter.user.email).toBeNull();
  });

  it("should handle null email in reporter", async () => {
    const mockReport = createMockReport({
      reporter: {
        participantId: "participant-1",
        userId: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: null,
        hasAvatar: true,
      },
    });

    const repoService = createMockRepoService({
      findBySubmissionId: () => Promise.resolve([mockReport]),
      countBySubmissionId: () => Promise.resolve(1),
    });

    const input: GetReportsInput = { submissionId: "submission-123" };
    const program = getReportsUseCase(input).pipe(
      Effect.provideService(SubmissionReportGatewayTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.reports[0].reporter.user.email).toBeNull();
  });

  it("should handle report with null details", async () => {
    const mockReport = createMockReport({
      details: null,
    });

    const repoService = createMockRepoService({
      findBySubmissionId: () => Promise.resolve([mockReport]),
      countBySubmissionId: () => Promise.resolve(1),
    });

    const input: GetReportsInput = { submissionId: "submission-123" };
    const program = getReportsUseCase(input).pipe(
      Effect.provideService(SubmissionReportGatewayTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.reports[0].details).toBeNull();
  });

  it("should call repository with correct submissionId", async () => {
    const findCalls: string[] = [];
    const countCalls: string[] = [];

    const repoService = createMockRepoService({
      findBySubmissionId: (id) => {
        findCalls.push(id);
        return Promise.resolve([]);
      },
      countBySubmissionId: (id) => {
        countCalls.push(id);
        return Promise.resolve(0);
      },
    });

    const input: GetReportsInput = { submissionId: "submission-456" };

    const program = getReportsUseCase(input).pipe(
      Effect.provideService(SubmissionReportGatewayTag, repoService),
    );

    await Effect.runPromise(program);

    expect(findCalls).toContain("submission-456");
    expect(countCalls).toContain("submission-456");
  });

  it("should handle multiple reports with correct total count", async () => {
    const mockReports = [
      createMockReport({ id: ReportId.create("report-1") }),
      createMockReport({ id: ReportId.create("report-2") }),
      createMockReport({ id: ReportId.create("report-3") }),
    ];

    const repoService = createMockRepoService({
      findBySubmissionId: () => Promise.resolve(mockReports),
      countBySubmissionId: () => Promise.resolve(10), // More than returned
    });

    const input: GetReportsInput = { submissionId: "submission-123" };
    const program = getReportsUseCase(input).pipe(
      Effect.provideService(SubmissionReportGatewayTag, repoService),
    );

    const result = await Effect.runPromise(program);

    expect(result.reports).toHaveLength(3);
    expect(result.totalCount).toBe(10);
  });
});
