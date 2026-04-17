import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import { GroupPort } from "../../group/ports/GroupPort";
import type { CoinTransactionWithDetailsDTO } from "../dto/CoinDTOs";
import type { ApplicationError } from "@mirai-app/domain";
import { CoinTransactionId, GroupId, UserId } from "@mirai-app/domain";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";
import { InsufficientCoinsError } from "../errors/CoinErrors";

/**
 * Input for RemoveCoinsUseCase
 */
export interface RemoveCoinsInput {
  tripId: string;
  groupId: string;
  amount: number;
  reason?: string;
  adminId: string;
}

/**
 * Remove Coins Use Case
 *
 * Removes coins from a group and creates a transaction record.
 */
export class RemoveCoinsUseCase {
  execute(
    input: RemoveCoinsInput,
  ): Effect.Effect<
    CoinTransactionWithDetailsDTO,
    ApplicationError | GroupNotFoundError | InsufficientCoinsError,
    CoinTransactionPort | GroupPort
  > {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPort;
      const groupPort = yield* GroupPort;

      // Find the group
      const group = yield* groupPort.findById(input.groupId);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Check if group has enough coins
      if (group.coins < input.amount) {
        return yield* Effect.fail(
          new InsufficientCoinsError({
            groupId: input.groupId,
            required: input.amount,
            available: group.coins,
          }),
        );
      }

      // Remove coins from group
      const updatedGroup = yield* groupPort.subtractCoins(
        input.groupId,
        input.amount,
      );

      // Create transaction record (negative amount for removal)
      const transactionId = CoinTransactionId.generate();
      const transaction = yield* coinPort.create({
        id: transactionId,
        groupId: input.groupId,
        amount: -input.amount,
        reason: input.reason ?? null,
        adminId: input.adminId,
        createdAt: new Date(),
      });

      return {
        id: transactionId,
        groupId: GroupId.unsafeCreate(input.groupId),
        amount: transaction.amount,
        reason: transaction.reason,
        adminId: UserId.unsafeCreate(input.adminId),
        createdAt: transaction.createdAt,
        group: {
          id: updatedGroup.id,
          name: updatedGroup.name,
          coins: updatedGroup.coins,
        },
        admin: null, // Will be hydrated by adapter
      };
    });
  }
}
