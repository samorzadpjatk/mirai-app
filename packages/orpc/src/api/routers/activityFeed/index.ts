import { ORPCError } from "@orpc/server";
import { z } from "zod";
import {
  adminProcedure,
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../orpc";
import { enrichActivities } from "./enrichment";
import {
  createChallengeActivity,
  createCustom,
  createRankChangeActivity,
  createSubmissionActivity,
  createUserPost,
  deleteActivity,
  hide,
  setPinned,
  toggleReaction,
  unhide,
  update,
} from "./mutations";
import {
  type ActivityContext,
  fetchActivityWithRelationsById,
  getActivitiesCursorPage,
  getActivitiesPage,
} from "./queries";
import { CHALLENGE_EVENT_TYPES, REACTION_TYPES, activityCursorSchema } from "./types";
import {
  ensureTripExists,
  ensureTripParticipant,
  imageReferenceSchema,
  optionalImageReferenceSchema,
  updateUserLastSeenOn,
} from "./utils";

const handleGetByTrip = async ({
  context,
  input,
}: {
  context: ActivityContext;
  input: {
    tripId: string;
    page: number;
    pageSize: number;
    cursor?: { id: string; createdAt: Date; isPinned: boolean };
  };
}) => {
  await ensureTripParticipant(context, input.tripId);

  const activitiesPromise =
    !input.cursor && input.page > 1
      ? getActivitiesPage({
          context,
          tripId: input.tripId,
          page: input.page,
          pageSize: input.pageSize,
          includeHidden: false,
        })
      : getActivitiesCursorPage({
          context,
          tripId: input.tripId,
          pageSize: input.pageSize,
          includeHidden: false,
          cursor: input.cursor ?? null,
        });

  const [activities] = await Promise.all([activitiesPromise, updateUserLastSeenOn(context)]);

  return activities;
};

const handleGetByTripModeration = async ({
  context,
  input,
}: {
  context: ActivityContext;
  input: {
    tripId: string;
    page: number;
    pageSize: number;
  };
}) => {
  await ensureTripExists(context, input.tripId);

  return getActivitiesPage({
    context,
    tripId: input.tripId,
    page: input.page,
    pageSize: input.pageSize,
    includeHidden: true,
  });
};

const handleGetById = async ({
  context,
  input,
}: {
  context: ActivityContext;
  input: { id: string };
}) => {
  const activity = await fetchActivityWithRelationsById(context.db, input.id);

  if (!activity) {
    throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
  }

  const [enriched] = await enrichActivities(context, [activity]);
  return enriched;
};

const handleCreateCustom = async ({
  context,
  input,
}: {
  context: Parameters<typeof createCustom>[0];
  input: Parameters<typeof createCustom>[1];
}) => createCustom(context, input);

const handleCreateUserPost = async ({
  context,
  input,
}: {
  context: Parameters<typeof createUserPost>[0];
  input: Parameters<typeof createUserPost>[1];
}) => createUserPost(context, input);

const handleCreateSubmissionActivity = async ({
  context,
  input,
}: {
  context: Parameters<typeof createSubmissionActivity>[0];
  input: Parameters<typeof createSubmissionActivity>[1];
}) => createSubmissionActivity(context, input);

const handleCreateChallengeActivity = async ({
  context,
  input,
}: {
  context: Parameters<typeof createChallengeActivity>[0];
  input: Parameters<typeof createChallengeActivity>[1];
}) => createChallengeActivity(context, input);

const handleCreateRankChangeActivity = async ({
  context,
  input,
}: {
  context: Parameters<typeof createRankChangeActivity>[0];
  input: Parameters<typeof createRankChangeActivity>[1];
}) => createRankChangeActivity(context, input);

const handleUpdate = async ({
  context,
  input,
}: {
  context: Parameters<typeof update>[0];
  input: Parameters<typeof update>[1];
}) => update(context, input);

const handleSetPinned = async ({
  context,
  input,
}: {
  context: Parameters<typeof setPinned>[0];
  input: Parameters<typeof setPinned>[1];
}) => setPinned(context, input);

const handleHide = async ({
  context,
  input,
}: {
  context: Parameters<typeof hide>[0];
  input: Parameters<typeof hide>[1];
}) => hide(context, input);

const handleUnhide = async ({
  context,
  input,
}: {
  context: Parameters<typeof unhide>[0];
  input: Parameters<typeof unhide>[1];
}) => unhide(context, input);

const handleToggleReaction = async ({
  context,
  input,
}: {
  context: Parameters<typeof toggleReaction>[0];
  input: Parameters<typeof toggleReaction>[1];
}) => toggleReaction(context, input);

const handleDeleteActivity = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteActivity>[0];
  input: Parameters<typeof deleteActivity>[1];
}) => deleteActivity(context, input);

export const activityFeedRouter = createORPCRouter({
  getByTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
        cursor: activityCursorSchema.optional(),
      }),
    )
    .handler(handleGetByTrip),

  getByTripModeration: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .handler(handleGetByTripModeration),

  getById: moderatorProcedure.input(z.object({ id: z.string() })).handler(handleGetById),

  createCustom: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: optionalImageReferenceSchema,
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(handleCreateCustom),

  createUserPost: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: optionalImageReferenceSchema,
        additionalImages: z.array(imageReferenceSchema).max(10).optional(),
      }),
    )
    .handler(handleCreateUserPost),

  createSubmissionActivity: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        challengeId: z.string(),
        groupId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: optionalImageReferenceSchema,
        hasVideo: z.boolean().optional(),
        isWinner: z.boolean().optional(),
        ranking: z.number().int().min(1).optional(),
        pointsAwarded: z.number().int().min(0).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(handleCreateSubmissionActivity),

  createChallengeActivity: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        eventType: z.enum(CHALLENGE_EVENT_TYPES),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        endTime: z.coerce.date().optional(),
        submissionType: z
          .enum(["IMAGE", "MULTI_IMAGE", "VIDEO", "TEXT", "IMAGE_LOCATION", "LOCATION", "QR_CODE"])
          .optional(),
        basePoints: z.number().int().min(0).optional(),
        submissionCount: z.number().int().min(0).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(handleCreateChallengeActivity),

  createRankChangeActivity: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        newRank: z.number().int().min(1),
        totalCoins: z.number().int().min(0),
        coinsGained: z.number().int(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(handleCreateRankChangeActivity),

  update: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(handleUpdate),

  setPinned: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        isPinned: z.boolean(),
      }),
    )
    .handler(handleSetPinned),

  hide: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        reason: z.string().trim().optional(),
      }),
    )
    .handler(handleHide),

  unhide: moderatorProcedure.input(z.object({ activityId: z.string() })).handler(handleUnhide),

  toggleReaction: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        reactionType: z.enum(REACTION_TYPES),
      }),
    )
    .handler(handleToggleReaction),

  delete: adminProcedure.input(z.object({ activityId: z.string() })).handler(handleDeleteActivity),
});
