import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { ActivityConnectionType, buildActivityConnection } from "./types.js";
import type { ActivityFeedDTO } from "@mirai-app/use-cases";

/**
 * Activity Queries
 */
builder.queryFields((t) => ({
  /**
   * Get a single activity by ID
   */
  activity: t.field({
    type: ActivityConnectionType,
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the activity to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
      },
      ctx: {
        controllers: {
          activityController: {
            getById: (input: { id: string }) => Promise<{
              item: ActivityFeedDTO | null;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityController;

      const result = await controller.getById({
        id: args.id,
      });

      if (!result.item) {
        return buildActivityConnection([], false, false);
      }

      return buildActivityConnection([result.item], false, false);
    },
  }),

  /**
   * Find activities for a trip with cursor-based pagination
   */
  activitiesByTrip: t.field({
    type: ActivityConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch activities for",
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
          activityController: {
            getByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: ActivityFeedDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildActivityConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Find activities for trip moderation with cursor-based pagination
   * Includes hidden activities for moderator review
   */
  activitiesByTripModeration: t.field({
    type: ActivityConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch activities for moderation",
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
          activityController: {
            getByTripModerationConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: ActivityFeedDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.activityController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripModerationConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildActivityConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
