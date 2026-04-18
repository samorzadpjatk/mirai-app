import { Effect } from "effect";
import { CoinTransactionPortTag } from "../ports/CoinTransactionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { CoinTransactionId, GroupId, UserId } from "@mirai-app/domain";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";
import { UserNotFoundError } from "../../user/errors/UserErrors";

/**
 * Input for AddCoinsUseCase
 */
export interface AddCoinsInput {
  tripId: string;
  groupId: string;
  amount: number;
  reason?: string;
  adminId: string;
}

/**
 * Add Coins Use Case
 *
 * Adds coins to a group and creates a transaction record.
 */
export class AddCoinsUseCase {
  execute(input: AddCoinsInput) {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;

      const groupId = GroupId.unsafeCreate(input.groupId);
      const adminId = UserId.unsafeCreate(input.adminId);

      // Find the group and admin in parallel
      const [group, admin] = yield* Effect.all([
        groupPort.findById(groupId),
        userPort.findById(adminId),
      ]);

      if (!group || group.isDeleted) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      if (!admin) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.adminId }),
        );
      }

      // Add coins to group
      const updatedGroup = yield* groupPort.addCoins(groupId, input.amount);

      // Create transaction record
      const transactionId = CoinTransactionId.generate();
      const transaction = yield* coinPort.create({
        id: CoinTransactionId.toString(transactionId),
        tripId: input.tripId,
        groupId: GroupId.toString(groupId),
        amount: input.amount,
        reason: input.reason ?? null,
        adminId: UserId.toString(adminId),
        createdAt: new Date(),
      });

      return {
        id: transactionId,
        groupId: groupId,
        amount: transaction.amount,
        reason: transaction.reason,
        adminId: adminId,
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
