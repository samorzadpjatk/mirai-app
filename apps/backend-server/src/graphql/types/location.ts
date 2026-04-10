/**
 * Location GraphQL Type
 *
 * Pothos type definition for the Location domain entity.
 * Maps from Location controller outputs to GraphQL schema types.
 *
 * ## Fields
 *
 * - id: Unique location ID (UUID)
 * - userId: Associated user ID
 * - latitude: Geographic latitude (-90 to 90)
 * - longitude: Geographic longitude (-180 to 180)
 * - accuracy: Location accuracy in meters
 * - altitude: Altitude in meters
 * - altitudeAccuracy: Altitude accuracy in meters
 * - heading: Direction of travel in degrees (0-360)
 * - speed: Speed in meters per second
 * - isSharingLocation: Whether user is sharing location with friends
 * - timestamp: When location was last updated
 * - usersToShareWith: List of users allowed to see this location
 *
 * @module Location
 */

import { builder } from "../builder";

// =============================================================================
// Type Aliases for Resolve Functions
// =============================================================================

type SharingUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};

interface LocationData {
  id: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  isSharingLocation: boolean;
  timestamp: Date;
  usersToShareWith: SharingUser[];
}

interface FriendLocationData {
  id: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  isSharingLocation: boolean;
  timestamp: Date;
  distanceKm?: number;
}

interface SharingSettingsData {
  isSharingLocation: boolean;
  usersToShareWith: SharingUser[];
}

// =============================================================================
// Shared User Info Type
// =============================================================================

/**
 * User info for sharing list
 * Minimal user details for location sharing
 */
export const SharingUserInfoType = builder.objectType("SharingUserInfo", {
  description: "User information for location sharing",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "User ID",
      nullable: false,
    }),

    firstName: t.exposeString("firstName", {
      description: "User's first name",
      nullable: true,
    }),

    lastName: t.exposeString("lastName", {
      description: "User's last name",
      nullable: true,
    }),
  }),
});

// =============================================================================
// Location Object Type
// =============================================================================

/**
 * Location type for GraphQL schema
 *
 * Represents a user's current geographic location with
 * optional accuracy and movement data.
 */
export const LocationType = builder.objectType("Location", {
  description: "A user's geographic location",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the location record (UUID)",
      nullable: false,
    }),

    userId: t.exposeID("userId", {
      description: "ID of the user this location belongs to",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Coordinate Fields
    // -------------------------------------------------------------------------

    latitude: t.exposeFloat("latitude", {
      description: "Geographic latitude (-90 to 90 degrees)",
      nullable: true,
    }),

    longitude: t.exposeFloat("longitude", {
      description: "Geographic longitude (-180 to 180 degrees)",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Accuracy & Altitude Fields
    // -------------------------------------------------------------------------

    accuracy: t.exposeFloat("accuracy", {
      description: "Location accuracy in meters",
      nullable: true,
    }),

    altitude: t.exposeFloat("altitude", {
      description: "Altitude in meters above sea level",
      nullable: true,
    }),

    altitudeAccuracy: t.exposeFloat("altitudeAccuracy", {
      description: "Altitude accuracy in meters",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Movement Fields
    // -------------------------------------------------------------------------

    heading: t.exposeFloat("heading", {
      description: "Direction of travel in degrees (0-360)",
      nullable: true,
    }),

    speed: t.exposeFloat("speed", {
      description: "Speed in meters per second",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Sharing Fields
    // -------------------------------------------------------------------------

    isSharingLocation: t.exposeBoolean("isSharingLocation", {
      description: "Whether the user is sharing their location with friends",
      nullable: false,
    }),

    usersToShareWith: t.field({
      type: [SharingUserInfoType],
      description: "List of users allowed to see this location",
      nullable: false,
      resolve: (location): SharingUser[] =>
        (location as { usersToShareWith: SharingUser[] }).usersToShareWith ??
        [],
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    timestamp: t.field({
      type: "DateTime",
      description: "When the location was last updated",
      nullable: false,
      resolve: (location) => (location as { timestamp: Date }).timestamp,
    }),
  }),
});

// =============================================================================
// Friend Location Type (for list views)
// =============================================================================

/**
 * Friend location with optional distance
 * Used when returning friends' locations with distance info
 */
export const FriendLocationType = builder.objectType("FriendLocation", {
  description: "A friend's location with optional distance information",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Location ID",
      nullable: false,
    }),

    userId: t.exposeID("userId", {
      description: "Friend's user ID",
      nullable: false,
    }),

    latitude: t.exposeFloat("latitude", {
      description: "Latitude",
      nullable: true,
    }),

    longitude: t.exposeFloat("longitude", {
      description: "Longitude",
      nullable: true,
    }),

    accuracy: t.exposeFloat("accuracy", {
      description: "Accuracy in meters",
      nullable: true,
    }),

    altitude: t.exposeFloat("altitude", {
      description: "Altitude in meters",
      nullable: true,
    }),

    heading: t.exposeFloat("heading", {
      description: "Heading in degrees",
      nullable: true,
    }),

    speed: t.exposeFloat("speed", {
      description: "Speed in m/s",
      nullable: true,
    }),

    isSharingLocation: t.exposeBoolean("isSharingLocation", {
      description: "Whether friend is sharing location",
      nullable: false,
    }),

    timestamp: t.field({
      type: "DateTime",
      description: "When location was recorded",
      nullable: false,
      resolve: (loc) => (loc as { timestamp: Date }).timestamp,
    }),

    distanceKm: t.exposeFloat("distanceKm", {
      description: "Distance from current user in kilometers",
      nullable: true,
    }),
  }),
});

// =============================================================================
// Sharing Settings Type
// =============================================================================

/**
 * Sharing settings for a user's location
 */
export const LocationSharingSettingsType = builder.objectType(
  "LocationSharingSettings",
  {
    description: "Location sharing settings for a user",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      isSharingLocation: t.exposeBoolean("isSharingLocation", {
        description: "Whether location sharing is enabled",
        nullable: false,
      }),

      usersToShareWith: t.field({
        type: [SharingUserInfoType],
        description: "Users allowed to see this location",
        nullable: false,
        resolve: (settings): SharingUser[] =>
          (settings as { usersToShareWith: SharingUser[] }).usersToShareWith ??
          [],
      }),
    }),
  },
);

// =============================================================================
// Mutation Output Types
// =============================================================================

/**
 * Output type for update location mutation
 */
export const UpdateLocationPayloadType = builder.objectType(
  "UpdateLocationPayload",
  {
    description: "Result of updating a location",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      location: t.field({
        type: LocationType,
        description: "The updated location",
        nullable: false,
        resolve: (payload): LocationData =>
          (payload as { location: LocationData }).location,
      }),
    }),
  },
);

/**
 * Output type for update sharing settings mutation
 */
export const UpdateSharingSettingsPayloadType = builder.objectType(
  "UpdateSharingSettingsPayload",
  {
    description: "Result of updating sharing settings",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      settings: t.field({
        type: LocationSharingSettingsType,
        description: "The updated sharing settings",
        nullable: false,
        resolve: (payload): SharingSettingsData =>
          (payload as { settings: SharingSettingsData }).settings,
      }),
    }),
  },
);

/**
 * Output type for add/remove sharing user mutations
 */
export const SharingUserPayloadType = builder.objectType("SharingUserPayload", {
  description: "Result of adding or removing a sharing user",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    location: t.field({
      type: LocationType,
      description: "The location with updated sharing list",
      nullable: false,
      resolve: (payload): LocationData =>
        (payload as { location: LocationData }).location,
    }),
  }),
});

// =============================================================================
// Friends Locations Connection Type
// =============================================================================

/**
 * Paginated friends locations result
 */
export const FriendsLocationsConnectionType = builder.objectType(
  "FriendsLocationsConnection",
  {
    description: "A list of friends' locations",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      locations: t.field({
        type: [FriendLocationType],
        description: "Friends' locations",
        nullable: false,
        resolve: (conn): FriendLocationData[] =>
          (conn as { locations: FriendLocationData[] }).locations,
      }),

      total: t.exposeInt("total", {
        description: "Total number of locations",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for updating location
 */
export const UpdateLocationInput = builder.inputType("UpdateLocationInput", {
  description: "Input for updating a user's location",
  fields: (t) => ({
    latitude: t.float({
      description: "Latitude (-90 to 90)",
      required: false,
    }),
    longitude: t.float({
      description: "Longitude (-180 to 180)",
      required: false,
    }),
    accuracy: t.float({
      description: "Accuracy in meters",
      required: false,
    }),
    altitude: t.float({
      description: "Altitude in meters",
      required: false,
    }),
    altitudeAccuracy: t.float({
      description: "Altitude accuracy in meters",
      required: false,
    }),
    heading: t.float({
      description: "Heading (0-360 degrees)",
      required: false,
    }),
    speed: t.float({
      description: "Speed in meters per second",
      required: false,
    }),
  }),
});

/**
 * Input for updating sharing settings
 */
export const UpdateSharingSettingsInput = builder.inputType(
  "UpdateSharingSettingsInput",
  {
    description: "Input for updating location sharing settings",
    fields: (t) => ({
      isSharingLocation: t.boolean({
        description: "Whether to enable location sharing",
        required: true,
      }),
      userIdsToShareWith: t.idList({
        description: "IDs of users to share location with",
        required: false,
      }),
    }),
  },
);

/**
 * Input for adding a user to sharing
 */
export const AddSharingUserInput = builder.inputType("AddSharingUserInput", {
  description: "Input for adding a user to location sharing",
  fields: (t) => ({
    userId: t.id({
      description: "ID of the user to add",
      required: true,
    }),
  }),
});

/**
 * Input for removing a user from sharing
 */
export const RemoveSharingUserInput = builder.inputType(
  "RemoveSharingUserInput",
  {
    description: "Input for removing a user from location sharing",
    fields: (t) => ({
      userId: t.id({
        description: "ID of the user to remove",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export default LocationType;
