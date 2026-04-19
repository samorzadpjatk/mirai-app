/**
 * CoinsOverviewPage Component
 *
 * Entry point for the coins management overview page.
 * This component is used for direct imports when needed.
 *
 * @module @/components/admin/coins/CoinsOverviewPage
 */

'use client'

import { CoinsPageContent } from './CoinsPageContent'

/**
 * CoinsOverviewPage - Entry point for the coins management page
 *
 * This is a thin wrapper around CoinsPageContent for cases
 * where you need to import the page component directly.
 *
 * For lazy-loaded usage in PageContent.tsx, use CoinsPageContent directly.
 *
 * @example
 * ```tsx
 * import { CoinsOverviewPage } from '@/components/admin/coins/CoinsOverviewPage';
 *
 * function App() {
 *   return <CoinsOverviewPage />;
 * }
 * ```
 */
export function CoinsOverviewPage() {
  return <CoinsPageContent />
}

// Re-export content component for convenience
export { CoinsPageContent } from './CoinsPageContent'
