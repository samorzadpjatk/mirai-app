import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * RewardPurchaseStatus - represents the status of a reward purchase
 */
export enum RewardPurchaseStatus {
  BOUGHT = "BOUGHT",
  ACCEPTED = "ACCEPTED",
  IN_DELIVERY = "IN_DELIVERY",
  CANCELLED = "CANCELLED",
  DELIVERED = "DELIVERED",
}

/**
 * Validation rules for RewardPurchase data
 */
const VALIDATION_RULES = {
  collectionMethod: {
    maxLength: 200,
  },
};

/**
 * Valid status transitions for reward purchase workflow
 * BOUGHT -> ACCEPTED -> IN_DELIVERY -> DELIVERED
 *       -> CANCELLED
 */
const VALID_STATUS_TRANSITIONS: Record<
  RewardPurchaseStatus,
  RewardPurchaseStatus[]
> = {
  [RewardPurchaseStatus.BOUGHT]: [
    RewardPurchaseStatus.ACCEPTED,
    RewardPurchaseStatus.CANCELLED,
  ],
  [RewardPurchaseStatus.ACCEPTED]: [
    RewardPurchaseStatus.IN_DELIVERY,
    RewardPurchaseStatus.CANCELLED,
  ],
  [RewardPurchaseStatus.IN_DELIVERY]: [
    RewardPurchaseStatus.DELIVERED,
    RewardPurchaseStatus.CANCELLED,
  ],
  [RewardPurchaseStatus.CANCELLED]: [],
  [RewardPurchaseStatus.DELIVERED]: [],
};

/**
 * RewardPurchase entity - tracks reward purchases by groups
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class RewardPurchase {
  private constructor(
    public readonly id: string,
    public readonly rewardId: string,
    public readonly groupId: string,
    public readonly quantity: number,
    public readonly totalCost: number,
    public readonly status: RewardPurchaseStatus,
    public readonly collectionMethod: string | null,
    public readonly purchasedById: string,
    public readonly statusUpdatedById: string | null,
    public readonly statusUpdatedAt: Date,
    public readonly purchasedAt: Date,
  ) {}

  /**
   * Factory method to create a new RewardPurchase
   * Validates all input data
   */
  static create(props: {
    id?: string;
    rewardId: string;
    groupId: string;
    quantity: number;
    totalCost: number;
    status?: RewardPurchaseStatus;
    collectionMethod?: string | null;
    purchasedById: string;
    statusUpdatedById?: string | null;
    statusUpdatedAt?: Date;
    purchasedAt?: Date;
  }): Result<RewardPurchase, string> {
    // Validate rewardId
    if (!props.rewardId || props.rewardId.trim() === "") {
      return err("rewardId is required");
    }

    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate quantity
    if (props.quantity < 1) {
      return err("quantity must be at least 1");
    }

    // Validate totalCost
    if (props.totalCost < 0) {
      return err("totalCost must be non-negative");
    }

    // Validate purchasedById
    if (!props.purchasedById || props.purchasedById.trim() === "") {
      return err("purchasedById is required");
    }

    // Validate collectionMethod if provided
    if (
      props.collectionMethod &&
      props.collectionMethod.length >
        VALIDATION_RULES.collectionMethod.maxLength
    ) {
      return err(
        `collectionMethod must be at most ${VALIDATION_RULES.collectionMethod.maxLength} characters`,
      );
    }

    const now = new Date();
    const status = props.status ?? RewardPurchaseStatus.BOUGHT;

    return ok(
      new RewardPurchase(
        props.id ?? crypto.randomUUID(),
        props.rewardId.trim(),
        props.groupId.trim(),
        props.quantity,
        props.totalCost,
        status,
        props.collectionMethod ?? null,
        props.purchasedById.trim(),
        props.statusUpdatedById ?? null,
        props.statusUpdatedAt ?? now,
        props.purchasedAt ?? now,
      ),
    );
  }

  /**
   * Update status
   * Returns a new RewardPurchase instance (immutable)
   */
  updateStatus(
    newStatus: RewardPurchaseStatus,
    updatedById: string,
  ): Result<RewardPurchase, string> {
    if (!this.canTransitionTo(newStatus)) {
      return err(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    if (!updatedById || updatedById.trim() === "") {
      return err("updatedById is required");
    }

    return ok(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        newStatus,
        this.collectionMethod,
        this.purchasedById,
        updatedById.trim(),
        new Date(),
        this.purchasedAt,
      ),
    );
  }

  /**
   * Accept the purchase
   */
  accept(updatedById: string): Result<RewardPurchase, string> {
    return this.updateStatus(RewardPurchaseStatus.ACCEPTED, updatedById);
  }

  /**
   * Mark as in delivery
   */
  startDelivery(updatedById: string): Result<RewardPurchase, string> {
    return this.updateStatus(RewardPurchaseStatus.IN_DELIVERY, updatedById);
  }

  /**
   * Mark as delivered
   */
  deliver(updatedById: string): Result<RewardPurchase, string> {
    return this.updateStatus(RewardPurchaseStatus.DELIVERED, updatedById);
  }

  /**
   * Cancel the purchase
   */
  cancel(updatedById: string): Result<RewardPurchase, string> {
    return this.updateStatus(RewardPurchaseStatus.CANCELLED, updatedById);
  }

  /**
   * Update collection method
   * Returns a new RewardPurchase instance (immutable)
   */
  updateCollectionMethod(
    method: string | null,
  ): Result<RewardPurchase, string> {
    if (
      method !== null &&
      method.length > VALIDATION_RULES.collectionMethod.maxLength
    ) {
      return err(
        `collectionMethod must be at most ${VALIDATION_RULES.collectionMethod.maxLength} characters`,
      );
    }

    return ok(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        this.status,
        method,
        this.purchasedById,
        this.statusUpdatedById,
        this.statusUpdatedAt,
        this.purchasedAt,
      ),
    );
  }

  /**
   * Check if status can transition to new status
   */
  canTransitionTo(newStatus: RewardPurchaseStatus): boolean {
    const validTransitions = VALID_STATUS_TRANSITIONS[this.status];
    return validTransitions.includes(newStatus);
  }

  /**
   * Check if purchase is in a terminal state
   */
  isTerminal(): boolean {
    return (
      this.status === RewardPurchaseStatus.DELIVERED ||
      this.status === RewardPurchaseStatus.CANCELLED
    );
  }

  /**
   * Check if purchase is pending (not yet accepted)
   */
  isPending(): boolean {
    return this.status === RewardPurchaseStatus.BOUGHT;
  }

  /**
   * Check if purchase is in progress
   */
  isInProgress(): boolean {
    return (
      this.status === RewardPurchaseStatus.ACCEPTED ||
      this.status === RewardPurchaseStatus.IN_DELIVERY
    );
  }

  /**
   * Check if purchase is completed
   */
  isCompleted(): boolean {
    return this.status === RewardPurchaseStatus.DELIVERED;
  }

  /**
   * Check if purchase is cancelled
   */
  isCancelled(): boolean {
    return this.status === RewardPurchaseStatus.CANCELLED;
  }

  /**
   * Check if purchase has collection method specified
   */
  hasCollectionMethod(): boolean {
    return this.collectionMethod !== null && this.collectionMethod.length > 0;
  }

  /**
   * Get cost per unit
   */
  getCostPerUnit(): number {
    return this.quantity > 0 ? Math.round(this.totalCost / this.quantity) : 0;
  }
}

/**
 * Check if a purchase status transition is valid
 * Standalone function for use outside of class instances
 */
export function canTransitionPurchaseStatus(
  from: RewardPurchaseStatus,
  to: RewardPurchaseStatus,
): boolean {
  if (from === to) return true;
  return VALID_STATUS_TRANSITIONS[from].includes(to);
}
