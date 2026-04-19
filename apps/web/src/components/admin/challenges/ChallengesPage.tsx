/**
 * ChallengesPage Component
 *
 * Entry point for the challenges list page.
 * This component is used for direct imports when needed.
 *
 * @module @/components/admin/challenges/ChallengesPage
 */

'use client'

import { ChallengesPageContent } from './ChallengesPageContent'

/**
 * ChallengesPage - Entry point for the challenges list page
 *
 * This is a thin wrapper around ChallengesPageContent for cases
 * where you need to import the page component directly.
 *
 * For lazy-loaded usage in PageContent.tsx, use ChallengesPageContent directly.
 */
export function ChallengesPage() {
  return <ChallengesPageContent />
}

// Re-export content component for convenience
export { ChallengesPageContent } from './ChallengesPageContent'
