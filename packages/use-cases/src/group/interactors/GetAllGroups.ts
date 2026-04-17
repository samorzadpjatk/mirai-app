import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import type {
  PaginatedGroupsDTO,
  GroupWithParticipantsDTO,
} from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";

/**
 * Input for GetAllGroupsUseCase
 */
export interface GetAllGroupsInput {
  tripId: string;
  limit?: number;
  offset?: number;
}

/**
 * Get All Groups Use Case
 *
 * Retrieves all groups for a trip with pagination.
 */
export class GetAllGroupsUseCase {
  execute(
    input: GetAllGroupsInput,
  ): Effect.Effect<
    PaginatedGroupsDTO,
    DatabaseError,
    GroupPort | TripParticipantPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;

      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      const result = yield* groupPort.findByTripIdPaginated(input.tripId, {
        limit,
        offset,
      });

      // Get all participants for this trip to attach to groups
      const allParticipants = yield* participantPort.findByTripId(input.tripId);

      const groupsWithParticipants: GroupWithParticipantsDTO[] =
        result.groups.map((group) => {
          const groupParticipants = allParticipants.filter(
            (p) => p.groupId === group.id,
          );

          return {
            id: group.id,
            tripId: group.tripId,
            name: group.name,
            description: group.description,
            image: group.image,
            code: group.code,
            coins: group.coins,
            isDeleted: group.isDeleted,
            organizer: null, // Will be hydrated by adapter
            participants: groupParticipants.map((p) => ({
              id: p.id,
              user: {
                id: p.userId,
                firstName: "", // Will be hydrated
                lastName: "",
                email: null,
              },
              joinedAt: p.createdAt,
            })),
            coinTransactions: [], // Will be hydrated by adapter
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          };
        });

      return {
        groups: groupsWithParticipants,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
        },
      };
    });
  }
}
