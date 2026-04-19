/**
 * EditUserForm Component
 *
 * Form for editing an existing user with validation.
 * Uses react-hook-form with Zod schema validation.
 * Pre-fills form with existing user data.
 *
 * @module @/components/admin/users/EditUserForm
 */

'use client'

import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input } from '@mirai-app/ui'
import { updateUserSchema, type UpdateUserSchema } from './types'
import type { User, CreateUserInput } from './types'

interface EditUserFormProps {
  /** User data to edit */  user: User
  /** Callback when form is submitted successfully */
  onSubmit: (id: string, data: Omit<CreateUserInput, 'tripId'>) => Promise<void>
  /** Callback when cancel button is clicked */
  onCancel: () => void
  /** Whether the form is currently submitting */
  loading?: boolean
  /** Optional error message to display */
  error?: string | null
}

/**
 * EditUserForm - Form for editing an existing user
 *
 * Features:
 * - Pre-fills with existing user data
 * - All fields optional (only changed fields are submitted)
 * - Zod validation with react-hook-form
 * - Loading state handling
 * - Error display
 * - Cancel button
 *
 * @example
 * ```tsx
 * <EditUserForm
 *   user={existingUser}
 *   onSubmit={async (id, data) => {
 *     await updateUser(id, data);
 *     navigate('/users');
 *   }}
 *   onCancel={() => navigate('/users')}
 *   loading={isUpdating}
 *   error={updateError?.message}
 * />
 * ```
 */
export function EditUserForm({
  user,
  onSubmit,
  onCancel,
  loading,
  error,
}: EditUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
  } = useForm<UpdateUserSchema>({
    resolver: zodResolver(updateUserSchema),
    mode: 'onBlur',
    defaultValues: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  })

  // Watch form values to detect changes
  const watchedValues = watch()

  // Check if any field has actually changed
  const hasChanges =
    (watchedValues.firstName?.trim() !== user.firstName) ||
    (watchedValues.lastName?.trim() !== user.lastName) ||
    (watchedValues.email?.trim().toLowerCase() !== user.email.toLowerCase())

  // Reset form when user prop changes (e.g., if data is refreshed)
  useEffect(() => {
    reset({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    })
  }, [user, reset])

  const handleFormSubmit = useCallback(
    async (data: UpdateUserSchema) => {
      // Build update data with changed fields
      const updateData: Omit<CreateUserInput, 'tripId'> = {
        firstName: data.firstName?.trim() ?? user.firstName,
        lastName: data.lastName?.trim() ?? user.lastName,
        email: data.email?.trim().toLowerCase() ?? user.email,
      }

      await onSubmit(user.id, updateData)
    },
    [onSubmit, user.id, user.firstName, user.lastName, user.email]
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel()
  }, [reset, onCancel])

  const isSubmitDisabled = !hasChanges || !isValid || loading

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <YStack gap="$4" maxWidth={500}>
        {/* Header with user info */}
        <YStack gap="$1" marginBottom="$2">
          <Text fontSize="$5" fontWeight="600" color="$color">
            Edit User
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            Editing: {user.firstName} {user.lastName}
          </Text>
        </YStack>

        {/* Error message */}
        {error && (
          <YStack
            padding="$3"
            backgroundColor="rgba(239, 68, 68, 0.1)"
            borderRadius="$2"
            borderWidth={1}
            borderColor="#ef4444"
          >
            <Text color="#ef4444" fontSize="$3">
              {error}
            </Text>
          </YStack>
        )}

        {/* First name field */}
        <YStack gap="$2">
          <Input
            label="First Name"
            placeholder="Enter first name"
            {...register('firstName')}
            error={errors.firstName?.message}
            disabled={loading}
            autoComplete="given-name"
          />
        </YStack>

        {/* Last name field */}
        <YStack gap="$2">
          <Input
            label="Last Name"
            placeholder="Enter last name"
            {...register('lastName')}
            error={errors.lastName?.message}
            disabled={loading}
            autoComplete="family-name"
          />
        </YStack>

        {/* Email field */}
        <YStack gap="$2">
          <Input
            label="Email"
            placeholder="Enter email address"
            inputMode="email"
            {...register('email')}
            error={errors.email?.message}
            disabled={loading}
            autoComplete="email"
          />
        </YStack>

        {/* Action buttons */}
        <XStack gap="$3" marginTop="$4">
          <Button
            variant="secondary"
            size="lg"
            onPress={handleCancel}
            disabled={loading}
            flex={1}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit(handleFormSubmit)}
            disabled={isSubmitDisabled}
            isLoading={loading}
            flex={1}
          >
            Save Changes
          </Button>
        </XStack>
      </YStack>
    </form>
  )
}
