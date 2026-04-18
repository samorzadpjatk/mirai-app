import { Effect } from "effect";
import { Group, GroupId, TripId, UserId } from "@mirai-app/domain";
import { GroupPortTag } from "../ports/GroupPort";
import type { AddCoinsResultDTO } from "../dto/GroupDTOs";
import { GroupNotFoundError } from "../errors/GroupErrors";

/**
 * Input for AddCoinsToGroupUseCase
 */
export interface AddCoinsToGroupInput {
  groupId: string;
  tripId: string;
  amount: number;
  adminId: string;
}

/**
 * Add Coins To Group Use Case
 *
 * Adds coins to a group (moderator only).
 */
export class AddCoinsToGroupUseCase {
  execute(input: AddCoinsToGroupInput) {
    return Effect.gen(function* () {
      const groupPort = yield* GroupPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const tripId = TripId.unsafeCreate(input.tripId);

      // Find the group
      const group = yield* groupPort.findById(groupId);

      if (!group || group.isDeleted || !TripId.equals(group.tripId, tripId)) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      const previousCoins = group.coins;

      // Add coins using domain method
      const updatedGroup = yield* group.addCoins(input.amount);

      // Save updated group
      yield* groupPort.update(updatedGroup);

      return {
        groupId: group.id,
        previousCoins,
        newCoins: updatedGroup.coins,
        amount: input.amount,
      };
    });
  }
}
