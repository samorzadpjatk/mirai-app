import { builder } from "../../builder.js";
import type { LocationDTO, FriendLocationDTO } from "@mirai-app/use-cases";
import { LocationType, FriendLocationType } from "./types.js";

/**
 * Location Queries
 */
builder.queryFields((t) => ({
  /**
   * Get the current user's location
   */
  myLocation: t.field({
    type: LocationType,
    nullable: true,
    resolve: async (
      _parent,
      _args,
      ctx: {
        controllers: {
          locationController: {
            getMyLocation: () => Promise<{
              success: boolean;
              data?: LocationDTO;
              error?: string;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.locationController;
      const result = await controller.getMyLocation();

      if (!result.success) {
        return null;
      }

      return result.data;
    },
  }),

  /**
   * Get friend locations for a trip
   */
  friendLocations: t.field({
    type: [FriendLocationType],
    args: {
      tripId: t.arg.id({
        required: true,
        description: "ID of the trip to fetch friend locations for",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripId: string;
      },
      ctx: {
        controllers: {
          locationController: {
            getFriendLocations: (input: { tripId: string }) => Promise<{
              success: boolean;
              data?: FriendLocationDTO[];
              error?: string;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.locationController;
      const result = await controller.getFriendLocations({
        tripId: args.tripId,
      });

      if (!result.success) {
        return [];
      }

      return result.data;
    },
  }),
}));
