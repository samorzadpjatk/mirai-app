import { RewardPurchaseGatewayTag } from "../../reward/ports/gateway";
import { TripAccessCheckerTag } from "../../trip/ports/gateway";
import type {
  PaginationOptions,
  PaginatedResult,
} from "../../system/shared/dto";
import { Data, Effect } from "effect";

/**
 * Purchase with reward info for listing
 */
export interface PurchaseWithDetails {
  purchaseId: string;
  rewardId: string;
  rewardName: string;
  groupId: string;
  groupName?: string;
  quantity: number;
  totalCost: number;
  status: string;
  collectionMethod: string | null;
  purchasedById: string;
  purchasedByName?: string;
  statusUpdatedById: string | null;
  statusUpdatedByName?: string;
  purchasedAt: Date;
  statusUpdatedAt: Date;
}

/**
 * Input for GetPurchaseHistory use case
 */
export interface GetPurchaseHistoryInput {
  tripId: string;
  userId: string;
  isStaff?: boolean;
  groupId?: string; // Filter by group (optional)
  pagination?: PaginationOptions;
}

/**
 * Output DTO for GetPurchaseHistory use case
 */
export interface GetPurchaseHistoryOutput extends PaginatedResult<PurchaseWithDetails> {}

/**
 * Error types for GetPurchaseHistory use case
 */
export class NoGroupAccessError extends Data.TaggedError("NoGroupAccessError")<{
  message: string;
}> {}

export class PurchaseRepositoryError extends Data.TaggedError(
  "PurchaseRepositoryError",
)<{
  message: string;
}> {}

export class TripAccessCheckerError extends Data.TaggedError(
  "TripAccessCheckerError",
)<{
  message: string;
}> {}

export type GetPurchaseHistoryError =
  | NoGroupAccessError
  | PurchaseRepositoryError
  | TripAccessCheckerError;

/**
 * GetPurchaseHistory Use Case
 *
 * Retrieves purchase history for a trip.
 * Staff can see all purchases.
 * Regular users can only see purchases for their group.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getPurchaseHistoryUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(RewardPurchaseGatewayTag, purchaseRepo),
 *   Effect.provideService(TripAccessCheckerTag, accessChecker)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getPurchaseHistoryUseCase(
  input: GetPurchaseHistoryInput,
): Effect.Effect<
  GetPurchaseHistoryOutput,
  GetPurchaseHistoryError,
  RewardPurchaseGatewayTag | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const purchaseRepo = yield* RewardPurchaseGatewayTag;
    const accessChecker = yield* TripAccessCheckerTag;

    let groupIdFilter: string | undefined = input.groupId;

    // If not staff, verify user has a group in this trip
    if (!input.isStaff) {
      const leaderCheck = yield* accessChecker
        .isGroupLeader(input.userId, input.tripId)
        .pipe(
          Effect.mapError(
            () =>
              new TripAccessCheckerError({
                message: "Failed to check group membership",
              }),
          ),
        );

      if (!leaderCheck.groupId) {
        return yield* Effect.fail(
          new NoGroupAccessError({
            message:
              "Only trip participants with a group can view reward history",
          }),
        );
      }

      // User can only see their own group's purchases
      groupIdFilter = leaderCheck.groupId;
    }

    // Fetch purchases
    const result = yield* purchaseRepo
      .findByTripId(input.tripId, {
        ...(groupIdFilter !== undefined && { groupId: groupIdFilter }),
        ...input.pagination,
      })
      .pipe(
        Effect.mapError(
          () =>
            new PurchaseRepositoryError({
              message: "Failed to fetch purchase history",
            }),
        ),
      );

    // Map to output format
    const items = result.items.map((purchase) => ({
      purchaseId: purchase.id,
      rewardId: purchase.rewardId,
      rewardName: "", // Would be populated from repository with reward details
      groupId: purchase.groupId,
      groupName: "", // Would be populated from repository
      quantity: purchase.quantity,
      totalCost: purchase.totalCost,
      status: purchase.status,
      collectionMethod: purchase.collectionMethod,
      purchasedById: purchase.purchasedById,
      purchasedByName: undefined, // Would be populated from repository
      statusUpdatedById: purchase.statusUpdatedById,
      statusUpdatedByName: undefined, // Would be populated from repository
      purchasedAt: purchase.purchasedAt,
      statusUpdatedAt: purchase.statusUpdatedAt,
    }));

    return {
      items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  });
}
