import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import {
  TripType,
  TripConnectionType,
  TripParticipantConnectionType,
  buildTripConnection,
  buildTripParticipantConnection,
} from "./types.js";
import type { TripDTO, TripParticipantDTO } from "@mirai-app/use-cases";

/**
 * Trip Queries
 */
builder.queryFields((t) => ({
  /**
   * Get a single trip by ID
   */
  trip: t.field({
    type: TripType,
    nullable: true,
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the trip to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: {
        controllers: {
          tripController: {
            getById: (input: { id: string }) => Promise<{
              success: boolean;
              data?: TripDTO;
              error?: string;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.tripController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        return null;
      }

      return result.data;
    },
  }),

  /**
   * Get all trips for the current user with cursor-based pagination
   */
  trips: t.field({
    type: TripConnectionType,
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
        controllers: {
          tripController: {
            findAllConnection: (input: {
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: TripDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.tripController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.findAllConnection({
        first,
        after: afterCursor,
      });

      return buildTripConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Get participants for a specific trip with cursor-based pagination
   */
  tripParticipants: t.field({
    type: TripParticipantConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch participants for",
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
          tripController: {
            getParticipantsByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: TripParticipantDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.tripController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getParticipantsByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildTripParticipantConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
