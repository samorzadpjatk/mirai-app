import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";
import { buildAuthEmailLookup, resolveAuthEmail } from "../../utils/authEmails";

const submissionBaseSelect: Prisma.ChallengeSubmissionSelect = {
  id: true,
  challengeId: true,
  groupId: true,
  imageIds: true,
  videoId: true,
  textContent: true,
  latitude: true,
  longitude: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  awardedPoints: true,
  bonusPoints: true,
  ranking: true,
  voteCount: true,
  voteScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

const submissionSelect: Prisma.ChallengeSubmissionSelect = {
  ...submissionBaseSelect,
  group: {
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      authUserId: true,
    },
  },
} as const;

const attachReviewerEmail = <T extends { authUserId?: string | null }>(
  reviewer: T | null,
  emailByAuthUserId: Map<string, string | null>,
) => {
  if (!reviewer) return reviewer;
  const { authUserId, ...rest } = reviewer;
  return {
    ...rest,
    email: resolveAuthEmail(emailByAuthUserId, authUserId),
  };
};

const ensureTripParticipant = async (
  ctx: { db: Prisma.TransactionClient; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await ctx.db.tripParticipant.findUnique({
    where: { userId_tripId: { userId: ctx.dbUser.id, tripId } },
  });
  if (!participant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak dostepu do wyjazdu",
    });
  }
  return participant;
};

const ensureChallengeInTrip = async (
  ctx: { db: Prisma.TransactionClient },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await ctx.db.challenge.findFirst({
    where: { id: challengeId, tripId },
    select: {
      id: true,
      name: true,
      submissionType: true,
      autoApprove: true,
      basePoints: true,
      firstPlacePoints: true,
      secondPlacePoints: true,
      thirdPlacePoints: true,
    },
  });
  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }
  return challenge;
};

const validateSubmissionPayload = (input: {
  submissionType: string;
  imageIds?: string[];
  videoId?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) => {
  const imageCount = input.imageIds?.length ?? 0;
  const hasText = Boolean(
    input.textContent && input.textContent.trim().length > 0,
  );
  const hasVideo = Boolean(input.videoId && input.videoId.trim().length > 0);
  const hasLocation =
    typeof input.latitude === "number" && typeof input.longitude === "number";

  switch (input.submissionType) {
    case "IMAGE":
      if (imageCount < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagany jest co najmniej 1 obraz",
        });
      }
      break;
    case "MULTI_IMAGE":
      if (imageCount < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagane sa co najmniej 2 obrazy",
        });
      }
      break;
    case "VIDEO":
      if (!hasVideo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagany jest film",
        });
      }
      break;
    case "TEXT":
      if (!hasText) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagana jest tresc tekstowa",
        });
      }
      break;
    case "IMAGE_LOCATION":
      if (imageCount < 1 || !hasLocation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagany jest obraz oraz lokalizacja",
        });
      }
      break;
    case "LOCATION":
      if (!hasLocation) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagana jest lokalizacja",
        });
      }
      break;
    case "QR_CODE":
      if (!hasText && imageCount < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagany jest kod QR (tekst lub obraz)",
        });
      }
      break;
    default:
      break;
  }
};

const resolveAwardedPoints = (
  challenge: {
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
  },
  input: { awardedPoints?: number; ranking?: number },
) => {
  if (typeof input.awardedPoints === "number") return input.awardedPoints;
  if (typeof input.ranking === "number") {
    switch (input.ranking) {
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

  return challenge.basePoints;
};

export const challengeSubmissionRouter = createTRPCRouter({
  getByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureTripParticipant(ctx, input.tripId);
      await ensureChallengeInTrip(ctx, input.challengeId, input.tripId);

      const submissions = await ctx.db.challengeSubmission.findMany({
        where: { challengeId: input.challengeId },
        select: submissionSelect,
        orderBy: [{ voteScore: "desc" }, { createdAt: "asc" }],
      });

      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        submissions.map((submission) => submission.reviewedBy?.authUserId),
      );

      return submissions.map((submission) => ({
        ...submission,
        reviewedBy: attachReviewerEmail(
          submission.reviewedBy,
          emailByAuthUserId,
        ),
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureTripParticipant(ctx, input.tripId);

      const submission = await ctx.db.challengeSubmission.findFirst({
        where: { id: input.id, challenge: { tripId: input.tripId } },
        select: submissionSelect,
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        submission.reviewedBy?.authUserId,
      ]);

      return {
        ...submission,
        reviewedBy: attachReviewerEmail(
          submission.reviewedBy,
          emailByAuthUserId,
        ),
      };
    }),

  getMyForChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      if (!participant.groupId) return null;

      return ctx.db.challengeSubmission
        .findUnique({
          where: {
            challengeId_groupId: {
              challengeId: input.challengeId,
              groupId: participant.groupId,
            },
          },
          select: submissionSelect,
        })
        .then(async (submission) => {
          if (!submission) return submission;

          const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
            submission.reviewedBy?.authUserId,
          ]);

          return {
            ...submission,
            reviewedBy: attachReviewerEmail(
              submission.reviewedBy,
              emailByAuthUserId,
            ),
          };
        });
    }),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        imageIds: z.array(z.string().min(1)).optional(),
        videoId: z.string().min(1).optional(),
        textContent: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      if (!participant.groupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Użytkownik nie jest przypisany do grupy",
        });
      }

      const challenge = await ensureChallengeInTrip(
        ctx,
        input.challengeId,
        input.tripId,
      );

      const existing = await ctx.db.challengeSubmission.findUnique({
        where: {
          challengeId_groupId: {
            challengeId: input.challengeId,
            groupId: participant.groupId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Zgłoszenie dla tej grupy już istnieje",
        });
      }

      validateSubmissionPayload({
        submissionType: challenge.submissionType,
        imageIds: input.imageIds,
        videoId: input.videoId,
        textContent: input.textContent,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      const autoApproved = challenge.autoApprove;
      const now = new Date();

      const awardPoints = autoApproved
        ? resolveAwardedPoints(challenge, {})
        : 0;
      const shouldAwardCoins = autoApproved && awardPoints > 0;

      const [submission] = await ctx.db.$transaction([
        ctx.db.challengeSubmission.create({
          data: {
            challengeId: input.challengeId,
            groupId: participant.groupId,
            imageIds: input.imageIds ?? [],
            videoId: input.videoId,
            textContent: input.textContent,
            latitude: input.latitude,
            longitude: input.longitude,
            status: autoApproved ? "APPROVED" : "PENDING",
            reviewedAt: autoApproved ? now : undefined,
          },
          select: submissionSelect,
        }),
        ...(shouldAwardCoins
          ? [
              ctx.db.group.update({
                where: { id: participant.groupId },
                data: { coins: { increment: awardPoints } },
              }),
              ctx.db.coinTransaction.create({
                data: {
                  groupId: participant.groupId,
                  amount: awardPoints,
                  reason: `Auto-approved challenge: ${challenge.name}`,
                  adminId: ctx.dbUser.id,
                },
              }),
            ]
          : []),
      ]);

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        submission.reviewedBy?.authUserId,
      ]);

      return {
        ...submission,
        reviewedBy: attachReviewerEmail(
          submission.reviewedBy,
          emailByAuthUserId,
        ),
      };
    }),

  updateMine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        imageIds: z.array(z.string().min(1)).optional(),
        videoId: z.string().min(1).optional(),
        textContent: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      if (!participant.groupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uzytkownik nie jest przypisany do grupy",
        });
      }

      const submission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.id,
          groupId: participant.groupId,
          challenge: { tripId: input.tripId },
        },
        select: {
          id: true,
          status: true,
          imageIds: true,
          videoId: true,
          textContent: true,
          latitude: true,
          longitude: true,
          challenge: { select: { submissionType: true, autoApprove: true } },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      if (submission.status === "APPROVED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie można edytować zatwierdzonego zgłoszenia",
        });
      }

      const nextImageIds = input.imageIds ?? submission.imageIds;
      const nextVideoId = input.videoId ?? submission.videoId;
      const nextTextContent = input.textContent ?? submission.textContent;
      const nextLatitude = input.latitude ?? submission.latitude;
      const nextLongitude = input.longitude ?? submission.longitude;

      validateSubmissionPayload({
        submissionType: submission.challenge.submissionType,
        imageIds: nextImageIds,
        videoId: nextVideoId,
        textContent: nextTextContent,
        latitude: nextLatitude ?? undefined,
        longitude: nextLongitude ?? undefined,
      });

      const autoApproved = submission.challenge.autoApprove;
      const now = new Date();

      const updatedSubmission = await ctx.db.challengeSubmission.update({
        where: { id: input.id },
        data: {
          imageIds: input.imageIds,
          videoId: input.videoId,
          textContent: input.textContent,
          latitude: input.latitude,
          longitude: input.longitude,
          status: autoApproved ? "APPROVED" : "PENDING",
          reviewedAt: autoApproved ? now : null,
          reviewedById: null,
          rejectionReason: null,
        },
        select: submissionSelect,
      });

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        updatedSubmission.reviewedBy?.authUserId,
      ]);

      return {
        ...updatedSubmission,
        reviewedBy: attachReviewerEmail(
          updatedSubmission.reviewedBy,
          emailByAuthUserId,
        ),
      };
    }),

  deleteMine: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      if (!participant.groupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Użytkownik nie jest przypisany do grupy",
        });
      }

      const submission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.id,
          groupId: participant.groupId,
          challenge: { tripId: input.tripId },
        },
        select: { id: true, status: true },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zgłoszenie nie zostało znalezione",
        });
      }

      if (submission.status === "APPROVED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie można usunąć zatwierdzonego zgłoszenia",
        });
      }

      await ctx.db.challengeSubmission.delete({ where: { id: input.id } });
      return { success: true };
    }),

  review: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().optional(),
        awardedPoints: z.number().int().min(0).optional(),
        bonusPoints: z.number().int().min(0).optional(),
        ranking: z.number().int().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.status === "REJECTED" && !input.rejectionReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Wymagany jest powód odrzucenia",
        });
      }

      const submission = await ctx.db.challengeSubmission.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          groupId: true,
          challenge: {
            select: {
              id: true,
              name: true,
              basePoints: true,
              firstPlacePoints: true,
              secondPlacePoints: true,
              thirdPlacePoints: true,
            },
          },
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Zgłoszenie nie zostało znalezione",
        });
      }

      const shouldAwardCoins =
        input.status === "APPROVED" && submission.status !== "APPROVED";
      const awardPoints = shouldAwardCoins
        ? resolveAwardedPoints(submission.challenge, {
            awardedPoints: input.awardedPoints,
            ranking: input.ranking,
          })
        : 0;
      const bonusPoints = shouldAwardCoins ? (input.bonusPoints ?? 0) : 0;
      const totalAwardPoints = awardPoints + bonusPoints;

      const [updatedSubmission] = await ctx.db.$transaction([
        ctx.db.challengeSubmission.update({
          where: { id: input.id },
          data: {
            status: input.status,
            rejectionReason:
              input.status === "REJECTED" ? input.rejectionReason : null,
            reviewedById: ctx.dbUser.id,
            reviewedAt: new Date(),
            awardedPoints: input.awardedPoints,
            bonusPoints: input.bonusPoints,
            ranking: input.ranking,
          },
          select: submissionSelect,
        }),
        ...(shouldAwardCoins && totalAwardPoints > 0
          ? [
              ctx.db.group.update({
                where: { id: submission.groupId },
                data: { coins: { increment: totalAwardPoints } },
              }),
              ctx.db.coinTransaction.create({
                data: {
                  groupId: submission.groupId,
                  amount: totalAwardPoints,
                  reason: `Challenge approved: ${submission.challenge.name}`,
                  adminId: ctx.dbUser.id,
                },
              }),
            ]
          : []),
      ]);

      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        updatedSubmission.reviewedBy?.authUserId,
      ]);

      return {
        ...updatedSubmission,
        reviewedBy: attachReviewerEmail(
          updatedSubmission.reviewedBy,
          emailByAuthUserId,
        ),
      };
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.challengeSubmission.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
