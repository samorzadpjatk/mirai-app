import { Effect, Either } from "effect";
import {
  GroupId,
  TripId,
  UserId,
  CoinTransactionId,
} from "@mirai-app/domain";
import type {
  ChallengeSubmission,
} from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { TripPortTag } from "../../trip/ports/TripPort";
import { CoinTransactionPortTag } from "../../coin/ports/CoinTransactionPort";
import { ChallengeSubmissionPortTag } from "../../challenge-submission/ports/ChallengeSubmissionPort";
import type {
  GroupWithSubmissionsDTO,
  GroupMemberDTO,
} from "../dto/GroupDTOs";
import type { GroupParticipantDTO } from "../dto/GroupDTOs";
import type { CoinTransactionDTO } from "../../coin/dto/CoinDTOs";
import { GroupNotFoundError } from "../errors/GroupErrors";
import { TripNotFoundError } from "../../trip/errors/TripErrors";

/**
 * Input for GetGroupByIdUseCase
 */
export interface GetGroupByIdInput {
  groupId: string;
}

/**
 * Get Group By ID Use Case
 *
 * Retrieves a group by ID with participants and approved submissions.
 */
export class GetGroupByIdUseCase {
  execute(input: GetGroupByIdInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const userPort = yield* UserPortTag;
      const tripPort = yield* TripPortTag;
      const coinTransactionPort = yield* CoinTransactionPortTag;
      const challengeSubmissionPort = yield* ChallengeSubmissionPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Fetch all related data in parallel where independent
      const [tripResult, participants, coinTransactions, submissions] =
        yield* Effect.all([
          Effect.either(tripPort.findById(TripId.unsafeCreate(group.tripId))),
          participantPort.findByTripId(group.tripId),
          coinTransactionPort.findByGroupId(GroupId.toString(groupId)),
          challengeSubmissionPort.findByGroupId(groupId),
        ]);

      // Handle trip not found
      if (Either.isLeft(tripResult) || !tripResult.right) {
        return yield* Effect.fail(
          new TripNotFoundError({ tripId: group.tripId }),
        );
      }
      const trip = tripResult.right;

      // Filter participants for this group
      const groupParticipants = participants.filter(
        (p) => p.groupId === group.id,
      );

      // Collect all user IDs needed (organizer + participants)
      const userIds = new Set<string>();
      if (group.organizerId) {
        userIds.add(group.organizerId);
      }
      for (const p of groupParticipants) {
        userIds.add(p.userId);
      }

      // Fetch all users in parallel with error handling
      const userEffects = Array.from(userIds).map((userId) =>
        Effect.either(userPort.findById(UserId.unsafeCreate(userId))),
      );
      const userResults = userEffects.length > 0
        ? yield* Effect.all(userEffects)
        : [];

      // Build user lookup map
      const userMap = new Map<
        string,
        { firstName: string; lastName: string }
      >();
      const userIdArray = Array.from(userIds);
      for (let i = 0; i < userIdArray.length; i++) {
        const userId = userIdArray[i];
        const result = userResults[i];
        if (userId && result && Either.isRight(result) && result.right) {
          userMap.set(userId, {
            firstName: result.right.firstName,
            lastName: result.right.lastName,
          });
        }
      }

      // Build organizer DTO
      const organizer: GroupMemberDTO | null =
        group.organizerId && userMap.has(group.organizerId)
          ? {
              id: UserId.unsafeCreate(group.organizerId),
              firstName: userMap.get(group.organizerId)?.firstName ?? "",
              lastName: userMap.get(group.organizerId)?.lastName ?? "",
              email: null,
            }
          : null;

      // Build participants DTO with user data
      const participantsDTO: GroupParticipantDTO[] = groupParticipants.map(
        (p) => {
          const user = userMap.get(p.userId);
          return {
            id: p.id,
            user: {
              id: UserId.unsafeCreate(p.userId),
              firstName: user?.firstName ?? "",
              lastName: user?.lastName ?? "",
              email: null,
            },
            joinedAt: p.createdAt,
          };
        },
      );

      // Filter and map approved submissions
      const approvedSubmissions = submissions
        .filter((s: ChallengeSubmission) => s.status === "APPROVED")
        .map((s) => ({
          submissionId: s.id,
          challengeId: s.challengeId,
          challengeTitle: "",
          imageStoragePath: s.imageIds[0] ?? "",
          approvedAt: s.updatedAt,
        }));

      // Map domain coin transactions to DTO format
      const mappedCoinTransactions: CoinTransactionDTO[] = coinTransactions.map(
        (tx) => ({
          id: CoinTransactionId.unsafeCreate(tx.id),
          groupId: GroupId.unsafeCreate(tx.groupId),
          amount: tx.amount,
          reason: tx.reason,
          adminId: tx.adminId
            ? UserId.unsafeCreate(tx.adminId)
            : ("" as UserId),
          createdAt: tx.createdAt,
        }),
      );

      const result: GroupWithSubmissionsDTO = {
        id: group.id,
        tripId: TripId.unsafeCreate(group.tripId),
        name: group.name,
        description: group.description,
        image: group.image,
        code: group.code,
        coins: group.coins,
        isDeleted: group.isDeleted,
        organizer,
        participants: participantsDTO,
        coinTransactions: mappedCoinTransactions,
        approvedSubmissions,
        trip: {
          id: trip.id,
          name: trip.name,
        },
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };

      return result;
    });
  }
}
