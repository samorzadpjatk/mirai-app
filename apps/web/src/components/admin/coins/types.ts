/**
 * Coin Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and Zod schemas for coin management.
 * These types follow the pattern established in Step 9 for CRUD operations.
 *
 * @module @/components/admin/coins/types
 */

import { z } from 'zod'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Coin balance for a group
 */
export interface CoinBalance {
  /** Group ID */
  groupId: string
  /** Group name */
  name: string
  /** Current coin balance */
  coins: number
  /** Total coins earned */
  totalEarned: number
  /** Total coins spent */
  totalSpent: number
}

/**
 * Coin transaction record
 */
export interface CoinTransaction {
  /** Transaction ID */
  id: string
  /** Group ID */
  groupId: string
  /** Transaction amount (positive for add, negative for remove) */
  amount: number
  /** Reason for the transaction */
  reason?: string
  /** Admin ID who performed the operation */
  adminId: string
  /** Transaction timestamp */
  createdAt: string
}

/**
 * Input for adding coins to a group
 */
export interface AddCoinsInput {
  /** Trip ID */
  tripId: string
  /** Group ID */
  groupId: string
  /** Amount to add (must be positive) */
  amount: number
}

/**
 * Input for removing coins from a group
 */
export interface RemoveCoinsInput {
  /** Trip ID */
  tripId: string
  /** Group ID */
  groupId: string
  /** Amount to remove (must be positive) */
  amount: number
  /** Reason for removal */
  reason?: string
}

/**
 * Result from add/remove coins operation
 */
export interface CoinOperationResult {
  /** Group ID */
  groupId: string
  /** Amount that was added/removed */
  amount: number
  /** Previous coin balance */
  previousCoins: number
  /** New coin balance after operation */
  newCoins: number
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Zod schema for coin operation (add/remove)
 * Validates tripId, groupId, and amount
 */
export const coinOperationSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  groupId: z.string().min(1, 'Group ID is required'),
  amount: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be greater than 0')
    .max(10000, 'Amount cannot exceed 10,000 coins'),
  reason: z
    .string()
    .max(200, 'Reason must be less than 200 characters')
    .optional(),
})

/**
 * Zod schema for adding coins
 */
export const addCoinsSchema = coinOperationSchema

/**
 * Zod schema for removing coins
 */
export const removeCoinsSchema = coinOperationSchema

/**
 * Type inference helpers
 */
export type CoinOperationSchema = z.infer<typeof coinOperationSchema>
export type AddCoinsSchema = z.infer<typeof addCoinsSchema>
export type RemoveCoinsSchema = z.infer<typeof removeCoinsSchema>
