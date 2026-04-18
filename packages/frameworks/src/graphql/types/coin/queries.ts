import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { GroupId } from "@mirai-app/domain";
import { CoinBalanceType, CoinTransactionConnectionType } from "./index.js";

builder.queryFields((t) => ({
  myGroupBalance: t.field({
    type: CoinBalanceType,
    args: { tripId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        groupId: GroupId.unsafeCreate("placeholder"),
        name: "Group",
        coins: 0,
        totalEarned: 0,
        totalSpent: 0,
      };
    },
  }),
  groupTransactions: t.field({
    type: CoinTransactionConnectionType,
    args: {
      groupId: t.arg.string({ required: true }),
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      // Return empty Relay connection structure
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      };
    },
  }),
}));

export const coinQueries = {};