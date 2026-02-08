import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";
import { parseSupabaseStorageObject } from "../../utils/storage";

const submissionBaseSelect: Prisma.ChallengeSubmissionSelect = {
  id: true,
  challengeId: true,
  groupId: true,
  imageUrls: true,
  videoUrl: true,
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
      email: true,
    },
  },
} as const;

const CHALLENGE_SUBMISSION_BUCKET =
  process.env.SUPABASE_STORAGE_CHALLENGE_SUBMISSIONS_BUCKET ??
  "challenge-submissions";

const sanitizeFileName = (value: string): string => {
  const baseName = value.split(/[\\/]/).pop() ?? "upload";
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return sanitized.length > 0 ? sanitized : "upload";
};

const isAssetTypeAllowed = (submissionType: string, assetType: "IMAGE" | "VIDEO") => {
  if (assetType === "VIDEO") {
    return submissionType === "VIDEO";
  }

  return ["IMAGE", "MULTI_IMAGE", "IMAGE_LOCATION", "QR_CODE"].includes(
    submissionType,
  );
};

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

const ensureChallengeInTrip = async (
  ctx: { db: Prisma.TransactionClient },
  challengeId: string,
  tripId: string,
) => {
  const challenge = await ctx.db.challenge.findFirst({
    where: { id: challengeId, tripId },
    select: { id: true, submissionType: true, autoApprove: true },
  });
  if (!challenge) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Challenge not found" });
  }
  return challenge;
};

const validateSubmissionPayload = (input: {
  submissionType: string;
  imageUrls?: string[];
  videoUrl?: string | null;
  textContent?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}) => {
  const imageCount = input.imageUrls?.length ?? 0;
  const hasText = Boolean(input.textContent && input.textContent.trim().length > 0);
  const hasVideo = Boolean(input.videoUrl && input.videoUrl.trim().length > 0);
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

export const challengeSubmissionRouter = createTRPCRouter({
  getByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      await ensureTripParticipant(ctx, input.tripId);
      await ensureChallengeInTrip(ctx, input.challengeId, input.tripId);

      return ctx.db.challengeSubmission.findMany({
        where: { challengeId: input.challengeId },
        select: submissionSelect,
        orderBy: [{ voteScore: "desc" }, { createdAt: "asc" }],
      });
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      return submission;
    }),

  getMyForChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);
      if (!participant.groupId) return null;

      return ctx.db.challengeSubmission.findUnique({
        where: {
          challengeId_groupId: {
            challengeId: input.challengeId,
            groupId: participant.groupId,
          },
        },
        select: submissionSelect,
      });
    }),

  getAssetDownloadUrl: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        assetType: z.enum(["IMAGE", "VIDEO"]),
        imageIndex: z.number().int().nonnegative().optional(),
        expiresInSeconds: z.number().int().min(60).max(60 * 60).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureTripParticipant(ctx, input.tripId);

      const submission = await ctx.db.challengeSubmission.findFirst({
        where: { id: input.submissionId, challenge: { tripId: input.tripId } },
        select: { imageUrls: true, videoUrl: true },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      let sourceUrl: string | null = null;

      if (input.assetType === "IMAGE") {
        const index = input.imageIndex ?? -1;
        if (index < 0 || index >= submission.imageUrls.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid image index",
          });
        }
        sourceUrl = submission.imageUrls[index] ?? null;
      } else {
        sourceUrl = submission.videoUrl ?? null;
      }

      if (!sourceUrl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      }

      const objectInfo = parseSupabaseStorageObject(sourceUrl);
      if (!objectInfo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unsupported storage URL",
        });
      }

      const expiresIn = input.expiresInSeconds ?? 10 * 60;
      const { data, error } = await ctx.supabase.storage
        .from(objectInfo.bucket)
        .createSignedUrl(objectInfo.path, expiresIn);

      if (error || !data?.signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create signed URL",
        });
      }

      return {
        signedUrl: data.signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    }),

  createAssetUploadUrl: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        assetType: z.enum(["IMAGE", "VIDEO"]),
        fileName: z.string().min(1),
        contentType: z.string().min(1),
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

      const challenge = await ensureChallengeInTrip(
        ctx,
        input.challengeId,
        input.tripId,
      );

      if (!isAssetTypeAllowed(challenge.submissionType, input.assetType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ten typ pliku nie jest dozwolony dla tego zadania",
        });
      }

      const safeFileName = sanitizeFileName(input.fileName);
      const objectPath = `challenges/${input.challengeId}/${participant.groupId}/${Date.now()}-${safeFileName}`;
      const bucket = CHALLENGE_SUBMISSION_BUCKET;

      const { data, error } = await ctx.supabase.storage
        .from(bucket)
        .createSignedUploadUrl(objectPath);

      if (error || !data?.signedUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create signed upload URL",
        });
      }

      return {
        uploadUrl: data.signedUrl,
        bucket,
        objectPath,
        storagePath: `${bucket}/${objectPath}`,
        contentType: input.contentType,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        imageUrls: z.array(z.string().url()).optional(),
        videoUrl: z.string().url().optional(),
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
          message: "Zgloszenie dla tej grupy juz istnieje",
        });
      }

      validateSubmissionPayload({
        submissionType: challenge.submissionType,
        imageUrls: input.imageUrls,
        videoUrl: input.videoUrl,
        textContent: input.textContent,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      const autoApproved = challenge.autoApprove;
      const now = new Date();

      return ctx.db.challengeSubmission.create({
        data: {
          challengeId: input.challengeId,
          groupId: participant.groupId,
          imageUrls: input.imageUrls ?? [],
          videoUrl: input.videoUrl,
          textContent: input.textContent,
          latitude: input.latitude,
          longitude: input.longitude,
          status: autoApproved ? "APPROVED" : "PENDING",
          reviewedAt: autoApproved ? now : undefined,
        },
        select: submissionSelect,
      });
    }),

  updateMine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        imageUrls: z.array(z.string().url()).optional(),
        videoUrl: z.string().url().optional(),
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
          imageUrls: true,
          videoUrl: true,
          textContent: true,
          latitude: true,
          longitude: true,
          challenge: { select: { submissionType: true, autoApprove: true } },
        },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      if (submission.status === "APPROVED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie mozna edytowac zatwierdzonego zgloszenia",
        });
      }

      const nextImageUrls = input.imageUrls ?? submission.imageUrls;
      const nextVideoUrl = input.videoUrl ?? submission.videoUrl;
      const nextTextContent = input.textContent ?? submission.textContent;
      const nextLatitude = input.latitude ?? submission.latitude;
      const nextLongitude = input.longitude ?? submission.longitude;

      validateSubmissionPayload({
        submissionType: submission.challenge.submissionType,
        imageUrls: nextImageUrls,
        videoUrl: nextVideoUrl,
        textContent: nextTextContent,
        latitude: nextLatitude ?? undefined,
        longitude: nextLongitude ?? undefined,
      });

      const autoApproved = submission.challenge.autoApprove;
      const now = new Date();

      return ctx.db.challengeSubmission.update({
        where: { id: input.id },
        data: {
          imageUrls: input.imageUrls,
          videoUrl: input.videoUrl,
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
    }),

  deleteMine: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
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
        select: { id: true, status: true },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      if (submission.status === "APPROVED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie mozna usunac zatwierdzonego zgloszenia",
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
          message: "Wymagany jest powod odrzucenia",
        });
      }

      const submission = await ctx.db.challengeSubmission.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!submission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      return ctx.db.challengeSubmission.update({
        where: { id: input.id },
        data: {
          status: input.status,
          rejectionReason: input.status === "REJECTED" ? input.rejectionReason : null,
          reviewedById: ctx.dbUser.id,
          reviewedAt: new Date(),
          awardedPoints: input.awardedPoints,
          bonusPoints: input.bonusPoints,
          ranking: input.ranking,
        },
        select: submissionSelect,
      });
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.challengeSubmission.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
