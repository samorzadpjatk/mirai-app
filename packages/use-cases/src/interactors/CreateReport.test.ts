import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CreateReportUseCase, type CreateReportInput } from "./CreateReport";
import type { SubmissionReportRepository } from "../ports/SubmissionReportRepository";
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

describe("[UNIT] CreateReportUseCase", () => {
  let useCase: CreateReportUseCase;
  let mockReportRepository: SubmissionReportRepository;

  beforeEach(() => {
    mockReportRepository = {
      existsBySubmissionAndReporter: mock(() => Promise.resolve(false)),
      create: mock(() => Promise.resolve(createMockReport())),
    } as unknown as SubmissionReportRepository;

    useCase = new CreateReportUseCase(mockReportRepository);
  });

  describe("execute", () => {
    it("should create report with minimal input", async () => {
      const input: CreateReportInput = {
        submissionId: "submission-123",
        reporterId: "reporter-123",
        reason: "inappropriate",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("report-123");
        expect(result.value.submissionId).toBe("submission-123");
        expect(result.value.reporterId).toBe("reporter-123");
        expect(result.value.reason).toBe("inappropriate");
        expect(result.value.reasonDisplay).toBe("Inappropriate Content");
      }
    });

    it("should create report with details", async () => {
      const mockReport = createMockReport({
        details: "Detailed explanation of the issue",
      });
      mockReportRepository.create = mock(() => Promise.resolve(mockReport));

      const input: CreateReportInput = {
        submissionId: "submission-123",
        reporterId: "reporter-123",
        reason: "spam",
        details: "Detailed explanation of the issue",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.details).toBe("Detailed explanation of the issue");
      }
    });

    it("should return error when user already reported submission", async () => {
      mockReportRepository.existsBySubmissionAndReporter = mock(() =>
        Promise.resolve(true),
      );

      const input: CreateReportInput = {
        submissionId: "submission-123",
        reporterId: "reporter-123",
        reason: "inappropriate",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("You have already reported this submission");
      }
      expect(mockReportRepository.create).not.toHaveBeenCalled();
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
        mockReportRepository.existsBySubmissionAndReporter = mock(() =>
          Promise.resolve(false),
        );
        const mockReport = createMockReport({
          reason: { value: reason },
          getReasonDisplay: () => reason,
        });
        mockReportRepository.create = mock(() => Promise.resolve(mockReport));

        const input: CreateReportInput = {
          submissionId: "submission-123",
          reporterId: "reporter-123",
          reason,
        };

        const result = await useCase.execute(input);

        expect(result.kind).toBe("ok");
        if (result.kind === "ok") {
          expect(result.value.reason).toBe(reason);
        }
      }
    });

    it("should handle null details", async () => {
      const mockReport = createMockReport({
        details: null,
      });
      mockReportRepository.create = mock(() => Promise.resolve(mockReport));

      const input: CreateReportInput = {
        submissionId: "submission-123",
        reporterId: "reporter-123",
        reason: "inappropriate",
        details: null,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.details).toBeNull();
      }
    });

    it("should verify duplicate check is called with correct params", async () => {
      const input: CreateReportInput = {
        submissionId: "submission-456",
        reporterId: "reporter-789",
        reason: "spam",
      };

      await useCase.execute(input);

      expect(
        mockReportRepository.existsBySubmissionAndReporter,
      ).toHaveBeenCalledWith("submission-456", "reporter-789");
    });

    it("should map reason display correctly", async () => {
      const mockReport = createMockReport({
        reason: { value: "harassment" },
        getReasonDisplay: () => "Harassment or Bullying",
      });
      mockReportRepository.create = mock(() => Promise.resolve(mockReport));

      const input: CreateReportInput = {
        submissionId: "submission-123",
        reporterId: "reporter-123",
        reason: "harassment",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.reason).toBe("harassment");
        expect(result.value.reasonDisplay).toBe("Harassment or Bullying");
      }
    });
  });
});
