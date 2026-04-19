/**
 * Reward Hooks - GraphQL Query and Mutation Hooks
 *
 * Provides urql-based hooks for reward CRUD operations.
 * These hooks integrate with the cacheExchange for automatic cache updates.
 *
 * @module @/components/admin/rewards/hooks
 */

'use client'

import { useQuery, useMutation } from 'urql'
import { gql } from '@urql/core'
import type { Reward, CreateRewardInput, UpdateRewardInput } from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch rewards for a specific trip
 */
export const GetRewardsDocument = gql`
  query GetRewards($tripId: String!, $first: Int, $after: String) {
    rewards(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          name
          description
          image
          coinCost
          availableQuantity
          isHidden
          tripId
          createdAt
          updatedAt
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
 * GraphQL query to fetch a single reward by ID
 */
export const GetRewardDocument = gql`
  query GetReward($id: ID!) {
    reward(id: $id) {
      id
      name
      description
      image
      coinCost
      availableQuantity
      isHidden
      tripId
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to create a new reward
 */
export const CreateRewardDocument = gql`
  mutation CreateReward(
    $coinCost: Int!
    $description: String
    $name: String!
    $quantity: Int
    $tripId: String!
  ) {
    createReward(
      coinCost: $coinCost
      description: $description
      name: $name
      quantity: $quantity
      tripId: $tripId
    ) {
      id
      name
      description
      image
      coinCost
      availableQuantity
      tripId
      createdAt
    }
  }
`

/**
 * GraphQL mutation to delete a reward
 */
export const DeleteRewardDocument = gql`
  mutation DeleteReward($id: ID!) {
    deleteReward(id: $id) {
      id
    }
  }
`

/**
 * GraphQL mutation to get upload URL for file storage
 */
export const GetUploadUrlDocument = gql`
  query GetUploadUrl($input: GetUploadUrlInput!) {
    uploadUrl(input: $input) {
      url
      path
      expiresAt
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetRewardsQueryResult {
  rewards: {
    edges: Array<{
      node: Reward
      cursor: string
    }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

export interface GetRewardsQueryVariables {
  tripId: string
  first?: number
  after?: string | null
}

export interface GetRewardQueryResult {
  reward: Reward | null
}

export interface GetRewardQueryVariables {
  id: string
}

export interface CreateRewardMutationResult {
  createReward: Reward
}

export interface CreateRewardMutationVariables {
  coinCost: number
  description?: string | null
  name: string
  quantity?: number | null
  tripId: string
}

export interface DeleteRewardMutationResult {
  deleteReward: { id: string }
}

export interface DeleteRewardMutationVariables {
  id: string
}

export interface StorageUploadUrl {
  url: string
  path: string
  expiresAt: string
}

export interface GetUploadUrlQueryResult {
  uploadUrl: StorageUploadUrl
}

export interface GetUploadUrlQueryVariables {
  input: {
    filename: string
    contentType: string
    size: number
  }
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetRewardsQueryResult {
  /** List of rewards for the selected trip */
  rewards: Reward[]
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the rewards list */
  refetch: () => void
  /** Whether there are more pages */
  hasMore: boolean
  /** Load more rewards */
  loadMore: () => void
}

export interface UseGetRewardQueryResult {
  /** The reward if found, null otherwise */
  reward: Reward | null
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
}

export interface UseCreateRewardMutationResult {
  /** Create a new reward */
  createReward: (input: CreateRewardInput) => Promise<Reward>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseDeleteRewardMutationResult {
  /** Delete a reward */
  deleteReward: (id: string) => Promise<void>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseGetUploadUrlResult {
  /** Get upload URL for a file */
  getUploadUrl: (input: GetUploadUrlQueryVariables['input']) => Promise<StorageUploadUrl>
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch rewards for a specific trip
 *
 * Uses urql's useQuery with automatic cache management.
 * The cache is invalidated when rewards are created/updated/deleted.
 *
 * @param tripId - The trip ID to fetch rewards for
 * @returns Query result with rewards list, loading state, and error
 *
 * @example
 * ```tsx
 * const { rewards, loading, error } = useGetRewardsQuery(tripId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 *
 * return <RewardList rewards={rewards} />;
 * ```
 */
export function useGetRewardsQuery(tripId: string): UseGetRewardsQueryResult {
  const [result, reexecuteQuery] = useQuery<GetRewardsQueryResult, GetRewardsQueryVariables>({
    query: GetRewardsDocument,
    variables: { tripId, first: 50, after: null },
    pause: !tripId,
  })

  const rewards = result.data?.rewards?.edges?.map((edge) => edge.node) ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null
  const hasMore = result.data?.rewards?.pageInfo?.hasNextPage ?? false

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  const loadMore = () => {
    if (hasMore && result.data?.rewards?.pageInfo?.endCursor) {
      reexecuteQuery({
        variables: {
          tripId,
          first: 50,
          after: result.data.rewards.pageInfo.endCursor,
        },
      })
    }
  }

  return {
    rewards,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  }
}

/**
 * Hook to fetch a single reward by ID
 *
 * Uses urql's useQuery with cache-first policy.
 * The reward will be fetched from cache if available,
 * otherwise from the network.
 *
 * @param id - The reward ID to fetch
 * @returns Query result with reward, loading state, and error
 *
 * @example
 * ```tsx
 * const { reward, loading, error } = useGetRewardQuery(rewardId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!reward) return <Text>Reward not found</Text>;
 *
 * return <RewardProfile reward={reward} />;
 * ```
 */
export function useGetRewardQuery(id: string | null): UseGetRewardQueryResult {
  const [result] = useQuery<GetRewardQueryResult, GetRewardQueryVariables>({
    query: GetRewardDocument,
    variables: { id: id ?? '' },
    pause: !id,
  })

  const reward = result.data?.reward ?? null
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  return {
    reward,
    loading,
    error,
  }
}

/**
 * Hook to create a new reward
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful creation, the rewards list cache is invalidated.
 *
 * @returns Mutation result with create function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createReward, loading } = useCreateRewardMutation();
 *
 * const handleSubmit = async (input) => {
 *   const reward = await createReward(input);
 *   // Reward created, cache automatically updated
 * };
 * ```
 */
export function useCreateRewardMutation(): UseCreateRewardMutationResult {
  const [result, executeMutation] = useMutation<
    CreateRewardMutationResult,
    CreateRewardMutationVariables
  >(CreateRewardDocument)

  const createReward = async (input: CreateRewardInput): Promise<Reward> => {
    const response = await executeMutation({
      coinCost: input.coinCost ?? 0,
      description: input.description ?? null,
      name: input.name,
      quantity: input.quantity ?? null,
      tripId: input.tripId,
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.createReward) {
      throw new Error('Failed to create reward: no data returned')
    }

    return response.data.createReward
  }

  return {
    createReward,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete a reward
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful deletion, the reward is removed from cache
 * and the rewards list is invalidated.
 *
 * @returns Mutation result with delete function, loading state, and error
 *
 * @example
 * ```tsx
 * const { deleteReward, loading } = useDeleteRewardMutation();
 *
 * const handleDelete = async (id) => {
 *   await deleteReward(id);
 *   // Reward deleted, cache automatically updated
 * };
 * ```
 */
export function useDeleteRewardMutation(): UseDeleteRewardMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteRewardMutationResult,
    DeleteRewardMutationVariables
  >(DeleteRewardDocument)

  const deleteReward = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteReward,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to get an upload URL for file storage
 *
 * Used internally by the file upload component to get a signed URL
 * for uploading files directly to storage.
 *
 * @returns Function to get upload URL, loading state, and error
 */
export function useGetUploadUrl(): UseGetUploadUrlResult {
  const [result, executeMutation] = useMutation<
    GetUploadUrlQueryResult,
    GetUploadUrlQueryVariables
  >(GetUploadUrlDocument)

  const getUploadUrl = async (
    input: GetUploadUrlQueryVariables['input']
  ): Promise<StorageUploadUrl> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.uploadUrl) {
      throw new Error('Failed to get upload URL')
    }

    return response.data.uploadUrl
  }

  return {
    getUploadUrl,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}
