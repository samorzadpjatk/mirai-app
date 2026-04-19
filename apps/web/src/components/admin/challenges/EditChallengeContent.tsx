/**
 * EditChallengeContent Component
 *
 * Page wrapper for editing an existing challenge.
 * Fetches challenge data and wraps ChallengeForm with edit mode.
 *
 * @module @/components/admin/challenges/EditChallengeContent
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
import { useGetChallengeQuery, useUpdateChallengeMutation } from './hooks'
import type { CreateChallengeInput, UpdateChallengeInput } from './types'
import { toast } from 'react-hot-toast'

// =============================================================================
// Component Props
// =============================================================================

export interface EditChallengeContentProps {
  /** Challenge ID to edit */
  challengeId: string
}

/**
 * EditChallengeContent - Page content for editing a challenge
 *
 * Fetches challenge data and provides a form for editing with validation.
 */
export function EditChallengeContent({ challengeId }: EditChallengeContentProps) {
  const { selectedTrip } = useTripContext()
  const [error, setError] = useState<string | null>(null)

  // Fetch challenge data
  const {
    challenge,
    loading: challengeLoading,
    error: challengeError,
  } = useGetChallengeQuery(challengeId)

  // Update mutation
  const {
    updateChallenge,
    loading: updateLoading,
    error: updateError,
  } = useUpdateChallengeMutation()

  const handleCancel = useCallback(() => {
    window.location.href = '/challenges'
  }, [])

  const handleSubmit = useCallback(
    async (data: CreateChallengeInput | UpdateChallengeInput) => {
      setError(null)

      try {
        await updateChallenge(challengeId, data as UpdateChallengeInput)
        toast.success('Challenge updated successfully')
        window.location.href = '/challenges'
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update challenge'
        setError(message)
        toast.error(message)
        throw err
      }
    },
    [challengeId, updateChallenge]
  )

  // Show loading while fetching challenge
  if (challengeLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <LoadingSpinner size="large" />
        <Text fontSize="$4" color="gray">
          Loading challenge...
        </Text>
      </YStack>
    )
  }

  // Show error if challenge fetch failed
  if (challengeError) {
    return (
      <YStack flex={1}>
        <ErrorMessage
          title="Failed to load challenge"
          message={challengeError.message}
          onRetry={() => window.location.reload()}
        />
      </YStack>
    )
  }

  // Show error if challenge not found
  if (!challenge) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Text fontSize="$5" fontWeight="500" color="gray" textAlign="center">
          Challenge not found
        </Text>
        <Button variant="primary" onPress={handleCancel}>
          Back to Challenges
        </Button>
      </YStack>
    )
  }

  const tripId = selectedTrip ? TripId.toString(selectedTrip.id) : challenge.tripId

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
            Edit Challenge
          </Text>
        </XStack>
      </XStack>

      {/* Subtitle */}
      <Text fontSize="$3" color="gray" marginBottom="$4">
        Editing: {challenge.name}
      </Text>

      {/* Error display */}
      {(error || updateError) && (
        <YStack marginBottom="$4">
          <ErrorMessage
            title="Failed to update challenge"
            message={error || updateError?.message || 'An error occurred'}
          />
        </YStack>
      )}

      {/* Form */}
      <ChallengeForm
        challenge={challenge}
        tripId={tripId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={updateLoading}
        error={error || updateError?.message}
      />
    </YStack>
  )
}
