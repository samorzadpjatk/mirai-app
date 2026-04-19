/**
 * Activity Module - Barrel Export
 *
 * Provides a centralized export point for all activity-related components,
 * hooks, types, and utilities. This enables clean imports throughout the app.
 *
 * @module @/components/admin/activity
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Activity from '@/components/admin/activity';
 *
 * // Use components
 * <Activity.CreateActivityContent />
 * <Activity.EditActivityContent />
 *
 * // Use hooks
 * const { activities } = Activity.useGetActivitiesQuery(tripId);
 *
 * // Use types
 * type Activity = Activity.Activity;
 * ```
 *
 * @example
 * ```tsx
 * // Import specific items
 * import {
 *   ActivityCard,
 *   CreateActivityForm,
 *   useGetActivitiesQuery,
 *   type Activity,
 * } from '@/components/admin/activity';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { ActivityCard, ActivityCardSkeleton } from './ActivityCard'
export { CreateActivityForm } from './CreateActivityForm'
export { EditActivityForm } from './EditActivityForm'
export { CreateActivityContent } from './CreateActivityContent'
export { EditActivityContent } from './EditActivityContent'
export { ActivityPageContent } from './ActivityPageContent'

// =============================================================================
// Hooks
// =============================================================================

export {
  useGetActivitiesQuery,
  useGetActivityQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useReorderActivitiesMutation,
} from './hooks'

// =============================================================================
// Types & Schemas
// =============================================================================

export type {
  Activity,
  ActivityType,
  CreateActivityInput,
  UpdateActivityInput,
  ScheduleDay,
} from './types'

export {
  createActivitySchema,
  updateActivitySchema,
  type CreateActivitySchema,
  type UpdateActivitySchema,
  getActivityTypeLabel,
  getActivityTypeColor,
  getActivityTypeIcon,
  groupActivitiesByDay,
  formatTime,
  formatDate,
} from './types'
