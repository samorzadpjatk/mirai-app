import {
  type DB,
  challengeLocation,
  challengeQrCode,
  challengeRecurrence,
  challengeSubmissions,
  challengeText,
  challenges,
} from "@mirai-app/db";
import {
  computeEffectiveChallengeValues,
  inferPeerVotingDurationHours,
  inferRecurringDaysFromWindow,
  prepareChallengeInsert,
  resolvePeerVotingTemplateWindow,
  resolveRecurringDays,
  resolveRecurringTemplateWindow,
  resolveVotingTimes,
  validatePeerVotingTimeline,
  validateRecurringTimeline,
} from "@mirai-app/shared/challenges";
import { ORPCError } from "@orpc/server";
import { and, count, eq } from "drizzle-orm";
import {
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
} from "../../../utils/activityFeed";
import { precreateRecurringInstancesForTemplate } from "../../../utils/recurringChallenges";
import { normalizeChallengeImageInput } from "./types";
import { fetchChallengeWithRelations, resolveChallengeImage, toClientChallenge } from "./utils";

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

  const {
    challenge: insertValues,
    recurrence: recurrenceValues,
    location: locationValues,
    text: textValues,
    qrCode: qrCodeValues,
  } = prepareChallengeInsert(input, now);

  if (recurrenceValues.isRecurring && recurrenceValues.recurringDays === 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Recurring challenge requires number of days",
    });
  }

  const recurringWindow =
    recurrenceValues.isRecurring && recurrenceValues.recurringDays > 0
      ? resolveRecurringTemplateWindow({
          anchorDate: input.startTime ?? now,
          recurringDays: recurrenceValues.recurringDays,
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
    isRecurring: recurrenceValues.isRecurring,
    dailyStartTime: recurrenceValues.dailyStartTime,
    dailyEndTime: recurrenceValues.dailyEndTime,
    recurringDays: recurrenceValues.recurringDays,
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

  if (input.submissionType === "TEXT" && input.autoApprove && !input.textExpectedPhrase?.trim()) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Text auto-approve requires an expected phrase, or disable auto-approve",
    });
  }

  const challenge = await context.db.transaction(async (tx) => {
    const [createdChallenge] = await tx.insert(challenges).values(insertValues).returning();

    if (!createdChallenge) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create challenge",
      });
    }

    await tx.insert(challengeRecurrence).values({
      challengeId: createdChallenge.id,
      ...recurrenceValues,
    });

    await tx.insert(challengeLocation).values({
      challengeId: createdChallenge.id,
      ...locationValues,
    });

    if (textValues) {
      await tx.insert(challengeText).values({
        challengeId: createdChallenge.id,
        ...textValues,
      });
    }

    if (qrCodeValues) {
      await tx.insert(challengeQrCode).values({
        challengeId: createdChallenge.id,
        ...qrCodeValues,
      });
    }

    if (recurrenceValues.isRecurring) {
      await precreateRecurringInstancesForTemplate({
        tx,
        template: {
          ...createdChallenge,
          dailyStartTime: recurrenceValues.dailyStartTime,
          dailyEndTime: recurrenceValues.dailyEndTime,
          isRecurring: recurrenceValues.isRecurring,
          recurringDays: recurrenceValues.recurringDays,
          targetLatitude: locationValues.targetLatitude,
          targetLongitude: locationValues.targetLongitude,
          textExpectedPhrase: textValues?.expectedPhrase ?? null,
          qrCodeValue: qrCodeValues?.expectedValue ?? null,
        },
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
    ...toClientChallenge({
      ...challenge,
      ...recurrenceValues,
      ...locationValues,
      textExpectedPhrase: textValues?.expectedPhrase ?? null,
      qrCodeValue: qrCodeValues?.expectedValue ?? null,
    }),
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
  const existing = await fetchChallengeWithRelations(
    context.db,
    and(eq(challenges.id, input.id), eq(challenges.tripId, input.tripId)),
  );

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

  const nextIsRecurring = input.isRecurring ?? existing.isRecurring ?? false;
  const inferredRecurringDays = inferRecurringDaysFromWindow(existing.startTime, existing.endTime);
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
        textExpectedPhrase: existing.textExpectedPhrase,
        qrCodeValue: existing.qrCodeValue,
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
        basePoints: input.basePoints,
        firstPlacePoints: input.firstPlacePoints,
        secondPlacePoints: input.secondPlacePoints,
        thirdPlacePoints: input.thirdPlacePoints,
        status: input.status,
        startTime: recurringWindow?.startTime ?? input.startTime,
        endTime: recurringWindow?.endTime ?? input.endTime,
        votingStartTime,
        votingEndTime,
        autoApprove: effectiveAutoApprove,
      })
      .where(eq(challenges.id, input.id))
      .returning();

    if (!updatedChallenge) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update challenge",
      });
    }

    const recurrenceValues = {
      isRecurring: nextIsRecurring,
      dailyStartTime: input.dailyStartTime ?? existing.dailyStartTime ?? "",
      dailyEndTime: input.dailyEndTime ?? existing.dailyEndTime ?? "",
      recurringDays: recurringDays ?? 0,
      type: "DAILY" as const,
    };

    await tx
      .insert(challengeRecurrence)
      .values({ challengeId: updatedChallenge.id, ...recurrenceValues })
      .onConflictDoUpdate({
        target: challengeRecurrence.challengeId,
        set: recurrenceValues,
      });

    const locationValues = {
      targetLatitude: input.targetLatitude ?? existing.targetLatitude ?? 0,
      targetLongitude: input.targetLongitude ?? existing.targetLongitude ?? 0,
    };

    await tx
      .insert(challengeLocation)
      .values({ challengeId: updatedChallenge.id, ...locationValues })
      .onConflictDoUpdate({
        target: challengeLocation.challengeId,
        set: locationValues,
      });

    if (effectiveSubmissionType === "TEXT" && effectiveExpectedValue) {
      await tx
        .insert(challengeText)
        .values({
          challengeId: updatedChallenge.id,
          expectedPhrase: effectiveExpectedValue,
        })
        .onConflictDoUpdate({
          target: challengeText.challengeId,
          set: { expectedPhrase: effectiveExpectedValue },
        });
    } else if (effectiveSubmissionType === "QR_CODE" && effectiveExpectedValue) {
      await tx
        .insert(challengeQrCode)
        .values({
          challengeId: updatedChallenge.id,
          expectedValue: effectiveExpectedValue,
        })
        .onConflictDoUpdate({
          target: challengeQrCode.challengeId,
          set: { expectedValue: effectiveExpectedValue },
        });
    }

    if (recurrenceValues.isRecurring) {
      await precreateRecurringInstancesForTemplate({
        tx,
        template: {
          ...updatedChallenge,
          dailyStartTime: recurrenceValues.dailyStartTime,
          dailyEndTime: recurrenceValues.dailyEndTime,
          isRecurring: recurrenceValues.isRecurring,
          recurringDays: recurrenceValues.recurringDays,
          targetLatitude: locationValues.targetLatitude,
          targetLongitude: locationValues.targetLongitude,
          textExpectedPhrase:
            effectiveSubmissionType === "TEXT" ? (effectiveExpectedValue ?? null) : null,
          qrCodeValue:
            effectiveSubmissionType === "QR_CODE" ? (effectiveExpectedValue ?? null) : null,
        },
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
    ...toClientChallenge({
      ...challenge,
      isRecurring: nextIsRecurring,
      dailyStartTime: input.dailyStartTime ?? existing.dailyStartTime,
      dailyEndTime: input.dailyEndTime ?? existing.dailyEndTime,
      recurringDays: recurringDays ?? 0,
      targetLatitude: input.targetLatitude ?? existing.targetLatitude,
      targetLongitude: input.targetLongitude ?? existing.targetLongitude,
      textExpectedPhrase:
        effectiveSubmissionType === "TEXT" ? (effectiveExpectedValue ?? null) : null,
      qrCodeValue: effectiveSubmissionType === "QR_CODE" ? (effectiveExpectedValue ?? null) : null,
    }),
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
