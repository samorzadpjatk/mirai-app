import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetReportsUseCase, type GetReportsInput } from "./GetReports";
import type { SubmissionReportRepository } from "../ports/SubmissionReportRepository";
import type { SubmissionReport } from "@mirai-app/domain";

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

describe("[UNIT] GetReportsUseCase", () => {
  let useCase: GetReportsUseCase;
  let mockReportRepository: SubmissionReportRepository;

  beforeEach(() => {
    mockReportRepository = {
      findBySubmissionId: mock(() => Promise.resolve([])),
      countBySubmissionId: mock(() => Promise.resolve(0)),
    } as unknown as SubmissionReportRepository;

    useCase = new GetReportsUseCase(mockReportRepository);
  });

  describe("execute", () => {
    it("should return empty reports when none exist", async () => {
      const input: GetReportsInput = { submissionId: "submission-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reports).toEqual([]);
        expect(result.value.totalCount).toBe(0);
      }
    });

    it("should return reports with reporter info", async () => {
      const mockReports = [
        createMockReport({
          id: "report-1",
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
          id: "report-2",
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

      mockReportRepository.findBySubmissionId = mock(() =>
        Promise.resolve(mockReports),
      );
      mockReportRepository.countBySubmissionId = mock(() => Promise.resolve(2));

      const input: GetReportsInput = { submissionId: "submission-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reports).toHaveLength(2);
        expect(result.value.totalCount).toBe(2);

        const report1 = result.value.reports[0];
        expect(report1.id).toBe("report-1");
        expect(report1.reason).toBe("spam");
        expect(report1.reasonDisplay).toBe("Spam");
        expect(report1.reporter.id).toBe("participant-1");
        expect(report1.reporter.user.firstName).toBe("Alice");
        expect(report1.reporter.user.lastName).toBe("Smith");
        expect(report1.reporter.user.email).toBe("alice@example.com");
        expect(report1.reporter.user.hasAvatar).toBe(true);

        const report2 = result.value.reports[1];
        expect(report2.id).toBe("report-2");
        expect(report2.reporter.user.hasAvatar).toBe(false);
      }
    });

    it("should handle report without reporter info", async () => {
      const mockReport = createMockReport({
        id: "report-1",
        reporter: undefined,
      });

      mockReportRepository.findBySubmissionId = mock(() =>
        Promise.resolve([mockReport]),
      );
      mockReportRepository.countBySubmissionId = mock(() => Promise.resolve(1));

      const input: GetReportsInput = { submissionId: "submission-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const report = result.value.reports[0];
        expect(report.reporter.id).toBe("reporter-123"); // falls back to reporterId
        expect(report.reporter.user.firstName).toBe("");
        expect(report.reporter.user.email).toBeNull();
      }
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

      mockReportRepository.findBySubmissionId = mock(() =>
        Promise.resolve([mockReport]),
      );
      mockReportRepository.countBySubmissionId = mock(() => Promise.resolve(1));

      const input: GetReportsInput = { submissionId: "submission-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reports[0].reporter.user.email).toBeNull();
      }
    });

    it("should handle report with null details", async () => {
      const mockReport = createMockReport({
        details: null,
      });

      mockReportRepository.findBySubmissionId = mock(() =>
        Promise.resolve([mockReport]),
      );
      mockReportRepository.countBySubmissionId = mock(() => Promise.resolve(1));

      const input: GetReportsInput = { submissionId: "submission-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reports[0].details).toBeNull();
      }
    });

    it("should call repository with correct submissionId", async () => {
      const input: GetReportsInput = { submissionId: "submission-456" };

      await useCase.execute(input);

      expect(mockReportRepository.findBySubmissionId).toHaveBeenCalledWith(
        "submission-456",
      );
      expect(mockReportRepository.countBySubmissionId).toHaveBeenCalledWith(
        "submission-456",
      );
    });

    it("should handle multiple reports with correct total count", async () => {
      const mockReports = [
        createMockReport({ id: "report-1" }),
        createMockReport({ id: "report-2" }),
        createMockReport({ id: "report-3" }),
      ];

      mockReportRepository.findBySubmissionId = mock(() =>
        Promise.resolve(mockReports),
      );
      mockReportRepository.countBySubmissionId = mock(() =>
        Promise.resolve(10),
      ); // More than returned

      const input: GetReportsInput = { submissionId: "submission-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reports).toHaveLength(3);
        expect(result.value.totalCount).toBe(10);
      }
    });
  });
});
