/**
 * CoinsPageContent Component
 *
 * Displays the coin management overview for the selected trip.
 * Features:
 * - Fetches coin balances via GraphQL query
 * - Displays groups with their coin balances in a card list
 * - Supports adding and removing coins from groups
 * - Shows transaction history
 * - Handles loading and error states
 *
 * @module @/components/admin/coins/CoinsPageContent
 */

'use client'

import { useCallback, useState, useMemo } from 'react'
import { useTripContext } from '@/hooks/useTripContext'
import { TripId } from '@mirai-app/domain'
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
} from '@mirai-app/ui'
import { Plus, Minus, AlertCircle } from '@/components/ui/Icon'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { toast } from 'react-hot-toast'
import {
  useGetCoinBalancesQuery,
  useAddGroupCoinsMutation,
} from './hooks'
import { CoinCard, CoinCardSkeleton } from './CoinCard'
import { CoinOperationForm } from './CoinOperationForm'
import type { CoinBalance } from './types'

type OperationType = 'add' | 'remove' | null

/**
 * CoinsPageContent - Main content for the coins management page
 *
 * Fetches coin balances for the selected trip and displays them in a list.
 * Supports adding and removing coins from groups.
 *
 * @example
 * ```tsx
 * // In PageContent.tsx
 * 'coins': () => import('../admin/coins/CoinsPageContent'),
 * ```
 */
export function CoinsPageContent() {
  const { selectedTrip } = useTripContext()
  const [selectedBalance, setSelectedBalance] = useState<CoinBalance | null>(null)
  const [operationType, setOperationType] = useState<OperationType>(null)
  const [showHistory, setShowHistory] = useState(false)

  // Get trip ID as string for the query
  const tripIdString = selectedTrip ? TripId.toString(selectedTrip.id) : ''

  // Fetch coin balances
  const {
    balances,
    loading: balancesLoading,
    error: balancesError,
    refetch,
  } = useGetCoinBalancesQuery(tripIdString)

  // Coin operation mutation (for add - remove uses negative amount)
  const {
    addCoins,
    loading: operationLoading,
    error: operationError,
  } = useAddGroupCoinsMutation()

  // Open add coins form
  const handleAddCoins = useCallback((balance: CoinBalance) => {
    setSelectedBalance(balance)
    setOperationType('add')
    setShowHistory(false)
  }, [])

  // Open remove coins form
  const handleRemoveCoins = useCallback((balance: CoinBalance) => {
    setSelectedBalance(balance)
    setOperationType('remove')
    setShowHistory(false)
  }, [])

  // Open history view
  const handleViewHistory = useCallback((balance: CoinBalance) => {
    setSelectedBalance(balance)
    setOperationType(null)
    setShowHistory(true)
  }, [])

  // Close sheet
  const handleCloseSheet = useCallback(() => {
    setSelectedBalance(null)
    setOperationType(null)
    setShowHistory(false)
  }, [])

  // Handle coin operation submission
  const handleOperationSubmit = useCallback(
    async (data: { amount: number; reason?: string }) => {
      if (!selectedBalance || !selectedTrip) return

      try {
        const tripId = TripId.toString(selectedTrip.id)
        const amount = operationType === 'remove' ? -data.amount : data.amount

        await addCoins({
          tripId,
          groupId: selectedBalance.groupId,
          amount,
        })

        const action = operationType === 'remove' ? 'removed from' : 'added to'
        toast.success(
          `${data.amount} coins ${action} ${selectedBalance.name}`
        )

        handleCloseSheet()
        refetch()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Operation failed'
        toast.error(message)
      }
    },
    [selectedBalance, selectedTrip, operationType, addCoins, handleCloseSheet, refetch]
  )

  // Calculate total coins in trip
  const totalCoins = useMemo(() => {
    return balances.reduce((sum, balance) => sum + balance.coins, 0)
  }, [balances])

  // Render loading state
  if (balancesLoading) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Coin Management
          </Text>
        </XStack>
        <YStack gap="$3">
          {[...Array(5)].map((_, i) => (
            <CoinCardSkeleton key={i} />
          ))}
        </YStack>
      </YStack>
    )
  }

  // Render error state
  if (balancesError) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Coin Management
          </Text>
        </XStack>
        <ErrorMessage
          title="Failed to load coin balances"
          message={balancesError.message}
          onRetry={refetch}
        />
      </YStack>
    )
  }

  // Render empty trip state
  if (!selectedTrip) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <AlertCircle size={48} color="#9ca3af" />
        <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
          No trip selected
        </Text>
        <Text fontSize="$3" color="$colorMuted" textAlign="center">
          Please select a trip from the header to view coin balances
        </Text>
      </YStack>
    )
  }

  // Render empty groups state
  if (balances.length === 0) {
    return (
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <Text fontSize="$6" fontWeight="600">
            Coin Management
          </Text>
        </XStack>
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          gap="$4"
          paddingVertical="$8"
        >
          <Text fontSize="$5" fontWeight="500" color="$colorMuted" textAlign="center">
            No groups yet
          </Text>
          <Text fontSize="$3" color="$colorMuted" textAlign="center">
            Create groups first to manage their coin balances
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Render coin balances list
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
        <YStack>
          <Text fontSize="$6" fontWeight="600">
            Coin Management
          </Text>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$3" color="$colorMuted">
              {balances.length} {balances.length === 1 ? 'group' : 'groups'} in {selectedTrip.name}
            </Text>
            <Text fontSize="$3" color="#fbbf24" fontWeight="500">
              Total: {totalCoins} coins
            </Text>
          </XStack>
        </YStack>
      </XStack>

      {/* Coin balances list */}
      <YStack
        flex={1}
        overflow="scroll"
        gap="$3"
        paddingRight="$2"
      >
        {balances.map((balance) => (
          <CoinCard
            key={balance.groupId}
            balance={balance}
            onAddCoins={handleAddCoins}
            onRemoveCoins={handleRemoveCoins}
            onViewHistory={handleViewHistory}
          />
        ))}
      </YStack>

      {/* Operation Sheet */}
      <Sheet
        open={!!selectedBalance && !!operationType}
        onOpenChange={(open: boolean) => !open && handleCloseSheet()}
      >
        {selectedBalance && operationType && (
          <CoinOperationForm
            balance={selectedBalance}
            operation={operationType}
            onSubmit={handleOperationSubmit}
            onCancel={handleCloseSheet}
            loading={operationLoading}
            error={operationError?.message}
          />
        )}
      </Sheet>

      {/* History Sheet */}
      <Sheet
        open={showHistory && !!selectedBalance}
        onOpenChange={(open: boolean) => !open && handleCloseSheet()}
      >
        {selectedBalance && showHistory && (
          <TransactionHistoryView
            balance={selectedBalance}
            onClose={handleCloseSheet}
          />
        )}
      </Sheet>
    </YStack>
  )
}

/**
 * TransactionHistoryView - Displays transaction history for a group
 */
interface TransactionHistoryViewProps {
  balance: CoinBalance
  onClose: () => void
}

import { useGetGroupTransactionsQuery } from './hooks'

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TransactionHistoryView({ balance, onClose }: TransactionHistoryViewProps) {
  const {
    transactions,
    loading,
    error,
    hasMore,
    loadMore,
  } = useGetGroupTransactionsQuery(balance.groupId)

  return (
    <YStack gap="$4" padding="$4" maxHeight={500}>
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <Text fontSize="$5" fontWeight="600">
            Transaction History
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {balance.name}
          </Text>
        </YStack>
        <Button variant="ghost" size="md" onPress={onClose}>
          Close
        </Button>
      </XStack>

      {loading && transactions.length === 0 && (
        <YStack alignItems="center" padding="$4">
          <LoadingSpinner size="sm" />
        </YStack>
      )}

      {error && (
        <YStack
          padding="$3"
          backgroundColor="rgba(239, 68, 68, 0.1)"
          borderRadius="$2"
          borderWidth={1}
          borderColor="#ef4444"
        >
          <Text color="#ef4444" fontSize="$3">
            {error.message}
          </Text>
        </YStack>
      )}

      <YStack
        gap="$2"
        maxHeight={350}
        overflow="scroll"
        paddingRight="$2"
      >
        {transactions.length === 0 && !loading && (
          <Text fontSize="$3" color="$colorMuted" textAlign="center" padding="$4">
            No transactions yet
          </Text>
        )}

        {transactions.map((transaction) => (
          <XStack
            key={transaction.id}
            padding="$3"
            backgroundColor="$backgroundHover"
            borderRadius="$2"
            justifyContent="space-between"
            alignItems="center"
          >
            <YStack flex={1}>
              <XStack gap="$2" alignItems="center">
                <Text
                  fontSize="$4"
                  fontWeight="600"
                  color={transaction.amount > 0 ? '#22c55e' : '#ef4444'}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount} coins
                </Text>
                {transaction.reason && (
                  <Text fontSize="$2" color="$colorMuted">
                    - {transaction.reason}
                  </Text>
                )}
              </XStack>
              <Text fontSize="$2" color="$colorMuted">
                {formatDate(transaction.createdAt)}
              </Text>
            </YStack>
          </XStack>
        ))}

        {hasMore && (
          <Button
            variant="secondary"
            size="small"
            onPress={loadMore}
            disabled={loading}
            isLoading={loading}
          >
            Load More
          </Button>
        )}
      </YStack>
    </YStack>
  )
}
