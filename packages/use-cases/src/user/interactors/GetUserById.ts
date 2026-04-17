import type { User, TripParticipant, ApplicationError } from "@mirai-app/domain";
import { Effect } from "effect";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import type { UserWithTripInfoDTO } from "../dto/UserDTOs";

/**
 * Input for GetUserByIdUseCase
 */
export interface GetUserByIdInput {
  userId: string;
  tripId?: string;
}

/**
 * Get User by ID Use Case
 *
 * Retrieves a user by their ID, optionally with trip participant information.
 */
export class GetUserByIdUseCase {
  execute(
    input: GetUserByIdInput,
  ): Effect.Effect<
    UserWithTripInfoDTO | null,
    ApplicationError,
    UserPortTag | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPort;

      // Find user by ID
      const user = yield* userPort.findById(
        input.userId as unknown as import("@mirai-app/domain").UserId,
      );

      if (!user) {
        return null;
      }

      // If tripId provided, get participant info
      let participant: TripParticipant | null = null;
      if (input.tripId) {
        participant = yield* participantPort.findByUserAndTrip(
          input.userId,
          input.tripId,
        );
      }

      // Map to DTO
      const result: UserWithTripInfoDTO = {
        id: (user as unknown as { id: { value: string } }).id.value,
        firstName: user.firstName,
        lastName: user.lastName,
        email: null, // Will be hydrated by adapter layer with auth info
        role: user.role,
        hasAvatar: user.hasAvatar,
        wristNumber: participant?.wristNumber ?? null,
        houseNumber: participant?.houseNumber ?? null,
        groupId: participant?.groupId
          ? (participant.groupId as unknown as { value: string }).value
          : null,
        groupName: null, // Will be hydrated by adapter layer
        tripId: input.tripId ?? "",
        isBanned: false, // Will be hydrated by adapter layer
        bannedUntil: null,
        banReason: null,
      };

      return result;
    });
  }
}
