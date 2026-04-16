import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { EventConnectionType, buildEventConnection } from "./types.js";
import type { EventDTO } from "@mirai-app/use-cases";

/**
 * Event Queries
 */
builder.queryFields((t) => ({
  /**
   * Find events for a trip with cursor-based pagination
   */
  eventsByTrip: t.field({
    type: EventConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch events for",
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
          eventController: {
            getByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: EventDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.eventController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildEventConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Find upcoming events for a trip with cursor-based pagination
   */
  upcomingEventsByTrip: t.field({
    type: EventConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch upcoming events for",
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
          eventController: {
            getUpcomingByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: EventDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.eventController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getUpcomingByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildEventConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Find ongoing events for a trip with cursor-based pagination
   */
  ongoingEventsByTrip: t.field({
    type: EventConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch ongoing events for",
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
          eventController: {
            getOngoingByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: EventDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.eventController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getOngoingByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildEventConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),

  /**
   * Find past events for a trip with cursor-based pagination
   */
  pastEventsByTrip: t.field({
    type: EventConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch past events for",
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
          eventController: {
            getPastByTripConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: EventDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.eventController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getPastByTripConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildEventConnection(result.items, result.hasMore, !!afterCursor);
    },
  }),
}));
