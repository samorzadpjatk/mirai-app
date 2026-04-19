/**
 * Coin Hooks - GraphQL Query and Mutation Hooks
 *
 * Provides urql-based hooks for coin operations.
 * These hooks integrate with the cacheExchange for automatic cache updates.
 *
 * @module @/components/admin/coins/hooks
 */

'use client'

import { useQuery, useMutation } from 'urql'
import { gql } from '@urql/core'
import type {
  CoinBalance,
  CoinTransaction,
  AddCoinsInput,
  CoinOperationResult,
} from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch coin balances for all groups in a trip
 */
export const GetCoinBalancesDocument = gql`
  query GetCoinBalances($tripId: String!) {
    groupList(tripId: $tripId) {
      id
      name
      coins
    }
  }
`

/**
 * GraphQL query to fetch transactions for a specific group
 */
export const GetGroupTransactionsDocument = gql`
  query GetGroupTransactions($groupId: String!, $first: Int, $after: String) {
    groupTransactions(groupId: $groupId, first: $first, after: $after) {
      edges {
        node {
          id
          groupId
          amount
          reason
          adminId
          createdAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

/**
 * GraphQL query to fetch trip-wide transaction history
 */
export const GetTripTransactionsDocument = gql`
  query GetTripTransactions($tripId: String!, $first: Int, $after: String) {
    groups(tripId: $tripId, first: 100) {
      edges {
        node {
          id
          name
          coins
        }
      }
    }
  }
`

/**
 * GraphQL mutation to add coins to a group
 */
export const AddGroupCoinsDocument = gql`
  mutation AddGroupCoins($input: AddGroupCoinsInput!) {
    addGroupCoins(input: $input) {
      groupId
      amount
      previousCoins
      newCoins
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetCoinBalancesQueryResult {
  groupList: Array<{
    id: string
    name: string
    coins: number
  }>
}

export interface GetCoinBalancesQueryVariables {
  tripId: string
}

export interface GetGroupTransactionsQueryResult {
  groupTransactions: {
    edges: Array<{
      node: CoinTransaction
      cursor: string
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

export interface GetGroupTransactionsQueryVariables {
  groupId: string
  first?: number
  after?: string
}

export interface AddGroupCoinsMutationResult {
  addGroupCoins: CoinOperationResult
}

export interface AddGroupCoinsMutationVariables {
  input: AddCoinsInput
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetCoinBalancesQueryResult {
  /** List of group coin balances for the selected trip */
  balances: CoinBalance[]
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the balances */
  refetch: () => void
}

export interface UseGetGroupTransactionsQueryResult {
  /** List of transactions for the group */
  transactions: CoinTransaction[]
  /** Whether more transactions can be loaded */
  hasMore: boolean
  /** Load more transactions */
  loadMore: () => void
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the transactions */
  refetch: () => void
}

export interface UseAddGroupCoinsMutationResult {
  /** Add coins to a group */
  addCoins: (input: AddCoinsInput) => Promise<CoinOperationResult>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch coin balances for all groups in a trip
 *
 * Uses urql's useQuery with automatic cache management.
 *
 * @param tripId - The trip ID to fetch balances for
 * @returns Query result with balances list, loading state, and error
 *
 * @example
 * ```tsx
 * const { balances, loading, error } = useGetCoinBalancesQuery(tripId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 *
 * return <CoinBalancesList balances={balances} />;
 * ```
 */
export function useGetCoinBalancesQuery(
  tripId: string
): UseGetCoinBalancesQueryResult {
  const [result, reexecuteQuery] = useQuery<
    GetCoinBalancesQueryResult,
    GetCoinBalancesQueryVariables
  >({
    query: GetCoinBalancesDocument,
    variables: { tripId },
    pause: !tripId,
  })

  const balances = result.data?.groupList.map((group) => ({
    groupId: group.id,
    name: group.name,
    coins: group.coins,
    totalEarned: 0, // Calculated from transactions if needed
    totalSpent: 0, // Calculated from transactions if needed
  })) ?? []

  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  return {
    balances,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to fetch transactions for a specific group
 *
 * Uses urql's useQuery with pagination support.
 *
 * @param groupId - The group ID to fetch transactions for
 * @returns Query result with transactions, pagination, loading state, and error
 *
 * @example
 * ```tsx
 * const { transactions, hasMore, loadMore, loading } = useGetGroupTransactionsQuery(groupId);
 *
 * if (loading) return <LoadingSpinner />;
 *
 * return (
 *   <>
 *     <TransactionList transactions={transactions} />
 *     {hasMore && <Button onPress={loadMore}>Load More</Button>}
 *   </>
 * );
 * ```
 */
export function useGetGroupTransactionsQuery(
  groupId: string
): UseGetGroupTransactionsQueryResult {
  const [result, reexecuteQuery] = useQuery<
    GetGroupTransactionsQueryResult,
    GetGroupTransactionsQueryVariables
  >({
    query: GetGroupTransactionsDocument,
    variables: { groupId, first: 20 },
    pause: !groupId,
  })

  const transactions =
    result.data?.groupTransactions.edges.map((edge) => edge.node) ?? []
  const hasMore = result.data?.groupTransactions.pageInfo.hasNextPage ?? false

  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  const loadMore = () => {
    const endCursor = result.data?.groupTransactions.pageInfo.endCursor
    if (endCursor) {
      reexecuteQuery({
        variables: { groupId, first: 20, after: endCursor },
      })
    }
  }

  return {
    transactions,
    hasMore,
    loadMore,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to add coins to a group
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful operation, the group balance is updated in cache.
 *
 * @returns Mutation result with add function, loading state, and error
 *
 * @example
 * ```tsx
 * const { addCoins, loading } = useAddGroupCoinsMutation();
 *
 * const handleAdd = async (input) => {
 *   const result = await addCoins(input);
 *   // Coins added, cache automatically updated
 *   toast.success(`Added ${result.amount} coins. New balance: ${result.newCoins}`);
 * };
 * ```
 */
export function useAddGroupCoinsMutation(): UseAddGroupCoinsMutationResult {
  const [result, executeMutation] = useMutation<
    AddGroupCoinsMutationResult,
    AddGroupCoinsMutationVariables
  >(AddGroupCoinsDocument)

  const addCoins = async (input: AddCoinsInput): Promise<CoinOperationResult> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.addGroupCoins) {
      throw new Error('Failed to add coins: no data returned')
    }

    return response.data.addGroupCoins
  }

  return {
    addCoins,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}
