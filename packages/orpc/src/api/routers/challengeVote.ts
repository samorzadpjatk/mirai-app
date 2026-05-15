import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  adminProcedure,
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { eq, and, count, inArray, ne } from "drizzle-orm";
import {
  challenges,
  challengeSubmissions,
  challengeVotes,
  tripParticipants,
  users,
} from "@mirai-app/db";
import type { DB, TransactionDB } from "@mirai-app/db";
import { createChallengeCompletionWithWinnersById } from "../../utils/activityFeed";
import { ensureTripNotEnded } from "../../utils/tripGuards";

const voteColumns = {
  id: true,
  challengeId: true,
  submissionId: true,
  voterId: true,
  votePosition: true,
  votePoints: true,
  normalizedWeight: true,
  votedAt: true,
} as const;

const challengeColumns = {
  id: true,
  tripId: true,
  status: true,
  scoringCategory: true,
  endTime: true,
} as const;

type ChallengeForVoting = Pick<
  typeof challenges.$inferSelect,
  "id" | "tripId" | "status" | "scoringCategory" | "endTime"
>;

interface JudgedStaffVotingProgress {
  requiredPositions: number;
  eligibleSubmissionsCount: number;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  allAdminsVoted: boolean;
}

const ensureTripParticipant = async (
  context: { db: DB; dbUser: { id: string } },
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

const getChallengeInTrip = async (
  context: { db: DB | TransactionDB },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, challengeId), eq(c.tripId, tripId)),
    columns: challengeColumns,
  });

  if (!challenge) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
  }

  return challenge;
};

const ensureChallengeVoting = (params: { challenge: ChallengeForVoting; actorRole: string }) => {
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

const recomputeSubmissionVotes = async (
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

  const tally = new Map<string, { count: number; score: number }>();
  for (const vote of votes) {
    const current = tally.get(vote.submissionId) ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += vote.votePoints * vote.normalizedWeight;
    tally.set(vote.submissionId, current);
  }

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

  const requiredPositions =
    eligibleSubmissionsCount >= 2 ? Math.min(3, eligibleSubmissionsCount) : 0;

  return {
    requiredPositions,
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

const hasAllRequiredPositions = (positions: Set<number>, requiredPositions: number) => {
  if (requiredPositions <= 0) return false;

  for (let position = 1; position <= requiredPositions; position += 1) {
    if (!positions.has(position)) {
      return false;
    }
  }

  return true;
};

const getJudgedStaffVotingProgress = async (
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

const maybeFinalizeJudgedStaffVoting = async (
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

const validateJudgedStaffVotePayload = async (
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

export const challengeVoteRouter = createORPCRouter({
  getMyByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const participant = await ensureTripParticipant(context, input.tripId);

      return context.db.query.challengeVotes.findMany({
        where: (cv, { eq, and }) =>
          and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id)),
        columns: voteColumns,
        orderBy: (cv, { asc }) => [asc(cv.votePosition)],
      });
    }),

  getByChallenge: moderatorProcedure
    .input(z.object({ challengeId: z.string() }))
    .handler(async ({ context, input }) => {
      return context.db.query.challengeVotes.findMany({
        where: (cv, { eq }) => eq(cv.challengeId, input.challengeId),
        columns: voteColumns,
        orderBy: (cv, { asc }) => [asc(cv.voterId), asc(cv.votePosition)],
      });
    }),

  getJudgedStaffProgress: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
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
    }),

  forceEndJudgedStaffVoting: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
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
    }),

  submitVotes: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        votes: z
          .array(
            z.object({
              submissionId: z.string(),
              votePosition: z.number().int().min(1).max(3),
              votePoints: z.number().int().min(0),
              normalizedWeight: z.number().positive().optional(),
            }),
          )
          .min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripNotEnded(context.db, input.tripId);
      const participant = await ensureTripParticipant(context, input.tripId);
      const challenge = await getChallengeInTrip(context, input.challengeId, input.tripId);
      ensureChallengeVoting({ challenge, actorRole: context.dbUser.role });

      const uniqueSubmissionIds = new Set(input.votes.map((vote) => vote.submissionId));
      if (uniqueSubmissionIds.size !== input.votes.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Nie mozna glosowac wielokrotnie na to samo zgloszenie",
        });
      }

      const uniquePositions = new Set(input.votes.map((vote) => vote.votePosition));
      if (uniquePositions.size !== input.votes.length) {
        throw new ORPCError("BAD_REQUEST", { message: "Pozycje glosow musza byc unikalne" });
      }

      const submissions = await context.db.query.challengeSubmissions.findMany({
        where: (cs, { eq, and, inArray }) =>
          and(inArray(cs.id, [...uniqueSubmissionIds]), eq(cs.challengeId, input.challengeId)),
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

      // Check for existing votes to prevent updates (both peer voting and judged staff)
      const existingVotes = await context.db.query.challengeVotes.findMany({
        where: (cv, { eq, and }) =>
          and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id)),
        columns: { votePosition: true },
      });

      if (existingVotes.length > 0) {
        throw new ORPCError("CONFLICT", {
          message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
        });
      }

      // Create new votes (no deletion allowed for any voting type)
      const result = await context.db.transaction(async (tx) => {
        await tx.insert(challengeVotes).values(
          input.votes.map((vote) => ({
            challengeId: input.challengeId,
            submissionId: vote.submissionId,
            voterId: participant.id,
            votePosition: vote.votePosition,
            votePoints: vote.votePoints,
            normalizedWeight: vote.normalizedWeight ?? 1.0,
          })),
        );

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
          where: (cv, { eq, and }) =>
            and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id)),
          columns: voteColumns,
          orderBy: (cv, { asc }) => [asc(cv.votePosition)],
        });
      });

      return result;
    }),
  submitVote: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        submissionId: z.string(),
        votePosition: z.number().int().min(1).max(3),
        votePoints: z.number().int().min(0),
        normalizedWeight: z.number().positive().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
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

      const submission = await context.db.query.challengeSubmissions.findFirst({
        where: (cs, { eq, and }) =>
          and(eq(cs.id, input.submissionId), eq(cs.challengeId, input.challengeId)),
        columns: { id: true, groupId: true },
      });

      if (!submission) {
        throw new ORPCError("BAD_REQUEST", { message: "Nieprawidlowe zgloszenie" });
      }

      if (participant.groupId && submission.groupId === participant.groupId) {
        throw new ORPCError("FORBIDDEN", { message: "Nie mozna glosowac na wlasna grupe" });
      }

      // Check for any existing votes to prevent updates (for all voting types)
      const existingVotes = await context.db.query.challengeVotes.findMany({
        where: (cv, { eq, and }) =>
          and(eq(cv.challengeId, input.challengeId), eq(cv.voterId, participant.id)),
        columns: { id: true, votePosition: true, submissionId: true },
      });

      if (existingVotes.length > 0) {
        // For peer voting, any existing vote should prevent new votes
        if (challenge.scoringCategory === "PEER_VOTING") {
          throw new ORPCError("CONFLICT", {
            message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu.",
          });
        }

        // For judged staff voting, check if position is already taken
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
            .values({
              challengeId: input.challengeId,
              submissionId: input.submissionId,
              voterId: participant.id,
              votePosition: input.votePosition,
              votePoints: input.votePoints,
              normalizedWeight: input.normalizedWeight ?? 1.0,
            })
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
    }),
});
