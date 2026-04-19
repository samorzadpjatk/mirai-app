/**
 * RewardsPage Component
 *
 * Entry point for the rewards list page.
 * This component is used for direct imports when needed.
 *
 * @module @/components/admin/rewards/RewardsPage
 */

'use client'

import { RewardsPageContent } from './RewardsPageContent'

/**
 * RewardsPage - Entry point for the rewards list page
 *
 * This is a thin wrapper around RewardsPageContent for cases
 * where you need to import the page component directly.
 *
 * For lazy-loaded usage in PageContent.tsx, use RewardsPageContent directly.
 *
 * @example
 * ```tsx
 * import { RewardsPage } from '@/components/admin/rewards/RewardsPage';
 *
 * function App() {
 *   return <RewardsPage />;
 * }
 * ```
 */
export function RewardsPage() {
  return <RewardsPageContent />
}

// Re-export content component for convenience
export { RewardsPageContent } from './RewardsPageContent'
