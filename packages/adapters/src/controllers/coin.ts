import { Effect, type Layer } from "effect";
import {
  addCoinsUseCase,
  removeCoinsUseCase,
  CoinTransactionRepositoryTag,
} from "@mirai-app/use-cases";
import {
  validateAddCoinsInput,
  validateRemoveCoinsInput,
} from "./validators/coin-validators";

export { validateAddCoinsInput, validateRemoveCoinsInput };

/**
 * Output type for coin operations
 */
type CoinOutput = {
  id: string;
  amount: number;
  reason: string | null;
  groupId: string;
  adminId: string;
  createdAt: Date;
};

/**
 * Controller result type
 */
type CoinResult =
  | { success: true; data: CoinOutput }
  | { success: false; error: string };

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * CoinController
 *
 * Handles coin operations (add/remove) with proper validation.
 * Delegates to use cases for business logic.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class CoinController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Add coins to a group
   */
  async addCoins(input: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<CoinResult> {
    const effect = addCoinsUseCase({
      tripId: input.tripId,
      groupId: input.groupId,
      amount: input.amount,
      reason: input.reason,
      adminId: input.adminId,
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (result.success === false) {
      return result as CoinResult;
    }

    const data = result.data as {
      transaction: {
        id: string;
        amount: number;
        reason: string | null;
        groupId: string;
        adminId: string;
        createdAt: Date;
      };
    };

    return {
      success: true,
      data: {
        id: data.transaction.id,
        amount: data.transaction.amount,
        reason: data.transaction.reason ?? null,
        groupId: data.transaction.groupId,
        adminId: data.transaction.adminId,
        createdAt: data.transaction.createdAt,
      },
    };
  }

  /**
   * Remove coins from a group
   */
  async removeCoins(input: {
    tripId: string;
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<CoinResult> {
    const effect = removeCoinsUseCase({
      tripId: input.tripId,
      groupId: input.groupId,
      amount: input.amount,
      reason: input.reason,
      adminId: input.adminId,
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (result.success === false) {
      return result as CoinResult;
    }

    const data = result.data as {
      transaction: {
        id: string;
        amount: number;
        reason: string | null;
        groupId: string;
        adminId: string;
        createdAt: Date;
      };
    };

    return {
      success: true,
      data: {
        id: data.transaction.id,
        amount: data.transaction.amount,
        reason: data.transaction.reason ?? null,
        groupId: data.transaction.groupId,
        adminId: data.transaction.adminId,
        createdAt: data.transaction.createdAt,
      },
    };
  }
}
