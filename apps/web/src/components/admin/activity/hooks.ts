/**
 * Activity Hooks - GraphQL Query and Mutation Hooks
 *
 * Provides urql-based hooks for schedule activity CRUD operations.
 * These hooks integrate with the cacheExchange for automatic cache updates.
 *
 * @module @/components/admin/activity/hooks
 */

'use client'

import { useQuery, useMutation } from 'urql'
import { gql } from '@urql/core'
import type { Activity, CreateActivityInput, UpdateActivityInput } from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch activities for a specific trip
 */
export const GetActivitiesDocument = gql`
  query GetActivities($tripId: ID!) {
    activities(tripId: $tripId) {
      id
      title
      description
      type
      startTime
      endTime
      location
      order
      isVisible
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to create a new activity
 */
export const CreateActivityDocument = gql`
  mutation CreateActivity($input: CreateActivityInput!) {
    createActivity(input: $input) {
      id
      title
      description
      type
      startTime
      endTime
      location
      order
      isVisible
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to update an existing activity
 */
export const UpdateActivityDocument = gql`
  mutation UpdateActivity($id: ID!, $input: UpdateActivityInput!) {
    updateActivity(id: $id, input: $input) {
      id
      title
      description
      type
      startTime
      endTime
      location
      order
      isVisible
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to delete an activity
 */
export const DeleteActivityDocument = gql`
  mutation DeleteActivity($id: ID!) {
    deleteActivity(id: $id) {
      id
    }
  }
`

/**
 * GraphQL mutation to reorder activities
 */
export const ReorderActivitiesDocument = gql`
  mutation ReorderActivities($tripId: ID!, $activityIds: [ID!]!) {
    reorderActivities(tripId: $tripId, activityIds: $activityIds) {
      id
      order
    }
  }
`

/**
 * GraphQL query to fetch a single activity by ID
 */
export const GetActivityDocument = gql`
  query GetActivity($id: ID!) {
    activity(id: $id) {
      id
      title
      description
      type
      startTime
      endTime
      location
      order
      isVisible
      tripId
      createdAt
      updatedAt
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetActivitiesQueryResult {
  activities: Activity[]
}

export interface GetActivitiesQueryVariables {
  tripId: string
}

export interface CreateActivityMutationResult {
  createActivity: Activity
}

export interface CreateActivityMutationVariables {
  input: CreateActivityInput
}

export interface UpdateActivityMutationResult {
  updateActivity: Activity
}

export interface UpdateActivityMutationVariables {
  id: string
  input: UpdateActivityInput
}

export interface DeleteActivityMutationResult {
  deleteActivity: { id: string }
}

export interface DeleteActivityMutationVariables {
  id: string
}

export interface ReorderActivitiesMutationResult {
  reorderActivities: { id: string; order: number }[]
}

export interface ReorderActivitiesMutationVariables {
  tripId: string
  activityIds: string[]
}

export interface GetActivityQueryResult {
  activity: Activity | null
}

export interface GetActivityQueryVariables {
  id: string
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetActivitiesQueryResult {
  /** List of activities for the selected trip */
  activities: Activity[]
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the activities list */
  refetch: () => void
}

export interface UseCreateActivityMutationResult {
  /** Create a new activity */
  createActivity: (input: CreateActivityInput) => Promise<Activity>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseUpdateActivityMutationResult {
  /** Update an existing activity */
  updateActivity: (id: string, input: UpdateActivityInput) => Promise<Activity>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseDeleteActivityMutationResult {
  /** Delete an activity */
  deleteActivity: (id: string) => Promise<void>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseReorderActivitiesMutationResult {
  /** Reorder activities in the schedule */
  reorderActivities: (tripId: string, activityIds: string[]) => Promise<void>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseGetActivityQueryResult {
  /** The activity if found, null otherwise */
  activity: Activity | null
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch activities for a specific trip
 *
 * Uses urql's useQuery with automatic cache management.
 * The cache is invalidated when activities are created/updated/deleted.
 *
 * @param tripId - The trip ID to fetch activities for
 * @returns Query result with activities list, loading state, and error
 *
 * @example
 * ```tsx
 * const { activities, loading, error } = useGetActivitiesQuery(tripId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 *
 * return <ActivityList activities={activities} />;
 * ```
 */
export function useGetActivitiesQuery(
  tripId: string
): UseGetActivitiesQueryResult {
  const [result, reexecuteQuery] = useQuery<
    GetActivitiesQueryResult,
    GetActivitiesQueryVariables
  >({
    query: GetActivitiesDocument,
    variables: { tripId },
    pause: !tripId,
  })

  const activities = result.data?.activities ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  return {
    activities,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to create a new activity
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful creation, the activities list cache is invalidated.
 *
 * @returns Mutation result with create function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createActivity, loading } = useCreateActivityMutation();
 *
 * const handleSubmit = async (input) => {
 *   const activity = await createActivity(input);
 *   // Activity created, cache automatically updated
 * };
 * ```
 */
export function useCreateActivityMutation(): UseCreateActivityMutationResult {
  const [result, executeMutation] = useMutation<
    CreateActivityMutationResult,
    CreateActivityMutationVariables
  >(CreateActivityDocument)

  const createActivity = async (
    input: CreateActivityInput
  ): Promise<Activity> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.createActivity) {
      throw new Error('Failed to create activity: no data returned')
    }

    return response.data.createActivity
  }

  return {
    createActivity,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to update an existing activity
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful update, the activity entity is automatically
 * updated in the normalized cache.
 *
 * @returns Mutation result with update function, loading state, and error
 *
 * @example
 * ```tsx
 * const { updateActivity, loading } = useUpdateActivityMutation();
 *
 * const handleSubmit = async (id, input) => {
 *   const activity = await updateActivity(id, input);
 *   // Activity updated, cache automatically updated
 * };
 * ```
 */
export function useUpdateActivityMutation(): UseUpdateActivityMutationResult {
  const [result, executeMutation] = useMutation<
    UpdateActivityMutationResult,
    UpdateActivityMutationVariables
  >(UpdateActivityDocument)

  const updateActivity = async (
    id: string,
    input: UpdateActivityInput
  ): Promise<Activity> => {
    const response = await executeMutation({ id, input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.updateActivity) {
      throw new Error('Failed to update activity: no data returned')
    }

    return response.data.updateActivity
  }

  return {
    updateActivity,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete an activity
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful deletion, the activity is removed from cache
 * and the activities list is invalidated.
 *
 * @returns Mutation result with delete function, loading state, and error
 *
 * @example
 * ```tsx
 * const { deleteActivity, loading } = useDeleteActivityMutation();
 *
 * const handleDelete = async (id) => {
 *   await deleteActivity(id);
 *   // Activity deleted, cache automatically updated
 * };
 * ```
 */
export function useDeleteActivityMutation(): UseDeleteActivityMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteActivityMutationResult,
    DeleteActivityMutationVariables
  >(DeleteActivityDocument)

  const deleteActivity = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteActivity,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to reorder activities in the schedule
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful reordering, activities are updated in cache.
 *
 * @returns Mutation result with reorder function, loading state, and error
 *
 * @example
 * ```tsx
 * const { reorderActivities, loading } = useReorderActivitiesMutation();
 *
 * const handleReorder = async (tripId, orderedIds) => {
 *   await reorderActivities(tripId, orderedIds);
 *   // Activities reordered, cache automatically updated
 * };
 * ```
 */
export function useReorderActivitiesMutation(): UseReorderActivitiesMutationResult {
  const [result, executeMutation] = useMutation<
    ReorderActivitiesMutationResult,
    ReorderActivitiesMutationVariables
  >(ReorderActivitiesDocument)

  const reorderActivities = async (
    tripId: string,
    activityIds: string[]
  ): Promise<void> => {
    const response = await executeMutation({ tripId, activityIds })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    reorderActivities,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to fetch a single activity by ID
 *
 * Uses urql's useQuery with cache-first policy.
 * The activity will be fetched from cache if available,
 * otherwise from the network.
 *
 * @param id - The activity ID to fetch
 * @returns Query result with activity, loading state, and error
 *
 * @example
 * ```tsx
 * const { activity, loading, error } = useGetActivityQuery(activityId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!activity) return <Text>Activity not found</Text>;
 *
 * return <ActivityForm activity={activity} />;
 * ```
 */
export function useGetActivityQuery(
  id: string | null
): UseGetActivityQueryResult {
  const [result] = useQuery<GetActivityQueryResult, GetActivityQueryVariables>({
    query: GetActivityDocument,
    variables: { id: id ?? '' },
    pause: !id,
  })

  const activity = result.data?.activity ?? null
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  return {
    activity,
    loading,
    error,
  }
}
