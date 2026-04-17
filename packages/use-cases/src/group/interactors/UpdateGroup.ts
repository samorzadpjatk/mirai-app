import { Effect } from "effect";
import { Group } from "@mirai-app/domain";
import { GroupPort } from "../ports/GroupPort";
import type { UpdateGroupResultDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import {
  GroupNotFoundError,
  NotGroupOrganizerError,
  TripHasEndedError,
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
  execute(
    input: UpdateGroupInput,
  ): Effect.Effect<
    UpdateGroupResultDTO,
    | DatabaseError
    | GroupNotFoundError
    | NotGroupOrganizerError
    | TripHasEndedError,
    GroupPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;

      // Find the group
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check permissions
      const isOrganizer = group.organizerId === input.userId;

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
        input.organizerId !== group.organizerId
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

      return {
        id: savedGroup.id,
        name: savedGroup.name,
        description: savedGroup.description,
        image: savedGroup.image,
        organizerId:
          input.isAdmin && input.organizerId ? input.organizerId : null,
      };
    });
  }
}
