import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  RewardPurchaseRepository,
  TripAccessChecker,
  PaginationOptions,
  PaginatedResult,
} from "../ports/RewardRepository";

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
 * GetPurchaseHistory Use Case
 *
 * Retrieves purchase history for a trip.
 * Staff can see all purchases.
 * Regular users can only see purchases for their group.
 */
export class GetPurchaseHistoryUseCase {
  constructor(
    private purchaseRepository: RewardPurchaseRepository,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(
    input: GetPurchaseHistoryInput,
  ): Promise<Result<GetPurchaseHistoryOutput, string>> {
    let groupIdFilter: string | undefined = input.groupId;

    // If not staff, verify user has a group in this trip
    if (!input.isStaff) {
      const leaderCheck = await this.accessChecker.isGroupLeader(
        input.userId,
        input.tripId,
      );

      if (!leaderCheck.groupId) {
        return err(
          "Only trip participants with a group can view reward history",
        );
      }

      // User can only see their own group's purchases
      groupIdFilter = leaderCheck.groupId;
    }

    // Fetch purchases
    const result = await this.purchaseRepository.findByTripId(input.tripId, {
      ...(groupIdFilter !== undefined && { groupId: groupIdFilter }),
      ...input.pagination,
    });

    // Map to output format
    const items = result.items.map((purchase) => ({
      purchaseId: purchase.id,
      rewardId: purchase.rewardId,
      rewardName: "", // Would be populated from repository with reward details
      groupId: purchase.groupId,
      groupName: "", // Would be populated from repository
      quantity: purchase.quantity,
      totalCost: purchase.totalCost.toNumber(),
      status: purchase.status,
      collectionMethod: purchase.collectionMethod,
      purchasedById: purchase.purchasedById,
      purchasedByName: undefined, // Would be populated from repository
      statusUpdatedById: purchase.statusUpdatedById,
      statusUpdatedByName: undefined, // Would be populated from repository
      purchasedAt: purchase.purchasedAt,
      statusUpdatedAt: purchase.statusUpdatedAt,
    }));

    return ok({
      items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    });
  }
}
