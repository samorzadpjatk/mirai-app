import { builder } from "../builder.js";
import {
  Reward,
  RewardType,
  RewardRarity,
} from "../../../domain/src/entities/Reward.js";
import { RewardPurchase } from "../../../domain/src/entities/RewardPurchase.js";
import type { GraphQLContext } from "../builder.js";
import { GraphQLError } from "graphql";

const RewardTypeEnum = builder.enumType("RewardType", {
  values: ["BADGE", "TITLE", "THEME", "AVATAR"] as const,
});

const RewardRarityEnum = builder.enumType("RewardRarity", {
  values: ["COMMON", "RARE", "EPIC", "LEGENDARY"] as const,
});

builder.node(Reward, {
  id: { resolve: (r) => r.id },
  name: "Reward",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    type: t.field({
      type: RewardTypeEnum,
      resolve: (r) => r.type,
    }),
    rarity: t.field({
      type: RewardRarityEnum,
      resolve: (r) => r.rarity,
    }),
    iconUrl: t.exposeString("iconUrl"),
    pointCost: t.exposeInt("pointCost"),
    unlockRequirement: t.exposeString("unlockRequirement", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    createdAt: t.field({
      type: "Date",
      resolve: (r) => r.createdAt,
    }),
  }),
});

builder.node(RewardPurchase, {
  id: { resolve: (rp) => rp.id },
  name: "RewardPurchase",
  fields: (t) => ({
    id: t.exposeID("id"),
    userId: t.exposeString("userId"),
    rewardId: t.exposeString("rewardId"),
    pointCost: t.exposeInt("pointCost"),
    purchasedAt: t.field({
      type: "Date",
      resolve: (rp) => rp.purchasedAt,
    }),
    isEquipped: t.exposeBoolean("isEquipped"),
    user: t.field({
      type: "User",
      resolve: async (rp, _args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: rp.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "NOT_FOUND" } });
        }
        return result.value;
      },
    }),
    reward: t.field({
      type: Reward,
      resolve: async (rp, _args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.getById(
          { id: rp.rewardId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "NOT_FOUND" } });
        }
        return result.value;
      },
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    rewards: t.field({
      type: [Reward],
      args: {
        type: t.arg({ type: RewardTypeEnum }),
        rarity: t.arg({ type: RewardRarityEnum }),
        activeOnly: t.arg.boolean({ defaultValue: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.getAll(
          {
            type: args.type ?? undefined,
            rarity: args.rarity ?? undefined,
            activeOnly: args.activeOnly,
          },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
        }
        return result.value;
      },
    }),
    reward: t.field({
      type: Reward,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.getById(
          { id: args.id.toString() },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    userRewards: t.field({
      type: [RewardPurchase],
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.getUserRewards(
          { userId: args.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
        }
        return result.value;
      },
    }),
    userEquippedRewards: t.field({
      type: [RewardPurchase],
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.getUserEquippedRewards(
          { userId: args.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
        }
        return result.value;
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    purchaseReward: t.field({
      type: RewardPurchase,
      args: {
        userId: t.arg.string({ required: true }),
        rewardId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.purchase(
          {
            userId: args.userId,
            rewardId: args.rewardId,
          },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
        }
        return result.value;
      },
    }),
    equipReward: t.field({
      type: RewardPurchase,
      args: {
        purchaseId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.equipReward(
          { purchaseId: args.purchaseId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
        }
        return result.value;
      },
    }),
    unequipReward: t.field({
      type: RewardPurchase,
      args: {
        purchaseId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.unequipReward(
          { purchaseId: args.purchaseId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
        }
        return result.value;
      },
    }),
    createReward: t.field({
      type: Reward,
      args: {
        name: t.arg.string({ required: true }),
        description: t.arg.string({ required: true }),
        type: t.arg({ type: RewardTypeEnum, required: true }),
        rarity: t.arg({ type: RewardRarityEnum, required: true }),
        iconUrl: t.arg.string({ required: true }),
        pointCost: t.arg.int({ required: true }),
        unlockRequirement: t.arg.string(),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("rewardController");
        const result = await controller.create(
          {
            name: args.name,
            description: args.description,
            type: args.type,
            rarity: args.rarity,
            iconUrl: args.iconUrl,
            pointCost: args.pointCost,
            unlockRequirement: args.unlockRequirement ?? undefined,
          },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
        }
        return result.value;
      },
    }),
  }),
});
