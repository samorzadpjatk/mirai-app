/**
 * ChallengeForm Component
 *
 * Form for creating and editing challenges with complex validation.
 * Handles all challenge types, scoring categories, and conditional fields.
 *
 * Features:
 * - Dynamic field visibility based on submission type and scoring category
 * - Image upload for challenge cover
 * - Recurring challenge configuration
 * - Peer voting time window settings
 * - Location coordinates for location-based challenges
 * - QR code expected value for QR challenges
 * - Text expected phrase for auto-approve text challenges
 *
 * @module @/components/admin/challenges/ChallengeForm
 */

'use client'

import { useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Select,
  TextArea,
  Card,
} from '@mirai-app/ui'
import { FileUpload } from '@/components/FileUpload'
import { challengeFormSchema, type ChallengeFormSchema } from '@/lib/validators'
import type {
  Challenge,
  CreateChallengeInput,
  UpdateChallengeInput,
  ChallengeSubmissionType,
  ChallengeScoringCategory,
  ChallengeStatus,
} from './types'

// Simple label component since Label isn't in UI lib
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: '#374151',
        marginBottom: 4,
        display: 'block',
      }}
    >
      {children}
    </label>
  )
}

// Simple switch component since Switch isn't in UI lib
function Switch({ checked, onCheckedChange, disabled }: { checked: boolean; onCheckedChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: checked ? '#3b82f6' : '#d1d5db',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: 'none',
        padding: 2,
        transition: 'background-color 0.2s',
      }}
    >
      <span
        style={{
          display: 'block',
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'white',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  )
}

// =============================================================================
// Component Props
// =============================================================================

export interface ChallengeFormProps {
  /** Challenge to edit (undefined for create mode) */
  challenge?: Challenge
  /** Trip ID for the challenge */
  tripId: string
  /** Called when form is submitted successfully */
  onSubmit: (data: CreateChallengeInput | UpdateChallengeInput) => Promise<void> | void
  /** Called when cancel button is clicked */
  onCancel: () => void
  /** Whether form is currently submitting */
  loading?: boolean
  /** Form error message */
  error?: string | null
}

// =============================================================================
// Constants
// =============================================================================

const SUBMISSION_TYPES: { value: ChallengeSubmissionType; label: string }[] = [
  { value: 'IMAGE', label: 'Single Image' },
  { value: 'MULTI_IMAGE', label: 'Multiple Images' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'TEXT', label: 'Text' },
  { value: 'IMAGE_LOCATION', label: 'Image + Location' },
  { value: 'LOCATION', label: 'Location Only' },
  { value: 'QR_CODE', label: 'QR Code Scan' },
]

const SCORING_CATEGORIES: { value: ChallengeScoringCategory; label: string }[] = [
  { value: 'SPEED', label: 'Speed (First to Complete)' },
  { value: 'UNLIMITED', label: 'Unlimited (All Complete)' },
  { value: 'JUDGED_STAFF', label: 'Staff Judged' },
  { value: 'PEER_VOTING', label: 'Peer Voting' },
]

const INITIAL_STATUSES: { value: 'HIDDEN' | 'VISIBLE'; label: string }[] = [
  { value: 'HIDDEN', label: 'Hidden' },
  { value: 'VISIBLE', label: 'Visible' },
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get default values for the form
 */
function getDefaultValues(challenge?: Challenge): ChallengeFormSchema {
  if (!challenge) {
    return {
      name: '',
      description: '',
      image: '',
      submissionType: 'IMAGE',
      scoringCategory: 'SPEED',
      basePoints: 100,
      isRecurring: false,
      status: 'HIDDEN',
      autoApprove: false,
    }
  }

  return {
    name: challenge.name,
    description: challenge.description ?? '',
    image: challenge.image ?? '',
    submissionType: challenge.submissionType,
    scoringCategory: challenge.scoringCategory,
    basePoints: challenge.basePoints,
    firstPlacePoints: challenge.firstPlacePoints,
    secondPlacePoints: challenge.secondPlacePoints,
    thirdPlacePoints: challenge.thirdPlacePoints,
    isRecurring: challenge.isRecurring,
    recurringDays: challenge.recurringDays,
    dailyStartTime: challenge.dailyStartTime,
    dailyEndTime: challenge.dailyEndTime,
    status: challenge.status === 'HIDDEN' || challenge.status === 'VISIBLE' ? challenge.status : 'HIDDEN',
    startTime: challenge.startTime,
    endTime: challenge.endTime,
    votingDurationHours: challenge.votingDurationHours,
    votingStartTime: challenge.votingStartTime,
    votingEndTime: challenge.votingEndTime,
    targetLatitude: challenge.targetLatitude,
    targetLongitude: challenge.targetLongitude,
    qrCodeValue: challenge.qrCodeValue,
    textExpectedPhrase: challenge.textExpectedPhrase,
    autoApprove: challenge.autoApprove,
  }
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * ChallengeForm - Form for creating and editing challenges
 *
 * Provides a comprehensive form with dynamic fields based on
 * submission type and scoring category selections.
 */
export function ChallengeForm({
  challenge,
  tripId,
  onSubmit,
  onCancel,
  loading = false,
  error,
}: ChallengeFormProps) {
  const isEditMode = !!challenge

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChallengeFormSchema>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: getDefaultValues(challenge),
  })

  // Watch values for conditional fields
  const submissionType = watch('submissionType')
  const scoringCategory = watch('scoringCategory')
  const isRecurring = watch('isRecurring')
  const autoApprove = watch('autoApprove')

  // Determine which conditional fields to show
  const showLocationFields = submissionType === 'LOCATION' || submissionType === 'IMAGE_LOCATION'
  const showQrCodeField = submissionType === 'QR_CODE'
  const showTextPhraseField = submissionType === 'TEXT' && autoApprove
  const showVotingFields = scoringCategory === 'PEER_VOTING'
  const showRecurringFields = isRecurring
  const showPointPlaceFields = scoringCategory === 'SPEED' || scoringCategory === 'JUDGED_STAFF'

  // Reset auto-approve when submission type changes to incompatible type
  useEffect(() => {
    if (submissionType === 'IMAGE_LOCATION' && autoApprove) {
      setValue('autoApprove', false)
    }
  }, [submissionType, autoApprove, setValue])

  const handleFormSubmit = useCallback(
    async (data: ChallengeFormSchema) => {
      const input: CreateChallengeInput | UpdateChallengeInput = {
        ...data,
        tripId,
        ...(isEditMode && { id: challenge.id }),
      }

      await onSubmit(input)
    },
    [challenge, tripId, isEditMode, onSubmit]
  )

  return (
    <Card padding="$4">
      <YStack gap="$4">
        {/* Error display */}
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

        {/* Name */}
        <YStack gap="$1">
          <Label htmlFor="name">Challenge Name *</Label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="name"
                placeholder="Enter challenge name"
                value={field.value}
                onChangeText={field.onChange}
                disabled={loading}
              />
            )}
          />
          {errors.name && (
            <Text fontSize="$2" color="#ef4444">
              {errors.name.message}
            </Text>
          )}
        </YStack>

        {/* Description */}
        <YStack gap="$1">
          <Label htmlFor="description">Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextArea
                id="description"
                placeholder="Enter challenge description"
                value={field.value}
                onChangeText={field.onChange}
                disabled={loading}
                rows={3}
              />
            )}
          />
          {errors.description && (
            <Text fontSize="$2" color="#ef4444">
              {errors.description.message}
            </Text>
          )}
        </YStack>

        {/* Image Upload */}
        <YStack gap="$1">
          <Label htmlFor="image">Challenge Image</Label>
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <FileUpload
                onUpload={(url) => field.onChange(url)}
                existingUrl={field.value}
                accept="image/jpeg,image/png,image/webp"
                maxSize={10 * 1024 * 1024} // 10MB
                showPreview
                disabled={loading}
              />
            )}
          />
          {errors.image && (
            <Text fontSize="$2" color="#ef4444">
              {errors.image.message}
            </Text>
          )}
        </YStack>

        {/* Submission Type */}
        <YStack gap="$1">
          <Label htmlFor="submissionType">Submission Type *</Label>
          <Controller
            name="submissionType"
            control={control}
            render={({ field }) => (
              <Select
                id="submissionType"
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                {SUBMISSION_TYPES.map((type, idx) => (
                  <Select.Item key={type.value} value={type.value} index={idx}>
                    {type.label}
                  </Select.Item>
                ))}
              </Select>
            )}
          />
          {errors.submissionType && (
            <Text fontSize="$2" color="#ef4444">
              {errors.submissionType.message}
            </Text>
          )}
        </YStack>

        {/* Scoring Category */}
        <YStack gap="$1">
          <Label htmlFor="scoringCategory">Scoring Category *</Label>
          <Controller
            name="scoringCategory"
            control={control}
            render={({ field }) => (
              <Select
                id="scoringCategory"
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                {SCORING_CATEGORIES.map((cat, idx) => (
                  <Select.Item key={cat.value} value={cat.value} index={idx}>
                    {cat.label}
                  </Select.Item>
                ))}
              </Select>
            )}
          />
          {errors.scoringCategory && (
            <Text fontSize="$2" color="#ef4444">
              {errors.scoringCategory.message}
            </Text>
          )}
        </YStack>

        {/* Points Configuration */}
        <Card padding="$3" backgroundColor="#f9fafb">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600">
              Points Configuration
            </Text>

            {/* Base Points */}
            <YStack gap="$1">
              <Label htmlFor="basePoints">Base Points</Label>
              <Controller
                name="basePoints"
                control={control}
                render={({ field }) => (
                  <Input
                    id="basePoints"
                    type="number"
                    placeholder="100"
                    value={String(field.value ?? 100)}
                    onChangeText={(value) => field.onChange(parseInt(value, 10) || 0)}
                    disabled={loading}
                  />
                )}
              />
            </YStack>

            {/* Place Points (for Speed and Judged categories) */}
            {showPointPlaceFields && (
              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Label htmlFor="firstPlacePoints">1st Place</Label>
                  <Controller
                    name="firstPlacePoints"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="firstPlacePoints"
                        type="number"
                        placeholder="300"
                        value={String(field.value ?? '')}
                        onChangeText={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Label htmlFor="secondPlacePoints">2nd Place</Label>
                  <Controller
                    name="secondPlacePoints"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="secondPlacePoints"
                        type="number"
                        placeholder="200"
                        value={String(field.value ?? '')}
                        onChangeText={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Label htmlFor="thirdPlacePoints">3rd Place</Label>
                  <Controller
                    name="thirdPlacePoints"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="thirdPlacePoints"
                        type="number"
                        placeholder="100"
                        value={String(field.value ?? '')}
                        onChangeText={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                </YStack>
              </XStack>
            )}
          </YStack>
        </Card>

        {/* Initial Status */}
        <YStack gap="$1">
          <Label htmlFor="status">Initial Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                id="status"
                value={field.value}
                onValueChange={(value) => field.onChange(value as ChallengeStatus)}
                disabled={loading}
              >
                {INITIAL_STATUSES.map((status, idx) => (
                  <Select.Item key={status.value} value={status.value} index={idx}>
                    {status.label}
                  </Select.Item>
                ))}
              </Select>
            )}
          />
        </YStack>

        {/* Time Window */}
        <Card padding="$3" backgroundColor="#f9fafb">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600">
              Challenge Time Window
            </Text>

            <XStack gap="$3">
              <YStack flex={1} gap="$1">
                <Label htmlFor="startTime">Start Time</Label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChangeText={(value) => field.onChange(value ? new Date(value) : undefined)}
                      disabled={loading}
                    />
                  )}
                />
              </YStack>
              <YStack flex={1} gap="$1">
                <Label htmlFor="endTime">End Time</Label>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                      onChangeText={(value) => field.onChange(value ? new Date(value) : undefined)}
                      disabled={loading}
                    />
                  )}
                />
              </YStack>
            </XStack>

            {errors.endTime && (
              <Text fontSize="$2" color="#ef4444">
                {errors.endTime.message}
              </Text>
            )}
          </YStack>
        </Card>

        {/* Peer Voting Configuration */}
        {showVotingFields && (
          <Card padding="$3" backgroundColor="#f3e8ff">
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="#7c3aed">
                Peer Voting Configuration
              </Text>

              <YStack gap="$1">
                <Label htmlFor="votingDurationHours">Voting Duration (hours)</Label>
                <Controller
                  name="votingDurationHours"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="votingDurationHours"
                      type="number"
                      placeholder="24"
                      value={String(field.value ?? '')}
                      onChangeText={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                      disabled={loading}
                    />
                  )}
                />
                <Text fontSize="$2" color="gray">
                  Duration from when challenge ends, or specify voting window below
                </Text>
              </YStack>

              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Label htmlFor="votingStartTime">Voting Start</Label>
                  <Controller
                    name="votingStartTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="votingStartTime"
                        type="datetime-local"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                        onChangeText={(value) => field.onChange(value ? new Date(value) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Label htmlFor="votingEndTime">Voting End</Label>
                  <Controller
                    name="votingEndTime"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="votingEndTime"
                        type="datetime-local"
                        value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                        onChangeText={(value) => field.onChange(value ? new Date(value) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                </YStack>
              </XStack>

              {errors.votingDurationHours && (
                <Text fontSize="$2" color="#ef4444">
                  {errors.votingDurationHours.message}
                </Text>
              )}
              {errors.votingEndTime && (
                <Text fontSize="$2" color="#ef4444">
                  {errors.votingEndTime.message}
                </Text>
              )}
            </YStack>
          </Card>
        )}

        {/* Recurring Configuration */}
        <Card padding="$3" backgroundColor="#f9fafb">
          <YStack gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize="$4" fontWeight="600">
                Recurring Challenge
              </Text>
              <Controller
                name="isRecurring"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                )}
              />
            </XStack>

            {showRecurringFields && (
              <YStack gap="$3">
                <YStack gap="$1">
                  <Label htmlFor="recurringDays">Number of Days</Label>
                  <Controller
                    name="recurringDays"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="recurringDays"
                        type="number"
                        placeholder="7"
                        min={1}
                        max={30}
                        value={String(field.value ?? '')}
                        onChangeText={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                  {errors.recurringDays && (
                    <Text fontSize="$2" color="#ef4444">
                      {errors.recurringDays.message}
                    </Text>
                  )}
                </YStack>

                <XStack gap="$3">
                  <YStack flex={1} gap="$1">
                    <Label htmlFor="dailyStartTime">Daily Start Time (HH:mm)</Label>
                    <Controller
                      name="dailyStartTime"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="dailyStartTime"
                          placeholder="09:00"
                          value={field.value ?? ''}
                          onChangeText={field.onChange}
                          disabled={loading}
                        />
                      )}
                    />
                    {errors.dailyStartTime && (
                      <Text fontSize="$2" color="#ef4444">
                        {errors.dailyStartTime.message}
                      </Text>
                    )}
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Label htmlFor="dailyEndTime">Daily End Time (HH:mm)</Label>
                    <Controller
                      name="dailyEndTime"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="dailyEndTime"
                          placeholder="18:00"
                          value={field.value ?? ''}
                          onChangeText={field.onChange}
                          disabled={loading}
                        />
                      )}
                    />
                    {errors.dailyEndTime && (
                      <Text fontSize="$2" color="#ef4444">
                        {errors.dailyEndTime.message}
                      </Text>
                    )}
                  </YStack>
                </XStack>
              </YStack>
            )}
          </YStack>
        </Card>

        {/* Location Fields */}
        {showLocationFields && (
          <Card padding="$3" backgroundColor="#eff6ff">
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="#2563eb">
                Target Location
              </Text>

              <XStack gap="$3">
                <YStack flex={1} gap="$1">
                  <Label htmlFor="targetLatitude">Latitude</Label>
                  <Controller
                    name="targetLatitude"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="targetLatitude"
                        type="number"
                        step="any"
                        placeholder="52.5200"
                        value={String(field.value ?? '')}
                        onChangeText={(value) => field.onChange(value ? parseFloat(value) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                  {errors.targetLatitude && (
                    <Text fontSize="$2" color="#ef4444">
                      {errors.targetLatitude.message}
                    </Text>
                  )}
                </YStack>
                <YStack flex={1} gap="$1">
                  <Label htmlFor="targetLongitude">Longitude</Label>
                  <Controller
                    name="targetLongitude"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="targetLongitude"
                        type="number"
                        step="any"
                        placeholder="13.4050"
                        value={String(field.value ?? '')}
                        onChangeText={(value) => field.onChange(value ? parseFloat(value) : undefined)}
                        disabled={loading}
                      />
                    )}
                  />
                  {errors.targetLongitude && (
                    <Text fontSize="$2" color="#ef4444">
                      {errors.targetLongitude.message}
                    </Text>
                  )}
                </YStack>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* QR Code Field */}
        {showQrCodeField && (
          <YStack gap="$1">
            <Label htmlFor="qrCodeValue">Expected QR Code Value *</Label>
            <Controller
              name="qrCodeValue"
              control={control}
              render={({ field }) => (
                <Input
                  id="qrCodeValue"
                  placeholder="Enter the expected QR code value"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  disabled={loading}
                />
              )}
            />
            {errors.qrCodeValue && (
              <Text fontSize="$2" color="#ef4444">
                {errors.qrCodeValue.message}
              </Text>
            )}
          </YStack>
        )}

        {/* Auto-approve Configuration */}
        {submissionType !== 'IMAGE_LOCATION' && (
          <Card padding="$3" backgroundColor="#f9fafb">
            <YStack gap="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <YStack>
                  <Text fontSize="$4" fontWeight="600">
                    Auto-approve Submissions
                  </Text>
                  <Text fontSize="$2" color="gray">
                    Automatically approve valid submissions without review
                  </Text>
                </YStack>
                <Controller
                  name="autoApprove"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  )}
                />
              </XStack>

              {showTextPhraseField && (
                <YStack gap="$1">
                  <Label htmlFor="textExpectedPhrase">Expected Text Phrase *</Label>
                  <Controller
                    name="textExpectedPhrase"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="textExpectedPhrase"
                        placeholder="Enter the expected text phrase"
                        value={field.value ?? ''}
                        onChangeText={field.onChange}
                        disabled={loading}
                      />
                    )}
                  />
                  {errors.textExpectedPhrase && (
                    <Text fontSize="$2" color="#ef4444">
                      {errors.textExpectedPhrase.message}
                    </Text>
                  )}
                </YStack>
              )}
            </YStack>
          </Card>
        )}

        {/* Action Buttons */}
        <XStack gap="$3" marginTop="$4">
          <Button
            variant="secondary"
            onPress={onCancel}
            disabled={loading}
            flex={1}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit(handleFormSubmit)}
            disabled={loading}
            isLoading={loading}
            flex={1}
          >
            {isEditMode ? 'Update Challenge' : 'Create Challenge'}
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
