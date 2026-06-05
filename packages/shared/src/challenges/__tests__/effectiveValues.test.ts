import { describe, expect, it } from "vitest";
import { computeEffectiveChallengeValues } from "../effectiveValues";

describe("computeEffectiveChallengeValues", () => {
  it("uses input submissionType when provided", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "TEXT" },
      { submissionType: "IMAGE" },
    );
    expect(result.effectiveSubmissionType).toBe("TEXT");
  });

  it("falls back to existing submissionType when input missing", () => {
    const result = computeEffectiveChallengeValues({}, { submissionType: "VIDEO" });
    expect(result.effectiveSubmissionType).toBe("VIDEO");
  });

  it("computes QR_CODE expected value from input", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "QR_CODE", qrCodeValue: "ABC123" },
      { submissionType: "IMAGE", qrCodeValue: "old" },
    );
    expect(result.effectiveExpectedValue).toBe("ABC123");
  });

  it("computes QR_CODE expected value from existing when input missing", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "QR_CODE" },
      { submissionType: "QR_CODE", qrCodeValue: "EXISTING" },
    );
    expect(result.effectiveExpectedValue).toBe("EXISTING");
  });

  it("returns null for QR_CODE when both missing", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "QR_CODE" },
      { submissionType: "QR_CODE" },
    );
    expect(result.effectiveExpectedValue).toBeNull();
  });

  it("computes TEXT expected value from input", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "TEXT", textExpectedPhrase: "hello" },
      { submissionType: "IMAGE", textExpectedPhrase: "old" },
    );
    expect(result.effectiveExpectedValue).toBe("hello");
  });

  it("computes TEXT expected value from existing when input missing", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "TEXT" },
      { submissionType: "TEXT", textExpectedPhrase: "EXISTING" },
    );
    expect(result.effectiveExpectedValue).toBe("EXISTING");
  });

  it("returns null for non-QR/non-TEXT submission types", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "IMAGE" },
      { submissionType: "IMAGE", textExpectedPhrase: "old" },
    );
    expect(result.effectiveExpectedValue).toBeNull();
  });

  it("forces autoApprove true for QR_CODE", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "QR_CODE", autoApprove: false },
      { submissionType: "IMAGE", autoApprove: false },
    );
    expect(result.effectiveAutoApprove).toBe(true);
  });

  it("forces autoApprove true for LOCATION", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "LOCATION", autoApprove: false },
      { submissionType: "IMAGE", autoApprove: false },
    );
    expect(result.effectiveAutoApprove).toBe(true);
  });

  it("forces autoApprove false for IMAGE_LOCATION", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "IMAGE_LOCATION", autoApprove: true },
      { submissionType: "IMAGE", autoApprove: true },
    );
    expect(result.effectiveAutoApprove).toBe(false);
  });

  it("uses input autoApprove for other types when provided", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "TEXT", autoApprove: true },
      { submissionType: "IMAGE", autoApprove: false },
    );
    expect(result.effectiveAutoApprove).toBe(true);
  });

  it("falls back to existing autoApprove for other types when input missing", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "TEXT" },
      { submissionType: "TEXT", autoApprove: true },
    );
    expect(result.effectiveAutoApprove).toBe(true);
  });

  it("returns false for other types when both missing", () => {
    const result = computeEffectiveChallengeValues(
      { submissionType: "TEXT" },
      { submissionType: "TEXT" },
    );
    expect(result.effectiveAutoApprove).toBe(false);
  });
});
