import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import {
  SubmissionReport,
  calculateReportStatistics,
  groupReportsBySubmission,
} from "./SubmissionReport";
import { ReportId } from "../value-objects/ReportId";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] SubmissionReport", () => {
  describe("create", () => {
    it("should create with valid data", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.submissionId).toBe("sub-123");
      expect(report.reporterId).toBe("reporter-456");
      expect(report.reason.value).toBe("INAPPROPRIATE");
      expect(report.details).toBeNull();
      expect(report.createdAt).toBeInstanceOf(Date);
    });

    it("should create with details", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "CHEATING",
          details: "The submission is fake",
        }),
      );

      expect(report.details).toBe("The submission is fake");
      expect(report.hasDetails()).toBe(true);
    });

    it("should trim whitespace from details", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "SPAM",
          details: "  Some details here  ",
        }),
      );

      expect(report.details).toBe("Some details here");
    });

    it("should reject empty submissionId", () => {
      const effect = SubmissionReport.create({
        submissionId: "",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty reporterId", () => {
      const effect = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "",
        reason: "INAPPROPRIATE",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject too short reason", () => {
      const effect = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "AB", // Less than 3 characters
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject details exceeding max length", () => {
      const effect = SubmissionReport.create({
        submissionId: "sub-123",
        reporterId: "reporter-456",
        reason: "INAPPROPRIATE",
        details: "a".repeat(2001),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should accept empty details (converted to null)", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
          details: "   ",
        }),
      );

      expect(report.details).toBeNull();
      expect(report.hasDetails()).toBe(false);
    });

    it("should accept provided ID", () => {
      const providedId = "custom-id" as ReportId;
      const report = Effect.runSync(
        SubmissionReport.create({
          id: providedId,
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.id).toBe(providedId);
    });
  });

  describe("isForSubmission", () => {
    it("should return true for matching submission", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.isForSubmission("sub-123")).toBe(true);
      expect(report.isForSubmission("other-sub")).toBe(false);
    });
  });

  describe("isFiledBy", () => {
    it("should return true for matching reporter", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.isFiledBy("reporter-456")).toBe(true);
      expect(report.isFiledBy("other-reporter")).toBe(false);
    });
  });

  describe("hasDetails", () => {
    it("should return true when details exist", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
          details: "Some details",
        }),
      );

      expect(report.hasDetails()).toBe(true);
    });

    it("should return false when details are null", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.hasDetails()).toBe(false);
    });
  });

  describe("hasReporterInfo", () => {
    it("should return false when reporter is null", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.hasReporterInfo()).toBe(false);
    });
  });

  describe("getReasonDisplay", () => {
    it("should return display text for reason", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.getReasonDisplay()).toBeDefined();
    });
  });

  describe("matchesReason", () => {
    it("should match reason correctly", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      expect(report.matchesReason("INAPPROPRIATE")).toBe(true);
      expect(report.matchesReason("inappropriate")).toBe(true);
      expect(report.matchesReason("CHEATING")).toBe(false);
    });
  });

  describe("withReporterInfo", () => {
    it("should attach reporter info", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      const withInfo = report.withReporterInfo({
        reporterId: "reporter-456",
        participantId: "part-789",
        userId: "user-101",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        hasAvatar: true,
      });

      expect(withInfo.hasReporterInfo()).toBe(true);
      expect(withInfo.reporter?.firstName).toBe("John");
    });
  });

  describe("withReporterEmail", () => {
    it("should update reporter email", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      const withInfo = report.withReporterInfo({
        reporterId: "reporter-456",
        participantId: "part-789",
        userId: "user-101",
        firstName: "John",
        lastName: "Doe",
        email: null,
        hasAvatar: true,
      });

      const withEmail = withInfo.withReporterEmail("john@example.com");
      expect(withEmail.reporter?.email).toBe("john@example.com");
    });

    it("should return same report if no reporter info", () => {
      const report = Effect.runSync(
        SubmissionReport.create({
          submissionId: "sub-123",
          reporterId: "reporter-456",
          reason: "INAPPROPRIATE",
        }),
      );

      const same = report.withReporterEmail("test@example.com");
      expect(same).toBe(report);
    });
  });

  describe("calculateReportStatistics", () => {
    it("should calculate statistics for reports", () => {
      const reports = [
        Effect.runSync(
          SubmissionReport.create({
            submissionId: "sub-1",
            reporterId: "rep-1",
            reason: "INAPPROPRIATE",
            details: "Details",
          }),
        ),
        Effect.runSync(
          SubmissionReport.create({
            submissionId: "sub-1",
            reporterId: "rep-2",
            reason: "INAPPROPRIATE",
          }),
        ),
        Effect.runSync(
          SubmissionReport.create({
            submissionId: "sub-2",
            reporterId: "rep-3",
            reason: "CHEATING",
            details: "Cheating details",
          }),
        ),
      ];

      const stats = calculateReportStatistics(reports);

      expect(stats.totalCount).toBe(3);
      expect(stats.byReason["INAPPROPRIATE"]).toBe(2);
      expect(stats.byReason["CHEATING"]).toBe(1);
      expect(stats.uniqueSubmitters).toBe(3);
      expect(stats.reportsWithDetails).toBe(2);
    });

    it("should handle empty array", () => {
      const stats = calculateReportStatistics([]);

      expect(stats.totalCount).toBe(0);
      expect(stats.uniqueSubmitters).toBe(0);
      expect(stats.reportsWithDetails).toBe(0);
    });
  });

  describe("groupReportsBySubmission", () => {
    it("should group reports by submission ID", () => {
      const reports = [
        Effect.runSync(
          SubmissionReport.create({
            submissionId: "sub-1",
            reporterId: "rep-1",
            reason: "INAPPROPRIATE",
          }),
        ),
        Effect.runSync(
          SubmissionReport.create({
            submissionId: "sub-1",
            reporterId: "rep-2",
            reason: "CHEATING",
          }),
        ),
        Effect.runSync(
          SubmissionReport.create({
            submissionId: "sub-2",
            reporterId: "rep-3",
            reason: "SPAM",
          }),
        ),
      ];

      const grouped = groupReportsBySubmission(reports);

      expect(grouped.get("sub-1")?.length).toBe(2);
      expect(grouped.get("sub-2")?.length).toBe(1);
    });

    it("should handle empty array", () => {
      const grouped = groupReportsBySubmission([]);

      expect(grouped.size).toBe(0);
    });
  });
});
