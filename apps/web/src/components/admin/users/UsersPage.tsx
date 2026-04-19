/**
 * UsersPage Component
 *
 * Entry point for the users list page.
 * This component is used for direct imports when needed.
 *
 * @module @/components/admin/users/UsersPage
 */

'use client'

import { UsersPageContent } from './UsersPageContent'

/**
 * UsersPage - Entry point for the users list page
 *
 * This is a thin wrapper around UsersPageContent for cases
 * where you need to import the page component directly.
 *
 * For lazy-loaded usage in PageContent.tsx, use UsersPageContent directly.
 *
 * @example
 * ```tsx
 * import { UsersPage } from '@/components/admin/users/UsersPage';
 *
 * function App() {
 *   return <UsersPage />;
 * }
 * ```
 */
export function UsersPage() {
  return <UsersPageContent />
}

// Re-export content component for convenience
export { UsersPageContent } from './UsersPageContent'
