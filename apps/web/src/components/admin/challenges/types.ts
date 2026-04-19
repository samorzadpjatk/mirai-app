/**
 * Challenge Types and Validation Schemas
 *
 * Defines the TypeScript interfaces and types for challenge management.
 * These types follow the pattern established for CRUD operations.
 *
 * @module @/components/admin/challenges/types
 */

// =============================================================================
// Enums
// =============================================================================

/**
 * Challenge submission types
 */
export type ChallengeSubmissionType =
  | 'IMAGE'
  | 'MULTI_IMAGE'
  | 'VIDEO'
  | 'TEXT'
  | 'IMAGE_LOCATION'
  | 'LOCATION'
  | 'QR_CODE'

/**
 * Challenge scoring categories
 */
export type ChallengeScoringCategory =
  | 'SPEED'
  | 'UNLIMITED'
  | 'JUDGED_STAFF'
  | 'PEER_VOTING'

/**
 * Challenge statuses
 */
export type ChallengeStatus =
  | 'HIDDEN'
  | 'VISIBLE'
  | 'ACTIVE'
  | 'VOTING_PHASE'
  | 'COMPLETED'
  | 'CANCELLED'

/**
 * Submission statuses
 */
export type SubmissionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW'

// =============================================================================
// Challenge Types
// =============================================================================

/**
 * Challenge entity representing a trip activity
 */
export interface Challenge {
  /** Unique challenge identifier */
  id: string
  /** Challenge name */
  name: string
  /** Challenge description */
  description?: string
  /** Challenge image URL */
  image?: string
  /** Trip ID the challenge belongs to */
  tripId: string
  /** Current challenge status */
  status: ChallengeStatus
  /** Submission type required */
  submissionType: ChallengeSubmissionType
  /** Scoring category */
  scoringCategory: ChallengeScoringCategory
  /** Base points for completing challenge */
  basePoints: number
  /** Points for first place */
  firstPlacePoints?: number
  /** Points for second place */
  secondPlacePoints?: number
  /** Points for third place */
  thirdPlacePoints?: number
  /** Whether challenge is recurring */
  isRecurring: boolean
  /** Number of days for recurring challenge */
  recurringDays?: number
  /** Daily start time (HH:mm) */
  dailyStartTime?: string
  /** Daily end time (HH:mm) */
  dailyEndTime?: string
  /** Challenge start time */
  startTime?: Date
  /** Challenge end time */
  endTime?: Date
  /** Voting duration in hours (for peer voting) */
  votingDurationHours?: number
  /** Voting start time (for peer voting) */
  votingStartTime?: Date
  /** Voting end time (for peer voting) */
  votingEndTime?: Date
  /** Target latitude (for location-based challenges) */
  targetLatitude?: number
  /** Target longitude (for location-based challenges) */
  targetLongitude?: number
  /** QR code expected value */
  qrCodeValue?: string
  /** Text expected phrase (for auto-approve text challenges) */
  textExpectedPhrase?: string
  /** Whether to auto-approve submissions */
  autoApprove: boolean
  /** When challenge was created */
  createdAt: Date
  /** When challenge was last updated */
  updatedAt: Date
}

/**
 * Simplified challenge for list views
 */
export interface ChallengeListItem {
  id: string
  name: string
  description?: string
  image?: string
  status: ChallengeStatus
  submissionType: ChallengeSubmissionType
  scoringCategory: ChallengeScoringCategory
  basePoints: number
  submissionCount: number
  approvedCount: number
  pendingCount: number
  startTime?: Date
  endTime?: Date
  createdAt: Date
}

// =============================================================================
// Submission Types
// =============================================================================

/**
 * Challenge submission from a participant
 */
export interface ChallengeSubmission {
  /** Unique submission identifier */
  id: string
  /** Challenge ID this submission is for */
  challengeId: string
  /** Group ID that made the submission */
  groupId: string
  /** Group name */
  groupName: string
  /** User ID who submitted */
  userId: string
  /** User name */
  userName: string
  /** Submission status */
  status: SubmissionStatus
  /** Submission content/text */
  content?: string
  /** Submission image URLs */
  imageUrls: string[]
  /** Submission video URL */
  videoUrl?: string
  /** Location latitude */
  latitude?: number
  /** Location longitude */
  longitude?: number
  /** QR code value scanned */
  qrCodeValue?: string
  /** When submission was created */
  createdAt: Date
  /** When submission was reviewed (if applicable) */
  reviewedAt?: Date
  /** Reviewer user ID (if applicable) */
  reviewedById?: string
  /** Reviewer name */
  reviewedByName?: string
  /** Rejection reason (if rejected) */
  rejectionReason?: string
}

/**
 * Vote on a submission
 */
export interface Vote {
  id: string
  submissionId: string
  userId: string
  userName: string
  /** Position/rank (1st, 2nd, 3rd, etc.) */
  position: number
  createdAt: Date
}

/**
 * Judgement/score from a staff judge
 */
export interface Judgement {
  id: string
  submissionId: string
  judgeId: string
  judgeName: string
  /** Score assigned (typically 1-100) */
  score: number
  /** Optional feedback */
  feedback?: string
  createdAt: Date
}

/**
 * Submission with votes and judgements
 */
export interface SubmissionWithDetails extends ChallengeSubmission {
  votes: Vote[]
  voteCount: number
  judgements: Judgement[]
  averageScore?: number
  rank?: number
}

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a challenge
 */
export interface CreateChallengeInput {
  name: string
  description?: string
  image?: string
  tripId: string
  submissionType: ChallengeSubmissionType
  scoringCategory: ChallengeScoringCategory
  basePoints?: number
  firstPlacePoints?: number
  secondPlacePoints?: number
  thirdPlacePoints?: number
  isRecurring?: boolean
  recurringDays?: number
  dailyStartTime?: string
  dailyEndTime?: string
  status?: 'HIDDEN' | 'VISIBLE'
  startTime?: Date
  endTime?: Date
  votingDurationHours?: number
  votingStartTime?: Date
  votingEndTime?: Date
  targetLatitude?: number
  targetLongitude?: number
  qrCodeValue?: string
  textExpectedPhrase?: string
  autoApprove?: boolean
}

/**
 * Input for updating a challenge
 */
export interface UpdateChallengeInput extends Partial<CreateChallengeInput> {
  id: string
}

/**
 * Input for reviewing a submission
 */
export interface ReviewSubmissionInput {
  submissionId: string
  status: 'APPROVED' | 'REJECTED'
  rejectionReason?: string
}

/**
 * Input for casting a vote
 */
export interface CastVoteInput {
  submissionId: string
  position: number
}

/**
 * Input for submitting a judgement
 */
export interface SubmitJudgementInput {
  submissionId: string
  score: number
  feedback?: string
}

// =============================================================================
// Challenge Status Helpers
// =============================================================================

/**
 * Get human-readable status label
 */
export function getChallengeStatusLabel(status: ChallengeStatus): string {
  const labels: Record<ChallengeStatus, string> = {
    HIDDEN: 'Hidden',
    VISIBLE: 'Visible',
    ACTIVE: 'Active',
    VOTING_PHASE: 'Voting Phase',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return labels[status]
}

/**
 * Get status color for UI display
 */
export function getChallengeStatusColor(status: ChallengeStatus): string {
  const colors: Record<ChallengeStatus, string> = {
    HIDDEN: '#6b7280', // gray
    VISIBLE: '#3b82f6', // blue
    ACTIVE: '#22c55e', // green
    VOTING_PHASE: '#f59e0b', // amber
    COMPLETED: '#10b981', // emerald
    CANCELLED: '#ef4444', // red
  }
  return colors[status]
}

/**
 * Check if challenge is in a state that allows editing
 */
export function canEditChallenge(status: ChallengeStatus): boolean {
  return status === 'HIDDEN' || status === 'VISIBLE'
}

/**
 * Check if challenge allows submissions
 */
export function isChallengeActive(status: ChallengeStatus): boolean {
  return status === 'ACTIVE'
}

/**
 * Check if challenge is in voting phase
 */
export function isVotingPhase(status: ChallengeStatus): boolean {
  return status === 'VOTING_PHASE'
}

/**
 * Check if challenge has ended
 */
export function isChallengeEnded(status: ChallengeStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED'
}

// =============================================================================
// Submission Status Helpers
// =============================================================================

/**
 * Get human-readable submission status label
 */
export function getSubmissionStatusLabel(status: SubmissionStatus): string {
  const labels: Record<SubmissionStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    UNDER_REVIEW: 'Under Review',
  }
  return labels[status]
}

/**
 * Get submission status color
 */
export function getSubmissionStatusColor(status: SubmissionStatus): string {
  const colors: Record<SubmissionStatus, string> = {
    PENDING: '#f59e0b', // amber
    APPROVED: '#22c55e', // green
    REJECTED: '#ef4444', // red
    UNDER_REVIEW: '#3b82f6', // blue
  }
  return colors[status]
}

// =============================================================================
// Scoring Category Helpers
// =============================================================================

/**
 * Get human-readable scoring category label
 */
export function getScoringCategoryLabel(category: ChallengeScoringCategory): string {
  const labels: Record<ChallengeScoringCategory, string> = {
    SPEED: 'Speed (First to Complete)',
    UNLIMITED: 'Unlimited (All Complete)',
    JUDGED_STAFF: 'Staff Judged',
    PEER_VOTING: 'Peer Voting',
  }
  return labels[category]
}

/**
 * Check if category requires judging
 */
export function requiresJudging(category: ChallengeScoringCategory): boolean {
  return category === 'JUDGED_STAFF'
}

/**
 * Check if category requires voting
 */
export function requiresVoting(category: ChallengeScoringCategory): boolean {
  return category === 'PEER_VOTING'
}

// =============================================================================
// Submission Type Helpers
// =============================================================================

/**
 * Get human-readable submission type label
 */
export function getSubmissionTypeLabel(type: ChallengeSubmissionType): string {
  const labels: Record<ChallengeSubmissionType, string> = {
    IMAGE: 'Single Image',
    MULTI_IMAGE: 'Multiple Images',
    VIDEO: 'Video',
    TEXT: 'Text',
    IMAGE_LOCATION: 'Image + Location',
    LOCATION: 'Location Only',
    QR_CODE: 'QR Code Scan',
  }
  return labels[type]
}
