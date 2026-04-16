import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import {
  RewardType,
  RewardConnectionType,
  RewardPurchaseConnectionType,
  buildRewardConnection,
  buildRewardPurchaseConnection,
} from "./types.js";
import type { RewardDTO, RewardPurchaseDTO } from "./types.js";

/**
 * Reward Queries
 */
builder.queryFields((t) => ({
  /**
   * Get a single reward by ID
   */
  reward: t.field({
    type: RewardType,
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the reward to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          rewardController: {
            getById: (input: {
              id: string;
            }) => Promise<
              | { success: true; data: RewardDTO }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.rewardController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  }),

  /**
   * Find rewards for a trip with cursor-based pagination
   */
  rewardsByTrip: t.field({
    type: RewardConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch rewards for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          rewardController: {
            getByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: RewardDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.rewardController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildRewardConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Get the current user's purchase history with cursor-based pagination
   */
  myPurchaseHistory: t.field({
    type: RewardPurchaseConnectionType,
    args: {
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          rewardController: {
            getPurchaseHistoryConnection: (input: {
              userId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: RewardPurchaseDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.rewardController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getPurchaseHistoryConnection({
        userId: ctx.authContext.userId,
        first,
        after: afterCursor,
      });

      return buildRewardPurchaseConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Get total available points for the current user in a specific trip
   */
  totalAvailablePoints: t.field({
    type: "Int",
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to calculate points for",
      }),
    },
    resolve: async (
      _parent,
      args: { tripId: string },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          rewardController: {
            getAvailablePoints: (input: {
              userId: string;
              tripId: string;
            }) => Promise<
              | { success: true; data: { points: number } }
              | { success: false; error: string }
            >;
          };
        };
      },
    ) => {
      if (!ctx.authContext?.userId) {
        throw new Error("Authentication required");
      }

      const controller = ctx.controllers.rewardController;
      const result = await controller.getAvailablePoints({
        userId: ctx.authContext.userId,
        tripId: args.tripId,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.points;
    },
  }),
}));
