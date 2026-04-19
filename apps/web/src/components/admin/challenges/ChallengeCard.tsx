/**
 * ChallengeCard Component
 *
 * Displays a challenge in a card format with status, submission counts,
 * and action buttons for viewing, editing, and managing.
 *
 * @module @/components/admin/challenges/ChallengeCard
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
  getChallengeStatusLabel,
  getChallengeStatusColor,
  getScoringCategoryLabel,
  getSubmissionTypeLabel,
  canEditChallenge,
  requiresVoting,
  requiresJudging,
  type ChallengeListItem,
} from './types'
import { Eye, Edit, Trash2, Users, Check, Clock } from '@/components/ui/Icon'

// =============================================================================
// Component Props
// =============================================================================

export interface ChallengeCardProps {
  /** Challenge to display */
  challenge: ChallengeListItem
  /** Called when view button is clicked */
  onView?: (challenge: ChallengeListItem) => void
  /** Called when edit button is clicked */
  onEdit?: (challenge: ChallengeListItem) => void
  /** Called when delete button is clicked */
  onDelete?: (challenge: ChallengeListItem) => void
  /** Called when manage submissions button is clicked */
  onManageSubmissions?: (challenge: ChallengeListItem) => void
  /** Called when view voting button is clicked */
  onViewVoting?: (challenge: ChallengeListItem) => void
  /** Called when view judging button is clicked */
  onViewJudging?: (challenge: ChallengeListItem) => void
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Status badge component (using styled div since Badge isn't in UI lib)
 */
function StatusBadge({ status }: { status: ChallengeListItem['status'] }) {
  const label = getChallengeStatusLabel(status)
  const color = getChallengeStatusColor(status)

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

/**
 * Scoring category badge
 */
function CategoryBadge({ category }: { category: ChallengeListItem['scoringCategory'] }) {
  const label = getScoringCategoryLabel(category)

  const categoryColors: Record<ChallengeListItem['scoringCategory'], string> = {
    SPEED: '#3b82f6',
    UNLIMITED: '#22c55e',
    JUDGED_STAFF: '#f59e0b',
    PEER_VOTING: '#8b5cf6',
  }

  return (
    <div
      style={{
        backgroundColor: categoryColors[category],
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

/**
 * Submission counts display
 */
function SubmissionCounts({ challenge }: { challenge: ChallengeListItem }) {
  return (
    <XStack gap="$3">
      <XStack alignItems="center" gap="$1">
        <Users size={14} color="#6b7280" />
        <Text fontSize="$xs" color="gray">
          {challenge.submissionCount} submissions
        </Text>
      </XStack>
      {challenge.pendingCount > 0 && (
        <XStack alignItems="center" gap="$1">
          <Clock size={14} color="#f59e0b" />
          <Text fontSize="$xs" color="#f59e0b">
            {challenge.pendingCount} pending
          </Text>
        </XStack>
      )}
      {challenge.approvedCount > 0 && (
        <XStack alignItems="center" gap="$1">
          <Check size={14} color="#22c55e" />
          <Text fontSize="$xs" color="#22c55e">
            {challenge.approvedCount} approved
          </Text>
        </XStack>
      )}
    </XStack>
  )
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChallengeCard - Displays a challenge in card format
 *
 * Shows challenge details including status, submission counts, scoring category,
 * and provides action buttons for managing the challenge.
 */
export function ChallengeCard({
  challenge,
  onView,
  onEdit,
  onDelete,
  onManageSubmissions,
  onViewVoting,
  onViewJudging,
}: ChallengeCardProps) {
  const handleView = useCallback(() => {
    onView?.(challenge)
  }, [challenge, onView])

  const handleEdit = useCallback(() => {
    onEdit?.(challenge)
  }, [challenge, onEdit])

  const handleDelete = useCallback(() => {
    onDelete?.(challenge)
  }, [challenge, onDelete])

  const handleManageSubmissions = useCallback(() => {
    onManageSubmissions?.(challenge)
  }, [challenge, onManageSubmissions])

  const handleViewVoting = useCallback(() => {
    onViewVoting?.(challenge)
  }, [challenge, onViewVoting])

  const handleViewJudging = useCallback(() => {
    onViewJudging?.(challenge)
  }, [challenge, onViewJudging])

  const isEditable = canEditChallenge(challenge.status)
  const needsVoting = requiresVoting(challenge.scoringCategory)
  const needsJudging = requiresJudging(challenge.scoringCategory)
  const hasSubmissions = challenge.submissionCount > 0

  return (
    <Card padding="$4" width="100%">
      <YStack gap="$3">
        {/* Header: Title and Status */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$1">
            <Text fontSize="$5" fontWeight="600" numberOfLines={2}>
              {challenge.name}
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              <StatusBadge status={challenge.status} />
              <CategoryBadge category={challenge.scoringCategory} />
            </XStack>
          </YStack>
          <Text fontSize="$6" fontWeight="600" color="blue">
            {challenge.basePoints} pts
          </Text>
        </XStack>

        {/* Description */}
        {challenge.description && (
          <Text fontSize="$3" color="gray" numberOfLines={2}>
            {challenge.description}
          </Text>
        )}

        {/* Submission Type */}
        <Text fontSize="$2" color="gray">
          Type: {getSubmissionTypeLabel(challenge.submissionType)}
        </Text>

        {/* Submission Counts */}
        {hasSubmissions && <SubmissionCounts challenge={challenge} />}

        {/* Action Buttons */}
        <XStack gap="$2" flexWrap="wrap" marginTop="$2">
          <Button
            size="sm"
            variant="secondary"
            onPress={handleView}
            flex={1}
          >
            <Eye size={14} />
            View
          </Button>

          {isEditable && (
            <Button
              size="sm"
              variant="secondary"
              onPress={handleEdit}
              flex={1}
            >
              <Edit size={14} />
              Edit
            </Button>
          )}

          {hasSubmissions && (
            <Button
              size="sm"
              variant="secondary"
              onPress={handleManageSubmissions}
              flex={1}
            >
              <Users size={14} />
              Submissions
            </Button>
          )}

          {needsVoting && hasSubmissions && (
            <Button
              size="sm"
              variant="secondary"
              onPress={handleViewVoting}
              flex={1}
            >
              Vote
            </Button>
          )}

          {needsJudging && hasSubmissions && (
            <Button
              size="sm"
              variant="secondary"
              onPress={handleViewJudging}
              flex={1}
            >
              Judge
            </Button>
          )}

          {isEditable && (
            <Button
              size="sm"
              variant="danger"
              onPress={handleDelete}
            >
              <Trash2 size={14} />
            </Button>
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
 * Skeleton loader for ChallengeCard
 */
export function ChallengeCardSkeleton() {
  return (
    <Card padding="$4" width="100%">
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$1">
            <div
              style={{
                width: '60%',
                height: 24,
                backgroundColor: '#e5e7eb',
                borderRadius: 4,
              }}
            />
            <XStack gap="$2">
              <div
                style={{
                  width: 60,
                  height: 20,
                  backgroundColor: '#e5e7eb',
                  borderRadius: 4,
                }}
              />
              <div
                style={{
                  width: 80,
                  height: 20,
                  backgroundColor: '#e5e7eb',
                  borderRadius: 4,
                }}
              />
            </XStack>
          </YStack>
          <div
            style={{
              width: 50,
              height: 24,
              backgroundColor: '#e5e7eb',
              borderRadius: 4,
            }}
          />
        </XStack>

        <div
          style={{
            width: '100%',
            height: 16,
            backgroundColor: '#e5e7eb',
            borderRadius: 4,
          }}
        />

        <div
          style={{
            width: '40%',
            height: 14,
            backgroundColor: '#e5e7eb',
            borderRadius: 4,
          }}
        />

        <XStack gap="$2" marginTop="$2">
          {[1, 2, 3].map((i) => (
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
