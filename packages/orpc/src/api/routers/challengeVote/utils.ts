import { ORPCError } from "@orpc/server";
import { eq, and, count, inArray, ne } from "drizzle-orm";
import { challenges, challengeSubmissions, tripParticipants, users } from "@mirai-app/db";
import type { DB, TransactionDB } from "@mirai-app/db";
import { tallyVotes, computeRequiredPositions, hasAllRequiredPositions } from "@mirai-app/shared";
import { createChallengeCompletionWithWinnersById } from "../../../utils/activityFeed";
import type { ChallengeForVoting, JudgedStaffVotingProgress } from "./types";

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

export const getChallengeInTrip = async (
  context: { db: DB | TransactionDB },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, challengeId), eq(c.tripId, tripId)),
    columns: {
      id: true,
      tripId: true,
      status: true,
      scoringCategory: true,
      endTime: true,
    },
  });

  if (!challenge) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }

  return challenge;
};

export const ensureChallengeVoting = (params: {
  challenge: ChallengeForVoting;
  actorRole: string;
}) => {
  const { challenge, actorRole } = params;

  if (challenge.scoringCategory === "PEER_VOTING") {
    if (challenge.status !== "VOTING_PHASE") {
      throw new ORPCError("BAD_REQUEST", { message: "Glosowanie nie jest aktywne" });
    }
    return;
  }

  if (challenge.scoringCategory !== "JUDGED_STAFF") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Voting is available only for peer voting and judged staff challenges",
    });
  }

  if (actorRole !== "ADMIN") {
    throw new ORPCError("FORBIDDEN", {
      message: "Only admins can vote in judged staff challenges",
    });
  }

  if (challenge.status === "CANCELLED" || challenge.status === "COMPLETED") {
    throw new ORPCError("BAD_REQUEST", { message: "Glosowanie zostalo zakonczone" });
  }

  if (challenge.status !== "ACTIVE" && challenge.status !== "VOTING_PHASE") {
    throw new ORPCError("BAD_REQUEST", { message: "Challenge nie jest gotowy do glosowania" });
  }

  if (!challenge.endTime) {
    throw new ORPCError("BAD_REQUEST", { message: "Staff voting requires submission end time" });
  }

  if (challenge.endTime.getTime() > Date.now()) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Staff voting starts after submission phase ends",
    });
  }
};

export const recomputeSubmissionVotes = async (
  context: { db: DB | TransactionDB },
  challengeId: string,
) => {
  const submissions = await context.db.query.challengeSubmissions.findMany({
    where: (cs, { eq }) => eq(cs.challengeId, challengeId),
    columns: { id: true },
  });

  const votes = await context.db.query.challengeVotes.findMany({
    where: (cv, { eq }) => eq(cv.challengeId, challengeId),
    columns: { submissionId: true, votePoints: true, normalizedWeight: true },
  });

  const tally = tallyVotes(votes);

  for (const submission of submissions) {
    const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
    await context.db
      .update(challengeSubmissions)
      .set({
        voteCount: stats.count,
        voteScore: stats.score,
      })
      .where(eq(challengeSubmissions.id, submission.id));
  }
};

const resolveRequiredVotePositions = async (
  context: { db: DB | TransactionDB },
  challengeId: string,
) => {
  const result = await context.db
    .select({ count: count() })
    .from(challengeSubmissions)
    .where(
      and(
        eq(challengeSubmissions.challengeId, challengeId),
        ne(challengeSubmissions.status, "REJECTED"),
      ),
    );

  const eligibleSubmissionsCount = result[0]?.count ?? 0;

  return {
    requiredPositions: computeRequiredPositions(eligibleSubmissionsCount),
    eligibleSubmissionsCount,
  };
};

const getTripAdminParticipantIds = async (context: { db: DB | TransactionDB }, tripId: string) => {
  const admins = await context.db
    .select({ id: tripParticipants.id })
    .from(tripParticipants)
    .innerJoin(users, eq(tripParticipants.userId, users.id))
    .where(and(eq(tripParticipants.tripId, tripId), eq(users.role, "ADMIN")));

  return admins.map((admin) => admin.id);
};

export const getJudgedStaffVotingProgress = async (
  context: { db: DB | TransactionDB },
  params: { challengeId: string; tripId: string },
): Promise<JudgedStaffVotingProgress> => {
  const [{ requiredPositions, eligibleSubmissionsCount }, adminParticipantIds] = await Promise.all([
    resolveRequiredVotePositions(context, params.challengeId),
    getTripAdminParticipantIds(context, params.tripId),
  ]);

  if (adminParticipantIds.length === 0) {
    return {
      requiredPositions,
      eligibleSubmissionsCount,
      totalAdmins: 0,
      votedAdmins: 0,
      pendingAdmins: 0,
      allAdminsVoted: false,
    };
  }

  const votes = await context.db.query.challengeVotes.findMany({
    where: (cv, { eq, and, inArray }) =>
      and(eq(cv.challengeId, params.challengeId), inArray(cv.voterId, adminParticipantIds)),
    columns: {
      voterId: true,
      votePosition: true,
    },
  });

  const positionsByVoter = new Map<string, Set<number>>();
  for (const vote of votes) {
    const positions = positionsByVoter.get(vote.voterId) ?? new Set<number>();
    positions.add(vote.votePosition);
    positionsByVoter.set(vote.voterId, positions);
  }

  const votedAdmins = adminParticipantIds.filter((participantId) => {
    const positions = positionsByVoter.get(participantId) ?? new Set<number>();
    return hasAllRequiredPositions(positions, requiredPositions);
  }).length;

  const totalAdmins = adminParticipantIds.length;
  const pendingAdmins = Math.max(totalAdmins - votedAdmins, 0);

  return {
    requiredPositions,
    eligibleSubmissionsCount,
    totalAdmins,
    votedAdmins,
    pendingAdmins,
    allAdminsVoted: requiredPositions > 0 && totalAdmins > 0 && votedAdmins >= totalAdmins,
  };
};

export const maybeFinalizeJudgedStaffVoting = async (
  context: { db: DB | TransactionDB },
  params: {
    challenge: ChallengeForVoting;
    createdByAdminId: string;
  },
) => {
  if (params.challenge.scoringCategory !== "JUDGED_STAFF") {
    return { finalized: false, progress: null as JudgedStaffVotingProgress | null };
  }

  const progress = await getJudgedStaffVotingProgress(context, {
    challengeId: params.challenge.id,
    tripId: params.challenge.tripId,
  });

  if (!progress.allAdminsVoted) {
    return { finalized: false, progress };
  }

  const updated = await context.db
    .update(challenges)
    .set({ status: "COMPLETED" })
    .where(
      and(
        eq(challenges.id, params.challenge.id),
        eq(challenges.tripId, params.challenge.tripId),
        eq(challenges.scoringCategory, "JUDGED_STAFF"),
        inArray(challenges.status, ["ACTIVE", "VOTING_PHASE"]),
      ),
    )
    .returning({ id: challenges.id });

  if (updated.length > 0) {
    await createChallengeCompletionWithWinnersById({
      tx: context.db,
      challengeId: params.challenge.id,
      createdByAdmin: params.createdByAdminId,
    });
  }

  return { finalized: updated.length > 0, progress };
};

export const validateJudgedStaffVotePayload = async (
  context: { db: DB | TransactionDB },
  params: {
    challengeId: string;
    votePositions: number[];
    requireExactCount: boolean;
  },
) => {
  const { requiredPositions } = await resolveRequiredVotePositions(context, params.challengeId);

  if (requiredPositions <= 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "At least 2 eligible submissions are required for staff voting",
    });
  }

  if (params.votePositions.some((position) => position > requiredPositions)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Staff voting accepts only positions 1-${requiredPositions}`,
    });
  }

  if (params.requireExactCount && params.votePositions.length !== requiredPositions) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Staff voting requires exactly ${requiredPositions} votes`,
    });
  }

  return { requiredPositions };
};
