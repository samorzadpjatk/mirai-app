import { builder } from "../../builder.js";

/**
 * FriendLocationEvent payload interface
 *
 * This is the shape of data passed through the subscription
 */
export interface FriendLocationEvent {
  readonly userId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number | null;
  readonly timestamp: Date;
}

/**
 * FriendLocationEvent type
 *
 * GraphQL type for real-time location updates sent to friends.
 * This type is used in the friendLocationEvent subscription.
 */
builder.objectType("FriendLocationEvent", {
  description: "Real-time location update event for friends",
  fields: (t) => ({
    userId: t.exposeID("userId", {
      description: "The user who updated their location",
    }),
    latitude: t.exposeFloat("latitude", {
      description: "Latitude coordinate in decimal degrees (-90 to 90)",
    }),
    longitude: t.exposeFloat("longitude", {
      description: "Longitude coordinate in decimal degrees (-180 to 180)",
    }),
    accuracy: t.exposeFloat("accuracy", {
      description: "GPS accuracy in meters (null if unavailable)",
      nullable: true,
    }),
    timestamp: t.field({
      type: "DateTime",
      description: "When the location update occurred",
      resolve: (event: FriendLocationEvent) => event.timestamp,
    }),
  }),
});

/**
 * Type reference for FriendLocationEvent
 */
export const FriendLocationEventType = "FriendLocationEvent";
