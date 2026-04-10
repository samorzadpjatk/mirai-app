/**
 * Location GraphQL Resolvers
 *
 * Resolvers for Location domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * @module Location/resolvers
 */

import { builder } from "../builder";
import { LocationController } from "@mirai-app/adapters";
import type { PubSubService } from "@mirai-app/use-cases";
import { requireAuth } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Import Types (for side effects - registers types with builder)
// =============================================================================

import {
  LocationType,
  FriendLocationType,
  LocationSharingSettingsType,
  UpdateLocationPayloadType,
  UpdateSharingSettingsPayloadType,
  SharingUserPayloadType,
  FriendsLocationsConnectionType,
  UpdateLocationInput,
  UpdateSharingSettingsInput,
  AddSharingUserInput,
  RemoveSharingUserInput,
} from "../types/location";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: myLocation - Get current user's location
 *
 * Requires authentication. Returns the authenticated user's current location.
 */
builder.queryField("myLocation", (t) =>
  t.field({
    description: "Get the current user's location",
    type: LocationType,
    nullable: true,
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, _args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Fetch location
      const result = await controller.getByUserId({
        userId: authContext.userId as string,
      });

      if (!result.success) {
        // Return null for not found, throw for other errors
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: friendsLocations - Get friends' locations
 *
 * Requires authentication. Returns locations of users sharing with the viewer.
 */
builder.queryField("friendsLocations", (t) =>
  t.field({
    description: "Get locations of friends sharing with current user",
    type: FriendsLocationsConnectionType,
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, _args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Fetch friends' locations
      const result = await controller.list({
        viewerUserId: authContext.userId as string,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        locations: result.data.locations,
        total: result.data.total,
      };
    },
  }),
);

/**
 * Query: mySharingSettings - Get current user's sharing settings
 *
 * Requires authentication. Returns the user's location sharing preferences.
 */
builder.queryField("mySharingSettings", (t) =>
  t.field({
    description: "Get current user's location sharing settings",
    type: LocationSharingSettingsType,
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, _args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Fetch sharing settings
      const result = await controller.getSharingSettings({
        userId: authContext.userId as string,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: updateLocation - Update current user's location
 *
 * Requires authentication. Updates the user's geographic coordinates and metadata.
 */
builder.mutationField("updateLocation", (t) =>
  t.field({
    description: "Update the current user's location",
    type: UpdateLocationPayloadType,
    args: {
      input: t.arg({
        type: UpdateLocationInput,
        description: "Location update data",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Update location
      const result = await controller.update({
        userId: authContext.userId as string,
        latitude: args.input.latitude ?? null,
        longitude: args.input.longitude ?? null,
        accuracy: args.input.accuracy ?? null,
        altitude: args.input.altitude ?? null,
        altitudeAccuracy: args.input.altitudeAccuracy ?? null,
        heading: args.input.heading ?? null,
        speed: args.input.speed ?? null,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Publish location update to subscribers
      const pubSubService =
        context.container.resolve<PubSubService>("pubSubService");
      pubSubService.publish(`location:${authContext.userId}`, {
        id: result.data.id,
        userId: authContext.userId as string,
        latitude: args.input.latitude ?? null,
        longitude: args.input.longitude ?? null,
        accuracy: args.input.accuracy ?? null,
        altitude: args.input.altitude ?? null,
        heading: args.input.heading ?? null,
        speed: args.input.speed ?? null,
        isSharingLocation: result.data.isSharingLocation,
        timestamp: new Date(),
      });

      return { location: result.data };
    },
  }),
);

/**
 * Mutation: updateSharingSettings - Update location sharing settings
 *
 * Requires authentication. Updates who can see the user's location.
 */
builder.mutationField("updateSharingSettings", (t) =>
  t.field({
    description: "Update location sharing settings",
    type: UpdateSharingSettingsPayloadType,
    args: {
      input: t.arg({
        type: UpdateSharingSettingsInput,
        description: "Sharing settings update data",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Build sharing user list from IDs
      const usersToShareWith = args.input.userIdsToShareWith?.map((id) => ({
        id: id as string,
        firstName: null,
        lastName: null,
      }));

      // Update sharing settings
      const result = await controller.updateSharingSettings({
        userId: authContext.userId as string,
        isSharingLocation: args.input.isSharingLocation,
        usersToShareWith,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { settings: result.data };
    },
  }),
);

/**
 * Mutation: addUserToSharing - Add a user to location sharing
 *
 * Requires authentication. Grants a user permission to see the location.
 */
builder.mutationField("addUserToSharing", (t) =>
  t.field({
    description: "Add a user to location sharing list",
    type: SharingUserPayloadType,
    args: {
      input: t.arg({
        type: AddSharingUserInput,
        description: "User to add to sharing",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Add user to sharing
      const result = await controller.addSharingUser({
        ownerUserId: authContext.userId as string,
        userToAddId: args.input.userId as string,
        userFirstName: null,
        userLastName: null,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { location: result.data };
    },
  }),
);

/**
 * Mutation: removeUserFromSharing - Remove a user from location sharing
 *
 * Requires authentication. Revokes a user's permission to see the location.
 */
builder.mutationField("removeUserFromSharing", (t) =>
  t.field({
    description: "Remove a user from location sharing list",
    type: SharingUserPayloadType,
    args: {
      input: t.arg({
        type: RemoveSharingUserInput,
        description: "User to remove from sharing",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Get authenticated user context
      const authContext = await requireAuth(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<LocationController>("locationController");

      // Remove user from sharing
      const result = await controller.removeSharingUser({
        ownerUserId: authContext.userId as string,
        userToRemoveId: args.input.userId as string,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { location: result.data };
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
