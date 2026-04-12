import {
  RewardPurchaseRepositoryTag,
  TripAccessCheckerTag,
  type PaginationOptions,
  type PaginatedResult,
} from "../ports/RewardRepository";
import { Effect } from "effect";

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
export class NoGroupAccessError extends Error {
  readonly _tag = "NoGroupAccessError";
  constructor() {
    super("Only trip participants with a group can view reward history");
  }
}

export class PurchaseRepositoryError extends Error {
  readonly _tag = "PurchaseRepositoryError";
  constructor(message: string = "Failed to fetch purchase history") {
    super(message);
  }
}

export class TripAccessCheckerError extends Error {
  readonly _tag = "TripAccessCheckerError";
  constructor(message: string) {
    super(message);
  }
}

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
 *   Effect.provideService(RewardPurchaseRepositoryTag, purchaseRepo),
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
  RewardPurchaseRepositoryTag | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const purchaseRepo = yield* RewardPurchaseRepositoryTag;
    const accessChecker = yield* TripAccessCheckerTag;

    let groupIdFilter: string | undefined = input.groupId;

    // If not staff, verify user has a group in this trip
    if (!input.isStaff) {
      const leaderCheck = yield* accessChecker
        .isGroupLeader(input.userId, input.tripId)
        .pipe(
          Effect.mapError(
            () =>
              new TripAccessCheckerError("Failed to check group membership"),
          ),
        );

      if (!leaderCheck.groupId) {
        return yield* Effect.fail(new NoGroupAccessError());
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
      .pipe(Effect.mapError(() => new PurchaseRepositoryError()));

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
