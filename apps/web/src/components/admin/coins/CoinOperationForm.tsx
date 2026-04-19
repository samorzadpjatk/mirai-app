/**
 * CoinOperationForm Component
 *
 * Form for adding or removing coins from a group.
 * Supports validation and error handling.
 *
 * @module @/components/admin/coins/CoinOperationForm
 */

'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { YStack, XStack, Text, Button, Input } from '@mirai-app/ui'
import { coinOperationSchema, type CoinOperationSchema } from './types'
import type { CoinBalance } from './types'

interface CoinOperationFormProps {
  /** The group balance being modified */
  balance: CoinBalance
  /** Operation type - add or remove */
  operation: 'add' | 'remove'
  /** Callback when form is submitted */
  onSubmit: (data: { amount: number; reason?: string }) => void
  /** Callback when form is cancelled */
  onCancel: () => void
  /** Whether the form is submitting */
  loading?: boolean
  /** Error message to display */
  error?: string | null
}

/**
 * CoinOperationForm - Form for adding or removing coins
 *
 * @example
 * ```tsx
 * <CoinOperationForm
 *   balance={selectedBalance}
 *   operation="add"
 *   onSubmit={({ amount, reason }) => addCoins({ tripId, groupId, amount, reason })}
 *   onCancel={() => setShowForm(false)}
 *   loading={loading}
 * />
 * ```
 */
export function CoinOperationForm({
  balance,
  operation,
  onSubmit,
  onCancel,
  loading,
  error,
}: CoinOperationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CoinOperationSchema>({
    resolver: zodResolver(coinOperationSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  })

  const amount = watch('amount')

  const handleFormSubmit = useCallback(
    (data: CoinOperationSchema) => {
      onSubmit({
        amount: data.amount,
        reason: data.reason,
      })
    },
    [onSubmit]
  )

  const isRemove = operation === 'remove'
  const title = isRemove ? 'Remove Coins' : 'Add Coins'
  const buttonText = isRemove ? 'Remove Coins' : 'Add Coins'
  const buttonVariant = isRemove ? 'danger' : 'primary'
  const canSubmit = isRemove
    ? amount > 0 && amount <= balance.coins
    : amount > 0

  return (
    <YStack gap="$4" padding="$4">
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600">
          {title}
        </Text>
        <Text fontSize="$3" color="$colorMuted">
          {balance.name} - Current balance: {balance.coins} coins
        </Text>
      </YStack>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <YStack gap="$4">
          {/* Amount field */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">
              Amount
            </Text>
            <Input
              {...register('amount', { valueAsNumber: true })}
              placeholder="Enter amount"
              disabled={loading}
            />
            {errors.amount && (
              <Text fontSize="$2" color="#ef4444">
                {errors.amount.message}
              </Text>
            )}
            {isRemove && amount > balance.coins && (
              <Text fontSize="$2" color="#ef4444">
                Cannot remove more than {balance.coins} coins
              </Text>
            )}
          </YStack>

          {/* Reason field */}
          <YStack gap="$2">
            <Text fontSize="$3" fontWeight="500">
              Reason (optional)
            </Text>
            <Input
              {...register('reason')}
              placeholder={`Why are you ${operation}ing these coins?`}
              disabled={loading}
            />
            {errors.reason && (
              <Text fontSize="$2" color="#ef4444">
                {errors.reason.message}
              </Text>
            )}
          </YStack>

          {/* Preview */}
          {amount > 0 && (
            <YStack
              gap="$2"
              padding="$3"
              backgroundColor="$backgroundHover"
              borderRadius="$2"
            >
              <Text fontSize="$3" fontWeight="500">
                Preview:
              </Text>
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorMuted">
                  Current balance:
                </Text>
                <Text fontSize="$3">{balance.coins} coins</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$colorMuted">
                  {isRemove ? 'To remove:' : 'To add:'}
                </Text>
                <Text fontSize="$3" color={isRemove ? '#ef4444' : '#22c55e'}>
                  {isRemove ? '-' : '+'} {amount} coins
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontSize="$3" fontWeight="600">
                  New balance:
                </Text>
                <Text fontSize="$3" fontWeight="600">
                  {isRemove ? balance.coins - amount : balance.coins + amount} coins
                </Text>
              </XStack>
            </YStack>
          )}

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

          {/* Buttons */}
          <XStack gap="$3" marginTop="$2">
            <Button
              variant="secondary"
              size="lg"
              onPress={onCancel}
              disabled={loading}
              flex={1}
            >
              Cancel
            </Button>
            <Button
              variant={buttonVariant}
              size="lg"
              disabled={loading || !canSubmit}
              isLoading={loading}
              flex={1}
            >
              {buttonText}
            </Button>
          </XStack>
        </YStack>
      </form>
    </YStack>
  )
}
