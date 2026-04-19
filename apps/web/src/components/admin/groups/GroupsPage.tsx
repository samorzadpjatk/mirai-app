'use client'

import { GroupsPageContent } from './GroupsPageContent'

/**
 * GroupsPage - Main groups list page component
 *
 * This is a thin wrapper around GroupsPageContent that provides
 * the page-level structure for the groups list.
 *
 * @example
 * ```tsx
 * <GroupsPage />
 * ```
 */
export function GroupsPage() {
  return <GroupsPageContent />
}

// Re-export content component for direct usage
export { GroupsPageContent } from './GroupsPageContent'
