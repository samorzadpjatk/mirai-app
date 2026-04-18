import { Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";
import { UserId, TripId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { DeleteUserResultDTO } from "../dto/UserDTOs";
import { UserNotFoundError, UserNotInTripError } from "../errors/UserErrors";

/**
 * Input for DeleteUserUseCase
 */
export interface DeleteUserInput {
  userId: string;
  tripId: string;
}

/**
 * Delete User Use Case
 *
 * Deletes a user from a trip and from the system if they have no remaining trips.
 */
export class DeleteUserUseCase {
  execute(input: DeleteUserInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const authService = yield* AuthServicePortTag;

      // Convert strings to branded IDs
      const userId = UserId.unsafeCreate(input.userId);
      const tripId = TripId.unsafeCreate(input.tripId);

      // Find user by ID
      const user = yield* userPort.findById(userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
        );
      }

      // Check if user is participant of the trip
      const isParticipant = yield* participantPort.isParticipant(
        userId,
        tripId,
      );

      if (!isParticipant) {
        return yield* Effect.fail(
          new UserNotInTripError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Delete participant from trip (use userId as that's the lookup key)
      yield* participantPort.deleteByUserAndTrip(userId, tripId);

      // Check remaining trips
      const remainingTrips = yield* participantPort.countByUserId(userId);

      let deletedFromSystem = false;

      if (remainingTrips === 0) {
        // Delete user from database
        yield* userPort.delete(userId);

        // Delete auth user
        yield* authService.deleteAuthUser(user.authUserId);
        deletedFromSystem = true;
      }

      return { deletedFromSystem };
    });
  }
}
