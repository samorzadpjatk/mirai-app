// =============================================================================
// Reward Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { GroupId, RewardId, RewardPurchaseId, TripId, UserId } from "@mirai-app/domain";
import { RedeemRewardInput, RedeemedRewardType, RewardType, UpdateRewardInput } from "./index.js";

// Import use cases
import {
  CreateRewardUseCase,
  UpdateRewardUseCase,
  PurchaseRewardUseCase,
} from "@mirai-app/use-cases/reward";

builder.mutationFields((t) => ({
  updateReward: t.field({
    type: RewardType,
    args: { input: t.arg({ type: UpdateRewardInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);

      const useCase = new UpdateRewardUseCase();
      const effect = useCase.execute({
        rewardId: args.input.rewardId,
        name: args.input.name ?? undefined,
        description: args.input.description ?? undefined,
        coinCost: args.input.coinCost ?? undefined,
        availableQuantity: args.input.quantity ?? undefined,
        isHidden: args.input.isHidden ?? undefined,
      });

      return runEffect(context, effect)
        .then((result) => ({
          id: result.id,
          tripId: result.tripId,
          name: result.name,
          description: result.description,
          availableQuantity: result.availableQuantity,
          isHidden: result.isHidden,
          image: null, // Not stored separately in entity
          coinCost: result.coinCost,
          createdById: UserId.unsafeCreate("admin"), // Not returned by use case - would need entity update
          createdAt: new Date(), // Not returned by use case - would need entity update
          updatedAt: result.updatedAt,
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
  redeemReward: t.field({
    type: RedeemedRewardType,
    args: { input: t.arg({ type: RedeemRewardInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new PurchaseRewardUseCase();
      const effect = useCase.execute({
        rewardId: args.input.rewardId,
        quantity: 1, // Default to 1, quantity not in GraphQL input
        userId: auth.userId,
      });

      return runEffect(context, effect)
        .then((result) => ({
          id: result.id,
          rewardId: result.rewardId,
          groupId: result.groupId,
          userId: result.userId,
          redeemedAt: new Date(),
          status: result.status,
          reward: {
            id: result.rewardId,
            name: "Reward", // Not returned by use case
            description: "",
            availableQuantity: 0,
            isHidden: false,
            image: null,
            coinCost: result.totalCost,
            tripId: TripId.unsafeCreate(args.input.tripId),
            createdById: UserId.unsafeCreate(auth.userId),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
  createReward: t.field({
    type: RewardType,
    args: {
      tripId: t.arg.string({ required: true }),
      name: t.arg.string({ required: true }),
      description: t.arg.string({ required: false }),
      coinCost: t.arg.int({ required: true }),
      quantity: t.arg.int({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAdmin(context);

      const useCase = new CreateRewardUseCase();
      const effect = useCase.execute({
        name: args.name,
        description: args.description ?? "",
        availableQuantity: args.quantity ?? 0,
        images: [],
        coinCost: args.coinCost,
        tripId: args.tripId,
        createdById: auth.userId,
      });

      return runEffect(context, effect)
        .then((result) => ({
          id: result.id,
          tripId: result.tripId,
          name: result.name,
          description: args.description ?? "",
          availableQuantity: args.quantity ?? 0,
          isHidden: false,
          image: null,
          coinCost: result.coinCost,
          createdById: UserId.unsafeCreate(auth.userId),
          createdAt: result.createdAt,
          updatedAt: new Date(),
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
}));

export const rewardMutations = {};