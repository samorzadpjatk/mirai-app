import type { LocationCoordinate } from "~/components/map/LocationPicker";

export const submissionTypes = [
  { label: "Image", value: "IMAGE" },
  { label: "Video", value: "VIDEO" },
  { label: "Text", value: "TEXT" },
  { label: "Image + Location", value: "IMAGE_LOCATION" },
  { label: "Location", value: "LOCATION" },
  { label: "QR Code", value: "QR_CODE" },
] as const;

export const scoringCategories = [
  { label: "Speed", value: "SPEED" },
  { label: "Unlimited", value: "UNLIMITED" },
  { label: "Judged (Staff)", value: "JUDGED_STAFF" },
  { label: "Peer Voting", value: "PEER_VOTING" },
] as const;

export const statusOptions = [
  { label: "Hidden", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
  { label: "Active", value: "ACTIVE" },
  { label: "Voting Phase", value: "VOTING_PHASE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export const newChallengeStatusOptions = [
  { label: "Hidden", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
] as const;

export type DateField = "startTime" | "endTime" | "dailyStartTime" | "dailyEndTime" | null;

export type VotingDurationUnit = "HOURS" | "DAYS";

export interface ChallengeFormState {
  title: string;
  description: string;
  image: string;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  dailyStartTime: Date | null;
  dailyEndTime: Date | null;
  recurringDays: string;
  basePoints: string;
  firstPlacePoints: string;
  secondPlacePoints: string;
  thirdPlacePoints: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  votingDurationValue: string;
  votingDurationUnit: VotingDurationUnit;
  targetLocation: LocationCoordinate | null;
  qrCodeValue: string;
  textExpectedPhrase: string;
  autoApprove: boolean;
}

export const toVotingDurationHours = (value: string, unit: VotingDurationUnit) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined;
  }

  return unit === "DAYS" ? parsed * 24 : parsed;
};

export const toVotingDurationDraft = (
  votingStartTime?: string | Date | null,
  votingEndTime?: string | Date | null,
) => {
  if (!votingStartTime || !votingEndTime) {
    return {
      value: "",
      unit: "HOURS" as VotingDurationUnit,
    };
  }

  const start = new Date(votingStartTime);
  const end = new Date(votingEndTime);
  const durationMs = end.getTime() - start.getTime();

  if (durationMs <= 0) {
    return {
      value: "",
      unit: "HOURS" as VotingDurationUnit,
    };
  }

  const totalHours = Math.max(1, Math.ceil(durationMs / (60 * 60 * 1000)));
  if (totalHours % 24 === 0) {
    return {
      value: String(totalHours / 24),
      unit: "DAYS" as VotingDurationUnit,
    };
  }

  return {
    value: String(totalHours),
    unit: "HOURS" as VotingDurationUnit,
  };
};

export const formatTime = (date: Date | null) => {
  if (!date) return "";
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const formatIso = (date: Date | null) => (date ? date.toISOString() : "");

export const DAY_MS = 24 * 60 * 60 * 1000;

export const inferRecurringDaysFromWindow = (
  startTime?: string | Date | null,
  endTime?: string | Date | null,
) => {
  if (!startTime || !endTime) return "";
  const start = new Date(startTime);
  const end = new Date(endTime);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (end.getTime() < start.getTime()) return "";
  return String(Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);
};

export const toOptionalInt = (value: string) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};
