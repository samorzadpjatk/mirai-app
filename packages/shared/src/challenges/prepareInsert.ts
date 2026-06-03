import {
  inferPeerVotingDurationHours,
  resolvePeerVotingTemplateWindow,
  resolveRecurringDays,
  resolveRecurringTemplateWindow,
} from "./dateUtils";
import { computeInitialStatus } from "./initialStatus";

export interface ChallengeInsertInput {
  tripId: string;
  name: string;
  description?: string;
  qrCodeValue?: string;
  textExpectedPhrase?: string;
  image?: string;
  submissionType: "IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  isRecurring?: boolean;
  recurringDays?: number;
  dailyStartTime?: string;
  dailyEndTime?: string;
  basePoints?: number;
  firstPlacePoints?: number;
  secondPlacePoints?: number;
  thirdPlacePoints?: number;
  status?: "HIDDEN" | "VISIBLE";
  startTime?: Date;
  endTime?: Date;
  votingDurationHours?: number;
  votingStartTime?: Date;
  votingEndTime?: Date;
  targetLatitude?: number;
  targetLongitude?: number;
  autoApprove?: boolean;
}

export interface ChallengeInsertValues {
  tripId: string;
  name: string;
  description: string | null;
  image: string | undefined;
  submissionType: "IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  isRecurring: boolean | undefined;
  dailyStartTime: string | undefined;
  dailyEndTime: string | undefined;
  basePoints: number | undefined;
  firstPlacePoints: number | undefined;
  secondPlacePoints: number | undefined;
  thirdPlacePoints: number | undefined;
  status: "HIDDEN" | "VISIBLE" | "ACTIVE";
  startTime: Date | undefined;
  endTime: Date | undefined;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
  targetLatitude: number | undefined;
  targetLongitude: number | undefined;
  expectedValue: string | null;
  autoApprove: boolean;
}

const normalizeChallengeImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  return value;
};

export const prepareChallengeInsert = (
  input: ChallengeInsertInput,
  now: Date,
): ChallengeInsertValues => {
  const recurringDays = resolveRecurringDays({
    isRecurring: input.isRecurring,
    recurringDays: input.recurringDays,
  });

  const recurringWindow =
    input.isRecurring && recurringDays
      ? resolveRecurringTemplateWindow({
          anchorDate: input.startTime ?? now,
          recurringDays,
        })
      : null;

  const peerVotingDurationHours = inferPeerVotingDurationHours({
    votingDurationHours: input.votingDurationHours,
    votingStartTime: input.votingStartTime,
    votingEndTime: input.votingEndTime,
  });

  const peerVotingTemplateWindow =
    input.scoringCategory === "PEER_VOTING" &&
    (recurringWindow?.endTime ?? input.endTime) &&
    peerVotingDurationHours
      ? resolvePeerVotingTemplateWindow({
          submissionEndTime: recurringWindow?.endTime ?? input.endTime!,
          votingDurationHours: peerVotingDurationHours,
        })
      : null;

  const initialStatus = computeInitialStatus(
    {
      status: input.status,
      isRecurring: input.isRecurring,
      startTime: input.startTime,
      endTime: input.endTime,
    },
    now,
  );

  return {
    tripId: input.tripId,
    name: input.name,
    description: input.description ?? null,
    image: normalizeChallengeImageInput(input.image),
    submissionType: input.submissionType,
    scoringCategory: input.scoringCategory,
    isRecurring: input.isRecurring,
    dailyStartTime: input.dailyStartTime,
    dailyEndTime: input.dailyEndTime,
    basePoints: input.basePoints,
    firstPlacePoints: input.firstPlacePoints,
    secondPlacePoints: input.secondPlacePoints,
    thirdPlacePoints: input.thirdPlacePoints,
    status: initialStatus,
    startTime: recurringWindow?.startTime ?? input.startTime,
    endTime: recurringWindow?.endTime ?? input.endTime,
    votingStartTime:
      input.scoringCategory === "PEER_VOTING"
        ? (peerVotingTemplateWindow?.votingStartTime ?? null)
        : null,
    votingEndTime:
      input.scoringCategory === "PEER_VOTING"
        ? (peerVotingTemplateWindow?.votingEndTime ?? null)
        : null,
    targetLatitude: input.targetLatitude,
    targetLongitude: input.targetLongitude,
    expectedValue:
      input.submissionType === "QR_CODE"
        ? (input.qrCodeValue ?? null)
        : input.submissionType === "TEXT"
          ? (input.textExpectedPhrase ?? null)
          : null,
    autoApprove:
      input.submissionType === "QR_CODE" || input.submissionType === "LOCATION"
        ? true
        : input.submissionType === "IMAGE_LOCATION"
          ? false
          : (input.autoApprove ?? false),
  };
};
