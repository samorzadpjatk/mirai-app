/**
 * SchedulesPage Component
 *
 * Entry point for the schedule/activities list page.
 * This component is used for direct imports when needed.
 *
 * @module @/components/admin/schedules/SchedulesPage
 */

'use client'

import { SchedulesPageContent } from './SchedulesPageContent'

/**
 * SchedulesPage - Entry point for the schedules list page
 *
 * This is a thin wrapper around SchedulesPageContent for cases
 * where you need to import the page component directly.
 *
 * For lazy-loaded usage in PageContent.tsx, use SchedulesPageContent directly.
 *
 * @example
 * ```tsx
 * import { SchedulesPage } from '@/components/admin/schedules/SchedulesPage';
 *
 * function App() {
 *   return <SchedulesPage />;
 * }
 * ```
 */
export function SchedulesPage() {
  return <SchedulesPageContent />
}

// Re-export content component for convenience
export { SchedulesPageContent } from './SchedulesPageContent'
