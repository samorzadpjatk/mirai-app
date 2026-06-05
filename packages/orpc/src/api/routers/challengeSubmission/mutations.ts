import {
  activityFeeds,
  challengeLocation,
  challengeQrCode,
  challengeSubmissions,
  challengeText,
  challenges,
  coinTransactions,
  groups,
  submissionActivities,
} from "@mirai-app/db";
import type { ChallengeSubmission, DB } from "@mirai-app/db";
import {
  resolveAwardedPoints,
  shouldAutoApproveSubmission,
  validateSubmissionPayload,
} from "@mirai-app/shared/challengeSubmissions";
import { ORPCError } from "@orpc/server";
import { and, eq, lte, sql } from "drizzle-orm";
import {
  captureTripRankingSnapshot,
  createChallengeStatusActivityById,
  createRankChangeActivities,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
} from "../../../utils/activityFeed";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { resolveRecurringChallengeIdForTrip } from "../../../utils/recurringChallenges";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import type { WhereCallback } from "../utils/drizzle-types";
import type { SubmissionContext } from "./queries";
import { submissionBaseColumns, submissionWithRelations } from "./types";
import {
  attachReviewerEmail,
  ensureChallengeInTrip,
  ensureTripParticipant,
  rebalanceSpeedRankings,
} from "./utils";

export const createSubmission = async (
  context: SubmissionContext,
  input: {
    tripId: string;
    challengeId: string;
    imageIds?: string[];
    videoId?: string;
    textContent?: string;
    latitude?: number;
    longitude?: number;
  },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const participant = await ensureTripParticipant(context, input.tripId);
  if (!participant.groupId) {
    throw new ORPCError("BAD_REQUEST", { message: "Użytkownik nie jest przypisany do grupy" });
  }
  const participantGroupId = participant.groupId;
  const resolvedChallengeId =
    (await resolveRecurringChallengeIdForTrip({
      tx: context.db,
      challengeId: input.challengeId,
      tripId: input.tripId,
    })) ?? input.challengeId;

  const challenge = await ensureChallengeInTrip(context, resolvedChallengeId, input.tripId);

  if (challenge.status !== "ACTIVE") {
    throw new ORPCError("FORBIDDEN", {
      message: "Submission is allowed only for active challenges",
    });
  }

  if (challenge.endTime && challenge.endTime <= new Date()) {
    throw new ORPCError("FORBIDDEN", { message: "Submission window has ended" });
  }

  const matchExistingSubmission: WhereCallback<"challengeSubmissions"> = (cs, { eq, and }) =>
    and(eq(cs.challengeId, resolvedChallengeId), eq(cs.groupId, participantGroupId));

  const existing = await context.db.query.challengeSubmissions.findFirst({
    where: matchExistingSubmission,
    columns: { id: true },
  });

  if (existing) {
    throw new ORPCError("CONFLICT", { message: "Zgłoszenie dla tej grupy już istnieje" });
  }

  validateSubmissionPayload({
    submissionType: challenge.submissionType,
    imageIds: input.imageIds,
    videoId: input.videoId,
    textContent: input.textContent,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  const autoApproved = shouldAutoApproveSubmission({
    challenge,
    textContent: input.textContent,
    latitude: input.latitude,
    longitude: input.longitude,
  });
  const now = new Date();

  const awardPoints = autoApproved ? resolveAwardedPoints(challenge, {}) : 0;
  const shouldAwardCoins = autoApproved && awardPoints > 0;

  const createdSubmissionId = await context.db.transaction(async (tx) => {
    const previousRankingSnapshot = shouldAwardCoins
      ? await captureTripRankingSnapshot(tx, input.tripId)
      : null;

    const [createdSubmission] = await tx
      .insert(challengeSubmissions)
      .values({
        challengeId: resolvedChallengeId,
        groupId: participantGroupId,
        imageIds: input.imageIds ?? [],
        videoId: input.videoId,
        textContent: input.textContent,
        latitude: input.latitude,
        longitude: input.longitude,
        status: autoApproved ? "APPROVED" : "PENDING",
        reviewedAt: autoApproved ? now : undefined,
      })
      .returning({ id: challengeSubmissions.id });

    if (shouldAwardCoins) {
      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${awardPoints}`,
        })
        .where(eq(groups.id, participantGroupId));
      await tx.insert(coinTransactions).values({
        groupId: participantGroupId,
        amount: awardPoints,
        reason: `Auto-approved challenge: ${challenge.name}`,
        adminId: context.dbUser.id,
      });

      if (previousRankingSnapshot) {
        await createRankChangeActivities({
          tx,
          tripId: input.tripId,
          previousSnapshot: previousRankingSnapshot,
          createdByAdmin: context.dbUser.id,
        });
      }
    }

    return createdSubmission;
  });

  if (!createdSubmissionId) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create submission" });
  }
  const matchCreatedSubmissionId: WhereCallback<"challengeSubmissions"> = (cs, { eq }) =>
    eq(cs.id, createdSubmissionId.id);

  const submission = await context.db.query.challengeSubmissions.findFirst({
    where: matchCreatedSubmissionId,
    columns: submissionBaseColumns,
    with: submissionWithRelations,
  });

  if (!submission) {
    throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    submission.reviewedBy?.authUserId,
  ]);

  return {
    ...submission,
    reviewedBy: attachReviewerEmail(submission.reviewedBy, emailByAuthUserId),
  };
};

export const updateMineSubmission = async (
  context: SubmissionContext,
  input: {
    id: string;
    tripId: string;
    imageIds?: string[];
    videoId?: string;
    textContent?: string;
    latitude?: number;
    longitude?: number;
  },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const participant = await ensureTripParticipant(context, input.tripId);
  if (!participant.groupId) {
    throw new ORPCError("BAD_REQUEST", { message: "Uzytkownik nie jest przypisany do grupy" });
  }

  const participantGroupId = participant.groupId;
  const matchMySubmission: WhereCallback<"challengeSubmissions"> = (cs, { eq, and }) =>
    and(eq(cs.id, input.id), eq(cs.groupId, participantGroupId));

  const submission = await context.db.query.challengeSubmissions.findFirst({
    where: matchMySubmission,
    columns: {
      id: true,
      status: true,
      imageIds: true,
      videoId: true,
      textContent: true,
      latitude: true,
      longitude: true,
    },
    with: {
      challenge: {
        columns: {
          id: true,
          tripId: true,
          status: true,
          scoringCategory: true,
          startTime: true,
          endTime: true,
          votingStartTime: true,
          submissionType: true,
          description: true,
          autoApprove: true,
        },
      },
    },
  });

  if (submission?.challenge.tripId !== input.tripId) {
    throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
  }

  const [challengeLocationData] = await context.db
    .select({
      targetLatitude: challengeLocation.targetLatitude,
      targetLongitude: challengeLocation.targetLongitude,
    })
    .from(challengeLocation)
    .where(eq(challengeLocation.challengeId, submission.challenge.id))
    .limit(1);

  const [challengeTextData] = await context.db
    .select({
      expectedPhrase: challengeText.expectedPhrase,
    })
    .from(challengeText)
    .where(eq(challengeText.challengeId, submission.challenge.id))
    .limit(1);

  const [challengeQrCodeData] = await context.db
    .select({
      expectedValue: challengeQrCode.expectedValue,
    })
    .from(challengeQrCode)
    .where(eq(challengeQrCode.challengeId, submission.challenge.id))
    .limit(1);

  const challengeWithLocation = {
    ...submission.challenge,
    targetLatitude: challengeLocationData?.targetLatitude ?? 0,
    targetLongitude: challengeLocationData?.targetLongitude ?? 0,
    textExpectedPhrase: challengeTextData?.expectedPhrase ?? null,
    qrCodeValue: challengeQrCodeData?.expectedValue ?? null,
  };

  if (submission.status === "APPROVED") {
    throw new ORPCError("FORBIDDEN", {
      message: "Nie można edytować zatwierdzonego zgłoszenia",
    });
  }

  const currentTime = new Date();

  const updatedSubmissionId = await context.db.transaction(
    async (tx): Promise<ChallengeSubmission> => {
      if (
        submission.challenge.status === "VISIBLE" &&
        submission.challenge.startTime &&
        submission.challenge.startTime <= currentTime
      ) {
        const activation = await tx
          .update(challenges)
          .set({ status: "ACTIVE" })
          .where(and(eq(challenges.id, submission.challenge.id), eq(challenges.status, "VISIBLE")))
          .returning({ id: challenges.id });

        if (activation.length > 0) {
          await createChallengeStatusActivityById({
            tx,
            challengeId: submission.challenge.id,
            eventType: "challenge_started",
            createdByAdmin: null,
          });
        }
        submission.challenge.status = "ACTIVE";
      }

      if (
        submission.challenge.status === "ACTIVE" &&
        submission.challenge.scoringCategory === "PEER_VOTING" &&
        submission.challenge.votingStartTime &&
        submission.challenge.votingStartTime <= currentTime
      ) {
        const movedToVoting = await tx
          .update(challenges)
          .set({ status: "VOTING_PHASE" })
          .where(
            and(
              eq(challenges.id, submission.challenge.id),
              eq(challenges.status, "ACTIVE"),
              eq(challenges.scoringCategory, "PEER_VOTING"),
              lte(challenges.votingStartTime, currentTime),
            ),
          )
          .returning({ id: challenges.id });

        if (movedToVoting.length > 0) {
          await createChallengeStatusActivityById({
            tx,
            challengeId: submission.challenge.id,
            eventType: "voting_started",
            createdByAdmin: null,
          });
        }
        submission.challenge.status = "VOTING_PHASE";
      } else if (
        (submission.challenge.status === "VISIBLE" || submission.challenge.status === "ACTIVE") &&
        submission.challenge.scoringCategory !== "PEER_VOTING" &&
        submission.challenge.scoringCategory !== "JUDGED_STAFF" &&
        submission.challenge.endTime &&
        submission.challenge.endTime <= currentTime
      ) {
        await tx
          .update(challenges)
          .set({ status: "COMPLETED" })
          .where(eq(challenges.id, submission.challenge.id));
        submission.challenge.status = "COMPLETED";
      }

      if (submission.challenge.status !== "ACTIVE") {
        throw new ORPCError("FORBIDDEN", {
          message: "Submission is allowed only for active challenges",
        });
      }

      if (submission.challenge.endTime && submission.challenge.endTime <= currentTime) {
        throw new ORPCError("FORBIDDEN", { message: "Submission window has ended" });
      }

      const nextImageIds = input.imageIds ?? submission.imageIds;
      const nextVideoId = input.videoId ?? submission.videoId;
      const nextTextContent = input.textContent ?? submission.textContent;
      const nextLatitude = input.latitude ?? submission.latitude;
      const nextLongitude = input.longitude ?? submission.longitude;

      validateSubmissionPayload({
        submissionType: submission.challenge.submissionType,
        imageIds: nextImageIds,
        videoId: nextVideoId,
        textContent: nextTextContent,
        latitude: nextLatitude ?? undefined,
        longitude: nextLongitude ?? undefined,
      });

      const autoApproved = shouldAutoApproveSubmission({
        challenge: challengeWithLocation,
        textContent: nextTextContent,
        latitude: nextLatitude,
        longitude: nextLongitude,
      });
      const now = new Date();

      const updated = await tx
        .update(challengeSubmissions)
        .set({
          imageIds: input.imageIds,
          videoId: input.videoId,
          textContent: input.textContent,
          latitude: input.latitude,
          longitude: input.longitude,
          status: autoApproved ? "APPROVED" : "PENDING",
          reviewedAt: autoApproved ? now : null,
          reviewedById: null,
          rejectionReason: null,
        })
        .where(eq(challengeSubmissions.id, input.id))
        .returning();

      const updatedRow = Array.isArray(updated) ? updated[0] : updated;
      if (!updatedRow) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update submission",
        });
      }
      return updatedRow;
    },
  );

  const matchUpdatedSubmissionId: WhereCallback<"challengeSubmissions"> = (cs, { eq }) =>
    eq(cs.id, updatedSubmissionId.id);

  const enrichedSubmission = await context.db.query.challengeSubmissions.findFirst({
    where: matchUpdatedSubmissionId,
    columns: submissionBaseColumns,
    with: submissionWithRelations,
  });

  if (!enrichedSubmission) {
    throw new ORPCError("NOT_FOUND", { message: "Submission not found" });
  }

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    enrichedSubmission.reviewedBy?.authUserId,
  ]);

  return {
    ...enrichedSubmission,
    reviewedBy: attachReviewerEmail(enrichedSubmission.reviewedBy, emailByAuthUserId),
  };
};

export const deleteMineSubmission = async (
  context: SubmissionContext,
  input: { id: string; tripId: string },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const participant = await ensureTripParticipant(context, input.tripId);
  if (!participant.groupId) {
    throw new ORPCError("BAD_REQUEST", { message: "Użytkownik nie jest przypisany do grupy" });
  }

  const result = await context.db
    .select({
      id: challengeSubmissions.id,
      status: challengeSubmissions.status,
    })
    .from(challengeSubmissions)
    .innerJoin(challenges, eq(challengeSubmissions.challengeId, challenges.id))
    .where(
      and(
        eq(challengeSubmissions.id, input.id),
        eq(challengeSubmissions.groupId, participant.groupId),
        eq(challenges.tripId, input.tripId),
      ),
    );

  const submission = result[0];

  if (!submission) {
    throw new ORPCError("NOT_FOUND", { message: "Zgłoszenie nie zostało znalezione" });
  }

  if (submission.status === "APPROVED") {
    throw new ORPCError("FORBIDDEN", { message: "Nie można usunąć zatwierdzonego zgłoszenia" });
  }

  await context.db.delete(challengeSubmissions).where(eq(challengeSubmissions.id, input.id));
  return { success: true };
};

export const reviewSubmission = async (
  context: SubmissionContext,
  input: {
    id: string;
    status: "APPROVED" | "REJECTED";
    rejectionReason?: string;
    awardedPoints?: number;
    bonusPoints?: number;
    ranking?: number;
  },
) => {
  if (input.status === "REJECTED" && !input.rejectionReason) {
    throw new ORPCError("BAD_REQUEST", { message: "Wymagany jest powód odrzucenia" });
  }

  const matchSubmissionId: WhereCallback<"challengeSubmissions"> = (cs, { eq }) =>
    eq(cs.id, input.id);

  const submission = await context.db.query.challengeSubmissions.findFirst({
    where: matchSubmissionId,
    columns: {
      id: true,
      status: true,
      groupId: true,
      awardedPoints: true,
      bonusPoints: true,
      ranking: true,
    },
    with: {
      challenge: {
        columns: {
          id: true,
          tripId: true,
          name: true,
          submissionType: true,
          scoringCategory: true,
          basePoints: true,
          firstPlacePoints: true,
          secondPlacePoints: true,
          thirdPlacePoints: true,
        },
      },
    },
  });

  if (!submission) {
    throw new ORPCError("NOT_FOUND", { message: "Zgłoszenie nie zostało znalezione" });
  }

  if (submission.challenge.scoringCategory === "JUDGED_STAFF") {
    throw new ORPCError("BAD_REQUEST", {
      message: "For judged staff challenges use staff voting flow instead of manual approve/reject",
    });
  }

  const isSpeed = submission.challenge.scoringCategory === "SPEED";

  const shouldCreateApprovalActivity =
    input.status === "APPROVED" &&
    submission.status !== "APPROVED" &&
    submission.challenge.submissionType !== "TEXT";
  const shouldAwardCoins = shouldCreateApprovalActivity;
  const awardPoints = shouldAwardCoins
    ? resolveAwardedPoints(submission.challenge, {
        awardedPoints: input.awardedPoints,
        ranking: input.ranking,
      })
    : 0;
  const bonusPoints = shouldAwardCoins ? (input.bonusPoints ?? 0) : 0;
  const totalAwardPoints = awardPoints + bonusPoints;

  const updatedSubmission = await context.db.transaction(async (tx) => {
    const shouldCaptureRankingSnapshot = shouldCreateApprovalActivity;
    const previousRankingSnapshot = shouldCaptureRankingSnapshot
      ? await captureTripRankingSnapshot(tx, submission.challenge.tripId)
      : null;

    await tx
      .update(challengeSubmissions)
      .set({
        status: input.status,
        rejectionReason: input.status === "REJECTED" ? input.rejectionReason : null,
        reviewedById: context.dbUser.id,
        reviewedAt: new Date(),
        awardedPoints: isSpeed ? undefined : input.awardedPoints,
        bonusPoints: input.bonusPoints,
        ranking: isSpeed ? undefined : input.ranking,
      })
      .where(eq(challengeSubmissions.id, input.id));

    if (isSpeed && input.status === "APPROVED") {
      await rebalanceSpeedRankings({
        tx,
        challenge: submission.challenge,
        adminId: context.dbUser.id,
      });
    } else if (shouldAwardCoins && totalAwardPoints > 0) {
      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${totalAwardPoints}`,
        })
        .where(eq(groups.id, submission.groupId));
      await tx.insert(coinTransactions).values({
        groupId: submission.groupId,
        amount: totalAwardPoints,
        reason: `Challenge approved: ${submission.challenge.name}`,
        adminId: context.dbUser.id,
      });
    }

    if (submission.challenge.scoringCategory === "PEER_VOTING") {
      await promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
        tx,
        where: { id: submission.challenge.id },
        createdByAdmin: context.dbUser.id,
      });
    }

    const matchSubmissionId: WhereCallback<"challengeSubmissions"> = (cs, { eq }) =>
      eq(cs.id, input.id);

    const refreshedForResponse = await tx.query.challengeSubmissions.findFirst({
      where: matchSubmissionId,
      columns: submissionBaseColumns,
      with: submissionWithRelations,
    });

    if (!refreshedForResponse) {
      throw new ORPCError("NOT_FOUND", { message: "Zgłoszenie nie zostało znalezione" });
    }

    if (shouldCreateApprovalActivity) {
      const matchSubmissionActivity: WhereCallback<"submissionActivities"> = (sa, { eq }) =>
        eq(sa.submissionId, input.id);

      const existingSubmissionActivity = await tx.query.submissionActivities.findFirst({
        where: matchSubmissionActivity,
        columns: { activityId: true },
      });

      if (!existingSubmissionActivity) {
        const refreshedForActivity = await tx.query.challengeSubmissions.findFirst({
          where: matchSubmissionId,
          columns: {
            id: true,
            challengeId: true,
            groupId: true,
            imageIds: true,
            videoId: true,
            awardedPoints: true,
            bonusPoints: true,
            ranking: true,
          },
          with: {
            challenge: {
              columns: { id: true, tripId: true, name: true },
            },
            group: {
              columns: { id: true, name: true },
            },
          },
        });

        if (!refreshedForActivity) {
          throw new ORPCError("NOT_FOUND", { message: "Zgłoszenie nie zostało znalezione" });
        }

        const totalPoints =
          (refreshedForActivity.awardedPoints ?? 0) + (refreshedForActivity.bonusPoints ?? 0);

        const [feed] = await tx
          .insert(activityFeeds)
          .values({
            tripId: refreshedForActivity.challenge.tripId,
            activityType: "submission",
            title: `Drużyna ${refreshedForActivity.group.name} wrzuciła fotę do wyzwania ${refreshedForActivity.challenge.name}`,
            description: "Nie czekaj, ty też podejmij wyzwanie!",
            imageUrl: refreshedForActivity.imageIds[0] ?? "",
            createdByAdmin: context.dbUser.id,
          })
          .returning();

        if (!feed) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create activity feed",
          });
        }

        await tx.insert(submissionActivities).values({
          activityId: feed.id,
          submissionId: refreshedForActivity.id,
          challengeId: refreshedForActivity.challengeId,
          groupId: refreshedForActivity.groupId,
          hasVideo: Boolean(refreshedForActivity.videoId),
          isWinner: refreshedForActivity.ranking === 1,
          ranking: refreshedForActivity.ranking,
          pointsAwarded: totalPoints,
        });
      }
    }

    if (previousRankingSnapshot) {
      await createRankChangeActivities({
        tx,
        tripId: submission.challenge.tripId,
        previousSnapshot: previousRankingSnapshot,
        createdByAdmin: context.dbUser.id,
      });
    }

    return refreshedForResponse;
  });

  const emailByAuthUserId = await buildAuthEmailLookup(context.supabase, [
    updatedSubmission.reviewedBy?.authUserId,
  ]);

  return {
    ...updatedSubmission,
    reviewedBy: attachReviewerEmail(updatedSubmission.reviewedBy, emailByAuthUserId),
  };
};

export const adminDeleteSubmission = async (context: { db: DB }, input: { id: string }) => {
  await context.db.delete(challengeSubmissions).where(eq(challengeSubmissions.id, input.id));
  return { success: true };
};
