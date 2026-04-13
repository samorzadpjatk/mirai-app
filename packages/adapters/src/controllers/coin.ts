import { z } from "zod";
import { Effect } from "effect";
import type { CoinTransactionRepository } from "@mirai-app/use-cases";
import {
  addCoinsUseCase,
  removeCoinsUseCase,
  CoinTransactionRepositoryTag,
} from "@mirai-app/use-cases";
import { effectToControllerResult } from "../utils/controller-helpers";

/**
 * Input validation schemas for coin controller
 */
const schemas = {
  addCoins: z.object({
    tripId: z.string().uuid(),
    groupId: z.string().uuid(),
    amount: z.number().min(1, "Amount must be at least 1"),
    reason: z.string().optional(),
  }),

  removeCoins: z.object({
    tripId: z.string().uuid(),
    groupId: z.string().uuid(),
    amount: z.number().min(1, "Amount must be at least 1"),
    reason: z.string().optional(),
  }),
};

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
 * CoinController
 *
 * Handles coin operations (add/remove) with proper validation.
 * Delegates to use cases for business logic.
 */
export class CoinController {
  constructor(private coinRepository: CoinTransactionRepository) {}

  get schemas() {
    return schemas;
  }

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
    }).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, this.coinRepository),
    );

    const result = await effectToControllerResult(effect);

    if (result.success === false) {
      return result;
    }

    return {
      success: true,
      data: {
        id: result.data.transaction.id,
        amount: result.data.transaction.amount,
        reason: result.data.transaction.reason ?? null,
        groupId: result.data.transaction.groupId,
        adminId: result.data.transaction.adminId,
        createdAt: result.data.transaction.createdAt,
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
    }).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, this.coinRepository),
    );

    const result = await effectToControllerResult(effect);

    if (result.success === false) {
      return result;
    }

    return {
      success: true,
      data: {
        id: result.data.transaction.id,
        amount: result.data.transaction.amount,
        reason: result.data.transaction.reason ?? null,
        groupId: result.data.transaction.groupId,
        adminId: result.data.transaction.adminId,
        createdAt: result.data.transaction.createdAt,
      },
    };
  }
}
