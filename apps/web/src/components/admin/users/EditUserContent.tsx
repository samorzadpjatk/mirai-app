/**
 * EditUserContent Component
 *
 * Page wrapper for editing an existing user.
 * Fetches user data and provides the edit form.
 *
 * @module @/components/admin/users/EditUserContent
 */

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { YStack, Text, Button, XStack } from '@mirai-app/ui'
import { ChevronLeft, AlertCircle } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import { useUpdateUserMutation, useGetUserQuery } from './hooks'
import { EditUserForm } from './EditUserForm'
import type { User, CreateUserInput } from './types'

interface EditUserContentProps {
  /** User ID from URL params (passed via pageProps) */
  userId?: string
}

/**
 * EditUserContent - Page content for editing an existing user
 *
 * Features:
 * - Fetches user data on load
 * - Displays edit form with pre-filled data
 * - Handles update mutation
 * - Shows success/error feedback via toast
 * - Navigation back to users list
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'users-edit': () => import('../admin/users/EditUserContent'),
 * ```
 *
 * @example
 * ```astro
 * // In users/[id]/edit.astro
 * <AdminLayout title="Edit User" page="users-edit" pageProps={{ userId: id }} />
 * ```
 */
export function EditUserContent({ userId }: EditUserContentProps) {
  const { selectedTrip } = useTripContext()
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Extract user ID from URL if not passed as prop
  // URL pattern: /users/[id]/edit
  const effectiveUserId = userId ?? (() => {
    if (typeof window === 'undefined') return null
    const match = window.location.pathname.match(/\/users\/([^/]+)\/edit/)
    return match?.[1] ?? null
  })()

  // Fetch user data
  const {
    user,
    loading: userLoading,
    error: userError,
  } = useGetUserQuery(effectiveUserId)

  // Update mutation
  const {
    updateUser,
    loading: updateLoading,
    error: updateError,
  } = useUpdateUserMutation()

  // Navigate back to users list
  const handleCancel = useCallback(() => {
    window.location.href = '/users'
  }, [])

  // Handle form submission
  const handleSubmit = useCallback(
    async (id: string, data: Omit<CreateUserInput, 'tripId'>) => {
      if (!selectedTrip) {
        setSubmitError('No trip selected. Please select a trip first.')
        return
      }

      setSubmitError(null)

      try {
        // Update user
        await updateUser(id, data)

        // Show success message
        const fullName = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
        toast.success(`User ${fullName || 'updated'} successfully`)

        // Navigate back to users list
        // The cache will be automatically updated by the mutation updater
        window.location.href = '/users'
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update user'
        setSubmitError(message)
        toast.error(message)
      }
    },
    [selectedTrip, updateUser]
  )

  // Combine errors
  const error = submitError || (updateError?.message ?? null)

  // Render loading state
  if (userLoading) {
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
        <LoadingSpinner centered label="Loading user..." />
      </YStack>
    )
  }

  // Render error state
  if (userError) {
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
        <ErrorMessage
          title="Failed to load user"
          message={userError.message}
          onRetry={() => window.location.reload()}
        />
      </YStack>
    )
  }

  // Render user not found state
  if (!user) {
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
          <AlertCircle size={48} color="#9ca3af" />
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            User not found
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            The user you're looking for doesn't exist or has been deleted
          </Text>
          <Button variant="primary" size="lg" onPress={handleCancel} marginTop="$4">
            Back to Users
          </Button>
        </YStack>
      </YStack>
    )
  }

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
            Please select a trip from the header before editing a user
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
            Edit User
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {selectedTrip.name}
          </Text>
        </YStack>
      </XStack>

      {/* Form */}
      <EditUserForm
        user={user}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={updateLoading}
        error={error}
      />
    </YStack>
  )
}
