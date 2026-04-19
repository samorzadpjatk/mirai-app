/**
 * Challenges Module - Barrel Exports
 *
 * Centralized exports for the challenges module.
 *
 * @module @/components/admin/challenges
 */

// =============================================================================
// Page Components
// =============================================================================

export { ChallengesPage, ChallengesPageContent } from './ChallengesPage'
export { CreateChallengeContent } from './CreateChallengeContent'
export { EditChallengeContent } from './EditChallengeContent'
export { ChallengeDetailsContent } from './ChallengeDetailsContent'
export { ChallengeSubmissionsPage } from './ChallengeSubmissionsPage'
export { StaffVotingPage } from './StaffVotingPage'
export { JudgingPage } from './JudgingPage'

// =============================================================================
// UI Components
// =============================================================================

export { ChallengeCard, ChallengeCardSkeleton } from './ChallengeCard'
export { SubmissionCard, SubmissionCardSkeleton } from './SubmissionCard'
export { ChallengeForm } from './ChallengeForm'

// =============================================================================
// Hooks
// =============================================================================

export {
  // Query hooks
  useGetChallengesQuery,
  useGetChallengeQuery,
  useGetChallengeSubmissionsQuery,
  useGetSubmissionDetailsQuery,

  // Mutation hooks
  useCreateChallengeMutation,
  useUpdateChallengeMutation,
  useDeleteChallengeMutation,
  useChangeChallengeStatusMutation,
  useReviewSubmissionMutation,
  useCastVoteMutation,
  useRemoveVoteMutation,
  useSubmitJudgementMutation,
  useUpdateJudgementMutation,
  useDeleteJudgementMutation,

  // Subscription hooks
  useSubmissionUpdatesSubscription,
  useVoteUpdatesSubscription,
} from './hooks'

// =============================================================================
// Types
// =============================================================================

export type {
  // Enums
  ChallengeSubmissionType,
  ChallengeScoringCategory,
  ChallengeStatus,
  SubmissionStatus,

  // Entity types
  Challenge,
  ChallengeListItem,
  ChallengeSubmission,
  SubmissionWithDetails,
  Vote,
  Judgement,

  // Input types
  CreateChallengeInput,
  UpdateChallengeInput,
  ReviewSubmissionInput,
  CastVoteInput,
  SubmitJudgementInput,
} from './types'

// =============================================================================
// Type Guards & Helpers
// =============================================================================

export {
  getChallengeStatusLabel,
  getChallengeStatusColor,
  canEditChallenge,
  isChallengeActive,
  isVotingPhase,
  isChallengeEnded,
  getSubmissionStatusLabel,
  getSubmissionStatusColor,
  getScoringCategoryLabel,
  requiresJudging,
  requiresVoting,
  getSubmissionTypeLabel,
} from './types'
