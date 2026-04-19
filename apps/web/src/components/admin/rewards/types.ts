/**
 * Reward Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and Zod schemas for reward management.
 * These types follow the pattern established in Step 9 for CRUD operations.
 *
 * @module @/components/admin/rewards/types
 */

import { z } from 'zod'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Reward entity representing a redeemable item in a trip
 */
export interface Reward {
  /** Unique reward identifier */
  id: string
  /** Reward name */
  name: string
  /** Reward description */
  description: string | null
  /** URL to reward image */
  image: string | null
  /** Cost in coins to redeem */
  coinCost: number | null
  /** Available quantity (null = unlimited) */
  availableQuantity: number | null
  /** Whether the reward is hidden from participants */
  isHidden: boolean | null
  /** Trip ID the reward belongs to */
  tripId: string
  /** When the reward was created */
  createdAt: string | null
  /** When the reward was last updated */
  updatedAt: string | null
}

/**
 * Input for creating a new reward
 */
export interface CreateRewardInput {
  /** Reward name */
  name: string
  /** Reward description (optional) */
  description?: string | null
  /** URL to reward image (optional) */
  image?: string | null
  /** Cost in coins to redeem (optional) */
  coinCost?: number | null
  /** Available quantity (optional, null = unlimited) */
  quantity?: number | null
  /** Trip ID the reward belongs to */
  tripId: string
}

/**
 * Input for updating an existing reward
 */
export interface UpdateRewardInput extends Partial<CreateRewardInput> {
  /** Reward ID to update */
  id: string
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Zod schema for creating a reward
 * Validates name, description, coin cost, and quantity
 */
export const createRewardSchema = z.object({
  name: z
    .string()
    .min(1, 'Reward name is required')
    .max(100, 'Reward name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .nullable()
    .optional(),
  image: z
    .string()
    .url('Image must be a valid URL')
    .nullable()
    .optional(),
  coinCost: z
    .number()
    .int('Coin cost must be a whole number')
    .min(0, 'Coin cost cannot be negative')
    .nullable()
    .optional(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .nullable()
    .optional(),
})

/**
 * Zod schema for updating a reward
 * All fields are optional except id
 */
export const updateRewardSchema = z.object({
  id: z.string().min(1, 'Reward ID is required'),
  name: z
    .string()
    .min(1, 'Reward name is required')
    .max(100, 'Reward name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .nullable()
    .optional(),
  image: z
    .string()
    .url('Image must be a valid URL')
    .nullable()
    .optional(),
  coinCost: z
    .number()
    .int('Coin cost must be a whole number')
    .min(0, 'Coin cost cannot be negative')
    .nullable()
    .optional(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .nullable()
    .optional(),
})

/**
 * Type inference helpers
 */
export type CreateRewardSchema = z.infer<typeof createRewardSchema>
export type UpdateRewardSchema = z.infer<typeof updateRewardSchema>

// =============================================================================
// File Upload Types (interface contract with Step 12)
// =============================================================================

/**
 * Result from uploading a file
 */
export interface FileUploadResult {
  /** The URL of the uploaded file */
  url: string
  /** The storage path of the uploaded file */
  path: string
}

/**
 * Props for file upload component
 */
export interface FileUploadProps {
  /** Current image URL (if any) */
  value?: string | null
  /** Called when upload completes */
  onUploadComplete: (result: FileUploadResult) => void
  /** Called when upload fails */
  onUploadError?: (error: Error) => void
  /** Whether the upload is disabled */
  disabled?: boolean
  /** Accepted file types */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
}
