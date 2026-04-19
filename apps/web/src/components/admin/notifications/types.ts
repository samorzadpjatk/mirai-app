/**
 * Notification Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and Zod schemas for notification management.
 * These types follow the pattern established in Step 9 for CRUD operations.
 *
 * @module @/components/admin/notifications/types
 */

import { z } from 'zod'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Notification entity representing a sent notification
 */
export interface Notification {
  /** Unique notification identifier */
  id: string
  /** Notification title */
  title: string
  /** Notification message/body */
  body: string
  /** Optional URL for deep linking */
  url?: string | null
  /** Trip ID the notification belongs to */
  tripId: string
  /** User ID who created the notification */
  createdById: string
  /** Creation timestamp */
  createdAt: string
  /** Last update timestamp */
  updatedAt: string
}

/**
 * Target type for notification delivery
 */
export type NotificationTargetType = 'all' | 'users' | 'groups'

/**
 * Input for creating a new notification
 */
export interface CreateNotificationInput {
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Optional URL for deep linking */
  url?: string | null
  /** Target user IDs (empty for all users in target groups) */
  targetUserIds?: string[]
  /** Target group IDs (empty for all groups in trip) */
  targetGroupIds?: string[]
  /** Trip ID the notification belongs to */
  tripId?: string
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Zod schema for creating a notification
 * Validates title, message, and optional target filtering
 */
export const createNotificationSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters')
    .trim(),
  url: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  targetUserIds: z.array(z.string()).optional().default([]),
  targetGroupIds: z.array(z.string()).optional().default([]),
})

/**
 * Type inference helpers
 */
export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>
