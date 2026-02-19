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
import { calculateDistance } from "../../utils/location-validation";
import {
  captureTripRankingSnapshot,
  createChallengeStatusActivityById,
  createRankChangeActivities,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../utils/activityFeed";

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

const submissionApprovalActivitySelect: Prisma.ChallengeSubmissionSelect = {
  id: true,
  challengeId: true,
  groupId: true,
  imageIds: true,
  videoId: true,
  awardedPoints: true,
  bonusPoints: true,
  ranking: true,
  challenge: {
    select: {
      id: true,
      tripId: true,
      name: true,
    },
  },
  group: {
    select: {
      id: true,
      name: true,
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
  await ctx.db.challenge.updateMany({
    where: {
      id: challengeId,
      tripId,
      status: "VISIBLE",
      endTime: { lte: new Date() },
    },
    data: {
      status: "COMPLETED",
    },
  });

  await promoteVisibleChallengesToActiveWithFeed({
    tx: ctx.db,
    where: { id: challengeId, tripId },
    createdByAdmin: null,
  });

  await ctx.db.challenge.updateMany({
    where: {
      id: challengeId,
      tripId,
      status: "ACTIVE",
      endTime: { lte: new Date() },
    },
    data: {
      status: "COMPLETED",
    },
  });

  const challenge = await ctx.db.challenge.findFirst({
    where: { id: challengeId, tripId },
    select: {
      id: true,
      name: true,
      status: true,
      submissionType: true,
      description: true,
      expectedValue: true,
      targetLatitude: true,
      targetLongitude: true,
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

const LOCATION_AUTO_APPROVE_RADIUS_METERS = 50;

const shouldAutoApproveSubmission = (params: {
  challenge: {
    submissionType: string;
    autoApprove: boolean;
    expectedValue: string | null;
    targetLatitude: number | null;
    targetLongitude: number | null;
  };
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) => {
  if (params.challenge.submissionType === "QR_CODE") {
    const expected = params.challenge.expectedValue?.trim();
    const submitted = params.textContent?.trim();
    if (!expected) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "QR challenge is not configured with expected code",
      });
    }
    if (!submitted || submitted !== expected) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid QR code",
      });
    }
    return true;
  }

  if (params.challenge.submissionType === "LOCATION") {
    if (
      typeof params.latitude !== "number" ||
      typeof params.longitude !== "number" ||
      typeof params.challenge.targetLatitude !== "number" ||
      typeof params.challenge.targetLongitude !== "number"
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Location challenge is missing required coordinates",
      });
    }

    const distanceKm = calculateDistance(
      params.latitude,
      params.longitude,
      params.challenge.targetLatitude,
      params.challenge.targetLongitude,
    );

    if (distanceKm * 1000 > LOCATION_AUTO_APPROVE_RADIUS_METERS) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You are too far from target location",
      });
    }

    return true;
  }

  if (params.challenge.submissionType === "TEXT") {
    const expected = params.challenge.expectedValue?.trim();
    if (expected) {
      const submitted = params.textContent?.trim();
      if (!submitted || submitted !== expected) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Incorrect phrase",
        });
      }
      return true;
    }
    // No phrase configured — fall through to autoApprove flag
  }

  if (params.challenge.autoApprove) {
    return true;
  }

  return false;
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

const rebalanceSpeedRankings = async (params: {
  tx: Prisma.TransactionClient;
  challenge: {
    id: string;
    name: string;
    basePoints: number;
    firstPlacePoints: number | null;
    secondPlacePoints: number | null;
    thirdPlacePoints: number | null;
  };
  adminId: string;
}) => {
  const approved = await params.tx.challengeSubmission.findMany({
    where: {
      challengeId: params.challenge.id,
      status: "APPROVED",
    },
    select: {
      id: true,
      groupId: true,
      createdAt: true,
      ranking: true,
      awardedPoints: true,
      bonusPoints: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  for (let index = 0; index < approved.length; index += 1) {
    const submission = approved[index];
    if (!submission) continue;

    const nextRanking = index + 1;
    const nextAwardedPoints = resolveAwardedPoints(params.challenge, {
      ranking: nextRanking,
    });

    const previousTotal =
      (submission.awardedPoints ?? 0) + (submission.bonusPoints ?? 0);
    const nextTotal = nextAwardedPoints + (submission.bonusPoints ?? 0);
    const delta = nextTotal - previousTotal;

    const rankingChanged = submission.ranking !== nextRanking;
    const pointsChanged = submission.awardedPoints !== nextAwardedPoints;
    if (!rankingChanged && !pointsChanged && delta === 0) {
      continue;
    }

    await params.tx.challengeSubmission.update({
      where: { id: submission.id },
      data: {
        ranking: nextRanking,
        awardedPoints: nextAwardedPoints,
      },
    });

    if (delta !== 0) {
      await params.tx.group.update({
        where: { id: submission.groupId },
        data: { coins: { increment: delta } },
      });
      await params.tx.coinTransaction.create({
        data: {
          groupId: submission.groupId,
          amount: delta,
          reason: `Speed ranking update: ${params.challenge.name} (#${nextRanking})`,
          adminId: params.adminId,
        },
      });
    }
  }
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
      const participantGroupId = participant.groupId;

      const challenge = await ensureChallengeInTrip(
        ctx,
        input.challengeId,
        input.tripId,
      );

      if (challenge.status !== "ACTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Submission is allowed only for active challenges",
        });
      }

      const existing = await ctx.db.challengeSubmission.findUnique({
        where: {
          challengeId_groupId: {
            challengeId: input.challengeId,
            groupId: participantGroupId,
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

      const autoApproved = shouldAutoApproveSubmission({
        challenge,
        textContent: input.textContent,
        latitude: input.latitude,
        longitude: input.longitude,
      });
      const now = new Date();

      const awardPoints = autoApproved
        ? resolveAwardedPoints(challenge, {})
        : 0;
      const shouldAwardCoins = autoApproved && awardPoints > 0;

      const createdSubmissionId = await ctx.db.$transaction(async (tx) => {
        const previousRankingSnapshot = shouldAwardCoins
          ? await captureTripRankingSnapshot(tx, input.tripId)
          : null;

        const createdSubmission = await tx.challengeSubmission.create({
          data: {
            challengeId: input.challengeId,
            groupId: participantGroupId,
            imageIds: input.imageIds ?? [],
            videoId: input.videoId,
            textContent: input.textContent,
            latitude: input.latitude,
            longitude: input.longitude,
            status: autoApproved ? "APPROVED" : "PENDING",
            reviewedAt: autoApproved ? now : undefined,
          },
          select: { id: true },
        });

        if (shouldAwardCoins) {
          await tx.group.update({
            where: { id: participantGroupId },
            data: { coins: { increment: awardPoints } },
          });
          await tx.coinTransaction.create({
            data: {
              groupId: participantGroupId,
              amount: awardPoints,
              reason: `Auto-approved challenge: ${challenge.name}`,
              adminId: ctx.dbUser.id,
            },
          });

          if (previousRankingSnapshot) {
            await createRankChangeActivities({
              tx,
              tripId: input.tripId,
              previousSnapshot: previousRankingSnapshot,
              createdByAdmin: ctx.dbUser.id,
            });
          }
        }

        return createdSubmission;
      });

      const submission = await ctx.db.challengeSubmission.findUnique({
        where: { id: createdSubmissionId.id },
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
          challenge: {
            select: {
              id: true,
              status: true,
              startTime: true,
              endTime: true,
              submissionType: true,
              description: true,
              targetLatitude: true,
              targetLongitude: true,
              autoApprove: true,
              expectedValue: true,
            },
          },
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

      if (
        (submission.challenge.status === "VISIBLE" ||
          submission.challenge.status === "ACTIVE") &&
        submission.challenge.endTime &&
        submission.challenge.endTime <= new Date()
      ) {
        await ctx.db.challenge.update({
          where: { id: submission.challenge.id },
          data: { status: "COMPLETED" },
        });
        submission.challenge.status = "COMPLETED";
      } else if (
        submission.challenge.status === "VISIBLE" &&
        submission.challenge.startTime &&
        submission.challenge.startTime <= new Date()
      ) {
        const activation = await ctx.db.challenge.updateMany({
          where: {
            id: submission.challenge.id,
            status: "VISIBLE",
          },
          data: { status: "ACTIVE" },
        });

        if (activation.count > 0) {
          await createChallengeStatusActivityById({
            tx: ctx.db,
            challengeId: submission.challenge.id,
            eventType: "challenge_started",
            createdByAdmin: null,
          });
        }
        submission.challenge.status = "ACTIVE";
      }

      if (submission.challenge.status !== "ACTIVE") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Submission is allowed only for active challenges",
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

      const autoApproved = shouldAutoApproveSubmission({
        challenge: submission.challenge,
        textContent: nextTextContent,
        latitude: nextLatitude,
        longitude: nextLongitude,
      });
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
              tripId: true,
              name: true,
              scoringCategory: true,
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

      const shouldCreateApprovalActivity =
        input.status === "APPROVED" && submission.status !== "APPROVED";
      const shouldAwardCoins = shouldCreateApprovalActivity;
      const awardPoints = shouldAwardCoins
        ? resolveAwardedPoints(submission.challenge, {
            awardedPoints: input.awardedPoints,
            ranking: input.ranking,
          })
        : 0;
      const bonusPoints = shouldAwardCoins ? (input.bonusPoints ?? 0) : 0;
      const totalAwardPoints = awardPoints + bonusPoints;

      const updatedSubmission = await ctx.db.$transaction(async (tx) => {
        const previousRankingSnapshot = shouldCreateApprovalActivity
          ? await captureTripRankingSnapshot(tx, submission.challenge.tripId)
          : null;

        const isSpeed = submission.challenge.scoringCategory === "SPEED";
        await tx.challengeSubmission.update({
          where: { id: input.id },
          data: {
            status: input.status,
            rejectionReason:
              input.status === "REJECTED" ? input.rejectionReason : null,
            reviewedById: ctx.dbUser.id,
            reviewedAt: new Date(),
            awardedPoints: isSpeed ? undefined : input.awardedPoints,
            bonusPoints: input.bonusPoints,
            ranking: isSpeed ? undefined : input.ranking,
          },
        });

        if (isSpeed && input.status === "APPROVED") {
          await rebalanceSpeedRankings({
            tx,
            challenge: submission.challenge,
            adminId: ctx.dbUser.id,
          });
        } else if (shouldAwardCoins && totalAwardPoints > 0) {
          await tx.group.update({
            where: { id: submission.groupId },
            data: { coins: { increment: totalAwardPoints } },
          });
          await tx.coinTransaction.create({
            data: {
              groupId: submission.groupId,
              amount: totalAwardPoints,
              reason: `Challenge approved: ${submission.challenge.name}`,
              adminId: ctx.dbUser.id,
            },
          });
        }

        const refreshedForResponse = await tx.challengeSubmission.findUnique({
          where: { id: input.id },
          select: submissionSelect,
        });

        if (!refreshedForResponse) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Zgłoszenie nie zostało znalezione",
          });
        }

        if (shouldCreateApprovalActivity) {
          const existingSubmissionActivity =
            await tx.submissionActivity.findFirst({
              where: { submissionId: input.id },
              select: { activityId: true },
            });

          if (!existingSubmissionActivity) {
            const refreshedForActivity =
              await tx.challengeSubmission.findUnique({
                where: { id: input.id },
                select: submissionApprovalActivitySelect,
              });

            if (!refreshedForActivity) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Zgłoszenie nie zostało znalezione",
              });
            }

            const totalPoints =
              (refreshedForActivity.awardedPoints ?? 0) +
              (refreshedForActivity.bonusPoints ?? 0);

            await tx.activityFeed.create({
              data: {
                tripId: refreshedForActivity.challenge.tripId,
                activityType: "submission",
                title: `Druzyna ${refreshedForActivity.group.name} dodala zdjecie do wyzwania ${refreshedForActivity.challenge.name}`,
                description: "Ty tez mozesz wziac udzial w challengu",
                imageUrl: refreshedForActivity.imageIds[0],
                createdByAdmin: ctx.dbUser.id,
                submissionActivity: {
                  create: {
                    submissionId: refreshedForActivity.id,
                    challengeId: refreshedForActivity.challengeId,
                    groupId: refreshedForActivity.groupId,
                    hasVideo: Boolean(refreshedForActivity.videoId),
                    isWinner: refreshedForActivity.ranking === 1,
                    ranking: refreshedForActivity.ranking,
                    pointsAwarded: totalPoints,
                  },
                },
              },
            });
          }
        }

        if (previousRankingSnapshot) {
          await createRankChangeActivities({
            tx,
            tripId: submission.challenge.tripId,
            previousSnapshot: previousRankingSnapshot,
            createdByAdmin: ctx.dbUser.id,
          });
        }

        return refreshedForResponse;
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

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.challengeSubmission.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
