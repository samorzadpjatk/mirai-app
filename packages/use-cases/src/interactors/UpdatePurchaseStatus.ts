import { Effect } from "effect";
import {
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
} from "../ports/RewardRepository";
import {
  canTransitionPurchaseStatus,
  RewardPurchaseStatus,
  RewardId,
} from "@mirai-app/domain";
import type { RewardPurchase } from "@mirai-app/domain";

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
 * Error when purchase is not found
 */
export class PurchaseNotFoundError extends Error {
  readonly _tag = "PurchaseNotFoundError";
  constructor() {
    super("Purchase not found");
  }
}

/**
 * Error when user is not authorized
 */
export class NotAuthorizedError extends Error {
  readonly _tag = "NotAuthorizedError";
  constructor() {
    super("Not authorized to update this purchase");
  }
}

/**
 * Error when status transition is invalid
 */
export class InvalidPurchaseStatusTransitionError extends Error {
  readonly _tag = "InvalidPurchaseStatusTransitionError";
  constructor(
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(`Cannot change status from ${fromStatus} to ${toStatus}`);
  }
}

/**
 * Error when validation fails
 */
export class UpdatePurchaseValidationError extends Error {
  readonly _tag = "UpdatePurchaseValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error when operation fails
 */
export class UpdatePurchaseOperationError extends Error {
  readonly _tag = "UpdatePurchaseOperationError";
  constructor(
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

/**
 * UpdatePurchaseStatus Use Case (Effect-based)
 *
 * Updates the status of a reward purchase.
 * Handles state machine validation and refunds when cancelling.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = updatePurchaseStatusUseCase(input).pipe(
 *   Effect.provideService(RewardPurchaseRepositoryTag, purchaseRepo),
 *   Effect.provideService(RewardRepositoryTag, rewardRepo),
 *   Effect.provideService(GroupCoinsServiceTag, coinsService),
 *   Effect.provideService(TripAccessCheckerTag, accessChecker),
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updatePurchaseStatusUseCase(
  input: UpdatePurchaseStatusInput,
): Effect.Effect<
  UpdatePurchaseStatusOutput,
  | PurchaseNotFoundError
  | NotAuthorizedError
  | InvalidPurchaseStatusTransitionError
  | UpdatePurchaseValidationError
  | UpdatePurchaseOperationError,
  | RewardPurchaseRepositoryTag
  | RewardRepositoryTag
  | GroupCoinsServiceTag
  | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;
    const purchaseRepo = yield* RewardPurchaseRepositoryTag;
    const coinsService = yield* GroupCoinsServiceTag;
    const accessChecker = yield* TripAccessCheckerTag;

    // Find the purchase
    const purchase = yield* purchaseRepo
      .findById(input.purchaseId)
      .pipe(
        Effect.mapError(
          (cause) => new UpdatePurchaseOperationError("find purchase", cause),
        ),
      );

    if (!purchase) {
      return yield* Effect.fail(new PurchaseNotFoundError());
    }

    // Verify user has permission (staff or group leader)
    const isStaff = yield* accessChecker
      .isStaff(input.updatedById)
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdatePurchaseOperationError("check staff status", cause),
        ),
      );
    const leaderCheck = yield* accessChecker
      .isGroupLeader(
        input.updatedById,
        "", // TripId not needed for this check
      )
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdatePurchaseOperationError("check group leader", cause),
        ),
      );

    // Staff can update any purchase
    // Group leaders can only update their own group's purchases
    if (!isStaff && leaderCheck.groupId !== purchase.groupId) {
      return yield* Effect.fail(new NotAuthorizedError());
    }

    // Check if status transition is valid
    if (!canTransitionPurchaseStatus(purchase.status, input.newStatus)) {
      return yield* Effect.fail(
        new InvalidPurchaseStatusTransitionError(
          purchase.status,
          input.newStatus,
        ),
      );
    }

    // Validate collection method for ACCEPTED status
    if (input.newStatus === "ACCEPTED") {
      const method = input.collectionMethod ?? purchase.collectionMethod;
      if (!method || method.trim() === "") {
        return yield* Effect.fail(
          new UpdatePurchaseValidationError(
            "Collection method is required when accepting a purchase",
          ),
        );
      }
    }

    // Validate collection method for IN_DELIVERY if not already set
    if (
      input.newStatus === "IN_DELIVERY" &&
      !purchase.collectionMethod &&
      (!input.collectionMethod || input.collectionMethod.trim() === "")
    ) {
      return yield* Effect.fail(
        new UpdatePurchaseValidationError(
          "Collection method must be provided before moving to in delivery",
        ),
      );
    }

    // Handle refund if cancelling
    let refunded = false;
    if (input.newStatus === "CANCELLED" && purchase.status !== "CANCELLED") {
      // Refund coins to group
      yield* coinsService
        .addCoins(
          purchase.groupId,
          purchase.totalCost,
          `Refunded reward claim: ${purchase.quantity}x reward`,
          input.updatedById,
        )
        .pipe(
          Effect.mapError(
            (cause) => new UpdatePurchaseOperationError("refund coins", cause),
          ),
        );

      // Restore reward quantity
      yield* rewardRepo
        .incrementQuantity(
          RewardId.unsafeCreate(purchase.rewardId),
          purchase.quantity,
        )
        .pipe(
          Effect.mapError(
            (cause) =>
              new UpdatePurchaseOperationError(
                "restore reward quantity",
                cause,
              ),
          ),
        );

      refunded = true;
    }

    // Update purchase status
    const updated = yield* purchaseRepo
      .updateStatus(
        input.purchaseId,
        input.newStatus,
        input.updatedById,
        input.collectionMethod,
      )
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdatePurchaseOperationError("update purchase status", cause),
        ),
      );

    return {
      purchaseId: updated.id,
      rewardId: updated.rewardId,
      groupId: updated.groupId,
      quantity: updated.quantity,
      totalCost: updated.totalCost,
      status: updated.status,
      collectionMethod: updated.collectionMethod,
      statusUpdatedById: updated.statusUpdatedById ?? input.updatedById,
      statusUpdatedAt: updated.statusUpdatedAt,
      refunded,
    };
  });
}
