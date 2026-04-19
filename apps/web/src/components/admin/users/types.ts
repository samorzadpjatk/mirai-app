/**
 * User Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and Zod schemas for user management.
 * These types follow the pattern established in Step 9 for CRUD operations.
 *
 * @module @/components/admin/users/types
 */

import { z } from 'zod'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * User entity representing a trip participant
 */
export interface User {
  /** Unique user identifier */
  id: string
  /** User's first name */
  firstName: string
  /** User's last name */
  lastName: string
  /** User's email address */
  email: string
  /** Trip ID the user belongs to */
  tripId: string
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  /** User's first name */
  firstName: string
  /** User's last name */
  lastName: string
  /** User's email address */
  email: string
  /** Trip ID the user belongs to (added by the component) */
  tripId?: string
}

/**
 * Input for updating an existing user
 */
export interface UpdateUserInput extends Partial<CreateUserInput> {
  /** User ID to update */
  id: string
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Email validation regex - standard email format
 */
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * Zod schema for creating a user
 * Validates first name, last name, and email
 */
export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .regex(emailRegex, 'Please enter a valid email address')
    .trim()
    .toLowerCase(),
})

/**
 * Zod schema for updating a user
 * All fields are optional except id
 */
export const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  firstName: z
    .string()
    .min(1, 'First name must be at least 1 character')
    .max(50, 'First name must be less than 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name must be at least 1 character')
    .max(50, 'Last name must be less than 50 characters')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Invalid email format')
    .regex(emailRegex, 'Please enter a valid email address')
    .trim()
    .toLowerCase()
    .optional(),
})

/**
 * Type inference helpers
 */
export type CreateUserSchema = z.infer<typeof createUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>
