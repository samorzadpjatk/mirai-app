import type { User, TripParticipant, AuthUserInfo } from "@mirai-app/domain";
import { UserId, TripId, AuthUserId } from "@mirai-app/domain";
import { Effect } from "effect";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import { GroupPortTag } from "../../group/ports/GroupPort";
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
  execute(input: GetUserByIdInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const authServicePort = yield* AuthServicePortTag;
      const groupPort = yield* GroupPortTag;

      // Convert string IDs to branded IDs
      const userId = UserId.unsafeCreate(input.userId);
      const tripId = input.tripId ? TripId.unsafeCreate(input.tripId) : null;

      // Find user by ID
      const user = yield* userPort.findById(userId);

      if (!user) {
        return null;
      }

      // If tripId provided, get participant info
      let participant: TripParticipant | null = null;
      if (tripId) {
        participant = yield* participantPort.findByUserAndTrip(userId, tripId);
      }

      // Fetch auth info (for email and ban status)
      const authInfoTask = authServicePort.getUserInfoByAuthId(
        AuthUserId.toString(user.authUserId),
      );

      // Fetch group info if participant has groupId
      const groupTask = participant?.groupId
        ? groupPort.findById(participant.groupId).pipe(
            Effect.map((group) =>
              group ? { id: group.id.toString(), name: group.name } : null,
            ),
          )
        : Effect.succeed(null);

      // Execute all fetches in parallel
      const [authInfo, groupInfo] = yield* Effect.all(
        [authInfoTask, groupTask] as const,
        { concurrency: "unbounded" },
      );

      // Map to fully-populated DTO
      const result: UserWithTripInfoDTO = {
        id: user.id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: authInfo?.email ?? null,
        role: user.role,
        hasAvatar: user.hasAvatar,
        wristNumber: participant?.wristNumber ?? null,
        houseNumber: participant?.houseNumber ?? null,
        groupId: participant?.groupId ? participant.groupId.toString() : null,
        groupName: groupInfo?.name ?? null,
        tripId: input.tripId ?? "",
        isBanned: authInfo?.isBanned ?? false,
        bannedUntil: authInfo?.bannedUntil ?? null,
        banReason: authInfo?.banReason ?? null,
      };

      return result;
    });
  }
}
