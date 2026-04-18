import { Effect } from "effect";
import { CoinTransactionPortTag } from "../ports/CoinTransactionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { CoinTransactionId, GroupId, UserId } from "@mirai-app/domain";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";
import { UserNotFoundError } from "../../user/errors/UserErrors";
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
  ) {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;

      // Fetch group and admin in parallel for validation
      const [group, admin] = yield* Effect.all([
        groupPort.findById(GroupId.unsafeCreate(input.groupId)),
        userPort.findById(UserId.unsafeCreate(input.adminId)),
      ]);

      if (!group || group.isDeleted || group.tripId !== input.tripId) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      if (!admin) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.adminId }),
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
        GroupId.unsafeCreate(input.groupId),
        input.amount,
      );

      // Create transaction record (negative amount for removal)
      const transactionId = CoinTransactionId.generate();
      const transaction = yield* coinPort.create({
        id: transactionId,
        tripId: input.tripId,
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
        admin: {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
        },
      };
    });
  }
}
