/**
 * ChallengeDetailsContent Component
 *
 * Displays detailed view of a challenge with all configuration,
 * submission statistics, and action buttons for status management.
 *
 * @module @/components/admin/challenges/ChallengeDetailsContent
 */

'use client'

import { useCallback, useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  Sheet,
} from '@mirai-app/ui'
import {
  ArrowLeft,
  Edit,
  Play,
  Check,
  XCircle,
  ThumbsUp,
  Users,
  Trophy,
} from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useGetChallengeQuery, useChangeChallengeStatusMutation } from './hooks'
import {
  type Challenge,
  type ChallengeStatus,
  getChallengeStatusLabel,
  getChallengeStatusColor,
  getScoringCategoryLabel,
  getSubmissionTypeLabel,
  canEditChallenge,
  requiresVoting,
  requiresJudging,
} from './types'
import { toast } from 'react-hot-toast'

// =============================================================================
// Component Props
// =============================================================================

export interface ChallengeDetailsContentProps {
  /** Challenge ID to display */
  challengeId: string
}

// =============================================================================
// Status Transition Options
// =============================================================================

const STATUS_TRANSITIONS: Record<ChallengeStatus, { value: ChallengeStatus; label: string }[]> = {
  HIDDEN: [
    { value: 'VISIBLE', label: 'Make Visible' },
  ],
  VISIBLE: [
    { value: 'ACTIVE', label: 'Activate Challenge' },
    { value: 'HIDDEN', label: 'Hide Challenge' },
  ],
  ACTIVE: [
    { value: 'VOTING_PHASE', label: 'Start Voting Phase' },
    { value: 'COMPLETED', label: 'Mark as Completed' },
    { value: 'CANCELLED', label: 'Cancel Challenge' },
  ],
  VOTING_PHASE: [
    { value: 'COMPLETED', label: 'Mark as Completed' },
    { value: 'CANCELLED', label: 'Cancel Challenge' },
  ],
  COMPLETED: [],
  CANCELLED: [
    { value: 'VISIBLE', label: 'Reopen Challenge' },
  ],
}

// =============================================================================
// Helper Components
// =============================================================================

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <Text fontSize="$3" color="gray">
        {label}
      </Text>
      <Text fontSize="$3" fontWeight="500">
        {value}
      </Text>
    </XStack>
  )
}

function StatusBadge({ status }: { status: Challenge['status'] }) {
  const label = getChallengeStatusLabel(status)
  const color = getChallengeStatusColor(status)

  return (
    <div
      style={{
        backgroundColor: color,
        color: 'white',
        fontSize: 14,
        padding: '4px 12px',
        borderRadius: 4,
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <YStack gap="$3">
      <Text fontSize="$5" fontWeight="600">
        {title}
      </Text>
      {children}
    </YStack>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChallengeDetailsContent - Detailed view of a challenge
 *
 * Displays comprehensive challenge information with status management
 * and navigation to submissions, voting, and judging.
 */
export function ChallengeDetailsContent({ challengeId }: ChallengeDetailsContentProps) {
  const [showStatusSheet, setShowStatusSheet] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | null>(null)

  // Fetch challenge data
  const {
    challenge,
    loading,
    error,
  } = useGetChallengeQuery(challengeId)

  // Status mutation
  const {
    changeStatus,
    loading: statusLoading,
    error: statusError,
  } = useChangeChallengeStatusMutation()

  const handleBack = useCallback(() => {
    window.location.href = '/challenges'
  }, [])

  const handleEdit = useCallback(() => {
    window.location.href = `/challenges/${challengeId}/edit`
  }, [challengeId])

  const handleManageSubmissions = useCallback(() => {
    window.location.href = `/challenges/${challengeId}/submissions`
  }, [challengeId])

  const handleViewVoting = useCallback(() => {
    window.location.href = `/challenges/${challengeId}/voting`
  }, [challengeId])

  const handleViewJudging = useCallback(() => {
    window.location.href = `/challenges/${challengeId}/judging`
  }, [challengeId])

  const handleStatusTransition = useCallback(async () => {
    if (!challenge || !selectedStatus) return

    try {
      await changeStatus(challenge.id, selectedStatus)
      toast.success(`Challenge status changed to ${getChallengeStatusLabel(selectedStatus)}`)
      setShowStatusSheet(false)
      setSelectedStatus(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change status'
      toast.error(message)
    }
  }, [challenge, selectedStatus, changeStatus])

  // Show loading state
  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <LoadingSpinner size="large" />
        <Text fontSize="$4" color="gray">
          Loading challenge details...
        </Text>
      </YStack>
    )
  }

  // Show error state
  if (error) {
    return (
      <YStack flex={1}>
        <ErrorMessage
          title="Failed to load challenge"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      </YStack>
    )
  }

  // Show not found state
  if (!challenge) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Text fontSize="$5" fontWeight="500" color="gray" textAlign="center">
          Challenge not found
        </Text>
        <Button variant="primary" onPress={handleBack}>
          Back to Challenges
        </Button>
      </YStack>
    )
  }

  const isEditable = canEditChallenge(challenge.status)
  const needsVoting = requiresVoting(challenge.scoringCategory)
  const needsJudging = requiresJudging(challenge.scoringCategory)
  const statusOptions = STATUS_TRANSITIONS[challenge.status]

  return (
    <YStack flex={1}>
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$4"
        flexWrap="wrap"
        gap="$2"
      >
        <XStack alignItems="center" gap="$2">
          <Button variant="ghost" size="sm" onPress={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Challenge Details
          </Text>
        </XStack>
        <XStack gap="$2">
          {isEditable && (
            <Button variant="secondary" size="sm" onPress={handleEdit}>
              <Edit size={16} />
              Edit
            </Button>
          )}
          <Button variant="primary" size="sm" onPress={handleManageSubmissions}>
            <Users size={16} />
            Submissions
          </Button>
        </XStack>
      </XStack>

      {/* Challenge Header Card */}
      <Card padding="$4" marginBottom="$4">
        <YStack gap="$3">
          {/* Title and Status */}
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1} gap="$1">
              <Text fontSize="$7" fontWeight="600">
                {challenge.name}
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                <StatusBadge status={challenge.status} />
                <div
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                  }}
                >
                  {getScoringCategoryLabel(challenge.scoringCategory)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                  }}
                >
                  {getSubmissionTypeLabel(challenge.submissionType)}
                </div>
              </XStack>
            </YStack>
          </XStack>

          {/* Description */}
          {challenge.description && (
            <Text fontSize="$4" color="gray">
              {challenge.description}
            </Text>
          )}

          {/* Points */}
          <XStack gap="$4" marginTop="$2">
            <YStack alignItems="center">
              <Text fontSize="$2" color="gray">Base Points</Text>
              <Text fontSize="$6" fontWeight="600" color="blue">
                {challenge.basePoints}
              </Text>
            </YStack>
            {challenge.firstPlacePoints && (
              <YStack alignItems="center">
                <Text fontSize="$2" color="gray">1st Place</Text>
                <Text fontSize="$6" fontWeight="600" color="green">
                  {challenge.firstPlacePoints}
                </Text>
              </YStack>
            )}
            {challenge.secondPlacePoints && (
              <YStack alignItems="center">
                <Text fontSize="$2" color="gray">2nd Place</Text>
                <Text fontSize="$6" fontWeight="600">
                  {challenge.secondPlacePoints}
                </Text>
              </YStack>
            )}
            {challenge.thirdPlacePoints && (
              <YStack alignItems="center">
                <Text fontSize="$2" color="gray">3rd Place</Text>
                <Text fontSize="$6" fontWeight="600">
                  {challenge.thirdPlacePoints}
                </Text>
              </YStack>
            )}
          </XStack>

          {/* Cover Image */}
          {challenge.image && (
            <div style={{ marginTop: 12 }}>
              <img
                src={challenge.image}
                alt={challenge.name}
                style={{
                  width: '100%',
                  maxHeight: 300,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            </div>
          )}
        </YStack>
      </Card>

      {/* Two Column Layout */}
      <XStack gap="$4" flexWrap="wrap">
        {/* Left Column - Configuration */}
        <YStack flex={1} minWidth={300} gap="$4">
          <Section title="Configuration">
            <Card padding="$3">
              <YStack gap="$2">
                <DetailRow label="Submission Type" value={getSubmissionTypeLabel(challenge.submissionType)} />
                <DetailRow label="Scoring Category" value={getScoringCategoryLabel(challenge.scoringCategory)} />
                <DetailRow label="Auto-approve" value={challenge.autoApprove ? 'Yes' : 'No'} />
                <DetailRow label="Recurring" value={challenge.isRecurring ? `Yes (${challenge.recurringDays} days)` : 'No'} />
                {challenge.qrCodeValue && (
                  <DetailRow label="QR Code Value" value={challenge.qrCodeValue} />
                )}
                {challenge.textExpectedPhrase && (
                  <DetailRow label="Expected Phrase" value={challenge.textExpectedPhrase} />
                )}
              </YStack>
            </Card>
          </Section>

          <Section title="Time Schedule">
            <Card padding="$3">
              <YStack gap="$2">
                {challenge.startTime && (
                  <DetailRow
                    label="Start Time"
                    value={new Date(challenge.startTime).toLocaleString()}
                  />
                )}
                {challenge.endTime && (
                  <DetailRow
                    label="End Time"
                    value={new Date(challenge.endTime).toLocaleString()}
                  />
                )}
                {challenge.isRecurring && (
                  <>
                    <DetailRow label="Daily Start" value={challenge.dailyStartTime ?? '-'} />
                    <DetailRow label="Daily End" value={challenge.dailyEndTime ?? '-'} />
                  </>
                )}
                {challenge.votingStartTime && (
                  <DetailRow
                    label="Voting Start"
                    value={new Date(challenge.votingStartTime).toLocaleString()}
                  />
                )}
                {challenge.votingEndTime && (
                  <DetailRow
                    label="Voting End"
                    value={new Date(challenge.votingEndTime).toLocaleString()}
                  />
                )}
                {challenge.votingDurationHours && (
                  <DetailRow label="Voting Duration" value={`${challenge.votingDurationHours} hours`} />
                )}
              </YStack>
            </Card>
          </Section>

          {showLocationFields(challenge) && (
            <Section title="Target Location">
              <Card padding="$3">
                <YStack gap="$2">
                  <DetailRow label="Latitude" value={challenge.targetLatitude ?? '-'} />
                  <DetailRow label="Longitude" value={challenge.targetLongitude ?? '-'} />
                </YStack>
              </Card>
            </Section>
          )}
        </YStack>

        {/* Right Column - Actions */}
        <YStack flex={1} minWidth={300} gap="$4">
          <Section title="Actions">
            <YStack gap="$2">
              {/* Status Management */}
              {statusOptions.length > 0 && (
                <Button
                  variant="primary"
                  onPress={() => setShowStatusSheet(true)}
                  disabled={statusLoading}
                >
                  <Play size={18} />
                  Change Status
                </Button>
              )}

              {/* View Submissions */}
              <Button
                variant="secondary"
                onPress={handleManageSubmissions}
              >
                <Users size={18} />
                View Submissions
              </Button>

              {/* Voting / Judging */}
              {needsVoting && (
                <Button
                  variant="secondary"
                  onPress={handleViewVoting}
                >
                  <ThumbsUp size={18} />
                  View Voting
                </Button>
              )}
              {needsJudging && (
                <Button
                  variant="secondary"
                  onPress={handleViewJudging}
                >
                  <Trophy size={18} />
                  View Judging
                </Button>
              )}

              {/* Edit (if editable) */}
              {isEditable && (
                <Button
                  variant="secondary"
                  onPress={handleEdit}
                >
                  <Edit size={18} />
                  Edit Challenge
                </Button>
              )}
            </YStack>
          </Section>

          {/* Metadata */}
          <Section title="Metadata">
            <Card padding="$3">
              <YStack gap="$2">
                <DetailRow
                  label="Created"
                  value={new Date(challenge.createdAt).toLocaleString()}
                />
                <DetailRow
                  label="Last Updated"
                  value={new Date(challenge.updatedAt).toLocaleString()}
                />
                <DetailRow label="Challenge ID" value={challenge.id} />
              </YStack>
            </Card>
          </Section>
        </YStack>
      </XStack>

      {/* Status Transition Sheet */}
      <Sheet
        open={showStatusSheet}
        onOpenChange={setShowStatusSheet}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Change Challenge Status
          </Text>
          <Text fontSize="$4" color="gray">
            Current: <Text fontWeight="600">{getChallengeStatusLabel(challenge.status)}</Text>
          </Text>

          {statusError && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {statusError.message}
              </Text>
            </YStack>
          )}

          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">
              Select new status:
            </Text>
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedStatus === option.value ? 'primary' : 'secondary'}
                onPress={() => setSelectedStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </YStack>

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              onPress={() => setShowStatusSheet(false)}
              disabled={statusLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleStatusTransition}
              disabled={statusLoading || !selectedStatus}
              isLoading={statusLoading}
              flex={1}
            >
              Confirm Change
            </Button>
          </XStack>
        </YStack>
      </Sheet>
    </YStack>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function showLocationFields(challenge: Challenge): boolean {
  return challenge.submissionType === 'LOCATION' || challenge.submissionType === 'IMAGE_LOCATION'
}
