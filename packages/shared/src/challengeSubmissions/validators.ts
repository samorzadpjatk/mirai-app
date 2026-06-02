import { ORPCError } from "@orpc/server";
import { calculateDistance } from "../utils/location";

export const LOCATION_SUBMISSION_RADIUS_METERS = 200;

export const assertSubmissionWithinTargetLocation = (params: {
  challenge: {
    targetLatitude: number | null;
    targetLongitude: number | null;
  };
  latitude?: number | null;
  longitude?: number | null;
}) => {
  if (
    typeof params.latitude !== "number" ||
    typeof params.longitude !== "number" ||
    typeof params.challenge.targetLatitude !== "number" ||
    typeof params.challenge.targetLongitude !== "number"
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Location challenge is missing required coordinates",
    });
  }

  const distanceKm = calculateDistance(
    params.latitude,
    params.longitude,
    params.challenge.targetLatitude,
    params.challenge.targetLongitude,
  );

  if (distanceKm * 1000 > LOCATION_SUBMISSION_RADIUS_METERS) {
    throw new ORPCError("BAD_REQUEST", { message: "You are too far from target location" });
  }
};

export const shouldAutoApproveSubmission = (params: {
  challenge: {
    submissionType: string;
    autoApprove: boolean;
    expectedValue: string | null;
    targetLatitude: number | null;
    targetLongitude: number | null;
  };
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) => {
  if (params.challenge.submissionType === "QR_CODE") {
    const expected = params.challenge.expectedValue?.trim();
    const submitted = params.textContent?.trim();
    if (!expected) {
      throw new ORPCError("BAD_REQUEST", {
        message: "QR challenge is not configured with expected code",
      });
    }
    if (!submitted || submitted !== expected) {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid QR code" });
    }
    return true;
  }

  if (params.challenge.submissionType === "LOCATION") {
    assertSubmissionWithinTargetLocation(params);
    return true;
  }

  if (params.challenge.submissionType === "IMAGE_LOCATION") {
    assertSubmissionWithinTargetLocation(params);
    return false;
  }

  if (params.challenge.submissionType === "TEXT") {
    const expected = params.challenge.expectedValue?.trim();
    if (expected) {
      const submitted = params.textContent?.trim();
      if (!submitted || submitted !== expected) {
        throw new ORPCError("BAD_REQUEST", { message: "Incorrect phrase" });
      }
      return true;
    }
    // No phrase configured — fall through to autoApprove flag
  }

  if (params.challenge.autoApprove) {
    return true;
  }

  return false;
};

export const validateSubmissionPayload = (input: {
  submissionType: string;
  imageIds?: string[];
  videoId?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) => {
  const imageCount = input.imageIds?.length ?? 0;
  const hasText = Boolean(input.textContent && input.textContent.trim().length > 0);
  const hasVideo = Boolean(input.videoId && input.videoId.trim().length > 0);
  const hasLocation = typeof input.latitude === "number" && typeof input.longitude === "number";

  switch (input.submissionType) {
    case "IMAGE":
      if (imageCount < 1) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagany jest co najmniej 1 obraz" });
      }
      break;
    case "MULTI_IMAGE":
      if (imageCount < 2) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagane sa co najmniej 2 obrazy" });
      }
      break;
    case "VIDEO":
      if (!hasVideo) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagany jest film" });
      }
      break;
    case "TEXT":
      if (!hasText) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagana jest tresc tekstowa" });
      }
      break;
    case "IMAGE_LOCATION":
      if (imageCount < 1 || !hasLocation) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagany jest obraz oraz lokalizacja" });
      }
      break;
    case "LOCATION":
      if (!hasLocation) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagana jest lokalizacja" });
      }
      break;
    case "QR_CODE":
      if (!hasText && imageCount < 1) {
        throw new ORPCError("BAD_REQUEST", { message: "Wymagany jest kod QR (tekst lub obraz)" });
      }
      break;
    default:
      break;
  }
};
