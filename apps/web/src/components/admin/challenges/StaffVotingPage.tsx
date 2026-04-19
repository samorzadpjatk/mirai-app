/**
 * StaffVotingPage Component
 *
 * Voting interface for staff members to cast votes on challenge submissions.
 * Features:
 * - Display all approved submissions for voting
 * - Cast votes with position ranking (1st, 2nd, 3rd, etc.)
 * - View current vote counts in real-time
 * - Remove/replace existing votes
 * - Real-time updates via subscriptions
 *
 * @module @/components/admin/challenges/StaffVotingPage
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  Sheet,
  Select,
} from '@mirai-app/ui'
import {
  ChevronLeft,
  ArrowLeft,
  Trophy,
  Check,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
} from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  useGetChallengeQuery,
  useGetChallengeSubmissionsQuery,
  useCastVoteMutation,
  useRemoveVoteMutation,
  useVoteUpdatesSubscription,
  useSubmissionUpdatesSubscription,
} from './hooks'
import type {
  ChallengeSubmission,
  SubmissionWithDetails,
  Vote,
} from './types'
import { getChallengeStatusLabel, isVotingPhase } from './types'
import { toast } from 'react-hot-toast'

// =============================================================================
// Component Props
// =============================================================================

export interface StaffVotingPageProps {
  /** Challenge ID to view voting for */
  challengeId: string
  /** Current user ID (for checking if already voted) */
  currentUserId?: string
}

// =============================================================================
// Helper Types
// =============================================================================

interface SubmissionWithVotes extends ChallengeSubmission {
  votes: Vote[]
  voteCount: number
  hasUserVoted: boolean
  userVotePosition?: number
}

// =============================================================================
// Helper Components
// =============================================================================

function SubmissionVotingCard({
  submission,
  onVote,
  onRemoveVote,
  onViewMedia,
  disabled,
  maxPosition,
}: {
  submission: SubmissionWithVotes
  onVote: (submission: SubmissionWithVotes, position: number) => void
  onRemoveVote: (submission: SubmissionWithVotes) => void
  onViewMedia?: (submission: SubmissionWithVotes) => void
  disabled?: boolean
  maxPosition: number
}) {
  const [selectedPosition, setSelectedPosition] = useState<string>('')

  const handleVote = useCallback(() => {
    if (selectedPosition) {
      onVote(submission, parseInt(selectedPosition, 10))
      setSelectedPosition('')
    }
  }, [submission, selectedPosition, onVote])

  return (
    <Card padding="$3" width="100%">
      <YStack gap="$3">
        {/* Header: Group and Vote Count */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$1">
            <Text fontSize="$4" fontWeight="600">
              {submission.groupName}
            </Text>
            <Text fontSize="$2" color="gray">
              by {submission.userName}
            </Text>
          </YStack>
          <YStack alignItems="flex-end">
            <XStack alignItems="center" gap="$1">
              <Trophy size={14} color="#f59e0b" />
              <Text fontSize="$5" fontWeight="600" color="#f59e0b">
                {submission.voteCount}
              </Text>
            </XStack>
            <Text fontSize="$2" color="gray">
              votes
            </Text>
          </YStack>
        </XStack>

        {/* Media Preview */}
        {submission.imageUrls.length > 0 && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
              cursor: onViewMedia ? 'pointer' : 'default',
            }}
            onClick={() => onViewMedia?.(submission)}
          >
            <img
              src={submission.imageUrls[0]}
              alt="Submission"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {submission.imageUrls.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                +{submission.imageUrls.length - 1} more
              </div>
            )}
          </div>
        )}

        {submission.content && (
          <Text fontSize="$3" color="gray" numberOfLines={2}>
            {submission.content}
          </Text>
        )}

        {/* User's Current Vote */}
        {submission.hasUserVoted && submission.userVotePosition && (
          <XStack
            alignItems="center"
            gap="$2"
            padding="$2"
            backgroundColor="#dcfce7"
            borderRadius="$2"
          >
            <CheckCircle size={16} color="#22c55e" />
            <Text fontSize="$3" color="#166534">
              You voted: <Text fontWeight="600">{getPositionLabel(submission.userVotePosition)}</Text>
            </Text>
          </XStack>
        )}

        {/* Voting Actions */}
        <YStack gap="$2">
          {submission.hasUserVoted ? (
            <Button
              size="sm"
              variant="secondary"
              onPress={() => onRemoveVote(submission)}
              disabled={disabled}
            >
              <X size={14} />
              Remove Vote
            </Button>
          ) : (
            <>
              <XStack gap="$2">
                <Select
                  value={selectedPosition}
                  onValueChange={setSelectedPosition}
                  disabled={disabled}
                >
                  <Select.Item value="" index={0}>Select position...</Select.Item>
                  {Array.from({ length: maxPosition }, (_, i) => i + 1).map((pos, idx) => (
                    <Select.Item key={pos} value={String(pos)} index={idx + 1}>
                      {getPositionLabel(pos)}
                    </Select.Item>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={handleVote}
                  disabled={disabled || !selectedPosition}
                >
                  <Trophy size={14} />
                  Vote
                </Button>
              </XStack>
            </>
          )}
        </YStack>
      </YStack>
    </Card>
  )
}

function getPositionLabel(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const suffix = position <= 3 ? suffixes[position] : suffixes[0]
  return `${position}${suffix} Place`
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * StaffVotingPage - Voting interface for challenge submissions
 *
 * Allows staff members to cast votes on approved challenge submissions
 * with real-time updates and position-based ranking.
 */
export function StaffVotingPage({ challengeId, currentUserId }: StaffVotingPageProps) {
  const [viewingMedia, setViewingMedia] = useState<SubmissionWithVotes | null>(null)

  // Fetch challenge data
  const {
    challenge,
    loading: challengeLoading,
    error: challengeError,
  } = useGetChallengeQuery(challengeId)

  // Fetch submissions
  const {
    submissions,
    loading: submissionsLoading,
    error: submissionsError,
    refetch,
  } = useGetChallengeSubmissionsQuery(challengeId)

  // Real-time subscriptions
  const { latestVoteUpdate } = useVoteUpdatesSubscription(challengeId)
  const { latestSubmission } = useSubmissionUpdatesSubscription(challengeId)

  // Vote mutations
  const {
    castVote,
    loading: castVoteLoading,
    error: castVoteError,
  } = useCastVoteMutation()

  const {
    removeVote,
    loading: removeVoteLoading,
    error: removeVoteError,
  } = useRemoveVoteMutation()

  // Handle real-time updates
  useEffect(() => {
    if (latestVoteUpdate || latestSubmission) {
      refetch()
    }
  }, [latestVoteUpdate, latestSubmission, refetch])

  // Process submissions with vote data
  const submissionsWithVotes: SubmissionWithVotes[] = useMemo(() => {
    return submissions
      .filter((s) => s.status === 'APPROVED')
      .map((submission) => {
        const submissionWithDetails = submission as SubmissionWithDetails
        const votes = submissionWithDetails.votes || []
        const userVote = currentUserId
          ? votes.find((v) => v.userId === currentUserId)
          : undefined

        return {
          ...submission,
          votes,
          voteCount: submissionWithDetails.voteCount || votes.length,
          hasUserVoted: !!userVote,
          userVotePosition: userVote?.position,
        }
      })
  }, [submissions, currentUserId])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalVotes = submissionsWithVotes.reduce((sum, s) => sum + s.voteCount, 0)
    const userVotesCast = submissionsWithVotes.filter((s) => s.hasUserVoted).length

    return {
      totalSubmissions: submissionsWithVotes.length,
      totalVotes,
      userVotesCast,
    }
  }, [submissionsWithVotes])

  // Sort by vote count (highest first)
  const sortedSubmissions = useMemo(() => {
    return [...submissionsWithVotes].sort((a, b) => b.voteCount - a.voteCount)
  }, [submissionsWithVotes])

  // Navigation
  const handleBack = useCallback(() => {
    window.location.href = '/challenges'
  }, [])

  const handleViewChallenge = useCallback(() => {
    window.location.href = `/challenges/${challengeId}`
  }, [challengeId])

  // Vote handlers
  const handleVote = useCallback(
    async (submission: SubmissionWithVotes, position: number) => {
      try {
        await castVote({
          submissionId: submission.id,
          position,
        })
        toast.success(`Vote cast for ${submission.groupName}`)
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cast vote'
        toast.error(message)
      }
    },
    [castVote, refetch]
  )

  const handleRemoveVote = useCallback(
    async (submission: SubmissionWithVotes) => {
      try {
        await removeVote(submission.id)
        toast.success(`Vote removed from ${submission.groupName}`)
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove vote'
        toast.error(message)
      }
    },
    [removeVote, refetch]
  )

  // Media view handler
  const handleViewMedia = useCallback((submission: SubmissionWithVotes) => {
    setViewingMedia(submission)
  }, [])

  const handleCloseMedia = useCallback(() => {
    setViewingMedia(null)
  }, [])

  // Max position for voting
  const maxPosition = Math.min(5, submissionsWithVotes.length)

  // Loading state
  if (challengeLoading || submissionsLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" gap="$2" marginBottom="$4">
          <Button variant="ghost" size="sm" onPress={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Voting
          </Text>
        </XStack>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <LoadingSpinner size="large" />
          <Text fontSize="$4" color="gray">
            Loading submissions...
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Error state
  if (challengeError || submissionsError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" gap="$2" marginBottom="$4">
          <Button variant="ghost" size="sm" onPress={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Voting
          </Text>
        </XStack>
        <ErrorMessage
          title="Failed to load voting data"
          message={(challengeError || submissionsError)?.message || 'An error occurred'}
          onRetry={refetch}
        />
      </YStack>
    )
  }

  // Check if voting is active
  const votingActive = challenge && isVotingPhase(challenge.status)

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
          <YStack>
            <Text fontSize="$6" fontWeight="600">
              Staff Voting
            </Text>
            <Text fontSize="$3" color="gray">
              {challenge?.name}
            </Text>
          </YStack>
        </XStack>
        <Button variant="secondary" size="sm" onPress={handleViewChallenge}>
          <Eye size={16} />
          View Challenge
        </Button>
      </XStack>

      {/* Voting Status */}
      {!votingActive && (
        <Card padding="$3" marginBottom="$4" backgroundColor="#fef3c7">
          <XStack alignItems="center" gap="$2">
            <AlertCircle size={20} color="#f59e0b" />
            <Text fontSize="$3" color="#92400e">
              Voting is not currently active. Challenge status:{' '}
              {challenge ? getChallengeStatusLabel(challenge.status) : 'Unknown'}
            </Text>
          </XStack>
        </Card>
      )}

      {/* Statistics */}
      <Card padding="$3" marginBottom="$4">
        <XStack justifyContent="space-around">
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Submissions</Text>
            <Text fontSize="$6" fontWeight="600">{stats.totalSubmissions}</Text>
          </YStack>
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Total Votes</Text>
            <Text fontSize="$6" fontWeight="600" color="#f59e0b">
              {stats.totalVotes}
            </Text>
          </YStack>
          {currentUserId && (
            <YStack alignItems="center">
              <Text fontSize="$2" color="gray">Your Votes</Text>
              <Text fontSize="$6" fontWeight="600" color="#3b82f6">
                {stats.userVotesCast}
              </Text>
            </YStack>
          )}
        </XStack>
      </Card>

      {/* Error display */}
      {(castVoteError || removeVoteError) && (
        <Card padding="$3" marginBottom="$4" backgroundColor="#fee2e2">
          <Text color="#dc2626" fontSize="$3">
            {(castVoteError || removeVoteError)?.message || 'An error occurred'}
          </Text>
        </Card>
      )}

      {/* Submissions List */}
      {sortedSubmissions.length === 0 ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <AlertCircle size={48} color="#9ca3af" />
          <Text fontSize="$5" fontWeight="500" color="gray" textAlign="center">
            No approved submissions
          </Text>
          <Text fontSize="$3" color="gray" textAlign="center">
            There are no approved submissions available for voting yet
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          {sortedSubmissions.map((submission, index) => (
            <SubmissionVotingCard
              key={submission.id}
              submission={submission}
              onVote={handleVote}
              onRemoveVote={handleRemoveVote}
              onViewMedia={handleViewMedia}
              disabled={!votingActive || castVoteLoading || removeVoteLoading}
              maxPosition={maxPosition}
            />
          ))}
        </YStack>
      )}

      {/* Media View Modal */}
      <Sheet
        open={!!viewingMedia}
        onOpenChange={(open: boolean) => !open && handleCloseMedia()}
      >
        <YStack gap="$4" padding="$4" maxHeight="80vh">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600">
              Submission Media
            </Text>
            <Button variant="ghost" size="sm" onPress={handleCloseMedia}>
              Close
            </Button>
          </XStack>

          {viewingMedia && (
            <YStack gap="$3" overflow="scroll">
              <Text fontSize="$4" fontWeight="600">
                {viewingMedia.groupName}
              </Text>

              {/* Images */}
              {viewingMedia.imageUrls.map((url, index) => (
                <div key={index} style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <img
                    src={url}
                    alt={`Submission ${index + 1}`}
                    style={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ))}

              {viewingMedia.content && (
                <Card padding="$3">
                  <Text fontSize="$3">{viewingMedia.content}</Text>
                </Card>
              )}
            </YStack>
          )}
        </YStack>
      </Sheet>
    </YStack>
  )
}
