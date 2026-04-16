import { builder } from "../../builder.js";
import { LocationType, FriendLocationType } from "./types.js";
import type { LocationDTO, FriendLocationDTO } from "@mirai-app/use-cases";

/**
 * Location Subscriptions
 */
builder.subscriptionFields((t) => ({
  /**
   * Subscribe to location updates for a specific user
   */
  locationUpdated: t.field({
    type: LocationType,
    args: {
      userId: t.arg.id({
        required: true,
        description: "ID of the user to subscribe to location updates for",
      }),
    },
    resolve: async (
      _parent,
      args: {
        userId: string;
      },
      ctx: {
        controllers: {
          locationController: {
            subscribeToLocationUpdates: (input: {
              userId: string;
            }) => AsyncIterable<LocationDTO>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.locationController;
      return controller.subscribeToLocationUpdates({ userId: args.userId });
    },
  }),

  /**
   * Subscribe to friend location updates for a trip
   */
  friendLocationsUpdated: t.field({
    type: [FriendLocationType],
    args: {
      tripId: t.arg.id({
        required: true,
        description:
          "ID of the trip to subscribe to friend location updates for",
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
            subscribeToFriendLocations: (input: {
              tripId: string;
            }) => AsyncIterable<FriendLocationDTO[]>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.locationController;
      return controller.subscribeToFriendLocations({ tripId: args.tripId });
    },
  }),
}));
