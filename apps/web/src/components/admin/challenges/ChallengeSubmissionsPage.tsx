/**
 * ChallengeSubmissionsPage Component
 *
 * Displays and manages submissions for a specific challenge.
 * Features:
 * - List all submissions with filtering by status
 * - Approve/reject pending submissions
 * - View submission media
 * - Real-time updates via subscriptions
 *
 * @module @/components/admin/challenges/ChallengeSubmissionsPage
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
  Check,
  XCircle,
  Users,
  Clock,
  AlertCircle,
  Eye,
} from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  useGetChallengeQuery,
  useGetChallengeSubmissionsQuery,
  useReviewSubmissionMutation,
  useSubmissionUpdatesSubscription,
} from './hooks'
import { SubmissionCard, SubmissionCardSkeleton } from './SubmissionCard'
import type {
  ChallengeSubmission,
  SubmissionStatus,
} from './types'
import { getSubmissionStatusLabel } from './types'
import { toast } from 'react-hot-toast'

// =============================================================================
// Component Props
// =============================================================================

export interface ChallengeSubmissionsPageProps {
  /** Challenge ID to view submissions for */
  challengeId: string
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChallengeSubmissionsPage - View and manage challenge submissions
 *
 * Provides a comprehensive interface for viewing all submissions,
 * filtering by status, and approving/rejecting pending submissions.
 */
export function ChallengeSubmissionsPage({ challengeId }: ChallengeSubmissionsPageProps) {
  const [filter, setFilter] = useState<SubmissionStatus | 'ALL'>('ALL')
  const [submissionToReview, setSubmissionToReview] = useState<ChallengeSubmission | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewingMedia, setViewingMedia] = useState<ChallengeSubmission | null>(null)

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

  // Review mutation
  const {
    reviewSubmission,
    loading: reviewLoading,
    error: reviewError,
  } = useReviewSubmissionMutation()

  // Handle real-time updates
  useEffect(() => {
    if (latestSubmission) {
      refetch()
    }
  }, [latestSubmission, refetch])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    if (filter === 'ALL') return submissions
    return submissions.filter((s) => s.status === filter)
  }, [submissions, filter])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === 'PENDING').length,
      approved: submissions.filter((s) => s.status === 'APPROVED').length,
      rejected: submissions.filter((s) => s.status === 'REJECTED').length,
    }
  }, [submissions])

  // Navigation
  const handleBack = useCallback(() => {
    window.location.href = '/challenges'
  }, [])

  const handleViewChallenge = useCallback(() => {
    window.location.href = `/challenges/${challengeId}`
  }, [challengeId])

  // Review handlers
  const handleApprove = useCallback((submission: ChallengeSubmission) => {
    setSubmissionToReview(submission)
    setReviewAction('approve')
    setRejectionReason('')
  }, [])

  const handleReject = useCallback((submission: ChallengeSubmission) => {
    setSubmissionToReview(submission)
    setReviewAction('reject')
    setRejectionReason('')
  }, [])

  const handleCancelReview = useCallback(() => {
    setSubmissionToReview(null)
    setReviewAction(null)
    setRejectionReason('')
  }, [])

  const handleConfirmReview = useCallback(async () => {
    if (!submissionToReview || !reviewAction) return

    try {
      await reviewSubmission({
        submissionId: submissionToReview.id,
        status: reviewAction === 'approve' ? 'APPROVED' : 'REJECTED',
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
      })

      toast.success(
        reviewAction === 'approve'
          ? `Submission from ${submissionToReview.groupName} approved`
          : `Submission from ${submissionToReview.groupName} rejected`
      )

      setSubmissionToReview(null)
      setReviewAction(null)
      setRejectionReason('')
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to review submission'
      toast.error(message)
    }
  }, [submissionToReview, reviewAction, rejectionReason, reviewSubmission, refetch])

  // Media view handler
  const handleViewMedia = useCallback((submission: ChallengeSubmission) => {
    setViewingMedia(submission)
  }, [])

  const handleCloseMedia = useCallback(() => {
    setViewingMedia(null)
  }, [])

  // Loading state
  if (challengeLoading || submissionsLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" gap="$2" marginBottom="$4">
          <Button variant="ghost" size="sm" onPress={handleBack}>
            <ChevronLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Challenge Submissions
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
            <ChevronLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Challenge Submissions
          </Text>
        </XStack>
        <ErrorMessage
          title="Failed to load submissions"
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
              Submissions
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

      {/* Statistics */}
      <Card padding="$3" marginBottom="$4">
        <XStack justifyContent="space-around">
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Total</Text>
            <Text fontSize="$6" fontWeight="600">{stats.total}</Text>
          </YStack>
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Pending</Text>
            <Text fontSize="$6" fontWeight="600" color="#f59e0b">
              {stats.pending}
            </Text>
          </YStack>
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Approved</Text>
            <Text fontSize="$6" fontWeight="600" color="#22c55e">
              {stats.approved}
            </Text>
          </YStack>
          <YStack alignItems="center">
            <Text fontSize="$2" color="gray">Rejected</Text>
            <Text fontSize="$6" fontWeight="600" color="#ef4444">
              {stats.rejected}
            </Text>
          </YStack>
        </XStack>
      </Card>

      {/* Filter */}
      <XStack gap="$2" marginBottom="$4">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as SubmissionStatus | 'ALL')}
        >
          <Select.Item value="ALL" index={0}>All Submissions</Select.Item>
          <Select.Item value="PENDING" index={1}>Pending</Select.Item>
          <Select.Item value="APPROVED" index={2}>Approved</Select.Item>
          <Select.Item value="REJECTED" index={3}>Rejected</Select.Item>
        </Select>
      </XStack>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <AlertCircle size={48} color="#9ca3af" />
          <Text fontSize="$5" fontWeight="500" color="gray" textAlign="center">
            No submissions found
          </Text>
          <Text fontSize="$3" color="gray" textAlign="center">
            {filter === 'ALL'
              ? 'No submissions have been made to this challenge yet'
              : `No ${getSubmissionStatusLabel(filter).toLowerCase()} submissions`}
          </Text>
        </YStack>
      ) : (
        <YStack gap="$3">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewMedia={handleViewMedia}
              disabled={reviewLoading}
            />
          ))}
        </YStack>
      )}

      {/* Review Confirmation Sheet */}
      <Sheet
        open={!!submissionToReview && !!reviewAction}
        onOpenChange={(open: boolean) => !open && handleCancelReview()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            {reviewAction === 'approve' ? 'Approve Submission' : 'Reject Submission'}
          </Text>

          {submissionToReview && (
            <YStack gap="$2">
              <Text fontSize="$4">
                Group: <Text fontWeight="600">{submissionToReview.groupName}</Text>
              </Text>
              <Text fontSize="$3" color="gray">
                Submitted by {submissionToReview.userName}
              </Text>
            </YStack>
          )}

          {/* Rejection reason input */}
          {reviewAction === 'reject' && (
            <YStack gap="$1">
              <Label htmlFor="rejectionReason">Rejection Reason (optional)</Label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this submission is being rejected..."
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
          )}

          {reviewError && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {reviewError.message}
              </Text>
            </YStack>
          )}

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              onPress={handleCancelReview}
              disabled={reviewLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              onPress={handleConfirmReview}
              disabled={reviewLoading}
              isLoading={reviewLoading}
              flex={1}
            >
              {reviewAction === 'approve' ? (
                <>
                  <Check size={18} />
                  Approve
                </>
              ) : (
                <>
                  <XCircle size={18} />
                  Reject
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

              {/* Content */}
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

// Simple label component for the rejection reason
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
