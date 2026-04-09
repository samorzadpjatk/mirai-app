import { type Result, ok, err } from "../utils/result";
import type { RewardId } from "../value-objects/RewardId";
import { CoinAmount } from "../value-objects/CoinAmount";

/**
 * Reward Purchase Status
 * State machine for reward purchase lifecycle
 */
export type RewardPurchaseStatus =
  | "BOUGHT"
  | "ACCEPTED"
  | "IN_DELIVERY"
  | "CANCELLED"
  | "DELIVERED";

/**
 * Valid purchase statuses
 */
export const REWARD_PURCHASE_STATUSES: RewardPurchaseStatus[] = [
  "BOUGHT",
  "ACCEPTED",
  "IN_DELIVERY",
  "CANCELLED",
  "DELIVERED",
];

/**
 * Purchase status transitions
 * Defines valid state transitions for the purchase state machine
 */
const PURCHASE_STATUS_TRANSITIONS: Record<
  RewardPurchaseStatus,
  RewardPurchaseStatus[]
> = {
  BOUGHT: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY: ["DELIVERED", "CANCELLED"],
  CANCELLED: [],
  DELIVERED: [],
};

/**
 * Validation rules for reward data
 */
const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    minLength: 1,
    maxLength: 2000,
  },
  quantity: {
    min: 0,
    max: 1_000_000,
  },
  images: {
    maxCount: 10,
    maxUrlLength: 2000,
  },
};

/**
 * Reward entity - represents a reward that can be purchased with coins
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Reward {
  private constructor(
    public readonly id: RewardId,
    public readonly name: string,
    public readonly description: string,
    public readonly availableQuantity: number,
    public readonly coinCostPercentage: CoinAmount, // Percentage of total points (1-100)
    public readonly images: string[],
    public readonly isHidden: boolean,
    public readonly tripId: string,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Reward
   * Validates all input data
   */
  static create(props: {
    id?: RewardId;
    name: string;
    description: string;
    availableQuantity: number;
    coinCostPercentage: number; // Stored as percentage (e.g., 10 = 10%)
    images?: string[];
    isHidden?: boolean;
    tripId: string;
    createdById: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Reward, string> {
    // Validate name
    const nameValidation = validateName(props.name);
    if (nameValidation.kind === "err") {
      return err(nameValidation.error);
    }

    // Validate description
    const descriptionValidation = validateDescription(props.description);
    if (descriptionValidation.kind === "err") {
      return err(descriptionValidation.error);
    }

    // Validate quantity
    if (
      !Number.isInteger(props.availableQuantity) ||
      props.availableQuantity < VALIDATION_RULES.quantity.min ||
      props.availableQuantity > VALIDATION_RULES.quantity.max
    ) {
      return err(
        `Quantity must be an integer between ${VALIDATION_RULES.quantity.min} and ${VALIDATION_RULES.quantity.max}`,
      );
    }

    // Validate coin cost percentage
    if (
      !Number.isInteger(props.coinCostPercentage) ||
      props.coinCostPercentage < 1 ||
      props.coinCostPercentage > 100
    ) {
      return err("Coin cost percentage must be between 1 and 100");
    }

    const coinCostResult = CoinAmount.create(props.coinCostPercentage);
    if (coinCostResult.kind === "err") {
      return err(coinCostResult.error);
    }

    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate createdById
    if (!props.createdById || props.createdById.trim() === "") {
      return err("createdById is required");
    }

    // Validate images
    const images = props.images ?? [];
    if (images.length > VALIDATION_RULES.images.maxCount) {
      return err(`Maximum ${VALIDATION_RULES.images.maxCount} images allowed`);
    }
    for (const image of images) {
      if (image.length > VALIDATION_RULES.images.maxUrlLength) {
        return err("Image URL too long");
      }
    }

    const now = new Date();

    return ok(
      new Reward(
        props.id ?? (crypto.randomUUID() as RewardId),
        nameValidation.value,
        descriptionValidation.value,
        props.availableQuantity,
        coinCostResult.value,
        images.map((i) => i.trim()).filter((i) => i.length > 0),
        props.isHidden ?? false,
        props.tripId.trim(),
        props.createdById.trim(),
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Update reward details
   * Returns a new Reward instance (immutable)
   */
  update(props: {
    name?: string;
    description?: string;
    availableQuantity?: number;
    images?: string[];
    coinCostPercentage?: number;
  }): Result<Reward, string> {
    // Validate name if provided
    let finalName = this.name;
    if (props.name !== undefined) {
      const nameValidation = validateName(props.name);
      if (nameValidation.kind === "err") {
        return err(nameValidation.error);
      }
      finalName = nameValidation.value;
    }

    // Validate description if provided
    let finalDescription = this.description;
    if (props.description !== undefined) {
      const descValidation = validateDescription(props.description);
      if (descValidation.kind === "err") {
        return err(descValidation.error);
      }
      finalDescription = descValidation.value;
    }

    // Validate quantity if provided
    let finalQuantity = this.availableQuantity;
    if (props.availableQuantity !== undefined) {
      if (
        !Number.isInteger(props.availableQuantity) ||
        props.availableQuantity < VALIDATION_RULES.quantity.min ||
        props.availableQuantity > VALIDATION_RULES.quantity.max
      ) {
        return err(
          `Quantity must be an integer between ${VALIDATION_RULES.quantity.min} and ${VALIDATION_RULES.quantity.max}`,
        );
      }
      finalQuantity = props.availableQuantity;
    }

    // Validate images if provided
    let finalImages = this.images;
    if (props.images !== undefined) {
      if (props.images.length > VALIDATION_RULES.images.maxCount) {
        return err(
          `Maximum ${VALIDATION_RULES.images.maxCount} images allowed`,
        );
      }
      for (const image of props.images) {
        if (image.length > VALIDATION_RULES.images.maxUrlLength) {
          return err("Image URL too long");
        }
      }
      finalImages = props.images
        .map((i) => i.trim())
        .filter((i) => i.length > 0);
    }

    // Validate coin cost percentage if provided
    let finalCoinCost = this.coinCostPercentage;
    if (props.coinCostPercentage !== undefined) {
      if (
        !Number.isInteger(props.coinCostPercentage) ||
        props.coinCostPercentage < 1 ||
        props.coinCostPercentage > 100
      ) {
        return err("Coin cost percentage must be between 1 and 100");
      }
      const coinCostResult = CoinAmount.create(props.coinCostPercentage);
      if (coinCostResult.kind === "err") {
        return err(coinCostResult.error);
      }
      finalCoinCost = coinCostResult.value;
    }

    return ok(
      new Reward(
        this.id,
        finalName,
        finalDescription,
        finalQuantity,
        finalCoinCost,
        finalImages,
        this.isHidden,
        this.tripId,
        this.createdById,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Hide this reward
   * Returns a new Reward instance (immutable)
   */
  hide(): Reward {
    return new Reward(
      this.id,
      this.name,
      this.description,
      this.availableQuantity,
      this.coinCostPercentage,
      this.images,
      true, // isHidden
      this.tripId,
      this.createdById,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Unhide this reward
   * Returns a new Reward instance (immutable)
   */
  unhide(): Reward {
    return new Reward(
      this.id,
      this.name,
      this.description,
      this.availableQuantity,
      this.coinCostPercentage,
      this.images,
      false, // isHidden
      this.tripId,
      this.createdById,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Decrease available quantity (when a purchase is made)
   * Returns error if not enough quantity available
   */
  decrementQuantity(amount: number): Result<Reward, string> {
    if (!Number.isInteger(amount) || amount < 1) {
      return err("Amount must be a positive integer");
    }

    if (this.availableQuantity < amount) {
      return err(
        `Not enough rewards available (requested: ${amount}, available: ${this.availableQuantity})`,
      );
    }

    return ok(
      new Reward(
        this.id,
        this.name,
        this.description,
        this.availableQuantity - amount,
        this.coinCostPercentage,
        this.images,
        this.isHidden,
        this.tripId,
        this.createdById,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Increase available quantity (when a purchase is cancelled/refunded)
   */
  incrementQuantity(amount: number): Result<Reward, string> {
    if (!Number.isInteger(amount) || amount < 1) {
      return err("Amount must be a positive integer");
    }

    const newQuantity = this.availableQuantity + amount;
    if (newQuantity > VALIDATION_RULES.quantity.max) {
      return err(
        `Quantity would exceed maximum (${VALIDATION_RULES.quantity.max})`,
      );
    }

    return ok(
      new Reward(
        this.id,
        this.name,
        this.description,
        newQuantity,
        this.coinCostPercentage,
        this.images,
        this.isHidden,
        this.tripId,
        this.createdById,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Calculate dynamic coin cost based on total available points in the trip
   * The stored coinCost is a percentage (1-100) of total available points
   */
  calculateDynamicCoinCost(totalAvailablePoints: number): CoinAmount {
    if (totalAvailablePoints <= 0) {
      // Return minimum cost of 1 coin
      return CoinAmount.unsafeCreate(1);
    }

    const percentage = this.coinCostPercentage.toNumber() / 100;
    const dynamicCost = Math.round(totalAvailablePoints * percentage);

    // Ensure minimum cost of 1 coin
    return CoinAmount.unsafeCreate(Math.max(1, dynamicCost));
  }

  /**
   * Check if reward is in stock
   */
  isInStock(): boolean {
    return this.availableQuantity > 0;
  }

  /**
   * Check if a group can afford to purchase a given quantity
   */
  canAfford(
    groupCoins: CoinAmount,
    quantity: number,
    totalAvailablePoints: number,
  ): boolean {
    const totalCost = this.calculateTotalCost(quantity, totalAvailablePoints);
    return groupCoins.isGreaterThanOrEqual(totalCost);
  }

  /**
   * Calculate total cost for a purchase
   */
  calculateTotalCost(
    quantity: number,
    totalAvailablePoints: number,
  ): CoinAmount {
    const unitCost = this.calculateDynamicCoinCost(totalAvailablePoints);
    const totalResult = unitCost.multiply(quantity);
    // Safe to unwrap because we validated inputs
    return totalResult.kind === "ok" ? totalResult.value : CoinAmount.zero();
  }

  /**
   * Get primary image (first image or null)
   */
  getPrimaryImage(): string | null {
    return this.images[0] ?? null;
  }

  /**
   * Check if reward can be purchased (in stock, not hidden)
   */
  canBePurchased(): boolean {
    return this.isInStock() && !this.isHidden;
  }

  /**
   * Check if a quantity can be purchased
   */
  canPurchaseQuantity(quantity: number): boolean {
    return this.canBePurchased() && this.availableQuantity >= quantity;
  }
}

/**
 * RewardPurchase entity - represents a purchase of a reward
 */
export class RewardPurchase {
  private constructor(
    public readonly id: string,
    public readonly rewardId: RewardId,
    public readonly groupId: string,
    public readonly quantity: number,
    public readonly totalCost: CoinAmount,
    public readonly status: RewardPurchaseStatus,
    public readonly collectionMethod: string | null,
    public readonly purchasedById: string,
    public readonly statusUpdatedById: string | null,
    public readonly statusUpdatedAt: Date,
    public readonly purchasedAt: Date,
  ) {}

  /**
   * Factory method to create a new RewardPurchase
   */
  static create(props: {
    id?: string;
    rewardId: RewardId;
    groupId: string;
    quantity: number;
    totalCost: number;
    status?: RewardPurchaseStatus;
    collectionMethod?: string | null;
    purchasedById: string;
    statusUpdatedById?: string | null;
    statusUpdatedAt?: Date;
    purchasedAt?: Date;
  }): Result<RewardPurchase, string> {
    // Validate rewardId
    if (!props.rewardId) {
      return err("rewardId is required");
    }

    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate quantity
    if (!Number.isInteger(props.quantity) || props.quantity < 1) {
      return err("Quantity must be a positive integer");
    }

    // Validate totalCost
    const totalCostResult = CoinAmount.create(props.totalCost);
    if (totalCostResult.kind === "err") {
      return err(totalCostResult.error);
    }

    // Validate purchasedById
    if (!props.purchasedById || props.purchasedById.trim() === "") {
      return err("purchasedById is required");
    }

    // Validate status
    const status = props.status ?? "BOUGHT";
    if (!REWARD_PURCHASE_STATUSES.includes(status)) {
      return err(`Invalid purchase status: ${status}`);
    }

    const now = new Date();

    return ok(
      new RewardPurchase(
        props.id ?? crypto.randomUUID(),
        props.rewardId,
        props.groupId.trim(),
        props.quantity,
        totalCostResult.value,
        status,
        props.collectionMethod ?? null,
        props.purchasedById.trim(),
        props.statusUpdatedById ?? null,
        props.statusUpdatedAt ?? now,
        props.purchasedAt ?? now,
      ),
    );
  }

  /**
   * Update purchase status
   * Returns error if the transition is invalid
   */
  updateStatus(
    newStatus: RewardPurchaseStatus,
    updatedById: string,
    collectionMethod?: string | null,
  ): Result<RewardPurchase, string> {
    // Check if transition is valid
    if (!canTransitionPurchaseStatus(this.status, newStatus)) {
      return err(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    // Validate collection method requirement for certain statuses
    if (newStatus === "ACCEPTED") {
      const method = collectionMethod ?? this.collectionMethod;
      if (!method || method.trim() === "") {
        return err("Collection method is required when accepting a purchase");
      }
    }

    return ok(
      new RewardPurchase(
        this.id,
        this.rewardId,
        this.groupId,
        this.quantity,
        this.totalCost,
        newStatus,
        collectionMethod !== undefined
          ? collectionMethod
          : this.collectionMethod,
        this.purchasedById,
        updatedById,
        new Date(),
        this.purchasedAt,
      ),
    );
  }

  /**
   * Check if the purchase can be cancelled
   * (must be in a non-final state)
   */
  canBeCancelled(): boolean {
    // Cannot cancel if already in a final state
    if (this.isFinal()) {
      return false;
    }
    return canTransitionPurchaseStatus(this.status, "CANCELLED");
  }

  /**
   * Check if the purchase is in a final state
   */
  isFinal(): boolean {
    return this.status === "DELIVERED" || this.status === "CANCELLED";
  }

  /**
   * Check if the purchase is refundable (can return coins)
   */
  isRefundable(): boolean {
    // Only BOUGHT status can be refunded directly
    return this.status === "BOUGHT";
  }
}

/**
 * Check if a purchase status transition is valid
 */
export function canTransitionPurchaseStatus(
  from: RewardPurchaseStatus,
  to: RewardPurchaseStatus,
): boolean {
  if (from === to) return true;
  return PURCHASE_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Validate a reward name
 */
function validateName(name: string): Result<string, string> {
  const trimmed = name.trim();

  if (trimmed.length < VALIDATION_RULES.name.minLength) {
    return err(
      `Name must be at least ${VALIDATION_RULES.name.minLength} characters`,
    );
  }

  if (trimmed.length > VALIDATION_RULES.name.maxLength) {
    return err(
      `Name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
    );
  }

  return ok(trimmed);
}

/**
 * Validate a reward description
 */
function validateDescription(description: string): Result<string, string> {
  const trimmed = description.trim();

  if (trimmed.length < VALIDATION_RULES.description.minLength) {
    return err(
      `Description must be at least ${VALIDATION_RULES.description.minLength} characters`,
    );
  }

  if (trimmed.length > VALIDATION_RULES.description.maxLength) {
    return err(
      `Description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
    );
  }

  return ok(trimmed);
}
