import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { CoinTransactionPortTag } from "../../coin/ports/CoinTransactionPort";
import type { GroupWithParticipantsDTO, GroupMemberDTO } from "../dto/GroupDTOs";
import type { CoinTransactionDTO } from "../../coin/dto/CoinDTOs";
import { TripId, UserId, GroupId, CoinTransactionId } from "@mirai-app/domain";

/**
 * Input for GetMyGroupUseCase
 */
export interface GetMyGroupInput {
  userId: string;
  tripId: string;
}

/**
 * Get My Group Use Case
 *
 * Retrieves the current user's group with participants.
 */
export class GetMyGroupUseCase {
  execute(input: GetMyGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const userPort = yield* UserPortTag;
      const coinPort = yield* CoinTransactionPortTag;

      const userId = UserId.unsafeCreate(input.userId);
      const tripId = TripId.unsafeCreate(input.tripId);

      // Find user's participant record for this trip
      const participant = yield* participantPort.findByUserAndTrip(
        userId,
        tripId,
      );

      if (!participant || !participant.groupId) {
        return null;
      }

      // Get the group
      const group = yield* groupPort.findById(participant.groupId);

      if (!group || group.isDeleted) {
        return null;
      }

      // Get all participants for this group
      const participants = yield* participantPort.findByTripId(tripId);
      const groupParticipants = participants.filter(
        (p) => p.groupId === group.id,
      );

      // Fetch organizer and coin transactions in parallel
      const [organizer, coinTransactionsRaw] = yield* Effect.all([
        userPort.findById(group.organizerId).pipe(
          Effect.map((user): GroupMemberDTO | null =>
            user
              ? {
                  id: user.id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: null,
                }
              : null,
          ),
        ),
        coinPort.findByGroupId(group.id),
      ]);

      // Fetch user details for all participants in parallel
      const participantUsers = yield* Effect.all(
        groupParticipants.map((p) =>
          userPort.findById(p.userId).pipe(
            Effect.map((user): GroupMemberDTO | null =>
              user
                ? {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: null,
                  }
                : null,
            ),
          ),
        ),
      );

      // Transform coin transactions to use-cases DTO format with branded IDs
      const coinTransactions: CoinTransactionDTO[] = coinTransactionsRaw.map(
        (tx) => ({
          id: CoinTransactionId.unsafeCreate(tx.id),
          groupId: GroupId.unsafeCreate(tx.groupId),
          amount: tx.amount,
          reason: tx.reason,
          adminId: tx.adminId
            ? UserId.unsafeCreate(tx.adminId)
            : UserId.generate(),
          createdAt: tx.createdAt,
        }),
      );

      // Build participant DTOs, filtering out any where user lookup failed
      const participantDTOs = groupParticipants
        .map((p, index) => {
          const user = participantUsers[index];
          if (!user) return null;
          return {
            id: p.id,
            user,
            joinedAt: p.createdAt,
          };
        })
        .filter((dto): dto is NonNullable<typeof dto> => dto !== null);

      return {
        id: group.id,
        tripId: group.tripId,
        name: group.name,
        description: group.description,
        image: group.image,
        code: group.code,
        coins: group.coins,
        isDeleted: group.isDeleted,
        organizer,
        participants: participantDTOs,
        coinTransactions,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      } satisfies GroupWithParticipantsDTO;
    });
  }
}
