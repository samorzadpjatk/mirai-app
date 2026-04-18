import { Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";
import { TripId, UserId } from "@mirai-app/domain";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import { UserPortTag } from "../ports/UserPort";
import type { UserWithTripInfoDTO } from "../dto/UserDTOs";

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
  execute(input: GetAllUsersInput) {
    return Effect.gen(function* () {
      const participantPort = yield* TripParticipantPortTag;
      const authService = yield* AuthServicePortTag;
      const userPort = yield* UserPortTag;

      // Convert string to branded TripId
      const tripId = TripId.unsafeCreate(input.tripId);

      // Find all participants for the trip with user and group info
      const participantsWithInfo =
        yield* participantPort.findByTripIdWithRelations(tripId);

      // Get auth user IDs to fetch email and ban info
      const authUserIds = participantsWithInfo
        .map((p: { user: { authUserId: string | null } }) => p.user.authUserId)
        .filter((id: string | null): id is string => id !== null);

      // Get auth info for all users in parallel
      const authInfos = yield* authService.getUserInfosByAuthIds(authUserIds);

      // Fetch full user data for each participant to get hasAvatar
      const userFetchEffects = participantsWithInfo.map(
        (info: { user: { id: string } }) =>
          Effect.gen(function* () {
            const userId = UserId.unsafeCreate(info.user.id);
            const user = yield* userPort.findById(userId);
            return { userId: info.user.id, user };
          }),
      );

      const userResults = yield* Effect.all(userFetchEffects, {
        concurrency: "unbounded",
      });

      // Create a map of userId -> hasAvatar for quick lookup
      const userHasAvatarMap = new Map<string, boolean>();
      for (const result of userResults) {
        userHasAvatarMap.set(result.userId, result.user?.hasAvatar ?? false);
      }

      // Map to DTOs with fully populated data
      const result: UserWithTripInfoDTO[] = participantsWithInfo.map(
        (info: {
          user: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            authUserId: string | null;
          };
          participant: {
            wristNumber: string | null;
            houseNumber: string | null;
          };
          group: { id: string; name: string } | null;
        }) => {
          const authInfo = info.user.authUserId
            ? authInfos.get(info.user.authUserId)
            : null;

          return {
            id: info.user.id,
            firstName: info.user.firstName,
            lastName: info.user.lastName,
            email: authInfo?.email ?? null,
            role: info.user.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
            hasAvatar: userHasAvatarMap.get(info.user.id) ?? false,
            wristNumber: info.participant.wristNumber,
            houseNumber: info.participant.houseNumber,
            groupId: info.group?.id ?? null,
            groupName: info.group?.name ?? null,
            tripId: input.tripId,
            isBanned: authInfo?.isBanned ?? false,
            bannedUntil: authInfo?.bannedUntil ?? null,
            banReason: authInfo?.banReason ?? null,
          };
        },
      );

      return result;
    });
  }
}
