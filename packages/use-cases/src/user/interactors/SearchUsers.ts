import { Effect } from "effect";
import { TripId } from "@mirai-app/domain";
import { UserPortTag } from "../ports/UserPort";
import { TripParticipantPortTag } from "../ports/TripParticipantPort";
import { AuthServicePortTag } from "../ports/AuthServicePort";
import type { PaginatedUsersDTO, UserWithTripInfoDTO } from "../dto/UserDTOs";

/**
 * Input for SearchUsersUseCase
 */
export interface SearchUsersInput {
  tripId: TripId;
  field:
    | "firstName"
    | "lastName"
    | "email"
    | "wristNumber"
    | "houseNumber"
    | "groupName";
  searchTerm?: string;
  limit: number;
  offset: number;
}

/**
 * Search Users Use Case
 *
 * Searches users with pagination and filtering.
 */
export class SearchUsersUseCase {
  execute(input: SearchUsersInput) {
    return Effect.gen(function* () {
      const userPort = yield* UserPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const authService = yield* AuthServicePortTag;

      // Calculate pagination
      const currentPage = Math.floor(input.offset / input.limit) + 1;

      // Search users via port
      const searchResult = yield* userPort.search({
        tripId: TripId.toString(input.tripId),
        field: input.field,
        searchTerm: input.searchTerm,
        limit: input.limit,
        offset: input.offset,
      });

      // For email searches, we need to filter after fetching all and getting auth info
      let users = searchResult.users;
      let total = searchResult.total;

      if (input.field === "email") {
        // Get all participants for the trip to filter by email
        const participantsWithInfo =
          yield* participantPort.findByTripIdWithRelations(input.tripId);

        type ParticipantWithInfo = (typeof participantsWithInfo)[number];

        // Get auth info for email filtering
        const authUserIds = participantsWithInfo
          .map((p) => p.user.authUserId)
          .filter((id): id is string => id !== null);

        const authInfos = yield* authService.getUserInfosByAuthIds(authUserIds);

        // Filter by email if search term provided
        let filteredParticipants = participantsWithInfo;
        if (input.searchTerm) {
          const normalizedSearch = input.searchTerm.toLowerCase();
          filteredParticipants = participantsWithInfo.filter((info: ParticipantWithInfo) => {
            const email = info.user.authUserId
              ? authInfos.get(info.user.authUserId)?.email
              : null;
            return email?.toLowerCase().includes(normalizedSearch) ?? false;
          });
        }

        // Apply pagination
        total = filteredParticipants.length;
        const paginated = filteredParticipants.slice(
          input.offset,
          input.offset + input.limit,
        );

        // Map to DTOs
        const usersWithEmail: UserWithTripInfoDTO[] = paginated.map((info) => {
          const authInfo = info.user.authUserId
            ? authInfos.get(info.user.authUserId)
            : null;

          return {
            id: info.user.id,
            firstName: info.user.firstName,
            lastName: info.user.lastName,
            email: authInfo?.email ?? null,
            role: info.user.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
            hasAvatar: false, // Will be hydrated
            wristNumber: info.participant.wristNumber,
            houseNumber: info.participant.houseNumber,
            groupId: info.group?.id ?? null,
            groupName: info.group?.name ?? null,
            tripId: TripId.toString(input.tripId),
            isBanned: authInfo?.isBanned ?? false,
            bannedUntil: authInfo?.bannedUntil ?? null,
            banReason: authInfo?.banReason ?? null,
          };
        });

        const totalPages = Math.ceil(total / input.limit);
        const hasNextPage = input.offset + input.limit < total;

        return {
          users: usersWithEmail,
          pagination: {
            total,
            totalCount: total,
            limit: input.limit,
            offset: input.offset,
            hasMore: hasNextPage,
            hasNextPage,
            currentPage,
            totalPages,
            hasPreviousPage: currentPage > 1,
          },
        };
      }

      // For other fields, we already have paginated results
      // Get auth info for all users
      const authUserIds = users
        .map((u) => u.authUserId.toString())
        .filter((id) => id !== null && id !== undefined && id !== "");
      const authInfos = yield* authService.getUserInfosByAuthIds(authUserIds);

      // Map to DTOs
      const userDtos: UserWithTripInfoDTO[] = users.map((user) => {
        const authInfo = authInfos.get(user.authUserId);

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: authInfo?.email ?? null,
          role: user.role,
          hasAvatar: user.hasAvatar,
          wristNumber: null, // Will be populated by participant info if needed
          houseNumber: null,
          groupId: null,
          groupName: null,
          tripId: TripId.toString(input.tripId),
          isBanned: authInfo?.isBanned ?? false,
          bannedUntil: authInfo?.bannedUntil ?? null,
          banReason: authInfo?.banReason ?? null,
        };
      });

      const totalPages = Math.ceil(total / input.limit);
      const hasNextPage = input.offset + input.limit < total;

      return {
        users: userDtos,
        pagination: {
          total,
          totalCount: total,
          limit: input.limit,
          offset: input.offset,
          hasMore: hasNextPage,
          hasNextPage,
          currentPage,
          totalPages,
          hasPreviousPage: currentPage > 1,
        },
      };
    });
  }
}
