import { z } from "zod";
import {
  latitudeSchema,
  locationDataSchema,
  longitudeSchema,
} from "../../../utils/location-validation";
import { createORPCRouter, protectedProcedure } from "../../orpc";
import {
  acceptLocationSharingRequest,
  addUserToSharing,
  rejectLocationSharingRequest,
  removeUserFromSharing,
  requestLocationSharing,
  updateLocation,
  updateLocationStream,
  updateSharingSettings,
} from "./mutations";
import {
  getAllUsersForSharing,
  getFriendsLocations,
  getFriendsLocationsStream,
  getMyLocation,
  getMyLocationSharingRequests,
  getMySharingSettings,
  getPendingLocationSharingRequests,
} from "./queries";

const handleUpdateSharingSettings = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateSharingSettings>[0];
  input: Parameters<typeof updateSharingSettings>[1];
}) => updateSharingSettings(context, input);

const handleUpdateLocation = async ({
  context,
  input,
}: {
  context: Parameters<typeof updateLocation>[0];
  input: Parameters<typeof updateLocation>[1];
}) => updateLocation(context, input);

const handleGetMyLocation = async ({ context }: { context: Parameters<typeof getMyLocation>[0] }) =>
  getMyLocation(context);

const handleGetFriendsLocations = async ({
  context,
}: {
  context: Parameters<typeof getFriendsLocations>[0];
}) => getFriendsLocations(context);

const handleGetMySharingSettings = async ({
  context,
}: {
  context: Parameters<typeof getMySharingSettings>[0];
}) => getMySharingSettings(context);

const handleGetAllUsersForSharing = async ({
  context,
  input,
}: {
  context: Parameters<typeof getAllUsersForSharing>[0];
  input: Parameters<typeof getAllUsersForSharing>[1];
}) => getAllUsersForSharing(context, input);

const handleAddUserToSharing = async ({
  context,
  input,
}: {
  context: Parameters<typeof addUserToSharing>[0];
  input: Parameters<typeof addUserToSharing>[1];
}) => addUserToSharing(context, input);

const handleRemoveUserFromSharing = async ({
  context,
  input,
}: {
  context: Parameters<typeof removeUserFromSharing>[0];
  input: Parameters<typeof removeUserFromSharing>[1];
}) => removeUserFromSharing(context, input);

const handleRequestLocationSharing = async ({
  context,
  input,
}: {
  context: Parameters<typeof requestLocationSharing>[0];
  input: Parameters<typeof requestLocationSharing>[1];
}) => requestLocationSharing(context, input);

const handleAcceptLocationSharingRequest = async ({
  context,
  input,
}: {
  context: Parameters<typeof acceptLocationSharingRequest>[0];
  input: Parameters<typeof acceptLocationSharingRequest>[1];
}) => acceptLocationSharingRequest(context, input);

const handleRejectLocationSharingRequest = async ({
  context,
  input,
}: {
  context: Parameters<typeof rejectLocationSharingRequest>[0];
  input: Parameters<typeof rejectLocationSharingRequest>[1];
}) => rejectLocationSharingRequest(context, input);

const handleGetPendingLocationSharingRequests = async ({
  context,
}: {
  context: Parameters<typeof getPendingLocationSharingRequests>[0];
}) => getPendingLocationSharingRequests(context);

const handleGetMyLocationSharingRequests = async ({
  context,
}: {
  context: Parameters<typeof getMyLocationSharingRequests>[0];
}) => getMyLocationSharingRequests(context);

export const locationRouter = createORPCRouter({
  /**
   * WebSocket subscription for updating current user's location
   * Client sends location updates through this subscription
   */
  updateLocationStream: protectedProcedure.input(locationDataSchema).handler(async function* ({
    context,
    input,
  }) {
    yield* updateLocationStream(context, input);
  }),

  /**
   * Update location sharing settings
   */
  updateSharingSettings: protectedProcedure
    .input(
      z.object({
        isSharingLocation: z.boolean(),
        userIdsToShareWith: z.array(z.string()).optional(),
        tripId: z.string().optional(),
      }),
    )
    .handler(handleUpdateSharingSettings),

  /**
   * WebSocket subscription for getting locations of friends
   * Returns real-time updates when friends' locations change.
   * Optionally accepts a radius (latitude, longitude, radiusKm) to limit events to users within the given radius.
   */
  getFriendsLocationsStream: protectedProcedure
    .input(
      z.object({
        connectionId: z.string().nullable(),
        radiusKm: z.number().positive().max(1000).optional(),
        latitude: latitudeSchema.optional(),
        longitude: longitudeSchema.optional(),
      }),
    )
    .handler(async function* ({ context, input }) {
      yield* getFriendsLocationsStream(context, input);
    }),

  /**
   * Mutation variant for updating current user's location (non-stream)
   */
  updateLocation: protectedProcedure.input(locationDataSchema).handler(handleUpdateLocation),

  /**
   * Query variant to get current user's location (non-stream)
   */
  getMyLocation: protectedProcedure.handler(handleGetMyLocation),

  /**
   * Query to get friends' last known locations (non-stream)
   */
  getFriendsLocations: protectedProcedure.handler(handleGetFriendsLocations),

  /**
   * Get sharing settings for current user
   */
  getMySharingSettings: protectedProcedure.handler(handleGetMySharingSettings),

  /**
   * Get users available for sharing selection
   */
  getAllUsersForSharing: protectedProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
        })
        .optional(),
    )
    .handler(handleGetAllUsersForSharing),

  /**
   * Add a user to sharing list
   */
  addUserToSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(handleAddUserToSharing),

  /**
   * Remove a user from sharing list
   */
  removeUserFromSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(handleRemoveUserFromSharing),

  /**
   * Send a location sharing request
   */
  requestLocationSharing: protectedProcedure
    .input(z.object({ receiverId: z.string() }))
    .handler(handleRequestLocationSharing),

  /**
   * Accept a location sharing request
   */
  acceptLocationSharingRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .handler(handleAcceptLocationSharingRequest),

  /**
   * Reject a location sharing request
   */
  rejectLocationSharingRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .handler(handleRejectLocationSharingRequest),

  /**
   * Get pending location sharing requests
   */
  getPendingLocationSharingRequests: protectedProcedure.handler(
    handleGetPendingLocationSharingRequests,
  ),

  /**
   * Get all location sharing requests (sent and received)
   */
  getMyLocationSharingRequests: protectedProcedure.handler(handleGetMyLocationSharingRequests),
});
