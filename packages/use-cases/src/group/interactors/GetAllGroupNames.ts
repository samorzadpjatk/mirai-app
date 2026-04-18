import { Effect } from "effect";
import { GroupPortTag } from "../ports/GroupPort";
import type { GroupNameDTO } from "../dto/GroupDTOs";
import { TripId } from "@mirai-app/domain";

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
  execute(input: GetAllGroupNamesInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;

      const tripId = TripId.unsafeCreate(input.tripId);
      const groups = yield* groupPort.findByTripId(tripId);

      return groups.map((group) => ({
        id: group.id,
        name: group.name,
      }));
    });
  }
}
