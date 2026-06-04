import { z } from "zod";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
import { isValidHttpUrl } from "../../../utils/url-validation";

export const challengeColumns = {
  id: true,
  tripId: true,
  name: true,
  description: true,
  image: true,
  submissionType: true,
  scoringCategory: true,
  isRecurring: true,
  dailyStartTime: true,
  dailyEndTime: true,
  basePoints: true,
  firstPlacePoints: true,
  secondPlacePoints: true,
  thirdPlacePoints: true,
  status: true,
  startTime: true,
  endTime: true,
  votingStartTime: true,
  votingEndTime: true,
  targetLatitude: true,
  targetLongitude: true,
  expectedValue: true,
  autoApprove: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const MAX_RECURRING_DAYS = 30;
export const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;

export const challengeImageSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (normalizeSupabaseStoragePath(value)) {
      return true;
    }

    return isValidHttpUrl(value);
  }, "Image must be a valid HTTP/HTTPS URL or storage path")
  .optional();

export const normalizeChallengeImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};
