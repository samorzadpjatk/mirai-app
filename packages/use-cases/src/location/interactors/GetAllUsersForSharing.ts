import { Effect } from "effect";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { UserId, TripId } from "@mirai-app/domain";

/**
 * Input for GetAllUsersForSharingUseCase
 */
export interface GetAllUsersForSharingInput {
  userId: string;
  tripId?: string;
}

/**
 * Get All Users For Sharing Use Case
 *
 * Retrieves users available for location sharing selection.
 */
export class GetAllUsersForSharingUseCase {
  execute(input: GetAllUsersForSharingInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;
      const userPort = yield* UserPortTag;

      const userId = UserId.unsafeCreate(input.userId);

      // Get shareable users (trip participants excluding current user)
      let shareableUserIds: string[] = [];

      if (input.tripId) {
        const tripId = TripId.unsafeCreate(input.tripId);
        // Check if user is participant of the trip
        const isParticipant = yield* participantPort.isParticipant(
          userId,
          tripId,
        );

        if (!isParticipant) {
          return { users: [] };
        }

        const participants = yield* participantPort.findByTripId(tripId);
        shareableUserIds = participants
          .map((p) => UserId.toString(p.userId))
          .filter((id) => id !== input.userId);
      } else {
        // Get all users from all trips the current user participates in
        const userParticipants = yield* participantPort.findByUserId(userId);
        const uniqueUserIds = new Set<string>();

        for (const participant of userParticipants) {
          const tripParticipants = yield* participantPort.findByTripId(
            participant.tripId,
          );
          for (const tp of tripParticipants) {
            if (!UserId.equals(tp.userId, userId)) {
              uniqueUserIds.add(UserId.toString(tp.userId));
            }
          }
        }

        shareableUserIds = [...uniqueUserIds];
      }

      if (shareableUserIds.length === 0) {
        return { users: [] };
      }

      // Fetch all user details in parallel
      const userEffects = shareableUserIds.map((id) =>
        userPort.findById(UserId.unsafeCreate(id)),
      );
      const users = yield* Effect.all(userEffects, {
        concurrency: "unbounded",
      });

      // Filter out any null users and map to DTOs with full data
      const validUsers = users
        .filter((user): user is NonNullable<typeof user> => user !== null)
        .map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.hasAvatar ? `avatar/${UserId.toString(user.id)}` : null,
        }));

      return { users: validUsers };
    });
  }
}
