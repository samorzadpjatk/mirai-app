import { builder } from "../builder";

/**
 * Sharing User Info Type
 */
export const SharingUserInfoType = builder.objectType<"SharingUserInfo">(
  "SharingUserInfo",
  {
    description: "User information for location sharing",
    fields: (t) => ({
      id: t.exposeID("id"),
      firstName: t.exposeString("firstName", { nullable: true }),
      lastName: t.exposeString("lastName", { nullable: true }),
      hasAvatar: t.exposeBoolean("hasAvatar", { nullable: true }),
    }),
  },
);

/**
 * Location Type (Pothos)
 *
 * GraphQL type definition for Location entity.
 */
export const LocationType = builder.objectType<"Location">("Location", {
  description: "A user's geographical location",
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique location identifier" }),

    userId: t.exposeID("userId", { description: "ID of the user" }),

    latitude: t.float({
      description: "Latitude coordinate",
      nullable: true,
      resolve: (location) => location.latitude,
    }),

    longitude: t.float({
      description: "Longitude coordinate",
      nullable: true,
      resolve: (location) => location.longitude,
    }),

    accuracy: t.float({
      description: "Location accuracy in meters",
      nullable: true,
      resolve: (location) => location.accuracy,
    }),

    altitude: t.float({
      description: "Altitude in meters",
      nullable: true,
      resolve: (location) => location.altitude,
    }),

    altitudeAccuracy: t.float({
      description: "Altitude accuracy in meters",
      nullable: true,
      resolve: (location) => location.altitudeAccuracy,
    }),

    heading: t.float({
      description: "Heading direction in degrees (0-360)",
      nullable: true,
      resolve: (location) => location.heading,
    }),

    speed: t.float({
      description: "Speed in meters per second",
      nullable: true,
      resolve: (location) => location.speed,
    }),

    isSharingLocation: t.exposeBoolean("isSharingLocation", {
      description: "Whether the user is sharing their location",
    }),

    usersToShareWith: t.field({
      type: [SharingUserInfoType],
      description: "List of users this location is shared with",
      resolve: (location) => location.usersToShareWith,
    }),

    timestamp: t.field({
      type: "DateTime",
      description: "When this location was recorded",
      resolve: (location) => location.timestamp,
    }),

    lastInactivityNotification: t.field({
      type: "DateTime",
      description: "When the last inactivity notification was sent",
      nullable: true,
      resolve: (location) => location.lastInactivityNotification,
    }),
  }),
});

/**
 * Location Input Types
 */
export const UpdateLocationInput = builder.inputType("UpdateLocationInput", {
  description: "Input for updating a location",
  fields: (t) => ({
    latitude: t.float({ required: false }),
    longitude: t.float({ required: false }),
    accuracy: t.float({ required: false }),
    altitude: t.float({ required: false }),
    altitudeAccuracy: t.float({ required: false }),
    heading: t.float({ required: false }),
    speed: t.float({ required: false }),
    isSharingLocation: t.boolean({ required: false }),
  }),
});

export const UpdateSharingSettingsInput = builder.inputType(
  "UpdateSharingSettingsInput",
  {
    description: "Input for updating location sharing settings",
    fields: (t) => ({
      isSharingLocation: t.boolean({ required: true }),
      userIdsToShareWith: t.stringList({ required: false }),
    }),
  },
);
