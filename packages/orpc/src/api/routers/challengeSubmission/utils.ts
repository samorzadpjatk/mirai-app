import { ORPCError } from "@orpc/server";
import { eq, and, sql, notInArray, lte } from "drizzle-orm";
import { challenges, challengeSubmissions, groups, coinTransactions } from "@mirai-app/db";
import type { DB, TransactionDB } from "@mirai-app/db";
import { resolveAuthEmail } from "../../../utils/authEmails";
import { calculateDistance } from "../../../utils/location-validation";
import {
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../../utils/activityFeed";

export const attachReviewerEmail = <T extends { authUserId?: string | null }>(
  reviewer: T | null,
  emailByAuthUserId: Map<string, string | null>,
) => {
  if (!reviewer) return reviewer;
  const { authUserId, ...rest } = reviewer;
  return {
    ...rest,
    email: resolveAuthEmail(emailByAuthUserId, authUserId),
  };
};

export const ensureTripParticipant = async (
  context: { db: DB | TransactionDB; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) => and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, tripId)),
  });
  if (!participant) {
    throw new ORPCError("FORBIDDEN", { message: "Brak dostepu do wyjazdu" });
  }
  return participant;
};

export const ensureChallengeInTrip = async (
  context: { db: DB | TransactionDB },
  challengeId: string,
  tripId: string,
) => {
  const now = new Date();

  await context.db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.tripId, tripId),
        eq(challenges.status, "VISIBLE"),
        notInArray(challenges.scoringCategory, ["PEER_VOTING", "JUDGED_STAFF"]),
        lte(challenges.endTime, now),
      ),
    );

  await promoteVisibleChallengesToActiveWithFeed({
    tx: context.db,
    where: { id: challengeId, tripId },
    createdByAdmin: null,
  });

  await promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
    tx: context.db,
    where: { id: challengeId, tripId },
    createdByAdmin: null,
  });

  await context.db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.tripId, tripId),
        eq(challenges.status, "ACTIVE"),
        notInArray(challenges.scoringCategory, ["PEER_VOTING", "JUDGED_STAFF"]),
        lte(challenges.endTime, now),
      ),
    );

  const challenge = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, challengeId), eq(c.tripId, tripId)),
    columns: {
      id: true,
      name: true,
      status: true,
      scoringCategory: true,
      startTime: true,
      endTime: true,
      votingStartTime: true,
      submissionType: true,
      description: true,
      expectedValue: true,
      targetLatitude: true,
      targetLongitude: true,
      autoApprove: true,
      basePoints: true,
      firstPlacePoints: true,
      secondPlacePoints: true,
      thirdPlacePoints: true,
    },
  });
  if (!challenge) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }
  return challenge;
};

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

export const resolveAwardedPoints = (
  challenge: {
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
  },
  input: { awardedPoints?: number; ranking?: number },
) => {
  if (typeof input.awardedPoints === "number") return input.awardedPoints;
  if (typeof input.ranking === "number") {
    switch (input.ranking) {
      case 1:
        return challenge.firstPlacePoints ?? challenge.basePoints;
      case 2:
        return challenge.secondPlacePoints ?? challenge.basePoints;
      case 3:
        return challenge.thirdPlacePoints ?? challenge.basePoints;
      default:
        return challenge.basePoints;
    }
  }

  return challenge.basePoints;
};

export const rebalanceSpeedRankings = async (params: {
  tx: DB | TransactionDB;
  challenge: {
    id: string;
    name: string;
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
  };
  adminId: string;
}) => {
  const approved = await params.tx.query.challengeSubmissions.findMany({
    where: (cs, { eq, and }) =>
      and(eq(cs.challengeId, params.challenge.id), eq(cs.status, "APPROVED")),
    columns: {
      id: true,
      groupId: true,
      createdAt: true,
      ranking: true,
      awardedPoints: true,
      bonusPoints: true,
    },
    orderBy: (cs, { asc }) => [asc(cs.createdAt), asc(cs.id)],
  });

  for (let index = 0; index < approved.length; index += 1) {
    const submission = approved[index];
    if (!submission) continue;

    const nextRanking = index + 1;
    const nextAwardedPoints = resolveAwardedPoints(params.challenge, {
      ranking: nextRanking,
    });

    const previousTotal = (submission.awardedPoints ?? 0) + (submission.bonusPoints ?? 0);
    const nextTotal = nextAwardedPoints + (submission.bonusPoints ?? 0);
    const delta = nextTotal - previousTotal;

    const rankingChanged = submission.ranking !== nextRanking;
    const pointsChanged = submission.awardedPoints !== nextAwardedPoints;
    if (!rankingChanged && !pointsChanged && delta === 0) {
      continue;
    }

    await params.tx
      .update(challengeSubmissions)
      .set({
        ranking: nextRanking,
        awardedPoints: nextAwardedPoints,
      })
      .where(eq(challengeSubmissions.id, submission.id));

    if (delta !== 0) {
      await params.tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${delta}`,
        })
        .where(eq(groups.id, submission.groupId));
      await params.tx.insert(coinTransactions).values({
        groupId: submission.groupId,
        amount: delta,
        reason: `Speed ranking update: ${params.challenge.name} (#${nextRanking})`,
        adminId: params.adminId,
      });
    }
  }
};
