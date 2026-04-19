/**
 * CoinCard Component
 *
 * Displays a group's coin balance in a card format with actions.
 * Used in the coins overview page.
 *
 * @module @/components/admin/coins/CoinCard
 */

'use client'

import { useCallback } from 'react'
import { Card, XStack, YStack, Text, Button } from '@mirai-app/ui'
import { Plus, Minus, History } from '@/components/ui/Icon'
import type { CoinBalance } from './types'

interface CoinCardProps {
  /** Coin balance data to display */
  balance: CoinBalance
  /** Callback when add coins button is clicked */
  onAddCoins: (balance: CoinBalance) => void
  /** Callback when remove coins button is clicked */
  onRemoveCoins: (balance: CoinBalance) => void
  /** Callback when view history button is clicked */
  onViewHistory: (balance: CoinBalance) => void
  /** Whether the card is in a loading state */
  loading?: boolean
}

/**
 * CoinCard - Displays a group with its coin balance and action buttons
 *
 * @example
 * ```tsx
 * <CoinCard
 *   balance={balance}
 *   onAddCoins={(b) => openAddModal(b)}
 *   onRemoveCoins={(b) => openRemoveModal(b)}
 *   onViewHistory={(b) => navigateToHistory(b.groupId)}
 * />
 * ```
 */
export function CoinCard({
  balance,
  onAddCoins,
  onRemoveCoins,
  onViewHistory,
  loading,
}: CoinCardProps) {
  const handleAddCoins = useCallback(() => {
    if (!loading) {
      onAddCoins(balance)
    }
  }, [onAddCoins, balance, loading])

  const handleRemoveCoins = useCallback(() => {
    if (!loading) {
      onRemoveCoins(balance)
    }
  }, [onRemoveCoins, balance, loading])

  const handleViewHistory = useCallback(() => {
    if (!loading) {
      onViewHistory(balance)
    }
  }, [onViewHistory, balance, loading])

  return (
    <Card
      padding="$4"
      opacity={loading ? 0.6 : 1}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack alignItems="center" gap="$4">
        {/* Coin balance display */}
        <YStack
          width={64}
          height={64}
          borderRadius={32}
          backgroundColor="#fbbf24"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$6" fontWeight="700" color="#78350f">
            {balance.coins}
          </Text>
          <Text fontSize="$1" color="#78350f" opacity={0.8}>
            coins
          </Text>
        </YStack>

        {/* Group info */}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {balance.name}
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            Group ID: {balance.groupId.slice(0, 8)}...
          </Text>
        </YStack>

        {/* Action buttons */}
        <XStack gap="$2">
          <Button
            variant="ghost"
            size="md"
            onPress={handleViewHistory}
            accessibilityLabel={`View transaction history for ${balance.name}`}
            disabled={loading}
          >
            <History size={18} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onPress={handleAddCoins}
            accessibilityLabel={`Add coins to ${balance.name}`}
            disabled={loading}
          >
            <Plus size={18} color="#22c55e" />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onPress={handleRemoveCoins}
            accessibilityLabel={`Remove coins from ${balance.name}`}
            disabled={loading || balance.coins <= 0}
          >
            <Minus size={18} color="#ef4444" />
          </Button>
        </XStack>
      </XStack>
    </Card>
  )
}

/**
 * CoinCardSkeleton - Loading placeholder for CoinCard
 *
 * Shows a skeleton UI while coin data is loading.
 */
export function CoinCardSkeleton() {
  return (
    <Card padding="$4">
      <XStack alignItems="center" gap="$4">
        {/* Coin balance skeleton */}
        <YStack
          width={64}
          height={64}
          borderRadius={32}
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
            width={120}
            backgroundColor="$backgroundHover"
            borderRadius={4}
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
