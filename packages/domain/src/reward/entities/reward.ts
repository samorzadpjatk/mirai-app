import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { validate } from "../../system/utils/entity-validation";
import { timestamps, updateEntity } from "../../system/utils/immutable";
import { CoinAmount } from "../value-objects/coin-amount";

/**
 * Reward entity - represents a reward that groups can purchase
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Reward {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly availableQuantity: number,
    public readonly isHidden: boolean,
    public readonly image: string | null,
    public readonly coinCost: number,
    public readonly tripId: string,
    public readonly createdById: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Additional properties for extended functionality
    public readonly images: string[] = [],
  ) {}

  /**
   * Factory method to create a new Reward
   * Validates all input data
   */
  static create(props: {
    id?: string;
    name: string;
    description: string;
    availableQuantity: number;
    isHidden?: boolean;
    image?: string | null;
    images?: string[];
    coinCost: number;
    tripId: string;
    createdById: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<Reward, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate name
      const name = yield* validate.string(props.name, "name", {
        required: true,
        minLength: 1,
        maxLength: 255,
      });

      // Validate description
      const description = yield* validate.string(
        props.description,
        "description",
        {
          required: true,
          minLength: 1,
          maxLength: 2000,
        },
      );

      // Validate available quantity
      const availableQuantity = props.availableQuantity;
      if (availableQuantity < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "availableQuantity must be non-negative",
            field: "availableQuantity",
          }),
        );
      }

      // Validate coin cost
      const coinCost = props.coinCost;
      if (coinCost <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "coinCost must be positive",
            field: "coinCost",
          }),
        );
      }

      // Validate image URL if provided
      let image: string | null = null;
      if (props.image) {
        image = yield* validate.string(props.image, "image", {
          required: false,
          maxLength: 1000,
        });
      }

      // Validate images array if provided
      const images = props.images ?? [];

      // Validate tripId
      const tripId = yield* validate.id(props.tripId, "tripId");

      // Validate createdById
      const createdById = yield* validate.id(props.createdById, "createdById");

      const ts = timestamps(props);

      return new Reward(
        props.id ?? crypto.randomUUID(),
        name,
        description,
        availableQuantity,
        props.isHidden ?? false,
        image,
        coinCost,
        tripId,
        createdById,
        ts.createdAt,
        ts.updatedAt,
        images,
      );
    });
  }

  /**
   * Update reward details
   */
  update(props: {
    name?: string;
    description?: string;
    availableQuantity?: number;
    isHidden?: boolean;
    image?: string | null;
    images?: string[];
    coinCost?: number;
  }): Effect.Effect<Reward, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Validate name if provided
      let name = self.name;
      if (props.name !== undefined) {
        name = yield* validate.string(props.name, "name", {
          required: true,
          minLength: 1,
          maxLength: 255,
        });
      }

      // Validate description if provided
      let description = self.description;
      if (props.description !== undefined) {
        description = yield* validate.string(props.description, "description", {
          required: true,
          minLength: 1,
          maxLength: 2000,
        });
      }

      // Validate available quantity if provided
      let availableQuantity = self.availableQuantity;
      if (props.availableQuantity !== undefined) {
        if (props.availableQuantity < 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: "availableQuantity must be non-negative",
              field: "availableQuantity",
            }),
          );
        }
        availableQuantity = props.availableQuantity;
      }

      // Validate coin cost if provided
      let coinCost = self.coinCost;
      if (props.coinCost !== undefined) {
        if (props.coinCost <= 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: "coinCost must be positive",
              field: "coinCost",
            }),
          );
        }
        coinCost = props.coinCost;
      }

      // Validate image if provided
      let image = self.image;
      if (props.image !== undefined) {
        if (props.image) {
          image = yield* validate.string(props.image, "image", {
            required: false,
            maxLength: 1000,
          });
        } else {
          image = null;
        }
      }

      // Update images if provided
      const images = props.images ?? self.images;

      return updateEntity(
        self,
        {
          name,
          description,
          availableQuantity,
          isHidden: props.isHidden,
          image,
          coinCost,
          images,
        },
        Reward,
      );
    });
  }

  /**
   * Reduce available quantity by specified amount
   */
  reduceQuantity(
    amount: number,
  ): Effect.Effect<Reward, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (amount <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "amount must be positive",
            field: "amount",
          }),
        );
      }

      if (amount > self.availableQuantity) {
        return yield* Effect.fail(
          new ValidationError({
            message: "insufficient quantity available",
            field: "amount",
          }),
        );
      }

      return updateEntity(
        self,
        {
          availableQuantity: self.availableQuantity - amount,
        },
        Reward,
      );
    });
  }

  /**
   * Restock (increase) available quantity
   */
  restock(amount: number): Effect.Effect<Reward, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (amount <= 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "amount must be positive",
            field: "amount",
          }),
        );
      }

      return updateEntity(
        self,
        {
          availableQuantity: self.availableQuantity + amount,
        },
        Reward,
      );
    });
  }

  /**
   * Hide the reward
   */
  hide(): Reward {
    return updateEntity(
      this,
      {
        isHidden: true,
      },
      Reward,
    );
  }

  /**
   * Show the reward (unhide)
   */
  show(): Reward {
    return updateEntity(
      this,
      {
        isHidden: false,
      },
      Reward,
    );
  }

  /**
   * Alias for show() - unhide the reward
   */
  unhide(): Reward {
    return this.show();
  }

  /**
   * Check if reward is hidden
   */
  isHiddenReward(): boolean {
    return this.isHidden;
  }

  /**
   * Check if reward is visible
   */
  isVisible(): boolean {
    return !this.isHidden;
  }

  /**
   * Check if reward is in stock
   */
  isInStock(): boolean {
    return this.availableQuantity > 0;
  }

  /**
   * Check if group can afford this reward
   * Simple version - checks if group has enough coins for base cost
   */
  canAfford(groupCoins: number): boolean {
    return groupCoins >= this.coinCost;
  }

  /**
   * Check if group can afford this reward with dynamic pricing
   * Calculates actual cost based on total trip points
   */
  canAffordWithDynamicCost(
    groupCoins: CoinAmount,
    quantity: number,
    totalTripPoints: number,
  ): Effect.Effect<boolean, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      const dynamicCost = self.calculateDynamicCoinCost(totalTripPoints);
      const totalCost = yield* dynamicCost.multiply(quantity);
      return groupCoins.value >= totalCost.value;
    });
  }

  /**
   * Check if specific quantity can be purchased
   */
  canPurchaseQuantity(quantity: number): boolean {
    return quantity > 0 && quantity <= this.availableQuantity;
  }

  /**
   * Check if this reward can be purchased (in stock and visible)
   */
  canBePurchased(): boolean {
    return this.isInStock() && this.isVisible();
  }

  /**
   * Calculate total cost for a quantity
   */
  calculateTotalCost(quantity: number): number {
    return this.coinCost * quantity;
  }

  /**
   * Calculate dynamic coin cost based on total trip points
   * Returns a CoinAmount representing the actual cost
   */
  calculateDynamicCoinCost(totalTripPoints: number): CoinAmount {
    const cost = Math.round((this.coinCost / 100) * totalTripPoints);
    return CoinAmount.unsafeCreate(cost);
  }

  /**
   * Get the coin cost percentage (alias for coinCost)
   * This represents what percentage of trip points the reward costs
   */
  get coinCostPercentage(): CoinAmount {
    return CoinAmount.unsafeCreate(this.coinCost);
  }

  /**
   * Get the primary image (first image or null)
   */
  getPrimaryImage(): string | null {
    const firstImage = this.images[0];
    if (firstImage !== undefined) {
      return firstImage;
    }
    return this.image ?? null;
  }

  /**
   * Check if belongs to a trip
   */
  belongsToTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  /**
   * Check if was created by specific user
   */
  wasCreatedBy(userId: string): boolean {
    return this.createdById === userId;
  }

  /**
   * Get availability status
   */
  getAvailabilityStatus(): "in_stock" | "out_of_stock" | "hidden" {
    if (this.isHidden) {
      return "hidden";
    }
    if (this.availableQuantity > 0) {
      return "in_stock";
    }
    return "out_of_stock";
  }
}
