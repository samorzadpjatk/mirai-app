'use client'

import { YStack, XStack, Text, Button } from '@mirai-app/ui'
import { Users, Coins, Edit } from 'lucide-react'
import type { Group } from './types'

interface GroupCardProps {
  group: Group
  onEdit: (groupId: string) => void
}

/**
 * GroupCard - Individual group card component
 *
 * Displays group information including name and coins.
 * Provides an edit action button.
 *
 * @example
 * ```tsx
 * <GroupCard
 *   group={group}
 *   onEdit={(id) => console.log('Edit group:', id)}
 * />
 * ```
 */
export function GroupCard({ group, onEdit }: GroupCardProps) {
  return (
    <YStack
      backgroundColor="$backgroundHover"
      borderRadius="$4"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1} gap="$1">
          <Text fontSize="$5" fontWeight="600" color="$color">
            {group.name}
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            Coins: {group.coins}
          </Text>
        </YStack>
        <XStack gap="$2">
          <XStack
            backgroundColor="#8b5cf6"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            alignItems="center"
            gap="$1"
          >
            <Coins size={14} color="white" />
            <Text fontSize="$2" color="white" fontWeight="500">
              {group.coins}
            </Text>
          </XStack>
        </XStack>
      </XStack>

      <Button
        variant="secondary"
        size="md"
        leftIcon={<Edit size={16} />}
        onPress={() => onEdit(group.id)}
        accessibilityLabel={`Edit ${group.name}`}
      >
        Edit Group
      </Button>
    </YStack>
  )
}

/**
 * GroupCardSkeleton - Loading placeholder for group cards
 *
 * Displays a skeleton loading state while group data is loading.
 *
 * @example
 * ```tsx
 * <GroupCardSkeleton />
 * ```
 */
export function GroupCardSkeleton() {
  return (
    <YStack
      backgroundColor="$backgroundHover"
      borderRadius="$4"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1} gap="$1">
          <YStack
            height={24}
            width={150}
            backgroundColor="$background"
            borderRadius="$2"
          />
          <YStack
            height={16}
            width={100}
            backgroundColor="$background"
            borderRadius="$2"
          />
        </YStack>
        <YStack
          height={28}
          width={60}
          backgroundColor="$background"
          borderRadius="$2"
        />
      </XStack>

      <YStack
        height={40}
        backgroundColor="$background"
        borderRadius="$3"
      />
    </YStack>
  )
}
