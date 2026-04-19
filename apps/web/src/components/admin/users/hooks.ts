/**
 * User Hooks - GraphQL Query and Mutation Hooks
 *
 * Provides urql-based hooks for user CRUD operations.
 * These hooks integrate with the cacheExchange for automatic cache updates.
 *
 * @module @/components/admin/users/hooks
 */

'use client'

import { useQuery, useMutation } from 'urql'
import { gql } from '@urql/core'
import type { User, CreateUserInput, UpdateUserInput } from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch users for a specific trip
 */
export const GetUsersDocument = gql`
  query GetUsers($tripId: ID!) {
    users(tripId: $tripId) {
      id
      firstName
      lastName
      email
    }
  }
`

/**
 * GraphQL mutation to create a new user
 */
export const CreateUserDocument = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      firstName
      lastName
      email
    }
  }
`

/**
 * GraphQL mutation to update an existing user
 */
export const UpdateUserDocument = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      firstName
      lastName
      email
    }
  }
`

/**
 * GraphQL mutation to delete a user
 */
export const DeleteUserDocument = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      id
    }
  }
`

/**
 * GraphQL query to fetch a single user by ID
 */
export const GetUserDocument = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      email
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetUsersQueryResult {
  users: User[]
}

export interface GetUsersQueryVariables {
  tripId: string
}

export interface CreateUserMutationResult {
  createUser: User
}

export interface CreateUserMutationVariables {
  input: CreateUserInput
}

export interface UpdateUserMutationResult {
  updateUser: User
}

export interface UpdateUserMutationVariables {
  id: string
  input: Omit<CreateUserInput, 'tripId'>
}

export interface DeleteUserMutationResult {
  deleteUser: { id: string }
}

export interface DeleteUserMutationVariables {
  id: string
}

export interface GetUserQueryResult {
  user: User | null
}

export interface GetUserQueryVariables {
  id: string
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetUsersQueryResult {
  /** List of users for the selected trip */
  users: User[]
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
  /** Refetch the users list */
  refetch: () => void
}

export interface UseCreateUserMutationResult {
  /** Create a new user */
  createUser: (input: CreateUserInput) => Promise<User>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseUpdateUserMutationResult {
  /** Update an existing user */
  updateUser: (id: string, input: Omit<CreateUserInput, 'tripId'>) => Promise<User>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseDeleteUserMutationResult {
  /** Delete a user */
  deleteUser: (id: string) => Promise<void>
  /** Whether the mutation is loading */
  loading: boolean
  /** Error if the mutation failed */
  error: Error | null
}

export interface UseGetUserQueryResult {
  /** The user if found, null otherwise */
  user: User | null
  /** Whether the query is loading */
  loading: boolean
  /** Error if the query failed */
  error: Error | null
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch users for a specific trip
 *
 * Uses urql's useQuery with automatic cache management.
 * The cache is invalidated when users are created/updated/deleted.
 *
 * @param tripId - The trip ID to fetch users for
 * @returns Query result with users list, loading state, and error
 *
 * @example
 * ```tsx
 * const { users, loading, error } = useGetUsersQuery(tripId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 *
 * return <UserList users={users} />;
 * ```
 */
export function useGetUsersQuery(tripId: string): UseGetUsersQueryResult {
  const [result, reexecuteQuery] = useQuery<GetUsersQueryResult, GetUsersQueryVariables>({
    query: GetUsersDocument,
    variables: { tripId },
    pause: !tripId, // Don't run query if no trip is selected
  })

  const users = result.data?.users ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  return {
    users,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to create a new user
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful creation, the users list cache is invalidated.
 *
 * @returns Mutation result with create function, loading state, and error
 *
 * @example
 * ```tsx
 * const { createUser, loading } = useCreateUserMutation();
 *
 * const handleSubmit = async (input) => {
 *   const user = await createUser(input);
 *   // User created, cache automatically updated
 * };
 * ```
 */
export function useCreateUserMutation(): UseCreateUserMutationResult {
  const [result, executeMutation] = useMutation<
    CreateUserMutationResult,
    CreateUserMutationVariables
  >(CreateUserDocument)

  const createUser = async (input: CreateUserInput): Promise<User> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.createUser) {
      throw new Error('Failed to create user: no data returned')
    }

    return response.data.createUser
  }

  return {
    createUser,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to update an existing user
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful update, the user entity is automatically
 * updated in the normalized cache.
 *
 * @returns Mutation result with update function, loading state, and error
 *
 * @example
 * ```tsx
 * const { updateUser, loading } = useUpdateUserMutation();
 *
 * const handleSubmit = async (id, input) => {
 *   const user = await updateUser(id, input);
 *   // User updated, cache automatically updated
 * };
 * ```
 */
export function useUpdateUserMutation(): UseUpdateUserMutationResult {
  const [result, executeMutation] = useMutation<
    UpdateUserMutationResult,
    UpdateUserMutationVariables
  >(UpdateUserDocument)

  const updateUser = async (
    id: string,
    input: Omit<CreateUserInput, 'tripId'>
  ): Promise<User> => {
    const response = await executeMutation({ id, input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.updateUser) {
      throw new Error('Failed to update user: no data returned')
    }

    return response.data.updateUser
  }

  return {
    updateUser,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete a user
 *
 * Uses urql's useMutation with automatic cache updates.
 * After successful deletion, the user is removed from cache
 * and the users list is invalidated.
 *
 * @returns Mutation result with delete function, loading state, and error
 *
 * @example
 * ```tsx
 * const { deleteUser, loading } = useDeleteUserMutation();
 *
 * const handleDelete = async (id) => {
 *   await deleteUser(id);
 *   // User deleted, cache automatically updated
 * };
 * ```
 */
export function useDeleteUserMutation(): UseDeleteUserMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteUserMutationResult,
    DeleteUserMutationVariables
  >(DeleteUserDocument)

  const deleteUser = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteUser,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to fetch a single user by ID
 *
 * Uses urql's useQuery with cache-first policy.
 * The user will be fetched from cache if available,
 * otherwise from the network.
 *
 * @param id - The user ID to fetch
 * @returns Query result with user, loading state, and error
 *
 * @example
 * ```tsx
 * const { user, loading, error } = useGetUserQuery(userId);
 *
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!user) return <Text>User not found</Text>;
 *
 * return <UserProfile user={user} />;
 * ```
 */
export function useGetUserQuery(id: string | null): UseGetUserQueryResult {
  const [result] = useQuery<GetUserQueryResult, GetUserQueryVariables>({
    query: GetUserDocument,
    variables: { id: id ?? '' },
    pause: !id, // Don't run query if no ID provided
  })

  const user = result.data?.user ?? null
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  return {
    user,
    loading,
    error,
  }
}
