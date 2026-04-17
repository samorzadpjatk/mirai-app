import { Effect } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import { AuthServicePort } from "../ports/AuthServicePort";
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
  execute(
    input: DeleteUserInput,
  ): Effect.Effect<
    DeleteUserResultDTO,
    ApplicationError | UserNotFoundError | UserNotInTripError,
    UserPortTag | TripParticipantPort | AuthServicePort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPort;
      const authService = yield* AuthServicePort;

      // Find user by ID
      const user = yield* userPort.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
        );
      }

      // Check if user is participant of the trip
      const isParticipant = yield* participantPort.isParticipant(
        input.userId,
        input.tripId,
      );

      if (!isParticipant) {
        return yield* Effect.fail(
          new UserNotInTripError({
            userId: input.userId,
            tripId: input.tripId,
          }),
        );
      }

      // Delete participant from trip
      yield* participantPort.delete(input.userId);

      // Check remaining trips
      const remainingTrips = yield* participantPort.countByTripId(input.userId);

      let deletedFromSystem = false;

      if (remainingTrips === 0) {
        // Delete user from database
        yield* userPort.delete(input.userId);

        // Delete auth user
        yield* authService.deleteAuthUser(user.authUserId);
        deletedFromSystem = true;
      }

      return { deletedFromSystem };
    });
  }
}
