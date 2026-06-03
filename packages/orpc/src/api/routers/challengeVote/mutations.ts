import { ORPCError } from "@orpc/server";
import { eq, and, inArray } from "drizzle-orm";
import { challenges, challengeVotes } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { validateVotePayload, buildVoteInsertValues } from "@mirai-app/shared";
import { createChallengeCompletionWithWinnersById } from "../../../utils/activityFeed";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import { voteColumns } from "./types";
import {
  ensureTripParticipant,
  getChallengeInTrip,
  ensureChallengeVoting,
  recomputeSubmissionVotes,
  getJudgedStaffVotingProgress,
  maybeFinalizeJudgedStaffVoting,
  validateJudgedStaffVotePayload,
} from "./utils";

export const forceEndJudgedStaffVoting = async (
  context: { db: DB; dbUser: { id: string } },
  input: { challengeId: string; tripId: string },
) => {
  const challenge = await getChallengeInTrip(context, input.challengeId, input.tripId);

  if (challenge.scoringCategory !== "JUDGED_STAFF") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Force end is available only for judged staff challenges",
    });
  }

  if (challenge.status === "CANCELLED") {
    throw new ORPCError("BAD_REQUEST", { message: "Cancelled challenge cannot be finalized" });
  }

  if (!challenge.endTime) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Staff voting requires submission end time",
    });
  }

  if (challenge.endTime.getTime() > Date.now()) {
    throw new ORPCError("BAD_REQUEST", {
      message: "You can force end staff voting only after submission phase ends",
    });
  }

  const result = await context.db.transaction(async (tx) => {
    await recomputeSubmissionVotes({ db: tx }, input.challengeId);

    const updated = await tx
      .update(challenges)
      .set({ status: "COMPLETED" })
      .where(
        and(
          eq(challenges.id, challenge.id),
          eq(challenges.tripId, challenge.tripId),
          eq(challenges.scoringCategory, "JUDGED_STAFF"),
          inArray(challenges.status, ["HIDDEN", "VISIBLE", "ACTIVE", "VOTING_PHASE"]),
        ),
      )
      .returning({ id: challenges.id });

    if (updated.length > 0) {
      await createChallengeCompletionWithWinnersById({
        tx,
        challengeId: challenge.id,
        createdByAdmin: context.dbUser.id,
      });
    }

    return updated.length > 0;
  });

  const progress = await getJudgedStaffVotingProgress(context, {
    challengeId: challenge.id,
    tripId: challenge.tripId,
  });

  return {
    success: true,
    finalized: result,
    challengeStatus: "COMPLETED" as const,
    ...progress,
  };
};

export const submitVotes = async (
  context: { db: DB; dbUser: { id: string; role: string } },
  input: {
    tripId: string;
    challengeId: string;
    votes: {
      submissionId: string;
      votePosition: number;
      votePoints: number;
      normalizedWeight?: number;
    }[];
  },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const participant = await ensureTripParticipant(context, input.tripId);
  const challenge = await getChallengeInTrip(context, input.challengeId, input.tripId);
  ensureChallengeVoting({ challenge, actorRole: context.dbUser.role });

  const payloadError = validateVotePayload(input.votes);
  if (payloadError) {
    throw new ORPCError(payloadError.error, { message: payloadError.message });
  }

  const uniqueSubmissionIds = new Set(input.votes.map((vote) => vote.submissionId));

  const matchSubmissions = (cs: any, { eq, and, inArray }: any) =>
    and(inArray(cs.id, [...uniqueSubmissionIds]), eq(cs.challengeId, input.challengeId));

  const submissions = await context.db.query.challengeSubmissions.findMany({
    where: matchSubmissions,
    columns: { id: true, groupId: true },
  });

  if (submissions.length !== uniqueSubmissionIds.size) {
    throw new ORPCError("BAD_REQUEST", { message: "Nieprawidlowe zgloszenia" });
  }

  if (participant.groupId) {
    const ownSubmission = submissions.find(
      (submission) => submission.groupId === participant.groupId,
    );
    if (ownSubmission) {
      throw new ORPCError("FORBIDDEN", { message: "Nie mozna glosowac na wlasna grupe" });
    }
  }

  const matchVoter = (cv: any, { eq, and }: any) =>
    and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id));

  const existingVotes = await context.db.query.challengeVotes.findMany({
    where: matchVoter,
    columns: { votePosition: true },
  });

  if (existingVotes.length > 0) {
    throw new ORPCError("CONFLICT", {
      message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
    });
  }

  const sortByVotePosition = (cv: any, { asc }: any) => [asc(cv.votePosition)];

  const result = await context.db.transaction(async (tx) => {
    await tx
      .insert(challengeVotes)
      .values(buildVoteInsertValues(input.votes, input.challengeId, participant.id));

    await recomputeSubmissionVotes({ db: tx }, input.challengeId);

    if (challenge.scoringCategory === "JUDGED_STAFF") {
      await maybeFinalizeJudgedStaffVoting(
        { db: tx },
        {
          challenge,
          createdByAdminId: context.dbUser.id,
        },
      );
    }

    return await tx.query.challengeVotes.findMany({
      where: matchVoter,
      columns: voteColumns,
      orderBy: sortByVotePosition,
    });
  });

  return result;
};

export const submitVote = async (
  context: { db: DB; dbUser: { id: string; role: string } },
  input: {
    tripId: string;
    challengeId: string;
    submissionId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight?: number;
  },
) => {
  await ensureTripNotEnded(context.db, input.tripId);
  const participant = await ensureTripParticipant(context, input.tripId);
  const challenge = await getChallengeInTrip(context, input.challengeId, input.tripId);
  ensureChallengeVoting({ challenge, actorRole: context.dbUser.role });

  if (challenge.scoringCategory === "JUDGED_STAFF") {
    await validateJudgedStaffVotePayload(context, {
      challengeId: input.challengeId,
      votePositions: [input.votePosition],
      requireExactCount: false,
    });
  }

  const matchSubmission = (cs: any, { eq, and }: any) =>
    and(eq(cs.id, input.submissionId), eq(cs.challengeId, input.challengeId));

  const submission = await context.db.query.challengeSubmissions.findFirst({
    where: matchSubmission,
    columns: { id: true, groupId: true },
  });

  if (!submission) {
    throw new ORPCError("BAD_REQUEST", { message: "Nieprawidlowe zgloszenie" });
  }

  if (participant.groupId && submission.groupId === participant.groupId) {
    throw new ORPCError("FORBIDDEN", { message: "Nie mozna glosowac na wlasna grupe" });
  }

  const matchVoter = (cv: any, { eq, and }: any) =>
    and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id));

  const existingVotes = await context.db.query.challengeVotes.findMany({
    where: matchVoter,
    columns: { id: true, votePosition: true, submissionId: true },
  });

  if (existingVotes.length > 0) {
    if (challenge.scoringCategory === "PEER_VOTING") {
      throw new ORPCError("CONFLICT", {
        message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
      });
    }

    const existingByPosition = existingVotes.find(
      (vote) => vote.votePosition === input.votePosition,
    );

    if (existingByPosition) {
      if (existingByPosition.submissionId === input.submissionId) {
        throw new ORPCError("CONFLICT", { message: "Glos juz istnieje" });
      }
      throw new ORPCError("BAD_REQUEST", { message: "Pozycja glosu jest juz zajeta" });
    }
  }

  try {
    const result = await context.db.transaction(async (tx) => {
      const [createdVote] = await tx
        .insert(challengeVotes)
        .values(buildVoteInsertValues([input], input.challengeId, participant.id))
        .returning();

      await recomputeSubmissionVotes({ db: tx }, input.challengeId);

      if (challenge.scoringCategory === "JUDGED_STAFF") {
        await maybeFinalizeJudgedStaffVoting(
          { db: tx },
          {
            challenge,
            createdByAdminId: context.dbUser.id,
          },
        );
      }

      return createdVote;
    });

    return result;
  } catch (error: unknown) {
    const pgCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    const pgCodeValue = typeof pgCode === "string" ? pgCode : "";
    if (pgCodeValue === "23505") {
      throw new ORPCError("CONFLICT", { message: "Glos juz istnieje" });
    }
    throw error;
  }
};
