import { describe, it, expect } from "bun:test";
import {
  SubmissionReport,
  calculateReportStatistics,
  groupReportsBySubmission,
} from "./SubmissionReport";
import { ReportId } from "../value-objects/ReportId";

describe("[UNIT] SubmissionReport", () => {
  describe("create", () => {
    it("should create with valid data", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.submissionId).toBe("sub-123");
        expect(result.value.reporterId).toBe("reporter-456");
        expect(result.value.reason.value).toBe("INAPPROPRIATE");
        expect(result.value.details).toBeNull();
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should create with details", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "CHEATING",
        details: "The submission is fake",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.details).toBe("The submission is fake");
        expect(result.value.hasDetails()).toBe(true);
      }
    });

    it("should trim whitespace from details", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "SPAM",
        details: "  Some details here  ",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.details).toBe("Some details here");
      }
    });

    it("should convert empty details to null", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "OTHER",
        details: "   ",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.details).toBeNull();
        expect(result.value.hasDetails()).toBe(false);
      }
    });

    it("should reject empty submissionId", () => {
      const result = SubmissionReport.create({
        submissionId: "",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toContain("submissionId");
      }
    });

    it("should reject empty reporterId", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "",
        reason: "INAPPROPRIATE",
      });

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toContain("reporterId");
      }
    });

    it("should reject empty reason", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "",
      });

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toContain("reason");
      }
    });

    it("should reject details over 2000 characters", () => {
      const longDetails = "a".repeat(2001);
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
        details: longDetails,
      });

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toContain("2000");
      }
    });

    it("should accept custom reason with minimum length", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "Custom long reason here",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.reason.value).toBe("CUSTOM LONG REASON HERE");
      }
    });

    it("should reject short custom reason", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "AB",
      });

      expect(result.isError()).toBe(true);
      if (result.isError()) {
        expect(result.error).toContain("3 characters");
      }
    });

    it("should use provided ID", () => {
      const id = ReportId.create("report-123");
      const result = SubmissionReport.create({
        id,
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id).toBe(id);
      }
    });

    it("should generate ID if not provided", () => {
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.id).toBeDefined();
        expect(typeof result.value.id).toBe("string");
      }
    });

    it("should use provided createdAt", () => {
      const createdAt = new Date("2024-01-15");
      const result = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
        createdAt,
      });

      expect(result.isSuccess()).toBe(true);
      if (result.isSuccess()) {
        expect(result.value.createdAt).toEqual(createdAt);
      }
    });
  });

  describe("isForSubmission", () => {
    it("should return true for matching submission", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        expect(report.value.isForSubmission("sub-123")).toBe(true);
        expect(report.value.isForSubmission("sub-456")).toBe(false);
      }
    });
  });

  describe("isFiledBy", () => {
    it("should return true for matching reporter", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        expect(report.value.isFiledBy("reporter-456")).toBe(true);
        expect(report.value.isFiledBy("reporter-789")).toBe(false);
      }
    });
  });

  describe("hasReporterInfo", () => {
    it("should return false when no reporter info", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        expect(report.value.hasReporterInfo()).toBe(false);
      }
    });

    it("should return true when reporter info provided", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
        reporter: {
          reporterId: "reporter-456",
          participantId: "part-789",
          userId: "user-abc",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          hasAvatar: true,
        },
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        expect(report.value.hasReporterInfo()).toBe(true);
      }
    });
  });

  describe("withReporterInfo", () => {
    it("should attach reporter info", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        const reporter = {
          reporterId: "reporter-456",
          participantId: "part-789",
          userId: "user-abc",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          hasAvatar: true,
        };
        const updated = report.value.withReporterInfo(reporter);

        expect(updated.hasReporterInfo()).toBe(true);
        expect(updated.reporter?.firstName).toBe("John");
      }
    });
  });

  describe("withReporterEmail", () => {
    it("should update reporter email", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
        reporter: {
          reporterId: "reporter-456",
          participantId: "part-789",
          userId: "user-abc",
          firstName: "John",
          lastName: "Doe",
          email: null,
          hasAvatar: true,
        },
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        const updated = report.value.withReporterEmail("john@example.com");

        expect(updated.reporter?.email).toBe("john@example.com");
      }
    });

    it("should return same instance when no reporter info", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        const updated = report.value.withReporterEmail("john@example.com");
        expect(updated).toBe(report.value);
      }
    });
  });

  describe("getReasonDisplay", () => {
    it("should return display text for standard reasons", () => {
      const reasons = [
        { input: "INAPPROPRIATE", expected: "Inappropriate Content" },
        { input: "CHEATING", expected: "Cheating" },
        { input: "SPAM", expected: "Spam" },
        { input: "WRONG_SUBMISSION", expected: "Wrong Submission" },
        { input: "OTHER", expected: "Other" },
      ];

      for (const { input, expected } of reasons) {
        const report = SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: input,
        });

        expect(report.isSuccess()).toBe(true);
        if (report.isSuccess()) {
          expect(report.value.getReasonDisplay()).toBe(expected);
        }
      }
    });

    it("should return raw value for custom reasons", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "CUSTOM REASON HERE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        expect(report.value.getReasonDisplay()).toBe("CUSTOM REASON HERE");
      }
    });
  });

  describe("matchesReason", () => {
    it("should match reason case-insensitively", () => {
      const report = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      expect(report.isSuccess()).toBe(true);
      if (report.isSuccess()) {
        expect(report.value.matchesReason("inappropriate")).toBe(true);
        expect(report.value.matchesReason("INAPPROPRIATE")).toBe(true);
        expect(report.value.matchesReason("cheating")).toBe(false);
      }
    });
  });
});

describe("[UNIT] calculateReportStatistics", () => {
  it("should calculate empty statistics for empty array", () => {
    const stats = calculateReportStatistics([]);

    expect(stats.totalCount).toBe(0);
    expect(stats.byReason).toEqual({});
    expect(stats.uniqueSubmitters).toBe(0);
    expect(stats.reportsWithDetails).toBe(0);
  });

  it("should calculate statistics for multiple reports", () => {
    const reports = [
      SubmissionReport.create({
        submissionId: "sub-1",
        reporterId: "rep-1",
        reason: "INAPPROPRIATE",
        details: "Details here",
      }),
      SubmissionReport.create({
        submissionId: "sub-2",
        reporterId: "rep-1",
        reason: "INAPPROPRIATE",
      }),
      SubmissionReport.create({
        submissionId: "sub-3",
        reporterId: "rep-2",
        reason: "CHEATING",
        details: "Other details",
      }),
    ];

    const validReports = reports
      .filter((r) => r.isSuccess())
      .map((r) => r.value!);
    const stats = calculateReportStatistics(validReports);

    expect(stats.totalCount).toBe(3);
    expect(stats.byReason).toEqual({
      INAPPROPRIATE: 2,
      CHEATING: 1,
    });
    expect(stats.uniqueSubmitters).toBe(2);
    expect(stats.reportsWithDetails).toBe(2);
  });
});

describe("[UNIT] groupReportsBySubmission", () => {
  it("should group reports by submission ID", () => {
    const reports = [
      SubmissionReport.create({
        submissionId: "sub-1",
        reporterId: "rep-1",
        reason: "INAPPROPRIATE",
      }),
      SubmissionReport.create({
        submissionId: "sub-1",
        reporterId: "rep-2",
        reason: "CHEATING",
      }),
      SubmissionReport.create({
        submissionId: "sub-2",
        reporterId: "rep-3",
        reason: "SPAM",
      }),
    ];

    const validReports = reports
      .filter((r) => r.isSuccess())
      .map((r) => r.value!);
    const grouped = groupReportsBySubmission(validReports);

    expect(grouped.size).toBe(2);
    expect(grouped.get("sub-1")?.length).toBe(2);
    expect(grouped.get("sub-2")?.length).toBe(1);
  });

  it("should return empty map for empty array", () => {
    const grouped = groupReportsBySubmission([]);
    expect(grouped.size).toBe(0);
  });
});
