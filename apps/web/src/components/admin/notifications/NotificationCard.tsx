/**
 * NotificationCard Component
 *
 * Displays a single notification in a card format with actions.
 * Used in the notifications list page.
 *
 * @module @/components/admin/notifications/NotificationCard
 */

'use client'

import { useCallback } from 'react'
import { Card, XStack, YStack, Text, Button } from '@mirai-app/ui'
import { Bell, Trash2, ExternalLink } from '@/components/ui/Icon'
import type { Notification } from './types'

interface NotificationCardProps {
  /** Notification data to display */
  notification: Notification
  /** Callback when delete button is clicked */
  onDelete: (notification: Notification) => void
  /** Whether the card is in a loading state */
  loading?: boolean
}

/**
 * NotificationCard - Displays a notification with title, body, and actions
 *
 * @example
 * ```tsx
 * <NotificationCard
 *   notification={notification}
 *   onDelete={(n) => confirmDelete(n)}
 * />
 * ```
 */
export function NotificationCard({ notification, onDelete, loading }: NotificationCardProps) {
  const handleDelete = useCallback(() => {
    if (!loading) {
      onDelete(notification)
    }
  }, [onDelete, notification, loading])

  const handleOpenUrl = useCallback(() => {
    if (notification.url) {
      window.open(notification.url, '_blank', 'noopener,noreferrer')
    }
  }, [notification.url])

  // Format the created date
  const formattedDate = new Date(notification.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Card
      padding="$4"
      opacity={loading ? 0.6 : 1}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack alignItems="flex-start" gap="$4">
        {/* Icon */}
        <YStack
          width={48}
          height={48}
          borderRadius={24}
          backgroundColor="rgba(59, 130, 246, 0.1)"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Bell size={24} color="#3b82f6" />
        </YStack>

        {/* Notification info */}
        <YStack flex={1} gap="$2">
          <YStack gap="$1">
            <Text fontSize="$4" fontWeight="600" color="$color">
              {notification.title}
            </Text>
            <Text fontSize="$3" color="$colorMuted">
              {formattedDate}
            </Text>
          </YStack>

          <Text fontSize="$3" color="$color" lineHeight="$3">
            {notification.body}
          </Text>

          {/* URL link if present */}
          {notification.url && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleOpenUrl}
              alignSelf="flex-start"
              paddingHorizontal="$0"
            >
              <XStack alignItems="center" gap="$1">
                <Text fontSize="$3" color="#3b82f6">
                  Open Link
                </Text>
                <ExternalLink size={14} color="#3b82f6" />
              </XStack>
            </Button>
          )}
        </YStack>

        {/* Action button */}
        <Button
          variant="ghost"
          size="md"
          onPress={handleDelete}
          accessibilityLabel={`Delete notification ${notification.title}`}
          disabled={loading}
        >
          <Trash2 size={18} color="#ef4444" />
        </Button>
      </XStack>
    </Card>
  )
}

/**
 * NotificationCardSkeleton - Loading placeholder for NotificationCard
 *
 * Shows a skeleton UI while notification data is loading.
 */
export function NotificationCardSkeleton() {
  return (
    <Card padding="$4">
      <XStack alignItems="flex-start" gap="$4">
        {/* Icon skeleton */}
        <YStack
          width={48}
          height={48}
          borderRadius={24}
          backgroundColor="rgba(59, 130, 246, 0.1)"
        />

        {/* Info skeleton */}
        <YStack flex={1} gap="$2">
          <YStack gap="$1">
            <YStack
              height={20}
              width={200}
              backgroundColor="rgba(59, 130, 246, 0.1)"
              borderRadius={4}
            />
            <YStack
              height={14}
              width={100}
              backgroundColor="rgba(59, 130, 246, 0.1)"
              borderRadius={4}
            />
          </YStack>

          <YStack
            height={40}
            width="100%"
            backgroundColor="rgba(59, 130, 246, 0.1)"
            borderRadius={4}
          />
        </YStack>

        {/* Button skeleton */}
        <YStack
          width={36}
          height={36}
          backgroundColor="rgba(59, 130, 246, 0.1)"
          borderRadius={8}
        />
      </XStack>
    </Card>
  )
}
