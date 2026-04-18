import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import { TripParticipantPortTag } from "../../user/ports/TripParticipantPort";
import { GroupJoinRequestPortTag } from "../ports/GroupJoinRequestPort";
import type {
  BulkAssignResultDTO,
  GroupParticipantDTO,
} from "../dto/GroupDTOs";
import { GroupId, TripId, UserId, TripParticipantId, TripParticipant } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
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
  execute(input: BulkAssignUsersToGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;
      const participantPort = yield* TripParticipantPortTag;
      const joinRequestPort = yield* GroupJoinRequestPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const tripId = TripId.unsafeCreate(input.tripId);
      const requestingUserId = UserId.unsafeCreate(input.requestingUserId);

      // Find the group
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted || !TripId.equals(group.tripId, tripId)) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if user is the organizer
      if (!UserId.equals(group.organizerId, requestingUserId)) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.requestingUserId,
            groupId: input.groupId,
          }),
        );
      }

      const uniqueUserIds = Array.from(new Set(input.userIds)).map((id) => UserId.unsafeCreate(id));

      // Assign all users to group
      const assignedParticipants = yield* Effect.all(
        uniqueUserIds.map((userId) =>
          Effect.gen(function* () {
            const existing = yield* participantPort.findByUserAndTrip(
              userId,
              tripId,
            );
            const participant = yield* TripParticipant.create({
              id: existing?.id ?? TripParticipantId.generate(),
              userId: userId,
              tripId: tripId,
              groupId: group.id,
              wristNumber: existing?.wristNumber ?? null,
              houseNumber: existing?.houseNumber ?? null,
              role: existing?.role ?? "MEMBER",
              createdAt: existing?.createdAt ?? new Date(),
              updatedAt: new Date(),
            });
            return yield* participantPort.upsert(participant);
          }),
        ),
      );

      // Delete join requests for all assigned users
      yield* joinRequestPort.deleteByUsersAndTrip(uniqueUserIds, tripId);

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
