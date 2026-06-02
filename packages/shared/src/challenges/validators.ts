import { MAX_PEER_VOTING_DURATION_HOURS } from "./dateUtils";

export interface ChallengeValidationResult {
  valid: boolean;
  errors?: string[];
}

export const validatePeerVotingTimeline = (input: {
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  endTime?: Date | null;
  votingDurationHours?: number | null;
  votingStartTime?: Date | null;
  votingEndTime?: Date | null;
}): ChallengeValidationResult => {
  const errors: string[] = [];

  if (
    input.scoringCategory === "PEER_VOTING" &&
    input.submissionType !== "IMAGE" &&
    input.submissionType !== "VIDEO"
  ) {
    errors.push("Peer voting is supported only for IMAGE or VIDEO challenges");
  }

  if (input.scoringCategory !== "PEER_VOTING") {
    return { valid: true };
  }

  if (!input.endTime) {
    errors.push("Peer voting challenge requires submission end time");
  }

  const hasDuration =
    input.votingDurationHours != null &&
    Number.isInteger(input.votingDurationHours) &&
    input.votingDurationHours > 0;
  const hasWindow = Boolean(input.votingStartTime) && Boolean(input.votingEndTime);

  if (!hasDuration && !hasWindow) {
    errors.push("Peer voting challenge requires voting duration in hours or days");
  }

  if (
    input.votingDurationHours != null &&
    (!Number.isInteger(input.votingDurationHours) ||
      input.votingDurationHours < 1 ||
      input.votingDurationHours > MAX_PEER_VOTING_DURATION_HOURS)
  ) {
    errors.push(`Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`);
  }

  if (input.votingStartTime && input.votingEndTime && input.votingStartTime >= input.votingEndTime) {
    errors.push("Voting start time must be before voting end time");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
};

export const validateRecurringTimeline = (input: {
  isRecurring?: boolean | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  recurringDays?: number | null;
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
}): ChallengeValidationResult => {
  const errors: string[] = [];

  if (!input.isRecurring) {
    return { valid: true };
  }

  if (!input.dailyStartTime || !input.dailyEndTime) {
    errors.push("Recurring challenge requires daily start and end time");
  }

  if (!input.recurringDays || input.recurringDays < 1) {
    errors.push("Recurring challenge requires number of days");
  }

  if (input.scoringCategory === "PEER_VOTING") {
    errors.push("Recurring peer voting challenges are not supported");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
};
