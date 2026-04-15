/**
 * Reward GraphQL Types
 *
 * Pothos type definitions for the Reward domain entity and related types.
 * Maps from use case DTOs to GraphQL schema types.
 *
 * @module Reward
 */

import { builder } from "../builder";
import type {
  GetRewardOutput,
  CreateRewardOutput,
  UpdateRewardOutput,
  SetRewardHiddenOutput,
  DeleteRewardOutput,
  PurchaseRewardOutput,
  UpdatePurchaseStatusOutput,
  UpdateMyPurchaseStatusOutput,
  RewardWithCalculations,
  PurchaseWithDetails,
} from "@mirai-app/use-cases";
import type { RewardPurchaseStatus } from "@mirai-app/domain";

// =============================================================================
// Enum Types
// =============================================================================

/**
 * Reward purchase status workflow
 */
export const RewardPurchaseStatusEnum = builder.enumType(
  "RewardPurchaseStatus",
  {
    description: "Status of a reward purchase in its lifecycle",
    values: {
      BOUGHT: { value: "BOUGHT" as RewardPurchaseStatus },
      ACCEPTED: { value: "ACCEPTED" as RewardPurchaseStatus },
      IN_DELIVERY: { value: "IN_DELIVERY" as RewardPurchaseStatus },
      DELIVERED: { value: "DELIVERED" as RewardPurchaseStatus },
      CANCELLED: { value: "CANCELLED" as RewardPurchaseStatus },
    },
  },
);

// =============================================================================
// Reward Object Type
// =============================================================================

/**
 * Reward type for GraphQL schema
 *
 * Derived from GetRewardOutput DTO to maintain type safety
 * between domain layer and API layer.
 */
export const RewardType = builder.objectType("Reward", {
  description: "A reward that can be purchased with coins in a trip",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the reward (UUID)",
      nullable: false,
    }),

    tripId: t.exposeID("tripId", {
      description: "ID of the trip this reward belongs to",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Basic Fields
    // -------------------------------------------------------------------------

    name: t.exposeString("name", {
      description: "Reward name/title",
      nullable: false,
    }),

    description: t.exposeString("description", {
      description: "Reward description",
      nullable: false,
    }),

    images: t.field({
      description: "Array of reward image URLs",
      type: ["String"],
      nullable: false,
      resolve: (reward) => (reward as { images: string[] }).images ?? [],
    }),

    primaryImage: t.exposeString("primaryImage", {
      description: "Primary/main image URL (first image or null)",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Inventory Fields
    // -------------------------------------------------------------------------

    availableQuantity: t.exposeInt("availableQuantity", {
      description: "Number of rewards available for purchase",
      nullable: false,
    }),

    isInStock: t.exposeBoolean("isInStock", {
      description: "Whether the reward is currently in stock",
      nullable: false,
    }),

    canBePurchased: t.exposeBoolean("canBePurchased", {
      description:
        "Whether the reward can be purchased (in stock and not hidden)",
      nullable: false,
    }),

    purchaseCount: t.exposeInt("purchaseCount", {
      description: "Number of times this reward has been purchased",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Pricing Fields
    // -------------------------------------------------------------------------

    coinCostPercentage: t.exposeInt("coinCostPercentage", {
      description:
        "Percentage of total trip points that this reward costs (1-100)",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Status Fields
    // -------------------------------------------------------------------------

    isHidden: t.exposeBoolean("isHidden", {
      description: "Whether the reward is hidden from users",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Creator Fields
    // -------------------------------------------------------------------------

    createdById: t.exposeID("createdById", {
      description: "ID of the user who created this reward",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the reward was created",
      nullable: false,
      resolve: (reward) => (reward as { createdAt: Date }).createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the reward was last updated",
      nullable: false,
      resolve: (reward) => (reward as { updatedAt: Date }).updatedAt,
    }),
  }),
});

// =============================================================================
// Reward With Calculations Type (for list views with dynamic pricing)
// =============================================================================

/**
 * Reward type with calculated fields for list views
 * Includes dynamic coin cost calculations
 */
export const RewardWithCalculationsType = builder.objectType(
  "RewardWithCalculations",
  {
    description: "A reward with dynamic pricing calculations",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      // Identity
      id: t.exposeID("id", {
        description: "Unique identifier",
        nullable: false,
      }),
      tripId: t.exposeID("tripId", { description: "Trip ID", nullable: false }),

      // Basic
      name: t.exposeString("name", {
        description: "Reward name",
        nullable: false,
      }),
      description: t.exposeString("description", {
        description: "Description",
        nullable: false,
      }),
      images: t.field({
        description: "Array of image URLs",
        type: ["String"],
        nullable: false,
        resolve: (reward) => (reward as { images: string[] }).images ?? [],
      }),
      primaryImage: t.exposeString("primaryImage", {
        description: "Primary image",
        nullable: true,
      }),

      // Inventory
      availableQuantity: t.exposeInt("availableQuantity", { nullable: false }),
      isInStock: t.exposeBoolean("isInStock", { nullable: false }),
      canBePurchased: t.exposeBoolean("canBePurchased", { nullable: false }),
      purchaseCount: t.exposeInt("purchaseCount", { nullable: false }),

      // Pricing (static + dynamic)
      coinCostPercentage: t.exposeInt("coinCostPercentage", {
        description: "Static cost percentage (1-100)",
        nullable: false,
      }),
      dynamicCoinCost: t.exposeInt("dynamicCoinCost", {
        description: "Calculated dynamic coin cost based on trip points",
        nullable: false,
      }),

      // Status
      isHidden: t.exposeBoolean("isHidden", { nullable: false }),

      // Creator
      createdById: t.exposeID("createdById", { nullable: false }),

      // Calculated affordability
      canAfford: t.boolean({
        description:
          "Whether the user's group can afford this reward (null if groupCoins not provided)",
        nullable: true,
        resolve: (reward) =>
          (reward as { canAfford?: boolean }).canAfford ?? null,
      }),

      // Timestamps
      createdAt: t.field({
        type: "DateTime",
        nullable: false,
        resolve: (reward) => (reward as { createdAt: Date }).createdAt,
      }),
      updatedAt: t.field({
        type: "DateTime",
        nullable: false,
        resolve: (reward) => (reward as { updatedAt: Date }).updatedAt,
      }),
    }),
  },
);

// =============================================================================
// Reward Purchase Type
// =============================================================================

/**
 * Reward Purchase type for GraphQL schema
 */
export const RewardPurchaseType = builder.objectType("RewardPurchase", {
  description: "A purchase record for a reward",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    // Identity
    purchaseId: t.exposeID("purchaseId", {
      description: "Unique identifier for the purchase",
      nullable: false,
    }),

    // Relations
    rewardId: t.exposeID("rewardId", {
      description: "ID of the purchased reward",
      nullable: false,
    }),

    rewardName: t.exposeString("rewardName", {
      description: "Name of the purchased reward",
      nullable: false,
    }),

    groupId: t.exposeID("groupId", {
      description: "ID of the group that made the purchase",
      nullable: false,
    }),

    groupName: t.exposeString("groupName", {
      description: "Name of the group that made the purchase",
      nullable: true,
    }),

    // Purchase Details
    quantity: t.exposeInt("quantity", {
      description: "Number of rewards purchased",
      nullable: false,
    }),

    totalCost: t.exposeInt("totalCost", {
      description: "Total coin cost for this purchase",
      nullable: false,
    }),

    status: t.field({
      type: RewardPurchaseStatusEnum,
      description: "Current status of the purchase",
      nullable: false,
      resolve: (purchase) =>
        (purchase as { status: string }).status as RewardPurchaseStatus,
    }),

    collectionMethod: t.exposeString("collectionMethod", {
      description:
        "Method for collecting the reward (e.g., 'Pick up at hotel')",
      nullable: true,
    }),

    // Purchaser Info
    purchasedById: t.exposeID("purchasedById", {
      description: "ID of the user who made the purchase",
      nullable: false,
    }),

    purchasedByName: t.exposeString("purchasedByName", {
      description: "Name of the user who made the purchase",
      nullable: true,
    }),

    purchasedAt: t.field({
      type: "DateTime",
      description: "When the purchase was made",
      nullable: false,
      resolve: (purchase) => (purchase as { purchasedAt: Date }).purchasedAt,
    }),

    // Status Update Info
    statusUpdatedById: t.exposeID("statusUpdatedById", {
      description: "ID of the user who last updated the status",
      nullable: true,
    }),

    statusUpdatedByName: t.exposeString("statusUpdatedByName", {
      description: "Name of the user who last updated the status",
      nullable: true,
    }),

    statusUpdatedAt: t.field({
      type: "DateTime",
      description: "When the status was last updated",
      nullable: false,
      resolve: (purchase) =>
        (purchase as { statusUpdatedAt: Date }).statusUpdatedAt,
    }),
  }),
});

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination info for reward lists
 */
export const RewardPaginationType = builder.objectType("RewardPagination", {
  description: "Pagination metadata for reward lists",
  fields: (t) => ({
    total: t.exposeInt("total", {
      description: "Total number of rewards available",
      nullable: false,
    }),
    limit: t.exposeInt("limit", {
      description: "Number of items per page",
      nullable: false,
    }),
    offset: t.exposeInt("offset", {
      description: "Number of items skipped",
      nullable: false,
    }),
    hasMore: t.exposeBoolean("hasMore", {
      description: "Whether more items are available",
      nullable: false,
    }),
  }),
});

/**
 * Paginated reward list result
 */
export const RewardsConnectionType = builder.objectType("RewardsConnection", {
  description: "A paginated list of rewards with metadata",
  authScopes: {
    public: true,
  },
  fields: (t) => ({
    rewards: t.field({
      type: [RewardWithCalculationsType],
      description: "The rewards in this page",
      nullable: false,
      resolve: (conn) => (conn as { items: RewardWithCalculations[] }).items,
    }),
    pagination: t.field({
      type: RewardPaginationType,
      description: "Pagination metadata",
      nullable: false,
      resolve: (conn) =>
        conn as {
          total: number;
          limit: number;
          offset: number;
          hasMore: boolean;
        },
    }),
  }),
});

/**
 * Paginated purchase history result
 */
export const PurchaseHistoryConnectionType = builder.objectType(
  "PurchaseHistoryConnection",
  {
    description: "A paginated list of reward purchases with metadata",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      purchases: t.field({
        type: [RewardPurchaseType],
        description: "The purchases in this page",
        nullable: false,
        resolve: (conn) => (conn as { items: PurchaseWithDetails[] }).items,
      }),
      pagination: t.field({
        type: RewardPaginationType,
        description: "Pagination metadata",
        nullable: false,
        resolve: (conn) =>
          conn as {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
          },
      }),
    }),
  },
);

// =============================================================================
// Mutation Output Types
// =============================================================================

/**
 * Output type for create reward mutation
 */
export const CreateRewardPayloadType = builder.objectType(
  "CreateRewardPayload",
  {
    description: "Result of creating a new reward",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      reward: t.field({
        type: RewardType,
        description: "The newly created reward",
        nullable: false,
        resolve: (payload) =>
          (payload as { reward: CreateRewardOutput }).reward,
      }),
    }),
  },
);

/**
 * Output type for update reward mutation
 */
export const UpdateRewardPayloadType = builder.objectType(
  "UpdateRewardPayload",
  {
    description: "Result of updating a reward",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      reward: t.field({
        type: RewardType,
        description: "The updated reward",
        nullable: false,
        resolve: (payload) =>
          (payload as { reward: UpdateRewardOutput }).reward,
      }),
    }),
  },
);

/**
 * Output type for set hidden status mutation
 */
export const SetRewardHiddenPayloadType = builder.objectType(
  "SetRewardHiddenPayload",
  {
    description: "Result of setting reward hidden status",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      reward: t.field({
        type: RewardType,
        description: "The reward with updated hidden status",
        nullable: false,
        resolve: (payload) =>
          (payload as { reward: SetRewardHiddenOutput }).reward,
      }),
      previousHidden: t.boolean({
        description: "The previous hidden status",
        nullable: false,
        resolve: (payload) =>
          (payload as { previousHidden: boolean }).previousHidden,
      }),
    }),
  },
);

/**
 * Output type for delete reward mutation
 */
export const DeleteRewardPayloadType = builder.objectType(
  "DeleteRewardPayload",
  {
    description: "Result of deleting a reward",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the deletion was successful",
        nullable: false,
        resolve: () => true,
      }),
      deletedRewardId: t.id({
        description: "ID of the deleted reward",
        nullable: false,
        resolve: (payload) =>
          (payload as { deletedRewardId: string }).deletedRewardId,
      }),
    }),
  },
);

/**
 * Output type for purchase reward mutation
 */
export const PurchaseRewardPayloadType = builder.objectType(
  "PurchaseRewardPayload",
  {
    description: "Result of purchasing a reward",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      purchase: t.field({
        type: RewardPurchaseType,
        description: "The purchase record",
        nullable: false,
        resolve: (payload) => {
          const p = (payload as { purchase: PurchaseRewardOutput }).purchase;
          return {
            purchaseId: p.purchaseId,
            rewardId: p.rewardId,
            rewardName: "", // Will be populated by resolver if needed
            groupId: p.groupId,
            groupName: undefined,
            quantity: p.quantity,
            totalCost: p.totalCost,
            status: p.status,
            collectionMethod: null,
            purchasedById: "", // Will be populated by resolver if needed
            purchasedByName: undefined,
            purchasedAt: p.purchasedAt,
            statusUpdatedById: null,
            statusUpdatedByName: undefined,
            statusUpdatedAt: p.purchasedAt,
          };
        },
      }),
      remainingGroupCoins: t.int({
        description: "Remaining coins in the group after purchase",
        nullable: false,
        resolve: (payload) =>
          (payload as { remainingGroupCoins: number }).remainingGroupCoins,
      }),
      remainingRewardQuantity: t.int({
        description: "Remaining quantity of the reward after purchase",
        nullable: false,
        resolve: (payload) =>
          (payload as { remainingRewardQuantity: number })
            .remainingRewardQuantity,
      }),
    }),
  },
);

/**
 * Output type for update purchase status mutation
 */
export const UpdatePurchaseStatusPayloadType = builder.objectType(
  "UpdatePurchaseStatusPayload",
  {
    description: "Result of updating a purchase status",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      purchase: t.field({
        type: RewardPurchaseType,
        description: "The updated purchase record",
        nullable: false,
        resolve: (payload) => {
          const p = (payload as { purchase: UpdatePurchaseStatusOutput })
            .purchase;
          return {
            purchaseId: p.purchaseId,
            rewardId: p.rewardId,
            rewardName: "", // Populated by resolver
            groupId: p.groupId,
            groupName: undefined,
            quantity: p.quantity,
            totalCost: p.totalCost,
            status: p.status,
            collectionMethod: p.collectionMethod,
            purchasedById: "", // Populated by resolver
            purchasedByName: undefined,
            purchasedAt: p.statusUpdatedAt, // Fallback
            statusUpdatedById: p.statusUpdatedById,
            statusUpdatedByName: undefined,
            statusUpdatedAt: p.statusUpdatedAt,
          };
        },
      }),
      refunded: t.boolean({
        description: "Whether coins were refunded (only when cancelling)",
        nullable: false,
        resolve: (payload) => (payload as { refunded: boolean }).refunded,
      }),
      previousStatus: t.field({
        type: RewardPurchaseStatusEnum,
        description: "The previous status before the update",
        nullable: false,
        resolve: (payload) =>
          (payload as { previousStatus: string })
            .previousStatus as RewardPurchaseStatus,
      }),
    }),
  },
);

/**
 * Output type for update my purchase status mutation
 */
export const UpdateMyPurchaseStatusPayloadType = builder.objectType(
  "UpdateMyPurchaseStatusPayload",
  {
    description: "Result of updating own purchase status (group leader only)",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      purchase: t.field({
        type: RewardPurchaseType,
        description: "The updated purchase record",
        nullable: false,
        resolve: (payload) => {
          const p = (payload as { purchase: UpdateMyPurchaseStatusOutput })
            .purchase;
          return {
            purchaseId: p.purchaseId,
            rewardId: p.rewardId,
            rewardName: "", // Populated by resolver
            groupId: p.groupId,
            groupName: undefined,
            quantity: p.quantity,
            totalCost: p.totalCost,
            status: p.status,
            collectionMethod: null,
            purchasedById: "", // Populated by resolver
            purchasedByName: undefined,
            purchasedAt: p.statusUpdatedAt, // Fallback
            statusUpdatedById: p.statusUpdatedById,
            statusUpdatedByName: undefined,
            statusUpdatedAt: p.statusUpdatedAt,
          };
        },
      }),
      previousStatus: t.field({
        type: RewardPurchaseStatusEnum,
        description: "The previous status before the update",
        nullable: false,
        resolve: (payload) =>
          (payload as { previousStatus: string })
            .previousStatus as RewardPurchaseStatus,
      }),
    }),
  },
);

/**
 * Output type for total available points query
 */
export const TotalAvailablePointsPayloadType = builder.objectType(
  "TotalAvailablePointsPayload",
  {
    description: "Total available points for a trip",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      totalPoints: t.int({
        description: "Total available points in the trip",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for pagination
 */
export const PaginationInput = builder.inputType("PaginationInput", {
  description: "Pagination parameters for list queries",
  fields: (t) => ({
    limit: t.int({
      description: "Maximum number of items to return (1-100)",
      required: false,
      defaultValue: 30,
    }),
    offset: t.int({
      description: "Number of items to skip",
      required: false,
      defaultValue: 0,
    }),
  }),
});

/**
 * Input for creating a reward
 */
export const CreateRewardInput = builder.inputType("CreateRewardInput", {
  description: "Input for creating a new reward",
  fields: (t) => ({
    tripId: t.id({
      description: "ID of the trip this reward belongs to",
      required: true,
    }),
    name: t.string({
      description: "Reward name (1-200 characters)",
      required: true,
    }),
    description: t.string({
      description: "Reward description (max 2000 characters)",
      required: true,
    }),
    availableQuantity: t.int({
      description: "Number of rewards available (0-1000000)",
      required: true,
    }),
    coinCost: t.int({
      description: "Percentage of total trip points (1-100)",
      required: true,
    }),
    images: t.field({
      description: "Array of image URLs (max 10)",
      type: ["String"],
      required: false,
    }),
    isHidden: t.boolean({
      description: "Whether the reward should be hidden initially",
      required: false,
      defaultValue: false,
    }),
  }),
});

/**
 * Input for updating a reward
 */
export const UpdateRewardInput = builder.inputType("UpdateRewardInput", {
  description: "Input for updating an existing reward",
  fields: (t) => ({
    id: t.id({
      description: "ID of the reward to update",
      required: true,
    }),
    name: t.string({
      description: "New reward name (1-200 characters)",
      required: false,
    }),
    description: t.string({
      description: "New description (max 2000 characters)",
      required: false,
    }),
    availableQuantity: t.int({
      description: "New available quantity (0-1000000)",
      required: false,
    }),
    images: t.field({
      description: "New array of image URLs (max 10)",
      type: ["String"],
      required: false,
    }),
    coinCost: t.int({
      description: "New percentage of total trip points (1-100)",
      required: false,
    }),
  }),
});

/**
 * Input for setting reward hidden status
 */
export const SetRewardHiddenInput = builder.inputType("SetRewardHiddenInput", {
  description: "Input for setting reward hidden status",
  fields: (t) => ({
    id: t.id({
      description: "ID of the reward",
      required: true,
    }),
    isHidden: t.boolean({
      description: "Whether the reward should be hidden",
      required: true,
    }),
  }),
});

/**
 * Input for purchasing a reward
 */
export const PurchaseRewardInput = builder.inputType("PurchaseRewardInput", {
  description: "Input for purchasing a reward",
  fields: (t) => ({
    rewardId: t.id({
      description: "ID of the reward to purchase",
      required: true,
    }),
    quantity: t.int({
      description: "Number of rewards to purchase (min 1)",
      required: true,
    }),
  }),
});

/**
 * Input for updating purchase status
 */
export const UpdatePurchaseStatusInput = builder.inputType(
  "UpdatePurchaseStatusInput",
  {
    description: "Input for updating a purchase status (admin/staff only)",
    fields: (t) => ({
      purchaseId: t.id({
        description: "ID of the purchase to update",
        required: true,
      }),
      status: t.field({
        type: RewardPurchaseStatusEnum,
        description: "New status to transition to",
        required: true,
      }),
      collectionMethod: t.string({
        description: "Collection method (required for ACCEPTED status)",
        required: false,
      }),
    }),
  },
);

/**
 * Input for updating my purchase status
 */
export const UpdateMyPurchaseStatusInput = builder.inputType(
  "UpdateMyPurchaseStatusInput",
  {
    description: "Input for updating own purchase status (group leader only)",
    fields: (t) => ({
      purchaseId: t.id({
        description: "ID of the purchase to update",
        required: true,
      }),
      status: t.field({
        type: RewardPurchaseStatusEnum,
        description: "New status (IN_DELIVERY or CANCELLED only)",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export default RewardType;
