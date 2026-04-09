import type { Result, RewardPurchaseStatus } from "@mirai-app/domain";
import {
  ok,
  err,
  canTransitionPurchaseStatus,
  REWARD_PURCHASE_STATUSES,
} from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  GroupCoinsService,
  TripAccessChecker,
  PaginationOptions,
  PaginatedResult,
} from "../ports/RewardRepository";

/**
 * User-facing status update options (subset of full status transitions)
 */
const USER_ALLOWED_TRANSITIONS: Record<string, RewardPurchaseStatus[]> = {
  BOUGHT: ["CANCELLED"],
  ACCEPTED: ["IN_DELIVERY"],
  IN_DELIVERY: [],
  CANCELLED: [],
  DELIVERED: [],
};

/**
 * Input for UpdateMyPurchaseStatus use case
 * (for group leaders managing their own purchases)
 */
export interface UpdateMyPurchaseStatusInput {
  purchaseId: string;
  newStatus: "IN_DELIVERY" | "CANCELLED";
  updatedById: string;
}

/**
 * Output DTO for UpdateMyPurchaseStatus use case
 */
export interface UpdateMyPurchaseStatusOutput {
  purchaseId: string;
  rewardId: string;
  groupId: string;
  quantity: number;
  totalCost: number;
  status: string;
  statusUpdatedAt: Date;
  refunded: boolean;
}

/**
 * UpdateMyPurchaseStatus Use Case
 *
 * Allows group leaders to update their own purchase status.
 * Limited transitions compared to admin updates:
 * - BOUGHT -> CANCELLED (with refund)
 * - ACCEPTED -> IN_DELIVERY
 */
export class UpdateMyPurchaseStatusUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(
    input: UpdateMyPurchaseStatusInput,
  ): Promise<Result<UpdateMyPurchaseStatusOutput, string>> {
    // Find the purchase
    const purchase = await this.purchaseRepository.findById(input.purchaseId);
    if (!purchase) {
      return err("Purchase not found");
    }

    // Verify user is the group leader for this purchase
    const leaderCheck = await this.accessChecker.isGroupLeader(
      input.updatedById,
      "",
    );

    if (leaderCheck.groupId !== purchase.groupId) {
      return err("Only the group leader can update this purchase");
    }

    // Check if this transition is allowed for users
    const allowedTransitions = USER_ALLOWED_TRANSITIONS[purchase.status] ?? [];
    if (!allowedTransitions.includes(input.newStatus)) {
      return err(
        `Cannot change status from ${purchase.status} to ${input.newStatus}`,
      );
    }

    // For CANCELLED, must be in BOUGHT status
    if (input.newStatus === "CANCELLED" && purchase.status !== "BOUGHT") {
      return err("Only pending purchases can be cancelled");
    }

    // For IN_DELIVERY, must be in ACCEPTED status
    if (input.newStatus === "IN_DELIVERY" && purchase.status !== "ACCEPTED") {
      return err("Purchase can be moved to in delivery only after acceptance");
    }

    // Handle refund if cancelling
    let refunded = false;
    if (input.newStatus === "CANCELLED") {
      // Refund coins to group
      await this.coinsService.addCoins(
        purchase.groupId,
        purchase.totalCost.toNumber(),
        `Cancelled reward claim by user: ${purchase.quantity}x reward`,
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
      null,
    );

    return ok({
      purchaseId: updated.id,
      rewardId: updated.rewardId,
      groupId: updated.groupId,
      quantity: updated.quantity,
      totalCost: updated.totalCost.toNumber(),
      status: updated.status,
      statusUpdatedAt: updated.statusUpdatedAt,
      refunded,
    });
  }
}
