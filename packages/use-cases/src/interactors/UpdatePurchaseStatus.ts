import type { Result, RewardPurchaseStatus } from "@mirai-app/domain";
import { ok, err, canTransitionPurchaseStatus } from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  GroupCoinsService,
  TripAccessChecker,
} from "../ports/RewardRepository";

/**
 * Input for UpdatePurchaseStatus use case
 */
export interface UpdatePurchaseStatusInput {
  purchaseId: string;
  newStatus: RewardPurchaseStatus;
  updatedById: string;
  collectionMethod?: string | null;
}

/**
 * Output DTO for UpdatePurchaseStatus use case
 */
export interface UpdatePurchaseStatusOutput {
  purchaseId: string;
  rewardId: string;
  groupId: string;
  quantity: number;
  totalCost: number;
  status: string;
  collectionMethod: string | null;
  statusUpdatedById: string;
  statusUpdatedAt: Date;
  refunded: boolean;
}

/**
 * UpdatePurchaseStatus Use Case
 *
 * Updates the status of a reward purchase.
 * Handles state machine validation and refunds when cancelling.
 * Validates:
 * - Status transition is valid according to state machine
 * - User has permission to update (staff or group leader)
 * - Collection method provided for ACCEPTED status
 */
export class UpdatePurchaseStatusUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(
    input: UpdatePurchaseStatusInput,
  ): Promise<Result<UpdatePurchaseStatusOutput, string>> {
    // Find the purchase
    const purchase = await this.purchaseRepository.findById(input.purchaseId);
    if (!purchase) {
      return err("Purchase not found");
    }

    // Verify user has permission (staff or group leader)
    const isStaff = await this.accessChecker.isStaff(input.updatedById);
    const leaderCheck = await this.accessChecker.isGroupLeader(
      input.updatedById,
      "", // TripId not needed for this check
    );

    // Staff can update any purchase
    // Group leaders can only update their own group's purchases
    if (!isStaff && leaderCheck.groupId !== purchase.groupId) {
      return err("Not authorized to update this purchase");
    }

    // Check if status transition is valid
    if (!canTransitionPurchaseStatus(purchase.status, input.newStatus)) {
      return err(
        `Cannot change status from ${purchase.status} to ${input.newStatus}`,
      );
    }

    // Validate collection method for ACCEPTED status
    if (input.newStatus === "ACCEPTED") {
      const method = input.collectionMethod ?? purchase.collectionMethod;
      if (!method || method.trim() === "") {
        return err("Collection method is required when accepting a purchase");
      }
    }

    // Validate collection method for IN_DELIVERY if not already set
    if (
      input.newStatus === "IN_DELIVERY" &&
      !purchase.collectionMethod &&
      (!input.collectionMethod || input.collectionMethod.trim() === "")
    ) {
      return err(
        "Collection method must be provided before moving to in delivery",
      );
    }

    // Handle refund if cancelling
    let refunded = false;
    if (input.newStatus === "CANCELLED" && purchase.status !== "CANCELLED") {
      // Refund coins to group
      await this.coinsService.addCoins(
        purchase.groupId,
        purchase.totalCost.toNumber(),
        `Refunded reward claim: ${purchase.quantity}x reward`,
        input.updatedById,
      );

      // Restore reward quantity
      await this.rewardRepository.incrementQuantity(
        purchase.rewardId,
        purchase.quantity,
      );

      refunded = true;
    }

    // Update purchase status
    const updated = await this.purchaseRepository.updateStatus(
      input.purchaseId,
      input.newStatus,
      input.updatedById,
      input.collectionMethod,
    );

    return ok({
      purchaseId: updated.id,
      rewardId: updated.rewardId,
      groupId: updated.groupId,
      quantity: updated.quantity,
      totalCost: updated.totalCost.toNumber(),
      status: updated.status,
      collectionMethod: updated.collectionMethod,
      statusUpdatedById: updated.statusUpdatedById ?? input.updatedById,
      statusUpdatedAt: updated.statusUpdatedAt,
      refunded,
    });
  }
}
