/**
 * CreateUserContent Component
 *
 * Page wrapper for creating a new user.
 * Provides the layout and handles the create mutation.
 *
 * @module @/components/admin/users/CreateUserContent
 */

'use client'

import { useCallback, useState } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { YStack, Text, Button, XStack } from '@mirai-app/ui'
import { ChevronLeft } from '@/components/ui/Icon'
import { toast } from 'react-hot-toast'
import { useCreateUserMutation } from './hooks'
import { CreateUserForm } from './CreateUserForm'
import type { CreateUserInput } from './types'

/**
 * CreateUserContent - Page content for creating a new user
 *
 * Features:
 * - Displays create user form
 * - Handles create mutation with trip context
 * - Shows success/error feedback via toast
 * - Navigation back to users list
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'users-new': () => import('../admin/users/CreateUserContent'),
 * ```
 */
export function CreateUserContent() {
  const { selectedTrip } = useTripContext()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    createUser,
    loading,
    error: mutationError,
  } = useCreateUserMutation()

  // Navigate back to users list
  const handleCancel = useCallback(() => {
    window.location.href = '/users'
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateUserInput) => {
      if (!selectedTrip) {
        setSubmitError('No trip selected. Please select a trip first.')
        return
      }

      setSubmitError(null)

      try {
        // Create user (trip context handled by backend from auth token)
        await createUser(data)

        // Show success message
        toast.success(`User ${data.firstName} ${data.lastName} created successfully`)

        // Navigate back to users list
        // The cache will be automatically updated by the mutation updater
        window.location.href = '/users'
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create user'
        setSubmitError(message)
        toast.error(message)
      }
    },
    [selectedTrip, createUser]
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
          Back to Users
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
            Please select a trip from the header before creating a user
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
            Create User
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            Adding to {selectedTrip.name}
          </Text>
        </YStack>
      </XStack>

      {/* Form */}
      <CreateUserForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
      />
    </YStack>
  )
}
