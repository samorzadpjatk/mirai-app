import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin } from "../../context.js";
import { GroupId, RewardId, RewardPurchaseId, TripId, UserId } from "@mirai-app/domain";
import { RedeemRewardInput, RedeemedRewardType, RewardType } from "./index.js";

builder.mutationFields((t) => ({
  redeemReward: t.field({
    type: RedeemedRewardType,
    args: { input: t.arg({ type: RedeemRewardInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: RewardPurchaseId.unsafeCreate("placeholder"),
        rewardId: RewardId.unsafeCreate(args.input.rewardId),
        groupId: GroupId.unsafeCreate("placeholder"),
        userId: UserId.unsafeCreate("placeholder"),
        redeemedAt: new Date(),
        status: "BOUGHT" as const,
        reward: {
          id: RewardId.unsafeCreate(args.input.rewardId),
          name: "Reward",
          description: "",
          availableQuantity: 0,
          isHidden: false,
          image: null,
          coinCost: 0,
          tripId: TripId.unsafeCreate(args.input.tripId),
          createdById: UserId.unsafeCreate("placeholder"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    },
  }),
  createReward: t.field({
    type: RewardType,
    args: { tripId: t.arg.string({ required: true }), name: t.arg.string({ required: true }), description: t.arg.string({ required: false }), coinCost: t.arg.int({ required: true }), quantity: t.arg.int({ required: false }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      return {
        id: RewardId.unsafeCreate("placeholder"),
        tripId: TripId.unsafeCreate(args.tripId),
        name: args.name,
        description: args.description ?? "",
        availableQuantity: args.quantity ?? 0,
        isHidden: false,
        image: null,
        coinCost: args.coinCost,
        createdById: UserId.unsafeCreate("placeholder"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  }),
}));

export const rewardMutations = {};