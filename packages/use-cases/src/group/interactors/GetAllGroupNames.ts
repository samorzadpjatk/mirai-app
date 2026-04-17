import { Effect } from "effect";
import { GroupPort } from "../ports/GroupPort";
import type { GroupNameDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";

/**
 * Input for GetAllGroupNamesUseCase
 */
export interface GetAllGroupNamesInput {
  tripId: string;
}

/**
 * Get All Group Names Use Case
 *
 * Retrieves all group names for a trip (for moderators).
 */
export class GetAllGroupNamesUseCase {
  execute(
    input: GetAllGroupNamesInput,
  ): Effect.Effect<GroupNameDTO[], DatabaseError, GroupPort> {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPort;

      const groups = yield* groupPort.findByTripId(input.tripId);

      return groups.map((group) => ({
        id: group.id,
        name: group.name,
      }));
    });
  }
}
