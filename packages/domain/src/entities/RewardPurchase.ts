import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestampsWithNow } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

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
 * State machine for RewardPurchase status transitions
 */
const stateMachine = createStateMachine<RewardPurchaseStatus>({
  transitions: {
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
  },
  terminalStates: [
    RewardPurchaseStatus.CANCELLED,
    RewardPurchaseStatus.DELIVERED,
  ],
});

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
    public status: RewardPurchaseStatus,
    public collectionMethod: string | null,
    public readonly purchasedById: string,
    public statusUpdatedById: string | null,
    public statusUpdatedAt: Date,
    public readonly purchasedAt: Date,
  ) {}

  /**
   * Factory method to create a new RewardPurchase
   * Validates all input data
   *
   * Returns Effect<RewardPurchase, ValidationError, never>
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
  }): Effect.Effect<RewardPurchase, ValidationError, never> {
    // Validate rewardId
    const rewardId = validate.id(props.rewardId, "rewardId");
    if (isError(rewardId)) {
      return Effect.fail(
        new ValidationError({
          message: rewardId.error.message,
          field: "rewardId",
        }),
      );
    }

    // Validate groupId
    const groupId = validate.id(props.groupId, "groupId");
    if (isError(groupId)) {
      return Effect.fail(
        new ValidationError({
          message: groupId.error.message,
          field: "groupId",
        }),
      );
    }

    // Validate quantity
    const quantity = validate.number(props.quantity, "quantity", {
      required: true,
      min: 1,
      integer: true,
    });
    if (isError(quantity)) {
      return Effect.fail(
        new ValidationError({
          message: quantity.error.message,
          field: "quantity",
        }),
      );
    }

    // Validate totalCost
    const totalCost = validate.number(props.totalCost, "totalCost", {
      required: true,
      min: 0,
    });
    if (isError(totalCost)) {
      return Effect.fail(
        new ValidationError({
          message: totalCost.error.message,
          field: "totalCost",
        }),
      );
    }

    // Validate purchasedById
    const purchasedById = validate.id(props.purchasedById, "purchasedById");
    if (isError(purchasedById)) {
      return Effect.fail(
        new ValidationError({
          message: purchasedById.error.message,
          field: "purchasedById",
        }),
      );
    }

    // Validate collectionMethod if provided
    let collectionMethod: string | null = null;
    if (props.collectionMethod) {
      const validated = validate.string(
        props.collectionMethod,
        "collectionMethod",
        {
          required: false,
          maxLength: 200,
        },
      );
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "collectionMethod",
          }),
        );
      }
      collectionMethod = validated.value;
    }

    const now = new Date();
    const ts = timestampsWithNow(now, {
      createdAt: props.purchasedAt,
      updatedAt: props.statusUpdatedAt,
    });

    return Effect.succeed(
      new RewardPurchase(
        props.id ?? crypto.randomUUID(),
        rewardId.value,
        groupId.value,
        quantity.value,
        totalCost.value,
        props.status ?? RewardPurchaseStatus.BOUGHT,
        collectionMethod,
        purchasedById.value,
        props.statusUpdatedById ?? null,
        ts.updatedAt,
        ts.createdAt,
      ),
    );
  }

  /**
   * Update status
   * Returns an Effect with new RewardPurchase instance or error
   */
  updateStatus(
    newStatus: RewardPurchaseStatus,
    updatedById: string,
  ): Effect.Effect<
    RewardPurchase,
    ValidationError | StateTransitionError,
    never
  > {
    if (!stateMachine.canTransition(this.status, newStatus)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: newStatus,
          entityType: "RewardPurchase",
        }),
      );
    }

    const validated = validate.id(updatedById, "updatedById");
    if (isError(validated)) {
      return Effect.fail(
        new ValidationError({
          message: validated.error.message,
          field: "updatedById",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        {
          status: newStatus,
          statusUpdatedById: validated.value,
          statusUpdatedAt: new Date(),
        },
        RewardPurchase,
      ),
    );
  }

  /**
   * Accept the purchase
   */
  accept(
    updatedById: string,
  ): Effect.Effect<
    RewardPurchase,
    ValidationError | StateTransitionError,
    never
  > {
    return this.updateStatus(RewardPurchaseStatus.ACCEPTED, updatedById);
  }

  /**
   * Mark as in delivery
   */
  startDelivery(
    updatedById: string,
  ): Effect.Effect<
    RewardPurchase,
    ValidationError | StateTransitionError,
    never
  > {
    return this.updateStatus(RewardPurchaseStatus.IN_DELIVERY, updatedById);
  }

  /**
   * Mark as delivered
   */
  deliver(
    updatedById: string,
  ): Effect.Effect<
    RewardPurchase,
    ValidationError | StateTransitionError,
    never
  > {
    return this.updateStatus(RewardPurchaseStatus.DELIVERED, updatedById);
  }

  /**
   * Cancel the purchase
   */
  cancel(
    updatedById: string,
  ): Effect.Effect<
    RewardPurchase,
    ValidationError | StateTransitionError,
    never
  > {
    return this.updateStatus(RewardPurchaseStatus.CANCELLED, updatedById);
  }

  /**
   * Update collection method
   * Returns an Effect with new RewardPurchase instance or ValidationError
   */
  updateCollectionMethod(
    method: string | null,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    if (method !== null) {
      const validated = validate.string(method, "collectionMethod", {
        required: false,
        maxLength: 200,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "collectionMethod",
          }),
        );
      }
    }

    return Effect.succeed(
      updateEntity(this, { collectionMethod: method }, RewardPurchase),
    );
  }

  /**
   * Check if status can transition to new status
   */
  canTransitionTo(newStatus: RewardPurchaseStatus): boolean {
    return stateMachine.canTransition(this.status, newStatus);
  }

  /**
   * Check if purchase is in a terminal state
   */
  isTerminal(): boolean {
    return stateMachine.isTerminal(this.status);
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
  return stateMachine.canTransition(from, to);
}
