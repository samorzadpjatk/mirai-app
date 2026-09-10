import { buildVoteInsertValues, validateVotePayload } from "@mirai-app/common/challengeVote";
import { challengeVotes, challenges } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { createChallengeCompletionWithWinnersById } from "../../../utils/activityFeed";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import type { OrderByCallback, WhereCallback } from "../utils/drizzle-types";
import { voteColumns } from "./types";
import {
  ensureChallengeVoting,
  ensureTripParticipant,
  getChallengeInTrip,
  getJudgedStaffVotingProgress,
  maybeFinalizeJudgedStaffVoting,
  recomputeSubmissionVotes,
  validateJudgedStaffVotePayload,
} from "./utils";

const PG_UNIQUE_VIOLATION = "23505";
const MAX_ERROR_CAUSE_DEPTH = 5;

/**
 * Drizzle wraps driver errors in a DrizzleQueryError, so the postgres error code
 * lives on `cause` rather than on the thrown error itself. Walk the cause chain.
 */
const isUniqueViolation = (error: unknown, depth = 0): boolean => {
  if (typeof error !== "object" || error === null || depth > MAX_ERROR_CAUSE_DEPTH) {
    return false;
  }

  if ("code" in error && (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION) {
    return true;
  }

  return "cause" in error
    ? isUniqueViolation((error as { cause?: unknown }).cause, depth + 1)
    : false;
};

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

  // Challenges without an end time have no submission phase to wait for, so they can be
  // force ended right away. See ensureChallengeVoting for the same reasoning.
  if (challenge.endTime && challenge.endTime.getTime() > Date.now()) {
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

  if (challenge.scoringCategory === "JUDGED_STAFF") {
    // A batched staff vote is the complete podium, so it must cover every required
    // position. Accepting a shorter podium would silently corrupt the final ranking,
    // because votes cannot be changed once cast.
    await validateJudgedStaffVotePayload(context, {
      challengeId: input.challengeId,
      votePositions: input.votes.map((vote) => vote.votePosition),
      requireExactCount: true,
    });
  }

  const uniqueSubmissionIds = new Set(input.votes.map((vote) => vote.submissionId));

  const matchSubmissions: WhereCallback<"challengeSubmissions"> = (cs, { eq, and, inArray }) =>
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

  const matchVoter: WhereCallback<"challengeVotes"> = (cv, { eq, and }) =>
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

  const sortByVotePosition: OrderByCallback<"challengeVotes"> = (cv, { asc }) => [
    asc(cv.votePosition),
  ];

  try {
    return await context.db.transaction(async (tx) => {
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
  } catch (error: unknown) {
    // Two concurrent submissions from the same voter both pass the "already voted"
    // check above; the unique index is what actually keeps the podium consistent.
    if (isUniqueViolation(error)) {
      throw new ORPCError("CONFLICT", {
        message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
      });
    }
    throw error;
  }
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

  const matchSubmission: WhereCallback<"challengeSubmissions"> = (cs, { eq, and }) =>
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

  const matchVoter: WhereCallback<"challengeVotes"> = (cv, { eq, and }) =>
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
    if (isUniqueViolation(error)) {
      throw new ORPCError("CONFLICT", { message: "Glos juz istnieje" });
    }
    throw error;
  }
};
