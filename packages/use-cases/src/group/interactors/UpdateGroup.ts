import { Effect } from "effect";
import { Group, GroupId, TripId, UserId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import type { UpdateGroupResultDTO } from "../dto/GroupDTOs";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
} from "../errors/GroupErrors";

/**
 * Input for UpdateGroupUseCase
 */
export interface UpdateGroupInput {
  groupId: string;
  tripId: string;
  userId: string;
  isAdmin: boolean;
  name?: string;
  description?: string;
  image?: string;
  organizerId?: string;
}

/**
 * Update Group Use Case
 *
 * Updates group information (only organizer or admin can update).
 */
export class UpdateGroupUseCase {
  execute(input: UpdateGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;

      // Find the group
      const groupId = GroupId.unsafeCreate(input.groupId);
      const tripId = TripId.unsafeCreate(input.tripId);
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted || !TripId.equals(group.tripId, tripId)) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check permissions
      const userId = UserId.unsafeCreate(input.userId);
      const isOrganizer = UserId.equals(group.organizerId, userId);

      if (!input.isAdmin && !isOrganizer) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.userId,
            groupId: input.groupId,
          }),
        );
      }

      // Only admin can change organizer
      if (
        !input.isAdmin &&
        input.organizerId &&
        !UserId.equals(UserId.unsafeCreate(input.organizerId), group.organizerId)
      ) {
        return yield* Effect.fail(
          new NotGroupOrganizerError({
            userId: input.userId,
            groupId: input.groupId,
          }),
        );
      }

      // Update group details
      const updatedGroupEffect = group.withDetails({
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
      });

      const updatedGroup = yield* updatedGroupEffect;

      // Save updated group
      const savedGroup = yield* groupPort.update(updatedGroup);

      const resultOrganizerId =
        input.isAdmin && input.organizerId
          ? UserId.unsafeCreate(input.organizerId)
          : null;

      return {
        id: savedGroup.id,
        name: savedGroup.name,
        description: savedGroup.description,
        image: savedGroup.image,
        organizerId: resultOrganizerId,
      } as UpdateGroupResultDTO;
    });
  }
}
