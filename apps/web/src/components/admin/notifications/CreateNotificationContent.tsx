/**
 * CreateNotificationContent Component
 *
 * Page wrapper for creating a new notification.
 * Provides the layout and handles the create mutation with target selection.
 *
 * @module @/components/admin/notifications/CreateNotificationContent
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import { YStack, Text, Button, XStack } from '@mirai-app/ui'
import { ChevronLeft } from '@/components/ui/Icon'
import { toast } from 'react-hot-toast'
import { useCreateNotificationMutation } from './hooks'
import { CreateNotificationForm } from './CreateNotificationForm'
import type { CreateNotificationInput } from './types'

// Target data types
interface TargetUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface TargetGroup {
  id: string
  name: string
  memberCount: number
}

/**
 * CreateNotificationContent - Page content for creating a new notification
 *
 * Features:
 * - Displays create notification form with target selection
 * - Fetches available users and groups for targeting
 * - Handles create mutation with trip context
 * - Shows success/error feedback via toast
 * - Navigation back to notifications list
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'notifications-new': () => import('../admin/notifications/CreateNotificationContent'),
 * ```
 */
export function CreateNotificationContent() {
  const { selectedTrip } = useTripContext()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [targetUsers, setTargetUsers] = useState<TargetUser[]>([])
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([])
  const [targetsLoading, setTargetsLoading] = useState(true)

  const {
    createNotification,
    loading,
    error: mutationError,
  } = useCreateNotificationMutation()

  // Fetch target users and groups when trip is selected
  useEffect(() => {
    if (!selectedTrip) {
      setTargetsLoading(false)
      return
    }

    const fetchTargets = async () => {
      setTargetsLoading(true)
      try {
        const tripId = TripId.toString(selectedTrip.id)

        // Fetch users for the trip
        const usersResponse = await fetch(`/api/trips/${tripId}/users`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setTargetUsers(usersData.users || [])
        }

        // Fetch groups for the trip
        const groupsResponse = await fetch(`/api/trips/${tripId}/groups`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json()
          setTargetGroups(groupsData.groups || [])
        }
      } catch (err) {
        // Silently fail - targets are optional
        console.error('Failed to fetch targets:', err)
      } finally {
        setTargetsLoading(false)
      }
    }

    fetchTargets()
  }, [selectedTrip])

  // Navigate back to notifications list
  const handleCancel = useCallback(() => {
    window.location.href = '/notifications'
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateNotificationInput) => {
      if (!selectedTrip) {
        setSubmitError('No trip selected. Please select a trip first.')
        return
      }

      setSubmitError(null)

      try {
        // Create notification with trip context
        await createNotification({
          ...data,
          tripId: TripId.toString(selectedTrip.id),
        })

        // Show success message
        toast.success('Notification sent successfully')

        // Navigate back to notifications list
        window.location.href = '/notifications'
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send notification'
        setSubmitError(message)
        toast.error(message)
      }
    },
    [selectedTrip, createNotification]
  )

  // Combine mutation error with submit error
  const error = submitError || (mutationError?.message ?? null)

  // Render no trip selected state
  if (!selectedTrip) {
    return (
      <YStack flex={1} gap="$4">
        <Button
          variant="ghost"
          size="md"
          onPress={handleCancel}
          alignSelf="flex-start"
        >
          <ChevronLeft size={18} />
          Back to Notifications
        </Button>

        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No trip selected
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Please select a trip from the header before sending a notification
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1} gap="$4">
      {/* Header */}
      <XStack alignItems="center" gap="$2">
        <Button
          variant="ghost"
          size="md"
          onPress={handleCancel}
        >
          <ChevronLeft size={18} />
        </Button>
        <YStack>
          <Text fontSize="$6" fontWeight="600">
            Send Notification
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            To {selectedTrip.name}
          </Text>
        </YStack>
      </XStack>

      {/* Form */}
      <CreateNotificationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
        targetUsers={targetUsers}
        targetGroups={targetGroups}
        targetsLoading={targetsLoading}
      />
    </YStack>
  )
}
