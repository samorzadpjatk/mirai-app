import { ORPCError } from "@orpc/server";
import { eq, and, notInArray, lte } from "drizzle-orm";
import { challenges, type DB } from "@mirai-app/db";
import { resolveStorageUrl, resolveStorageUrls } from "@mirai-app/shared";
import {
  MAX_PEER_VOTING_DURATION_HOURS,
  HOUR_MS,
  DAY_MS,
  MAX_RECURRING_DAYS,
} from "./types";
import {
  promoteVisibleChallengesToActiveWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  finalizeVotingChallengesToCompletedWithFeed,
} from "../../../utils/activityFeed";

// expectedValue holds the QR code value or the required text phrase.
// It is stored directly in the dedicated DB column — no encoding needed.
export const toClientChallenge = <T extends { description: string | null; expectedValue: string | null }>(
  challenge: T,
) => ({
  ...challenge,
  // qrCodeValue kept for backwards-compat with existing clients
  qrCodeValue: challenge.expectedValue,
});

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
}) => {
  if (
    input.scoringCategory === "PEER_VOTING" &&
    input.submissionType !== "IMAGE" &&
    input.submissionType !== "VIDEO"
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Peer voting is supported only for IMAGE or VIDEO challenges",
    });
  }

  if (input.scoringCategory !== "PEER_VOTING") return;

  if (!input.endTime) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Peer voting challenge requires submission end time",
    });
  }

  const hasDuration =
    input.votingDurationHours != null &&
    Number.isInteger(input.votingDurationHours) &&
    input.votingDurationHours > 0;
  const hasWindow = Boolean(input.votingStartTime) && Boolean(input.votingEndTime);

  if (!hasDuration && !hasWindow) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Peer voting challenge requires voting duration in hours or days",
    });
  }

  if (
    input.votingDurationHours != null &&
    (!Number.isInteger(input.votingDurationHours) ||
      input.votingDurationHours < 1 ||
      input.votingDurationHours > MAX_PEER_VOTING_DURATION_HOURS)
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours`,
    });
  }

  if (
    input.votingStartTime &&
    input.votingEndTime &&
    input.votingStartTime >= input.votingEndTime
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Voting start time must be before voting end time",
    });
  }
};

export const inferPeerVotingDurationHours = (input: {
  votingDurationHours?: number | null;
  votingStartTime?: Date | null;
  votingEndTime?: Date | null;
  fallbackVotingStartTime?: Date | null;
  fallbackVotingEndTime?: Date | null;
}) => {
  if (input.votingDurationHours != null) {
    return input.votingDurationHours;
  }

  const start = input.votingStartTime ?? input.fallbackVotingStartTime;
  const end = input.votingEndTime ?? input.fallbackVotingEndTime;

  if (!start || !end) {
    return null;
  }

  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) {
    return null;
  }

  return Math.max(1, Math.ceil(durationMs / HOUR_MS));
};

export const resolvePeerVotingTemplateWindow = (params: {
  submissionEndTime: Date;
  votingDurationHours: number;
}) => {
  const votingStartTime = new Date(params.submissionEndTime);
  const votingEndTime = new Date(votingStartTime.getTime() + params.votingDurationHours * HOUR_MS);

  return {
    votingStartTime,
    votingEndTime,
  };
};

export const validateRecurringTimeline = (input: {
  isRecurring?: boolean | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  recurringDays?: number | null;
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
}) => {
  if (!input.isRecurring) return;

  if (!input.dailyStartTime || !input.dailyEndTime) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Recurring challenge requires daily start and end time",
    });
  }

  if (!input.recurringDays || input.recurringDays < 1) {
    throw new ORPCError("BAD_REQUEST", { message: "Recurring challenge requires number of days" });
  }

  if (input.scoringCategory === "PEER_VOTING") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Recurring peer voting challenges are not supported",
    });
  }
};

export const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

export const inferRecurringDaysFromWindow = (startTime?: Date | null, endTime?: Date | null) => {
  if (!startTime || !endTime) return null;
  const start = startOfDay(startTime);
  const end = startOfDay(endTime);
  if (end.getTime() < start.getTime()) return null;
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
};

export const resolveRecurringDays = (params: {
  isRecurring?: boolean | null;
  recurringDays?: number | null;
  fallbackDays?: number | null;
}) => {
  if (!params.isRecurring) return null;
  const value = params.recurringDays ?? params.fallbackDays;
  if (!value || value < 1) {
    throw new ORPCError("BAD_REQUEST", { message: "Recurring challenge requires number of days" });
  }
  if (!Number.isInteger(value) || value > MAX_RECURRING_DAYS) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Recurring days must be an integer between 1 and ${MAX_RECURRING_DAYS}`,
    });
  }
  return value;
};

export const resolveRecurringTemplateWindow = (params: { anchorDate: Date; recurringDays: number }) => {
  const anchorDay = startOfDay(params.anchorDate);
  const endDay = addDays(anchorDay, params.recurringDays - 1);
  return {
    startTime: anchorDay,
    endTime: endOfDay(endDay),
  };
};

export const resolveChallengeImage = resolveStorageUrl;

export const resolveChallengeImages = async <T extends { image: string | null }>(
  supabase: Parameters<typeof resolveStorageUrl>[0],
  challengeRows: T[],
  seconds?: number,
): Promise<(T & { image: string | null })[]> =>
  resolveStorageUrls(supabase, challengeRows, seconds);

export const activateVisibleChallenges = async (db: DB, where?: { id?: string; tripId?: string }) => {
  const now = new Date();

  const visibleConditions = [
    eq(challenges.status, "VISIBLE"),
    notInArray(challenges.scoringCategory, ["PEER_VOTING", "JUDGED_STAFF"]),
    lte(challenges.endTime, now),
  ];
  if (where?.id) visibleConditions.push(eq(challenges.id, where.id));
  if (where?.tripId) visibleConditions.push(eq(challenges.tripId, where.tripId));

  await db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(and(...visibleConditions));

  await promoteVisibleChallengesToActiveWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });

  await promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });

  const activeConditions = [
    eq(challenges.status, "ACTIVE"),
    notInArray(challenges.scoringCategory, ["PEER_VOTING", "JUDGED_STAFF"]),
    lte(challenges.endTime, now),
  ];
  if (where?.id) activeConditions.push(eq(challenges.id, where.id));
  if (where?.tripId) activeConditions.push(eq(challenges.tripId, where.tripId));

  await db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(and(...activeConditions));

  await finalizeVotingChallengesToCompletedWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });
};
