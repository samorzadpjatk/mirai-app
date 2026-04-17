import { Effect } from "effect";
import { UserId } from "@mirai-app/domain";
import { LocationPort } from "../ports/LocationPort";
import type { PendingLocationSharingRequestsDTO } from "../dto/LocationDTOs";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Input for GetPendingLocationSharingRequestsUseCase
 */
export interface GetPendingLocationSharingRequestsInput {
  userId: string;
}

/**
 * Get Pending Location Sharing Requests Use Case
 *
 * Retrieves pending location sharing requests received by the user.
 */
export class GetPendingLocationSharingRequestsUseCase {
  execute(
    input: GetPendingLocationSharingRequestsInput,
  ): Effect.Effect<
    PendingLocationSharingRequestsDTO,
    ApplicationError,
    LocationPort
  > {
    return Effect.gen(function* () {
      const locationPort = yield* LocationPort;

      const userId = UserId.unsafeCreate(input.userId);
      const requests =
        yield* locationPort.findPendingSharingRequestsByReceiver(userId);

      // Note: User details (sender) will be hydrated by the adapter layer
      const requestDTOs = requests.map((request) => ({
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
        requests: requestDTOs,
      };
    });
  }
}
