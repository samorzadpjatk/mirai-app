import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import { CoinTransactionType } from "./types.js";

/**
 * Create Coin Transaction Input
 */
const CreateCoinTransactionInput = builder.inputType(
  "CreateCoinTransactionInput",
  {
    description: "Input for creating a coin transaction (adding coins)",
    fields: (t) => ({
      tripId: t.field({ type: "ID", required: true }),
      groupId: t.field({ type: "ID", required: true }),
      amount: t.field({ type: "Int", required: true }),
      reason: t.field({ type: "String" }),
      adminId: t.field({ type: "ID", required: true }),
    }),
  },
);

/**
 * Remove Coins Input
 */
const RemoveCoinsInput = builder.inputType("RemoveCoinsInput", {
  description: "Input for removing coins from a group",
  fields: (t) => ({
    tripId: t.field({ type: "ID", required: true }),
    groupId: t.field({ type: "ID", required: true }),
    amount: t.field({ type: "Int", required: true }),
    reason: t.field({ type: "String" }),
    adminId: t.field({ type: "ID", required: true }),
  }),
});

/**
 * Coin Transaction Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a coin transaction (add coins to a group)
   */
  createCoinTransaction: t.field({
    type: CoinTransactionType,
    description: "Add coins to a group",
    args: {
      input: t.arg({ type: CreateCoinTransactionInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          groupId: string;
          amount: number;
          reason?: string | null;
          adminId: string;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.coinTransactionController;
      const result = await controller.addCoins({
        tripId: args.input.tripId,
        groupId: args.input.groupId,
        amount: args.input.amount,
        reason: args.input.reason ?? undefined,
        adminId: args.input.adminId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Remove coins from a group
   */
  removeCoins: t.field({
    type: CoinTransactionType,
    description: "Remove coins from a group",
    args: {
      input: t.arg({ type: RemoveCoinsInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          tripId: string;
          groupId: string;
          amount: number;
          reason?: string | null;
          adminId: string;
        };
      },
      ctx,
    ) => {
      const controller = ctx.controllers.coinTransactionController;
      const result = await controller.removeCoins({
        tripId: args.input.tripId,
        groupId: args.input.groupId,
        amount: args.input.amount,
        reason: args.input.reason ?? undefined,
        adminId: args.input.adminId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),
}));
