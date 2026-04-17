import type { RewardPurchaseId } from "../value-objects/RewardId";
import type { RewardId } from "../value-objects/RewardId";
import type { GroupId } from "../../group/value-objects/GroupId";
import type { UserId } from "../../user/value-objects/UserId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Reward Purchase Status Enum
 */
export type RewardPurchaseStatus =
  | "BOUGHT"
  | "ACCEPTED"
  | "IN_DELIVERY"
  | "CANCELLED"
  | "DELIVERED";

/**
 * Reward Purchase Domain Entity
 *
 * Represents a purchase of a reward by a group.
 */
export class RewardPurchase {
  private constructor(
    readonly id: RewardPurchaseId,
    readonly rewardId: RewardId,
    readonly groupId: GroupId,
    readonly quantity: number,
    readonly totalCost: number,
    readonly status: RewardPurchaseStatus,
    readonly purchasedById: UserId,
    readonly statusUpdatedById: UserId | null,
    readonly statusUpdatedAt: Date | null,
    readonly collectionMethod: string | null,
    readonly purchasedAt: Date,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a RewardPurchase entity
   */
  static create(props: {
    id: RewardPurchaseId;
    rewardId: RewardId;
    groupId: GroupId;
    quantity: number;
    totalCost: number;
    status?: RewardPurchaseStatus;
    purchasedById: UserId;
    statusUpdatedById?: UserId | null;
    statusUpdatedAt?: Date | null;
    collectionMethod?: string | null;
    purchasedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<RewardPurchase, ValidationError, never> {
    if (props.quantity <= 0) {
      return Effect.fail(
        new ValidationError({
          field: "quantity",
          message: "Quantity must be positive",
          value: props.quantity,
        }),
      );
    }

    if (props.totalCost < 0) {
      return Effect.fail(
        new ValidationError({
          field: "totalCost",
          message: "Total cost cannot be negative",
          value: props.totalCost,
        }),
      );
    }

    const validStatuses: RewardPurchaseStatus[] = [
      "BOUGHT",
      "ACCEPTED",
      "IN_DELIVERY",
      "CANCELLED",
      "DELIVERED",
    ];
    const status = props.status ?? "BOUGHT";

    if (!validStatuses.includes(status)) {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: "Invalid purchase status",
          value: status,
        }),
      );
    }

    const collectionMethod = props.collectionMethod?.trim() ?? null;
    if (collectionMethod && collectionMethod.length > 500) {
      return Effect.fail(
        new ValidationError({
          field: "collectionMethod",
          message: "Collection method must be at most 500 characters",
          value: props.collectionMethod,
        }),
      );
    }

    return Effect.succeed(
      new RewardPurchase(
        props.id,
        props.rewardId,
        props.groupId,
        props.quantity,
        props.totalCost,
        status,
        props.purchasedById,
        props.statusUpdatedById ?? null,
        props.statusUpdatedAt ?? null,
        collectionMethod,
        props.purchasedAt ?? new Date(),
        props.createdAt,
        props.updatedAt,
      ),
    );
  }

  /**
   * Check if the purchase can be cancelled
   */
  canBeCancelled(): boolean {
    return this.status === "BOUGHT";
  }

  /**
   * Check if the purchase can be marked as in delivery
   */
  canBeMarkedInDelivery(): boolean {
    return this.status === "ACCEPTED";
  }

  /**
   * Check if the purchase is in a final state
   */
  isFinalState(): boolean {
    return this.status === "DELIVERED" || this.status === "CANCELLED";
  }

  /**
   * Transition to ACCEPTED status
   */
  accept(
    statusUpdatedById: UserId,
    collectionMethod: string,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    if (this.status !== "BOUGHT") {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: `Cannot accept purchase from status: ${this.status}`,
          value: this.status,
        }),
      );
    }

    const trimmedMethod = collectionMethod.trim();
    if (trimmedMethod.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "collectionMethod",
          message: "Collection method is required when accepting a purchase",
          value: collectionMethod,
        }),
      );
    }

    if (trimmedMethod.length > 500) {
      return Effect.fail(
        new ValidationError({
          field: "collectionMethod",
          message: "Collection method must be at most 500 characters",
          value: collectionMethod,
        }),
      );
    }

    return Effect.succeed(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        "ACCEPTED",
        this.purchasedById,
        statusUpdatedById,
        new Date(),
        trimmedMethod,
        this.purchasedAt,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Transition to IN_DELIVERY status
   */
  markInDelivery(
    statusUpdatedById: UserId,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    if (this.status !== "ACCEPTED") {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: `Cannot mark in delivery from status: ${this.status}`,
          value: this.status,
        }),
      );
    }

    return Effect.succeed(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        "IN_DELIVERY",
        this.purchasedById,
        statusUpdatedById,
        new Date(),
        this.collectionMethod,
        this.purchasedAt,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Transition to DELIVERED status
   */
  markDelivered(
    statusUpdatedById: UserId,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    if (this.status !== "IN_DELIVERY") {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: `Cannot mark delivered from status: ${this.status}`,
          value: this.status,
        }),
      );
    }

    return Effect.succeed(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        "DELIVERED",
        this.purchasedById,
        statusUpdatedById,
        new Date(),
        this.collectionMethod,
        this.purchasedAt,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Transition to CANCELLED status
   */
  cancel(
    statusUpdatedById: UserId,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    if (this.isFinalState()) {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: `Cannot cancel purchase in final state: ${this.status}`,
          value: this.status,
        }),
      );
    }

    return Effect.succeed(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        "CANCELLED",
        this.purchasedById,
        statusUpdatedById,
        new Date(),
        this.collectionMethod,
        this.purchasedAt,
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Update collection method
   */
  withCollectionMethod(
    collectionMethod: string,
  ): Effect.Effect<RewardPurchase, ValidationError, never> {
    const trimmed = collectionMethod.trim();

    if (trimmed.length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "collectionMethod",
          message: "Collection method cannot be empty",
          value: collectionMethod,
        }),
      );
    }

    if (trimmed.length > 500) {
      return Effect.fail(
        new ValidationError({
          field: "collectionMethod",
          message: "Collection method must be at most 500 characters",
          value: collectionMethod,
        }),
      );
    }

    return Effect.succeed(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        this.status,
        this.purchasedById,
        this.statusUpdatedById,
        this.statusUpdatedAt,
        trimmed,
        this.purchasedAt,
        this.createdAt,
        new Date(),
      ),
    );
  }
}
