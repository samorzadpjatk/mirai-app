import { Effect } from "effect";
import type {
  RewardPurchaseId,
  UserId,
  ValidationError} from "@mirai-app/domain";
import {
  RewardPurchaseId as RewardPurchaseIdFactory,
  UserId as UserIdFactory,
} from "@mirai-app/domain";
import { RewardPurchasePortTag } from "../ports/RewardPurchasePort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { RewardPortTag } from "../ports/RewardPort";
import { CoinTransactionPortTag } from "../../coin/ports/CoinTransactionPort";
import type {
  RewardPurchaseDTO,
  RewardPurchaseStatus,
} from "../dto/RewardDTOs";
import { CoinTransactionId, CoinTransaction } from "@mirai-app/domain";
import {
  RewardPurchaseNotFoundError,
  PurchaseStatusTransitionError,
  CollectionMethodRequiredError,
} from "../errors/RewardErrors";

/**
 * Valid status transitions for staff
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  BOUGHT: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY: ["DELIVERED", "CANCELLED"],
  CANCELLED: [],
  DELIVERED: [],
};

/**
 * Input for UpdatePurchaseStatusUseCase
 */
export interface UpdatePurchaseStatusInput {
  purchaseId: string;
  status: RewardPurchaseStatus;
  collectionMethod?: string;
  userId: string;
}

/**
 * Update Purchase Status Use Case
 *
 * Allows staff to update the status of any purchase.
 * Validates status transitions and handles refunds on cancellation.
 */
export class UpdatePurchaseStatusUseCase {
  execute(input: UpdatePurchaseStatusInput) {
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

      const currentStatus = purchase.status;
      const nextStatus = input.status;

      // Validate status transition
      if (currentStatus !== nextStatus) {
        const validNextStatuses = VALID_TRANSITIONS[currentStatus] ?? [];
        if (!validNextStatuses.includes(nextStatus)) {
          return yield* Effect.fail(
            new PurchaseStatusTransitionError({
              purchaseId: input.purchaseId,
              fromStatus: currentStatus,
              toStatus: nextStatus,
            }),
          );
        }
      }

      // Collection method validation
      if (nextStatus === "ACCEPTED") {
        if (!input.collectionMethod?.trim()) {
          return yield* Effect.fail(
            new CollectionMethodRequiredError({
              purchaseId: input.purchaseId,
            }),
          );
        }
      }

      if (
        nextStatus === "IN_DELIVERY" &&
        !input.collectionMethod?.trim() &&
        !purchase.collectionMethod?.trim()
      ) {
        return yield* Effect.fail(
          new CollectionMethodRequiredError({
            purchaseId: input.purchaseId,
          }),
        );
      }

      const now = new Date();
      let updatedPurchase: typeof purchase;

      // Handle cancellation refund
      if (nextStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
        const group = yield* groupPort.findById(purchase.groupId);

        if (group) {
          // Refund coins
          const refundedGroup = yield* group.addCoins(purchase.totalCost);
          yield* groupPort.update(refundedGroup);

          // Create coin transaction for refund
          const transactionId = CoinTransactionId.generate();
          const transactionEffect = CoinTransaction.create({
            id: transactionId,
            groupId: group.id,
            amount: purchase.totalCost,
            type: "EARNED",
            reason: `Refunded reward claim: ${purchase.quantity}x`,
            adminId: userId,
            createdAt: now,
          });
          const transaction = yield* transactionEffect;
          yield* coinTransactionPort.create(transaction);
        }

        // Restore reward quantity
        const reward = yield* rewardPort.findById(purchase.rewardId);
        if (reward) {
          // Note: Quantity restoration needs to be handled at repository level
          // or entity needs to support adding quantity
        }

        const cancelResult = yield* purchase.cancel(userId);
        updatedPurchase = cancelResult;
      } else if (nextStatus === "ACCEPTED") {
        const acceptResult = yield* purchase.accept(
          userId,
          input.collectionMethod!,
        );
        updatedPurchase = acceptResult;
      } else if (nextStatus === "IN_DELIVERY") {
        const deliveryResult = yield* purchase.markInDelivery(userId);

        // Update collection method if provided
        if (input.collectionMethod?.trim()) {
          const withMethod = yield* deliveryResult.withCollectionMethod(
            input.collectionMethod.trim(),
          );
          updatedPurchase = withMethod;
        } else {
          updatedPurchase = deliveryResult;
        }
      } else if (nextStatus === "DELIVERED") {
        const deliveredResult = yield* purchase.markDelivered(userId);
        updatedPurchase = deliveredResult;
      } else {
        // No state change, just update collection method if provided
        if (input.collectionMethod?.trim()) {
          const withMethod = yield* purchase.withCollectionMethod(
            input.collectionMethod.trim(),
          );
          updatedPurchase = withMethod;
        } else {
          updatedPurchase = purchase;
        }
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
