import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { type Prisma, type PrismaClient } from "@integral-2025-app/db";
import { createChallengeCompletionWithWinnersById } from "../../utils/activityFeed";

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

const challengeVotingSelect = {
  id: true,
  tripId: true,
  status: true,
  scoringCategory: true,
  endTime: true,
} as const satisfies Prisma.ChallengeSelect;

type ChallengeForVoting = Prisma.ChallengeGetPayload<{
  select: typeof challengeVotingSelect;
}>;

interface JudgedStaffVotingProgress {
  requiredPositions: number;
  eligibleSubmissionsCount: number;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  allAdminsVoted: boolean;
}

const ensureTripParticipant = async (
  ctx: { db: PrismaClient; dbUser: { id: string } },
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

const getChallengeInTrip = async (
  ctx: { db: PrismaClient },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await ctx.db.challenge.findFirst({
    where: { id: challengeId, tripId },
    select: challengeVotingSelect,
  });

  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }

  return challenge;
};

const ensureChallengeVoting = (params: {
  challenge: ChallengeForVoting;
  actorRole: string;
}) => {
  const { challenge, actorRole } = params;

  if (challenge.scoringCategory === "PEER_VOTING") {
    if (challenge.status !== "VOTING_PHASE") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Glosowanie nie jest aktywne",
      });
    }
    return;
  }

  if (challenge.scoringCategory !== "JUDGED_STAFF") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voting is available only for peer voting and judged staff challenges",
    });
  }

  if (actorRole !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can vote in judged staff challenges",
    });
  }

  if (challenge.status === "CANCELLED" || challenge.status === "COMPLETED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Glosowanie zostalo zakonczone",
    });
  }

  if (challenge.status !== "ACTIVE" && challenge.status !== "VOTING_PHASE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Challenge nie jest gotowy do glosowania",
    });
  }

  if (!challenge.endTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Staff voting requires submission end time",
    });
  }

  if (challenge.endTime.getTime() > Date.now()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Staff voting starts after submission phase ends",
    });
  }
};

const recomputeSubmissionVotes = async (
  ctx: { db: PrismaClient },
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

const resolveRequiredVotePositions = async (
  ctx: { db: PrismaClient },
  challengeId: string,
) => {
  const eligibleSubmissionsCount = await ctx.db.challengeSubmission.count({
    where: {
      challengeId,
      status: { not: "REJECTED" },
    },
  });

  const requiredPositions =
    eligibleSubmissionsCount >= 2 ? Math.min(3, eligibleSubmissionsCount) : 0;

  return {
    requiredPositions,
    eligibleSubmissionsCount,
  };
};

const getTripAdminParticipantIds = async (
  ctx: { db: PrismaClient },
  tripId: string,
) => {
  const admins = await ctx.db.tripParticipant.findMany({
    where: {
      tripId,
      user: {
        role: "ADMIN",
      },
    },
    select: { id: true },
  });

  return admins.map((admin) => admin.id);
};

const hasAllRequiredPositions = (
  positions: Set<number>,
  requiredPositions: number,
) => {
  if (requiredPositions <= 0) return false;

  for (let position = 1; position <= requiredPositions; position += 1) {
    if (!positions.has(position)) {
      return false;
    }
  }

  return true;
};

const getJudgedStaffVotingProgress = async (
  ctx: { db: PrismaClient },
  params: { challengeId: string; tripId: string },
): Promise<JudgedStaffVotingProgress> => {
  const [{ requiredPositions, eligibleSubmissionsCount }, adminParticipantIds] =
    await Promise.all([
      resolveRequiredVotePositions(ctx, params.challengeId),
      getTripAdminParticipantIds(ctx, params.tripId),
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

  const votes = await ctx.db.challengeVote.findMany({
    where: {
      challengeId: params.challengeId,
      voterId: { in: adminParticipantIds },
    },
    select: {
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
  ctx: { db: PrismaClient },
  params: {
    challenge: ChallengeForVoting;
    createdByAdminId: string;
  },
) => {
  if (params.challenge.scoringCategory !== "JUDGED_STAFF") {
    return { finalized: false, progress: null as JudgedStaffVotingProgress | null };
  }

  const progress = await getJudgedStaffVotingProgress(ctx, {
    challengeId: params.challenge.id,
    tripId: params.challenge.tripId,
  });

  if (!progress.allAdminsVoted) {
    return { finalized: false, progress };
  }

  const result = await ctx.db.challenge.updateMany({
    where: {
      id: params.challenge.id,
      tripId: params.challenge.tripId,
      scoringCategory: "JUDGED_STAFF",
      status: { in: ["ACTIVE", "VOTING_PHASE"] },
    },
    data: {
      status: "COMPLETED",
    },
  });

  if (result.count > 0) {
    await createChallengeCompletionWithWinnersById({
      tx: ctx.db,
      challengeId: params.challenge.id,
      createdByAdmin: params.createdByAdminId,
    });
  }

  return { finalized: result.count > 0, progress };
};

const validateJudgedStaffVotePayload = async (
  ctx: { db: PrismaClient },
  params: {
    challengeId: string;
    votePositions: number[];
    requireExactCount: boolean;
  },
) => {
  const { requiredPositions } = await resolveRequiredVotePositions(
    ctx,
    params.challengeId,
  );

  if (requiredPositions <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "At least 2 eligible submissions are required for staff voting",
    });
  }

  if (params.votePositions.some((position) => position > requiredPositions)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Staff voting accepts only positions 1-${requiredPositions}`,
    });
  }

  if (params.requireExactCount && params.votePositions.length !== requiredPositions) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Staff voting requires exactly ${requiredPositions} votes`,
    });
  }

  return { requiredPositions };
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

  getJudgedStaffProgress: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const challenge = await getChallengeInTrip(ctx, input.challengeId, input.tripId);

      if (challenge.scoringCategory !== "JUDGED_STAFF") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Progress is available only for judged staff challenges",
        });
      }

      const progress = await getJudgedStaffVotingProgress(ctx, {
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
    .mutation(async ({ ctx, input }) => {
      const challenge = await getChallengeInTrip(ctx, input.challengeId, input.tripId);

      if (challenge.scoringCategory !== "JUDGED_STAFF") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Force end is available only for judged staff challenges",
        });
      }

      if (challenge.status === "CANCELLED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancelled challenge cannot be finalized",
        });
      }

      if (!challenge.endTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Staff voting requires submission end time",
        });
      }

      if (challenge.endTime.getTime() > Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can force end staff voting only after submission phase ends",
        });
      }

      await recomputeSubmissionVotes(ctx, input.challengeId);

      await ctx.db.challenge.updateMany({
        where: {
          id: challenge.id,
          tripId: challenge.tripId,
          scoringCategory: "JUDGED_STAFF",
          status: { in: ["HIDDEN", "VISIBLE", "ACTIVE", "VOTING_PHASE"] },
        },
        data: {
          status: "COMPLETED",
        },
      });

      await createChallengeCompletionWithWinnersById({
        tx: ctx.db,
        challengeId: challenge.id,
        createdByAdmin: ctx.dbUser.id,
      });

      const progress = await getJudgedStaffVotingProgress(ctx, {
        challengeId: challenge.id,
        tripId: challenge.tripId,
      });

      return {
        success: true,
        finalized: true,
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      const challenge = await getChallengeInTrip(ctx, input.challengeId, input.tripId);
      ensureChallengeVoting({ challenge, actorRole: ctx.dbUser.role });

      let judgedStaffRequiredPositions: number | null = null;
      if (challenge.scoringCategory === "JUDGED_STAFF") {
        const { requiredPositions } = await validateJudgedStaffVotePayload(ctx, {
          challengeId: input.challengeId,
          votePositions: input.votes.map((vote) => vote.votePosition),
          requireExactCount: true,
        });
        judgedStaffRequiredPositions = requiredPositions;
      }

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

      if (
        challenge.scoringCategory === "JUDGED_STAFF" &&
        judgedStaffRequiredPositions !== null
      ) {
        const existingVotes = await ctx.db.challengeVote.findMany({
          where: {
            challengeId: input.challengeId,
            voterId: participant.id,
          },
          select: { votePosition: true },
        });

        if (existingVotes.length > 0) {
          const existingPositions = new Set(
            existingVotes.map((vote) => vote.votePosition),
          );
          const alreadySubmittedAllRequiredPositions = hasAllRequiredPositions(
            existingPositions,
            judgedStaffRequiredPositions,
          );

          throw new TRPCError({
            code: "CONFLICT",
            message: alreadySubmittedAllRequiredPositions
              ? "Oddales juz glos w staff voting"
              : "Masz juz zapisane glosy staff voting. To glosowanie mozna wyslac tylko raz.",
          });
        }

        await ctx.db.challengeVote.createMany({
          data: input.votes.map((vote) => ({
            challengeId: input.challengeId,
            submissionId: vote.submissionId,
            voterId: participant.id,
            votePosition: vote.votePosition,
            votePoints: vote.votePoints,
            normalizedWeight: vote.normalizedWeight ?? 1.0,
          })),
        });
      } else {
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
      }

      await recomputeSubmissionVotes(ctx, input.challengeId);

      if (challenge.scoringCategory === "JUDGED_STAFF") {
        await maybeFinalizeJudgedStaffVoting(ctx, {
          challenge,
          createdByAdminId: ctx.dbUser.id,
        });
      }

      return ctx.db.challengeVote.findMany({
        where: { challengeId: input.challengeId, voterId: participant.id },
        select: voteSelect,
        orderBy: { votePosition: "asc" },
      });
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      const challenge = await getChallengeInTrip(ctx, input.challengeId, input.tripId);
      ensureChallengeVoting({ challenge, actorRole: ctx.dbUser.role });

      if (challenge.scoringCategory === "JUDGED_STAFF") {
        await validateJudgedStaffVotePayload(ctx, {
          challengeId: input.challengeId,
          votePositions: [input.votePosition],
          requireExactCount: false,
        });
      }

      const submission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.submissionId,
          challengeId: input.challengeId,
        },
        select: { id: true, groupId: true },
      });

      if (!submission) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nieprawidlowe zgloszenie",
        });
      }

      if (participant.groupId && submission.groupId === participant.groupId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie mozna glosowac na wlasna grupe",
        });
      }

      const existingByPosition = await ctx.db.challengeVote.findFirst({
        where: {
          challengeId: input.challengeId,
          voterId: participant.id,
          votePosition: input.votePosition,
        },
        select: { id: true, submissionId: true },
      });

      if (existingByPosition) {
        if (existingByPosition.submissionId === input.submissionId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Glos juz istnieje",
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pozycja glosu jest juz zajeta",
        });
      }

      try {
        const createdVote = await ctx.db.challengeVote.create({
          data: {
            challengeId: input.challengeId,
            submissionId: input.submissionId,
            voterId: participant.id,
            votePosition: input.votePosition,
            votePoints: input.votePoints,
            normalizedWeight: input.normalizedWeight ?? 1.0,
          },
          select: voteSelect,
        });

        await recomputeSubmissionVotes(ctx, input.challengeId);

        if (challenge.scoringCategory === "JUDGED_STAFF") {
          await maybeFinalizeJudgedStaffVoting(ctx, {
            challenge,
            createdByAdminId: ctx.dbUser.id,
          });
        }

        return createdVote;
      } catch (error: unknown) {
        const prismaCode =
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: unknown }).code
            : undefined;
        const prismaCodeValue =
          typeof prismaCode === "string" ? prismaCode : "";
        if (prismaCodeValue === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Glos juz istnieje",
          });
        }
        throw error;
      }
    }),
});
