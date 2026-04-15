/**
 * Coin GraphQL Resolvers
 *
 * Resolvers for Coin domain mutations.
 * Maps CoinController outputs to GraphQL responses with proper error handling.
 *
 * ## Mutations
 *
 * - addCoins(input: AddCoinsInput!): CoinTransactionResult
 * - removeCoins(input: RemoveCoinsInput!): CoinTransactionResult
 *
 * Both mutations require moderator or admin role.
 *
 * @module Coin/resolvers
 */

import { builder } from "../builder";
import { requireModerator } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";
import {
  CoinTransactionResultType,
  AddCoinsInput,
  RemoveCoinsInput,
} from "../types/coin";

// =============================================================================
// Types
// =============================================================================

/**
 * Data shape returned from CoinController operations
 */
interface CoinTransactionData {
  id: string;
  amount: number;
  reason: string | null;
  groupId: string;
  adminId: string;
  createdAt: Date;
}

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: addCoins - Add coins to a group
 *
 * Requires moderator or admin role. Adds coins to a group's balance
 * and creates a transaction record.
 */
builder.mutationField("addCoins", (t) =>
  t.field({
    description:
      "Add coins to a group. Requires moderator or admin privileges.",
    type: CoinTransactionResultType,
    authScopes: { moderator: true },
    args: {
      input: t.arg({
        type: AddCoinsInput,
        description: "Input for adding coins",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<CoinTransactionData> => {
      // Require moderator authentication
      const authContext = await requireModerator(context);

      // Get coin controller from context
      const controller = context.controllers.coinController;

      // Execute coin operation
      const result = await controller.addCoins({
        tripId: args.input.tripId.toString(),
        groupId: args.input.groupId.toString(),
        amount: args.input.amount,
        reason: args.input.reason ?? undefined,
        adminId: authContext.userId as string,
      });

      // Handle errors
      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: removeCoins - Remove coins from a group
 *
 * Requires moderator or admin role. Removes coins from a group's balance
 * if they have sufficient funds, and creates a transaction record.
 */
builder.mutationField("removeCoins", (t) =>
  t.field({
    description:
      "Remove coins from a group. Requires moderator or admin privileges.",
    type: CoinTransactionResultType,
    authScopes: { moderator: true },
    args: {
      input: t.arg({
        type: RemoveCoinsInput,
        description: "Input for removing coins",
        required: true,
      }),
    },
    resolve: async (_root, args, context): Promise<CoinTransactionData> => {
      // Require moderator authentication
      const authContext = await requireModerator(context);

      // Get coin controller from context
      const controller = context.controllers.coinController;

      // Execute coin operation
      const result = await controller.removeCoins({
        tripId: args.input.tripId.toString(),
        groupId: args.input.groupId.toString(),
        amount: args.input.amount,
        reason: args.input.reason ?? undefined,
        adminId: authContext.userId as string,
      });

      // Handle errors
      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
