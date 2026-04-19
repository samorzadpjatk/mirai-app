/**
 * UserCard Component
 *
 * Displays a single user in a card format with actions.
 * Used in the users list page.
 *
 * @module @/components/admin/users/UserCard
 */

'use client'

import { useCallback } from 'react'
import { Card, XStack, YStack, Text, Button } from '@mirai-app/ui'
import { Edit, Trash2 } from '@/components/ui/Icon'
import type { User as UserType } from './types'

interface UserCardProps {
  /** User data to display */
  user: UserType
  /** Callback when edit button is clicked */
  onEdit: (user: UserType) => void
  /** Callback when delete button is clicked */
  onDelete: (user: UserType) => void
  /** Whether the card is in a loading state */
  loading?: boolean
}

/**
 * UserCard - Displays a user with name, email, and action buttons
 *
 * @example
 * ```tsx
 * <UserCard
 *   user={user}
 *   onEdit={(u) => navigateToEdit(u.id)}
 *   onDelete={(u) => confirmDelete(u)}
 * />
 * ```
 */
export function UserCard({ user, onEdit, onDelete, loading }: UserCardProps) {
  const handleEdit = useCallback(() => {
    if (!loading) {
      onEdit(user)
    }
  }, [onEdit, user, loading])

  const handleDelete = useCallback(() => {
    if (!loading) {
      onDelete(user)
    }
  }, [onDelete, user, loading])

  // Get initials for avatar
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  return (
    <Card
      padding="$4"
      opacity={loading ? 0.6 : 1}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack alignItems="center" gap="$4">
        {/* Avatar placeholder */}
        <YStack
          width={48}
          height={48}
          borderRadius={24}
          backgroundColor="$backgroundHover"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$5" fontWeight="600" color="$colorMuted">
            {initials}
          </Text>
        </YStack>

        {/* User info */}
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {user.firstName} {user.lastName}
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {user.email}
          </Text>
        </YStack>

        {/* Action buttons */}
        <XStack gap="$2">
          <Button
            variant="ghost"
            size="md"
            onPress={handleEdit}
            accessibilityLabel={`Edit ${user.firstName} ${user.lastName}`}
            disabled={loading}
          >
            <Edit size={18} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onPress={handleDelete}
            accessibilityLabel={`Delete ${user.firstName} ${user.lastName}`}
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
 * UserCardSkeleton - Loading placeholder for UserCard
 *
 * Shows a skeleton UI while user data is loading.
 */
export function UserCardSkeleton() {
  return (
    <Card padding="$4">
      <XStack alignItems="center" gap="$4">
        {/* Avatar skeleton */}
        <YStack
          width={48}
          height={48}
          borderRadius={24}
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
