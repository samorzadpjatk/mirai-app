import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import {
  SponsorConnectionType,
  TripSponsorConnectionType,
  buildSponsorConnection,
  buildTripSponsorConnection,
} from "./types.js";
import type { SponsorDTO, TripSponsorDTO } from "@mirai-app/use-cases";

/**
 * Sponsor Queries
 */
builder.queryFields((t) => ({
  /**
   * Find all active sponsors with cursor-based pagination
   */
  sponsors: t.field({
    type: SponsorConnectionType,
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
          sponsorController: {
            getActiveConnection: (input: {
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: SponsorDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.sponsorController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getActiveConnection({
        first,
        after: afterCursor,
      });

      return buildSponsorConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Find sponsors for a trip with cursor-based pagination
   */
  sponsorsByTrip: t.field({
    type: TripSponsorConnectionType,
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch sponsors for",
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
          sponsorController: {
            getByTripIdConnection: (input: {
              tripId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: TripSponsorDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.sponsorController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTripIdConnection({
        tripId: args.tripId,
        first,
        after: afterCursor,
      });

      return buildTripSponsorConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
