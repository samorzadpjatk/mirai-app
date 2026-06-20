import type { DB } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { voteColumns } from "./types";
import { ensureTripParticipant, getChallengeInTrip, getJudgedStaffVotingProgress } from "./utils";

export const getMyByChallenge = async (
  context: { db: DB; dbUser: { id: string } },
  input: { challengeId: string; tripId: string },
) => {
  const participant = await ensureTripParticipant(context, input.tripId);

  return context.db.query.challengeVotes.findMany({
    where: (cv, { eq, and }) =>
      and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id)),
    columns: voteColumns,
    orderBy: (cv, { asc }) => [asc(cv.votePosition)],
  });
};

export const getByChallenge = async (context: { db: DB }, input: { challengeId: string }) => {
  return context.db.query.challengeVotes.findMany({
    where: (cv, { eq }) => eq(cv.challengeId, input.challengeId),
    columns: voteColumns,
    orderBy: (cv, { asc }) => [asc(cv.voterId), asc(cv.votePosition)],
  });
};

export const getJudgedStaffProgress = async (
  context: { db: DB },
  input: { challengeId: string; tripId: string },
) => {
  const challenge = await getChallengeInTrip(context, input.challengeId, input.tripId);

  if (challenge.scoringCategory !== "JUDGED_STAFF") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Progress is available only for judged staff challenges",
    });
  }

  const progress = await getJudgedStaffVotingProgress(context, {
    challengeId: input.challengeId,
    tripId: input.tripId,
  });

  return {
    challengeStatus: challenge.status,
    ...progress,
  };
};

export const getJudgedStaffProgressByTrip = async (
  context: { db: DB },
  input: { tripId: string },
) => {
  const tripChallenges = await context.db.query.challenges.findMany({
    where: (c, { eq, and }) =>
      and(eq(c.tripId, input.tripId), eq(c.scoringCategory, "JUDGED_STAFF")),
    columns: { id: true, tripId: true },
  });

  const progressEntries = await Promise.all(
    tripChallenges.map(async (challenge) => {
      const progress = await getJudgedStaffVotingProgress(context, {
        challengeId: challenge.id,
        tripId: challenge.tripId,
      });
      return [challenge.id, progress] as [string, typeof progress];
    }),
  );

  return Object.fromEntries(progressEntries);
};
