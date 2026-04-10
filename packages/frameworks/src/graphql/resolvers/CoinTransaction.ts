import { builder } from "../builder.js";
import { CoinTransaction } from "../../../domain/src/entities/CoinTransaction.js";
import type { GraphQLContext } from "../builder.js";
import { GraphQLError } from "graphql";

/**
 * CoinTransaction Resolvers
 *
 * GraphQL resolvers for CoinTransaction domain.
 */

// CoinTransaction type
const CoinTransactionType = builder.objectType("CoinTransaction", {
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeString("groupId"),
    amount: t.exposeInt("amount"),
    reason: t.exposeString("reason", { nullable: true }),
    adminId: t.exposeString("adminId"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (ct) => ct.createdAt,
    }),
    group: t.field({
      type: "Group",
      nullable: true,
      resolve: async (ct, _, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("groupController");
        const result = await controller.getById(
          { id: ct.groupId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    admin: t.field({
      type: "User",
      nullable: true,
      resolve: async (ct, _, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: ct.adminId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
  }),
});

// Queries
builder.queryFields((t) => ({
  coinTransactions: t.field({
    type: [CoinTransactionType],
    args: {
      tripId: t.arg.string({ required: true }),
      groupId: t.arg.string(),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("coinTransactionController");
      const result = await controller.getTransactions(
        {
          tripId: args.tripId,
          groupId: args.groupId ?? undefined,
          limit: args.limit,
          offset: args.offset,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  coinStats: t.field({
    type: builder.objectType("CoinStats", {
      fields: (t) => ({
        totalAdded: t.exposeInt("totalAdded"),
        totalRemoved: t.exposeInt("totalRemoved"),
        netChange: t.exposeInt("netChange"),
        transactionCount: t.exposeInt("transactionCount"),
      }),
    }),
    args: {
      tripId: t.arg.string({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("coinTransactionController");
      const result = await controller.getStats(
        { tripId: args.tripId },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  mostActiveAdmins: t.field({
    type: [
      builder.objectType("MostActiveAdmin", {
        fields: (t) => ({
          adminId: t.exposeID("adminId"),
          totalAmount: t.exposeInt("totalAmount"),
          transactionCount: t.exposeInt("transactionCount"),
        }),
      }),
    ],
    args: {
      tripId: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 5 }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("coinTransactionController");
      const result = await controller.getMostActiveAdmins(
        {
          tripId: args.tripId,
          limit: args.limit,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),
}));

// Mutations
builder.mutationFields((t) => ({
  addCoins: t.field({
    type: CoinTransactionType,
    args: {
      groupId: t.arg.string({ required: true }),
      amount: t.arg.int({ required: true }),
      reason: t.arg.string(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("coinController");
      const result = await controller.addCoins(
        {
          groupId: args.groupId,
          amount: args.amount,
          reason: args.reason ?? undefined,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
    },
  }),

  removeCoins: t.field({
    type: CoinTransactionType,
    args: {
      groupId: t.arg.string({ required: true }),
      amount: t.arg.int({ required: true }),
      reason: t.arg.string(),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve("coinController");
      const result = await controller.removeCoins(
        {
          groupId: args.groupId,
          amount: args.amount,
          reason: args.reason ?? undefined,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "BAD_REQUEST" } });
      }
      return result.value;
    },
  }),
}));
