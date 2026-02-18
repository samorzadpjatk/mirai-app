import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import {
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
  finalizeVotingChallengesToCompletedWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../utils/activityFeed";

const challengeBaseSelect: Prisma.ChallengeSelect = {
  id: true,
  tripId: true,
  name: true,
  description: true,
  image: true,
  submissionType: true,
  scoringCategory: true,
  isRecurring: true,
  dailyStartTime: true,
  dailyEndTime: true,
  basePoints: true,
  firstPlacePoints: true,
  secondPlacePoints: true,
  thirdPlacePoints: true,
  status: true,
  startTime: true,
  endTime: true,
  votingStartTime: true,
  votingEndTime: true,
  targetLatitude: true,
  targetLongitude: true,
  autoApprove: true,
  createdAt: true,
  updatedAt: true,
} as const;

const challengeSelect: Prisma.ChallengeSelect = {
  ...challengeBaseSelect,
} as const;

const CHALLENGE_IMAGE_SIGNED_URL_SECONDS = 60 * 60 * 24;
const QR_MARKER_REGEX = /\[\[QR_EXPECTED_B64:([A-Za-z0-9+/=]+)\]\]/;

const challengeImageSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (normalizeSupabaseStoragePath(value)) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Image must be a valid URL or storage path")
  .optional();

const normalizeChallengeImageInput = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};

const extractQrCodeValueFromDescription = (
  description: string | null | undefined,
): string | undefined => {
  if (!description) return undefined;
  const encoded = description.match(QR_MARKER_REGEX)?.[1];
  if (!encoded) return undefined;

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8").trim();
    return decoded.length > 0 ? decoded : undefined;
  } catch {
    return undefined;
  }
};

const stripQrMarkerFromDescription = (
  description: string | null | undefined,
): string | null => {
  if (!description) return null;
  const cleaned = description.replace(QR_MARKER_REGEX, "").trim();
  return cleaned.length > 0 ? cleaned : null;
};

const buildStoredDescription = (params: {
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  description?: string;
  qrCodeValue?: string;
}) => {
  const cleanDescription = stripQrMarkerFromDescription(params.description) ?? "";
  if (params.submissionType !== "QR_CODE") {
    return cleanDescription.length > 0 ? cleanDescription : null;
  }

  const qr = params.qrCodeValue?.trim();
  if (!qr) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "QR code value is required for QR_CODE challenges",
    });
  }
  const marker = `[[QR_EXPECTED_B64:${Buffer.from(qr, "utf8").toString("base64")}]]`;
  return cleanDescription.length > 0 ? `${cleanDescription}\n\n${marker}` : marker;
};

const toClientChallenge = <T extends { description: string | null }>(
  challenge: T,
) => ({
  ...challenge,
  description: stripQrMarkerFromDescription(challenge.description),
  qrCodeValue: extractQrCodeValueFromDescription(challenge.description) ?? null,
});

const validatePeerVotingTimeline = (input: {
  submissionType:
    | "IMAGE"
    | "MULTI_IMAGE"
    | "VIDEO"
    | "TEXT"
    | "IMAGE_LOCATION"
    | "LOCATION"
    | "QR_CODE";
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
  endTime?: Date | null;
  votingStartTime?: Date | null;
  votingEndTime?: Date | null;
}) => {
  if (
    input.scoringCategory === "PEER_VOTING" &&
    input.submissionType !== "IMAGE" &&
    input.submissionType !== "VIDEO"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Peer voting is supported only for IMAGE or VIDEO challenges",
    });
  }

  if (input.scoringCategory !== "PEER_VOTING") return;

  if (!input.endTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Peer voting challenge requires submission end time",
    });
  }

  if (!input.votingStartTime || !input.votingEndTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Peer voting challenge requires voting start and end time",
    });
  }

  if (input.votingStartTime >= input.votingEndTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voting start time must be before voting end time",
    });
  }

  if (input.votingStartTime <= input.endTime) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voting must start after submission end time",
    });
  }
};

const resolveChallengeImage = async (
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  },
  image: string | null | undefined,
) => {
  if (!image) return null;

  const parsed = normalizeSupabaseStoragePath(image);
  if (!parsed) {
    return image;
  }

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, CHALLENGE_IMAGE_SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

const resolveChallengeImages = async <T extends { image: string | null }>(
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  },
  challenges: T[],
) =>
  Promise.all(
    challenges.map(async (challenge) => ({
      ...challenge,
      image: await resolveChallengeImage(supabase, challenge.image),
    })),
  );

const activateVisibleChallenges = async (
  db: Prisma.TransactionClient,
  where?: Prisma.ChallengeWhereInput,
) => {
  await db.challenge.updateMany({
    where: {
      status: "VISIBLE",
      endTime: { lte: new Date() },
      ...where,
    },
    data: {
      status: "COMPLETED",
    },
  });

  await promoteVisibleChallengesToActiveWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });

  await db.challenge.updateMany({
    where: {
      status: "ACTIVE",
      endTime: { lte: new Date() },
      ...where,
    },
    data: {
      status: "COMPLETED",
    },
  });

  await finalizeVotingChallengesToCompletedWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });
};

export const challengeRouter = createTRPCRouter({
  // Admin-only endpoint to fetch all challenges across trips
  getAll: adminProcedure.query(async ({ ctx }) => {
    await activateVisibleChallenges(ctx.db);

    const challenges = await ctx.db.challenge.findMany({
      select: challengeSelect,
      orderBy: { createdAt: "desc" },
    });

    const resolved = await resolveChallengeImages(ctx.supabase, challenges);
    return resolved.map((challenge) => toClientChallenge(challenge));
  }),
  getAllByTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      await activateVisibleChallenges(ctx.db, { tripId: input.tripId });

      const challenges = await ctx.db.challenge.findMany({
        where: { tripId: input.tripId },
        select: challengeSelect,
        orderBy: { createdAt: "desc" },
      });
      if (challenges.length === 0) {
        return [];
      }

      const challengeIds = challenges.map((challenge) => challenge.id);
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
        select: {
          groupId: true,
        },
      });

      const groupedSubmissionCounts = await ctx.db.challengeSubmission.groupBy({
        by: ["challengeId"],
        where: {
          challengeId: { in: challengeIds },
        },
        _count: {
          _all: true,
        },
      });

      const myGroupSubmissions = participant?.groupId
        ? await ctx.db.challengeSubmission.findMany({
            where: {
              challengeId: { in: challengeIds },
              groupId: participant.groupId,
            },
            select: {
              challengeId: true,
              status: true,
            },
          })
        : [];

      const countByChallengeId = new Map(
        groupedSubmissionCounts.map((item) => [item.challengeId, item._count._all]),
      );
      const mySubmissionStatusByChallengeId = new Map(
        myGroupSubmissions.map((item) => [item.challengeId, item.status]),
      );

      const withResolvedImages = await resolveChallengeImages(ctx.supabase, challenges);

      return withResolvedImages.map((challenge) => ({
        ...toClientChallenge(challenge),
        participantGroupsCount: countByChallengeId.get(challenge.id) ?? 0,
        myGroupSubmissionStatus:
          mySubmissionStatusByChallengeId.get(challenge.id) ?? null,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      await activateVisibleChallenges(ctx.db, {
        id: input.id,
        tripId: input.tripId,
      });

      const challenge = await ctx.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: {
          ...challengeBaseSelect,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(ctx.supabase, challenge.image),
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        qrCodeValue: z.string().trim().min(1).optional(),
        image: challengeImageSchema,
        submissionType: z.enum([
          "IMAGE",
          "VIDEO",
          "TEXT",
          "IMAGE_LOCATION",
          "LOCATION",
          "QR_CODE",
        ]),
        scoringCategory: z.enum([
          "SPEED",
          "UNLIMITED",
          "JUDGED_STAFF",
          "PEER_VOTING",
        ]),
        isRecurring: z.boolean().optional(),
        dailyStartTime: z.string().optional(),
        dailyEndTime: z.string().optional(),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        status: z.enum(["HIDDEN", "VISIBLE"]).optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      validatePeerVotingTimeline({
        submissionType: input.submissionType,
        scoringCategory: input.scoringCategory,
        endTime: input.endTime,
        votingStartTime: input.votingStartTime,
        votingEndTime: input.votingEndTime,
      });
      const now = new Date();
      const requestedStatus = input.status ?? "HIDDEN";
      const shouldActivateImmediately =
        requestedStatus === "VISIBLE" &&
        Boolean(input.startTime) &&
        (input.startTime as Date) <= now &&
        (!input.endTime || input.endTime > now);
      const initialStatus = shouldActivateImmediately ? "ACTIVE" : requestedStatus;

      const challenge = await ctx.db.challenge.create({
        data: {
          tripId: input.tripId,
          name: input.name,
          description: buildStoredDescription({
            submissionType: input.submissionType,
            description: input.description,
            qrCodeValue: input.qrCodeValue,
          }),
          image: normalizeChallengeImageInput(input.image),
          submissionType: input.submissionType,
          scoringCategory: input.scoringCategory,
          isRecurring: input.isRecurring,
          dailyStartTime: input.dailyStartTime,
          dailyEndTime: input.dailyEndTime,
          basePoints: input.basePoints,
          firstPlacePoints: input.firstPlacePoints,
          secondPlacePoints: input.secondPlacePoints,
          thirdPlacePoints: input.thirdPlacePoints,
          status: initialStatus,
          startTime: input.startTime,
          endTime: input.endTime,
          votingStartTime: input.votingStartTime,
          votingEndTime: input.votingEndTime,
          targetLatitude: input.targetLatitude,
          targetLongitude: input.targetLongitude,
          autoApprove:
            input.submissionType === "QR_CODE" || input.submissionType === "LOCATION"
              ? true
              : input.autoApprove,
        },
        select: challengeSelect,
      });

      if (challenge.status === "ACTIVE") {
        await createChallengeStatusActivityById({
          tx: ctx.db,
          challengeId: challenge.id,
          eventType: "challenge_started",
          createdByAdmin: ctx.dbUser.id,
        });
      }

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(ctx.supabase, challenge.image),
      };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        qrCodeValue: z.string().trim().min(1).optional(),
        image: challengeImageSchema,
        submissionType: z
          .enum([
            "IMAGE",
            "VIDEO",
            "TEXT",
            "IMAGE_LOCATION",
            "LOCATION",
            "QR_CODE",
          ])
          .optional(),
        scoringCategory: z
          .enum(["SPEED", "UNLIMITED", "JUDGED_STAFF", "PEER_VOTING"])
          .optional(),
        isRecurring: z.boolean().optional(),
        dailyStartTime: z.string().optional(),
        dailyEndTime: z.string().optional(),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        status: z
          .enum([
            "HIDDEN",
            "VISIBLE",
            "ACTIVE",
            "VOTING_PHASE",
            "COMPLETED",
            "CANCELLED",
          ])
          .optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: {
          id: true,
          status: true,
          description: true,
          submissionType: true,
          scoringCategory: true,
          endTime: true,
          votingStartTime: true,
          votingEndTime: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      validatePeerVotingTimeline({
        submissionType: input.submissionType ?? existing.submissionType,
        scoringCategory: input.scoringCategory ?? existing.scoringCategory,
        endTime: input.endTime ?? existing.endTime,
        votingStartTime: input.votingStartTime ?? existing.votingStartTime,
        votingEndTime: input.votingEndTime ?? existing.votingEndTime,
      });

      const challenge = await ctx.db.challenge.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: buildStoredDescription({
            submissionType: input.submissionType ?? existing.submissionType,
            description: input.description ?? existing.description ?? undefined,
            qrCodeValue:
              input.qrCodeValue ??
              extractQrCodeValueFromDescription(existing.description) ??
              undefined,
          }),
          image: normalizeChallengeImageInput(input.image),
          submissionType: input.submissionType,
          scoringCategory: input.scoringCategory,
          isRecurring: input.isRecurring,
          dailyStartTime: input.dailyStartTime,
          dailyEndTime: input.dailyEndTime,
          basePoints: input.basePoints,
          firstPlacePoints: input.firstPlacePoints,
          secondPlacePoints: input.secondPlacePoints,
          thirdPlacePoints: input.thirdPlacePoints,
          status: input.status,
          startTime: input.startTime,
          endTime: input.endTime,
          votingStartTime: input.votingStartTime,
          votingEndTime: input.votingEndTime,
          targetLatitude: input.targetLatitude,
          targetLongitude: input.targetLongitude,
          autoApprove:
            (input.submissionType ?? existing.submissionType) === "QR_CODE" ||
            (input.submissionType ?? existing.submissionType) === "LOCATION"
              ? true
              : input.autoApprove,
        },
        select: challengeSelect,
      });

      await createChallengeStatusActivityFromTransition({
        tx: ctx.db,
        challengeId: challenge.id,
        previousStatus: existing.status,
        nextStatus: challenge.status,
        createdByAdmin: ctx.dbUser.id,
      });

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(ctx.supabase, challenge.image),
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      await ctx.db.challenge.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
