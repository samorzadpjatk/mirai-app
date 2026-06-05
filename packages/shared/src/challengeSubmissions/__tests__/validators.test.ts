import { describe, expect, it } from "vitest";
import {
  LOCATION_SUBMISSION_RADIUS_METERS,
  assertSubmissionWithinTargetLocation,
  shouldAutoApproveSubmission,
  validateSubmissionPayload,
} from "../validators";

const createMockChallenge = (overrides: Record<string, unknown> = {}) => ({
  submissionType: "TEXT",
  autoApprove: false,
  textExpectedPhrase: null,
  qrCodeValue: null,
  targetLatitude: null,
  targetLongitude: null,
  ...overrides,
});

const createMockInput = (overrides: Record<string, unknown> = {}) => ({
  submissionType: "TEXT",
  imageIds: undefined,
  videoId: null,
  textContent: null,
  latitude: null,
  longitude: null,
  ...overrides,
});

describe("validateSubmissionPayload", () => {
  it("throws for IMAGE with no images", () => {
    const input = createMockInput({ submissionType: "IMAGE" });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagany jest co najmniej 1 obraz");
  });

  it("passes for IMAGE with 1 image", () => {
    const input = createMockInput({ submissionType: "IMAGE", imageIds: ["img-1"] });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("throws for MULTI_IMAGE with 1 image", () => {
    const input = createMockInput({ submissionType: "MULTI_IMAGE", imageIds: ["img-1"] });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagane sa co najmniej 2 obrazy");
  });

  it("passes for MULTI_IMAGE with 2 images", () => {
    const input = createMockInput({ submissionType: "MULTI_IMAGE", imageIds: ["img-1", "img-2"] });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("throws for VIDEO with no video", () => {
    const input = createMockInput({ submissionType: "VIDEO" });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagany jest film");
  });

  it("passes for VIDEO with video", () => {
    const input = createMockInput({ submissionType: "VIDEO", videoId: "vid-1" });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("throws for TEXT with no text", () => {
    const input = createMockInput({ submissionType: "TEXT" });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagana jest tresc tekstowa");
  });

  it("passes for TEXT with text", () => {
    const input = createMockInput({ submissionType: "TEXT", textContent: "Hello" });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("throws for IMAGE_LOCATION with no images", () => {
    const input = createMockInput({ submissionType: "IMAGE_LOCATION", latitude: 1, longitude: 1 });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagany jest obraz oraz lokalizacja");
  });

  it("throws for IMAGE_LOCATION with no location", () => {
    const input = createMockInput({ submissionType: "IMAGE_LOCATION", imageIds: ["img-1"] });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagany jest obraz oraz lokalizacja");
  });

  it("passes for IMAGE_LOCATION with both", () => {
    const input = createMockInput({
      submissionType: "IMAGE_LOCATION",
      imageIds: ["img-1"],
      latitude: 1,
      longitude: 1,
    });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("throws for LOCATION with no location", () => {
    const input = createMockInput({ submissionType: "LOCATION" });
    expect(() => validateSubmissionPayload(input)).toThrow("Wymagana jest lokalizacja");
  });

  it("passes for LOCATION with location", () => {
    const input = createMockInput({ submissionType: "LOCATION", latitude: 1, longitude: 1 });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("throws for QR_CODE with no text and no images", () => {
    const input = createMockInput({ submissionType: "QR_CODE" });
    expect(() => validateSubmissionPayload(input)).toThrow(
      "Wymagany jest kod QR (tekst lub obraz)",
    );
  });

  it("passes for QR_CODE with text", () => {
    const input = createMockInput({ submissionType: "QR_CODE", textContent: "QR123" });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("passes for QR_CODE with images", () => {
    const input = createMockInput({ submissionType: "QR_CODE", imageIds: ["img-1"] });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });

  it("passes for unknown submission type", () => {
    const input = createMockInput({ submissionType: "UNKNOWN" });
    expect(() => validateSubmissionPayload(input)).not.toThrow();
  });
});

describe("shouldAutoApproveSubmission", () => {
  it("returns true for QR_CODE with matching expected value", () => {
    const challenge = createMockChallenge({ submissionType: "QR_CODE", qrCodeValue: "SECRET" });
    const result = shouldAutoApproveSubmission({ challenge, textContent: "SECRET" });
    expect(result).toBe(true);
  });

  it("throws for QR_CODE with non-matching expected value", () => {
    const challenge = createMockChallenge({ submissionType: "QR_CODE", qrCodeValue: "SECRET" });
    expect(() => shouldAutoApproveSubmission({ challenge, textContent: "WRONG" })).toThrow(
      "Invalid QR code",
    );
  });

  it("throws for QR_CODE without expected value configured", () => {
    const challenge = createMockChallenge({ submissionType: "QR_CODE", qrCodeValue: null });
    expect(() => shouldAutoApproveSubmission({ challenge, textContent: "SECRET" })).toThrow(
      "QR challenge is not configured with expected code",
    );
  });

  it("throws for QR_CODE with empty submitted text", () => {
    const challenge = createMockChallenge({ submissionType: "QR_CODE", qrCodeValue: "SECRET" });
    expect(() => shouldAutoApproveSubmission({ challenge, textContent: "" })).toThrow(
      "Invalid QR code",
    );
  });

  it("returns true for LOCATION with valid coordinates", () => {
    const challenge = createMockChallenge({
      submissionType: "LOCATION",
      targetLatitude: 52.2297,
      targetLongitude: 21.0122,
    });
    const result = shouldAutoApproveSubmission({
      challenge,
      latitude: 52.2297,
      longitude: 21.0122,
    });
    expect(result).toBe(true);
  });

  it("throws for LOCATION with missing coordinates", () => {
    const challenge = createMockChallenge({
      submissionType: "LOCATION",
      targetLatitude: 52.2297,
      targetLongitude: 21.0122,
    });
    expect(() => shouldAutoApproveSubmission({ challenge })).toThrow(
      "Location challenge is missing required coordinates",
    );
  });

  it("throws for LOCATION with coordinates too far from target", () => {
    const challenge = createMockChallenge({
      submissionType: "LOCATION",
      targetLatitude: 52.2297,
      targetLongitude: 21.0122,
    });
    expect(() =>
      shouldAutoApproveSubmission({ challenge, latitude: 50.0, longitude: 20.0 }),
    ).toThrow("You are too far from target location");
  });

  it("returns false for IMAGE_LOCATION with valid coordinates", () => {
    const challenge = createMockChallenge({
      submissionType: "IMAGE_LOCATION",
      targetLatitude: 52.2297,
      targetLongitude: 21.0122,
    });
    const result = shouldAutoApproveSubmission({
      challenge,
      latitude: 52.2297,
      longitude: 21.0122,
    });
    expect(result).toBe(false);
  });

  it("throws for IMAGE_LOCATION with missing coordinates", () => {
    const challenge = createMockChallenge({
      submissionType: "IMAGE_LOCATION",
      targetLatitude: 52.2297,
      targetLongitude: 21.0122,
    });
    expect(() => shouldAutoApproveSubmission({ challenge })).toThrow(
      "Location challenge is missing required coordinates",
    );
  });

  it("returns true for TEXT with matching expected value", () => {
    const challenge = createMockChallenge({ submissionType: "TEXT", textExpectedPhrase: "ANSWER" });
    const result = shouldAutoApproveSubmission({ challenge, textContent: "ANSWER" });
    expect(result).toBe(true);
  });

  it("throws for TEXT with non-matching expected value", () => {
    const challenge = createMockChallenge({ submissionType: "TEXT", textExpectedPhrase: "ANSWER" });
    expect(() => shouldAutoApproveSubmission({ challenge, textContent: "WRONG" })).toThrow(
      "Incorrect phrase",
    );
  });

  it("returns false for TEXT without expected value configured", () => {
    const challenge = createMockChallenge({ submissionType: "TEXT", textExpectedPhrase: null });
    const result = shouldAutoApproveSubmission({ challenge, textContent: "ANYTHING" });
    expect(result).toBe(false);
  });

  it("returns true when autoApprove is true", () => {
    const challenge = createMockChallenge({ submissionType: "TEXT", autoApprove: true });
    const result = shouldAutoApproveSubmission({ challenge, textContent: "Hello" });
    expect(result).toBe(true);
  });

  it("returns false when autoApprove is false and no other conditions match", () => {
    const challenge = createMockChallenge({ submissionType: "TEXT", autoApprove: false });
    const result = shouldAutoApproveSubmission({ challenge, textContent: "Hello" });
    expect(result).toBe(false);
  });
});

describe("assertSubmissionWithinTargetLocation", () => {
  it("does not throw when within radius", () => {
    const challenge = { targetLatitude: 52.2297, targetLongitude: 21.0122 };
    expect(() =>
      assertSubmissionWithinTargetLocation({ challenge, latitude: 52.2297, longitude: 21.0122 }),
    ).not.toThrow();
  });

  it("throws when missing latitude", () => {
    const challenge = { targetLatitude: 52.2297, targetLongitude: 21.0122 };
    expect(() => assertSubmissionWithinTargetLocation({ challenge, longitude: 21.0122 })).toThrow(
      "Location challenge is missing required coordinates",
    );
  });

  it("throws when missing longitude", () => {
    const challenge = { targetLatitude: 52.2297, targetLongitude: 21.0122 };
    expect(() => assertSubmissionWithinTargetLocation({ challenge, latitude: 52.2297 })).toThrow(
      "Location challenge is missing required coordinates",
    );
  });

  it("throws when missing target latitude", () => {
    const challenge = { targetLatitude: null, targetLongitude: 21.0122 };
    expect(() =>
      assertSubmissionWithinTargetLocation({ challenge, latitude: 52.2297, longitude: 21.0122 }),
    ).toThrow("Location challenge is missing required coordinates");
  });

  it("throws when too far from target", () => {
    const challenge = { targetLatitude: 52.2297, targetLongitude: 21.0122 };
    expect(() =>
      assertSubmissionWithinTargetLocation({ challenge, latitude: 50.0, longitude: 20.0 }),
    ).toThrow("You are too far from target location");
  });

  it("does not throw when exactly at radius boundary", () => {
    const challenge = { targetLatitude: 52.2297, targetLongitude: 21.0122 };
    // A point roughly 200 meters away (at the boundary)
    const deltaLat = LOCATION_SUBMISSION_RADIUS_METERS / 111320;
    expect(() =>
      assertSubmissionWithinTargetLocation({
        challenge,
        latitude: 52.2297 + deltaLat,
        longitude: 21.0122,
      }),
    ).not.toThrow();
  });
});
