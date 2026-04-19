/**
 * Challenge Hooks - GraphQL Query, Mutation, and Subscription Hooks
 *
 * Provides urql-based hooks for challenge CRUD operations, submissions,
 * voting, and real-time subscriptions.
 *
 * @module @/components/admin/challenges/hooks
 */

'use client'

import { useQuery, useMutation, useSubscription } from 'urql'
import { gql } from '@urql/core'
import type {
  Challenge,
  ChallengeListItem,
  ChallengeSubmission,
  SubmissionWithDetails,
  CreateChallengeInput,
  UpdateChallengeInput,
  ReviewSubmissionInput,
  CastVoteInput,
  SubmitJudgementInput,
  Vote,
  Judgement,
} from './types'

// =============================================================================
// GraphQL Document Nodes
// =============================================================================

/**
 * GraphQL query to fetch challenges for a specific trip
 */
export const GetChallengesDocument = gql`
  query GetChallenges($tripId: ID!) {
    challenges(tripId: $tripId) {
      id
      name
      description
      image
      status
      submissionType
      scoringCategory
      basePoints
      submissionCount
      approvedCount
      pendingCount
      startTime
      endTime
      createdAt
    }
  }
`

/**
 * GraphQL query to fetch a single challenge by ID
 */
export const GetChallengeDocument = gql`
  query GetChallenge($id: ID!) {
    challenge(id: $id) {
      id
      name
      description
      image
      tripId
      status
      submissionType
      scoringCategory
      basePoints
      firstPlacePoints
      secondPlacePoints
      thirdPlacePoints
      isRecurring
      recurringDays
      dailyStartTime
      dailyEndTime
      startTime
      endTime
      votingDurationHours
      votingStartTime
      votingEndTime
      targetLatitude
      targetLongitude
      qrCodeValue
      textExpectedPhrase
      autoApprove
      createdAt
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to create a new challenge
 */
export const CreateChallengeDocument = gql`
  mutation CreateChallenge($input: CreateChallengeInput!) {
    createChallenge(input: $input) {
      id
      name
      description
      image
      status
      submissionType
      scoringCategory
      basePoints
      createdAt
    }
  }
`

/**
 * GraphQL mutation to update an existing challenge
 */
export const UpdateChallengeDocument = gql`
  mutation UpdateChallenge($id: ID!, $input: UpdateChallengeInput!) {
    updateChallenge(id: $id, input: $input) {
      id
      name
      description
      image
      status
      submissionType
      scoringCategory
      basePoints
      firstPlacePoints
      secondPlacePoints
      thirdPlacePoints
      isRecurring
      recurringDays
      dailyStartTime
      dailyEndTime
      startTime
      endTime
      votingDurationHours
      votingStartTime
      votingEndTime
      targetLatitude
      targetLongitude
      qrCodeValue
      textExpectedPhrase
      autoApprove
      updatedAt
    }
  }
`

/**
 * GraphQL mutation to delete a challenge
 */
export const DeleteChallengeDocument = gql`
  mutation DeleteChallenge($id: ID!) {
    deleteChallenge(id: $id) {
      id
    }
  }
`

/**
 * GraphQL mutation to change challenge status
 */
export const ChangeChallengeStatusDocument = gql`
  mutation ChangeChallengeStatus($id: ID!, $status: ChallengeStatus!) {
    changeChallengeStatus(id: $id, status: $status) {
      id
      status
    }
  }
`

/**
 * GraphQL query to fetch submissions for a challenge
 */
export const GetChallengeSubmissionsDocument = gql`
  query GetChallengeSubmissions($challengeId: ID!) {
    challengeSubmissions(challengeId: $challengeId) {
      id
      challengeId
      groupId
      groupName
      userId
      userName
      status
      content
      imageUrls
      videoUrl
      latitude
      longitude
      qrCodeValue
      createdAt
      reviewedAt
      reviewedById
      reviewedByName
      rejectionReason
    }
  }
`

/**
 * GraphQL query to fetch a single submission with details
 */
export const GetSubmissionDetailsDocument = gql`
  query GetSubmissionDetails($id: ID!) {
    challengeSubmission(id: $id) {
      id
      challengeId
      groupId
      groupName
      userId
      userName
      status
      content
      imageUrls
      videoUrl
      latitude
      longitude
      qrCodeValue
      createdAt
      reviewedAt
      reviewedById
      reviewedByName
      rejectionReason
      votes {
        id
        userId
        userName
        position
        createdAt
      }
      voteCount
      judgements {
        id
        judgeId
        judgeName
        score
        feedback
        createdAt
      }
      averageScore
      rank
    }
  }
`

/**
 * GraphQL mutation to review a submission (approve/reject)
 */
export const ReviewSubmissionDocument = gql`
  mutation ReviewSubmission($input: ReviewSubmissionInput!) {
    reviewChallengeSubmission(input: $input) {
      id
      status
      reviewedAt
      reviewedById
      reviewedByName
      rejectionReason
    }
  }
`

/**
 * GraphQL mutation to cast a vote
 */
export const CastVoteDocument = gql`
  mutation CastVote($input: CastVoteInput!) {
    castVote(input: $input) {
      id
      submissionId
      userId
      userName
      position
      createdAt
    }
  }
`

/**
 * GraphQL mutation to remove a vote
 */
export const RemoveVoteDocument = gql`
  mutation RemoveVote($submissionId: ID!) {
    removeVote(submissionId: $submissionId) {
      success
    }
  }
`

/**
 * GraphQL mutation to submit a judgement
 */
export const SubmitJudgementDocument = gql`
  mutation SubmitJudgement($input: SubmitJudgementInput!) {
    submitJudgement(input: $input) {
      id
      submissionId
      judgeId
      judgeName
      score
      feedback
      createdAt
    }
  }
`

/**
 * GraphQL mutation to update a judgement
 */
export const UpdateJudgementDocument = gql`
  mutation UpdateJudgement($id: ID!, $score: Float!, $feedback: String) {
    updateJudgement(id: $id, score: $score, feedback: $feedback) {
      id
      score
      feedback
    }
  }
`

/**
 * GraphQL mutation to delete a judgement
 */
export const DeleteJudgementDocument = gql`
  mutation DeleteJudgement($id: ID!) {
    deleteJudgement(id: $id) {
      success
    }
  }
`

/**
 * GraphQL subscription for real-time submission updates
 */
export const SubmissionUpdatesDocument = gql`
  subscription SubmissionUpdates($challengeId: ID!) {
    submissionUpdated(challengeId: $challengeId) {
      id
      challengeId
      groupId
      groupName
      userId
      userName
      status
      content
      imageUrls
      videoUrl
      createdAt
      voteCount
    }
  }
`

/**
 * GraphQL subscription for real-time vote updates
 */
export const VoteUpdatesDocument = gql`
  subscription VoteUpdates($challengeId: ID!) {
    voteUpdated(challengeId: $challengeId) {
      submissionId
      voteCount
      position
      userId
    }
  }
`

// =============================================================================
// Type Definitions for Query Results
// =============================================================================

export interface GetChallengesQueryResult {
  challenges: ChallengeListItem[]
}

export interface GetChallengesQueryVariables {
  tripId: string
}

export interface GetChallengeQueryResult {
  challenge: Challenge | null
}

export interface GetChallengeQueryVariables {
  id: string
}

export interface CreateChallengeMutationResult {
  createChallenge: ChallengeListItem
}

export interface CreateChallengeMutationVariables {
  input: CreateChallengeInput
}

export interface UpdateChallengeMutationResult {
  updateChallenge: Challenge
}

export interface UpdateChallengeMutationVariables {
  id: string
  input: UpdateChallengeInput
}

export interface DeleteChallengeMutationResult {
  deleteChallenge: { id: string }
}

export interface DeleteChallengeMutationVariables {
  id: string
}

export interface ChangeChallengeStatusMutationResult {
  changeChallengeStatus: { id: string; status: string }
}

export interface ChangeChallengeStatusMutationVariables {
  id: string
  status: string
}

export interface GetChallengeSubmissionsQueryResult {
  challengeSubmissions: ChallengeSubmission[]
}

export interface GetChallengeSubmissionsQueryVariables {
  challengeId: string
}

export interface GetSubmissionDetailsQueryResult {
  challengeSubmission: SubmissionWithDetails | null
}

export interface GetSubmissionDetailsQueryVariables {
  id: string
}

export interface ReviewSubmissionMutationResult {
  reviewChallengeSubmission: ChallengeSubmission
}

export interface ReviewSubmissionMutationVariables {
  input: ReviewSubmissionInput
}

export interface CastVoteMutationResult {
  castVote: Vote
}

export interface CastVoteMutationVariables {
  input: CastVoteInput
}

export interface RemoveVoteMutationResult {
  removeVote: { success: boolean }
}

export interface RemoveVoteMutationVariables {
  submissionId: string
}

export interface SubmitJudgementMutationResult {
  submitJudgement: Judgement
}

export interface SubmitJudgementMutationVariables {
  input: SubmitJudgementInput
}

export interface UpdateJudgementMutationResult {
  updateJudgement: Judgement
}

export interface UpdateJudgementMutationVariables {
  id: string
  score: number
  feedback?: string
}

export interface DeleteJudgementMutationResult {
  deleteJudgement: { success: boolean }
}

export interface DeleteJudgementMutationVariables {
  id: string
}

export interface SubmissionUpdatesSubscriptionResult {
  submissionUpdated: ChallengeSubmission
}

export interface SubmissionUpdatesSubscriptionVariables {
  challengeId: string
}

export interface VoteUpdatesSubscriptionResult {
  voteUpdated: {
    submissionId: string
    voteCount: number
    position: number
    userId: string
  }
}

export interface VoteUpdatesSubscriptionVariables {
  challengeId: string
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseGetChallengesQueryResult {
  challenges: ChallengeListItem[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseGetChallengeQueryResult {
  challenge: Challenge | null
  loading: boolean
  error: Error | null
}

export interface UseCreateChallengeMutationResult {
  createChallenge: (input: CreateChallengeInput) => Promise<ChallengeListItem>
  loading: boolean
  error: Error | null
}

export interface UseUpdateChallengeMutationResult {
  updateChallenge: (id: string, input: UpdateChallengeInput) => Promise<Challenge>
  loading: boolean
  error: Error | null
}

export interface UseDeleteChallengeMutationResult {
  deleteChallenge: (id: string) => Promise<void>
  loading: boolean
  error: Error | null
}

export interface UseChangeChallengeStatusMutationResult {
  changeStatus: (id: string, status: string) => Promise<void>
  loading: boolean
  error: Error | null
}

export interface UseGetChallengeSubmissionsQueryResult {
  submissions: ChallengeSubmission[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export interface UseGetSubmissionDetailsQueryResult {
  submission: SubmissionWithDetails | null
  loading: boolean
  error: Error | null
}

export interface UseReviewSubmissionMutationResult {
  reviewSubmission: (input: ReviewSubmissionInput) => Promise<ChallengeSubmission>
  loading: boolean
  error: Error | null
}

export interface UseCastVoteMutationResult {
  castVote: (input: CastVoteInput) => Promise<Vote>
  loading: boolean
  error: Error | null
}

export interface UseRemoveVoteMutationResult {
  removeVote: (submissionId: string) => Promise<void>
  loading: boolean
  error: Error | null
}

export interface UseSubmitJudgementMutationResult {
  submitJudgement: (input: SubmitJudgementInput) => Promise<Judgement>
  loading: boolean
  error: Error | null
}

export interface UseUpdateJudgementMutationResult {
  updateJudgement: (id: string, score: number, feedback?: string) => Promise<Judgement>
  loading: boolean
  error: Error | null
}

export interface UseDeleteJudgementMutationResult {
  deleteJudgement: (id: string) => Promise<void>
  loading: boolean
  error: Error | null
}

export interface UseSubmissionUpdatesSubscriptionResult {
  latestSubmission: ChallengeSubmission | null
  isSubscribing: boolean
}

export interface UseVoteUpdatesSubscriptionResult {
  latestVoteUpdate: VoteUpdatesSubscriptionResult['voteUpdated'] | null
  isSubscribing: boolean
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch challenges for a specific trip
 */
export function useGetChallengesQuery(tripId: string): UseGetChallengesQueryResult {
  const [result, reexecuteQuery] = useQuery<GetChallengesQueryResult, GetChallengesQueryVariables>({
    query: GetChallengesDocument,
    variables: { tripId },
    pause: !tripId,
  })

  const challenges = result.data?.challenges ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  return {
    challenges,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to fetch a single challenge by ID
 */
export function useGetChallengeQuery(id: string | null): UseGetChallengeQueryResult {
  const [result] = useQuery<GetChallengeQueryResult, GetChallengeQueryVariables>({
    query: GetChallengeDocument,
    variables: { id: id ?? '' },
    pause: !id,
  })

  const challenge = result.data?.challenge ?? null
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  return {
    challenge,
    loading,
    error,
  }
}

/**
 * Hook to fetch submissions for a challenge
 */
export function useGetChallengeSubmissionsQuery(challengeId: string): UseGetChallengeSubmissionsQueryResult {
  const [result, reexecuteQuery] = useQuery<GetChallengeSubmissionsQueryResult, GetChallengeSubmissionsQueryVariables>({
    query: GetChallengeSubmissionsDocument,
    variables: { challengeId },
    pause: !challengeId,
  })

  const submissions = result.data?.challengeSubmissions ?? []
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  const refetch = () => {
    reexecuteQuery({ requestPolicy: 'network-only' })
  }

  return {
    submissions,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to fetch submission details with votes and judgements
 */
export function useGetSubmissionDetailsQuery(id: string | null): UseGetSubmissionDetailsQueryResult {
  const [result] = useQuery<GetSubmissionDetailsQueryResult, GetSubmissionDetailsQueryVariables>({
    query: GetSubmissionDetailsDocument,
    variables: { id: id ?? '' },
    pause: !id,
  })

  const submission = result.data?.challengeSubmission ?? null
  const loading = result.fetching
  const error = result.error ? new Error(result.error.message) : null

  return {
    submission,
    loading,
    error,
  }
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new challenge
 */
export function useCreateChallengeMutation(): UseCreateChallengeMutationResult {
  const [result, executeMutation] = useMutation<
    CreateChallengeMutationResult,
    CreateChallengeMutationVariables
  >(CreateChallengeDocument)

  const createChallenge = async (input: CreateChallengeInput): Promise<ChallengeListItem> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.createChallenge) {
      throw new Error('Failed to create challenge: no data returned')
    }

    return response.data.createChallenge
  }

  return {
    createChallenge,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to update an existing challenge
 */
export function useUpdateChallengeMutation(): UseUpdateChallengeMutationResult {
  const [result, executeMutation] = useMutation<
    UpdateChallengeMutationResult,
    UpdateChallengeMutationVariables
  >(UpdateChallengeDocument)

  const updateChallenge = async (id: string, input: UpdateChallengeInput): Promise<Challenge> => {
    const response = await executeMutation({ id, input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.updateChallenge) {
      throw new Error('Failed to update challenge: no data returned')
    }

    return response.data.updateChallenge
  }

  return {
    updateChallenge,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete a challenge
 */
export function useDeleteChallengeMutation(): UseDeleteChallengeMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteChallengeMutationResult,
    DeleteChallengeMutationVariables
  >(DeleteChallengeDocument)

  const deleteChallenge = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteChallenge,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to change challenge status
 */
export function useChangeChallengeStatusMutation(): UseChangeChallengeStatusMutationResult {
  const [result, executeMutation] = useMutation<
    ChangeChallengeStatusMutationResult,
    ChangeChallengeStatusMutationVariables
  >(ChangeChallengeStatusDocument)

  const changeStatus = async (id: string, status: string): Promise<void> => {
    const response = await executeMutation({ id, status })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    changeStatus,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to review a submission (approve/reject)
 */
export function useReviewSubmissionMutation(): UseReviewSubmissionMutationResult {
  const [result, executeMutation] = useMutation<
    ReviewSubmissionMutationResult,
    ReviewSubmissionMutationVariables
  >(ReviewSubmissionDocument)

  const reviewSubmission = async (input: ReviewSubmissionInput): Promise<ChallengeSubmission> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.reviewChallengeSubmission) {
      throw new Error('Failed to review submission: no data returned')
    }

    return response.data.reviewChallengeSubmission
  }

  return {
    reviewSubmission,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to cast a vote on a submission
 */
export function useCastVoteMutation(): UseCastVoteMutationResult {
  const [result, executeMutation] = useMutation<
    CastVoteMutationResult,
    CastVoteMutationVariables
  >(CastVoteDocument)

  const castVote = async (input: CastVoteInput): Promise<Vote> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.castVote) {
      throw new Error('Failed to cast vote: no data returned')
    }

    return response.data.castVote
  }

  return {
    castVote,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to remove a vote
 */
export function useRemoveVoteMutation(): UseRemoveVoteMutationResult {
  const [result, executeMutation] = useMutation<
    RemoveVoteMutationResult,
    RemoveVoteMutationVariables
  >(RemoveVoteDocument)

  const removeVote = async (submissionId: string): Promise<void> => {
    const response = await executeMutation({ submissionId })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    removeVote,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to submit a judgement
 */
export function useSubmitJudgementMutation(): UseSubmitJudgementMutationResult {
  const [result, executeMutation] = useMutation<
    SubmitJudgementMutationResult,
    SubmitJudgementMutationVariables
  >(SubmitJudgementDocument)

  const submitJudgement = async (input: SubmitJudgementInput): Promise<Judgement> => {
    const response = await executeMutation({ input })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.submitJudgement) {
      throw new Error('Failed to submit judgement: no data returned')
    }

    return response.data.submitJudgement
  }

  return {
    submitJudgement,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to update a judgement
 */
export function useUpdateJudgementMutation(): UseUpdateJudgementMutationResult {
  const [result, executeMutation] = useMutation<
    UpdateJudgementMutationResult,
    UpdateJudgementMutationVariables
  >(UpdateJudgementDocument)

  const updateJudgement = async (id: string, score: number, feedback?: string): Promise<Judgement> => {
    const response = await executeMutation({ id, score, feedback })

    if (response.error) {
      throw new Error(response.error.message)
    }

    if (!response.data?.updateJudgement) {
      throw new Error('Failed to update judgement: no data returned')
    }

    return response.data.updateJudgement
  }

  return {
    updateJudgement,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

/**
 * Hook to delete a judgement
 */
export function useDeleteJudgementMutation(): UseDeleteJudgementMutationResult {
  const [result, executeMutation] = useMutation<
    DeleteJudgementMutationResult,
    DeleteJudgementMutationVariables
  >(DeleteJudgementDocument)

  const deleteJudgement = async (id: string): Promise<void> => {
    const response = await executeMutation({ id })

    if (response.error) {
      throw new Error(response.error.message)
    }
  }

  return {
    deleteJudgement,
    loading: result.fetching,
    error: result.error ? new Error(result.error.message) : null,
  }
}

// =============================================================================
// Subscription Hooks
// =============================================================================

/**
 * Hook to subscribe to real-time submission updates
 */
export function useSubmissionUpdatesSubscription(
  challengeId: string
): UseSubmissionUpdatesSubscriptionResult {
  const [result] = useSubscription<
    SubmissionUpdatesSubscriptionResult,
    SubmissionUpdatesSubscriptionVariables
  >(
    {
      query: SubmissionUpdatesDocument,
      variables: { challengeId },
      pause: !challengeId,
    }
  )

  const latestSubmission = result.data?.submissionUpdated ?? null
  const isSubscribing = !result.error && !result.fetching

  return {
    latestSubmission,
    isSubscribing,
  }
}

/**
 * Hook to subscribe to real-time vote updates
 */
export function useVoteUpdatesSubscription(
  challengeId: string
): UseVoteUpdatesSubscriptionResult {
  const [result] = useSubscription<
    VoteUpdatesSubscriptionResult,
    VoteUpdatesSubscriptionVariables
  >(
    {
      query: VoteUpdatesDocument,
      variables: { challengeId },
      pause: !challengeId,
    }
  )

  const latestVoteUpdate = result.data?.voteUpdated ?? null
  const isSubscribing = !result.error && !result.fetching

  return {
    latestVoteUpdate,
    isSubscribing,
  }
}
