/**
 * ActivityPageContent Component
 *
 * Wrapper component for the activity management page.
 * Delegates to SchedulesPageContent for the main schedule view.
 *
 * @module @/components/admin/activity/ActivityPageContent
 */

'use client'

import { SchedulesPageContent } from '../schedules/SchedulesPageContent'

/**
 * ActivityPageContent - Main content for the activity management page
 *
 * This is an alias to SchedulesPageContent since activities are
 * managed within the schedule timeline view.
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'activity': () => import('../admin/activity/ActivityPageContent'),
 * ```
 */
export function ActivityPageContent() {
  return <SchedulesPageContent />
}
