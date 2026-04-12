import { Effect } from "effect";
import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import type { RewardId } from "../value-objects/RewardId";
import { CoinAmount } from "../value-objects/CoinAmount";
import { ValidationError } from "../errors/effect-errors";

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
   *
   * Returns Effect<Reward, ValidationError, never>
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
  }): Effect.Effect<Reward, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate name
      const nameValidation = validateName(props.name);
      if (nameValidation.kind === "err") {
        return yield* Effect.fail(
          new ValidationError({
            message: nameValidation.error,
            field: "name",
          }),
        );
      }

      // Validate description
      const descriptionValidation = validateDescription(props.description);
      if (descriptionValidation.kind === "err") {
        return yield* Effect.fail(
          new ValidationError({
            message: descriptionValidation.error,
            field: "description",
          }),
        );
      }

      // Validate quantity
      if (
        !Number.isInteger(props.availableQuantity) ||
        props.availableQuantity < VALIDATION_RULES.quantity.min ||
        props.availableQuantity > VALIDATION_RULES.quantity.max
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Quantity must be an integer between ${VALIDATION_RULES.quantity.min} and ${VALIDATION_RULES.quantity.max}`,
            field: "availableQuantity",
          }),
        );
      }

      // Validate coin cost percentage
      if (
        !Number.isInteger(props.coinCostPercentage) ||
        props.coinCostPercentage < 1 ||
        props.coinCostPercentage > 100
      ) {
        return yield* Effect.fail(
          new ValidationError({
            message: "Coin cost percentage must be between 1 and 100",
            field: "coinCostPercentage",
          }),
        );
      }

      const coinCostResult = yield* CoinAmount.create(props.coinCostPercentage);

      // Validate tripId
      if (!props.tripId || props.tripId.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "tripId is required",
            field: "tripId",
          }),
        );
      }

      // Validate createdById
      if (!props.createdById || props.createdById.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            message: "createdById is required",
            field: "createdById",
          }),
        );
      }

      // Validate images
      const images = props.images ?? [];
      if (images.length > VALIDATION_RULES.images.maxCount) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Maximum ${VALIDATION_RULES.images.maxCount} images allowed`,
            field: "images",
          }),
        );
      }
      for (const image of images) {
        if (image.length > VALIDATION_RULES.images.maxUrlLength) {
          return yield* Effect.fail(
            new ValidationError({
              message: "Image URL too long",
              field: "images",
            }),
          );
        }
      }

      const now = new Date();

      return new Reward(
        props.id ?? (crypto.randomUUID() as RewardId),
        nameValidation.value,
        descriptionValidation.value,
        props.availableQuantity,
        coinCostResult,
        images.map((i) => i.trim()).filter((i) => i.length > 0),
        props.isHidden ?? false,
        props.tripId.trim(),
        props.createdById.trim(),
        props.createdAt ?? now,
        props.updatedAt ?? now,
      );
    });
  }

  /**
   * Update reward details
   * Returns a new Reward instance (immutable)
   *
   * Returns Effect<Reward, ValidationError, never>
   */
  update(props: {
    name?: string;
    description?: string;
    availableQuantity?: number;
    images?: string[];
    coinCostPercentage?: number;
  }): Effect.Effect<Reward, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Validate name if provided
      let finalName = self.name;
      if (props.name !== undefined) {
        const nameValidation = validateName(props.name);
        if (nameValidation.kind === "err") {
          return yield* Effect.fail(
            new ValidationError({
              message: nameValidation.error,
              field: "name",
            }),
          );
        }
        finalName = nameValidation.value;
      }

      // Validate description if provided
      let finalDescription = self.description;
      if (props.description !== undefined) {
        const descValidation = validateDescription(props.description);
        if (descValidation.kind === "err") {
          return yield* Effect.fail(
            new ValidationError({
              message: descValidation.error,
              field: "description",
            }),
          );
        }
        finalDescription = descValidation.value;
      }

      // Validate quantity if provided
      let finalQuantity = self.availableQuantity;
      if (props.availableQuantity !== undefined) {
        if (
          !Number.isInteger(props.availableQuantity) ||
          props.availableQuantity < VALIDATION_RULES.quantity.min ||
          props.availableQuantity > VALIDATION_RULES.quantity.max
        ) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Quantity must be an integer between ${VALIDATION_RULES.quantity.min} and ${VALIDATION_RULES.quantity.max}`,
              field: "availableQuantity",
            }),
          );
        }
        finalQuantity = props.availableQuantity;
      }

      // Validate images if provided
      let finalImages = self.images;
      if (props.images !== undefined) {
        if (props.images.length > VALIDATION_RULES.images.maxCount) {
          return yield* Effect.fail(
            new ValidationError({
              message: `Maximum ${VALIDATION_RULES.images.maxCount} images allowed`,
              field: "images",
            }),
          );
        }
        for (const image of props.images) {
          if (image.length > VALIDATION_RULES.images.maxUrlLength) {
            return yield* Effect.fail(
              new ValidationError({
                message: "Image URL too long",
                field: "images",
              }),
            );
          }
        }
        finalImages = props.images
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
      }

      // Validate coin cost percentage if provided
      let finalCoinCost = self.coinCostPercentage;
      if (props.coinCostPercentage !== undefined) {
        if (
          !Number.isInteger(props.coinCostPercentage) ||
          props.coinCostPercentage < 1 ||
          props.coinCostPercentage > 100
        ) {
          return yield* Effect.fail(
            new ValidationError({
              message: "Coin cost percentage must be between 1 and 100",
              field: "coinCostPercentage",
            }),
          );
        }
        finalCoinCost = yield* CoinAmount.create(props.coinCostPercentage);
      }

      return new Reward(
        self.id,
        finalName,
        finalDescription,
        finalQuantity,
        finalCoinCost,
        finalImages,
        self.isHidden,
        self.tripId,
        self.createdById,
        self.createdAt,
        new Date(), // updatedAt
      );
    });
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
   *
   * Returns Effect<Reward, ValidationError, never>
   */
  decrementQuantity(
    amount: number,
  ): Effect.Effect<Reward, ValidationError, never> {
    if (!Number.isInteger(amount) || amount < 1) {
      return Effect.fail(
        new ValidationError({
          message: "Amount must be a positive integer",
          field: "amount",
        }),
      );
    }

    if (this.availableQuantity < amount) {
      return Effect.fail(
        new ValidationError({
          message: `Not enough rewards available (requested: ${amount}, available: ${this.availableQuantity})`,
          field: "amount",
        }),
      );
    }

    return Effect.succeed(
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
   *
   * Returns Effect<Reward, ValidationError, never>
   */
  incrementQuantity(
    amount: number,
  ): Effect.Effect<Reward, ValidationError, never> {
    if (!Number.isInteger(amount) || amount < 1) {
      return Effect.fail(
        new ValidationError({
          message: "Amount must be a positive integer",
          field: "amount",
        }),
      );
    }

    const newQuantity = this.availableQuantity + amount;
    if (newQuantity > VALIDATION_RULES.quantity.max) {
      return Effect.fail(
        new ValidationError({
          message: `Quantity would exceed maximum (${VALIDATION_RULES.quantity.max})`,
          field: "amount",
        }),
      );
    }

    return Effect.succeed(
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
   * Returns Effect<boolean, ValidationError, never>
   */
  canAfford(
    groupCoins: CoinAmount,
    quantity: number,
    totalAvailablePoints: number,
  ): Effect.Effect<boolean, ValidationError, never> {
    const unitCost = this.calculateDynamicCoinCost(totalAvailablePoints);
    return Effect.map(unitCost.multiply(quantity), (totalCost) =>
      groupCoins.isGreaterThanOrEqual(totalCost),
    );
  }

  /**
   * Calculate total cost for a purchase
   * Returns Effect to handle potential multiplication overflow
   */
  calculateTotalCost(
    quantity: number,
    totalAvailablePoints: number,
  ): Effect.Effect<CoinAmount, ValidationError, never> {
    const unitCost = this.calculateDynamicCoinCost(totalAvailablePoints);
    return unitCost.multiply(quantity);
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

// Backward compatibility: Keep synchronous Result-based methods for transition
export namespace RewardCompat {
  /**
   * @deprecated Use Reward.create instead (returns Effect)
   * Synchronous Result-based version for backward compatibility during migration
   */
  export function createSync(
    props: Parameters<typeof Reward.create>[0],
  ): Result<Reward, ValidationError> {
    const effect = Reward.create(props);
    try {
      const reward = Effect.runSync(effect);
      return ok(reward);
    } catch (e) {
      return err(e as ValidationError);
    }
  }
}
