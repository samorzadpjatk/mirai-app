import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import { TripParticipantPort } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPort } from "../ports/GroupJoinRequestPort";
import type {
  BulkAssignResultDTO,
  GroupParticipantDTO,
} from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
  TripHasEndedError,
} from "../errors/GroupErrors";

/**
 * Input for BulkAssignUsersToGroupUseCase
 */
export interface BulkAssignUsersToGroupInput {
  tripId: string;
  groupId: string;
  userIds: string[];
  requestingUserId: string;
}

/**
 * Bulk Assign Users To Group Use Case
 *
 * Bulk assigns multiple users to a group (organizer only).
 */
export class BulkAssignUsersToGroupUseCase {
  execute(
    input: BulkAssignUsersToGroupInput,
  ): Effect.Effect<
    BulkAssignResultDTO,
    | DatabaseError
    | GroupNotFoundError
    | NotGroupOrganizerError
    | TripHasEndedError,
    GroupPort | TripParticipantPort | GroupJoinRequestPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;
      const participantPort = yield* TripParticipantPort;
      const joinRequestPort = yield* GroupJoinRequestPort;

      // Find the group
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is the organizer
      if (group.organizerId !== input.requestingUserId) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.requestingUserId,
            groupId: input.groupId,
          }),
        );
      }

      const uniqueUserIds = Array.from(new Set(input.userIds));

      // Assign all users to group
      const assignedParticipants = yield* Effect.all(
        uniqueUserIds.map((userId) =>
          Effect.gen(function* () {
            const existing = yield* participantPort.findByUserAndTrip(
              userId,
              input.tripId,
            );
            return yield* participantPort.upsert({
              id: existing?.id ?? "",
              userId,
              tripId: input.tripId,
              groupId: group.id,
              wristNumber: existing?.wristNumber ?? null,
              houseNumber: existing?.houseNumber ?? null,
              role: existing?.role ?? "MEMBER",
              createdAt: existing?.createdAt ?? new Date(),
              updatedAt: new Date(),
            });
          }),
        ),
      );

      // Delete join requests for all assigned users
      yield* joinRequestPort.deleteByUsersAndTrip(uniqueUserIds, input.tripId);

      const participants: GroupParticipantDTO[] = assignedParticipants.map(
        (p) => ({
          id: p.id,
          user: {
            id: p.userId,
            firstName: "", // Will be hydrated
            lastName: "",
            email: null,
          },
          joinedAt: p.createdAt,
        }),
      );

      return {
        count: participants.length,
        participants,
      };
    });
  }
}
