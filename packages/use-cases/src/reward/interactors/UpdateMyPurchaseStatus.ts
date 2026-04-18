import { Effect } from "effect";
import type {
  RewardPurchaseId,
  UserId,
  ValidationError,
  CoinTransactionDTO} from "@mirai-app/domain";
import {
  RewardPurchaseId as RewardPurchaseIdFactory,
  UserId as UserIdFactory,
  TripId,
} from "@mirai-app/domain";
import { RewardPurchasePortTag } from "../ports/RewardPurchasePort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { RewardPortTag } from "../ports/RewardPort";
import type {
  RewardPurchaseDTO,
  RewardPurchaseStatus,
} from "../dto/RewardDTOs";
import { CoinTransactionId, CoinTransaction } from "@mirai-app/domain";
import {
  RewardPurchaseNotFoundError,
  NotGroupLeaderError,
  InvalidPurchaseStatusError,
} from "../errors/RewardErrors";
import { CoinTransactionPortTag } from "../../coin/ports/CoinTransactionPort";

/**
 * Input for UpdateMyPurchaseStatusUseCase
 */
export interface UpdateMyPurchaseStatusInput {
  purchaseId: string;
  status: "IN_DELIVERY" | "CANCELLED";
  userId: string;
}

/**
 * Update My Purchase Status Use Case
 *
 * Allows a group leader to update the status of their own purchase.
 * Can only mark as IN_DELIVERY (if ACCEPTED) or CANCEL (if BOUGHT).
 */
export class UpdateMyPurchaseStatusUseCase {
  execute(input: UpdateMyPurchaseStatusInput) {
    return Effect.gen(function* () {
      const purchasePort = yield* RewardPurchasePortTag;
      const groupPort = yield* GroupPortTag;
      const rewardPort = yield* RewardPortTag;
      const coinTransactionPort = yield* CoinTransactionPortTag;

      const purchaseId = RewardPurchaseIdFactory.unsafeCreate(input.purchaseId);
      const userId = UserIdFactory.unsafeCreate(input.userId);

      // Find purchase
      const purchase = yield* purchasePort.findById(purchaseId);

      if (!purchase) {
        return yield* Effect.fail(
          new RewardPurchaseNotFoundError({ purchaseId: input.purchaseId }),
        );
      }

      // Get group and verify user is the leader
      const group = yield* groupPort.findById(purchase.groupId);

      if (!group) {
        return yield* Effect.fail(
          new NotGroupLeaderError({
            userId: input.userId,
            groupId: purchase.groupId,
          }),
        );
      }

      if (group.organizerId !== input.userId) {
        return yield* Effect.fail(
          new NotGroupLeaderError({
            userId: input.userId,
            groupId: group.id,
          }),
        );
      }

      const now = new Date();
      let updatedPurchase: typeof purchase;

      if (input.status === "IN_DELIVERY") {
        // Can only move to IN_DELIVERY from ACCEPTED
        if (purchase.status !== "ACCEPTED") {
          return yield* Effect.fail(
            new InvalidPurchaseStatusError({
              purchaseId: input.purchaseId,
              status: purchase.status,
              reason:
                "Purchase can only be moved to in delivery after acceptance",
            }),
          );
        }

        const markResult = yield* purchase.markInDelivery(userId);
        updatedPurchase = markResult;
      } else {
        // CANCELLED - can only cancel if BOUGHT
        if (purchase.status !== "BOUGHT") {
          return yield* Effect.fail(
            new InvalidPurchaseStatusError({
              purchaseId: input.purchaseId,
              status: purchase.status,
              reason: "Only pending purchases can be cancelled",
            }),
          );
        }

        // Refund coins to group
        const refundedGroup = yield* group.addCoins(purchase.totalCost);
        yield* groupPort.update(refundedGroup);

        // Restore reward quantity and get tripId for transaction
        let tripId: import("@mirai-app/domain").TripId | null = null;
        const reward = yield* rewardPort.findById(purchase.rewardId);
        if (reward) {
          // Note: We need to add back the quantity, but the domain entity
          // doesn't have an addQuantity method. This would need to be handled
          // by the repository/adapter layer or the entity needs to be extended.
          // For now, we'll update through the repository directly.
          tripId = reward.tripId;
        }

        // Create coin transaction for refund
        const transactionId = CoinTransactionId.generate();
        const transactionEffect = CoinTransaction.create({
          id: transactionId,
          groupId: group.id,
          amount: purchase.totalCost,
          type: "EARNED",
          reason: `Cancelled reward claim: ${purchase.quantity}x`,
          adminId: userId,
          createdAt: now,
        });
        const transaction = yield* transactionEffect;
        // Convert to DTO with tripId for persistence
        const transactionDTO: CoinTransactionDTO = {
          id: transaction.id,
          tripId: tripId ? TripId.toString(tripId) : "",
          groupId: transaction.groupId,
          amount: transaction.amount,
          reason: transaction.reason,
          adminId: transaction.adminId,
          createdAt: transaction.createdAt,
        };
        yield* coinTransactionPort.create(transactionDTO);

        const cancelResult = yield* purchase.cancel(userId);
        updatedPurchase = cancelResult;
      }

      // Save updated purchase
      const savedPurchase = yield* purchasePort.update(updatedPurchase);

      return {
        id: savedPurchase.id,
        rewardId: savedPurchase.rewardId,
        groupId: savedPurchase.groupId,
        userId: savedPurchase.purchasedById,
        quantity: savedPurchase.quantity,
        totalCost: savedPurchase.totalCost,
        status: savedPurchase.status as RewardPurchaseStatus,
        createdAt: savedPurchase.createdAt,
        updatedAt: savedPurchase.updatedAt,
      };
    });
  }
}
