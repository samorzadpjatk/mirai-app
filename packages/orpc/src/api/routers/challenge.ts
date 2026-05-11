import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  createORPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { type Prisma } from "@mirai-app/db";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import {
  createChallengeStatusActivityById,
  createChallengeStatusActivityFromTransition,
  finalizeVotingChallengesToCompletedWithFeed,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "../../utils/activityFeed";
import {
  ensureRecurringInstancesForTrip,
  precreateRecurringInstancesForTemplate,
  resolveRecurringChallengeIdForTrip,
} from "../../utils/recurringChallenges";

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
  expectedValue: true,
  autoApprove: true,
  createdAt: true,
  updatedAt: true,
} as const;

const challengeSelect: Prisma.ChallengeSelect = {
  ...challengeBaseSelect,
} as const;

const CHALLENGE_IMAGE_SIGNED_URL_SECONDS = 60 * 60 * 24;
const MAX_RECURRING_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_PEER_VOTING_DURATION_HOURS = 24 * 30;

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

// expectedValue holds the QR code value or the required text phrase.
// It is stored directly in the dedicated DB column — no encoding needed.
const toClientChallenge = <
  T extends { description: string | null; expectedValue: string | null },
>(
  challenge: T,
) => ({
  ...challenge,
  // qrCodeValue kept for backwards-compat with existing clients
  qrCodeValue: challenge.expectedValue,
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
  votingDurationHours?: number | null;
  votingStartTime?: Date | null;
  votingEndTime?: Date | null;
}) => {
  if (
    input.scoringCategory === "PEER_VOTING" &&
    input.submissionType !== "IMAGE" &&
    input.submissionType !== "VIDEO"
  ) {
    throw new ORPCError("BAD_REQUEST", { message: "Peer voting is supported only for IMAGE or VIDEO challenges" });
  }

  if (input.scoringCategory !== "PEER_VOTING") return;

  if (!input.endTime) {
    throw new ORPCError("BAD_REQUEST", { message: "Peer voting challenge requires submission end time" });
  }

  const hasDuration =
    input.votingDurationHours != null &&
    Number.isInteger(input.votingDurationHours) &&
    input.votingDurationHours > 0;
  const hasWindow = Boolean(input.votingStartTime) && Boolean(input.votingEndTime);

  if (!hasDuration && !hasWindow) {
    throw new ORPCError("BAD_REQUEST", { message: "Peer voting challenge requires voting duration in hours or days" });
  }

  if (
    input.votingDurationHours != null &&
    (!Number.isInteger(input.votingDurationHours) ||
      input.votingDurationHours < 1 ||
      input.votingDurationHours > MAX_PEER_VOTING_DURATION_HOURS)
  ) {
    throw new ORPCError("BAD_REQUEST", { message: `Voting duration must be between 1 and ${MAX_PEER_VOTING_DURATION_HOURS} hours` });
  }

  if (
    input.votingStartTime &&
    input.votingEndTime &&
    input.votingStartTime >= input.votingEndTime
  ) {
    throw new ORPCError("BAD_REQUEST", { message: "Voting start time must be before voting end time" });
  }
};

const inferPeerVotingDurationHours = (input: {
  votingDurationHours?: number | null;
  votingStartTime?: Date | null;
  votingEndTime?: Date | null;
  fallbackVotingStartTime?: Date | null;
  fallbackVotingEndTime?: Date | null;
}) => {
  if (input.votingDurationHours != null) {
    return input.votingDurationHours;
  }

  const start = input.votingStartTime ?? input.fallbackVotingStartTime;
  const end = input.votingEndTime ?? input.fallbackVotingEndTime;

  if (!start || !end) {
    return null;
  }

  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0) {
    return null;
  }

  return Math.max(1, Math.ceil(durationMs / HOUR_MS));
};

const resolvePeerVotingTemplateWindow = (params: {
  submissionEndTime: Date;
  votingDurationHours: number;
}) => {
  const votingStartTime = new Date(params.submissionEndTime);
  const votingEndTime = new Date(
    votingStartTime.getTime() + params.votingDurationHours * HOUR_MS,
  );

  return {
    votingStartTime,
    votingEndTime,
  };
};

const validateRecurringTimeline = (input: {
  isRecurring?: boolean | null;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  recurringDays?: number | null;
  scoringCategory: "SPEED" | "UNLIMITED" | "JUDGED_STAFF" | "PEER_VOTING";
}) => {
  if (!input.isRecurring) return;

  if (!input.dailyStartTime || !input.dailyEndTime) {
    throw new ORPCError("BAD_REQUEST", { message: "Recurring challenge requires daily start and end time" });
  }

  if (!input.recurringDays || input.recurringDays < 1) {
    throw new ORPCError("BAD_REQUEST", { message: "Recurring challenge requires number of days" });
  }

  if (input.scoringCategory === "PEER_VOTING") {
    throw new ORPCError("BAD_REQUEST", { message: "Recurring peer voting challenges are not supported" });
  }
};

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const inferRecurringDaysFromWindow = (
  startTime?: Date | null,
  endTime?: Date | null,
) => {
  if (!startTime || !endTime) return null;
  const start = startOfDay(startTime);
  const end = startOfDay(endTime);
  if (end.getTime() < start.getTime()) return null;
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
};

const resolveRecurringDays = (params: {
  isRecurring?: boolean | null;
  recurringDays?: number | null;
  fallbackDays?: number | null;
}) => {
  if (!params.isRecurring) return null;
  const value = params.recurringDays ?? params.fallbackDays;
  if (!value || value < 1) {
    throw new ORPCError("BAD_REQUEST", { message: "Recurring challenge requires number of days" });
  }
  if (!Number.isInteger(value) || value > MAX_RECURRING_DAYS) {
    throw new ORPCError("BAD_REQUEST", { message: `Recurring days must be an integer between 1 and ${MAX_RECURRING_DAYS}` });
  }
  return value;
};

const resolveRecurringTemplateWindow = (params: {
  anchorDate: Date;
  recurringDays: number;
}) => {
  const anchorDay = startOfDay(params.anchorDate);
  const endDay = addDays(anchorDay, params.recurringDays - 1);
  return {
    startTime: anchorDay,
    endTime: endOfDay(endDay),
  };
};

const resolveChallengeImage = async (
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{
          data: { signedUrl?: string | null } | null;
          error: unknown;
        }>;
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
        ) => Promise<{
          data: { signedUrl?: string | null } | null;
          error: unknown;
        }>;
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
  const now = new Date();

  await db.challenge.updateMany({
    where: {
      status: "VISIBLE",
      scoringCategory: { notIn: ["PEER_VOTING", "JUDGED_STAFF"] },
      endTime: { lte: now },
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

  await promoteActivePeerVotingChallengesToVotingPhaseWithFeed({
    tx: db,
    where,
    createdByAdmin: null,
  });

  await db.challenge.updateMany({
    where: {
      status: "ACTIVE",
      scoringCategory: { notIn: ["PEER_VOTING", "JUDGED_STAFF"] },
      endTime: { lte: now },
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

export const challengeRouter = createORPCRouter({
  // Admin-only endpoint to fetch all challenges across trips
  getAll: adminProcedure.handler(async ({ context }) => {
    await activateVisibleChallenges(context.db);

    const challenges = await context.db.challenge.findMany({
      where: { isRecurring: false },
      select: challengeSelect,
      orderBy: { createdAt: "desc" },
    });

    const resolved = await resolveChallengeImages(context.supabase, challenges);
    return resolved.map((challenge) => toClientChallenge(challenge));
  }),
  getAllByTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureRecurringInstancesForTrip({
        tx: context.db,
        tripId: input.tripId,
      });
      await activateVisibleChallenges(context.db, { tripId: input.tripId });

      const limit = input.pagination?.limit ?? 30;
      const offset = input.pagination?.offset ?? 0;
      const where = {
        tripId: input.tripId,
        isRecurring: false,
      } as const;

      const [challenges, total] = await Promise.all([
        context.db.challenge.findMany({
          where,
          select: challengeSelect,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        context.db.challenge.count({ where }),
      ]);

      if (challenges.length === 0) {
        return {
          challenges: [],
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        };
      }

      const challengeIds = challenges.map((challenge) => challenge.id);
      const participant = await context.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: context.dbUser.id,
            tripId: input.tripId,
          },
        },
        select: {
          groupId: true,
        },
      });

      const groupedSubmissionCounts = await context.db.challengeSubmission.groupBy({
        by: ["challengeId"],
        where: {
          challengeId: { in: challengeIds },
        },
        _count: {
          _all: true,
        },
      });
      const groupedPendingSubmissionCounts =
        await context.db.challengeSubmission.groupBy({
          by: ["challengeId"],
          where: {
            challengeId: { in: challengeIds },
            status: "PENDING",
          },
          _count: {
            _all: true,
          },
        });

      const myGroupSubmissions = participant?.groupId
        ? await context.db.challengeSubmission.findMany({
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
        groupedSubmissionCounts.map((item) => [
          item.challengeId,
          item._count._all,
        ]),
      );
      const pendingCountByChallengeId = new Map(
        groupedPendingSubmissionCounts.map((item) => [
          item.challengeId,
          item._count._all,
        ]),
      );
      const mySubmissionStatusByChallengeId = new Map(
        myGroupSubmissions.map((item) => [item.challengeId, item.status]),
      );

      const withResolvedImages = await resolveChallengeImages(
        context.supabase,
        challenges,
      );

      return {
        challenges: withResolvedImages.map((challenge) => ({
          ...toClientChallenge(challenge),
          participantGroupsCount: countByChallengeId.get(challenge.id) ?? 0,
          pendingSubmissionsCount:
            pendingCountByChallengeId.get(challenge.id) ?? 0,
          myGroupSubmissionStatus:
            mySubmissionStatusByChallengeId.get(challenge.id) ?? null,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      await ensureRecurringInstancesForTrip({
        tx: context.db,
        tripId: input.tripId,
      });

      const isAdminOrModerator =
        context.dbUser.role === "ADMIN" || context.dbUser.role === "MODERATOR";
      const resolvedChallengeId = isAdminOrModerator
        ? input.id
        : ((await resolveRecurringChallengeIdForTrip({
            tx: context.db,
            challengeId: input.id,
            tripId: input.tripId,
          })) ?? input.id);

      await activateVisibleChallenges(context.db, {
        id: resolvedChallengeId,
        tripId: input.tripId,
      });

      const challenge = await context.db.challenge.findFirst({
        where: { id: resolvedChallengeId, tripId: input.tripId },
        select: {
          ...challengeBaseSelect,
        },
      });

      if (!challenge) {
        throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
      }

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(context.supabase, challenge.image),
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        qrCodeValue: z.string().trim().min(1).optional(),
        textExpectedPhrase: z.string().trim().min(1).optional(),
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
        recurringDays: z.number().int().min(1).max(MAX_RECURRING_DAYS).optional(),
        dailyStartTime: z.string().optional(),
        dailyEndTime: z.string().optional(),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        status: z.enum(["HIDDEN", "VISIBLE"]).optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        votingDurationHours: z
          .number()
          .int()
          .min(1)
          .max(MAX_PEER_VOTING_DURATION_HOURS)
          .optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const now = new Date();
      const recurringDays = resolveRecurringDays({
        isRecurring: input.isRecurring,
        recurringDays: input.recurringDays,
      });
      const recurringWindow =
        input.isRecurring && recurringDays
          ? resolveRecurringTemplateWindow({
              anchorDate: input.startTime ?? now,
              recurringDays,
            })
          : null;

      const peerVotingDurationHours = inferPeerVotingDurationHours({
        votingDurationHours: input.votingDurationHours,
        votingStartTime: input.votingStartTime,
        votingEndTime: input.votingEndTime,
      });

      validatePeerVotingTimeline({
        submissionType: input.submissionType,
        scoringCategory: input.scoringCategory,
        endTime: recurringWindow?.endTime ?? input.endTime,
        votingDurationHours: peerVotingDurationHours,
        votingStartTime: input.votingStartTime,
        votingEndTime: input.votingEndTime,
      });

      const peerVotingTemplateWindow =
        input.scoringCategory === "PEER_VOTING" &&
        (recurringWindow?.endTime ?? input.endTime) &&
        peerVotingDurationHours
          ? resolvePeerVotingTemplateWindow({
              submissionEndTime: recurringWindow?.endTime ?? input.endTime!,
              votingDurationHours: peerVotingDurationHours,
            })
          : null;
      validateRecurringTimeline({
        isRecurring: input.isRecurring,
        dailyStartTime: input.dailyStartTime,
        dailyEndTime: input.dailyEndTime,
        recurringDays,
        scoringCategory: input.scoringCategory,
      });

      if (
        input.submissionType === "IMAGE_LOCATION" &&
        input.autoApprove
      ) {
        throw new ORPCError("BAD_REQUEST", { message: "Image + Location challenges cannot use auto-approve" });
      }

      if (
        input.submissionType === "TEXT" &&
        input.autoApprove &&
        !input.textExpectedPhrase?.trim()
      ) {
        throw new ORPCError("BAD_REQUEST", { message: "Text auto-approve requires an expected phrase, or disable auto-approve" });
      }

      const requestedStatus = input.status ?? "HIDDEN";
      const shouldActivateImmediately =
        !input.isRecurring &&
        requestedStatus === "VISIBLE" &&
        Boolean(input.startTime) &&
        input.startTime! <= now &&
        (!input.endTime || input.endTime > now);
      const initialStatus = shouldActivateImmediately
        ? "ACTIVE"
        : requestedStatus;

      const challenge = await context.db.$transaction(async (tx) => {
        const createdChallenge = await tx.challenge.create({
          data: {
            tripId: input.tripId,
            name: input.name,
            description: input.description ?? null,
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
            startTime: recurringWindow?.startTime ?? input.startTime,
            endTime: recurringWindow?.endTime ?? input.endTime,
            votingStartTime:
              input.scoringCategory === "PEER_VOTING"
                ? (peerVotingTemplateWindow?.votingStartTime ?? null)
                : null,
            votingEndTime:
              input.scoringCategory === "PEER_VOTING"
                ? (peerVotingTemplateWindow?.votingEndTime ?? null)
                : null,
            targetLatitude: input.targetLatitude,
            targetLongitude: input.targetLongitude,
            expectedValue:
              input.submissionType === "QR_CODE"
                ? (input.qrCodeValue ?? null)
                : input.submissionType === "TEXT"
                  ? (input.textExpectedPhrase ?? null)
                  : null,
            autoApprove:
              input.submissionType === "QR_CODE" ||
              input.submissionType === "LOCATION"
                ? true
                : input.submissionType === "IMAGE_LOCATION"
                  ? false
                  : input.autoApprove,
          },
          select: challengeSelect,
        });

        if (createdChallenge.isRecurring) {
          await precreateRecurringInstancesForTemplate({
            tx,
            template: createdChallenge,
          });
        }

        if (createdChallenge.status === "ACTIVE") {
          await createChallengeStatusActivityById({
            tx,
            challengeId: createdChallenge.id,
            eventType: "challenge_started",
            createdByAdmin: context.dbUser.id,
          });
        }

        return createdChallenge;
      });

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(context.supabase, challenge.image),
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
        textExpectedPhrase: z.string().trim().min(1).optional(),
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
        recurringDays: z.number().int().min(1).max(MAX_RECURRING_DAYS).optional(),
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
        votingDurationHours: z
          .number()
          .int()
          .min(1)
          .max(MAX_PEER_VOTING_DURATION_HOURS)
          .optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const existing = await context.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: {
          id: true,
          status: true,
          description: true,
          submissionType: true,
          autoApprove: true,
          isRecurring: true,
          dailyStartTime: true,
          dailyEndTime: true,
          scoringCategory: true,
          expectedValue: true,
          startTime: true,
          endTime: true,
          votingStartTime: true,
          votingEndTime: true,
        },
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
      }

      const peerVotingDurationHours = inferPeerVotingDurationHours({
        votingDurationHours: input.votingDurationHours,
        votingStartTime: input.votingStartTime,
        votingEndTime: input.votingEndTime,
        fallbackVotingStartTime: existing.votingStartTime,
        fallbackVotingEndTime: existing.votingEndTime,
      });

      validatePeerVotingTimeline({
        submissionType: input.submissionType ?? existing.submissionType,
        scoringCategory: input.scoringCategory ?? existing.scoringCategory,
        endTime: input.endTime ?? existing.endTime,
        votingDurationHours: peerVotingDurationHours,
        votingStartTime: input.votingStartTime ?? existing.votingStartTime,
        votingEndTime: input.votingEndTime ?? existing.votingEndTime,
      });
      const nextIsRecurring = input.isRecurring ?? existing.isRecurring;
      const inferredRecurringDays = inferRecurringDaysFromWindow(
        existing.startTime,
        existing.endTime,
      );
      const recurringDays = resolveRecurringDays({
        isRecurring: nextIsRecurring,
        recurringDays: input.recurringDays,
        fallbackDays: inferredRecurringDays,
      });
      validateRecurringTimeline({
        isRecurring: nextIsRecurring,
        dailyStartTime: input.dailyStartTime ?? existing.dailyStartTime,
        dailyEndTime: input.dailyEndTime ?? existing.dailyEndTime,
        recurringDays,
        scoringCategory: input.scoringCategory ?? existing.scoringCategory,
      });
      const recurringWindow =
        nextIsRecurring && recurringDays
          ? resolveRecurringTemplateWindow({
              anchorDate: input.startTime ?? existing.startTime ?? new Date(),
              recurringDays,
            })
          : null;

      const nextScoringCategory =
        input.scoringCategory ?? existing.scoringCategory;
      const nextStatus = input.status ?? existing.status;

      const peerVotingTemplateWindow =
        nextScoringCategory === "PEER_VOTING" &&
        (recurringWindow?.endTime ?? input.endTime ?? existing.endTime) &&
        peerVotingDurationHours
          ? resolvePeerVotingTemplateWindow({
              submissionEndTime:
                recurringWindow?.endTime ?? input.endTime ?? existing.endTime!,
              votingDurationHours: peerVotingDurationHours,
            })
          : null;

      const isTransitioningToVotingPhase =
        existing.status !== "VOTING_PHASE" && nextStatus === "VOTING_PHASE";

      if (
        nextScoringCategory === "PEER_VOTING" &&
        isTransitioningToVotingPhase
      ) {
        const [totalSubmissions, pendingSubmissions] = await Promise.all([
          context.db.challengeSubmission.count({
            where: { challengeId: existing.id },
          }),
          context.db.challengeSubmission.count({
            where: {
              challengeId: existing.id,
              status: "PENDING",
            },
          }),
        ]);

        if (totalSubmissions === 0 || pendingSubmissions > 0) {
          throw new ORPCError("BAD_REQUEST", { message: "Peer voting can start only after staff reviews all submitted photos" });
        }
      }

      const effectiveSubmissionType =
        input.submissionType ?? existing.submissionType;
      const effectiveExpectedValue =
        effectiveSubmissionType === "QR_CODE"
          ? input.qrCodeValue ?? existing.expectedValue ?? null
          : effectiveSubmissionType === "TEXT"
            ? input.textExpectedPhrase ?? existing.expectedValue ?? null
            : null;
      const effectiveAutoApprove =
        effectiveSubmissionType === "QR_CODE" ||
        effectiveSubmissionType === "LOCATION"
          ? true
          : effectiveSubmissionType === "IMAGE_LOCATION"
            ? false
          : input.autoApprove ?? existing.autoApprove;

      if (effectiveSubmissionType === "IMAGE_LOCATION" && input.autoApprove) {
        throw new ORPCError("BAD_REQUEST", { message: "Image + Location challenges cannot use auto-approve" });
      }

      if (
        effectiveSubmissionType === "TEXT" &&
        effectiveAutoApprove &&
        !effectiveExpectedValue?.trim()
      ) {
        throw new ORPCError("BAD_REQUEST", { message: "Text auto-approve requires an expected phrase, or disable auto-approve" });
      }

      const challenge = await context.db.$transaction(async (tx) => {
        const updatedChallenge = await tx.challenge.update({
          where: { id: input.id },
          data: {
            name: input.name,
            description:
              input.description !== undefined
                ? (input.description ?? null)
                : undefined,
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
            startTime: recurringWindow?.startTime ?? input.startTime,
            endTime: recurringWindow?.endTime ?? input.endTime,
            votingStartTime:
              nextScoringCategory !== "PEER_VOTING"
                ? null
                : nextStatus === "VOTING_PHASE" || nextStatus === "COMPLETED"
                  ? input.votingStartTime
                  : peerVotingTemplateWindow?.votingStartTime,
            votingEndTime:
              nextScoringCategory !== "PEER_VOTING"
                ? null
                : nextStatus === "VOTING_PHASE" || nextStatus === "COMPLETED"
                  ? input.votingEndTime
                  : peerVotingTemplateWindow?.votingEndTime,
            targetLatitude: input.targetLatitude,
            targetLongitude: input.targetLongitude,
            expectedValue: effectiveExpectedValue,
            autoApprove:
              effectiveSubmissionType === "QR_CODE" ||
              effectiveSubmissionType === "LOCATION"
                ? true
                : effectiveSubmissionType === "IMAGE_LOCATION"
                  ? false
                  : input.autoApprove,
          },
          select: challengeSelect,
        });

        if (updatedChallenge.isRecurring) {
          await precreateRecurringInstancesForTemplate({
            tx,
            template: updatedChallenge,
          });
        }

        await createChallengeStatusActivityFromTransition({
          tx,
          challengeId: updatedChallenge.id,
          previousStatus: existing.status,
          nextStatus: updatedChallenge.status,
          createdByAdmin: context.dbUser.id,
        });

        return updatedChallenge;
      });

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(context.supabase, challenge.image),
      };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const existing = await context.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: { id: true },
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
      }

      await context.db.challenge.delete({ where: { id: input.id } });

      return { success: true };
    }),

  forceCloseVoting: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const existing = await context.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: {
          id: true,
          status: true,
          scoringCategory: true,
        },
      });

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Challenge not found" });
      }

      if (existing.scoringCategory !== "PEER_VOTING") {
        throw new ORPCError("BAD_REQUEST", { message: "Force close voting is only available for peer voting challenges" });
      }

      if (existing.status !== "VOTING_PHASE") {
        throw new ORPCError("BAD_REQUEST", { message: "Challenge is not in voting phase" });
      }

      const challenge = await context.db.$transaction(async (tx) => {
        const updatedChallenge = await tx.challenge.update({
          where: { id: input.id },
          data: {
            status: "COMPLETED",
            votingEndTime: new Date(),
          },
          select: challengeSelect,
        });

        await createChallengeStatusActivityFromTransition({
          tx,
          challengeId: updatedChallenge.id,
          previousStatus: existing.status,
          nextStatus: updatedChallenge.status,
          createdByAdmin: context.dbUser.id,
        });

        return updatedChallenge;
      });

      return {
        ...toClientChallenge(challenge),
        image: await resolveChallengeImage(context.supabase, challenge.image),
      };
    }),
});
