/**
 * Group Hooks - GraphQL Query and Mutation Hooks
 *
 * Provides urql-based hooks for group CRUD operations.
 * These hooks integrate with the cacheExchange for automatic cache updates.
 *
 * @module @/components/admin/groups/hooks
 */

'use client'

import { useQuery, useMutation } from 'urql'
import { gql } from '@urql/core'
import type { Group, CreateGroupInput, UpdateGroupInput } from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch groups for a specific trip
 */
export const GetGroupsDocument = gql`
  query GetGroups($tripId: ID!) {
    groups(tripId: $tripId) {
      id
      name
      coins
    }
  }
`

/**
 * GraphQL mutation to create a new group
 */
export const CreateGroupDocument = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      coins
    }
  }
`

/**
 * GraphQL mutation to update an existing group
 */
export const UpdateGroupDocument = gql`
  mutation UpdateGroup($id: ID!, $input: UpdateGroupInput!) {
    updateGroup(id: $id, input: $input) {
      id
      name
      coins
    }
  }
`

/**
 * GraphQL mutation to delete a group
 */
export const DeleteGroupDocument = gql`
  mutation DeleteGroup($id: ID!) {
    deleteGroup(id: $id) {
      id
    }
  }
`

/**
 * GraphQL query to fetch a single group by ID
 */
export const GetGroupDocument = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      coins
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetGroupsQueryResult {
  groups: Group[]
}

export interface GetGroupsQueryVariables {
  tripId: string
}

export interface CreateGroupMutationResult {
  createGroup: Group
}

export interface CreateGroupMutationVariables {
  input: CreateGroupInput
}

export interface UpdateGroupMutationResult {
  updateGroup: Group
}

export interface UpdateGroupMutationVariables {
  id: string
  input: Omit<CreateGroupInput, 'tripId'>
}

export interface DeleteGroupMutationResult {
  deleteGroup: { id: string }
}

export interface DeleteGroupMutationVariables {
  id: string
}

export interface GetGroupQueryResult {
  group: Group | null
}

export interface GetGroupQueryVariables {
  id: string
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetGroupsQueryResult {
  /** List of groups for the selected trip */
  groups: Group[]
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the groups list */
  refetch: () => void
}

export interface UseCreateGroupMutationResult {
  /** Create a new group */
  createGroup: (input: CreateGroupInput) => Promise<Group>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseUpdateGroupMutationResult {
  /** Update an existing group */
  updateGroup: (id: string, input: Omit<CreateGroupInput, 'tripId'>) => Promise<Group>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseDeleteGroupMutationResult {
  /** Delete a group */
  deleteGroup: (id: string) => Promise<void>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseGetGroupQueryResult {
  /** The group if found, null otherwise */
  group: Group | null
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch groups for a specific trip
 *
 * Uses urql's useQuery with automatic cache management.
 * The cache is invalidated when groups are created/updated/deleted.
 *
 * @param tripId - The trip ID to fetch groups for
 * @returns Query result with groups list, loading state, and error
 *
 * @example
 * ```tsx
 * const { groups, loading, error } = useGetGroupsQuery(tripId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 *
 * return <GroupList groups={groups} />;
 * ```
 */
export function useGetGroupsQuery(tripId: string | null): UseGetGroupsQueryResult {
  const [result, reexecuteQuery] = useQuery<GetGroupsQueryResult, GetGroupsQueryVariables>({
    query: GetGroupsDocument,
    variables: { tripId: tripId ?? '' },
    pause: !tripId,
  })

  const groups = result.data?.groups ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  return {
    groups,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to create a new group
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful creation, the groups list cache is invalidated.
 *
 * @returns Mutation result with create function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createGroup, loading } = useCreateGroupMutation();
 *
 * const handleSubmit = async (input) => {
 *   const group = await createGroup(input);
 *   // Group created, cache automatically updated
 * };
 * ```
 */
export function useCreateGroupMutation(): UseCreateGroupMutationResult {
  const [result, executeMutation] = useMutation<
    CreateGroupMutationResult,
    CreateGroupMutationVariables
  >(CreateGroupDocument)

  const createGroup = async (input: CreateGroupInput): Promise<Group> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.createGroup) {
      throw new Error('Failed to create group: no data returned')
    }

    return response.data.createGroup
  }

  return {
    createGroup,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to update an existing group
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful update, the group entity is automatically
 * updated in the normalized cache.
 *
 * @returns Mutation result with update function, loading state, and error
 *
 * @example
 * ```tsx
 * const { updateGroup, loading } = useUpdateGroupMutation();
 *
 * const handleSubmit = async (id, input) => {
 *   const group = await updateGroup(id, input);
 *   // Group updated, cache automatically updated
 * };
 * ```
 */
export function useUpdateGroupMutation(): UseUpdateGroupMutationResult {
  const [result, executeMutation] = useMutation<
    UpdateGroupMutationResult,
    UpdateGroupMutationVariables
  >(UpdateGroupDocument)

  const updateGroup = async (
    id: string,
    input: Omit<CreateGroupInput, 'tripId'>
  ): Promise<Group> => {
    const response = await executeMutation({ id, input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.updateGroup) {
      throw new Error('Failed to update group: no data returned')
    }

    return response.data.updateGroup
  }

  return {
    updateGroup,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete a group
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful deletion, the group is removed from cache
 * and the groups list is invalidated.
 *
 * @returns Mutation result with delete function, loading state, and error
 *
 * @example
 * ```tsx
 * const { deleteGroup, loading } = useDeleteGroupMutation();
 *
 * const handleDelete = async (id) => {
 *   await deleteGroup(id);
 *   // Group deleted, cache automatically updated
 * };
 * ```
 */
export function useDeleteGroupMutation(): UseDeleteGroupMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteGroupMutationResult,
    DeleteGroupMutationVariables
  >(DeleteGroupDocument)

  const deleteGroup = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteGroup,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to fetch a single group by ID
 *
 * Uses urql's useQuery with cache-first policy.
 * The group will be fetched from cache if available,
 * otherwise from the network.
 *
 * @param id - The group ID to fetch
 * @returns Query result with group, loading state, and error
 *
 * @example
 * ```tsx
 * const { group, loading, error } = useGetGroupQuery(groupId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!group) return <Text>Group not found</Text>;
 *
 * return <GroupProfile group={group} />;
 * ```
 */
export function useGetGroupQuery(id: string | null): UseGetGroupQueryResult {
  const [result] = useQuery<GetGroupQueryResult, GetGroupQueryVariables>({
    query: GetGroupDocument,
    variables: { id: id ?? '' },
    pause: !id,
  })

  const group = result.data?.group ?? null
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  return {
    group,
    loading,
    error,
  }
}
