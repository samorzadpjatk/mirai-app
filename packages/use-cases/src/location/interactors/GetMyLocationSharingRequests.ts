import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import type { MyLocationSharingRequestsDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Input for GetMyLocationSharingRequestsUseCase
 */
export interface GetMyLocationSharingRequestsInput {
  userId: string;
}

/**
 * Get My Location Sharing Requests Use Case
 *
 * Retrieves all location sharing requests (sent and received) for the user.
 */
export class GetMyLocationSharingRequestsUseCase {
  execute(
    input: GetMyLocationSharingRequestsInput,
  ): Effect.Effect<MyLocationSharingRequestsDTO, ApplicationError, LocationPort> {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;

      const userId = UserId.unsafeCreate(input.userId);

      // Get sent and received requests in parallel
      const [sent, received] = yield* Effect.all([
        locationPort.findSharingRequestsBySender(userId),
        locationPort.findSharingRequestsByReceiver(userId),
      ]);

      // Note: User details will be hydrated by the adapter layer
      const sentDTOs = sent.map((request) => ({
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        sender: null, // Will be hydrated by adapter
        receiver: null,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }));

      const receivedDTOs = received.map((request) => ({
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        sender: null, // Will be hydrated by adapter
        receiver: null,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }));

      return {
        sent: sentDTOs,
        received: receivedDTOs,
      };
    });
  }
}
