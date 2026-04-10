import { z } from "zod";
import type { AddCoinsUseCase, RemoveCoinsUseCase } from "@mirai-app/use-cases";

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
 * CoinController
 *
 * Handles coin operations (add/remove) with proper validation.
 * Delegates to use cases for business logic.
 */
export class CoinController {
  constructor(
    private addCoinsUseCase: AddCoinsUseCase,
    private removeCoinsUseCase: RemoveCoinsUseCase,
  ) {}

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
  }): Promise<
    | {
        success: true;
        data: {
          id: string;
          amount: number;
          reason: string | null;
          groupId: string;
          adminId: string;
          createdAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const result = await this.addCoinsUseCase.execute({
      tripId: input.tripId,
      groupId: input.groupId,
      amount: input.amount,
      reason: input.reason,
      adminId: input.adminId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        id: result.value.transaction.id,
        amount: result.value.transaction.amount,
        reason: result.value.transaction.reason,
        groupId: result.value.transaction.groupId,
        adminId: result.value.transaction.adminId,
        createdAt: result.value.transaction.createdAt,
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
  }): Promise<
    | {
        success: true;
        data: {
          id: string;
          amount: number;
          reason: string | null;
          groupId: string;
          adminId: string;
          createdAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const result = await this.removeCoinsUseCase.execute({
      tripId: input.tripId,
      groupId: input.groupId,
      amount: input.amount,
      reason: input.reason,
      adminId: input.adminId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        id: result.value.transaction.id,
        amount: result.value.transaction.amount,
        reason: result.value.transaction.reason,
        groupId: result.value.transaction.groupId,
        adminId: result.value.transaction.adminId,
        createdAt: result.value.transaction.createdAt,
      },
    };
  }
}
