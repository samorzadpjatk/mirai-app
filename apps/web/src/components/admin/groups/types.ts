/**
 * Group Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and Zod schemas for group management.
 * These types follow the pattern established for CRUD operations.
 *
 * @module @/components/admin/groups/types
 */

import { z } from 'zod'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Group entity representing a group in a trip
 */
export interface Group {
  /** Unique group identifier */
  id: string
  /** Group name */
  name: string
  /** Number of coins the group has */
  coins: number
}

/**
 * Input for creating a new group
 */
export interface CreateGroupInput {
  /** Group name */
  name: string
  /** Trip ID the group belongs to (added by the component) */
  tripId?: string
}

/**
 * Input for updating an existing group
 */
export interface UpdateGroupInput extends Partial<CreateGroupInput> {
  /** Group ID to update */
  id: string
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Zod schema for creating a group
 * Validates name (required, 1-100 characters)
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be less than 100 characters')
    .trim(),
})

/**
 * Zod schema for updating a group
 * All fields are optional except id
 */
export const updateGroupSchema = z.object({
  id: z.string().min(1, 'Group ID is required'),
  name: z
    .string()
    .min(1, 'Group name must be at least 1 character')
    .max(100, 'Group name must be less than 100 characters')
    .trim()
    .optional(),
})

/**
 * Type inference helpers
 */
export type CreateGroupSchema = z.infer<typeof createGroupSchema>
export type UpdateGroupSchema = z.infer<typeof updateGroupSchema>
