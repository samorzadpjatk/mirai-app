import { type Prisma } from "@integral-2025-app/db";

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
  tx: Prisma.TransactionClient,
  challengeId: string,
): Promise<ChallengeForFeed | null> => {
  const challenge = await tx.challenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      tripId: true,
      name: true,
      description: true,
      image: true,
      submissionType: true,
      basePoints: true,
      firstPlacePoints: true,
      secondPlacePoints: true,
      thirdPlacePoints: true,
      endTime: true,
      votingEndTime: true,
    },
  });

  return challenge;
};

const formatSubmissionDeadline = (value: Date | null) => {
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
};

const createChallengeEventActivity = async (params: {
  tx: Prisma.TransactionClient;
  challenge: ChallengeForFeed;
  eventType: ChallengeEventType;
  createdByAdmin?: string | null;
}) => {
  const submissionCount = await params.tx.challengeSubmission.count({
    where: { challengeId: params.challenge.id },
  });

  const title =
    params.eventType === "challenge_started"
      ? `Czas start! Już teraz weź udział w wyzwaniu ${params.challenge.name}.`
      : params.eventType === "voting_started"
        ? `Voting started: ${params.challenge.name}`
        : `Challenge completed: ${params.challenge.name}`;

  const challengeDescription =
    params.eventType === "completed"
      ? null
      : params.challenge.description?.trim();

  const description =
    challengeDescription ??
    (params.eventType === "challenge_started"
      ? `Nie czekajcie za długo. Macie czas tylko do ${formatSubmissionDeadline(params.challenge.endTime)} na wysłanie Waszego zdjęcia grupy.`
      : params.eventType === "voting_started"
        ? "Challenge entered voting phase"
        : "Voting has ended");

  await params.tx.activityFeed.create({
    data: {
      tripId: params.challenge.tripId,
      activityType: "challenge_event",
      title,
      description,
      imageUrl: params.challenge.image,
      createdByAdmin: params.createdByAdmin ?? null,
      challengeActivity: {
        create: {
          challengeId: params.challenge.id,
          eventType: params.eventType,
          endTime:
            params.eventType === "challenge_started"
              ? params.challenge.endTime
              : params.eventType === "voting_started"
                ? params.challenge.votingEndTime
                : new Date(),
          submissionType:
            params.eventType === "challenge_started"
              ? params.challenge.submissionType
              : null,
          basePoints:
            params.eventType === "challenge_started"
              ? params.challenge.basePoints
              : null,
          submissionCount:
            params.eventType === "voting_started" ||
            params.eventType === "completed"
              ? submissionCount
              : null,
        },
      },
    },
  });
};

const resolvePodiumPoints = (
  challenge: Pick<
    ChallengeForFeed,
    "basePoints" | "firstPlacePoints" | "secondPlacePoints" | "thirdPlacePoints"
  >,
  ranking: number,
) => {
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
};

const createChallengeCompletionWithWinnersById = async (params: {
  tx: Prisma.TransactionClient;
  challengeId: string;
  createdByAdmin?: string | null;
}) => {
  const challenge = await loadChallengeForFeed(params.tx, params.challengeId);
  if (!challenge) return;

  const hasCompletedEvent = await params.tx.challengeActivity.findFirst({
    where: {
      challengeId: challenge.id,
      eventType: "completed",
    },
    select: { activityId: true },
  });

  if (!hasCompletedEvent) {
    await createChallengeEventActivity({
      tx: params.tx,
      challenge,
      eventType: "completed",
      createdByAdmin: params.createdByAdmin,
    });
  }

  const topSubmissions = await params.tx.challengeSubmission.findMany({
    where: { challengeId: challenge.id },
    orderBy: [
      { voteScore: "desc" },
      { voteCount: "desc" },
      { createdAt: "asc" },
      { id: "asc" },
    ],
    take: 3,
    select: {
      id: true,
      challengeId: true,
      groupId: true,
      imageIds: true,
      videoId: true,
      status: true,
      ranking: true,
      voteCount: true,
      voteScore: true,
      group: {
        select: {
          name: true,
        },
      },
    },
  });

  if (topSubmissions.length === 0) {
    return;
  }

  const completedAt = new Date();
  for (let index = 0; index < topSubmissions.length; index += 1) {
    const submission = topSubmissions[index];
    if (!submission) continue;

    const nextRanking = index + 1;
    const shouldApprove = submission.status !== "APPROVED";
    const shouldUpdateRanking = submission.ranking !== nextRanking;
    if (!shouldApprove && !shouldUpdateRanking) {
      continue;
    }

    await params.tx.challengeSubmission.update({
      where: { id: submission.id },
      data: {
        ranking: nextRanking,
        ...(shouldApprove
          ? {
              status: "APPROVED",
              reviewedAt: completedAt,
              reviewedById: null,
              rejectionReason: null,
            }
          : {}),
      },
    });
  }

  const existingWinnerIds = new Set(
    (
      await params.tx.submissionActivity.findMany({
        where: {
          challengeId: challenge.id,
          isWinner: true,
        },
        select: { submissionId: true },
      })
    ).map((item) => item.submissionId),
  );

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

    await params.tx.activityFeed.create({
      data: {
        tripId: challenge.tripId,
        activityType: "submission",
        title,
        description,
        imageUrl: submission.imageIds[0] ?? challenge.image,
        createdByAdmin: params.createdByAdmin ?? null,
        submissionActivity: {
          create: {
            submissionId: submission.id,
            challengeId: submission.challengeId,
            groupId: submission.groupId,
            hasVideo: Boolean(submission.videoId),
            isWinner: true,
            ranking,
            pointsAwarded,
          },
        },
      },
    });
  }
};

export const createChallengeStatusActivityById = async (params: {
  tx: Prisma.TransactionClient;
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
  tx: Prisma.TransactionClient;
  challengeId: string;
  previousStatus:
    | "HIDDEN"
    | "VISIBLE"
    | "ACTIVE"
    | "VOTING_PHASE"
    | "COMPLETED"
    | "CANCELLED";
  nextStatus:
    | "HIDDEN"
    | "VISIBLE"
    | "ACTIVE"
    | "VOTING_PHASE"
    | "COMPLETED"
    | "CANCELLED";
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

  if (
    params.previousStatus === "VOTING_PHASE" &&
    params.nextStatus === "COMPLETED"
  ) {
    await createChallengeCompletionWithWinnersById({
      tx: params.tx,
      challengeId: params.challengeId,
      createdByAdmin: params.createdByAdmin,
    });
  }
};

export const promoteVisibleChallengesToActiveWithFeed = async (params: {
  tx: Prisma.TransactionClient;
  where?: Prisma.ChallengeWhereInput;
  createdByAdmin?: string | null;
}) => {
  const now = new Date();
  const toActivate = await params.tx.challenge.findMany({
    where: {
      AND: [
        params.where ?? {},
        {
          status: "VISIBLE",
          startTime: { lte: now },
          OR: [{ endTime: null }, { endTime: { gt: now } }],
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const activatedIds: string[] = [];

  for (const challenge of toActivate) {
    const result = await params.tx.challenge.updateMany({
      where: {
        id: challenge.id,
        status: "VISIBLE",
        startTime: { lte: now },
      },
      data: {
        status: "ACTIVE",
      },
    });

    if (result.count > 0) {
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

export const finalizeVotingChallengesToCompletedWithFeed = async (params: {
  tx: Prisma.TransactionClient;
  where?: Prisma.ChallengeWhereInput;
  createdByAdmin?: string | null;
}) => {
  const now = new Date();
  const toComplete = await params.tx.challenge.findMany({
    where: {
      AND: [
        params.where ?? {},
        {
          status: "VOTING_PHASE",
          votingEndTime: { lte: now },
        },
      ],
    },
    select: { id: true },
  });

  const completedIds: string[] = [];

  for (const challenge of toComplete) {
    const result = await params.tx.challenge.updateMany({
      where: {
        id: challenge.id,
        status: "VOTING_PHASE",
        votingEndTime: { lte: now },
      },
      data: {
        status: "COMPLETED",
      },
    });

    if (result.count > 0) {
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
  tx: Prisma.TransactionClient,
  tripId: string,
): Promise<RankSnapshot> => {
  const groups = await tx.group.findMany({
    where: { tripId, isDeleted: false },
    orderBy: [{ coins: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      coins: true,
      image: true,
    },
  });

  const snapshot: RankSnapshot = new Map();
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
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
  tx: Prisma.TransactionClient;
  tripId: string;
  previousSnapshot: RankSnapshot;
  createdByAdmin?: string | null;
}) => {
  if (params.previousSnapshot.size === 0) {
    return;
  }

  const groupsAfter = await params.tx.group.findMany({
    where: { tripId: params.tripId, isDeleted: false },
    orderBy: [{ coins: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      coins: true,
      image: true,
    },
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
    movementParts.push(
      `⬆️ ${movedUp.group.name}: #${movedUp.previousRank} -> #${movedUp.newRank}`,
    );
  }
  if (movedDown && movedDown.group.id !== movedUp?.group.id) {
    movementParts.push(
      `⬇️ ${movedDown.group.name}: #${movedDown.previousRank} -> #${movedDown.newRank}`,
    );
  }

  const podiumPart = podium
    .map((item) => `${item.medal} ${item.name}`)
    .join(" • ");

  const description = [...movementParts, `Podium: ${podiumPart}`].join(" | ");

  await params.tx.activityFeed.create({
    data: {
      tripId: params.tripId,
      activityType: "rank_change",
      title: "Zmiany w tabeli",
      description,
      imageUrl: anchor.group.image,
      createdByAdmin: params.createdByAdmin ?? null,
      rankChangeActivity: {
        create: {
          groupId: anchor.group.id,
          newRank: anchor.newRank,
          totalCoins: anchor.group.coins,
          coinsGained: anchor.coinsAfter - anchor.coinsBefore,
        },
      },
    },
  });
};
