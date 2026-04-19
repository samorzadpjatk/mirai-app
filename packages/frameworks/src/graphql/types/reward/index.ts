import { builder } from "../../builder.js";

export const RewardType = builder.objectType("Reward", {
  description: "Reward entity",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    image: t.exposeString("image", { nullable: true }),
    coinCost: t.exposeInt("coinCost"),
    availableQuantity: t.exposeInt("availableQuantity"),
    isHidden: t.exposeBoolean("isHidden"),
    createdById: t.exposeID("createdById"),
    createdAt: t.field({ type: "DateTime", resolve: (r) => r.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (r) => r.updatedAt }),
  }),
});

export const RedeemedRewardType = builder.objectType("RedeemedReward", {
  fields: (t) => ({
    id: t.exposeID("id"),
    rewardId: t.exposeID("rewardId"),
    groupId: t.exposeID("groupId"),
    userId: t.exposeID("userId"),
    redeemedAt: t.field({ type: "DateTime", resolve: (r) => r.redeemedAt }),
    status: t.exposeString("status"),
    reward: t.field({ type: RewardType, resolve: (r) => r.reward }),
  }),
});

export const RewardConnectionType = builder.connectionObject(
  { name: "RewardConnection", type: RewardType },
  { name: "RewardEdge" }
);

export const RedeemRewardInput = builder.inputType("RedeemRewardInput", {
  fields: (t) => ({
    rewardId: t.string({ required: true }),
    tripId: t.string({ required: true }),
  }),
});

export const UpdateRewardInput = builder.inputType("UpdateRewardInput", {
  fields: (t) => ({
    rewardId: t.string({ required: true }),
    name: t.string({ required: false }),
    description: t.string({ required: false }),
    coinCost: t.int({ required: false }),
    quantity: t.int({ required: false }),
    isHidden: t.boolean({ required: false }),
  }),
});

import "./queries.js";
import "./mutations.js";
