import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  SubmissionReport,
  calculateReportStatistics,
  groupReportsBySubmission,
} from "./submission-report";
import type { ReporterInfo } from "./submission-report";
import { ValidationError } from "../../system/errors";
import { ReportId } from "../value-objects/report-id";

const validSubmissionId = "submission-123";
const validReporterId = "reporter-456";
const validReason = "INAPPROPRIATE";

const createMinimalProps = () => ({
  submissionId: validSubmissionId,
  reporterId: validReporterId,
  reason: validReason,
});

const createValidReport = async (
  overrides: Partial<Parameters<typeof SubmissionReport.create>[0]> = {},
): Promise<SubmissionReport> => {
  const props = { ...createMinimalProps(), ...overrides };
  return Effect.runPromise(SubmissionReport.create(props));
};

const createMockReporter = (): ReporterInfo => ({
  reporterId: validReporterId,
  participantId: "participant-789",
  userId: "user-abc",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  hasAvatar: true,
});

describe("[UNIT] SubmissionReport", () => {
  describe("[UNIT] SubmissionReport.create", () => {
    describe("creates entity with minimal props", () => {
      it("creates with submissionId, reporterId, and reason", async () => {
        const report = await createValidReport();
        expect(report.submissionId).toBe(validSubmissionId);
        expect(report.reporterId).toBe(validReporterId);
        expect(report.reason.value).toBe(validReason);
      });

      it("generates id when not provided", async () => {
        const report = await createValidReport();
        expect(report.id).toBeDefined();
        expect(typeof report.id).toBe("string");
        expect(report.id.length).toBeGreaterThan(0);
      });

      it("uses provided id when specified", async () => {
        const customId = ReportId.unsafeCreate("report-789");
        const report = await createValidReport({ id: customId });
        expect(report.id).toBe(customId);
      });

      it("defaults details to null", async () => {
        const report = await createValidReport();
        expect(report.details).toBeNull();
      });

      it("defaults createdAt to current date", async () => {
        const before = new Date();
        const report = await createValidReport();
        const after = new Date();
        expect(report.createdAt).toBeInstanceOf(Date);
        expect(report.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(report.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });

      it("uses provided createdAt when specified", async () => {
        const customDate = new Date("2024-01-15");
        const report = await createValidReport({ createdAt: customDate });
        expect(report.createdAt).toBe(customDate);
      });

      it("defaults reporter to null", async () => {
        const report = await createValidReport();
        expect(report.reporter).toBeNull();
      });
    });

    describe("creates entity with all props", () => {
      it("creates with all optional fields populated", async () => {
        const customId = ReportId.unsafeCreate("report-xyz");
        const createdAt = new Date("2024-03-20");
        const reporter = createMockReporter();
        const details = "This content is inappropriate because...";

        const report = await Effect.runPromise(
          SubmissionReport.create({
            id: customId,
            submissionId: validSubmissionId,
            reporterId: validReporterId,
            reason: "SPAM",
            details,
            createdAt,
            reporter,
          }),
        );

        expect(report.id).toBe(customId);
        expect(report.submissionId).toBe(validSubmissionId);
        expect(report.reporterId).toBe(validReporterId);
        expect(report.reason.value).toBe("SPAM");
        expect(report.details).toBe(details);
        expect(report.createdAt).toBe(createdAt);
        expect(report.reporter).toEqual(reporter);
      });
    });

    describe("validation errors", () => {
      it("fails with ValidationError for empty submissionId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              submissionId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe("submissionId is required");
          expect(result.left.field).toBe("general");
        }
      });

      it("fails with ValidationError for whitespace-only submissionId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              submissionId: "   ",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe("submissionId is required");
        }
      });

      it("fails with ValidationError for empty reporterId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              reporterId: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe("reporterId is required");
          expect(result.left.field).toBe("general");
        }
      });

      it("fails with ValidationError for whitespace-only reporterId", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              reporterId: "   ",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe("reporterId is required");
        }
      });

      it("fails with ValidationError for empty reason", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              reason: "",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe("Report reason is required");
          expect(result.left.field).toBe("reason");
        }
      });

      it("fails with ValidationError for custom reason less than 3 characters", async () => {
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              reason: "AB",
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe(
            "Report reason must be at least 3 characters",
          );
          expect(result.left.field).toBe("reason");
        }
      });

      it("fails with ValidationError for details exceeding 2000 characters", async () => {
        const longDetails = "a".repeat(2001);
        const result = await Effect.runPromise(
          Effect.either(
            SubmissionReport.create({
              ...createMinimalProps(),
              details: longDetails,
            }),
          ),
        );
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.message).toBe(
            "details must be at most 2000 characters",
          );
          expect(result.left.field).toBe("general");
        }
      });

      it("accepts custom reason with 3+ characters", async () => {
        const report = await Effect.runPromise(
          SubmissionReport.create({
            ...createMinimalProps(),
            reason: "CUSTOM_REASON",
          }),
        );
        expect(report.reason.value).toBe("CUSTOM_REASON");
      });

      it("accepts all standard reasons", async () => {
        const standardReasons = [
          "INAPPROPRIATE",
          "CHEATING",
          "SPAM",
          "WRONG_SUBMISSION",
          "OTHER",
        ];
        for (const reason of standardReasons) {
          const report = await Effect.runPromise(
            SubmissionReport.create({
              ...createMinimalProps(),
              reason,
            }),
          );
          expect(report.reason.value).toBe(reason);
        }
      });
    });

    describe("trims input values", () => {
      it("trims submissionId", async () => {
        const report = await Effect.runPromise(
          SubmissionReport.create({
            ...createMinimalProps(),
            submissionId: "  submission-123  ",
          }),
        );
        expect(report.submissionId).toBe("submission-123");
      });

      it("trims reporterId", async () => {
        const report = await Effect.runPromise(
          SubmissionReport.create({
            ...createMinimalProps(),
            reporterId: "  reporter-456  ",
          }),
        );
        expect(report.reporterId).toBe("reporter-456");
      });

      it("trims details", async () => {
        const report = await Effect.runPromise(
          SubmissionReport.create({
            ...createMinimalProps(),
            details: "  Some details  ",
          }),
        );
        expect(report.details).toBe("Some details");
      });

      it("converts empty/whitespace-only details to null", async () => {
        const report = await Effect.runPromise(
          SubmissionReport.create({
            ...createMinimalProps(),
            details: "   ",
          }),
        );
        expect(report.details).toBeNull();
      });
    });
  });

  describe("[UNIT] query methods", () => {
    describe("isForSubmission", () => {
      it("returns true when submissionId matches", async () => {
        const report = await createValidReport({ submissionId: "sub-123" });
        expect(report.isForSubmission("sub-123")).toBe(true);
      });

      it("returns false when submissionId does not match", async () => {
        const report = await createValidReport({ submissionId: "sub-123" });
        expect(report.isForSubmission("sub-456")).toBe(false);
      });
    });

    describe("isFiledBy", () => {
      it("returns true when reporterId matches", async () => {
        const report = await createValidReport({ reporterId: "rep-123" });
        expect(report.isFiledBy("rep-123")).toBe(true);
      });

      it("returns false when reporterId does not match", async () => {
        const report = await createValidReport({ reporterId: "rep-123" });
        expect(report.isFiledBy("rep-456")).toBe(false);
      });
    });

    describe("hasDetails", () => {
      it("returns true when details is set", async () => {
        const report = await createValidReport({ details: "Some details" });
        expect(report.hasDetails()).toBe(true);
      });

      it("returns false when details is null", async () => {
        const report = await createValidReport({ details: null });
        expect(report.hasDetails()).toBe(false);
      });

      it("returns false when details is empty", async () => {
        const report = await createValidReport();
        expect(report.hasDetails()).toBe(false);
      });
    });

    describe("hasReporterInfo", () => {
      it("returns true when reporter is set", async () => {
        const report = await createValidReport({
          reporter: createMockReporter(),
        });
        expect(report.hasReporterInfo()).toBe(true);
      });

      it("returns false when reporter is null", async () => {
        const report = await createValidReport({ reporter: null });
        expect(report.hasReporterInfo()).toBe(false);
      });

      it("returns false when reporter is not provided", async () => {
        const report = await createValidReport();
        expect(report.hasReporterInfo()).toBe(false);
      });
    });

    describe("getReasonDisplay", () => {
      it("returns display text for standard reasons", async () => {
        const displayMap: Record<string, string> = {
          INAPPROPRIATE: "Inappropriate Content",
          CHEATING: "Cheating",
          SPAM: "Spam",
          WRONG_SUBMISSION: "Wrong Submission",
          OTHER: "Other",
        };

        for (const [reason, expectedDisplay] of Object.entries(displayMap)) {
          const report = await createValidReport({ reason });
          expect(report.getReasonDisplay()).toBe(expectedDisplay);
        }
      });

      it("returns raw value for custom reasons", async () => {
        const report = await createValidReport({ reason: "CUSTOM_REASON" });
        expect(report.getReasonDisplay()).toBe("CUSTOM_REASON");
      });
    });

    describe("matchesReason", () => {
      it("returns true when reason matches (case insensitive)", async () => {
        const report = await createValidReport({ reason: "SPAM" });
        expect(report.matchesReason("spam")).toBe(true);
        expect(report.matchesReason("SPAM")).toBe(true);
        expect(report.matchesReason("Spam")).toBe(true);
      });

      it("returns false when reason does not match", async () => {
        const report = await createValidReport({ reason: "SPAM" });
        expect(report.matchesReason("inappropriate")).toBe(false);
      });
    });
  });

  describe("[UNIT] withReporterInfo", () => {
    it("creates copy with reporter info attached", async () => {
      const report = await createValidReport();
      const reporter = createMockReporter();
      const updated = report.withReporterInfo(reporter);

      expect(updated.reporter).toEqual(reporter);
      expect(updated.hasReporterInfo()).toBe(true);
    });

    it("returns new instance (immutable)", async () => {
      const report = await createValidReport();
      const reporter = createMockReporter();
      const updated = report.withReporterInfo(reporter);

      expect(updated).not.toBe(report);
      expect(report.reporter).toBeNull();
    });

    it("preserves other properties", async () => {
      const customId = ReportId.unsafeCreate("report-abc");
      const report = await Effect.runPromise(
        SubmissionReport.create({
          id: customId,
          submissionId: "sub-123",
          reporterId: "rep-456",
          reason: "CHEATING",
          details: "Some details",
          createdAt: new Date("2024-01-01"),
        }),
      );

      const reporter = createMockReporter();
      const updated = report.withReporterInfo(reporter);

      expect(updated.id).toBe(customId);
      expect(updated.submissionId).toBe("sub-123");
      expect(updated.reporterId).toBe("rep-456");
      expect(updated.reason.value).toBe("CHEATING");
      expect(updated.details).toBe("Some details");
    });
  });

  describe("[UNIT] withReporterEmail", () => {
    it("creates copy with updated email when reporter exists", async () => {
      const reporter = createMockReporter();
      const report = await createValidReport({ reporter });
      const updated = report.withReporterEmail("newemail@example.com");

      expect(updated.reporter?.email).toBe("newemail@example.com");
      expect(updated.reporter?.firstName).toBe(reporter.firstName);
      expect(updated.reporter?.lastName).toBe(reporter.lastName);
    });

    it("returns same instance when reporter is null", async () => {
      const report = await createValidReport({ reporter: null });
      const updated = report.withReporterEmail("email@example.com");

      expect(updated).toBe(report);
    });

    it("allows setting email to null", async () => {
      const reporter = createMockReporter();
      const report = await createValidReport({ reporter });
      const updated = report.withReporterEmail(null);

      expect(updated.reporter?.email).toBeNull();
    });

    it("returns new instance when reporter exists", async () => {
      const reporter = createMockReporter();
      const report = await createValidReport({ reporter });
      const updated = report.withReporterEmail("new@example.com");

      expect(updated).not.toBe(report);
      expect(report.reporter?.email).toBe("john@example.com");
    });
  });

  describe("[UNIT] immutability", () => {
    it("create returns new instances", async () => {
      const id1 = ReportId.unsafeCreate("id-1");
      const id2 = ReportId.unsafeCreate("id-2");
      const report1 = await createValidReport({ id: id1 });
      const report2 = await createValidReport({ id: id2 });
      expect(report1).not.toBe(report2);
    });

    it("withReporterInfo returns new instance", async () => {
      const report = await createValidReport();
      const reporter = createMockReporter();
      const updated = report.withReporterInfo(reporter);
      expect(updated).not.toBe(report);
    });

    it("withReporterEmail returns new instance when reporter exists", async () => {
      const reporter = createMockReporter();
      const report = await createValidReport({ reporter });
      const updated = report.withReporterEmail("new@example.com");
      expect(updated).not.toBe(report);
    });
  });
});

describe("[UNIT] calculateReportStatistics", () => {
  it("returns zero counts for empty array", () => {
    const stats = calculateReportStatistics([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.byReason).toEqual({});
    expect(stats.uniqueSubmitters).toBe(0);
    expect(stats.reportsWithDetails).toBe(0);
  });

  it("calculates total count correctly", async () => {
    const reports = await Promise.all([
      createValidReport(),
      createValidReport(),
      createValidReport(),
    ]);
    const stats = calculateReportStatistics(reports);
    expect(stats.totalCount).toBe(3);
  });

  it("groups counts by reason", async () => {
    const reports = await Promise.all([
      createValidReport({ reason: "SPAM" }),
      createValidReport({ reason: "SPAM" }),
      createValidReport({ reason: "INAPPROPRIATE" }),
      createValidReport({ reason: "CHEATING" }),
    ]);
    const stats = calculateReportStatistics(reports);
    expect(stats.byReason).toEqual({
      SPAM: 2,
      INAPPROPRIATE: 1,
      CHEATING: 1,
    });
  });

  it("counts unique submitters", async () => {
    const reports = await Promise.all([
      createValidReport({ reporterId: "rep-1" }),
      createValidReport({ reporterId: "rep-1" }),
      createValidReport({ reporterId: "rep-2" }),
      createValidReport({ reporterId: "rep-3" }),
    ]);
    const stats = calculateReportStatistics(reports);
    expect(stats.uniqueSubmitters).toBe(3);
  });

  it("counts reports with details", async () => {
    const reports = await Promise.all([
      createValidReport({ details: "Some details" }),
      createValidReport({ details: "More details" }),
      createValidReport({ details: null }),
      createValidReport(),
    ]);
    const stats = calculateReportStatistics(reports);
    expect(stats.reportsWithDetails).toBe(2);
  });

  it("handles mixed report data correctly", async () => {
    const reports = await Promise.all([
      createValidReport({
        reason: "SPAM",
        reporterId: "rep-1",
        details: "Details 1",
      }),
      createValidReport({ reason: "SPAM", reporterId: "rep-2", details: null }),
      createValidReport({
        reason: "INAPPROPRIATE",
        reporterId: "rep-1",
        details: "Details 2",
      }),
    ]);
    const stats = calculateReportStatistics(reports);
    expect(stats.totalCount).toBe(3);
    expect(stats.byReason).toEqual({
      SPAM: 2,
      INAPPROPRIATE: 1,
    });
    expect(stats.uniqueSubmitters).toBe(2);
    expect(stats.reportsWithDetails).toBe(2);
  });
});

describe("[UNIT] groupReportsBySubmission", () => {
  it("returns empty map for empty array", () => {
    const grouped = groupReportsBySubmission([]);
    expect(grouped.size).toBe(0);
  });

  it("groups single report by submissionId", async () => {
    const report = await createValidReport({ submissionId: "sub-123" });
    const grouped = groupReportsBySubmission([report]);
    expect(grouped.size).toBe(1);
    expect(grouped.get("sub-123")).toEqual([report]);
  });

  it("groups multiple reports for same submission", async () => {
    const reports = await Promise.all([
      createValidReport({ submissionId: "sub-123", reporterId: "rep-1" }),
      createValidReport({ submissionId: "sub-123", reporterId: "rep-2" }),
      createValidReport({ submissionId: "sub-123", reporterId: "rep-3" }),
    ]);
    const grouped = groupReportsBySubmission(reports);
    expect(grouped.size).toBe(1);
    expect(grouped.get("sub-123")?.length).toBe(3);
  });

  it("groups reports for different submissions", async () => {
    const reports = await Promise.all([
      createValidReport({ submissionId: "sub-123" }),
      createValidReport({ submissionId: "sub-456" }),
      createValidReport({ submissionId: "sub-123" }),
      createValidReport({ submissionId: "sub-789" }),
    ]);
    const grouped = groupReportsBySubmission(reports);
    expect(grouped.size).toBe(3);
    expect(grouped.get("sub-123")?.length).toBe(2);
    expect(grouped.get("sub-456")?.length).toBe(1);
    expect(grouped.get("sub-789")?.length).toBe(1);
  });

  it("preserves report order within each group", async () => {
    const report1 = await createValidReport({
      submissionId: "sub-123",
      reason: "SPAM",
    });
    const report2 = await createValidReport({
      submissionId: "sub-123",
      reason: "INAPPROPRIATE",
    });
    const report3 = await createValidReport({
      submissionId: "sub-123",
      reason: "CHEATING",
    });

    const grouped = groupReportsBySubmission([report1, report2, report3]);
    const groupedReports = grouped.get("sub-123") as SubmissionReport[];
    expect(groupedReports.length).toBe(3);
    expect(groupedReports[0].reason.value).toBe("SPAM");
    expect(groupedReports[1].reason.value).toBe("INAPPROPRIATE");
    expect(groupedReports[2].reason.value).toBe("CHEATING");
  });
});
