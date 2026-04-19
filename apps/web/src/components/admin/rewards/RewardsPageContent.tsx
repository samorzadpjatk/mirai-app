/**
 * RewardsPageContent Component
 *
 * Displays the list of rewards for the selected trip.
 * Features:
 * - Fetches rewards via GraphQL query
 * - Displays rewards in a card list with image preview
 * - Supports navigation to create/edit pages
 * - Handles loading and error states
 * - Delete confirmation with cache invalidation
 *
 * @module @/components/admin/rewards/RewardsPageContent
 */

'use client'

import { useCallback, useState, useMemo } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
} from '@mirai-app/ui'
import { Plus, AlertCircle } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import {
  useGetRewardsQuery,
  useDeleteRewardMutation,
} from './hooks'
import { RewardCard, RewardCardSkeleton } from './RewardCard'
import type { Reward } from './types'

/**
 * RewardsPageContent - Main content for the rewards list page
 *
 * Fetches rewards for the selected trip and displays them in a list.
 * Supports creating, editing, and deleting rewards.
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'rewards': () => import('../admin/rewards/RewardsPageContent'),
 * ```
 */
export function RewardsPageContent() {
  const { selectedTrip } = useTripContext()
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null)

  // Get trip ID as string for the query
  const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : ''

  // Fetch rewards
  const {
    rewards,
    loading: rewardsLoading,
    error: rewardsError,
    refetch,
    hasMore,
    loadMore,
  } = useGetRewardsQuery(tripIdString)

  // Delete mutation
  const {
    deleteReward,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteRewardMutation()

  // Navigate to create reward page
  const handleCreateClick = useCallback(() => {
    window.location.href = '/rewards/new'
  }, [])

  // Navigate to edit reward page
  const handleEditClick = useCallback((reward: Reward) => {
    window.location.href = `/rewards/${reward.id}/edit`
  }, [])

  // Open delete confirmation
  const handleDeleteClick = useCallback((reward: Reward) => {
    setRewardToDelete(reward)
  }, [])

  // Close delete confirmation
  const handleCancelDelete = useCallback(() => {
    setRewardToDelete(null)
  }, [])

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!rewardToDelete) return

    try {
      await deleteReward(rewardToDelete.id)
      toast.success(`Reward "${rewardToDelete.name}" deleted successfully`)
      setRewardToDelete(null)
      // Cache is automatically invalidated by the mutation updater
      // but we can optionally refetch to ensure consistency
      refetch()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete reward'
      toast.error(message)
    }
  }, [rewardToDelete, deleteReward, refetch])

  // Render loading state
  if (rewardsLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Rewards
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
            disabled
          >
            <Plus size={18} />
            Add Reward
          </Button>
        </XStack>
        <YStack gap="$3">
          {[...Array(5)].map((_, i) => (
            <RewardCardSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  // Render error state
  if (rewardsError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Rewards
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Add Reward
          </Button>
        </XStack>
        <ErrorMessage
          title="Failed to load rewards"
          message={rewardsError.message}
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
        <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          Please select a trip from the header to view rewards
        </Text>
      </YStack>
    )
  }

  // Render empty rewards state
  if (rewards.length === 0) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Rewards
          </Text>
          <Button
            variant="primary"
            size="md"
            onPress={handleCreateClick}
          >
            <Plus size={18} />
            Add Reward
          </Button>
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No rewards yet
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Get started by adding your first reward to {selectedTrip.name}
          </Text>
          <Button variant="primary" size="lg" onPress={handleCreateClick} marginTop="$4">
            <Plus size={20} />
            Add Reward
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Render rewards list
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
            Rewards
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {rewards.length} {rewards.length === 1 ? 'reward' : 'rewards'} in {selectedTrip.name}
          </Text>
        </YStack>
        <Button
          variant="primary"
          size="md"
          onPress={handleCreateClick}
        >
          <Plus size={18} />
          Add Reward
        </Button>
      </XStack>

      {/* Rewards list */}
      <YStack gap="$3">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        ))}
      </YStack>

      {/* Load more button */}
      {hasMore && (
        <Button
          variant="secondary"
          size="md"
          onPress={loadMore}
          marginTop="$4"
          alignSelf="center"
        >
          Load More
        </Button>
      )}

      {/* Delete confirmation sheet */}
      <Sheet
        open={!!rewardToDelete}
        onOpenChange={(open: boolean) => !open && handleCancelDelete()}
      >
        <YStack gap="$4" padding="$4">
          <Text fontSize="$5" fontWeight="600">
            Delete Reward
          </Text>
          <Text fontSize="$4" color="$color">
            Are you sure you want to delete{' '}
            <Text fontWeight="600">
              {rewardToDelete?.name}
            </Text>
            ?
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            This action cannot be undone. The reward will be permanently removed from the trip.
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
              size="lg"
              onPress={handleCancelDelete}
              disabled={deleteLoading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="lg"
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
    </YStack>
  )
}
