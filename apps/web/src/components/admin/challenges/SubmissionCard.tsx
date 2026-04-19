/**
 * SubmissionCard Component
 *
 * Displays a challenge submission with media preview, status,
 * and action buttons for approve/reject.
 *
 * @module @/components/admin/challenges/SubmissionCard
 */

'use client'

import { useCallback } from 'react'
import {
  Card,
  Text,
  YStack,
  XStack,
  Button,
} from '@mirai-app/ui'
import {
  Check,
  XCircle,
  Clock,
  User,
  UserCircle,
  Users,
  MapPin,
  Camera,
} from '@/components/ui/Icon'
import type {
  ChallengeSubmission,
  SubmissionStatus,
  SubmissionWithDetails,
} from './types'
import { getSubmissionStatusLabel, getSubmissionStatusColor } from './types'

// =============================================================================
// Component Props
// =============================================================================

export interface SubmissionCardProps {
  /** Submission to display */
  submission: ChallengeSubmission | SubmissionWithDetails
  /** Called when approve button is clicked */
  onApprove?: (submission: ChallengeSubmission) => void
  /** Called when reject button is clicked */
  onReject?: (submission: ChallengeSubmission) => void
  /** Called when view details button is clicked */
  onView?: (submission: ChallengeSubmission) => void
  /** Called when view media button is clicked */
  onViewMedia?: (submission: ChallengeSubmission) => void
  /** Whether actions are disabled */
  disabled?: boolean
}

// =============================================================================
// Helper Components
// =============================================================================

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const label = getSubmissionStatusLabel(status)
  const color = getSubmissionStatusColor(status)

  return (
    <div
      style={{
        backgroundColor: color,
        color: 'white',
        fontSize: 12,
        padding: '4px 8px',
        borderRadius: 4,
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  )
}

function MediaPreview({ submission }: { submission: ChallengeSubmission }) {
  const hasImages = submission.imageUrls.length > 0
  const hasVideo = !!submission.videoUrl

  if (!hasImages && !hasVideo) {
    return null
  }

  if (hasImages) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 120,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#f3f4f6',
        }}
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
    )
  }

  if (hasVideo) {
    return (
      <div
        style={{
          width: '100%',
          height: 120,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Camera size={32} color="#6b7280" />
        <Text fontSize="$2" color="gray" marginLeft="$2">
          Video
        </Text>
      </div>
    )
  }

  return null
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * SubmissionCard - Displays a challenge submission
 *
 * Shows submission details, media preview, and provides action buttons
 * for approving or rejecting submissions.
 */
export function SubmissionCard({
  submission,
  onApprove,
  onReject,
  onView,
  onViewMedia,
  disabled = false,
}: SubmissionCardProps) {
  const handleApprove = useCallback(() => {
    onApprove?.(submission)
  }, [submission, onApprove])

  const handleReject = useCallback(() => {
    onReject?.(submission)
  }, [submission, onReject])

  const handleView = useCallback(() => {
    onView?.(submission)
  }, [submission, onView])

  const handleViewMedia = useCallback(() => {
    onViewMedia?.(submission)
  }, [submission, onViewMedia])

  const isPending = submission.status === 'PENDING'
  const isApproved = submission.status === 'APPROVED'
  const isRejected = submission.status === 'REJECTED'

  return (
    <Card padding="$3" width="100%">
      <YStack gap="$3">
        {/* Header: Group and Status */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$1">
            <XStack alignItems="center" gap="$2">
              <Users size={14} color="#6b7280" />
              <Text fontSize="$4" fontWeight="600">
                {submission.groupName}
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <User size={12} color="#6b7280" />
              <Text fontSize="$2" color="gray">
                by {submission.userName}
              </Text>
            </XStack>
          </YStack>
          <StatusBadge status={submission.status} />
        </XStack>

        {/* Media Preview */}
        <MediaPreview submission={submission} />

        {/* Content */}
        {submission.content && (
          <Text fontSize="$3" color="gray">
            {submission.content}
          </Text>
        )}

        {/* Location */}
        {(submission.latitude !== undefined || submission.longitude !== undefined) && (
          <XStack alignItems="center" gap="$1">
            <MapPin size={12} color="#6b7280" />
            <Text fontSize="$2" color="gray">
              {submission.latitude?.toFixed(6)}, {submission.longitude?.toFixed(6)}
            </Text>
          </XStack>
        )}

        {/* Submitted Time */}
        <XStack alignItems="center" gap="$1">
          <Clock size={12} color="#6b7280" />
          <Text fontSize="$2" color="gray">
            {new Date(submission.createdAt).toLocaleString()}
          </Text>
        </XStack>

        {/* Review Info (if reviewed) */}
        {submission.reviewedAt && (
          <YStack
            padding="$2"
            backgroundColor={isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#f3f4f6'}
            borderRadius="$2"
          >
            <Text fontSize="$2" color={isApproved ? '#166534' : isRejected ? '#991b1b' : 'gray'}>
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Reviewed'}{' '}
              by {submission.reviewedByName ?? 'Unknown'}{' '}
              on {new Date(submission.reviewedAt).toLocaleDateString()}
            </Text>
            {submission.rejectionReason && (
              <Text fontSize="$2" color="#991b1b" marginTop="$1">
                Reason: {submission.rejectionReason}
              </Text>
            )}
          </YStack>
        )}

        {/* Action Buttons */}
        <XStack gap="$2" flexWrap="wrap">
          {onViewMedia && (submission.imageUrls.length > 0 || submission.videoUrl) && (
            <Button size="sm" variant="secondary" onPress={handleViewMedia} flex={1}>
              View Media
            </Button>
          )}

          {isPending && (
            <>
              {onApprove && (
                <Button
                  size="sm"
                  variant="primary"
                  onPress={handleApprove}
                  disabled={disabled}
                  flex={1}
                >
                  <Check size={14} />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="danger"
                  onPress={handleReject}
                  disabled={disabled}
                  flex={1}
                >
                  <XCircle size={14} />
                  Reject
                </Button>
              )}
            </>
          )}
        </XStack>
      </YStack>
    </Card>
  )
}

// =============================================================================
// Skeleton Component
// =============================================================================

/**
 * Skeleton loader for SubmissionCard
 */
export function SubmissionCardSkeleton() {
  return (
    <Card padding="$3" width="100%">
      <YStack gap="$3">
        <XStack justifyContent="space-between">
          <YStack gap="$1">
            <div
              style={{
                width: 120,
                height: 20,
                backgroundColor: '#e5e7eb',
                borderRadius: 4,
              }}
            />
            <div
              style={{
                width: 80,
                height: 14,
                backgroundColor: '#e5e7eb',
                borderRadius: 4,
              }}
            />
          </YStack>
          <div
            style={{
              width: 60,
              height: 20,
              backgroundColor: '#e5e7eb',
              borderRadius: 4,
            }}
          />
        </XStack>

        <div
          style={{
            width: '100%',
            height: 120,
            backgroundColor: '#e5e7eb',
            borderRadius: 8,
          }}
        />

        <div
          style={{
            width: '100%',
            height: 40,
            backgroundColor: '#e5e7eb',
            borderRadius: 4,
          }}
        />

        <XStack gap="$2">
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 32,
                backgroundColor: '#e5e7eb',
                borderRadius: 4,
              }}
            />
          ))}
        </XStack>
      </YStack>
    </Card>
  )
}
