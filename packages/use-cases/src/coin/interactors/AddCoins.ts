import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import { GroupPort } from "../../group/ports/GroupPort";
import type { CoinTransactionWithDetailsDTO } from "../dto/CoinDTOs";
import type {
  ApplicationError,
  CoinTransactionId,
  GroupId,
  UserId,
} from "@mirai-app/domain";
import { CoinTransactionId as CoinTransactionIdFactory } from "@mirai-app/domain";
import { GroupId as GroupIdFactory } from "@mirai-app/domain";
import { UserId as UserIdFactory } from "@mirai-app/domain";
import { GroupNotFoundError } from "../../group/errors/GroupErrors";

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
  execute(
    input: AddCoinsInput,
  ): Effect.Effect<
    CoinTransactionWithDetailsDTO,
    ApplicationError | GroupNotFoundError,
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

      // Add coins to group
      const updatedGroup = yield* groupPort.addCoins(
        input.groupId,
        input.amount,
      );

      // Create transaction record
      const transactionId = CoinTransactionIdFactory.generate();
      const transaction = yield* coinPort.create({
        id: transactionId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason ?? null,
        adminId: input.adminId,
        createdAt: new Date(),
      });

      return {
        id: transactionId,
        groupId: GroupIdFactory.unsafeCreate(input.groupId),
        amount: transaction.amount,
        reason: transaction.reason,
        adminId: UserIdFactory.unsafeCreate(input.adminId),
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
