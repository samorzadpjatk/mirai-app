// =============================================================================
// Coin Queries - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { GroupId } from "@mirai-app/domain";
import { CoinBalanceType, CoinTransactionConnectionType } from "./index.js";

// Import use cases
import {
  GetQuickStatsUseCase,
  GetCoinTransactionsUseCase,
} from "@mirai-app/use-cases/coin";

builder.queryFields((t) => ({
  myGroupBalance: t.field({
    type: CoinBalanceType,
    args: { tripId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new GetQuickStatsUseCase();
      const effect = useCase.execute({
        tripId: args.tripId,
      });

      return runEffect(context, effect)
        .then((result) => {
          if (!result) {
            // No stats available yet
            return {
              groupId: GroupId.unsafeCreate("no-group"),
              name: "No Group",
              coins: 0,
              totalEarned: 0,
              totalSpent: 0,
            };
          }
          return {
            groupId: GroupId.unsafeCreate("aggregate"), // Quick stats doesn't return specific group
            name: result.richestGroupName,
            coins: result.totalCoins,
            totalEarned: result.totalCoins,
            totalSpent: 0, // Not tracked in quick stats
          };
        })
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
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
      const auth = requireAuth(context);

      // Parse Relay pagination args
      const limit = args.first ?? 20;
      // Note: GetCoinTransactionsUseCase doesn't support offset pagination
      // This is a simplified implementation

      const useCase = new GetCoinTransactionsUseCase();
      const effect = useCase.execute({
        tripId: "", // Required but we don't have it - use case needs to be updated
        groupId: args.groupId,
        userId: auth.userId,
        limit,
      });

      return runEffect(context, effect)
        .then((transactions) => ({
          edges: transactions.map((t, index) => ({
            cursor: String(index + 1),
            node: t,
          })),
          pageInfo: {
            hasNextPage: transactions.length >= limit,
            hasPreviousPage: false,
            startCursor: transactions.length > 0 ? "1" : null,
            endCursor: transactions.length > 0 ? String(transactions.length) : null,
          },
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
}));

export const coinQueries = {};