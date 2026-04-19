/**
 * ActivityCard Component
 *
 * Displays a single activity in a card format with actions.
 * Used in the schedule timeline view.
 *
 * @module @/components/admin/activity/ActivityCard
 */

'use client'

import { useCallback } from 'react'
import { Card, XStack, YStack, Text, Button } from '@mirai-app/ui'
import { Edit, Trash2, Clock, MapPin } from '@/components/ui/Icon'
import type { Activity } from './types'
import { getActivityTypeLabel, getActivityTypeColor, formatTime } from './types'

interface ActivityCardProps {
  /** Activity data to display */
  activity: Activity
  /** Callback when edit button is clicked */
  onEdit: (activity: Activity) => void
  /** Callback when delete button is clicked */
  onDelete: (activity: Activity) => void
  /** Whether the card is in a loading state */
  loading?: boolean
}

/**
 * ActivityCard - Displays an activity with time, type, and action buttons
 *
 * @example
 * ```tsx
 * <ActivityCard
 *   activity={activity}
 *   onEdit={(a) => navigateToEdit(a.id)}
 *   onDelete={(a) => confirmDelete(a)}
 * />
 * ```
 */
export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  loading,
}: ActivityCardProps) {
  const handleEdit = useCallback(() => {
    if (!loading) {
      onEdit(activity)
    }
  }, [onEdit, activity, loading])

  const handleDelete = useCallback(() => {
    if (!loading) {
      onDelete(activity)
    }
  }, [onDelete, activity, loading])

  const typeLabel = getActivityTypeLabel(activity.type)
  const typeColor = getActivityTypeColor(activity.type)
  const startTime = formatTime(activity.startTime)
  const endTime = activity.endTime ? formatTime(activity.endTime) : null

  return (
    <Card
      padding="$4"
      opacity={loading ? 0.6 : 1}
      pressStyle={{ scale: 0.98 }}
    >
      <XStack alignItems="flex-start" gap="$3">
        {/* Time column */}
        <YStack width={80} alignItems="center" justifyContent="center">
          <YStack
            padding="$2"
            backgroundColor="$backgroundHover"
            borderRadius="$2"
            alignItems="center"
          >
            <Clock size={14} color="$colorMuted" />
            <Text fontSize="$3" fontWeight="600" color="$color">
              {startTime}
            </Text>
            {endTime && (
              <Text fontSize="$2" color="$colorMuted">
                - {endTime}
              </Text>
            )}
          </YStack>
        </YStack>

        {/* Activity content */}
        <YStack flex={1} gap="$1">
          {/* Type badge */}
          <XStack alignItems="center" gap="$2">
            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor="gray"
              borderRadius="$1"
              style={{ backgroundColor: typeColor }}
            >
              <Text fontSize="$2" fontWeight="500" color="white">
                {typeLabel}
              </Text>
            </YStack>
            {!activity.isVisible && (
              <YStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                backgroundColor="gray"
                borderRadius="$1"
              >
                <Text fontSize="$2" color="white">
                  Hidden
                </Text>
              </YStack>
            )}
          </XStack>

          {/* Title */}
          <Text fontSize="$4" fontWeight="600" color="$color">
            {activity.title}
          </Text>

          {/* Description */}
          {activity.description && (
            <Text
              fontSize="$3"
              color="$colorMuted"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {activity.description}
            </Text>
          )}

          {/* Location */}
          {activity.location && (
            <XStack alignItems="center" gap="$1" marginTop="$1">
              <MapPin size={14} color="gray" />
              <Text fontSize="$2" color="$colorMuted">
                {activity.location}
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Action buttons */}
        <XStack gap="$2">
          <Button
            variant="ghost"
            size="md"
            onPress={handleEdit}
            accessibilityLabel={`Edit ${activity.title}`}
            disabled={loading}
          >
            <Edit size={18} />
          </Button>
          <Button
            variant="ghost"
            size="md"
            onPress={handleDelete}
            accessibilityLabel={`Delete ${activity.title}`}
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
 * ActivityCardSkeleton - Loading placeholder for ActivityCard
 *
 * Shows a skeleton UI while activity data is loading.
 */
export function ActivityCardSkeleton() {
  return (
    <Card padding="$4">
      <XStack alignItems="flex-start" gap="$3">
        {/* Time skeleton */}
        <YStack width={80} alignItems="center">
          <YStack
            width={60}
            height={40}
            backgroundColor="$backgroundHover"
            borderRadius="$2"
          />
        </YStack>

        {/* Content skeleton */}
        <YStack flex={1} gap="$2">
          <YStack
            height={20}
            width={80}
            backgroundColor="$backgroundHover"
            borderRadius="$1"
          />
          <YStack
            height={22}
            width={200}
            backgroundColor="$backgroundHover"
            borderRadius="$1"
          />
          <YStack
            height={16}
            width={150}
            backgroundColor="$backgroundHover"
            borderRadius="$1"
          />
        </YStack>

        {/* Buttons skeleton */}
        <XStack gap="$2">
          <YStack
            width={36}
            height={36}
            backgroundColor="$backgroundHover"
            borderRadius="$2"
          />
          <YStack
            width={36}
            height={36}
            backgroundColor="$backgroundHover"
            borderRadius="$2"
          />
        </XStack>
      </XStack>
    </Card>
  )
}
