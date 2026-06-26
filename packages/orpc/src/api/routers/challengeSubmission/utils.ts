import { resolveAwardedPoints } from "@mirai-app/common/challengeSubmissions";
import type { DB, TransactionDB } from "@mirai-app/db";
import {
  challengeLocationMatch,
  challengeQrCode,
  challengeSubmissions,
  challenges,
  challengeText,
  coinTransactions,
  groups,
} from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, eq, lte, notInArray, sql } from "drizzle-orm";
import {
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../../utils/activityFeed";
import { resolveAuthEmail } from "../../../utils/authEmails";

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

  const [challenge] = await context.db
    .select({
      id: challenges.id,
      name: challenges.name,
      status: challenges.status,
      scoringCategory: challenges.scoringCategory,
      startTime: challenges.startTime,
      endTime: challenges.endTime,
      votingStartTime: challenges.votingStartTime,
      submissionType: challenges.submissionType,
      description: challenges.description,
      autoApprove: challenges.autoApprove,
      basePoints: challenges.basePoints,
      firstPlacePoints: challenges.firstPlacePoints,
      secondPlacePoints: challenges.secondPlacePoints,
      thirdPlacePoints: challenges.thirdPlacePoints,
      textExpectedPhrase: challengeText.expectedPhrase,
      qrCodeValue: challengeQrCode.expectedValue,
      targetLatitude: challengeLocationMatch.targetLatitude,
      targetLongitude: challengeLocationMatch.targetLongitude,
    })
    .from(challenges)
    .leftJoin(challengeLocationMatch, eq(challenges.id, challengeLocationMatch.challengeId))
    .leftJoin(challengeText, eq(challenges.id, challengeText.challengeId))
    .leftJoin(challengeQrCode, eq(challenges.id, challengeQrCode.challengeId))
    .where(and(eq(challenges.id, challengeId), eq(challenges.tripId, tripId)))
    .limit(1);

  if (!challenge) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }
  return challenge;
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
