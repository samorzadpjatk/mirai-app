/**
 * JudgingPage Component
 *
 * Judging interface for staff judges to score challenge submissions.
 * Integrates with Effect DI for judging orchestration.
 *
 * Features:
 * - Display all approved submissions for judging
 * - Submit scores for submissions
 * - View average scores and rankings
 * - Update or delete existing judgements
 * - Real-time updates via subscriptions
 * - Effect DI integration for complex judging flows
 *
 * @module @/components/admin/challenges/JudgingPage
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
  Input,
} from '@mirai-app/ui'
import {
  ChevronLeft,
  Trophy,
  Star,
  Check,
  X,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
} from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  useGetChallengeQuery,
  useGetChallengeSubmissionsQuery,
  useSubmitJudgementMutation,
  useUpdateJudgementMutation,
  useDeleteJudgementMutation,
  useSubmissionUpdatesSubscription,
} from './hooks'
import { useJudgement, useBatchJudgement } from '@/hooks/admin/useJudgement'
import type {
  ChallengeSubmission,
  SubmissionWithDetails,
  Judgement,
} from './types'
import { getChallengeStatusLabel, requiresJudging } from './types'
import { toast } from 'react-hot-toast'

// =============================================================================
// Component Props
// =============================================================================

export interface JudgingPageProps {
  /** Challenge ID to view judging for */
  challengeId: string
  /** Current user ID (for checking if already judged) */
  currentUserId?: string
  /** Current user name */
  currentUserName?: string
  /** User role for permission checks */
  userRole?: string
}

// =============================================================================
// Helper Types
// =============================================================================

interface SubmissionWithJudgements extends ChallengeSubmission {
  judgements: Judgement[]
  averageScore?: number
  rank?: number
  hasUserJudged: boolean
  userJudgement?: Judgement
}

// =============================================================================
// Helper Components
// =============================================================================

function JudgingCard({
  submission,
  onJudge,
  onUpdateJudgement,
  onDeleteJudgement,
  onViewMedia,
  disabled,
}: {
  submission: SubmissionWithJudgements
  onJudge: (submission: SubmissionWithJudgements) => void
  onUpdateJudgement: (submission: SubmissionWithJudgements) => void
  onDeleteJudgement: (submission: SubmissionWithJudgements) => void
  onViewMedia?: (submission: SubmissionWithJudgements) => void
  disabled?: boolean
}) {
  return (
    <Card padding="$3" width="100%">
      <YStack gap="$3">
        {/* Header: Group and Score */}
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
            {submission.averageScore !== undefined && (
              <>
                <XStack alignItems="center" gap="$1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text fontSize="$5" fontWeight="600" color="#f59e0b">
                    {submission.averageScore.toFixed(1)}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="gray">
                  avg score
                </Text>
              </>
            )}
            {submission.rank !== undefined && (
              <div
                style={{
                  marginTop: 4,
                  backgroundColor: '#dbeafe',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
              >
                <Text fontSize="$2" color="#1e40af">
                  Rank #{submission.rank}
                </Text>
              </div>
            )}
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

        {/* User's Current Judgement */}
        {submission.hasUserJudged && submission.userJudgement && (
          <YStack
            padding="$2"
            backgroundColor="#dcfce7"
            borderRadius="$2"
            gap="$1"
          >
            <XStack alignItems="center" gap="$1">
              <Check size={16} color="#22c55e" />
              <Text fontSize="$3" color="#166534">
                Your score: <Text fontWeight="600">{submission.userJudgement.score}</Text>/100
              </Text>
            </XStack>
            {submission.userJudgement.feedback && (
              <Text fontSize="$2" color="#166534" marginTop="$1">
                Feedback: {submission.userJudgement.feedback}
              </Text>
            )}
          </YStack>
        )}

        {/* Action Buttons */}
        <XStack gap="$2" flexWrap="wrap">
          {onViewMedia && (submission.imageUrls.length > 0 || submission.videoUrl) && (
            <Button size="sm" variant="secondary" onPress={() => onViewMedia(submission)} flex={1}>
              <Eye size={14} />
              View
            </Button>
          )}

          {submission.hasUserJudged ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => onUpdateJudgement(submission)}
                disabled={disabled}
                flex={1}
              >
                <Edit size={14} />
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={() => onDeleteJudgement(submission)}
                disabled={disabled}
              >
                <Trash2 size={14} />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onPress={() => onJudge(submission)}
              disabled={disabled}
              flex={1}
            >
              <Star size={14} />
              Score
            </Button>
          )}
        </XStack>
      </YStack>
    </Card>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * JudgingPage - Judging interface for challenge submissions
 *
 * Allows staff judges to submit scores for approved challenge submissions.
 * Integrates with Effect DI for judging orchestration.
 */
export function JudgingPage({
  challengeId,
  currentUserId,
  currentUserName,
  userRole = 'ADMIN',
}: JudgingPageProps) {
  const [judgingSubmission, setJudgingSubmission] = useState<SubmissionWithJudgements | null>(null)
  const [score, setScore] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [viewingMedia, setViewingMedia] = useState<SubmissionWithJudgements | null>(null)

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

  // Real-time subscription
  const { latestSubmission } = useSubmissionUpdatesSubscription(challengeId)

  // Judgement mutations
  const {
    submitJudgement,
    loading: submitLoading,
    error: submitError,
  } = useSubmitJudgementMutation()

  const {
    updateJudgement,
    loading: updateLoading,
    error: updateError,
  } = useUpdateJudgementMutation()

  const {
    deleteJudgement,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteJudgementMutation()

  // Effect DI - useJudgement hook for complex judging orchestration
  const {
    submitJudgement: submitJudgementWithEffect,
    loading: effectJudgementLoading,
    error: effectJudgementError,
    clearError: clearEffectError,
  } = useJudgement({
    challengeId,
    tripId: challenge?.tripId ?? '',
    userId: currentUserId ?? '',
    userRole,
  })

  // Batch judging for future enhancement
  const batchJudgement = useBatchJudgement({
    challengeId,
    tripId: challenge?.tripId ?? '',
    userId: currentUserId ?? '',
    userRole,
  })

  // Handle real-time updates
  useEffect(() => {
    if (latestSubmission) {
      refetch()
    }
  }, [latestSubmission, refetch])

  // Process submissions with judgement data
  const submissionsWithJudgements: SubmissionWithJudgements[] = useMemo(() => {
    return submissions
      .filter((s) => s.status === 'APPROVED')
      .map((submission) => {
        const submissionWithDetails = submission as SubmissionWithDetails
        const judgements = submissionWithDetails.judgements || []
        const userJudgement = currentUserId
          ? judgements.find((j) => j.judgeId === currentUserId)
          : undefined

        return {
          ...submission,
          judgements,
          averageScore: submissionWithDetails.averageScore,
          rank: submissionWithDetails.rank,
          hasUserJudged: !!userJudgement,
          userJudgement,
        }
      })
      .sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))
  }, [submissions, currentUserId])

  // Calculate statistics
  const stats = useMemo(() => {
    const judgedSubmissions = submissionsWithJudgements.filter((s) => s.judgements.length > 0)
    const userJudgementsCount = submissionsWithJudgements.filter((s) => s.hasUserJudged).length
    const averageScore = judgedSubmissions.length > 0
      ? judgedSubmissions.reduce((sum, s) => sum + (s.averageScore ?? 0), 0) / judgedSubmissions.length
      : 0

    return {
      totalSubmissions: submissionsWithJudgements.length,
      judgedCount: judgedSubmissions.length,
      userJudgementsCount,
      averageScore,
    }
  }, [submissionsWithJudgements])

  // Navigation
  const handleBack = useCallback(() => {
    window.location.href = '/challenges'
  }, [])

  const handleViewChallenge = useCallback(() => {
    window.location.href = `/challenges/${challengeId}`
  }, [challengeId])

  // Judging handlers
  const handleStartJudging = useCallback((submission: SubmissionWithJudgements) => {
    setJudgingSubmission(submission)
    setScore(submission.userJudgement ? String(submission.userJudgement.score) : '')
    setFeedback(submission.userJudgement?.feedback ?? '')
    setIsEditing(false)
  }, [])

  const handleEditJudging = useCallback((submission: SubmissionWithJudgements) => {
    setJudgingSubmission(submission)
    setScore(submission.userJudgement ? String(submission.userJudgement.score) : '')
    setFeedback(submission.userJudgement?.feedback ?? '')
    setIsEditing(true)
  }, [])

  const handleCancelJudging = useCallback(() => {
    setJudgingSubmission(null)
    setScore('')
    setFeedback('')
    setIsEditing(false)
    clearEffectError()
  }, [clearEffectError])

  const handleSubmitScore = useCallback(async () => {
    if (!judgingSubmission || !score) return

    const scoreNum = parseFloat(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('Score must be between 0 and 100')
      return
    }

    try {
      if (isEditing && judgingSubmission.userJudgement) {
        // Update existing judgement
        await updateJudgement(
          judgingSubmission.userJudgement.id,
          scoreNum,
          feedback || undefined
        )
        toast.success(`Score updated for ${judgingSubmission.groupName}`)
      } else {
        // Submit new judgement via Effect DI
        await submitJudgementWithEffect(
          judgingSubmission.id,
          scoreNum
        )
        toast.success(`Score submitted for ${judgingSubmission.groupName}`)
      }

      setJudgingSubmission(null)
      setScore('')
      setFeedback('')
      setIsEditing(false)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit score'
      toast.error(message)
    }
  }, [
    judgingSubmission,
    score,
    feedback,
    isEditing,
    submitJudgementWithEffect,
    updateJudgement,
    refetch,
  ])

  const handleDeleteJudgement = useCallback(
    async (submission: SubmissionWithJudgements) => {
      if (!submission.userJudgement) return

      try {
        await deleteJudgement(submission.userJudgement.id)
        toast.success(`Score removed for ${submission.groupName}`)
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove score'
        toast.error(message)
      }
    },
    [deleteJudgement, refetch]
  )

  // Media view handler
  const handleViewMedia = useCallback((submission: SubmissionWithJudgements) => {
    setViewingMedia(submission)
  }, [])

  const handleCloseMedia = useCallback(() => {
    setViewingMedia(null)
  }, [])

  // Check if judging is active
  const judgingActive = challenge && requiresJudging(challenge.scoringCategory)

  // Loading state
  if (challengeLoading || submissionsLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" gap="$2" marginBottom="$4">
          <Button variant="ghost" size="sm" onPress={handleBack}>
            <ChevronLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Judging
          </Text>
        </XStack>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <LoadingSpinner size="large" />
          <Text fontSize="$4" color="gray">
            Loading submissions for judging...
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
            <ChevronLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Judging
          </Text>
        </XStack>
        <ErrorMessage
          title="Failed to load judging data"
          message={(challengeError || submissionsError)?.message || 'An error occurred'}
          onRetry={refetch}
        />
      </YStack>
    )
  }

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
            <ChevronLeft size={20} />
          </Button>
          <YStack>
            <Text fontSize="$6" fontWeight="600">
              Staff Judging
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

      {/* Judging Status */}
      {!judgingActive && (
        <Card padding="$3" marginBottom="$4" backgroundColor="#fef3c7">
          <XStack alignItems="center" gap="$2">
            <AlertCircle size={20} color="#f59e0b" />
            <Text fontSize="$3" color="#92400e">
              This challenge is not configured for staff judging. Category:{' '}
              {challenge?.scoringCategory}
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
            <Text fontSize="$2" color="gray">Judged</Text>
            <Text fontSize="$6" fontWeight="600" color="#f59e0b">
              {stats.judgedCount}
            </Text>
          </YStack>
          {currentUserId && (
            <YStack alignItems="center">
              <Text fontSize="$2" color="gray">Your Scores</Text>
              <Text fontSize="$6" fontWeight="600" color="#3b82f6">
                {stats.userJudgementsCount}
              </Text>
            </YStack>
          )}
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Avg Score</Text>
            <Text fontSize="$6" fontWeight="600" color="#22c55e">
              {stats.averageScore.toFixed(1)}
            </Text>
          </YStack>
        </XStack>
      </Card>

      {/* Effect DI Error */}
      {effectJudgementError && (
        <Card padding="$3" marginBottom="$4" backgroundColor="#fee2e2">
          <Text color="#dc2626" fontSize="$3">
            {effectJudgementError}
          </Text>
        </Card>
      )}

      {/* Submissions List */}
      {submissionsWithJudgements.length === 0 ? (
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
            There are no approved submissions available for judging yet
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          {submissionsWithJudgements.map((submission) => (
            <JudgingCard
              key={submission.id}
              submission={submission}
              onJudge={handleStartJudging}
              onUpdateJudgement={handleEditJudging}
              onDeleteJudgement={handleDeleteJudgement}
              onViewMedia={handleViewMedia}
              disabled={!judgingActive || submitLoading || updateLoading || deleteLoading}
            />
          ))}
        </YStack>
      )}

      {/* Judging Score Sheet */}
      <Sheet
        open={!!judgingSubmission}
        onOpenChange={(open: boolean) => !open && handleCancelJudging()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            {isEditing ? 'Update Score' : 'Submit Score'}
          </Text>

          {judgingSubmission && (
            <YStack gap="$2">
              <Text fontSize="$4">
                Group: <Text fontWeight="600">{judgingSubmission.groupName}</Text>
              </Text>
              <Text fontSize="$3" color="gray">
                Submitted by {judgingSubmission.userName}
              </Text>
            </YStack>
          )}

          {/* Score Input */}
          <YStack gap="$1">
            <Label htmlFor="score">Score (0-100) *</Label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              placeholder="Enter score 0-100"
              value={score}
              onChangeText={setScore}
            />
            <Text fontSize="$2" color="gray">
              Enter a score between 0 and 100
            </Text>
          </YStack>

          {/* Feedback Input */}
          <YStack gap="$1">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback for the submission..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                minHeight: 80,
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            />
          </YStack>

          {/* Error display */}
          {(submitError || updateError || effectJudgementError) && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {(submitError || updateError)?.message || effectJudgementError || 'An error occurred'}
              </Text>
            </YStack>
          )}

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              onPress={handleCancelJudging}
              disabled={submitLoading || updateLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleSubmitScore}
              disabled={submitLoading || updateLoading || !score}
              isLoading={submitLoading || updateLoading}
              flex={1}
            >
              {isEditing ? (
                <>
                  <Edit size={18} />
                  Update Score
                </>
              ) : (
                <>
                  <Star size={18} />
                  Submit Score
                </>
              )}
            </Button>
          </XStack>
        </YStack>
      </Sheet>

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

              {/* Video */}
              {viewingMedia.videoUrl && (
                <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                  <video
                    src={viewingMedia.videoUrl}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: 400,
                    }}
                  />
                </div>
              )}

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

// Simple label component
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: '#374151',
        marginBottom: 4,
      }}
    >
      {children}
    </label>
  )
}
