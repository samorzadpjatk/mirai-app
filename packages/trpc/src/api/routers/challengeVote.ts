import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";

const voteSelect: Prisma.ChallengeVoteSelect = {
  id: true,
  challengeId: true,
  submissionId: true,
  voterId: true,
  votePosition: true,
  votePoints: true,
  normalizedWeight: true,
  votedAt: true,
} as const;

const ensureTripParticipant = async (
  ctx: { db: Prisma.TransactionClient; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await ctx.db.tripParticipant.findUnique({
    where: { userId_tripId: { userId: ctx.dbUser.id, tripId } },
  });
  if (!participant) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Brak dostepu do wyjazdu" });
  }
  return participant;
};

const ensureChallengeVoting = async (
  ctx: { db: Prisma.TransactionClient },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await ctx.db.challenge.findFirst({
    where: { id: challengeId, tripId },
    select: { id: true, status: true },
  });
  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }
  if (challenge.status !== "VOTING_PHASE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Glosowanie nie jest aktywne",
    });
  }
  return challenge;
};

const recomputeSubmissionVotes = async (
  ctx: { db: Prisma.TransactionClient },
  challengeId: string,
) => {
  const submissions = await ctx.db.challengeSubmission.findMany({
    where: { challengeId },
    select: { id: true },
  });

  const votes = await ctx.db.challengeVote.findMany({
    where: { challengeId },
    select: { submissionId: true, votePoints: true, normalizedWeight: true },
  });

  const tally = new Map<string, { count: number; score: number }>();
  for (const vote of votes) {
    const current = tally.get(vote.submissionId) ?? { count: 0, score: 0 };
    current.count += 1;
    current.score += vote.votePoints * vote.normalizedWeight;
    tally.set(vote.submissionId, current);
  }

  await ctx.db.$transaction(
    submissions.map((submission) => {
      const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
      return ctx.db.challengeSubmission.update({
        where: { id: submission.id },
        data: { voteCount: stats.count, voteScore: stats.score },
      });
    }),
  );
};

export const challengeVoteRouter = createTRPCRouter({
  getMyByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);

      return ctx.db.challengeVote.findMany({
        where: { challengeId: input.challengeId, voterId: participant.id },
        select: voteSelect,
        orderBy: { votePosition: "asc" },
      });
    }),

  getByChallenge: moderatorProcedure
    .input(z.object({ challengeId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.challengeVote.findMany({
        where: { challengeId: input.challengeId },
        select: voteSelect,
        orderBy: [{ voterId: "asc" }, { votePosition: "asc" }],
      });
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      await ensureChallengeVoting(ctx, input.challengeId, input.tripId);

      const uniqueSubmissionIds = new Set(input.votes.map((vote) => vote.submissionId));
      if (uniqueSubmissionIds.size !== input.votes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nie mozna glosowac wielokrotnie na to samo zgloszenie",
        });
      }

      const uniquePositions = new Set(input.votes.map((vote) => vote.votePosition));
      if (uniquePositions.size !== input.votes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pozycje glosow musza byc unikalne",
        });
      }

      const submissions = await ctx.db.challengeSubmission.findMany({
        where: { id: { in: [...uniqueSubmissionIds] }, challengeId: input.challengeId },
        select: { id: true, groupId: true },
      });

      if (submissions.length !== uniqueSubmissionIds.size) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nieprawidlowe zgloszenia",
        });
      }

      if (participant.groupId) {
        const ownSubmission = submissions.find(
          (submission) => submission.groupId === participant.groupId,
        );
        if (ownSubmission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nie mozna glosowac na wlasna grupe",
          });
        }
      }

      await ctx.db.$transaction([
        ctx.db.challengeVote.deleteMany({
          where: { challengeId: input.challengeId, voterId: participant.id },
        }),
        ctx.db.challengeVote.createMany({
          data: input.votes.map((vote) => ({
            challengeId: input.challengeId,
            submissionId: vote.submissionId,
            voterId: participant.id,
            votePosition: vote.votePosition,
            votePoints: vote.votePoints,
            normalizedWeight: vote.normalizedWeight ?? 1.0,
          })),
        }),
      ]);

      await recomputeSubmissionVotes(ctx, input.challengeId);

      return ctx.db.challengeVote.findMany({
        where: { challengeId: input.challengeId, voterId: participant.id },
        select: voteSelect,
        orderBy: { votePosition: "asc" },
      });
    }),
});
