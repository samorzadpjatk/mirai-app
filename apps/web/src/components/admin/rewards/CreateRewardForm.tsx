/**
 * CreateRewardForm Component
 *
 * Form for creating a new reward with validation and file upload support.
 * Uses react-hook-form with Zod schema validation.
 * Integrates with FileUpload component for image handling.
 *
 * @module @/components/admin/rewards/CreateRewardForm
 */

'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input } from '@mirai-app/ui'
import { Upload, Image as ImageIcon, X } from '@/components/ui/Icon'
import { createRewardSchema, type CreateRewardSchema } from './types'
import type { CreateRewardInput, FileUploadResult } from './types'

interface CreateRewardFormProps {
  /** Callback when form is submitted successfully */
  onSubmit: (data: CreateRewardInput) => Promise<void>
  /** Callback when cancel button is clicked */
  onCancel: () => void
  /** Whether the form is currently submitting */
  loading?: boolean
  /** Optional error message to display */
  error?: string | null
  /** Callback to upload file - provided by parent using useGetUploadUrl from Step 12 */
  onUploadFile?: (file: File) => Promise<FileUploadResult>
}

/**
 * CreateRewardForm - Form for creating a new reward
 *
 * Features:
 * - Name, description, coin cost, and quantity fields
 * - File upload for reward image (integrates with Step 12)
 * - Zod validation with react-hook-form
 * - Loading state handling
 * - Error display
 * - Cancel button
 *
 * @example
 * ```tsx
 * <CreateRewardForm
 *   onSubmit={async (data) => {
 *     await createReward(data);
 *     navigate('/rewards');
 *   }}
 *   onCancel={() => navigate('/rewards')}
 *   loading={isCreating}
 *   error={createError?.message}
 *   onUploadFile={uploadFile}
 * />
 * ```
 */
export function CreateRewardForm({
  onSubmit,
  onCancel,
  loading,
  error,
  onUploadFile,
}: CreateRewardFormProps) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<CreateRewardSchema>({
    resolver: zodResolver(createRewardSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      image: null,
      coinCost: null,
      quantity: null,
    },
  })

  // Watch image value for preview
  const imageUrl = watch('image')

  const handleFormSubmit = useCallback(
    async (data: CreateRewardSchema) => {
      await onSubmit({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        image: data.image || null,
        coinCost: data.coinCost ?? null,
        quantity: data.quantity ?? null,
        tripId: '', // Will be set by parent
      })
    },
    [onSubmit]
  )

  const handleCancel = useCallback(() => {
    reset()
    onCancel()
  }, [reset, onCancel])

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !onUploadFile) return

      setUploadingImage(true)
      setUploadError(null)

      try {
        const result = await onUploadFile(file)
        setValue('image', result.url, { shouldValidate: true, shouldDirty: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload image'
        setUploadError(message)
      } finally {
        setUploadingImage(false)
      }
    },
    [onUploadFile, setValue]
  )

  const handleRemoveImage = useCallback(() => {
    setValue('image', null, { shouldValidate: true, shouldDirty: true })
    setUploadError(null)
  }, [setValue])

  const isSubmitDisabled = !isValid || !isDirty || loading || uploadingImage

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <YStack gap="$4" maxWidth={600}>
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

        {/* Image upload section */}
        <YStack gap="$2">
          <Text fontSize="$3" fontWeight="500" color="$color">
            Reward Image
          </Text>
          
          {imageUrl ? (
            <YStack gap="$2">
              <YStack
                width={200}
                height={200}
                borderRadius="$2"
                overflow="hidden"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <img
                  src={imageUrl}
                  alt="Reward preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </YStack>
              <Button
                variant="secondary"
                size="sm"
                onPress={handleRemoveImage}
                disabled={loading || uploadingImage}
                alignSelf="flex-start"
              >
                <X size={16} />
                Remove Image
              </Button>
            </YStack>
          ) : (
            <YStack>
              <XStack
                borderWidth={2}
                borderColor="$borderColor"
                borderStyle="dashed"
                borderRadius="$2"
                padding="$6"
                alignItems="center"
                justifyContent="center"
                gap="$2"
                backgroundColor="$backgroundHover"
                pressStyle={{ backgroundColor: '$backgroundPress' }}
              >
                <label
                  htmlFor="reward-image-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: loading || uploadingImage ? 'not-allowed' : 'pointer',
                    width: '100%',
                  }}
                >
                  {uploadingImage ? (
                    <>
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        borderWidth={3}
                        borderColor="#3b82f6"
                        borderTopColor="transparent"
                        style={{
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <Text fontSize="$3" color="$colorMuted">
                        Uploading...
                      </Text>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={40} color="#9ca3af" />
                      <Text fontSize="$3" color="$colorMuted" textAlign="center">
                        Click to upload reward image
                      </Text>
                      <Text fontSize="$2" color="$colorMuted" textAlign="center">
                        PNG, JPG up to 5MB
                      </Text>
                    </>
                  )}
                  <input
                    id="reward-image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    disabled={loading || uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
              </XStack>
              {uploadError && (
                <Text fontSize="$2" color="#ef4444" marginTop="$1">
                  {uploadError}
                </Text>
              )}
            </YStack>
          )}
        </YStack>

        {/* Name field */}
        <YStack gap="$2">
          <Input
            label="Reward Name"
            placeholder="Enter reward name"
            {...register('name')}
            error={errors.name?.message}
            disabled={loading}
          />
        </YStack>

        {/* Description field */}
        <YStack gap="$2">
          <label htmlFor="reward-description">
            <Text fontSize="$3" fontWeight="500" color="$color">
              Description
            </Text>
          </label>
          <textarea
            id="reward-description"
            placeholder="Enter reward description (optional)"
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--borderColor)',
              backgroundColor: 'var(--background)',
              color: 'var(--color)',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            disabled={loading}
            {...register('description')}
          />
          {errors.description && (
            <Text fontSize="$2" color="#ef4444">
              {errors.description.message}
            </Text>
          )}
        </YStack>

        {/* Coin cost field */}
        <YStack gap="$2">
          <label htmlFor="reward-coin-cost">
            <Text fontSize="$3" fontWeight="500" color="$color">
              Coin Cost
            </Text>
          </label>
          <input
            id="reward-coin-cost"
            type="number"
            min={0}
            placeholder="Enter coin cost (optional)"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--borderColor)',
              backgroundColor: 'var(--background)',
              color: 'var(--color)',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            disabled={loading}
            {...register('coinCost', { valueAsNumber: true })}
          />
          {errors.coinCost && (
            <Text fontSize="$2" color="#ef4444">
              {errors.coinCost.message}
            </Text>
          )}
        </YStack>

        {/* Quantity field */}
        <YStack gap="$2">
          <label htmlFor="reward-quantity">
            <Text fontSize="$3" fontWeight="500" color="$color">
              Available Quantity
            </Text>
          </label>
          <input
            id="reward-quantity"
            type="number"
            min={0}
            placeholder="Enter quantity (optional, leave empty for unlimited)"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--borderColor)',
              backgroundColor: 'var(--background)',
              color: 'var(--color)',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            disabled={loading}
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && (
            <Text fontSize="$2" color="#ef4444">
              {errors.quantity.message}
            </Text>
          )}
        </YStack>

        {/* Action buttons */}
        <XStack gap="$3" marginTop="$4">
          <Button
            variant="secondary"
            size="lg"
            onPress={handleCancel}
            disabled={loading || uploadingImage}
            flex={1}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit(handleFormSubmit)}
            disabled={isSubmitDisabled}
            isLoading={loading || uploadingImage}
            flex={1}
          >
            Create Reward
          </Button>
        </XStack>
      </YStack>
    </form>
  )
}
