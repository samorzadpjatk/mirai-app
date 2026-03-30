export const submissionTypeOptions = [
  { label: "Image", value: "IMAGE" },
  { label: "Video", value: "VIDEO" },
  { label: "Text", value: "TEXT" },
  { label: "Image + Location", value: "IMAGE_LOCATION" },
  { label: "Location", value: "LOCATION" },
  { label: "QR Code", value: "QR_CODE" },
] as const;

export const scoringCategoryOptions = [
  { label: "Speed", value: "SPEED" },
  { label: "Unlimited", value: "UNLIMITED" },
  { label: "Judged (Staff)", value: "JUDGED_STAFF" },
  { label: "Peer Voting", value: "PEER_VOTING" },
] as const;

export const newChallengeStatusOptions = [
  { label: "Hidden", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
] as const;

export const editChallengeStatusOptions = [
  { label: "Hidden", value: "HIDDEN" },
  { label: "Visible", value: "VISIBLE" },
  { label: "Active", value: "ACTIVE" },
  { label: "Voting Phase", value: "VOTING_PHASE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

export type ChallengeStatus =
  | "HIDDEN"
  | "VISIBLE"
  | "ACTIVE"
  | "VOTING_PHASE"
  | "COMPLETED"
  | "CANCELLED";

export type VotingDurationUnit = "HOURS" | "DAYS";

export interface ChallengeFormState {
  title: string;
  description: string;
  image: string;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  dailyStartTime: string;
  dailyEndTime: string;
  recurringDays: string;
  basePoints: string;
  firstPlacePoints: string;
  secondPlacePoints: string;
  thirdPlacePoints: string;
  status: ChallengeStatus;
  startTime: string;
  endTime: string;
  votingDurationValue: string;
  votingDurationUnit: VotingDurationUnit;
  targetLatitude: string;
  targetLongitude: string;
  qrCodeValue: string;
  textExpectedPhrase: string;
  autoApprove: boolean;
}

export const toOptionalInt = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toOptionalFloat = (value: string): number | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toVotingDurationHours = (
  value: string,
  unit: VotingDurationUnit,
): number | undefined => {
  const parsed = toOptionalInt(value);
  if (!parsed || parsed < 1) {
    return undefined;
  }

  return unit === "DAYS" ? parsed * 24 : parsed;
};

export const toIsoFromLocalDateTime = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
};

export const toLocalDateTimeInputValue = (
  value: string | Date | null | undefined,
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const toLocalTimeInputValue = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length >= 5 && trimmed.includes(":")) {
    return trimmed.slice(0, 5);
  }

  return "";
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const inferRecurringDaysFromWindow = (
  startTime: string | Date | null | undefined,
  endTime: string | Date | null | undefined,
): string => {
  if (!startTime || !endTime) {
    return "";
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end.getTime() < start.getTime()) {
    return "";
  }

  return String(Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1);
};

export const toVotingDurationDraft = (
  votingStartTime: string | Date | null | undefined,
  votingEndTime: string | Date | null | undefined,
): { value: string; unit: VotingDurationUnit } => {
  if (!votingStartTime || !votingEndTime) {
    return {
      value: "",
      unit: "HOURS",
    };
  }

  const start = new Date(votingStartTime);
  const end = new Date(votingEndTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      value: "",
      unit: "HOURS",
    };
  }

  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) {
    return {
      value: "",
      unit: "HOURS",
    };
  }

  const totalHours = Math.max(1, Math.ceil(durationMs / (60 * 60 * 1000)));
  if (totalHours % 24 === 0) {
    return {
      value: String(totalHours / 24),
      unit: "DAYS",
    };
  }

  return {
    value: String(totalHours),
    unit: "HOURS",
  };
};
