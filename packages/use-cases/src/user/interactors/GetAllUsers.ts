import { Effect } from "effect";
import type { ApplicationError } from "@mirai-app/domain";
import { TripParticipantPort } from "../ports/TripParticipantPort";
import { AuthServicePort } from "../ports/AuthServicePort";
import type { PaginatedUsersDTO, UserWithTripInfoDTO } from "../dto/UserDTOs";

/**
 * Input for GetAllUsersUseCase
 */
export interface GetAllUsersInput {
  tripId: string;
}

/**
 * Get All Users Use Case
 *
 * Retrieves all users for a trip with their participant info.
 */
export class GetAllUsersUseCase {
  execute(
    input: GetAllUsersInput,
  ): Effect.Effect<
    UserWithTripInfoDTO[],
    ApplicationError,
    TripParticipantPort | AuthServicePort
  > {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPort;
      const authService = yield* AuthServicePort;

      // Find all participants for the trip with user and group info
      const participantsWithInfo =
        yield* participantPort.findByTripIdWithRelations(input.tripId);

      // Get auth user IDs to fetch email and ban info
      const authUserIds = participantsWithInfo
        .map((p) => p.user.authUserId)
        .filter((id): id is string => id !== null);

      // Get auth info for all users
      const authInfos = yield* authService.getUserInfosByAuthIds(authUserIds);

      // Map to DTOs
      const result: UserWithTripInfoDTO[] = participantsWithInfo.map((info) => {
        const authInfo = info.user.authUserId
          ? authInfos.get(info.user.authUserId)
          : null;

        return {
          id: info.user.id,
          firstName: info.user.firstName,
          lastName: info.user.lastName,
          email: authInfo?.email ?? null,
          role: info.user.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
          hasAvatar: false, // Will be hydrated by adapter
          wristNumber: info.participant.wristNumber,
          houseNumber: info.participant.houseNumber,
          groupId: info.group?.id ?? null,
          groupName: info.group?.name ?? null,
          tripId: input.tripId,
          isBanned: authInfo?.isBanned ?? false,
          bannedUntil: authInfo?.bannedUntil ?? null,
          banReason: authInfo?.banReason ?? null,
        };
      });

      return result;
    });
  }
}
