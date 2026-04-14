import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { SubmissionReportController } from "../submission-report";
import type { SubmissionReportRepository } from "@mirai-app/use-cases";

// Valid UUIDs for testing
const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";
const SUBMISSION_ID = "550e8400-e29b-41d4-a716-446655440001";
const REPORTER_ID = "550e8400-e29b-41d4-a716-446655440002";
const REPORT_ID = "550e8400-e29b-41d4-a716-446655440003";

describe("[UNIT] SubmissionReportController", () => {
  let controller: SubmissionReportController;
  let mockReportRepository: SubmissionReportRepository;

  beforeEach(() => {
    mockReportRepository = {
      findById: mock(() =>
        Effect.succeed({
          id: REPORT_ID,
          submissionId: SUBMISSION_ID,
          reporterId: REPORTER_ID,
          reason: "inappropriate",
          details: "Test details",
          createdAt: new Date("2024-01-01"),
          reporter: {
            id: REPORTER_ID,
            user: {
              id: "user-1",
              firstName: "Test",
              lastName: "User",
              email: "test@example.com",
              hasAvatar: false,
            },
          },
        } as any),
      ),
      findBySubmissionId: mock(() =>
        Effect.succeed([
          {
            id: REPORT_ID,
            submissionId: SUBMISSION_ID,
            reporterId: REPORTER_ID,
            reason: { value: "INAPPROPRIATE" },
            details: "Test details",
            createdAt: new Date("2024-01-01"),
            reporter: {
              id: REPORTER_ID,
              user: {
                id: "user-1",
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
                hasAvatar: false,
              },
            },
            getReasonDisplay: () => "Inappropriate Content",
          },
        ]),
      ),
      findByReporterId: mock(() => Effect.succeed([])),
      create: mock((r: any) =>
        Effect.succeed({
          ...r,
          id: REPORT_ID,
          createdAt: new Date(),
          reason: { value: r.reason },
          getReasonDisplay: () => {
            const displayMap: Record<string, string> = {
              inappropriate: "Inappropriate Content",
              spam: "Spam",
              harassment: "Harassment",
              cheating: "Cheating",
              other: "Other",
            };
            return displayMap[r.reason] || "Other";
          },
        }),
      ),
      delete: mock(() => Effect.succeed(undefined)),
      exists: mock(() => Effect.succeed(true)),
      existsBySubmissionAndReporter: mock(() => Effect.succeed(false)),
      countBySubmissionId: mock(() => Effect.succeed(1)),
    } as unknown as SubmissionReportRepository;

    controller = new SubmissionReportController(mockReportRepository);
  });

  describe("[UNIT] create", () => {
    it("should create report with valid input", async () => {
      const input = {
        tripId: TRIP_ID,
        submissionId: SUBMISSION_ID,
        reason: "inappropriate",
      };

      const result = await controller.create(input, REPORTER_ID);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe(SUBMISSION_ID);
      }
    });

    it("should return error when user already reported", async () => {
      mockReportRepository.existsBySubmissionAndReporter = mock(() =>
        Effect.succeed(true),
      );

      const result = await controller.create(
        {
          tripId: TRIP_ID,
          submissionId: SUBMISSION_ID,
          reason: "inappropriate",
        },
        REPORTER_ID,
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already reported");
      }
    });

    it("should support details", async () => {
      const input = {
        tripId: TRIP_ID,
        submissionId: SUBMISSION_ID,
        reason: "spam",
        details: "This is spam content",
      };

      const result = await controller.create(input, REPORTER_ID);

      expect(result.success).toBe(true);
    });
  });

  describe("[UNIT] getBySubmission", () => {
    it("should return reports for submission", async () => {
      const result = await controller.getBySubmission({
        submissionId: SUBMISSION_ID,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reports).toHaveLength(1);
        expect(result.data.totalCount).toBe(1);
      }
    });
  });
});
