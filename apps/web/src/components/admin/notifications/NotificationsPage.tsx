/**
 * NotificationsPage Component
 *
 * Entry point for the notifications list page.
 * This component is used for direct imports when needed.
 *
 * @module @/components/admin/notifications/NotificationsPage
 */

'use client'

import { NotificationsPageContent } from './NotificationsPageContent'

/**
 * NotificationsPage - Entry point for the notifications list page
 *
 * This is a thin wrapper around NotificationsPageContent for cases
 * where you need to import the page component directly.
 *
 * For lazy-loaded usage in PageContent.tsx, use NotificationsPageContent directly.
 *
 * @example
 * ```tsx
 * import { NotificationsPage } from '@/components/admin/notifications/NotificationsPage';
 *
 * function App() {
 *   return <NotificationsPage />;
 * }
 * ```
 */
export function NotificationsPage() {
  return <NotificationsPageContent />
}

// Re-export content component for convenience
export { NotificationsPageContent } from './NotificationsPageContent'
