import { Effect } from "effect";
import { ValidationError } from "../../system/errors";
import { validate } from "../../system/utils/entity-validation";
import { timestamps, updateEntity } from "../../system/utils/immutable";

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

      return updateEntity(
        self,
        {
          name,
          description,
          availableQuantity,
          isHidden: props.isHidden,
          image,
          coinCost,
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
   * Show the reward
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
   */
  canAfford(groupCoins: number): boolean {
    return groupCoins >= this.coinCost;
  }

  /**
   * Check if specific quantity can be purchased
   */
  canPurchaseQuantity(quantity: number): boolean {
    return quantity > 0 && quantity <= this.availableQuantity;
  }

  /**
   * Calculate total cost for a quantity
   */
  calculateTotalCost(quantity: number): number {
    return this.coinCost * quantity;
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
