import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import type {
  GroupWithParticipantsDTO,
  GroupMemberDTO,
} from "../dto/GroupDTOs";
import { TripId, UserId, GroupId, CoinTransactionId } from "@mirai-app/domain";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { CoinTransactionPortTag } from "../../coin/ports/CoinTransactionPort";
import type { CoinTransactionDTO } from "../../coin/dto/CoinDTOs";

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
  execute(input: GetAllGroupsInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const userPort = yield* UserPortTag;
      const coinTransactionPort = yield* CoinTransactionPortTag;

      const tripId = TripId.unsafeCreate(input.tripId);
      const limit = input.limit ?? 30;
      const offset = input.offset ?? 0;

      const result = yield* groupPort.findByTripIdPaginated(tripId, {
        limit,
        offset,
      });

      // Get all participants for this trip to attach to groups
      const allParticipants = yield* participantPort.findByTripId(tripId);

      // Build DTOs with fully populated data for each group
      const groupDTOEffects = result.groups.map((group) => {
        return Effect.gen(function* () {
          const groupParticipants = allParticipants.filter(
            (p) => p.groupId === group.id,
          );

          // Fetch organizer and coin transactions in parallel
          const [organizerUser, coinTransactions] = yield* Effect.all([
            userPort.findById(group.organizerId),
            coinTransactionPort.findByGroupId(group.id),
          ]);

          // Fetch all participant users in parallel
          const participantUsers =
            groupParticipants.length > 0
              ? yield* Effect.all(
                  groupParticipants.map((p) =>
                    userPort.findById(UserId.unsafeCreate(p.userId)),
                  ),
                )
              : [];

          // Build fully-populated participant DTOs
          const populatedParticipants = groupParticipants.map((p, index) => {
            const user = participantUsers[index];
            const memberDTO: GroupMemberDTO = {
              id: user?.id ?? UserId.unsafeCreate(p.userId),
              firstName: user?.firstName ?? "",
              lastName: user?.lastName ?? "",
              email: null,
            };
            return {
              id: p.id,
              user: memberDTO,
              joinedAt: p.createdAt,
            };
          });

          // Map domain coin transactions to use-cases DTO format with branded IDs
          const mappedCoinTransactions: CoinTransactionDTO[] =
            coinTransactions.map((tx) => ({
              id: CoinTransactionId.unsafeCreate(tx.id),
              groupId: GroupId.unsafeCreate(tx.groupId),
              amount: tx.amount,
              reason: tx.reason,
              adminId: tx.adminId
                ? UserId.unsafeCreate(tx.adminId)
                : UserId.generate(),
              createdAt: tx.createdAt,
            }));

          // Build fully-populated group DTO
          const groupDTO: GroupWithParticipantsDTO = {
            id: group.id,
            tripId: group.tripId,
            name: group.name,
            description: group.description,
            image: group.image,
            code: group.code,
            coins: group.coins,
            isDeleted: group.isDeleted,
            organizer: organizerUser
              ? {
                  id: organizerUser.id,
                  firstName: organizerUser.firstName,
                  lastName: organizerUser.lastName,
                  email: null,
                }
              : null,
            participants: populatedParticipants,
            coinTransactions: mappedCoinTransactions,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
          };

          return groupDTO;
        });
      });

      // Execute all group DTO builds in parallel
      const groupsWithParticipants =
        groupDTOEffects.length > 0
          ? yield* Effect.all(groupDTOEffects)
          : [];

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
