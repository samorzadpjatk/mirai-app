import { ORPCError } from "@orpc/server";
import { eq, and, count } from "drizzle-orm";
import { challenges, challengeSubmissions, type DB } from "@mirai-app/db";
import {
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
} from "../../../utils/activityFeed";
import {
  precreateRecurringInstancesForTemplate,
} from "../../../utils/recurringChallenges";
import { normalizeChallengeImageInput } from "./types";
import { toClientChallenge, resolveChallengeImage } from "./utils";
import {
  prepareChallengeInsert,
  computeEffectiveChallengeValues,
  resolveVotingTimes,
  validatePeerVotingTimeline,
  validateRecurringTimeline,
  inferPeerVotingDurationHours,
  resolvePeerVotingTemplateWindow,
  inferRecurringDaysFromWindow,
  resolveRecurringDays,
  resolveRecurringTemplateWindow,
} from "@mirai-app/shared/challenges";

export const createChallenge = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string };
  },
  input: {
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
  },
) => {
  const now = new Date();

  const recurringDays = resolveRecurringDays({
    isRecurring: input.isRecurring,
    recurringDays: input.recurringDays,
  });
  if (input.isRecurring && recurringDays === null) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Recurring challenge requires number of days",
    });
  }

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

  const peerVotingValidation = validatePeerVotingTimeline({
    submissionType: input.submissionType,
    scoringCategory: input.scoringCategory,
    endTime: recurringWindow?.endTime ?? input.endTime,
    votingDurationHours: peerVotingDurationHours,
    votingStartTime: input.votingStartTime,
    votingEndTime: input.votingEndTime,
  });
  if (!peerVotingValidation.valid) {
    throw new ORPCError("BAD_REQUEST", {
      message: peerVotingValidation.errors?.[0] ?? "Invalid peer voting timeline",
    });
  }

  const recurringValidation = validateRecurringTimeline({
    isRecurring: input.isRecurring,
    dailyStartTime: input.dailyStartTime,
    dailyEndTime: input.dailyEndTime,
    recurringDays,
    scoringCategory: input.scoringCategory,
  });
  if (!recurringValidation.valid) {
    throw new ORPCError("BAD_REQUEST", {
      message: recurringValidation.errors?.[0] ?? "Invalid recurring timeline",
    });
  }

  if (input.submissionType === "IMAGE_LOCATION" && input.autoApprove) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Image + Location challenges cannot use auto-approve",
    });
  }

  if (
    input.submissionType === "TEXT" &&
    input.autoApprove &&
    !input.textExpectedPhrase?.trim()
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Text auto-approve requires an expected phrase, or disable auto-approve",
    });
  }

  const insertValues = prepareChallengeInsert(input, now);

  const challenge = await context.db.transaction(async (tx) => {
    const [createdChallenge] = await tx
      .insert(challenges)
      .values(insertValues)
      .returning();

    if (!createdChallenge) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create challenge",
      });
    }

    if (createdChallenge.isRecurring) {
      await precreateRecurringInstancesForTemplate({
        tx,
        template: createdChallenge,
      });
    }

    if (createdChallenge.status === "ACTIVE") {
      await createChallengeStatusActivityById({
        tx,
        challengeId: createdChallenge.id,
        eventType: "challenge_started",
        createdByAdmin: context.dbUser.id,
      });
    }

    return createdChallenge;
  });

  return {
    ...toClientChallenge(challenge),
    image: await resolveChallengeImage(context.supabase, challenge.image),
  };
};

export const updateChallenge = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string };
  },
  input: {
    id: string;
    tripId: string;
    name?: string;
    description?: string;
    qrCodeValue?: string;
    textExpectedPhrase?: string;
    image?: string;
    submissionType?: "IMAGE" | "VIDEO" | "TEXT" | "IMAGE_LOCATION" | "LOCATION" | "QR_CODE";
    scoringCategory?: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
    isRecurring?: boolean;
    recurringDays?: number;
    dailyStartTime?: string;
    dailyEndTime?: string;
    basePoints?: number;
    firstPlacePoints?: number;
    secondPlacePoints?: number;
    thirdPlacePoints?: number;
    status?: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";
    startTime?: Date;
    endTime?: Date;
    votingDurationHours?: number;
    votingStartTime?: Date;
    votingEndTime?: Date;
    targetLatitude?: number;
    targetLongitude?: number;
    autoApprove?: boolean;
  },
) => {
  const existing = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, input.id), eq(c.tripId, input.tripId)),
    columns: {
      id: true,
      status: true,
      description: true,
      submissionType: true,
      autoApprove: true,
      isRecurring: true,
      dailyStartTime: true,
      dailyEndTime: true,
      scoringCategory: true,
      expectedValue: true,
      startTime: true,
      endTime: true,
      votingStartTime: true,
      votingEndTime: true,
    },
  });

  if (!existing) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }

  const peerVotingDurationHours = inferPeerVotingDurationHours({
    votingDurationHours: input.votingDurationHours,
    votingStartTime: input.votingStartTime,
    votingEndTime: input.votingEndTime,
    fallbackVotingStartTime: existing.votingStartTime,
    fallbackVotingEndTime: existing.votingEndTime,
  });

  const peerVotingValidation = validatePeerVotingTimeline({
    submissionType: input.submissionType ?? existing.submissionType ?? "IMAGE",
    scoringCategory: input.scoringCategory ?? existing.scoringCategory,
    endTime: input.endTime ?? existing.endTime,
    votingDurationHours: peerVotingDurationHours,
    votingStartTime: input.votingStartTime ?? existing.votingStartTime,
    votingEndTime: input.votingEndTime ?? existing.votingEndTime,
  });
  if (!peerVotingValidation.valid) {
    throw new ORPCError("BAD_REQUEST", {
      message: peerVotingValidation.errors?.[0] ?? "Invalid peer voting timeline",
    });
  }

  const nextIsRecurring = input.isRecurring ?? existing.isRecurring;
  const inferredRecurringDays = inferRecurringDaysFromWindow(
    existing.startTime,
    existing.endTime,
  );
  const recurringDays = resolveRecurringDays({
    isRecurring: nextIsRecurring,
    recurringDays: input.recurringDays,
    fallbackDays: inferredRecurringDays,
  });
  if (nextIsRecurring && recurringDays === null) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Recurring challenge requires number of days",
    });
  }

  const recurringValidation = validateRecurringTimeline({
    isRecurring: nextIsRecurring,
    dailyStartTime: input.dailyStartTime ?? existing.dailyStartTime,
    dailyEndTime: input.dailyEndTime ?? existing.dailyEndTime,
    recurringDays,
    scoringCategory: input.scoringCategory ?? existing.scoringCategory,
  });
  if (!recurringValidation.valid) {
    throw new ORPCError("BAD_REQUEST", {
      message: recurringValidation.errors?.[0] ?? "Invalid recurring timeline",
    });
  }

  const recurringWindow =
    nextIsRecurring && recurringDays
      ? resolveRecurringTemplateWindow({
          anchorDate: input.startTime ?? existing.startTime ?? new Date(),
          recurringDays,
        })
      : null;

  const nextScoringCategory = input.scoringCategory ?? existing.scoringCategory;
  const nextStatus = input.status ?? existing.status;

  const peerVotingTemplateWindow =
    nextScoringCategory === "PEER_VOTING" &&
    (recurringWindow?.endTime ?? input.endTime ?? existing.endTime) &&
    peerVotingDurationHours
      ? resolvePeerVotingTemplateWindow({
          submissionEndTime: recurringWindow?.endTime ?? input.endTime ?? existing.endTime!,
          votingDurationHours: peerVotingDurationHours,
        })
      : null;

  const isTransitioningToVotingPhase =
    existing.status !== "VOTING_PHASE" && nextStatus === "VOTING_PHASE";

  if (nextScoringCategory === "PEER_VOTING" && isTransitioningToVotingPhase) {
    const [totalSubmissionsResult, pendingSubmissionsResult] = await Promise.all([
      context.db
        .select({ count: count() })
        .from(challengeSubmissions)
        .where(eq(challengeSubmissions.challengeId, existing.id)),
      context.db
        .select({ count: count() })
        .from(challengeSubmissions)
        .where(
          and(
            eq(challengeSubmissions.challengeId, existing.id),
            eq(challengeSubmissions.status, "PENDING"),
          ),
        ),
    ]);

    const totalSubmissions = totalSubmissionsResult[0]?.count ?? 0;
    const pendingSubmissions = pendingSubmissionsResult[0]?.count ?? 0;

    if (totalSubmissions === 0 || pendingSubmissions > 0) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Peer voting can start only after staff reviews all submitted photos",
      });
    }
  }

  const { effectiveSubmissionType, effectiveExpectedValue, effectiveAutoApprove } =
    computeEffectiveChallengeValues(
      {
        submissionType: input.submissionType,
        qrCodeValue: input.qrCodeValue,
        textExpectedPhrase: input.textExpectedPhrase,
        autoApprove: input.autoApprove,
      },
      {
        submissionType:
          existing.submissionType === "MULTI_IMAGE" ? "IMAGE" : existing.submissionType,
        expectedValue: existing.expectedValue,
        autoApprove: existing.autoApprove,
      },
    );

  if (effectiveSubmissionType === "IMAGE_LOCATION" && input.autoApprove) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Image + Location challenges cannot use auto-approve",
    });
  }

  if (
    effectiveSubmissionType === "TEXT" &&
    effectiveAutoApprove &&
    !effectiveExpectedValue?.trim()
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Text auto-approve requires an expected phrase, or disable auto-approve",
    });
  }

  const { votingStartTime, votingEndTime } = resolveVotingTimes({
    scoringCategory: nextScoringCategory,
    status: nextStatus,
    votingStartTime: input.votingStartTime,
    votingEndTime: input.votingEndTime,
    peerVotingTemplateWindow,
  });

  const challenge = await context.db.transaction(async (tx) => {
    const [updatedChallenge] = await tx
      .update(challenges)
      .set({
        name: input.name,
        description: input.description !== undefined ? (input.description ?? null) : undefined,
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
        status: input.status,
        startTime: recurringWindow?.startTime ?? input.startTime,
        endTime: recurringWindow?.endTime ?? input.endTime,
        votingStartTime,
        votingEndTime,
        targetLatitude: input.targetLatitude,
        targetLongitude: input.targetLongitude,
        expectedValue: effectiveExpectedValue,
        autoApprove: effectiveAutoApprove,
      })
      .where(eq(challenges.id, input.id))
      .returning();

    if (!updatedChallenge) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update challenge",
      });
    }

    if (updatedChallenge.isRecurring) {
      await precreateRecurringInstancesForTemplate({
        tx,
        template: updatedChallenge,
      });
    }

    await createChallengeStatusActivityFromTransition({
      tx,
      challengeId: updatedChallenge.id,
      previousStatus: existing.status,
      nextStatus: updatedChallenge.status,
      createdByAdmin: context.dbUser.id,
    });

    return updatedChallenge;
  });

  return {
    ...toClientChallenge(challenge),
    image: await resolveChallengeImage(context.supabase, challenge.image),
  };
};

export const deleteChallenge = async (
  context: { db: DB },
  input: { id: string; tripId: string },
) => {
  const existing = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, input.id), eq(c.tripId, input.tripId)),
    columns: { id: true },
  });

  if (!existing) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }

  await context.db.delete(challenges).where(eq(challenges.id, input.id));

  return { success: true };
};

export const forceCloseVoting = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string };
  },
  input: { id: string; tripId: string },
) => {
  const existing = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, input.id), eq(c.tripId, input.tripId)),
    columns: {
      id: true,
      status: true,
      scoringCategory: true,
    },
  });

  if (!existing) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }

  if (existing.scoringCategory !== "PEER_VOTING") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Force close voting is only available for peer voting challenges",
    });
  }

  if (existing.status !== "VOTING_PHASE") {
    throw new ORPCError("BAD_REQUEST", { message: "Challenge is not in voting phase" });
  }

  const challenge = await context.db.transaction(async (tx) => {
    const [updatedChallenge] = await tx
      .update(challenges)
      .set({
        status: "COMPLETED",
        votingEndTime: new Date(),
      })
      .where(eq(challenges.id, input.id))
      .returning();

    if (!updatedChallenge) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update challenge",
      });
    }

    await createChallengeStatusActivityFromTransition({
      tx,
      challengeId: updatedChallenge.id,
      previousStatus: existing.status,
      nextStatus: updatedChallenge.status,
      createdByAdmin: context.dbUser.id,
    });

    return updatedChallenge;
  });

  return {
    ...toClientChallenge(challenge),
    image: await resolveChallengeImage(context.supabase, challenge.image),
  };
};
