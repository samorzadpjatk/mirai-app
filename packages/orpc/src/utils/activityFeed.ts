import {
  challenges,
  challengeSubmissions,
  challengeActivities,
  submissionActivities,
  activityFeeds,
  rankChangeActivities,
  groups,
  coinTransactions,
} from "@mirai-app/db";
import { eq, and, or, count, sql, lte, gt, isNull } from "drizzle-orm";
import type { DB, TransactionDB } from "@mirai-app/db";

const HOUR_MS = 60 * 60 * 1000;
export const DEFAULT_PEER_VOTING_DURATION_HOURS = 24;

export function resolvePeerVotingDurationHours(
  votingStartTime?: Date | null,
  votingEndTime?: Date | null,
): number {
  if (!votingStartTime || !votingEndTime) {
    return DEFAULT_PEER_VOTING_DURATION_HOURS;
  }

  const durationMs = votingEndTime.getTime() - votingStartTime.getTime();
  if (durationMs <= 0) {
    return DEFAULT_PEER_VOTING_DURATION_HOURS;
  }

  return Math.max(1, Math.ceil(durationMs / HOUR_MS));
}

type ChallengeEventType = "challenge_started" | "voting_started" | "completed";

interface ChallengeForFeed {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  endTime: Date | null;
  votingEndTime: Date | null;
}

type RankSnapshot = Map<
  string,
  {
    rank: number;
    coins: number;
    name: string;
    image: string | null;
  }
>;

const loadChallengeForFeed = async (
  tx: DB | TransactionDB,
  challengeId: string,
): Promise<ChallengeForFeed | null> => {
  const challenge = await tx.query.challenges.findFirst({
    where: (c, { eq }) => eq(c.id, challengeId),
  });

  return challenge ?? null;
};

export function formatSubmissionDeadline(value: Date | null): string {
  if (!value) {
    return "zakończenia etapu zgłoszeń";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

const createChallengeEventActivity = async (params: {
  tx: DB | TransactionDB;
  challenge: ChallengeForFeed;
  eventType: ChallengeEventType;
  createdByAdmin?: string | null;
}) => {
  const submissionCountResult = await params.tx
    .select({ count: count() })
    .from(challengeSubmissions)
    .where(eq(challengeSubmissions.challengeId, params.challenge.id));
  const submissionCount = Number(submissionCountResult[0]?.count ?? 0);

  const title =
    params.eventType === "challenge_started"
      ? `Czas start! Już teraz weź udział w wyzwaniu ${params.challenge.name}.`
      : params.eventType === "voting_started"
        ? `Voting started: ${params.challenge.name}`
        : `Challenge completed: ${params.challenge.name}`;

  const challengeDescription =
    params.eventType === "completed" ? null : params.challenge.description?.trim();

  const description =
    challengeDescription ??
    (params.eventType === "challenge_started"
      ? `Nie czekajcie za długo. Macie czas tylko do ${formatSubmissionDeadline(params.challenge.endTime)} na wysłanie Waszego zdjęcia grupy.`
      : params.eventType === "voting_started"
        ? "Challenge entered voting phase"
        : "Voting has ended");

  const activityFeedResult = await params.tx
    .insert(activityFeeds)
    .values({
      tripId: params.challenge.tripId,
      activityType: "challenge_event",
      title,
      description,
      imageUrl: params.challenge.image,
      createdByAdmin: params.createdByAdmin ?? null,
    })
    .returning();

  if (activityFeedResult[0]) {
    await params.tx.insert(challengeActivities).values({
      activityId: activityFeedResult[0].id,
      challengeId: params.challenge.id,
      eventType: params.eventType,
      endTime:
        params.eventType === "challenge_started"
          ? params.challenge.endTime
          : params.eventType === "voting_started"
            ? params.challenge.votingEndTime
            : new Date(),
      submissionType:
        params.eventType === "challenge_started" ? params.challenge.submissionType : null,
      basePoints: params.eventType === "challenge_started" ? params.challenge.basePoints : null,
      submissionCount:
        params.eventType === "voting_started" || params.eventType === "completed"
          ? submissionCount
          : null,
    });
  }
};

export function resolvePodiumPoints(
  challenge: Pick<
    ChallengeForFeed,
    "basePoints" | "firstPlacePoints" | "secondPlacePoints" | "thirdPlacePoints"
  >,
  ranking: number,
): number {
  switch (ranking) {
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

const resolveCoinTransactionActorId = async (params: {
  tx: DB | TransactionDB;
  createdByAdmin?: string | null;
}) => {
  if (params.createdByAdmin) {
    return params.createdByAdmin;
  }

  const privileged = await params.tx.query.users.findFirst({
    where: (u, { inArray }) => inArray(u.role, ["SERVICE", "ADMIN", "MODERATOR"]),
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });

  if (privileged?.id) {
    return privileged.id;
  }

  const fallback = await params.tx.query.users.findFirst({
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });

  return fallback?.id ?? null;
};

export const createChallengeCompletionWithWinnersById = async (params: {
  tx: DB | TransactionDB;
  challengeId: string;
  createdByAdmin?: string | null;
}) => {
  const challenge = await loadChallengeForFeed(params.tx, params.challengeId);
  if (!challenge) return;

  const hasCompletedEvent = await params.tx.query.challengeActivities.findFirst({
    where: (ca, { eq, and }) =>
      and(eq(ca.challengeId, challenge.id), eq(ca.eventType, "completed")),
  });

  if (!hasCompletedEvent) {
    await createChallengeEventActivity({
      tx: params.tx,
      challenge,
      eventType: "completed",
      createdByAdmin: params.createdByAdmin,
    });
  }

  const sortedSubmissions = await params.tx.query.challengeSubmissions.findMany({
    where: (cs, { eq, and, ne }) =>
      and(eq(cs.challengeId, challenge.id), ne(cs.status, "REJECTED")),
    orderBy: (cs, { desc, asc }) => [
      desc(cs.voteScore),
      desc(cs.voteCount),
      asc(cs.createdAt),
      asc(cs.id),
    ],
    with: { group: true },
  });

  if (sortedSubmissions.length === 0) {
    return;
  }

  const topSubmissions = sortedSubmissions.slice(0, 3);
  const hasPotentialCoinChange = sortedSubmissions.some((submission, index) => {
    const nextRanking = index < 3 ? index + 1 : null;
    const nextAwardedPoints = nextRanking != null ? resolvePodiumPoints(challenge, nextRanking) : 0;
    return (
      submission.ranking !== nextRanking || (submission.awardedPoints ?? 0) !== nextAwardedPoints
    );
  });

  const previousRankingSnapshot = hasPotentialCoinChange
    ? await captureTripRankingSnapshot(params.tx, challenge.tripId)
    : null;
  const coinTransactionActorId = hasPotentialCoinChange
    ? await resolveCoinTransactionActorId({
        tx: params.tx,
        createdByAdmin: params.createdByAdmin,
      })
    : null;
  let hasCoinChanges = false;

  const completedAt = new Date();
  for (let index = 0; index < sortedSubmissions.length; index += 1) {
    const submission = sortedSubmissions[index];
    if (!submission) continue;

    const nextRanking = index < 3 ? index + 1 : null;
    const nextAwardedPoints = nextRanking != null ? resolvePodiumPoints(challenge, nextRanking) : 0;
    const currentAwardedPoints = submission.awardedPoints ?? 0;
    const pointsDelta = nextAwardedPoints - currentAwardedPoints;
    const shouldApprove =
      submission.status !== "APPROVED" &&
      submission.status !== "REJECTED" &&
      (challenge.scoringCategory === "JUDGED_STAFF" || nextRanking != null);
    const shouldUpdateRanking = submission.ranking !== nextRanking;
    const shouldUpdatePoints = currentAwardedPoints !== nextAwardedPoints;

    if (!shouldApprove && !shouldUpdateRanking && !shouldUpdatePoints) {
      continue;
    }

    await params.tx
      .update(challengeSubmissions)
      .set({
        ranking: nextRanking,
        awardedPoints: nextAwardedPoints,
        ...(shouldApprove
          ? {
              status: "APPROVED",
              reviewedAt: completedAt,
              reviewedById: null,
              rejectionReason: null,
            }
          : {}),
      })
      .where(eq(challengeSubmissions.id, submission.id));

    if (pointsDelta !== 0) {
      hasCoinChanges = true;
      await params.tx
        .update(groups)
        .set({ coins: sql`${groups.coins} + ${pointsDelta}` })
        .where(eq(groups.id, submission.groupId));

      if (coinTransactionActorId) {
        await params.tx.insert(coinTransactions).values({
          groupId: submission.groupId,
          amount: pointsDelta,
          reason: `Peer voting result: ${challenge.name}${nextRanking ? ` (#${nextRanking})` : ""}`,
          adminId: coinTransactionActorId,
        });
      }
    }
  }

  if (hasCoinChanges && previousRankingSnapshot) {
    await createRankChangeActivities({
      tx: params.tx,
      tripId: challenge.tripId,
      previousSnapshot: previousRankingSnapshot,
      createdByAdmin: params.createdByAdmin ?? coinTransactionActorId ?? null,
    });
  }

  const existingWinners = await params.tx
    .select({ submissionId: submissionActivities.submissionId })
    .from(submissionActivities)
    .where(
      and(
        eq(submissionActivities.challengeId, challenge.id),
        eq(submissionActivities.isWinner, true),
      ),
    );
  const existingWinnerIds = new Set(existingWinners.map((item) => item.submissionId));

  for (let index = 0; index < topSubmissions.length; index += 1) {
    const submission = topSubmissions[index];
    if (!submission || existingWinnerIds.has(submission.id)) continue;

    const ranking = index + 1;
    const pointsAwarded = resolvePodiumPoints(challenge, ranking);
    const title = `#${ranking} place: ${submission.group.name}`;
    const description = [
      `Challenge: ${challenge.name}`,
      `Votes: ${submission.voteCount}`,
      `Score: ${submission.voteScore.toFixed(2)}`,
      `Points: +${pointsAwarded}`,
    ].join(" | ");

    const activityFeedResult = await params.tx
      .insert(activityFeeds)
      .values({
        tripId: challenge.tripId,
        activityType: "submission",
        title,
        description,
        imageUrl: submission.imageIds[0] ?? challenge.image,
        createdByAdmin: params.createdByAdmin ?? null,
      })
      .returning();

    if (activityFeedResult[0]) {
      await params.tx.insert(submissionActivities).values({
        activityId: activityFeedResult[0].id,
        submissionId: submission.id,
        challengeId: submission.challengeId,
        groupId: submission.groupId,
        hasVideo: Boolean(submission.videoId),
        isWinner: true,
        ranking,
        pointsAwarded,
      });
    }
  }
};

export const createChallengeStatusActivityById = async (params: {
  tx: DB | TransactionDB;
  challengeId: string;
  eventType: ChallengeEventType;
  createdByAdmin?: string | null;
}) => {
  const challenge = await loadChallengeForFeed(params.tx, params.challengeId);
  if (!challenge) return;

  await createChallengeEventActivity({
    tx: params.tx,
    challenge,
    eventType: params.eventType,
    createdByAdmin: params.createdByAdmin,
  });
};

export const createChallengeStatusActivityFromTransition = async (params: {
  tx: DB | TransactionDB;
  challengeId: string;
  previousStatus: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";
  nextStatus: "HIDDEN" | "VISIBLE" | "ACTIVE" | "VOTING_PHASE" | "COMPLETED" | "CANCELLED";
  createdByAdmin?: string | null;
}) => {
  if (params.previousStatus === params.nextStatus) {
    return;
  }

  if (params.nextStatus === "ACTIVE") {
    await createChallengeStatusActivityById({
      tx: params.tx,
      challengeId: params.challengeId,
      eventType: "challenge_started",
      createdByAdmin: params.createdByAdmin,
    });
    return;
  }

  if (params.nextStatus === "VOTING_PHASE") {
    await createChallengeStatusActivityById({
      tx: params.tx,
      challengeId: params.challengeId,
      eventType: "voting_started",
      createdByAdmin: params.createdByAdmin,
    });
    return;
  }

  if (params.previousStatus === "VOTING_PHASE" && params.nextStatus === "COMPLETED") {
    await createChallengeCompletionWithWinnersById({
      tx: params.tx,
      challengeId: params.challengeId,
      createdByAdmin: params.createdByAdmin,
    });
  }
};

export const promoteVisibleChallengesToActiveWithFeed = async (params: {
  tx: DB | TransactionDB;
  where?: { id?: string; tripId?: string };
  createdByAdmin?: string | null;
}) => {
  const now = new Date();
  const conditions = [
    eq(challenges.status, "VISIBLE"),
    lte(challenges.startTime, now),
    or(isNull(challenges.endTime), gt(challenges.endTime, now)),
  ];
  if (params.where?.id) {
    conditions.push(eq(challenges.id, params.where.id));
  }
  if (params.where?.tripId) {
    conditions.push(eq(challenges.tripId, params.where.tripId));
  }

  const toActivate = await params.tx
    .select({ id: challenges.id })
    .from(challenges)
    .where(and(...conditions));

  const activatedIds: string[] = [];

  for (const challenge of toActivate) {
    const result = await params.tx
      .update(challenges)
      .set({ status: "ACTIVE" })
      .where(
        and(
          eq(challenges.id, challenge.id),
          eq(challenges.status, "VISIBLE"),
          lte(challenges.startTime, now),
        ),
      )
      .returning({ id: challenges.id });

    if (result.length > 0) {
      activatedIds.push(challenge.id);
      await createChallengeStatusActivityById({
        tx: params.tx,
        challengeId: challenge.id,
        eventType: "challenge_started",
        createdByAdmin: params.createdByAdmin,
      });
    }
  }

  return activatedIds;
};

export const promoteActivePeerVotingChallengesToVotingPhaseWithFeed = async (params: {
  tx: DB | TransactionDB;
  where?: { id?: string; tripId?: string };
  createdByAdmin?: string | null;
}) => {
  const now = new Date();
  const conditions = [
    eq(challenges.status, "ACTIVE"),
    eq(challenges.scoringCategory, "PEER_VOTING"),
    lte(challenges.endTime, now),
  ];
  if (params.where?.id) {
    conditions.push(eq(challenges.id, params.where.id));
  }
  if (params.where?.tripId) {
    conditions.push(eq(challenges.tripId, params.where.tripId));
  }

  const toVoting = await params.tx
    .select({
      id: challenges.id,
      votingStartTime: challenges.votingStartTime,
      votingEndTime: challenges.votingEndTime,
    })
    .from(challenges)
    .where(and(...conditions));

  const votingIds: string[] = [];

  for (const challenge of toVoting) {
    const submissions = await params.tx
      .select({ status: challengeSubmissions.status })
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.challengeId, challenge.id));

    const hasSubmissions = submissions.length > 0;
    const allProcessed = submissions.every(
      (s) => s.status === "APPROVED" || s.status === "REJECTED",
    );
    if (!hasSubmissions || !allProcessed) {
      continue;
    }

    const votingDurationHours = resolvePeerVotingDurationHours(
      challenge.votingStartTime,
      challenge.votingEndTime,
    );
    const votingStartTime = new Date();
    const votingEndTime = new Date(votingStartTime.getTime() + votingDurationHours * HOUR_MS);

    const result = await params.tx
      .update(challenges)
      .set({
        status: "VOTING_PHASE",
        votingStartTime,
        votingEndTime,
      })
      .where(
        and(
          eq(challenges.id, challenge.id),
          eq(challenges.status, "ACTIVE"),
          eq(challenges.scoringCategory, "PEER_VOTING"),
          lte(challenges.endTime, now),
        ),
      )
      .returning({ id: challenges.id });

    if (result.length > 0) {
      votingIds.push(challenge.id);
      await createChallengeStatusActivityById({
        tx: params.tx,
        challengeId: challenge.id,
        eventType: "voting_started",
        createdByAdmin: params.createdByAdmin,
      });
    }
  }

  return votingIds;
};

export const finalizeVotingChallengesToCompletedWithFeed = async (params: {
  tx: DB | TransactionDB;
  where?: { id?: string; tripId?: string };
  createdByAdmin?: string | null;
}) => {
  const now = new Date();
  const conditions = [eq(challenges.status, "VOTING_PHASE"), lte(challenges.votingEndTime, now)];
  if (params.where?.id) {
    conditions.push(eq(challenges.id, params.where.id));
  }
  if (params.where?.tripId) {
    conditions.push(eq(challenges.tripId, params.where.tripId));
  }

  const toComplete = await params.tx
    .select({ id: challenges.id })
    .from(challenges)
    .where(and(...conditions));

  const completedIds: string[] = [];

  for (const challenge of toComplete) {
    const result = await params.tx
      .update(challenges)
      .set({ status: "COMPLETED" })
      .where(
        and(
          eq(challenges.id, challenge.id),
          eq(challenges.status, "VOTING_PHASE"),
          lte(challenges.votingEndTime, now),
        ),
      )
      .returning({ id: challenges.id });

    if (result.length > 0) {
      completedIds.push(challenge.id);
      await createChallengeCompletionWithWinnersById({
        tx: params.tx,
        challengeId: challenge.id,
        createdByAdmin: params.createdByAdmin,
      });
    }
  }

  return completedIds;
};

export const captureTripRankingSnapshot = async (
  tx: DB | TransactionDB,
  tripId: string,
): Promise<RankSnapshot> => {
  const groupRows = await tx.query.groups.findMany({
    where: (g, { eq, and }) => and(eq(g.tripId, tripId), eq(g.isDeleted, false)),
    orderBy: (g, { desc, asc }) => [desc(g.coins), asc(g.id)],
  });

  const snapshot: RankSnapshot = new Map();
  for (let index = 0; index < groupRows.length; index += 1) {
    const group = groupRows[index];
    if (!group) continue;

    snapshot.set(group.id, {
      rank: index + 1,
      coins: group.coins,
      name: group.name,
      image: group.image,
    });
  }

  return snapshot;
};

export const createRankChangeActivities = async (params: {
  tx: DB | TransactionDB;
  tripId: string;
  previousSnapshot: RankSnapshot;
  createdByAdmin?: string | null;
}) => {
  if (params.previousSnapshot.size === 0) {
    return;
  }

  const groupsAfter = await params.tx.query.groups.findMany({
    where: (g, { eq, and }) => and(eq(g.tripId, params.tripId), eq(g.isDeleted, false)),
    orderBy: (g, { desc, asc }) => [desc(g.coins), asc(g.id)],
  });

  const rankChanges = groupsAfter
    .map((group, index) => {
      const previous = params.previousSnapshot.get(group.id);
      if (!previous) return null;

      const newRank = index + 1;
      if (newRank === previous.rank) return null;

      return {
        group,
        previousRank: previous.rank,
        newRank,
        coinsBefore: previous.coins,
        coinsAfter: group.coins,
        rankDiff: previous.rank - newRank,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (rankChanges.length === 0) {
    return;
  }

  const movedUp = [...rankChanges]
    .filter((item) => item.rankDiff > 0)
    .sort((a, b) => b.rankDiff - a.rankDiff || a.newRank - b.newRank)[0];

  const movedDown = [...rankChanges]
    .filter((item) => item.rankDiff < 0)
    .sort((a, b) => a.rankDiff - b.rankDiff || b.newRank - a.newRank)[0];

  const anchor = movedUp ?? movedDown ?? rankChanges[0];
  if (!anchor) return;

  const podium = groupsAfter.slice(0, 3).map((group, index) => ({
    medal: index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉",
    name: group?.name ?? "TBD",
  }));

  const movementParts: string[] = [];
  if (movedUp) {
    movementParts.push(`⬆️ ${movedUp.group.name}: #${movedUp.previousRank} -> #${movedUp.newRank}`);
  }
  if (movedDown && movedDown.group.id !== movedUp?.group.id) {
    movementParts.push(
      `⬇️ ${movedDown.group.name}: #${movedDown.previousRank} -> #${movedDown.newRank}`,
    );
  }

  const podiumPart = podium.map((item) => `${item.medal} ${item.name}`).join(" • ");

  const description = [...movementParts, `Podium: ${podiumPart}`].join(" | ");

  const activityFeedResult = await params.tx
    .insert(activityFeeds)
    .values({
      tripId: params.tripId,
      activityType: "rank_change",
      title: "Zmiany w tabeli",
      description,
      imageUrl: anchor.group.image,
      createdByAdmin: params.createdByAdmin ?? null,
    })
    .returning();

  if (activityFeedResult[0]) {
    await params.tx.insert(rankChangeActivities).values({
      activityId: activityFeedResult[0].id,
      groupId: anchor.group.id,
      newRank: anchor.newRank,
      totalCoins: anchor.group.coins,
      coinsGained: anchor.coinsAfter - anchor.coinsBefore,
    });
  }
};
