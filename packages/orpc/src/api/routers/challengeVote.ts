import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  adminProcedure,
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../api/trpc";
import { type Prisma, type PrismaClient } from "@mirai-app/db";
import { createChallengeCompletionWithWinnersById } from "../../utils/activityFeed";
import { ensureTripNotEnded } from "../../utils/tripGuards";

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
  context: { db: PrismaClient; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.tripParticipant.findUnique({
    where: { userId_tripId: { userId: context.dbUser.id, tripId } },
  });
  if (!participant) {
    throw new ORPCError("FORBIDDEN", { message: "Brak dostepu do wyjazdu" });
  }
  return participant;
};

const getChallengeInTrip = async (
  context: { db: PrismaClient },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await context.db.challenge.findFirst({
    where: { id: challengeId, tripId },
    select: challengeVotingSelect,
  });

  if (!challenge) {
    throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
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
      throw new ORPCError("BAD_REQUEST", { message: "Glosowanie nie jest aktywne" });
    }
    return;
  }

  if (challenge.scoringCategory !== "JUDGED_STAFF") {
    throw new ORPCError("BAD_REQUEST", { message: "Voting is available only for peer voting and judged staff challenges" });
  }

  if (actorRole !== "ADMIN") {
    throw new ORPCError("FORBIDDEN", { message: "Only admins can vote in judged staff challenges" });
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
    throw new ORPCError("BAD_REQUEST", { message: "Staff voting starts after submission phase ends" });
  }
};

const recomputeSubmissionVotes = async (
  context: { db: PrismaClient | Prisma.TransactionClient },
  challengeId: string,
) => {
  const submissions = await context.db.challengeSubmission.findMany({
    where: { challengeId },
    select: { id: true },
  });

  const votes = await context.db.challengeVote.findMany({
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

  // Handle both PrismaClient and TransactionClient
  if ('$transaction' in context.db) {
    // Regular PrismaClient - use its transaction method
    await context.db.$transaction(
      submissions.map((submission) => {
        const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
        return context.db.challengeSubmission.update({
          where: { id: submission.id },
          data: { voteCount: stats.count, voteScore: stats.score },
        });
      }),
    );
  } else {
    // TransactionClient - execute updates sequentially within the existing transaction
    const txDb = context.db as Prisma.TransactionClient;
    for (const submission of submissions) {
      const stats = tally.get(submission.id) ?? { count: 0, score: 0 };
      await txDb.challengeSubmission.update({
        where: { id: submission.id },
        data: { voteCount: stats.count, voteScore: stats.score },
      });
    }
  }
};

const resolveRequiredVotePositions = async (
  context: { db: PrismaClient | Prisma.TransactionClient },
  challengeId: string,
) => {
  const eligibleSubmissionsCount = await context.db.challengeSubmission.count({
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
  context: { db: PrismaClient | Prisma.TransactionClient },
  tripId: string,
) => {
  const admins = await context.db.tripParticipant.findMany({
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
  context: { db: PrismaClient | Prisma.TransactionClient },
  params: { challengeId: string; tripId: string },
): Promise<JudgedStaffVotingProgress> => {
  const [{ requiredPositions, eligibleSubmissionsCount }, adminParticipantIds] =
    await Promise.all([
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

  const votes = await context.db.challengeVote.findMany({
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
  context: { db: PrismaClient | Prisma.TransactionClient },
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

  const result = await context.db.challenge.updateMany({
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
      tx: context.db,
      challengeId: params.challenge.id,
      createdByAdmin: params.createdByAdminId,
    });
  }

  return { finalized: result.count > 0, progress };
};

const validateJudgedStaffVotePayload = async (
  context: { db: PrismaClient | Prisma.TransactionClient },
  params: {
    challengeId: string;
    votePositions: number[];
    requireExactCount: boolean;
  },
) => {
  const { requiredPositions } = await resolveRequiredVotePositions(
    context,
    params.challengeId,
  );

  if (requiredPositions <= 0) {
    throw new ORPCError("BAD_REQUEST", { message: "At least 2 eligible submissions are required for staff voting" });
  }

  if (params.votePositions.some((position) => position > requiredPositions)) {
    throw new ORPCError("BAD_REQUEST", { message: `Staff voting accepts only positions 1-${requiredPositions}` });
  }

  if (params.requireExactCount && params.votePositions.length !== requiredPositions) {
    throw new ORPCError("BAD_REQUEST", { message: `Staff voting requires exactly ${requiredPositions} votes` });
  }

  return { requiredPositions };
};

export const challengeVoteRouter = createORPCRouter({
  getMyByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const participant = await ensureTripParticipant(context, input.tripId);

      return context.db.challengeVote.findMany({
        where: { challengeId: input.challengeId, voterId: participant.id },
        select: voteSelect,
        orderBy: { votePosition: "asc" },
      });
    }),

  getByChallenge: moderatorProcedure
    .input(z.object({ challengeId: z.string() }))
    .handler(async ({ context, input }) => {
      return context.db.challengeVote.findMany({
        where: { challengeId: input.challengeId },
        select: voteSelect,
        orderBy: [{ voterId: "asc" }, { votePosition: "asc" }],
      });
    }),

  getJudgedStaffProgress: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const challenge = await getChallengeInTrip(context, input.challengeId, input.tripId);

      if (challenge.scoringCategory !== "JUDGED_STAFF") {
        throw new ORPCError("BAD_REQUEST", { message: "Progress is available only for judged staff challenges" });
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
        throw new ORPCError("BAD_REQUEST", { message: "Force end is available only for judged staff challenges" });
      }

      if (challenge.status === "CANCELLED") {
        throw new ORPCError("BAD_REQUEST", { message: "Cancelled challenge cannot be finalized" });
      }

      if (!challenge.endTime) {
        throw new ORPCError("BAD_REQUEST", { message: "Staff voting requires submission end time" });
      }

      if (challenge.endTime.getTime() > Date.now()) {
        throw new ORPCError("BAD_REQUEST", { message: "You can force end staff voting only after submission phase ends" });
      }

      const result = await context.db.$transaction(async (tx) => {
        await recomputeSubmissionVotes({ db: tx }, input.challengeId);

        const updateResult = await tx.challenge.updateMany({
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

        if (updateResult.count > 0) {
          await createChallengeCompletionWithWinnersById({
            tx: tx,
            challengeId: challenge.id,
            createdByAdmin: context.dbUser.id,
          });
        }

        return updateResult.count > 0;
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
        throw new ORPCError("BAD_REQUEST", { message: "Nie mozna glosowac wielokrotnie na to samo zgloszenie" });
      }

      const uniquePositions = new Set(input.votes.map((vote) => vote.votePosition));
      if (uniquePositions.size !== input.votes.length) {
        throw new ORPCError("BAD_REQUEST", { message: "Pozycje glosow musza byc unikalne" });
      }

      const submissions = await context.db.challengeSubmission.findMany({
        where: { id: { in: [...uniqueSubmissionIds] }, challengeId: input.challengeId },
        select: { id: true, groupId: true },
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
      const existingVotes = await context.db.challengeVote.findMany({
        where: {
          challengeId: input.challengeId,
          voterId: participant.id,
        },
        select: { votePosition: true },
      });

      if (existingVotes.length > 0) {
        throw new ORPCError("CONFLICT", { message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu." });
      }

      // Create new votes (no deletion allowed for any voting type)
      const result = await context.db.$transaction(async (tx) => {
        await tx.challengeVote.createMany({
          data: input.votes.map((vote) => ({
            challengeId: input.challengeId,
            submissionId: vote.submissionId,
            voterId: participant.id,
            votePosition: vote.votePosition,
            votePoints: vote.votePoints,
            normalizedWeight: vote.normalizedWeight ?? 1.0,
          })),
        });

        await recomputeSubmissionVotes({ db: tx }, input.challengeId);

        if (challenge.scoringCategory === "JUDGED_STAFF") {
          await maybeFinalizeJudgedStaffVoting({ db: tx }, {
            challenge,
            createdByAdminId: context.dbUser.id,
          });
        }

        return await tx.challengeVote.findMany({
          where: { challengeId: input.challengeId, voterId: participant.id },
          select: voteSelect,
          orderBy: { votePosition: "asc" },
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

      const submission = await context.db.challengeSubmission.findFirst({
        where: {
          id: input.submissionId,
          challengeId: input.challengeId,
        },
        select: { id: true, groupId: true },
      });

      if (!submission) {
        throw new ORPCError("BAD_REQUEST", { message: "Nieprawidlowe zgloszenie" });
      }

      if (participant.groupId && submission.groupId === participant.groupId) {
        throw new ORPCError("FORBIDDEN", { message: "Nie mozna glosowac na wlasna grupe" });
      }

      // Check for any existing votes to prevent updates (for all voting types)
      const existingVotes = await context.db.challengeVote.findMany({
        where: {
          challengeId: input.challengeId,
          voterId: participant.id,
        },
        select: { id: true, votePosition: true, submissionId: true },
      });

      if (existingVotes.length > 0) {
        // For peer voting, any existing vote should prevent new votes
        if (challenge.scoringCategory === "PEER_VOTING") {
          throw new ORPCError("CONFLICT", { message: "Oddales juz glos w tym wyzwaniu. Glosy nie mozna zmienic po oddaniu." });
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
        const result = await context.db.$transaction(async (tx) => {
          const createdVote = await tx.challengeVote.create({
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

          await recomputeSubmissionVotes({ db: tx }, input.challengeId);

          if (challenge.scoringCategory === "JUDGED_STAFF") {
            await maybeFinalizeJudgedStaffVoting({ db: tx }, {
              challenge,
              createdByAdminId: context.dbUser.id,
            });
          }

          return createdVote;
        });

        return result;
      } catch (error: unknown) {
        const prismaCode =
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: unknown }).code
            : undefined;
        const prismaCodeValue =
          typeof prismaCode === "string" ? prismaCode : "";
        if (prismaCodeValue === "P2002") {
          throw new ORPCError("CONFLICT", { message: "Glos juz istnieje" });
        }
        throw error;
      }
    }),
});
