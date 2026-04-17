import { Effect } from "effect";
import { Group } from "@mirai-app/domain";
import { GroupPort } from "../ports/GroupPort";
import type { AddCoinsResultDTO } from "../dto/GroupDTOs";
import type { DatabaseError } from "@mirai-app/domain";
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
  execute(
    input: AddCoinsToGroupInput,
  ): Effect.Effect<
    AddCoinsResultDTO,
    DatabaseError | GroupNotFoundError,
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
