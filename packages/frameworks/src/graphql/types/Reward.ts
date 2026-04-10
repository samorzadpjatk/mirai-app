import { builder } from "../builder";

/**
 * Reward Type (Pothos)
 *
 * GraphQL type definition for Reward entity.
 */
export const RewardType = builder.objectType<"Reward">("Reward", {
  description: "A reward that can be purchased with coins",
  fields: (t) => ({
    id: t.exposeID("id", { description: "Unique reward identifier" }),

    name: t.exposeString("name", { description: "Reward name" }),

    description: t.exposeString("description", {
      description: "Reward description",
    }),

    availableQuantity: t.exposeInt("availableQuantity", {
      description: "Number of items available for purchase",
    }),

    isHidden: t.exposeBoolean("isHidden", {
      description: "Whether the reward is hidden from users",
    }),

    image: t.exposeString("image", {
      description: "Reward image URL",
      nullable: true,
    }),

    coinCost: t.exposeInt("coinCost", {
      description: "Cost in coins to purchase this reward",
    }),

    tripId: t.exposeID("tripId", {
      description: "ID of the trip this reward belongs to",
    }),

    createdById: t.exposeID("createdById", {
      description: "ID of the admin who created this reward",
    }),

    createdAt: t.field({
      type: "DateTime",
      description: "When the reward was created",
      resolve: (reward) => reward.createdAt,
    }),

    updatedAt: t.field({
      type: "DateTime",
      description: "When the reward was last updated",
      resolve: (reward) => reward.updatedAt,
    }),

    // Computed field
    isAvailable: t.boolean({
      description: "Whether the reward is available for purchase",
      resolve: (reward) => reward.availableQuantity > 0 && !reward.isHidden,
    }),
  }),
});

/**
 * Reward Purchase Type
 */
export const RewardPurchaseType = builder.objectType<"RewardPurchase">(
  "RewardPurchase",
  {
    description: "A purchase of a reward by a group",
    fields: (t) => ({
      id: t.exposeID("id"),
      rewardId: t.exposeID("rewardId"),
      groupId: t.exposeID("groupId"),
      quantity: t.exposeInt("quantity"),
      totalCost: t.exposeInt("totalCost"),
      status: t.exposeString("status", {
        description:
          "Purchase status (BOUGHT, ACCEPTED, IN_DELIVERY, CANCELLED, DELIVERED)",
      }),
      collectionMethod: t.exposeString("collectionMethod", {
        description: "How the reward will be collected",
        nullable: true,
      }),
      purchasedById: t.exposeID("purchasedById"),
      statusUpdatedById: t.exposeID("statusUpdatedById", { nullable: true }),
      statusUpdatedAt: t.field({
        type: "DateTime",
        nullable: true,
        resolve: (purchase) => purchase.statusUpdatedAt,
      }),
      createdAt: t.field({
        type: "DateTime",
        resolve: (purchase) => purchase.createdAt,
      }),
      updatedAt: t.field({
        type: "DateTime",
        resolve: (purchase) => purchase.updatedAt,
      }),
    }),
  },
);

/**
 * Reward Input Types
 */
export const CreateRewardInput = builder.inputType("CreateRewardInput", {
  description: "Input for creating a new reward",
  fields: (t) => ({
    name: t.string({
      required: true,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: true }),
    availableQuantity: t.int({ required: true }),
    coinCost: t.int({ required: true }),
    tripId: t.string({ required: true }),
    image: t.string({ required: false }),
  }),
});

export const UpdateRewardInput = builder.inputType("UpdateRewardInput", {
  description: "Input for updating a reward",
  fields: (t) => ({
    name: t.string({
      required: false,
      validate: { minLength: 1, maxLength: 255 },
    }),
    description: t.string({ required: false }),
    availableQuantity: t.int({ required: false }),
    coinCost: t.int({ required: false }),
    image: t.string({ required: false }),
    isHidden: t.boolean({ required: false }),
  }),
});

export const PurchaseRewardInput = builder.inputType("PurchaseRewardInput", {
  description: "Input for purchasing a reward",
  fields: (t) => ({
    rewardId: t.string({ required: true }),
    groupId: t.string({ required: true }),
    quantity: t.int({ required: true, validate: { min: 1 } }),
    collectionMethod: t.string({ required: false }),
  }),
});
