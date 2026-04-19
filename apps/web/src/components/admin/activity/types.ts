/**
 * Activity Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and Zod schemas for schedule activity management.
 * These types follow the pattern established in Step 9 for CRUD operations.
 *
 * @module @/components/admin/activity/types
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

/**
 * Activity types for schedule items
 */
export type ActivityType =
  | 'GENERAL'
  | 'MEAL'
  | 'TRANSPORT'
  | 'CHALLENGE'
  | 'REST'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'MEETING'
  | 'FREE_TIME'
  | 'OTHER'

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Activity entity representing a scheduled item in a trip
 */
export interface Activity {
  /** Unique activity identifier */
  id: string
  /** Activity name/title */
  title: string
  /** Activity description */
  description: string | null
  /** Trip ID the activity belongs to */
  tripId: string
  /** Type of activity */
  type: ActivityType
  /** Start time of the activity */
  startTime: string
  /** End time of the activity */
  endTime: string | null
  /** Location of the activity */
  location: string | null
  /** Display order in the schedule */
  order: number
  /** Whether the activity is visible to participants */
  isVisible: boolean
  /** When the activity was created */
  createdAt: string
  /** When the activity was last updated */
  updatedAt: string
}

/**
 * Input for creating a new activity
 */
export interface CreateActivityInput {
  /** Activity name/title */
  title: string
  /** Activity description (optional) */
  description?: string | null
  /** Trip ID the activity belongs to */
  tripId: string
  /** Type of activity */
  type: ActivityType
  /** Start time of the activity */
  startTime: string
  /** End time of the activity (optional) */
  endTime?: string | null
  /** Location of the activity (optional) */
  location?: string | null
  /** Display order in the schedule (optional, defaults to end) */
  order?: number
  /** Whether the activity is visible to participants (optional, defaults to true) */
  isVisible?: boolean
}

/**
 * Input for updating an existing activity
 */
export interface UpdateActivityInput extends Partial<CreateActivityInput> {
  /** Activity ID to update */
  id: string
}

/**
 * Schedule day grouping for timeline view
 */
export interface ScheduleDay {
  /** Date string (YYYY-MM-DD) */
  date: string
  /** Day number in the trip */
  dayNumber: number
  /** Activities for this day */
  activities: Activity[]
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

/**
 * Zod schema for creating an activity
 * Validates title, type, times, and other fields
 */
export const createActivitySchema = z.object({
  title: z
    .string()
    .min(1, 'Activity title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .nullable()
    .optional(),
  type: z.enum([
    'GENERAL',
    'MEAL',
    'TRANSPORT',
    'CHALLENGE',
    'REST',
    'CHECK_IN',
    'CHECK_OUT',
    'MEETING',
    'FREE_TIME',
    'OTHER',
  ], { message: 'Please select a valid activity type' }),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        // Basic ISO datetime validation
        return !isNaN(Date.parse(val))
      },
      { message: 'Invalid end time format' }
    ),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .nullable()
    .optional(),
  isVisible: z.boolean().optional(),
})

/**
 * Zod schema for updating an activity
 * All fields are optional except id
 */
export const updateActivitySchema = z.object({
  id: z.string().min(1, 'Activity ID is required'),
  title: z
    .string()
    .min(1, 'Activity title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .nullable()
    .optional(),
  type: z.enum([
    'GENERAL',
    'MEAL',
    'TRANSPORT',
    'CHALLENGE',
    'REST',
    'CHECK_IN',
    'CHECK_OUT',
    'MEETING',
    'FREE_TIME',
    'OTHER',
  ], { message: 'Please select a valid activity type' }).optional(),
  startTime: z.string().min(1, 'Start time is required').optional(),
  endTime: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        return !isNaN(Date.parse(val))
      },
      { message: 'Invalid end time format' }
    ),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .nullable()
    .optional(),
  isVisible: z.boolean().optional(),
})

/**
 * Type inference helpers
 */
export type CreateActivitySchema = z.infer<typeof createActivitySchema>
export type UpdateActivitySchema = z.infer<typeof updateActivitySchema>

// =============================================================================
// Activity Type Helpers
// =============================================================================

/**
 * Get human-readable activity type label
 */
export function getActivityTypeLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    GENERAL: 'General',
    MEAL: 'Meal',
    TRANSPORT: 'Transport',
    CHALLENGE: 'Challenge',
    REST: 'Rest',
    CHECK_IN: 'Check In',
    CHECK_OUT: 'Check Out',
    MEETING: 'Meeting',
    FREE_TIME: 'Free Time',
    OTHER: 'Other',
  }
  return labels[type]
}

/**
 * Get activity type color for UI display
 */
export function getActivityTypeColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    GENERAL: '#6b7280', // gray
    MEAL: '#f59e0b', // amber
    TRANSPORT: '#3b82f6', // blue
    CHALLENGE: '#ef4444', // red
    REST: '#10b981', // emerald
    CHECK_IN: '#22c55e', // green
    CHECK_OUT: '#ef4444', // red
    MEETING: '#8b5cf6', // violet
    FREE_TIME: '#06b6d4', // cyan
    OTHER: '#6b7280', // gray
  }
  return colors[type]
}

/**
 * Get activity type icon name
 */
export function getActivityTypeIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    GENERAL: 'Calendar',
    MEAL: 'Utensils',
    TRANSPORT: 'Bus',
    CHALLENGE: 'Trophy',
    REST: 'Bed',
    CHECK_IN: 'LogIn',
    CHECK_OUT: 'LogOut',
    MEETING: 'Users',
    FREE_TIME: 'Clock',
    OTHER: 'HelpCircle',
  }
  return icons[type]
}

// =============================================================================
// Schedule Helpers
// =============================================================================

/**
 * Group activities by day for timeline view
 */
export function groupActivitiesByDay(
  activities: Activity[],
  tripStartDate: string
): ScheduleDay[] {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const days = new Map<string, Activity[]>()

  for (const activity of sorted) {
    const dateParts = activity.startTime.split('T')
    const date: string = dateParts[0] ?? activity.startTime
    if (!days.has(date)) {
      days.set(date, [])
    }
    const dayActivities = days.get(date)
    if (dayActivities) {
      dayActivities.push(activity)
    }
  }

  const startDate = new Date(tripStartDate)
  const result: ScheduleDay[] = []

  for (const [date, dayActivities] of days) {
    const currentDate = new Date(date)
    const timeDiff = currentDate.getTime() - startDate.getTime()
    const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const dayNumber = Math.max(1, dayDiff + 1)

    result.push({
      date,
      dayNumber,
      activities: dayActivities.sort((a, b) => a.order - b.order),
    })
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Format time for display (HH:MM)
 */
export function formatTime(dateTimeString: string): string {
  const date = new Date(dateTimeString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format date for display (Month Day)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}
