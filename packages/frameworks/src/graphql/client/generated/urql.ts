import * as Types from "./types";

import gql from "graphql-tag";
import * as Urql from "@urql/core";
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export const ActivityFeedItemFieldsFragmentDoc = gql`
  fragment ActivityFeedItemFields on ActivityFeedItem {
    id
    type
    title
    description
    imageUrl
    isPinned
    isHidden
    createdAt
    updatedAt
  }
`;
export const ChallengeFieldsFragmentDoc = gql`
  fragment ChallengeFields on Challenge {
    id
    tripId
    name
    description
    submissionType
    scoringCategory
    status
    startTime
    endTime
    targetLatitude
    targetLongitude
    qrCodeValue
    basePoints
    firstPlacePoints
    secondPlacePoints
    thirdPlacePoints
    autoApprove
    isRecurring
    dailyStartTime
    dailyEndTime
    expectedValue
    image
    votingStartTime
    votingEndTime
    createdAt
    updatedAt
  }
`;
export const ChallengeWithSubmissionsFieldsFragmentDoc = gql`
  fragment ChallengeWithSubmissionsFields on Challenge {
    id
    tripId
    name
    description
    submissionType
    scoringCategory
    status
    startTime
    endTime
    basePoints
    createdAt
    updatedAt
  }
`;
export const GroupFieldsFragmentDoc = gql`
  fragment GroupFields on Group {
    id
    name
    code
    image
    coins
    description
    tripId
    isDeleted
    createdAt
    updatedAt
  }
`;
export const GroupWithDetailsFieldsFragmentDoc = gql`
  fragment GroupWithDetailsFields on GroupWithDetails {
    id
    name
    code
    description
    image
    coins
    createdAt
    updatedAt
    tripId
    participantCount
    organizer {
      id
      firstName
      lastName
      email
    }
    participants {
      id
      joinedAt
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;
export const GroupJoinRequestFieldsFragmentDoc = gql`
  fragment GroupJoinRequestFields on GroupJoinRequest {
    id
    userId
    groupId
    tripId
    status
    requestedAt
    user {
      id
      firstName
      lastName
      email
    }
  }
`;
export const GroupGallerySubmissionFieldsFragmentDoc = gql`
  fragment GroupGallerySubmissionFields on GroupGallerySubmission {
    submissionId
    challengeId
    challengeTitle
    imageStoragePath
    approvedAt
  }
`;
export const GroupRankingFieldsFragmentDoc = gql`
  fragment GroupRankingFields on GroupRankingResult {
    groups {
      id
      name
      image
      coins
      participantCount
      rank
    }
    currentDate
  }
`;
export const NotificationFieldsFragmentDoc = gql`
  fragment NotificationFields on Notification {
    id
    body
    title
    url
    tripId
    createdById
    createdAt
    updatedAt
  }
`;
export const NotificationPreferencesFieldsFragmentDoc = gql`
  fragment NotificationPreferencesFields on NotificationPreferences {
    userId
    pushEnabled
    emailEnabled
    challengeEnabled
    rankingEnabled
    systemEnabled
  }
`;
export const PageInfoFieldsFragmentDoc = gql`
  fragment PageInfoFields on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;
export const StorageUploadUrlFieldsFragmentDoc = gql`
  fragment StorageUploadUrlFields on StorageUploadUrl {
    url
    path
    expiresAt
  }
`;
export const StorageDeleteResultFieldsFragmentDoc = gql`
  fragment StorageDeleteResultFields on StorageDeleteResult {
    success
    path
  }
`;
export const ChallengeSubmissionFieldsFragmentDoc = gql`
  fragment ChallengeSubmissionFields on ChallengeSubmission {
    id
    challengeId
    groupId
    status
    textContent
    imageIds
    videoId
    latitude
    longitude
    awardedPoints
    bonusPoints
    ranking
    rejectionReason
    voteCount
    voteScore
    createdAt
    reviewedAt
  }
`;
export const SubmissionResultFieldsFragmentDoc = gql`
  fragment SubmissionResultFields on SubmissionResult {
    id
    status
  }
`;
export const TripFieldsFragmentDoc = gql`
  fragment TripFields on Trip {
    id
    name
    description
    startDate
    endDate
    location
    image
    isActive
    createdAt
    updatedAt
  }
`;
export const TripGroupFieldsFragmentDoc = gql`
  fragment TripGroupFields on TripGroup {
    id
    name
    code
    image
    coins
    participantCount
    isDeleted
  }
`;
export const TripSponsorFieldsFragmentDoc = gql`
  fragment TripSponsorFields on TripSponsor {
    id
    tripId
    sponsorId
    sponsor {
      id
      name
      logoPath
      description
      isActive
    }
  }
`;
export const TripWithDetailsFieldsFragmentDoc = gql`
  fragment TripWithDetailsFields on TripWithDetails {
    id
    name
    description
    startDate
    endDate
    location
    image
    isActive
    groups {
      ...TripGroupFields
    }
    tripSponsors {
      ...TripSponsorFields
    }
    createdAt
    updatedAt
  }
  ${TripGroupFieldsFragmentDoc}
  ${TripSponsorFieldsFragmentDoc}
`;
export const TripParticipantDetailFieldsFragmentDoc = gql`
  fragment TripParticipantDetailFields on TripParticipantDetail {
    userId
    tripId
    wristNumber
    houseNumber
    user {
      id
      firstName
      lastName
      email
      role
    }
    group {
      ...TripGroupFields
    }
  }
  ${TripGroupFieldsFragmentDoc}
`;
export const TripWithParticipantsFieldsFragmentDoc = gql`
  fragment TripWithParticipantsFields on TripWithParticipants {
    id
    name
    description
    startDate
    endDate
    location
    image
    isActive
    groups {
      ...TripGroupFields
    }
    tripSponsors {
      ...TripSponsorFields
    }
    participants {
      ...TripParticipantDetailFields
    }
    createdAt
    updatedAt
  }
  ${TripGroupFieldsFragmentDoc}
  ${TripSponsorFieldsFragmentDoc}
  ${TripParticipantDetailFieldsFragmentDoc}
`;
export const TripResourceFieldsFragmentDoc = gql`
  fragment TripResourceFields on TripResource {
    id
    tripId
    title
    description
    content
    iconName
    sortOrder
    createdAt
    updatedAt
  }
`;
export const InsuranceStepFieldsFragmentDoc = gql`
  fragment InsuranceStepFields on InsuranceStep {
    id
    stepNumber
    title
    description
  }
`;
export const TripInsuranceFieldsFragmentDoc = gql`
  fragment TripInsuranceFields on TripInsurance {
    id
    tripId
    title
    description
    provider
    policyNumber
    steps {
      ...InsuranceStepFields
    }
    createdAt
    updatedAt
  }
  ${InsuranceStepFieldsFragmentDoc}
`;
export const TripResourcesResultFieldsFragmentDoc = gql`
  fragment TripResourcesResultFields on TripResourcesResult {
    resources {
      ...TripResourceFields
    }
    insurance {
      ...TripInsuranceFields
    }
  }
  ${TripResourceFieldsFragmentDoc}
  ${TripInsuranceFieldsFragmentDoc}
`;
export const UserFieldsFragmentDoc = gql`
  fragment UserFields on User {
    id
    firstName
    lastName
    email
    role
    hasAvatar
  }
`;
export const UserProfileFieldsFragmentDoc = gql`
  fragment UserProfileFields on UserProfile {
    id
    firstName
    lastName
    email
    role
    hasAvatar
  }
`;
export const UserWithTripInfoFieldsFragmentDoc = gql`
  fragment UserWithTripInfoFields on UserWithTripInfo {
    id
    firstName
    lastName
    email
    role
    hasAvatar
    wristNumber
    houseNumber
    groupId
    groupName
    tripId
    isBanned
    bannedUntil
    banReason
  }
`;
export const UserWithGroupInfoFieldsFragmentDoc = gql`
  fragment UserWithGroupInfoFields on UserWithGroupInfo {
    id
    firstName
    lastName
    trips {
      tripId
      group {
        id
        name
      }
      trip {
        id
        name
      }
    }
    organizerGroup {
      id
      name
    }
  }
`;
export const TripParticipantInfoFieldsFragmentDoc = gql`
  fragment TripParticipantInfoFields on TripParticipantInfo {
    userId
    tripId
    wristNumber
    houseNumber
    group {
      id
      name
    }
  }
`;
export const BanStatusFieldsFragmentDoc = gql`
  fragment BanStatusFields on BanStatus {
    banned
    bannedUntil
    reason
    exists
  }
`;
export const AdminNameFieldsFragmentDoc = gql`
  fragment AdminNameFields on AdminName {
    id
    firstName
    lastName
  }
`;
export const ActivityFeedDocument = gql`
  query ActivityFeed($tripId: String!, $first: Int, $after: String) {
    activityFeed(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          type
          title
          description
          imageUrl
          isPinned
          isHidden
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
`;

export function useActivityFeedQuery(
  options: Omit<Urql.UseQueryArgs<Types.ActivityFeedQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.ActivityFeedQuery,
    Types.ActivityFeedQueryVariables
  >({ query: Types.ActivityFeedDocument, ...options });
}
export const GroupActivityDocument = gql`
  query GroupActivity($groupId: String!, $first: Int, $after: String) {
    groupActivity(groupId: $groupId, first: $first, after: $after) {
      edges {
        node {
          id
          type
          title
          description
          imageUrl
          isPinned
          isHidden
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
`;

export function useGroupActivityQuery(
  options: Omit<Urql.UseQueryArgs<Types.GroupActivityQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.GroupActivityQuery,
    Types.GroupActivityQueryVariables
  >({ query: Types.GroupActivityDocument, ...options });
}
export const CreateChallengeDocument = gql`
  mutation CreateChallenge($input: CreateChallengeInput!) {
    createChallenge(input: $input) {
      id
      name
      status
    }
  }
`;

export function useCreateChallengeMutation() {
  return Urql.useMutation<
    Types.CreateChallengeMutation,
    Types.CreateChallengeMutationVariables
  >(Types.CreateChallengeDocument);
}
export const UpdateChallengeDocument = gql`
  mutation UpdateChallenge($input: UpdateChallengeInput!) {
    updateChallenge(input: $input) {
      id
      name
      status
    }
  }
`;

export function useUpdateChallengeMutation() {
  return Urql.useMutation<
    Types.UpdateChallengeMutation,
    Types.UpdateChallengeMutationVariables
  >(Types.UpdateChallengeDocument);
}
export const DeleteChallengeDocument = gql`
  mutation DeleteChallenge($input: DeleteChallengeInput!) {
    deleteChallenge(input: $input) {
      id
      name
      status
    }
  }
`;

export function useDeleteChallengeMutation() {
  return Urql.useMutation<
    Types.DeleteChallengeMutation,
    Types.DeleteChallengeMutationVariables
  >(Types.DeleteChallengeDocument);
}
export const ForceCloseVotingDocument = gql`
  mutation ForceCloseVoting($id: String!, $tripId: String!) {
    forceCloseVoting(id: $id, tripId: $tripId) {
      id
      name
      status
    }
  }
`;

export function useForceCloseVotingMutation() {
  return Urql.useMutation<
    Types.ForceCloseVotingMutation,
    Types.ForceCloseVotingMutationVariables
  >(Types.ForceCloseVotingDocument);
}
export const ChallengesDocument = gql`
  query Challenges($tripId: String!, $first: Int, $after: String) {
    challenges(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          tripId
          name
          description
          submissionType
          scoringCategory
          status
          startTime
          endTime
          targetLatitude
          targetLongitude
          qrCodeValue
          basePoints
          firstPlacePoints
          secondPlacePoints
          thirdPlacePoints
          autoApprove
          isRecurring
          dailyStartTime
          dailyEndTime
          expectedValue
          image
          votingStartTime
          votingEndTime
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
`;

export function useChallengesQuery(
  options: Omit<Urql.UseQueryArgs<Types.ChallengesQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.ChallengesQuery, Types.ChallengesQueryVariables>({
    query: Types.ChallengesDocument,
    ...options,
  });
}
export const ChallengeDocument = gql`
  query Challenge($id: String!, $tripId: String!) {
    challenge(id: $id, tripId: $tripId) {
      id
      tripId
      name
      description
      submissionType
      scoringCategory
      status
      startTime
      endTime
      targetLatitude
      targetLongitude
      qrCodeValue
      basePoints
      firstPlacePoints
      secondPlacePoints
      thirdPlacePoints
      autoApprove
      isRecurring
      dailyStartTime
      dailyEndTime
      expectedValue
      image
      votingStartTime
      votingEndTime
      createdAt
      updatedAt
    }
  }
`;

export function useChallengeQuery(
  options: Omit<Urql.UseQueryArgs<Types.ChallengeQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.ChallengeQuery, Types.ChallengeQueryVariables>({
    query: Types.ChallengeDocument,
    ...options,
  });
}
export const AllChallengesDocument = gql`
  query AllChallenges {
    allChallenges {
      id
      tripId
      name
      description
      submissionType
      scoringCategory
      status
      startTime
      endTime
      targetLatitude
      targetLongitude
      qrCodeValue
      basePoints
      firstPlacePoints
      secondPlacePoints
      thirdPlacePoints
      autoApprove
      isRecurring
      dailyStartTime
      dailyEndTime
      expectedValue
      image
      votingStartTime
      votingEndTime
      createdAt
      updatedAt
    }
  }
`;

export function useAllChallengesQuery(
  options?: Omit<Urql.UseQueryArgs<Types.AllChallengesQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.AllChallengesQuery,
    Types.AllChallengesQueryVariables
  >({ query: Types.AllChallengesDocument, ...options });
}
export const MyGroupBalanceDocument = gql`
  query MyGroupBalance($tripId: String!) {
    myGroupBalance(tripId: $tripId) {
      groupId
      name
      coins
      totalEarned
      totalSpent
    }
  }
`;

export function useMyGroupBalanceQuery(
  options: Omit<Urql.UseQueryArgs<Types.MyGroupBalanceQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.MyGroupBalanceQuery,
    Types.MyGroupBalanceQueryVariables
  >({ query: Types.MyGroupBalanceDocument, ...options });
}
export const GroupTransactionsDocument = gql`
  query GroupTransactions($groupId: String!, $first: Int, $after: String) {
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
`;

export function useGroupTransactionsQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.GroupTransactionsQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.GroupTransactionsQuery,
    Types.GroupTransactionsQueryVariables
  >({ query: Types.GroupTransactionsDocument, ...options });
}
export const CreateGroupDocument = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      description
      code
      image
      coins
      organizer {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export function useCreateGroupMutation() {
  return Urql.useMutation<
    Types.CreateGroupMutation,
    Types.CreateGroupMutationVariables
  >(Types.CreateGroupDocument);
}
export const UpdateGroupDocument = gql`
  mutation UpdateGroup($input: UpdateGroupInput!) {
    updateGroup(input: $input) {
      id
      name
      description
      image
      organizerId
    }
  }
`;

export function useUpdateGroupMutation() {
  return Urql.useMutation<
    Types.UpdateGroupMutation,
    Types.UpdateGroupMutationVariables
  >(Types.UpdateGroupDocument);
}
export const DeleteGroupDocument = gql`
  mutation DeleteGroup($input: DeleteGroupInput!) {
    deleteGroup(input: $input) {
      left
      reassignedOrganizerId
      groupDeleted
    }
  }
`;

export function useDeleteGroupMutation() {
  return Urql.useMutation<
    Types.DeleteGroupMutation,
    Types.DeleteGroupMutationVariables
  >(Types.DeleteGroupDocument);
}
export const DeleteMyGroupDocument = gql`
  mutation DeleteMyGroup($groupId: String!) {
    deleteMyGroup(groupId: $groupId) {
      left
      reassignedOrganizerId
      groupDeleted
    }
  }
`;

export function useDeleteMyGroupMutation() {
  return Urql.useMutation<
    Types.DeleteMyGroupMutation,
    Types.DeleteMyGroupMutationVariables
  >(Types.DeleteMyGroupDocument);
}
export const JoinGroupDocument = gql`
  mutation JoinGroup($input: JoinGroupInput!) {
    joinGroup(input: $input) {
      success
      groupId
    }
  }
`;

export function useJoinGroupMutation() {
  return Urql.useMutation<
    Types.JoinGroupMutation,
    Types.JoinGroupMutationVariables
  >(Types.JoinGroupDocument);
}
export const LeaveGroupDocument = gql`
  mutation LeaveGroup($groupId: String!) {
    leaveGroup(groupId: $groupId) {
      left
      reassignedOrganizerId
      groupDeleted
    }
  }
`;

export function useLeaveGroupMutation() {
  return Urql.useMutation<
    Types.LeaveGroupMutation,
    Types.LeaveGroupMutationVariables
  >(Types.LeaveGroupDocument);
}
export const RequestJoinGroupDocument = gql`
  mutation RequestJoinGroup($input: RequestJoinGroupInput!) {
    requestJoinGroup(input: $input) {
      success
      groupId
    }
  }
`;

export function useRequestJoinGroupMutation() {
  return Urql.useMutation<
    Types.RequestJoinGroupMutation,
    Types.RequestJoinGroupMutationVariables
  >(Types.RequestJoinGroupDocument);
}
export const CancelJoinRequestDocument = gql`
  mutation CancelJoinRequest($groupId: String!) {
    cancelJoinRequest(groupId: $groupId) {
      left
      reassignedOrganizerId
      groupDeleted
    }
  }
`;

export function useCancelJoinRequestMutation() {
  return Urql.useMutation<
    Types.CancelJoinRequestMutation,
    Types.CancelJoinRequestMutationVariables
  >(Types.CancelJoinRequestDocument);
}
export const RespondToJoinRequestDocument = gql`
  mutation RespondToJoinRequest($input: RespondJoinRequestInput!) {
    respondToJoinRequest(input: $input) {
      status
    }
  }
`;

export function useRespondToJoinRequestMutation() {
  return Urql.useMutation<
    Types.RespondToJoinRequestMutation,
    Types.RespondToJoinRequestMutationVariables
  >(Types.RespondToJoinRequestDocument);
}
export const RemoveUserFromGroupDocument = gql`
  mutation RemoveUserFromGroup($userId: String!, $tripId: String!) {
    removeUserFromGroup(userId: $userId, tripId: $tripId) {
      success
      groupId
    }
  }
`;

export function useRemoveUserFromGroupMutation() {
  return Urql.useMutation<
    Types.RemoveUserFromGroupMutation,
    Types.RemoveUserFromGroupMutationVariables
  >(Types.RemoveUserFromGroupDocument);
}
export const BulkAssignUsersDocument = gql`
  mutation BulkAssignUsers($input: BulkAssignUsersInput!) {
    bulkAssignUsers(input: $input) {
      count
      participants {
        id
        joinedAt
        user {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
`;

export function useBulkAssignUsersMutation() {
  return Urql.useMutation<
    Types.BulkAssignUsersMutation,
    Types.BulkAssignUsersMutationVariables
  >(Types.BulkAssignUsersDocument);
}
export const AddGroupCoinsDocument = gql`
  mutation AddGroupCoins($input: AddGroupCoinsInput!) {
    addGroupCoins(input: $input) {
      groupId
      amount
      newCoins
      previousCoins
    }
  }
`;

export function useAddGroupCoinsMutation() {
  return Urql.useMutation<
    Types.AddGroupCoinsMutation,
    Types.AddGroupCoinsMutationVariables
  >(Types.AddGroupCoinsDocument);
}
export const MyGroupDocument = gql`
  query MyGroup($tripId: String!) {
    myGroup(tripId: $tripId) {
      ...GroupWithDetailsFields
    }
  }
  ${GroupWithDetailsFieldsFragmentDoc}
`;

export function useMyGroupQuery(
  options: Omit<Urql.UseQueryArgs<Types.MyGroupQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.MyGroupQuery, Types.MyGroupQueryVariables>({
    query: Types.MyGroupDocument,
    ...options,
  });
}
export const MyJoinRequestDocument = gql`
  query MyJoinRequest($groupId: String!) {
    myJoinRequest(groupId: $groupId) {
      ...GroupJoinRequestFields
    }
  }
  ${GroupJoinRequestFieldsFragmentDoc}
`;

export function useMyJoinRequestQuery(
  options: Omit<Urql.UseQueryArgs<Types.MyJoinRequestQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.MyJoinRequestQuery,
    Types.MyJoinRequestQueryVariables
  >({ query: Types.MyJoinRequestDocument, ...options });
}
export const GroupsDocument = gql`
  query Groups($tripId: String!, $first: Int, $after: String) {
    groups(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          name
          code
          description
          image
          coins
          createdAt
          updatedAt
          tripId
          participantCount
          organizer {
            id
            firstName
            lastName
            email
          }
          participants {
            id
            joinedAt
            user {
              id
              firstName
              lastName
              email
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useGroupsQuery(
  options: Omit<Urql.UseQueryArgs<Types.GroupsQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.GroupsQuery, Types.GroupsQueryVariables>({
    query: Types.GroupsDocument,
    ...options,
  });
}
export const GroupDocument = gql`
  query Group($id: String!) {
    group(id: $id) {
      ...GroupWithDetailsFields
    }
  }
  ${GroupWithDetailsFieldsFragmentDoc}
`;

export function useGroupQuery(
  options: Omit<Urql.UseQueryArgs<Types.GroupQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.GroupQuery, Types.GroupQueryVariables>({
    query: Types.GroupDocument,
    ...options,
  });
}
export const GroupRankingDocument = gql`
  query GroupRanking($tripId: String!) {
    groupRanking(tripId: $tripId) {
      groups {
        id
        name
        image
        coins
        participantCount
        rank
      }
      currentDate
    }
  }
`;

export function useGroupRankingQuery(
  options: Omit<Urql.UseQueryArgs<Types.GroupRankingQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.GroupRankingQuery,
    Types.GroupRankingQueryVariables
  >({ query: Types.GroupRankingDocument, ...options });
}
export const GroupListDocument = gql`
  query GroupList($tripId: String!) {
    groupList(tripId: $tripId) {
      id
      name
      code
      image
      coins
      description
      isDeleted
      tripId
      createdAt
      updatedAt
    }
  }
`;

export function useGroupListQuery(
  options: Omit<Urql.UseQueryArgs<Types.GroupListQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.GroupListQuery, Types.GroupListQueryVariables>({
    query: Types.GroupListDocument,
    ...options,
  });
}
export const PendingJoinRequestsDocument = gql`
  query PendingJoinRequests($groupId: String!) {
    pendingJoinRequests(groupId: $groupId) {
      ...GroupJoinRequestFields
    }
  }
  ${GroupJoinRequestFieldsFragmentDoc}
`;

export function usePendingJoinRequestsQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.PendingJoinRequestsQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.PendingJoinRequestsQuery,
    Types.PendingJoinRequestsQueryVariables
  >({ query: Types.PendingJoinRequestsDocument, ...options });
}
export const GroupGalleryDocument = gql`
  query GroupGallery($groupId: String!) {
    groupGallery(groupId: $groupId) {
      submissionId
      challengeId
      challengeTitle
      imageStoragePath
      approvedAt
    }
  }
`;

export function useGroupGalleryQuery(
  options: Omit<Urql.UseQueryArgs<Types.GroupGalleryQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.GroupGalleryQuery,
    Types.GroupGalleryQueryVariables
  >({ query: Types.GroupGalleryDocument, ...options });
}
export const MarkNotificationReadDocument = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) {
      ...NotificationFields
    }
  }
  ${NotificationFieldsFragmentDoc}
`;

export function useMarkNotificationReadMutation() {
  return Urql.useMutation<
    Types.MarkNotificationReadMutation,
    Types.MarkNotificationReadMutationVariables
  >(Types.MarkNotificationReadDocument);
}
export const MarkAllNotificationsReadDocument = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead {
      count
    }
  }
`;

export function useMarkAllNotificationsReadMutation() {
  return Urql.useMutation<
    Types.MarkAllNotificationsReadMutation,
    Types.MarkAllNotificationsReadMutationVariables
  >(Types.MarkAllNotificationsReadDocument);
}
export const UpdateNotificationPreferencesDocument = gql`
  mutation UpdateNotificationPreferences(
    $input: UpdateNotificationPreferencesInput!
  ) {
    updateNotificationPreferences(input: $input) {
      pushEnabled
      emailEnabled
      challengeEnabled
      rankingEnabled
      systemEnabled
    }
  }
`;

export function useUpdateNotificationPreferencesMutation() {
  return Urql.useMutation<
    Types.UpdateNotificationPreferencesMutation,
    Types.UpdateNotificationPreferencesMutationVariables
  >(Types.UpdateNotificationPreferencesDocument);
}
export const MyNotificationsDocument = gql`
  query MyNotifications($first: Int, $after: String) {
    myNotifications(first: $first, after: $after) {
      edges {
        node {
          id
          body
          title
          url
          tripId
          createdById
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
`;

export function useMyNotificationsQuery(
  options?: Omit<
    Urql.UseQueryArgs<Types.MyNotificationsQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.MyNotificationsQuery,
    Types.MyNotificationsQueryVariables
  >({ query: Types.MyNotificationsDocument, ...options });
}
export const NotificationPreferencesDocument = gql`
  query NotificationPreferences {
    notificationPreferences {
      userId
      pushEnabled
      emailEnabled
      challengeEnabled
      rankingEnabled
      systemEnabled
    }
  }
`;

export function useNotificationPreferencesQuery(
  options?: Omit<
    Urql.UseQueryArgs<Types.NotificationPreferencesQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.NotificationPreferencesQuery,
    Types.NotificationPreferencesQueryVariables
  >({ query: Types.NotificationPreferencesDocument, ...options });
}
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
`;

export function useCreateRewardMutation() {
  return Urql.useMutation<
    Types.CreateRewardMutation,
    Types.CreateRewardMutationVariables
  >(Types.CreateRewardDocument);
}
export const RedeemRewardDocument = gql`
  mutation RedeemReward($input: RedeemRewardInput!) {
    redeemReward(input: $input) {
      id
      rewardId
      groupId
      userId
      status
      redeemedAt
      reward {
        id
        name
        description
        image
        coinCost
      }
    }
  }
`;

export function useRedeemRewardMutation() {
  return Urql.useMutation<
    Types.RedeemRewardMutation,
    Types.RedeemRewardMutationVariables
  >(Types.RedeemRewardDocument);
}
export const AllRewardsDocument = gql`
  query AllRewards {
    allRewards {
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
`;

export function useAllRewardsQuery(
  options?: Omit<Urql.UseQueryArgs<Types.AllRewardsQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.AllRewardsQuery, Types.AllRewardsQueryVariables>({
    query: Types.AllRewardsDocument,
    ...options,
  });
}
export const RewardsDocument = gql`
  query Rewards($tripId: String!, $first: Int, $after: String) {
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
`;

export function useRewardsQuery(
  options: Omit<Urql.UseQueryArgs<Types.RewardsQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.RewardsQuery, Types.RewardsQueryVariables>({
    query: Types.RewardsDocument,
    ...options,
  });
}
export const MyRedeemedRewardsDocument = gql`
  query MyRedeemedRewards($tripId: String!) {
    myRedeemedRewards(tripId: $tripId) {
      id
      rewardId
      groupId
      userId
      status
      redeemedAt
      reward {
        id
        name
        description
        image
        coinCost
        availableQuantity
      }
    }
  }
`;

export function useMyRedeemedRewardsQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.MyRedeemedRewardsQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.MyRedeemedRewardsQuery,
    Types.MyRedeemedRewardsQueryVariables
  >({ query: Types.MyRedeemedRewardsDocument, ...options });
}
export const DeleteFileDocument = gql`
  mutation DeleteFile($path: String!) {
    deleteFile(path: $path) {
      success
      path
    }
  }
`;

export function useDeleteFileMutation() {
  return Urql.useMutation<
    Types.DeleteFileMutation,
    Types.DeleteFileMutationVariables
  >(Types.DeleteFileDocument);
}
export const UploadUrlDocument = gql`
  query UploadUrl($input: GetUploadUrlInput!) {
    uploadUrl(input: $input) {
      ...StorageUploadUrlFields
    }
  }
  ${StorageUploadUrlFieldsFragmentDoc}
`;

export function useUploadUrlQuery(
  options: Omit<Urql.UseQueryArgs<Types.UploadUrlQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.UploadUrlQuery, Types.UploadUrlQueryVariables>({
    query: Types.UploadUrlDocument,
    ...options,
  });
}
export const CreateSubmissionDocument = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
      status
    }
  }
`;

export function useCreateSubmissionMutation() {
  return Urql.useMutation<
    Types.CreateSubmissionMutation,
    Types.CreateSubmissionMutationVariables
  >(Types.CreateSubmissionDocument);
}
export const ReviewSubmissionDocument = gql`
  mutation ReviewSubmission($input: ReviewSubmissionInput!) {
    reviewSubmission(input: $input) {
      id
      status
    }
  }
`;

export function useReviewSubmissionMutation() {
  return Urql.useMutation<
    Types.ReviewSubmissionMutation,
    Types.ReviewSubmissionMutationVariables
  >(Types.ReviewSubmissionDocument);
}
export const MySubmissionsDocument = gql`
  query MySubmissions($tripId: String!, $first: Int, $after: String) {
    mySubmissions(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          challengeId
          groupId
          status
          textContent
          imageIds
          videoId
          latitude
          longitude
          awardedPoints
          bonusPoints
          ranking
          voteCount
          voteScore
          createdAt
          reviewedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useMySubmissionsQuery(
  options: Omit<Urql.UseQueryArgs<Types.MySubmissionsQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.MySubmissionsQuery,
    Types.MySubmissionsQueryVariables
  >({ query: Types.MySubmissionsDocument, ...options });
}
export const GroupSubmissionsDocument = gql`
  query GroupSubmissions(
    $tripId: String!
    $challengeId: String!
    $first: Int
    $after: String
  ) {
    groupSubmissions(
      tripId: $tripId
      challengeId: $challengeId
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          challengeId
          groupId
          status
          textContent
          imageIds
          videoId
          latitude
          longitude
          awardedPoints
          bonusPoints
          ranking
          voteCount
          voteScore
          createdAt
          reviewedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useGroupSubmissionsQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.GroupSubmissionsQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.GroupSubmissionsQuery,
    Types.GroupSubmissionsQueryVariables
  >({ query: Types.GroupSubmissionsDocument, ...options });
}
export const PendingSubmissionsDocument = gql`
  query PendingSubmissions($tripId: String!, $first: Int, $after: String) {
    pendingSubmissions(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          challengeId
          groupId
          status
          textContent
          imageIds
          videoId
          latitude
          longitude
          awardedPoints
          bonusPoints
          ranking
          rejectionReason
          createdAt
          reviewedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function usePendingSubmissionsQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.PendingSubmissionsQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.PendingSubmissionsQuery,
    Types.PendingSubmissionsQueryVariables
  >({ query: Types.PendingSubmissionsDocument, ...options });
}
export const CreateTripDocument = gql`
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(input: $input) {
      id
      name
      description
      startDate
      endDate
      location
      image
      isActive
    }
  }
`;

export function useCreateTripMutation() {
  return Urql.useMutation<
    Types.CreateTripMutation,
    Types.CreateTripMutationVariables
  >(Types.CreateTripDocument);
}
export const UpdateTripDocument = gql`
  mutation UpdateTrip($input: UpdateTripInput!) {
    updateTrip(input: $input) {
      id
      name
      description
      startDate
      endDate
      location
      image
      isActive
    }
  }
`;

export function useUpdateTripMutation() {
  return Urql.useMutation<
    Types.UpdateTripMutation,
    Types.UpdateTripMutationVariables
  >(Types.UpdateTripDocument);
}
export const DeleteTripDocument = gql`
  mutation DeleteTrip($input: DeleteTripInput!) {
    deleteTrip(input: $input) {
      success
    }
  }
`;

export function useDeleteTripMutation() {
  return Urql.useMutation<
    Types.DeleteTripMutation,
    Types.DeleteTripMutationVariables
  >(Types.DeleteTripDocument);
}
export const MyTripsDocument = gql`
  query MyTrips($first: Int, $after: String) {
    myTrips(first: $first, after: $after) {
      edges {
        node {
          id
          name
          description
          startDate
          endDate
          location
          image
          isActive
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
`;

export function useMyTripsQuery(
  options?: Omit<Urql.UseQueryArgs<Types.MyTripsQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.MyTripsQuery, Types.MyTripsQueryVariables>({
    query: Types.MyTripsDocument,
    ...options,
  });
}
export const TripDocument = gql`
  query Trip($id: String!) {
    trip(id: $id) {
      id
      name
      description
      startDate
      endDate
      location
      image
      isActive
      groups {
        id
        name
        code
        image
        coins
        participantCount
        isDeleted
      }
      tripSponsors {
        id
        tripId
        sponsorId
        sponsor {
          id
          name
          logoPath
          description
          isActive
        }
      }
      participants {
        userId
        tripId
        wristNumber
        houseNumber
        user {
          id
          firstName
          lastName
          email
          role
        }
        group {
          id
          name
          code
          image
          coins
          participantCount
          isDeleted
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export function useTripQuery(
  options: Omit<Urql.UseQueryArgs<Types.TripQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.TripQuery, Types.TripQueryVariables>({
    query: Types.TripDocument,
    ...options,
  });
}
export const TripAdminDocument = gql`
  query TripAdmin($id: String!) {
    tripAdmin(id: $id) {
      id
      name
      description
      startDate
      endDate
      location
      image
      isActive
      groups {
        id
        name
        code
        image
        coins
        participantCount
        isDeleted
      }
      tripSponsors {
        id
        tripId
        sponsorId
        sponsor {
          id
          name
          logoPath
          description
          isActive
        }
      }
      participants {
        userId
        tripId
        wristNumber
        houseNumber
        user {
          id
          firstName
          lastName
          email
          role
        }
        group {
          id
          name
          code
          image
          coins
          participantCount
          isDeleted
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export function useTripAdminQuery(
  options: Omit<Urql.UseQueryArgs<Types.TripAdminQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.TripAdminQuery, Types.TripAdminQueryVariables>({
    query: Types.TripAdminDocument,
    ...options,
  });
}
export const TripResourcesDocument = gql`
  query TripResources($tripId: String!) {
    tripResources(tripId: $tripId) {
      resources {
        id
        tripId
        title
        description
        content
        iconName
        sortOrder
        createdAt
        updatedAt
      }
      insurance {
        id
        tripId
        title
        description
        provider
        policyNumber
        steps {
          id
          stepNumber
          title
          description
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export function useTripResourcesQuery(
  options: Omit<Urql.UseQueryArgs<Types.TripResourcesQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.TripResourcesQuery,
    Types.TripResourcesQueryVariables
  >({ query: Types.TripResourcesDocument, ...options });
}
export const UpdateMyProfileDocument = gql`
  mutation UpdateMyProfile($input: UpdateUserProfileInput!) {
    updateMyProfile(input: $input) {
      id
      firstName
      lastName
    }
  }
`;

export function useUpdateMyProfileMutation() {
  return Urql.useMutation<
    Types.UpdateMyProfileMutation,
    Types.UpdateMyProfileMutationVariables
  >(Types.UpdateMyProfileDocument);
}
export const UpdateAvatarDocument = gql`
  mutation UpdateAvatar($input: UpdateAvatarInput!) {
    updateAvatar(input: $input) {
      hasAvatar
    }
  }
`;

export function useUpdateAvatarMutation() {
  return Urql.useMutation<
    Types.UpdateAvatarMutation,
    Types.UpdateAvatarMutationVariables
  >(Types.UpdateAvatarDocument);
}
export const CreateUserDocument = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      firstName
      lastName
      email
      role
      wristNumber
      houseNumber
      groupId
      groupName
      tripId
    }
  }
`;

export function useCreateUserMutation() {
  return Urql.useMutation<
    Types.CreateUserMutation,
    Types.CreateUserMutationVariables
  >(Types.CreateUserDocument);
}
export const UpdateUserRoleDocument = gql`
  mutation UpdateUserRole($input: UpdateUserRoleInput!) {
    updateUserRole(input: $input) {
      id
      firstName
      lastName
      email
      role
    }
  }
`;

export function useUpdateUserRoleMutation() {
  return Urql.useMutation<
    Types.UpdateUserRoleMutation,
    Types.UpdateUserRoleMutationVariables
  >(Types.UpdateUserRoleDocument);
}
export const UpdateUserNameDocument = gql`
  mutation UpdateUserName($input: UpdateUserNameInput!) {
    updateUserName(input: $input) {
      id
      firstName
      lastName
      email
      role
    }
  }
`;

export function useUpdateUserNameMutation() {
  return Urql.useMutation<
    Types.UpdateUserNameMutation,
    Types.UpdateUserNameMutationVariables
  >(Types.UpdateUserNameDocument);
}
export const BanUserDocument = gql`
  mutation BanUser($input: BanUserInput!) {
    banUser(input: $input) {
      bannedUntil
    }
  }
`;

export function useBanUserMutation() {
  return Urql.useMutation<
    Types.BanUserMutation,
    Types.BanUserMutationVariables
  >(Types.BanUserDocument);
}
export const DeleteUserDocument = gql`
  mutation DeleteUser($input: DeleteUserInput!) {
    deleteUser(input: $input) {
      deletedFromSystem
    }
  }
`;

export function useDeleteUserMutation() {
  return Urql.useMutation<
    Types.DeleteUserMutation,
    Types.DeleteUserMutationVariables
  >(Types.DeleteUserDocument);
}
export const UpdateWristNumberDocument = gql`
  mutation UpdateWristNumber($input: UpdateWristNumberInput!) {
    updateWristNumber(input: $input) {
      userId
      tripId
      wristNumber
      houseNumber
    }
  }
`;

export function useUpdateWristNumberMutation() {
  return Urql.useMutation<
    Types.UpdateWristNumberMutation,
    Types.UpdateWristNumberMutationVariables
  >(Types.UpdateWristNumberDocument);
}
export const RemoveWristNumberDocument = gql`
  mutation RemoveWristNumber($userId: String!, $tripId: String!) {
    removeWristNumber(userId: $userId, tripId: $tripId) {
      userId
      tripId
      wristNumber
      houseNumber
    }
  }
`;

export function useRemoveWristNumberMutation() {
  return Urql.useMutation<
    Types.RemoveWristNumberMutation,
    Types.RemoveWristNumberMutationVariables
  >(Types.RemoveWristNumberDocument);
}
export const UpdateHouseNumberDocument = gql`
  mutation UpdateHouseNumber($input: UpdateHouseNumberInput!) {
    updateHouseNumber(input: $input) {
      userId
      tripId
      wristNumber
      houseNumber
    }
  }
`;

export function useUpdateHouseNumberMutation() {
  return Urql.useMutation<
    Types.UpdateHouseNumberMutation,
    Types.UpdateHouseNumberMutationVariables
  >(Types.UpdateHouseNumberDocument);
}
export const RemoveHouseNumberDocument = gql`
  mutation RemoveHouseNumber($userId: String!, $tripId: String!) {
    removeHouseNumber(userId: $userId, tripId: $tripId) {
      userId
      tripId
      wristNumber
      houseNumber
    }
  }
`;

export function useRemoveHouseNumberMutation() {
  return Urql.useMutation<
    Types.RemoveHouseNumberMutation,
    Types.RemoveHouseNumberMutationVariables
  >(Types.RemoveHouseNumberDocument);
}
export const MeDocument = gql`
  query Me {
    me {
      id
      firstName
      lastName
      email
      role
      hasAvatar
    }
  }
`;

export function useMeQuery(
  options?: Omit<Urql.UseQueryArgs<Types.MeQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.MeQuery, Types.MeQueryVariables>({
    query: Types.MeDocument,
    ...options,
  });
}
export const MyBanStatusDocument = gql`
  query MyBanStatus {
    myBanStatus {
      banned
      bannedUntil
      reason
      exists
    }
  }
`;

export function useMyBanStatusQuery(
  options?: Omit<Urql.UseQueryArgs<Types.MyBanStatusQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.MyBanStatusQuery, Types.MyBanStatusQueryVariables>(
    { query: Types.MyBanStatusDocument, ...options },
  );
}
export const MyGroupInfoDocument = gql`
  query MyGroupInfo($tripId: String!) {
    myGroupInfo(tripId: $tripId) {
      id
      firstName
      lastName
      trips {
        tripId
        group {
          id
          name
        }
        trip {
          id
          name
        }
      }
      organizerGroup {
        id
        name
      }
    }
  }
`;

export function useMyGroupInfoQuery(
  options: Omit<Urql.UseQueryArgs<Types.MyGroupInfoQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.MyGroupInfoQuery, Types.MyGroupInfoQueryVariables>(
    { query: Types.MyGroupInfoDocument, ...options },
  );
}
export const UserDocument = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      firstName
      lastName
      email
      role
      hasAvatar
    }
  }
`;

export function useUserQuery(
  options: Omit<Urql.UseQueryArgs<Types.UserQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.UserQuery, Types.UserQueryVariables>({
    query: Types.UserDocument,
    ...options,
  });
}
export const UserWithGroupDocument = gql`
  query UserWithGroup($id: String!, $tripId: String!) {
    userWithGroup(id: $id, tripId: $tripId) {
      id
      firstName
      lastName
      trips {
        tripId
        group {
          id
          name
        }
        trip {
          id
          name
        }
      }
      organizerGroup {
        id
        name
      }
    }
  }
`;

export function useUserWithGroupQuery(
  options: Omit<Urql.UseQueryArgs<Types.UserWithGroupQueryVariables>, "query">,
) {
  return Urql.useQuery<
    Types.UserWithGroupQuery,
    Types.UserWithGroupQueryVariables
  >({ query: Types.UserWithGroupDocument, ...options });
}
export const TripParticipantDocument = gql`
  query TripParticipant($userId: String!, $tripId: String!) {
    tripParticipant(userId: $userId, tripId: $tripId) {
      userId
      tripId
      wristNumber
      houseNumber
      group {
        id
        name
      }
    }
  }
`;

export function useTripParticipantQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.TripParticipantQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.TripParticipantQuery,
    Types.TripParticipantQueryVariables
  >({ query: Types.TripParticipantDocument, ...options });
}
export const BanStatusByEmailDocument = gql`
  query BanStatusByEmail($input: GetUserByEmailInput!) {
    banStatusByEmail(input: $input) {
      banned
      bannedUntil
      reason
      exists
    }
  }
`;

export function useBanStatusByEmailQuery(
  options: Omit<
    Urql.UseQueryArgs<Types.BanStatusByEmailQueryVariables>,
    "query"
  >,
) {
  return Urql.useQuery<
    Types.BanStatusByEmailQuery,
    Types.BanStatusByEmailQueryVariables
  >({ query: Types.BanStatusByEmailDocument, ...options });
}
export const UsersDocument = gql`
  query Users($tripId: String!, $first: Int, $after: String) {
    users(tripId: $tripId, first: $first, after: $after) {
      edges {
        node {
          id
          firstName
          lastName
          email
          role
          hasAvatar
          wristNumber
          houseNumber
          groupId
          groupName
          tripId
          isBanned
          bannedUntil
          banReason
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useUsersQuery(
  options: Omit<Urql.UseQueryArgs<Types.UsersQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.UsersQuery, Types.UsersQueryVariables>({
    query: Types.UsersDocument,
    ...options,
  });
}
export const SearchUsersDocument = gql`
  query SearchUsers(
    $tripId: String!
    $field: String!
    $searchTerm: String
    $first: Int
    $after: String
  ) {
    searchUsers(
      tripId: $tripId
      field: $field
      searchTerm: $searchTerm
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          firstName
          lastName
          email
          role
          hasAvatar
          wristNumber
          houseNumber
          groupId
          groupName
          tripId
          isBanned
          bannedUntil
          banReason
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function useSearchUsersQuery(
  options: Omit<Urql.UseQueryArgs<Types.SearchUsersQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.SearchUsersQuery, Types.SearchUsersQueryVariables>(
    { query: Types.SearchUsersDocument, ...options },
  );
}
export const AdminNamesDocument = gql`
  query AdminNames {
    adminNames {
      id
      firstName
      lastName
    }
  }
`;

export function useAdminNamesQuery(
  options?: Omit<Urql.UseQueryArgs<Types.AdminNamesQueryVariables>, "query">,
) {
  return Urql.useQuery<Types.AdminNamesQuery, Types.AdminNamesQueryVariables>({
    query: Types.AdminNamesDocument,
    ...options,
  });
}
export const ActivityFeedEventDocument = gql`
  subscription ActivityFeedEvent($filter: ActivityFeedSubscriptionFilter!) {
    activityFeedEvent(filter: $filter) {
      id
      type
      title
      description
      groupId
      userId
      metadata
      createdAt
    }
  }
`;

export function useActivityFeedEventSubscription<
  TData = Types.ActivityFeedEventSubscription,
>(
  options: Omit<
    Urql.UseSubscriptionArgs<Types.ActivityFeedEventSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<
    Types.ActivityFeedEventSubscription,
    TData
  >,
) {
  return Urql.useSubscription<
    Types.ActivityFeedEventSubscription,
    TData,
    Types.ActivityFeedEventSubscriptionVariables
  >({ query: Types.ActivityFeedEventDocument, ...options }, handler);
}
export const ChallengeStatusEventDocument = gql`
  subscription ChallengeStatusEvent($filter: ChallengeSubscriptionFilter!) {
    challengeStatusEvent(filter: $filter) {
      challengeId
      tripId
      previousStatus
      newStatus
      changedAt
    }
  }
`;

export function useChallengeStatusEventSubscription<
  TData = Types.ChallengeStatusEventSubscription,
>(
  options: Omit<
    Urql.UseSubscriptionArgs<Types.ChallengeStatusEventSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<
    Types.ChallengeStatusEventSubscription,
    TData
  >,
) {
  return Urql.useSubscription<
    Types.ChallengeStatusEventSubscription,
    TData,
    Types.ChallengeStatusEventSubscriptionVariables
  >({ query: Types.ChallengeStatusEventDocument, ...options }, handler);
}
export const JoinRequestEventDocument = gql`
  subscription JoinRequestEvent($filter: JoinRequestSubscriptionFilter) {
    joinRequestEvent(filter: $filter) {
      requestId
      groupId
      userId
      userName
      eventType
      createdAt
    }
  }
`;

export function useJoinRequestEventSubscription<
  TData = Types.JoinRequestEventSubscription,
>(
  options?: Omit<
    Urql.UseSubscriptionArgs<Types.JoinRequestEventSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<Types.JoinRequestEventSubscription, TData>,
) {
  return Urql.useSubscription<
    Types.JoinRequestEventSubscription,
    TData,
    Types.JoinRequestEventSubscriptionVariables
  >({ query: Types.JoinRequestEventDocument, ...options }, handler);
}
export const FriendLocationEventDocument = gql`
  subscription FriendLocationEvent($friendId: ID!) {
    friendLocationEvent(friendId: $friendId) {
      userId
      firstName
      lastName
      image
      latitude
      longitude
      accuracy
      isOnline
      timestamp
    }
  }
`;

export function useFriendLocationEventSubscription<
  TData = Types.FriendLocationEventSubscription,
>(
  options: Omit<
    Urql.UseSubscriptionArgs<Types.FriendLocationEventSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<
    Types.FriendLocationEventSubscription,
    TData
  >,
) {
  return Urql.useSubscription<
    Types.FriendLocationEventSubscription,
    TData,
    Types.FriendLocationEventSubscriptionVariables
  >({ query: Types.FriendLocationEventDocument, ...options }, handler);
}
export const NotificationReceivedDocument = gql`
  subscription NotificationReceived {
    notificationReceived {
      id
      type
      priority
      title
      body
      data
      receivedAt
    }
  }
`;

export function useNotificationReceivedSubscription<
  TData = Types.NotificationReceivedSubscription,
>(
  options?: Omit<
    Urql.UseSubscriptionArgs<Types.NotificationReceivedSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<
    Types.NotificationReceivedSubscription,
    TData
  >,
) {
  return Urql.useSubscription<
    Types.NotificationReceivedSubscription,
    TData,
    Types.NotificationReceivedSubscriptionVariables
  >({ query: Types.NotificationReceivedDocument, ...options }, handler);
}
export const GroupRankingEventDocument = gql`
  subscription GroupRankingEvent($filter: GroupSubscriptionFilter!) {
    groupRankingEvent(filter: $filter) {
      groupId
      tripId
      previousRank
      newRank
      coinChange
      changedAt
    }
  }
`;

export function useGroupRankingEventSubscription<
  TData = Types.GroupRankingEventSubscription,
>(
  options: Omit<
    Urql.UseSubscriptionArgs<Types.GroupRankingEventSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<
    Types.GroupRankingEventSubscription,
    TData
  >,
) {
  return Urql.useSubscription<
    Types.GroupRankingEventSubscription,
    TData,
    Types.GroupRankingEventSubscriptionVariables
  >({ query: Types.GroupRankingEventDocument, ...options }, handler);
}
export const SubmissionReviewedDocument = gql`
  subscription SubmissionReviewed($filter: SubmissionSubscriptionFilter!) {
    submissionReviewed(filter: $filter) {
      submissionId
      challengeId
      groupId
      status
      awardedPoints
      reviewedAt
    }
  }
`;

export function useSubmissionReviewedSubscription<
  TData = Types.SubmissionReviewedSubscription,
>(
  options: Omit<
    Urql.UseSubscriptionArgs<Types.SubmissionReviewedSubscriptionVariables>,
    "query"
  >,
  handler?: Urql.SubscriptionHandler<
    Types.SubmissionReviewedSubscription,
    TData
  >,
) {
  return Urql.useSubscription<
    Types.SubmissionReviewedSubscription,
    TData,
    Types.SubmissionReviewedSubscriptionVariables
  >({ query: Types.SubmissionReviewedDocument, ...options }, handler);
}
