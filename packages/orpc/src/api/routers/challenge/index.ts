import { z } from "zod";
import { adminProcedure, createORPCRouter, protectedProcedure } from "../../orpc";
import { createChallenge, deleteChallenge, forceCloseVoting, updateChallenge } from "./mutations";
import { getAll, getAllByTrip, getById } from "./queries";
import { MAX_PEER_VOTING_DURATION_HOURS, MAX_RECURRING_DAYS, challengeImageSchema } from "./types";

const handleGetAll = async ({ context }: { context: Parameters<typeof getAll>[0] }) =>
  getAll(context);

const handleGetAllByTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAllByTrip>[0];
  input: Parameters<typeof getAllByTrip>[1];
}) => getAllByTrip(context, input);

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof getById>[0];
  input: Parameters<typeof getById>[1];
}) => getById(context, input);

const handleCreateChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof createChallenge>[0];
  input: Parameters<typeof createChallenge>[1];
}) => createChallenge(context, input);

const handleUpdateChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateChallenge>[0];
  input: Parameters<typeof updateChallenge>[1];
}) => updateChallenge(context, input);

const handleDeleteChallenge = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteChallenge>[0];
  input: Parameters<typeof deleteChallenge>[1];
}) => deleteChallenge(context, input);

const handleForceCloseVoting = async ({
  context,
  input,
}: {
  context: Parameters<typeof forceCloseVoting>[0];
  input: Parameters<typeof forceCloseVoting>[1];
}) => forceCloseVoting(context, input);

export const challengeRouter = createORPCRouter({
  // Admin-only endpoint to fetch all challenges across trips
  getAll: adminProcedure.handler(handleGetAll),

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
        // Optional on purpose: participants keep running app builds that never send it,
        // and without it the result is byte-identical to the previous behaviour.
        includeRecurringTemplates: z.boolean().optional(),
      }),
    )
    .handler(handleGetAllByTrip),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(handleGetById),

  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        qrCodeValue: z.string().trim().min(1).optional(),
        textExpectedPhrase: z.string().trim().min(1).optional(),
        image: challengeImageSchema,
        submissionType: z.enum(["IMAGE", "VIDEO", "TEXT", "IMAGE_LOCATION", "LOCATION", "QR_CODE"]),
        scoringCategory: z.enum(["SPEED", "UNLIMITED", "JUDGED_STAFF", "PEER_VOTING"]),
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
        votingDurationHours: z.number().int().min(1).max(MAX_PEER_VOTING_DURATION_HOURS).optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .handler(handleCreateChallenge),

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
          .enum(["IMAGE", "VIDEO", "TEXT", "IMAGE_LOCATION", "LOCATION", "QR_CODE"])
          .optional(),
        scoringCategory: z.enum(["SPEED", "UNLIMITED", "JUDGED_STAFF", "PEER_VOTING"]).optional(),
        isRecurring: z.boolean().optional(),
        recurringDays: z.number().int().min(1).max(MAX_RECURRING_DAYS).optional(),
        dailyStartTime: z.string().optional(),
        dailyEndTime: z.string().optional(),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        status: z
          .enum(["HIDDEN", "VISIBLE", "ACTIVE", "VOTING_PHASE", "COMPLETED", "CANCELLED"])
          .optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        votingDurationHours: z.number().int().min(1).max(MAX_PEER_VOTING_DURATION_HOURS).optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .handler(handleUpdateChallenge),

  delete: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(handleDeleteChallenge),

  forceCloseVoting: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .handler(handleForceCloseVoting),
});
