/**
 * RewardCard Component
 *
 * Displays a single reward in a card format with image preview and actions.
 * Used in the rewards list page.
 *
 * @module @/components/admin/rewards/RewardCard
 */

'use client'

import { useCallback } from 'react'
import { Card, XStack, YStack, Text, Button } from '@mirai-app/ui'
import { Edit, Trash2, Coins, Package } from '@/components/ui/Icon'
import type { Reward } from './types'

interface RewardCardProps {
  /** Reward data to display */
  reward: Reward
  /** Callback when edit button is clicked */
  onEdit: (reward: Reward) => void
  /** Callback when delete button is clicked */
  onDelete: (reward: Reward) => void
  /** Whether the card is in a loading state */
  loading?: boolean
}

/**
 * RewardCard - Displays a reward with image, name, description, and action buttons
 *
 * @example
 * ```tsx
 * <RewardCard
 *   reward={reward}
 *   onEdit={(r) => navigateToEdit(r.id)}
 *   onDelete={(r) => confirmDelete(r)}
 * />
 * ```
 */
export function RewardCard({ reward, onEdit, onDelete, loading }: RewardCardProps) {
  const handleEdit = useCallback(() => {
    if (!loading) {
      onEdit(reward)
    }
  }, [onEdit, reward, loading])

  const handleDelete = useCallback(() => {
    if (!loading) {
      onDelete(reward)
    }
  }, [onDelete, reward, loading])

  return (
    <Card
      padding="$4"
      opacity={loading ? 0.6 : 1}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack alignItems="flex-start" gap="$4">
        {/* Image preview */}
        {reward.image ? (
          <YStack
            width={80}
            height={80}
            borderRadius="$2"
            overflow="hidden"
            backgroundColor="$backgroundHover"
          >
            <img
              src={reward.image}
              alt={reward.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </YStack>
        ) : (
          <YStack
            width={80}
            height={80}
            borderRadius="$2"
            backgroundColor="$backgroundHover"
            alignItems="center"
            justifyContent="center"
          >
            <Package size={32} color="#9ca3af" />
          </YStack>
        )}

        {/* Reward info */}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {reward.name}
          </Text>
          {reward.description && (
            <Text fontSize="$3" color="$colorMuted" numberOfLines={2}>
              {reward.description}
            </Text>
          )}
          <XStack gap="$3" marginTop="$2">
            {reward.coinCost !== null && reward.coinCost !== undefined && (
              <XStack alignItems="center" gap="$1">
                <Coins size={14} color="#eab308" />
                <Text fontSize="$2" color="$colorMuted">
                  {reward.coinCost} coins
                </Text>
              </XStack>
            )}
            {reward.availableQuantity !== null && reward.availableQuantity !== undefined && (
              <Text fontSize="$2" color="$colorMuted">
                {reward.availableQuantity} available
              </Text>
            )}
          </XStack>
        </YStack>

        {/* Action buttons */}
        <XStack gap="$2">
          <Button
            variant="ghost"
            size="md"
            onPress={handleEdit}
            accessibilityLabel={`Edit ${reward.name}`}
            disabled={loading}
          >
            <Edit size={18} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onPress={handleDelete}
            accessibilityLabel={`Delete ${reward.name}`}
            disabled={loading}
          >
            <Trash2 size={18} color="#ef4444" />
          </Button>
        </XStack>
      </XStack>
    </Card>
  )
}

/**
 * RewardCardSkeleton - Loading placeholder for RewardCard
 *
 * Shows a skeleton UI while reward data is loading.
 */
export function RewardCardSkeleton() {
  return (
    <Card padding="$4">
      <XStack alignItems="flex-start" gap="$4">
        {/* Image skeleton */}
        <YStack
          width={80}
          height={80}
          borderRadius="$2"
          backgroundColor="$backgroundHover"
        />

        {/* Info skeleton */}
        <YStack flex={1} gap="$2">
          <YStack
            height={20}
            width={150}
            backgroundColor="$backgroundHover"
            borderRadius={4}
          />
          <YStack
            height={16}
            width={200}
            backgroundColor="$backgroundHover"
            borderRadius={4}
          />
          <YStack
            height={14}
            width={100}
            backgroundColor="$backgroundHover"
            borderRadius={4}
            marginTop="$2"
          />
        </YStack>

        {/* Buttons skeleton */}
        <XStack gap="$2">
          <YStack
            width={36}
            height={36}
            backgroundColor="$backgroundHover"
            borderRadius={8}
          />
          <YStack
            width={36}
            height={36}
            backgroundColor="$backgroundHover"
            borderRadius={8}
          />
        </XStack>
      </XStack>
    </Card>
  )
}
