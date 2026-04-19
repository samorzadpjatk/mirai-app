/**
 * CreateChallengeContent Component
 *
 * Page wrapper for creating a new challenge.
 * Wraps ChallengeForm with trip context and navigation.
 *
 * @module @/components/admin/challenges/CreateChallengeContent
 */

'use client'

import { useCallback, useState } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
} from '@mirai-app/ui'
import { ArrowLeft } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ChallengeForm } from './ChallengeForm'
import { useCreateChallengeMutation } from './hooks'
import type { CreateChallengeInput, UpdateChallengeInput } from './types'
import { toast } from 'react-hot-toast'

/**
 * CreateChallengeContent - Page content for creating a new challenge
 *
 * Provides a form for creating challenges with the selected trip context.
 */
export function CreateChallengeContent() {
  const { selectedTrip } = useTripContext()
  const [error, setError] = useState<string | null>(null)

  const {
    createChallenge,
    loading,
    error: mutationError,
  } = useCreateChallengeMutation()

  const handleCancel = useCallback(() => {
    window.location.href = '/challenges'
  }, [])

  const handleSubmit = useCallback(
    async (data: CreateChallengeInput | UpdateChallengeInput) => {
      setError(null)

      try {
        const challenge = await createChallenge(data as CreateChallengeInput)
        toast.success(`Challenge "${challenge.name}" created successfully`)
        window.location.href = '/challenges'
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create challenge'
        setError(message)
        toast.error(message)
        throw err
      }
    },
    [createChallenge]
  )

  // Show loading if trip context not ready
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <LoadingSpinner size="large" />
        <Text fontSize="$4" color="gray">
          Loading trip context...
        </Text>
      </YStack>
    )
  }

  const tripId = TripId.toString(selectedTrip.id)

  return (
    <YStack flex={1}>
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        marginBottom="$4"
        flexWrap="wrap"
        gap="$2"
      >
        <XStack alignItems="center" gap="$2">
          <Button
            variant="ghost"
            size="sm"
            onPress={handleCancel}
          >
            <ArrowLeft size={20} />
          </Button>
          <Text fontSize="$6" fontWeight="600">
            Create Challenge
          </Text>
        </XStack>
      </XStack>

      {/* Subtitle */}
      <Text fontSize="$3" color="gray" marginBottom="$4">
        Creating challenge for {selectedTrip.name}
      </Text>

      {/* Error display */}
      {error && (
        <YStack marginBottom="$4">
          <ErrorMessage
            title="Failed to create challenge"
            message={error}
          />
        </YStack>
      )}

      {/* Form */}
      <ChallengeForm
        tripId={tripId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={mutationError?.message}
      />
    </YStack>
  )
}
