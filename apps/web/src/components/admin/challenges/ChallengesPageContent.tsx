/**
 * ChallengesPageContent Component
 *
 * Displays the list of challenges for the selected trip.
 * Features:
 * - Fetches challenges via GraphQL query
 * - Real-time updates via subscriptions
 * - Displays challenges in card list with status
 * - Supports navigation to create/edit/detail pages
 * - Status management (activate, start voting, complete)
 * - Handles loading and error states
 *
 * @module @/components/admin/challenges/ChallengesPageContent
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
  Select,
} from '@mirai-app/ui'
import { Plus, AlertCircle, Play, Check, CheckCircle, XCircle, ThumbsUp, Vote } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import {
  useGetChallengesQuery,
  useDeleteChallengeMutation,
  useChangeChallengeStatusMutation,
  useSubmissionUpdatesSubscription,
  useVoteUpdatesSubscription,
} from './hooks'
import { ChallengeCard, ChallengeCardSkeleton } from './ChallengeCard'
import {
  type ChallengeListItem,
  type ChallengeStatus,
  getChallengeStatusLabel,
} from './types'

// =============================================================================
// Status Transition Options
// =============================================================================

const STATUS_TRANSITIONS: Record<ChallengeStatus, { value: ChallengeStatus; label: string; icon: typeof Play }[]> = {
  HIDDEN: [
    { value: 'VISIBLE', label: 'Make Visible', icon: Play },
  ],
  VISIBLE: [
    { value: 'ACTIVE', label: 'Activate', icon: Play },
    { value: 'HIDDEN', label: 'Hide', icon: XCircle },
  ],
  ACTIVE: [
    { value: 'VOTING_PHASE', label: 'Start Voting', icon: Vote },
    { value: 'COMPLETED', label: 'Complete', icon: CheckCircle },
    { value: 'CANCELLED', label: 'Cancel', icon: XCircle },
  ],
  VOTING_PHASE: [
    { value: 'COMPLETED', label: 'Complete', icon: CheckCircle },
    { value: 'CANCELLED', label: 'Cancel', icon: XCircle },
  ],
  COMPLETED: [],
  CANCELLED: [
    { value: 'VISIBLE', label: 'Reopen', icon: Play },
  ],
}

// =============================================================================
// Component
// =============================================================================

/**
 * ChallengesPageContent - Main content for the challenges list page
 *
 * Fetches challenges for the selected trip and displays them in a list.
 * Supports real-time updates, status transitions, and challenge management.
 */
export function ChallengesPageContent() {
  const { selectedTrip } = useTripContext()
  const [challengeToDelete, setChallengeToDelete] = useState<ChallengeListItem | null>(null)
  const [challengeToTransition, setChallengeToTransition] = useState<ChallengeListItem | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ChallengeStatus | null>(null)

  // Get trip ID as string for the query
  const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : ''

  // Fetch challenges
  const {
    challenges,
    loading: challengesLoading,
    error: challengesError,
    refetch,
  } = useGetChallengesQuery(tripIdString)

  // Mutations
  const {
    deleteChallenge,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteChallengeMutation()

  const {
    changeStatus,
    loading: statusLoading,
    error: statusError,
  } = useChangeChallengeStatusMutation()

  // Real-time subscriptions (for all challenges in this trip)
  const { latestSubmission } = useSubmissionUpdatesSubscription(tripIdString)
  const { latestVoteUpdate } = useVoteUpdatesSubscription(tripIdString)

  // Handle real-time updates
  useEffect(() => {
    if (latestSubmission) {
      // Refetch to get updated counts
      refetch()
    }
  }, [latestSubmission, refetch])

  useEffect(() => {
    if (latestVoteUpdate) {
      // Refetch to get updated vote counts
      refetch()
    }
  }, [latestVoteUpdate, refetch])

  // Navigation handlers
  const handleCreateClick = useCallback(() => {
    window.location.href = '/challenges/new'
  }, [])

  const handleViewClick = useCallback((challenge: ChallengeListItem) => {
    window.location.href = `/challenges/${challenge.id}`
  }, [])

  const handleEditClick = useCallback((challenge: ChallengeListItem) => {
    window.location.href = `/challenges/${challenge.id}/edit`
  }, [])

  const handleManageSubmissions = useCallback((challenge: ChallengeListItem) => {
    window.location.href = `/challenges/${challenge.id}/submissions`
  }, [])

  const handleViewVoting = useCallback((challenge: ChallengeListItem) => {
    window.location.href = `/challenges/${challenge.id}/voting`
  }, [])

  const handleViewJudging = useCallback((challenge: ChallengeListItem) => {
    window.location.href = `/challenges/${challenge.id}/judging`
  }, [])

  // Delete handlers
  const handleDeleteClick = useCallback((challenge: ChallengeListItem) => {
    setChallengeToDelete(challenge)
  }, [])

  const handleCancelDelete = useCallback(() => {
    setChallengeToDelete(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!challengeToDelete) return

    try {
      await deleteChallenge(challengeToDelete.id)
      toast.success(`Challenge "${challengeToDelete.name}" deleted successfully`)
      setChallengeToDelete(null)
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete challenge'
      toast.error(message)
    }
  }, [challengeToDelete, deleteChallenge, refetch])

  // Status transition handlers
  const handleStatusTransitionClick = useCallback((challenge: ChallengeListItem) => {
    setChallengeToTransition(challenge)
    setSelectedStatus(null)
  }, [])

  const handleCancelStatusTransition = useCallback(() => {
    setChallengeToTransition(null)
    setSelectedStatus(null)
  }, [])

  const handleConfirmStatusTransition = useCallback(async () => {
    if (!challengeToTransition || !selectedStatus) return

    try {
      await changeStatus(challengeToTransition.id, selectedStatus)
      toast.success(`Challenge status changed to ${getChallengeStatusLabel(selectedStatus)}`)
      setChallengeToTransition(null)
      setSelectedStatus(null)
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change challenge status'
      toast.error(message)
    }
  }, [challengeToTransition, selectedStatus, changeStatus, refetch])

  // Render loading state
  if (challengesLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Challenges
          </Text>
          <Button variant="primary" size="md" disabled>
            <Plus size={18} />
            Create Challenge
          </Button>
        </XStack>
        <YStack gap="$3">
          {[...Array(5)].map((_, i) => (
            <ChallengeCardSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  // Render error state
  if (challengesError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Challenges
          </Text>
          <Button variant="primary" size="md" onPress={handleCreateClick}>
            <Plus size={18} />
            Create Challenge
          </Button>
        </XStack>
        <ErrorMessage
          title="Failed to load challenges"
          message={challengesError.message}
          onRetry={refetch}
        />
      </YStack>
    )
  }

  // Render empty trip state
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <AlertCircle size={48} color="#9ca3af" />
        <Text fontSize="$5" fontWeight="500" color="gray" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="gray" textAlign="center">
          Please select a trip from the header to view challenges
        </Text>
      </YStack>
    )
  }

  // Render empty challenges state
  if (challenges.length === 0) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Challenges
          </Text>
          <Button variant="primary" size="md" onPress={handleCreateClick}>
            <Plus size={18} />
            Create Challenge
          </Button>
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Text fontSize="$5" fontWeight="500" color="gray" textAlign="center">
            No challenges yet
          </Text>
          <Text fontSize="$3" color="gray" textAlign="center">
            Get started by creating your first challenge for {selectedTrip.name}
          </Text>
          <Button variant="primary" onPress={handleCreateClick} marginTop="$4">
            <Plus size={20} />
            Create Challenge
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Group challenges by status
  const activeChallenges = challenges.filter(c => c.status === 'ACTIVE' || c.status === 'VOTING_PHASE')
  const visibleChallenges = challenges.filter(c => c.status === 'VISIBLE')
  const completedChallenges = challenges.filter(c => c.status === 'COMPLETED' || c.status === 'CANCELLED')
  const hiddenChallenges = challenges.filter(c => c.status === 'HIDDEN')

  // Render challenges list
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
        <YStack>
          <Text fontSize="$6" fontWeight="600">
            Challenges
          </Text>
          <Text fontSize="$3" color="gray">
            {challenges.length} {challenges.length === 1 ? 'challenge' : 'challenges'} in {selectedTrip.name}
          </Text>
        </YStack>
        <Button variant="primary" size="md" onPress={handleCreateClick}>
          <Plus size={18} />
          Create Challenge
        </Button>
      </XStack>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <YStack gap="$3" marginBottom="$6">
          <Text fontSize="$5" fontWeight="600" color="blue">
            Active & Voting ({activeChallenges.length})
          </Text>
          {activeChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onManageSubmissions={handleManageSubmissions}
              onViewVoting={handleViewVoting}
              onViewJudging={handleViewJudging}
            />
          ))}
        </YStack>
      )}

      {/* Visible (Ready) Challenges */}
      {visibleChallenges.length > 0 && (
        <YStack gap="$3" marginBottom="$6">
          <Text fontSize="$5" fontWeight="600" color="gray">
            Ready to Activate ({visibleChallenges.length})
          </Text>
          {visibleChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onManageSubmissions={handleManageSubmissions}
            />
          ))}
        </YStack>
      )}

      {/* Hidden Challenges */}
      {hiddenChallenges.length > 0 && (
        <YStack gap="$3" marginBottom="$6">
          <Text fontSize="$5" fontWeight="600" color="gray">
            Hidden ({hiddenChallenges.length})
          </Text>
          {hiddenChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onView={handleViewClick}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onManageSubmissions={handleManageSubmissions}
            />
          ))}
        </YStack>
      )}

      {/* Completed/Cancelled Challenges */}
      {completedChallenges.length > 0 && (
        <YStack gap="$3" marginBottom="$6">
          <Text fontSize="$5" fontWeight="600" color="gray">
            Completed & Cancelled ({completedChallenges.length})
          </Text>
          {completedChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onView={handleViewClick}
              onManageSubmissions={handleManageSubmissions}
              onViewVoting={handleViewVoting}
              onViewJudging={handleViewJudging}
            />
          ))}
        </YStack>
      )}

      {/* Delete confirmation sheet */}
      <Sheet
        open={!!challengeToDelete}
        onOpenChange={(open: boolean) => !open && handleCancelDelete()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Delete Challenge
          </Text>
          <Text fontSize="$4" color="gray">
            Are you sure you want to delete{' '}
            <Text fontWeight="600">{challengeToDelete?.name}</Text>?
          </Text>
          <Text fontSize="$3" color="gray">
            This action cannot be undone. All submissions and votes will be permanently removed.
          </Text>

          {deleteError && (
            <YStack
              padding="$3"
              backgroundColor="rgba(239, 68, 68, 0.1)"
              borderRadius="$2"
              borderWidth={1}
              borderColor="#ef4444"
            >
              <Text color="#ef4444" fontSize="$3">
                {deleteError.message}
              </Text>
            </YStack>
          )}

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              onPress={handleCancelDelete}
              disabled={deleteLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={handleConfirmDelete}
              disabled={deleteLoading}
              isLoading={deleteLoading}
              flex={1}
            >
              Delete
            </Button>
          </XStack>
        </YStack>
      </Sheet>

      {/* Status transition sheet */}
      <Sheet
        open={!!challengeToTransition}
        onOpenChange={(open: boolean) => !open && handleCancelStatusTransition()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Change Challenge Status
          </Text>
          <Text fontSize="$4" color="gray">
            Change status for <Text fontWeight="600">{challengeToTransition?.name}</Text>
          </Text>

          {challengeToTransition && (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="500">
                Current: {getChallengeStatusLabel(challengeToTransition.status)}
              </Text>
              <Text fontSize="$3" color="gray">
                Select new status:
              </Text>
              <Select
                value={selectedStatus ?? ''}
                onValueChange={(value) => setSelectedStatus(value as ChallengeStatus)}
              >
                {STATUS_TRANSITIONS[challengeToTransition.status].map((option, idx) => (
                  <Select.Item key={option.value} value={option.value} index={idx}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select>
            </YStack>
          )}

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

          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              onPress={handleCancelStatusTransition}
              disabled={statusLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={handleConfirmStatusTransition}
              disabled={statusLoading || !selectedStatus}
              isLoading={statusLoading}
              flex={1}
            >
              Change Status
            </Button>
          </XStack>
        </YStack>
      </Sheet>
    </YStack>
  )
}
