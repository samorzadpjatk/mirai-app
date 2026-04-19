/**
 * CreateUserForm Component
 *
 * Form for creating a new user with validation.
 * Uses react-hook-form with Zod schema validation.
 *
 * @module @/components/admin/users/CreateUserForm
 */

'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input } from '@mirai-app/ui'
import { createUserSchema, type CreateUserSchema } from './types'
import type { CreateUserInput } from './types'

interface CreateUserFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: CreateUserInput) => Promise<void>
  /** Callback when cancel button is clicked */
  onCancel: () => void
  /** Whether the form is currently submitting */
  loading?: boolean
  /** Optional error message to display */
  error?: string | null
}

/**
 * CreateUserForm - Form for creating a new user
 *
 * Features:
 * - First name, last name, and email fields
 * - Zod validation with react-hook-form
 * - Loading state handling
 * - Error display
 * - Cancel button
 *
 * @example
 * ```tsx
 * <CreateUserForm
 *   onSubmit={async (data) => {
 *     await createUser(data);
 *     navigate('/users');
 *   }}
 *   onCancel={() => navigate('/users')}
 *   loading={isCreating}
 *   error={createError?.message}
 * />
 * ```
 */
export function CreateUserForm({
  onSubmit,
  onCancel,
  loading,
  error,
}: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<CreateUserSchema>({
    resolver: zodResolver(createUserSchema),
    mode: 'onBlur', // Validate on blur for immediate feedback
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    },
  })

  const handleFormSubmit = useCallback(
    async (data: CreateUserSchema) => {
      await onSubmit({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
      })
    },
    [onSubmit]
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel()
  }, [reset, onCancel])

  const isSubmitDisabled = !isValid || !isDirty || loading

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <YStack gap="$4" maxWidth={500}>
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
            Create User
          </Button>
        </XStack>
      </YStack>
    </form>
  )
}
