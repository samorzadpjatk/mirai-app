/**
 * Schedules Module - Barrel Export
 *
 * Provides a centralized export point for all schedule-related components.
 * This enables clean imports throughout the app.
 *
 * @module @/components/admin/schedules
 *
 * @example
 * ```tsx
 * // Import everything
 * import * as Schedules from '@/components/admin/schedules';
 *
 * // Use components
 * <Schedules.SchedulesPageContent />
 *
 * @example
 * ```tsx
 * // Import specific items
 * import { SchedulesPage, SchedulesPageContent } from '@/components/admin/schedules';
 * ```
 */

// =============================================================================
// Components
// =============================================================================

export { SchedulesPage, SchedulesPageContent } from './SchedulesPage'

// Re-export activity components for convenience
export {
  // Content components
  CreateActivityContent,
  EditActivityContent,
  // Forms
  CreateActivityForm,
  EditActivityForm,
  // Card
  ActivityCard,
  ActivityCardSkeleton,
} from '../activity'

// =============================================================================
// Hooks (re-exported from activity)
// =============================================================================

export {
  useGetActivitiesQuery,
  useGetActivityQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useReorderActivitiesMutation,
} from '../activity'

// =============================================================================
// Types & Schemas (re-exported from activity)
// =============================================================================

export type {
  Activity,
  ActivityType,
  CreateActivityInput,
  UpdateActivityInput,
  ScheduleDay,
} from '../activity'

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
} from '../activity'
