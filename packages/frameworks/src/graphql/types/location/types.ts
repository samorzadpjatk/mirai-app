import { builder } from "../../builder.js";

/**
 * FriendLocationEvent payload interface
 *
 * This is the shape of data passed through the subscription
 */
export interface FriendLocationEvent {
  readonly userId: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly image: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly accuracy: number | null;
  readonly timestamp: Date;
  readonly isOnline: boolean;
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
    firstName: t.exposeString("firstName", {
      description: "User's first name",
      nullable: true,
    }),
    lastName: t.exposeString("lastName", {
      description: "User's last name",
      nullable: true,
    }),
    image: t.exposeString("image", {
      description: "User's avatar image URL",
      nullable: true,
    }),
    latitude: t.exposeFloat("latitude", {
      description: "Latitude coordinate in decimal degrees (-90 to 90)",
      nullable: true,
    }),
    longitude: t.exposeFloat("longitude", {
      description: "Longitude coordinate in decimal degrees (-180 to 180)",
      nullable: true,
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
    isOnline: t.exposeBoolean("isOnline", {
      description: "Whether the user is currently online",
    }),
  }),
});

/**
 * Type reference for FriendLocationEvent
 */
export const FriendLocationEventType = "FriendLocationEvent";
