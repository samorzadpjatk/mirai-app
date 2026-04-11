import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SubmissionReportController } from "../submission-report";
import type { SubmissionReportRepository } from "@mirai-app/use-cases";
import { SubmissionReport } from "@mirai-app/domain";

// Mock SubmissionReport
const createMockReport = (
  overrides?: Partial<SubmissionReport>,
): SubmissionReport =>
  ({
    id: "report-123",
    submissionId: "submission-123",
    reporterId: "user-123",
    reason: { value: "inappropriate" },
    details: "Test details",
    getReasonDisplay: () => "Inappropriate Content",
    createdAt: new Date("2024-01-01"),
    ...overrides,
  }) as SubmissionReport;

describe("[UNIT] SubmissionReportController", () => {
  let controller: SubmissionReportController;
  let mockReportRepository: SubmissionReportRepository;

  beforeEach(() => {
    mockReportRepository = {
      findById: mock(() => Promise.resolve(createMockReport())),
      findBySubmissionId: mock(() => Promise.resolve([createMockReport()])),
      findByReporterId: mock(() => Promise.resolve([createMockReport()])),
      create: mock((r: SubmissionReport) => Promise.resolve(r)),
      delete: mock(() => Promise.resolve()),
      exists: mock(() => Promise.resolve(true)),
      existsBySubmissionAndReporter: mock(() => Promise.resolve(false)),
      countBySubmissionId: mock(() => Promise.resolve(1)),
    } as unknown as SubmissionReportRepository;

    controller = new SubmissionReportController(mockReportRepository);
  });

  describe("getById", () => {
    it("should return report by ID", async () => {
      const result = await controller.getById({ id: "report-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("report-123");
      }
    });

    it("should return error when report not found", async () => {
      mockReportRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "report-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getBySubmissionId", () => {
    it("should return reports for submission", async () => {
      const result = await controller.getBySubmissionId({
        submissionId: "submission-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(1);
        expect(result.data.totalCount).toBe(1);
      }
    });
  });

  describe("create", () => {
    it("should create report with valid input", async () => {
      const input = {
        submissionId: "submission-123",
        reporterId: "user-123",
        reason: "inappropriate",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe("submission-123");
      }
    });

    it("should return error when user already reported", async () => {
      mockReportRepository.existsBySubmissionAndReporter = mock(() =>
        Promise.resolve(true),
      );

      const result = await controller.create({
        submissionId: "submission-123",
        reporterId: "user-123",
        reason: "inappropriate",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already reported");
      }
    });

    it("should support details", async () => {
      const input = {
        submissionId: "submission-123",
        reporterId: "user-123",
        reason: "spam",
        details: "This is spam content",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete report", async () => {
      const result = await controller.delete({ id: "report-123" });

      expect(result.success).toBe(true);
    });

    it("should return error when report not found", async () => {
      mockReportRepository.exists = mock(() => Promise.resolve(false));

      const result = await controller.delete({ id: "report-123" });

      expect(result.success).toBe(false);
    });
  });
});
