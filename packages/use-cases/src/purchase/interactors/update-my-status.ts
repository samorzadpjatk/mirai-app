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
  REWARD_PURCHASE_STATUSES,
  RewardPurchaseStatus,
  RewardId,
} from "@mirai-app/domain";
import type { RewardPurchase } from "@mirai-app/domain";

/**
 * User-facing status update options (subset of full status transitions)
 */
const USER_ALLOWED_TRANSITIONS: Record<
  RewardPurchaseStatus,
  RewardPurchaseStatus[]
> = {
  [RewardPurchaseStatus.BOUGHT]: [RewardPurchaseStatus.CANCELLED],
  [RewardPurchaseStatus.ACCEPTED]: [RewardPurchaseStatus.IN_DELIVERY],
  [RewardPurchaseStatus.IN_DELIVERY]: [],
  [RewardPurchaseStatus.CANCELLED]: [],
  [RewardPurchaseStatus.DELIVERED]: [],
};

/**
 * Input for UpdateMyPurchaseStatus use case
 * (for group leaders managing their own purchases)
 */
export interface UpdateMyPurchaseStatusInput {
  purchaseId: string;
  newStatus: RewardPurchaseStatus;
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
 * Error when purchase is not found
 */
export class MyPurchaseNotFoundError extends Data.TaggedError(
  "MyPurchaseNotFoundError",
)<{
  message: string;
}> {}

/**
 * Error when user is not the group leader
 */
export class NotGroupLeaderError extends Data.TaggedError(
  "NotGroupLeaderError",
)<{
  message: string;
}> {}

/**
 * Error when status transition is invalid for users
 */
export class InvalidUserStatusTransitionError extends Data.TaggedError(
  "InvalidUserStatusTransitionError",
)<{
  message: string;
  fromStatus: string;
  toStatus: string;
}> {}

/**
 * Error when operation fails
 */
export class UpdateMyPurchaseOperationError extends Data.TaggedError(
  "UpdateMyPurchaseOperationError",
)<{
  message: string;
  operation: string;
  cause?: unknown;
}> {}

/**
 * Error when cancellation validation fails
 */
export class InvalidCancellationError extends Data.TaggedError(
  "InvalidCancellationError",
)<{
  message: string;
}> {}

/**
 * UpdateMyPurchaseStatus Use Case (Effect-based)
 *
 * Allows group leaders to update their own purchase status.
 * Limited transitions compared to admin updates:
 * - BOUGHT -> CANCELLED (with refund)
 * - ACCEPTED -> IN_DELIVERY
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = updateMyPurchaseStatusUseCase(input).pipe(
 *   Effect.provideService(RewardPurchaseGatewayTag, purchaseRepo),
 *   Effect.provideService(RewardGatewayTag, rewardRepo),
 *   Effect.provideService(GroupCoinsServiceTag, coinsService),
 *   Effect.provideService(TripAccessCheckerTag, accessChecker),
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateMyPurchaseStatusUseCase(
  input: UpdateMyPurchaseStatusInput,
): Effect.Effect<
  UpdateMyPurchaseStatusOutput,
  | MyPurchaseNotFoundError
  | NotGroupLeaderError
  | InvalidUserStatusTransitionError
  | InvalidCancellationError
  | UpdateMyPurchaseOperationError,
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
          new UpdateMyPurchaseOperationError({
            message: "Failed to find purchase",
            operation: "find purchase",
            cause,
          }),
      ),
    );

    if (!purchase) {
      return yield* Effect.fail(
        new MyPurchaseNotFoundError({ message: "Purchase not found" }),
      );
    }

    // Verify user is the group leader for this purchase
    const leaderCheck = yield* accessChecker
      .isGroupLeader(input.updatedById, "")
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdateMyPurchaseOperationError({
              message: "Failed to check group leader",
              operation: "check group leader",
              cause,
            }),
        ),
      );

    if (leaderCheck.groupId !== purchase.groupId) {
      return yield* Effect.fail(
        new NotGroupLeaderError({
          message: "Only the group leader can update this purchase",
        }),
      );
    }

    // Check if this transition is allowed for users
    const allowedTransitions = USER_ALLOWED_TRANSITIONS[purchase.status] ?? [];
    if (!allowedTransitions.includes(input.newStatus)) {
      return yield* Effect.fail(
        new InvalidUserStatusTransitionError({
          message: `Cannot change status from ${purchase.status} to ${input.newStatus}`,
          fromStatus: purchase.status,
          toStatus: input.newStatus,
        }),
      );
    }

    // For CANCELLED, must be in BOUGHT status
    if (
      input.newStatus === RewardPurchaseStatus.CANCELLED &&
      purchase.status !== RewardPurchaseStatus.BOUGHT
    ) {
      return yield* Effect.fail(
        new InvalidCancellationError({
          message: "Only pending purchases can be cancelled",
        }),
      );
    }

    // For IN_DELIVERY, must be in ACCEPTED status
    if (
      input.newStatus === RewardPurchaseStatus.IN_DELIVERY &&
      purchase.status !== RewardPurchaseStatus.ACCEPTED
    ) {
      return yield* Effect.fail(
        new InvalidCancellationError({
          message: "Purchase can be moved to in delivery only after acceptance",
        }),
      );
    }

    // Handle refund if cancelling
    let refunded = false;
    if (input.newStatus === RewardPurchaseStatus.CANCELLED) {
      // Refund coins to group
      yield* coinsService
        .addCoins(
          purchase.groupId,
          purchase.totalCost,
          `Cancelled reward claim by user: ${purchase.quantity}x reward`,
          input.updatedById,
        )
        .pipe(
          Effect.mapError(
            (cause) =>
              new UpdateMyPurchaseOperationError({
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
              new UpdateMyPurchaseOperationError({
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
      .updateStatus(input.purchaseId, input.newStatus, input.updatedById, null)
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdateMyPurchaseOperationError({
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
      statusUpdatedAt: updated.statusUpdatedAt,
      refunded,
    };
  });
}
