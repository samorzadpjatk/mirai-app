import { Data, Effect } from "effect";
import {
  RewardGatewayTag,
  RewardPurchaseGatewayTag,
} from "../../reward/ports/gateway";
import {
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
} from "../../trip/ports/gateway";
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
export class PurchaseNotFoundError extends Data.TaggedError(
  "PurchaseNotFoundError",
)<{
  message: string;
}> {}

/**
 * Error when user is not authorized
 */
export class NotAuthorizedError extends Data.TaggedError("NotAuthorizedError")<{
  message: string;
}> {}

/**
 * Error when status transition is invalid
 */
export class InvalidPurchaseStatusTransitionError extends Data.TaggedError(
  "InvalidPurchaseStatusTransitionError",
)<{
  message: string;
  fromStatus: string;
  toStatus: string;
}> {}

/**
 * Error when validation fails
 */
export class UpdatePurchaseValidationError extends Data.TaggedError(
  "UpdatePurchaseValidationError",
)<{
  message: string;
}> {}

/**
 * Error when operation fails
 */
export class UpdatePurchaseOperationError extends Data.TaggedError(
  "UpdatePurchaseOperationError",
)<{
  message: string;
  operation: string;
  cause?: unknown;
}> {}

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
 *   Effect.provideService(RewardPurchaseGatewayTag, purchaseRepo),
 *   Effect.provideService(RewardGatewayTag, rewardRepo),
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
  | RewardPurchaseGatewayTag
  | RewardGatewayTag
  | GroupCoinsServiceTag
  | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardGatewayTag;
    const purchaseRepo = yield* RewardPurchaseGatewayTag;
    const coinsService = yield* GroupCoinsServiceTag;
    const accessChecker = yield* TripAccessCheckerTag;

    // Find the purchase
    const purchase = yield* purchaseRepo.findById(input.purchaseId).pipe(
      Effect.mapError(
        (cause) =>
          new UpdatePurchaseOperationError({
            message: "Failed to find purchase",
            operation: "find purchase",
            cause,
          }),
      ),
    );

    if (!purchase) {
      return yield* Effect.fail(
        new PurchaseNotFoundError({ message: "Purchase not found" }),
      );
    }

    // Verify user has permission (staff or group leader)
    const isStaff = yield* accessChecker.isStaff(input.updatedById).pipe(
      Effect.mapError(
        (cause) =>
          new UpdatePurchaseOperationError({
            message: "Failed to check staff status",
            operation: "check staff status",
            cause,
          }),
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
            new UpdatePurchaseOperationError({
              message: "Failed to check group leader",
              operation: "check group leader",
              cause,
            }),
        ),
      );

    // Staff can update any purchase
    // Group leaders can only update their own group's purchases
    if (!isStaff && leaderCheck.groupId !== purchase.groupId) {
      return yield* Effect.fail(
        new NotAuthorizedError({
          message: "Not authorized to update this purchase",
        }),
      );
    }

    // Check if status transition is valid
    if (!canTransitionPurchaseStatus(purchase.status, input.newStatus)) {
      return yield* Effect.fail(
        new InvalidPurchaseStatusTransitionError({
          message: `Cannot change status from ${purchase.status} to ${input.newStatus}`,
          fromStatus: purchase.status,
          toStatus: input.newStatus,
        }),
      );
    }

    // Validate collection method for ACCEPTED status
    if (input.newStatus === "ACCEPTED") {
      const method = input.collectionMethod ?? purchase.collectionMethod;
      if (!method || method.trim() === "") {
        return yield* Effect.fail(
          new UpdatePurchaseValidationError({
            message: "Collection method is required when accepting a purchase",
          }),
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
        new UpdatePurchaseValidationError({
          message:
            "Collection method must be provided before moving to in delivery",
        }),
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
            (cause) =>
              new UpdatePurchaseOperationError({
                message: "Failed to refund coins",
                operation: "refund coins",
                cause,
              }),
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
              new UpdatePurchaseOperationError({
                message: "Failed to restore reward quantity",
                operation: "restore reward quantity",
                cause,
              }),
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
            new UpdatePurchaseOperationError({
              message: "Failed to update purchase status",
              operation: "update purchase status",
              cause,
            }),
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
