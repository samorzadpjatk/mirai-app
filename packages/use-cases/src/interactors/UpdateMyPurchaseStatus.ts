import { Effect } from "effect";
import {
  RewardRepositoryTag,
  RewardPurchaseRepositoryTag,
  GroupCoinsServiceTag,
  TripAccessCheckerTag,
} from "../ports/RewardRepository";
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
export class MyPurchaseNotFoundError extends Error {
  readonly _tag = "MyPurchaseNotFoundError";
  constructor() {
    super("Purchase not found");
  }
}

/**
 * Error when user is not the group leader
 */
export class NotGroupLeaderError extends Error {
  readonly _tag = "NotGroupLeaderError";
  constructor() {
    super("Only the group leader can update this purchase");
  }
}

/**
 * Error when status transition is invalid for users
 */
export class InvalidUserStatusTransitionError extends Error {
  readonly _tag = "InvalidUserStatusTransitionError";
  constructor(
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {
    super(`Cannot change status from ${fromStatus} to ${toStatus}`);
  }
}

/**
 * Error when operation fails
 */
export class UpdateMyPurchaseOperationError extends Error {
  readonly _tag = "UpdateMyPurchaseOperationError";
  constructor(
    public readonly operation: string,
    public override readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

/**
 * Error when cancellation validation fails
 */
export class InvalidCancellationError extends Error {
  readonly _tag = "InvalidCancellationError";
  constructor(message: string) {
    super(message);
  }
}

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
 *   Effect.provideService(RewardPurchaseRepositoryTag, purchaseRepo),
 *   Effect.provideService(RewardRepositoryTag, rewardRepo),
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
          (cause) => new UpdateMyPurchaseOperationError("find purchase", cause),
        ),
      );

    if (!purchase) {
      return yield* Effect.fail(new MyPurchaseNotFoundError());
    }

    // Verify user is the group leader for this purchase
    const leaderCheck = yield* accessChecker
      .isGroupLeader(input.updatedById, "")
      .pipe(
        Effect.mapError(
          (cause) =>
            new UpdateMyPurchaseOperationError("check group leader", cause),
        ),
      );

    if (leaderCheck.groupId !== purchase.groupId) {
      return yield* Effect.fail(new NotGroupLeaderError());
    }

    // Check if this transition is allowed for users
    const allowedTransitions = USER_ALLOWED_TRANSITIONS[purchase.status] ?? [];
    if (!allowedTransitions.includes(input.newStatus)) {
      return yield* Effect.fail(
        new InvalidUserStatusTransitionError(purchase.status, input.newStatus),
      );
    }

    // For CANCELLED, must be in BOUGHT status
    if (
      input.newStatus === RewardPurchaseStatus.CANCELLED &&
      purchase.status !== RewardPurchaseStatus.BOUGHT
    ) {
      return yield* Effect.fail(
        new InvalidCancellationError("Only pending purchases can be cancelled"),
      );
    }

    // For IN_DELIVERY, must be in ACCEPTED status
    if (
      input.newStatus === RewardPurchaseStatus.IN_DELIVERY &&
      purchase.status !== RewardPurchaseStatus.ACCEPTED
    ) {
      return yield* Effect.fail(
        new InvalidCancellationError(
          "Purchase can be moved to in delivery only after acceptance",
        ),
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
              new UpdateMyPurchaseOperationError("refund coins", cause),
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
              new UpdateMyPurchaseOperationError(
                "restore reward quantity",
                cause,
              ),
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
            new UpdateMyPurchaseOperationError("update purchase status", cause),
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
