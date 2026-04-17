import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import type { GroupWithStatsDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
import { GroupNotFoundError } from "../errors/GroupErrors";

/**
 * Input for GetGroupByIdWithOrganizerUseCase
 */
export interface GetGroupByIdWithOrganizerInput {
  groupId: string;
}

/**
 * Get Group By ID With Organizer Use Case
 *
 * Retrieves a group with organizer info and stats (for moderators).
 */
export class GetGroupByIdWithOrganizerUseCase {
  execute(
    input: GetGroupByIdWithOrganizerInput,
  ): Effect.Effect<
    GroupWithStatsDTO | null,
    DatabaseError | GroupNotFoundError,
    GroupPort
  > {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;

      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted) {
        return null;
      }

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        image: group.image,
        code: group.code,
        coins: group.coins,
        participantCount: 0, // Will be hydrated by adapter
        organizer: null, // Will be hydrated by adapter
        isDeleted: group.isDeleted,
      };
    });
  }
}
