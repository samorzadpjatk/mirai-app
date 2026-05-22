import { z } from "zod";
import {
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
} from "../../trpc";
import { rewardPurchaseStatusSchema, userRewardPurchaseStatusSchema } from "./types";
import type { DB } from "@mirai-app/db";
import {
  getByTrip,
  getByTripAdmin,
  getById,
  getPurchaseHistory,
  getTotalAvailablePoints,
} from "./queries";
import {
  createReward,
  updateReward,
  setRewardHidden,
  deleteReward,
  purchaseReward,
  updateMyPurchaseStatus,
  updatePurchaseStatus,
} from "./mutations";

const handleGetByTrip = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByTrip>[0];
  input: Parameters<typeof getByTrip>[1];
}) => getByTrip(context, input);

const handleGetByTripAdmin = async ({
  context,
  input,
}: {
  context: Parameters<typeof getByTripAdmin>[0];
  input: Parameters<typeof getByTripAdmin>[1];
}) => getByTripAdmin(context, input);

const handleGetById = async ({
  context,
  input,
}: {
  context: Parameters<typeof getById>[0];
  input: Parameters<typeof getById>[1];
}) => getById(context, input);

const handleCreateReward = async ({
  context,
  input,
}: {
  context: Parameters<typeof createReward>[0];
  input: Parameters<typeof createReward>[1];
}) => createReward(context, input);

const handleUpdateReward = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateReward>[0];
  input: Parameters<typeof updateReward>[1];
}) => updateReward(context, input);

const handleSetRewardHidden = async ({
  context,
  input,
}: {
  context: Parameters<typeof setRewardHidden>[0];
  input: Parameters<typeof setRewardHidden>[1];
}) => setRewardHidden(context, input);

const handleDeleteReward = async ({
  context,
  input,
}: {
  context: Parameters<typeof deleteReward>[0];
  input: Parameters<typeof deleteReward>[1];
}) => deleteReward(context, input);

const handlePurchaseReward = async ({
  context,
  input,
}: {
  context: Parameters<typeof purchaseReward>[0];
  input: Parameters<typeof purchaseReward>[1];
}) => purchaseReward(context, input);

const handleUpdateMyPurchaseStatus = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateMyPurchaseStatus>[0];
  input: Parameters<typeof updateMyPurchaseStatus>[1];
}) => updateMyPurchaseStatus(context, input);

const handleUpdatePurchaseStatus = async ({
  context,
  input,
}: {
  context: Parameters<typeof updatePurchaseStatus>[0];
  input: Parameters<typeof updatePurchaseStatus>[1];
}) => updatePurchaseStatus(context, input);

const handleGetPurchaseHistory = async ({
  context,
  input,
}: {
  context: Parameters<typeof getPurchaseHistory>[0];
  input: Parameters<typeof getPurchaseHistory>[1];
}) => getPurchaseHistory(context, input);

const handleGetTotalAvailablePoints = async ({
  context,
  input,
}: {
  context: { db: DB };
  input: { tripId: string };
}) => getTotalAvailablePoints(context.db, input.tripId);

export const rewardRouter = createORPCRouter({
  getByTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetByTrip),

  getByTripAdmin: moderatorProcedure
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
    .handler(handleGetByTripAdmin),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(handleGetById),

  create: moderatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        availableQuantity: z.number().min(0),
        image: z.string().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().min(1),
        isHidden: z.boolean().optional(),
        tripId: z.string(),
      }),
    )
    .handler(handleCreateReward),

  update: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        availableQuantity: z.number().min(0).optional(),
        image: z.string().nullable().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().min(1).optional(),
      }),
    )
    .handler(handleUpdateReward),

  setHidden: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        isHidden: z.boolean(),
      }),
    )
    .handler(handleSetRewardHidden),

  delete: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .handler(handleDeleteReward),

  purchase: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .handler(handlePurchaseReward),

  updateMyPurchaseStatus: protectedProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: userRewardPurchaseStatusSchema,
      }),
    )
    .handler(handleUpdateMyPurchaseStatus),

  updatePurchaseStatus: moderatorProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: rewardPurchaseStatusSchema,
        collectionMethod: z.string().trim().min(1).max(500).optional(),
      }),
    )
    .handler(handleUpdatePurchaseStatus),

  getPurchaseHistory: protectedProcedure
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
    .handler(handleGetPurchaseHistory),

  getTotalAvailablePoints: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(handleGetTotalAvailablePoints),
});
