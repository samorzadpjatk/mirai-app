/**
 * CreateActivityContent Component
 *
 * Page wrapper for creating a new schedule activity.
 * Handles form submission and navigation.
 *
 * @module @/components/admin/activity/CreateActivityContent
 */

'use client'

import { useCallback } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import { YStack, Text } from '@mirai-app/ui'
import { toast } from 'react-hot-toast'
import { CreateActivityForm } from './CreateActivityForm'
import { useCreateActivityMutation } from './hooks'
import type { CreateActivityInput } from './types'

/**
 * CreateActivityContent - Page content for creating a new activity
 *
 * Wraps the CreateActivityForm with page-level logic including
 * trip context handling and navigation after successful creation.
 *
 * @example
 * ```tsx
 * // In a Next.js page
 * export default function CreateActivityPage() {
 *   return <CreateActivityContent />;
 * }
 * ```
 */
export function CreateActivityContent() {
  const { selectedTrip } = useTripContext()
  const { createActivity, loading, error } = useCreateActivityMutation()

  const handleSubmit = useCallback(
    async (input: CreateActivityInput) => {
      try {
        await createActivity(input)
        toast.success(`Activity "${input.title}" created successfully`)
        // Navigate back to schedules page
        window.location.href = '/schedules'
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create activity'
        toast.error(message)
        throw err // Re-throw so form knows submission failed
      }
    },
    [createActivity]
  )

  const handleCancel = useCallback(() => {
    window.location.href = '/schedules'
  }, [])

  // Require trip selection
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          Please select a trip from the header to create an activity
        </Text>
      </YStack>
    )
  }

  const tripId = TripId.toString(selectedTrip.id)

  return (
    <YStack flex={1} gap="$4">
      <Text fontSize="$6" fontWeight="600">
        Create Activity
      </Text>
      <Text fontSize="$3" color="$colorMuted" marginBottom="$4">
        Add a new activity to {selectedTrip.name}
      </Text>

      <CreateActivityForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error?.message}
        tripId={tripId}
      />
    </YStack>
  )
}
