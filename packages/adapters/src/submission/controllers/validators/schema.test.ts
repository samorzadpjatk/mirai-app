import { describe, it, expect } from "bun:test";
import {
  validateCreateReportInput,
  validateGetBySubmissionInput,
  type CreateReportInput,
  type GetBySubmissionInput,
} from "./schema";

describe("[UNIT] Submission Report Validators", () => {
  const validSubmissionId = "550e8400-e29b-41d4-a716-446655440000";
  const validSubmissionId2 = "550e8400-e29b-41d4-a716-446655440001";

  describe("validateCreateReportInput", () => {
    it("should validate minimal valid input", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Inappropriate content",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe(validSubmissionId);
        expect(result.data.reason).toBe("Inappropriate content");
      }
    });

    it("should validate with details", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Spam",
        details:
          "This submission contains promotional material that is not relevant to the challenge.",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.details).toBe(
          "This submission contains promotional material that is not relevant to the challenge.",
        );
      }
    });

    it("should validate with short reason (minimum length)", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "A",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with long reason (maximum 100 chars)", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "A".repeat(100),
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with empty details (optional field)", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Other",
        details: "",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should validate with long details (maximum 2000 chars)", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Violation",
        details: "A".repeat(2000),
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty submissionId", () => {
      const input = {
        submissionId: "",
        reason: "Inappropriate content",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Submission ID is required");
      }
    });

    it("should reject empty reason", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Reason is required");
      }
    });

    it("should reject reason exceeding 100 characters", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "A".repeat(101),
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 100 characters");
      }
    });

    it("should reject details exceeding 2000 characters", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Violation",
        details: "A".repeat(2001),
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("at most 2000 characters");
      }
    });

    it("should reject missing submissionId", () => {
      const input = {
        reason: "Inappropriate content",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing reason", () => {
      const input = {
        submissionId: validSubmissionId,
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("validateGetBySubmissionInput", () => {
    it("should validate valid submission ID", () => {
      const input = {
        submissionId: validSubmissionId,
      };
      const result = validateGetBySubmissionInput(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submissionId).toBe(validSubmissionId);
      }
    });

    it("should validate different submission IDs", () => {
      const ids = [
        "sub-123",
        "submission-456",
        validSubmissionId2,
        "abc123def456",
      ];
      for (const id of ids) {
        const input = { submissionId: id };
        const result = validateGetBySubmissionInput(input);
        expect(result.success).toBe(true);
      }
    });

    it("should reject empty submissionId", () => {
      const input = {
        submissionId: "",
      };
      const result = validateGetBySubmissionInput(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Submission ID is required");
      }
    });

    it("should accept whitespace-only submissionId (schema only checks non-empty)", () => {
      const input = {
        submissionId: "   ",
      };
      const result = validateGetBySubmissionInput(input);
      // Schema uses minLength(1) which counts whitespace as valid
      expect(result.success).toBe(true);
    });

    it("should reject missing submissionId", () => {
      const input = {};
      const result = validateGetBySubmissionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject non-string submissionId", () => {
      const input = {
        submissionId: 123,
      };
      const result = validateGetBySubmissionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject null submissionId", () => {
      const input = {
        submissionId: null,
      };
      const result = validateGetBySubmissionInput(input);
      expect(result.success).toBe(false);
    });

    it("should reject undefined submissionId", () => {
      const input = {
        submissionId: undefined,
      };
      const result = validateGetBySubmissionInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle special characters in reason", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Content with special chars: !@#$%^&*()",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle unicode in reason", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "不適切なコンテンツ",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle unicode in details", () => {
      const input = {
        submissionId: validSubmissionId,
        reason: "Other",
        details: "詳細な説明がここに入ります。日本語も対応しています。",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle long submission IDs", () => {
      const longId = "a".repeat(1000);
      const input = {
        submissionId: longId,
        reason: "Test",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle submission IDs with hyphens and underscores", () => {
      const input = {
        submissionId: "submission_id-123-test",
        reason: "Test reason",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });

    it("should handle submission IDs with numbers only", () => {
      const input = {
        submissionId: "123456789",
        reason: "Test reason",
      };
      const result = validateCreateReportInput(input);
      expect(result.success).toBe(true);
    });
  });
});

/*
 * Summary
 *
 * Tests cover:
 * - validateCreateReportInput: comprehensive validation including:
 *   - Required: submissionId (non-empty string), reason (1-100 chars)
 *   - Optional: details (string, max 2000 chars, can be empty)
 * - validateGetBySubmissionInput: submissionId (non-empty string)
 *
 * All validators tested with:
 * - Valid inputs (success cases)
 * - String length boundaries (reason: 1-100, details: 0-2000)
 * - Empty string validation
 * - Missing required vs optional fields
 * - Type validation (non-string rejection)
 * - Null and undefined handling
 * - Edge cases (special characters, unicode, long strings)
 * - Various submission ID formats
 */
