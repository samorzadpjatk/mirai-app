import * as Types from "./types";

export type ActivityFeedItemFieldsFragment = {
  id: string | null;
  type: string | null;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean | null;
  isHidden: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "ActivityFeedItem" };

export type ChallengeFieldsFragment = {
  id: string | null;
  tripId: string | null;
  name: string | null;
  description: string | null;
  submissionType: Types.SubmissionType | null;
  scoringCategory: Types.ScoringCategory | null;
  status: Types.ChallengeStatus | null;
  startTime: Date | null;
  endTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  qrCodeValue: string | null;
  basePoints: number | null;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  autoApprove: boolean | null;
  isRecurring: boolean | null;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  expectedValue: string | null;
  image: string | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "Challenge" };

export type ChallengeWithSubmissionsFieldsFragment = {
  id: string | null;
  tripId: string | null;
  name: string | null;
  description: string | null;
  submissionType: Types.SubmissionType | null;
  scoringCategory: Types.ScoringCategory | null;
  status: Types.ChallengeStatus | null;
  startTime: Date | null;
  endTime: Date | null;
  basePoints: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "Challenge" };

export type GroupFieldsFragment = {
  id: string | null;
  name: string | null;
  code: string | null;
  image: string | null;
  coins: number | null;
  description: string | null;
  tripId: string | null;
  isDeleted: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "Group" };

export type GroupWithDetailsFieldsFragment = {
  id: string | null;
  name: string | null;
  code: string | null;
  description: string | null;
  image: string | null;
  coins: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  tripId: string | null;
  participantCount: number | null;
  organizer:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
      } & { __typename?: "GroupMember" })
    | null;
  participants: Array<
    {
      id: string | null;
      joinedAt: Date | null;
      user:
        | ({
            id: string | null;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
          } & { __typename?: "GroupMember" })
        | null;
    } & { __typename?: "GroupParticipant" }
  > | null;
} & { __typename?: "GroupWithDetails" };

export type GroupJoinRequestFieldsFragment = {
  id: string | null;
  userId: string | null;
  groupId: string | null;
  tripId: string | null;
  status: string | null;
  requestedAt: Date | null;
  user:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
      } & { __typename?: "GroupMember" })
    | null;
} & { __typename?: "GroupJoinRequest" };

export type GroupGallerySubmissionFieldsFragment = {
  submissionId: string | null;
  challengeId: string | null;
  challengeTitle: string | null;
  imageStoragePath: string | null;
  approvedAt: Date | null;
} & { __typename?: "GroupGallerySubmission" };

export type GroupRankingFieldsFragment = {
  currentDate: Date | null;
  groups: Array<
    {
      id: string | null;
      name: string | null;
      image: string | null;
      coins: number | null;
      participantCount: number | null;
      rank: number | null;
    } & { __typename?: "GroupRankingEntry" }
  > | null;
} & { __typename?: "GroupRankingResult" };

export type NotificationFieldsFragment = {
  id: string | null;
  body: string | null;
  title: string | null;
  url: string | null;
  tripId: string | null;
  createdById: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "Notification" };

export type NotificationPreferencesFieldsFragment = {
  userId: string | null;
  pushEnabled: boolean | null;
  emailEnabled: boolean | null;
  challengeEnabled: boolean | null;
  rankingEnabled: boolean | null;
  systemEnabled: boolean | null;
} & { __typename?: "NotificationPreferences" };

export type PageInfoFieldsFragment = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
} & { __typename?: "PageInfo" };

export type StorageUploadUrlFieldsFragment = {
  url: string | null;
  path: string | null;
  expiresAt: Date | null;
} & { __typename?: "StorageUploadUrl" };

export type StorageDeleteResultFieldsFragment = {
  success: boolean | null;
  path: string | null;
} & { __typename?: "StorageDeleteResult" };

export type ChallengeSubmissionFieldsFragment = {
  id: string | null;
  challengeId: string | null;
  groupId: string | null;
  status: Types.SubmissionStatus | null;
  textContent: string | null;
  imageIds: Array<string> | null;
  videoId: string | null;
  latitude: number | null;
  longitude: number | null;
  awardedPoints: number | null;
  bonusPoints: number | null;
  ranking: number | null;
  rejectionReason: string | null;
  voteCount: number | null;
  voteScore: number | null;
  createdAt: Date | null;
  reviewedAt: Date | null;
} & { __typename?: "ChallengeSubmission" };

export type SubmissionResultFieldsFragment = {
  id: string | null;
  status: string | null;
} & { __typename?: "SubmissionResult" };

export type TripFieldsFragment = {
  id: string | null;
  name: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  image: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "Trip" };

export type TripGroupFieldsFragment = {
  id: string | null;
  name: string | null;
  code: string | null;
  image: string | null;
  coins: number | null;
  participantCount: number | null;
  isDeleted: boolean | null;
} & { __typename?: "TripGroup" };

export type TripSponsorFieldsFragment = {
  id: string | null;
  tripId: string | null;
  sponsorId: string | null;
  sponsor:
    | ({
        id: string | null;
        name: string | null;
        logoPath: string | null;
        description: string | null;
        isActive: boolean | null;
      } & { __typename?: "Sponsor" })
    | null;
} & { __typename?: "TripSponsor" };

export type TripParticipantDetailFieldsFragment = {
  userId: string | null;
  tripId: string | null;
  wristNumber: string | null;
  houseNumber: string | null;
  user:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: string | null;
      } & { __typename?: "TripParticipantUser" })
    | null;
  group:
    | ({
        id: string | null;
        name: string | null;
        code: string | null;
        image: string | null;
        coins: number | null;
        participantCount: number | null;
        isDeleted: boolean | null;
      } & { __typename?: "TripGroup" })
    | null;
} & { __typename?: "TripParticipantDetail" };

export type TripWithDetailsFieldsFragment = {
  id: string | null;
  name: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  image: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  groups: Array<
    {
      id: string | null;
      name: string | null;
      code: string | null;
      image: string | null;
      coins: number | null;
      participantCount: number | null;
      isDeleted: boolean | null;
    } & { __typename?: "TripGroup" }
  > | null;
  tripSponsors: Array<
    {
      id: string | null;
      tripId: string | null;
      sponsorId: string | null;
      sponsor:
        | ({
            id: string | null;
            name: string | null;
            logoPath: string | null;
            description: string | null;
            isActive: boolean | null;
          } & { __typename?: "Sponsor" })
        | null;
    } & { __typename?: "TripSponsor" }
  > | null;
} & { __typename?: "TripWithDetails" };

export type TripWithParticipantsFieldsFragment = {
  id: string | null;
  name: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  image: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  groups: Array<
    {
      id: string | null;
      name: string | null;
      code: string | null;
      image: string | null;
      coins: number | null;
      participantCount: number | null;
      isDeleted: boolean | null;
    } & { __typename?: "TripGroup" }
  > | null;
  tripSponsors: Array<
    {
      id: string | null;
      tripId: string | null;
      sponsorId: string | null;
      sponsor:
        | ({
            id: string | null;
            name: string | null;
            logoPath: string | null;
            description: string | null;
            isActive: boolean | null;
          } & { __typename?: "Sponsor" })
        | null;
    } & { __typename?: "TripSponsor" }
  > | null;
  participants: Array<
    {
      userId: string | null;
      tripId: string | null;
      wristNumber: string | null;
      houseNumber: string | null;
      user:
        | ({
            id: string | null;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
            role: string | null;
          } & { __typename?: "TripParticipantUser" })
        | null;
      group:
        | ({
            id: string | null;
            name: string | null;
            code: string | null;
            image: string | null;
            coins: number | null;
            participantCount: number | null;
            isDeleted: boolean | null;
          } & { __typename?: "TripGroup" })
        | null;
    } & { __typename?: "TripParticipantDetail" }
  > | null;
} & { __typename?: "TripWithParticipants" };

export type TripResourceFieldsFragment = {
  id: string | null;
  tripId: string | null;
  title: string | null;
  description: string | null;
  content: string | null;
  iconName: string | null;
  sortOrder: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
} & { __typename?: "TripResource" };

export type InsuranceStepFieldsFragment = {
  id: string | null;
  stepNumber: number | null;
  title: string | null;
  description: string | null;
} & { __typename?: "InsuranceStep" };

export type TripInsuranceFieldsFragment = {
  id: string | null;
  tripId: string | null;
  title: string | null;
  description: string | null;
  provider: string | null;
  policyNumber: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  steps: Array<
    {
      id: string | null;
      stepNumber: number | null;
      title: string | null;
      description: string | null;
    } & { __typename?: "InsuranceStep" }
  > | null;
} & { __typename?: "TripInsurance" };

export type TripResourcesResultFieldsFragment = {
  resources: Array<
    {
      id: string | null;
      tripId: string | null;
      title: string | null;
      description: string | null;
      content: string | null;
      iconName: string | null;
      sortOrder: number | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    } & { __typename?: "TripResource" }
  > | null;
  insurance:
    | ({
        id: string | null;
        tripId: string | null;
        title: string | null;
        description: string | null;
        provider: string | null;
        policyNumber: string | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        steps: Array<
          {
            id: string | null;
            stepNumber: number | null;
            title: string | null;
            description: string | null;
          } & { __typename?: "InsuranceStep" }
        > | null;
      } & { __typename?: "TripInsurance" })
    | null;
} & { __typename?: "TripResourcesResult" };

export type UserFieldsFragment = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: Types.Role | null;
  hasAvatar: boolean | null;
} & { __typename?: "User" };

export type UserProfileFieldsFragment = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: Types.Role | null;
  hasAvatar: boolean | null;
} & { __typename?: "UserProfile" };

export type UserWithTripInfoFieldsFragment = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: Types.Role | null;
  hasAvatar: boolean | null;
  wristNumber: string | null;
  houseNumber: string | null;
  groupId: string | null;
  groupName: string | null;
  tripId: string | null;
  isBanned: boolean | null;
  bannedUntil: string | null;
  banReason: string | null;
} & { __typename?: "UserWithTripInfo" };

export type UserWithGroupInfoFieldsFragment = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  trips: Array<
    {
      tripId: string | null;
      group:
        | ({ id: string | null; name: string | null } & {
            __typename?: "GroupInfo";
          })
        | null;
      trip:
        | ({ id: string | null; name: string | null } & {
            __typename?: "TripInfo";
          })
        | null;
    } & { __typename?: "UserTripInfo" }
  > | null;
  organizerGroup:
    | ({ id: string | null; name: string | null } & {
        __typename?: "GroupInfo";
      })
    | null;
} & { __typename?: "UserWithGroupInfo" };

export type TripParticipantInfoFieldsFragment = {
  userId: string | null;
  tripId: string | null;
  wristNumber: string | null;
  houseNumber: string | null;
  group:
    | ({ id: string | null; name: string | null } & {
        __typename?: "GroupInfo";
      })
    | null;
} & { __typename?: "TripParticipantInfo" };

export type BanStatusFieldsFragment = {
  banned: boolean | null;
  bannedUntil: string | null;
  reason: string | null;
  exists: boolean | null;
} & { __typename?: "BanStatus" };

export type AdminNameFieldsFragment = {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
} & { __typename?: "AdminName" };

export type ActivityFeedQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type ActivityFeedQuery = {
  activityFeed:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    type: string | null;
                    title: string | null;
                    description: string | null;
                    imageUrl: string | null;
                    isPinned: boolean | null;
                    isHidden: boolean | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                  } & { __typename?: "ActivityFeedItem" })
                | null;
            } & { __typename?: "ActivityFeedEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "ActivityFeedConnection" })
    | null;
} & { __typename?: "Query" };

export type GroupActivityQueryVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type GroupActivityQuery = {
  groupActivity:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    type: string | null;
                    title: string | null;
                    description: string | null;
                    imageUrl: string | null;
                    isPinned: boolean | null;
                    isHidden: boolean | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                  } & { __typename?: "ActivityFeedItem" })
                | null;
            } & { __typename?: "ActivityFeedEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "ActivityFeedConnection" })
    | null;
} & { __typename?: "Query" };

export type CreateChallengeMutationVariables = Types.Exact<{
  input: Types.CreateChallengeInput;
}>;

export type CreateChallengeMutation = {
  createChallenge:
    | ({
        id: string | null;
        name: string | null;
        status: Types.ChallengeStatus | null;
      } & { __typename?: "ChallengeResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateChallengeMutationVariables = Types.Exact<{
  input: Types.UpdateChallengeInput;
}>;

export type UpdateChallengeMutation = {
  updateChallenge:
    | ({
        id: string | null;
        name: string | null;
        status: Types.ChallengeStatus | null;
      } & { __typename?: "ChallengeResult" })
    | null;
} & { __typename?: "Mutation" };

export type DeleteChallengeMutationVariables = Types.Exact<{
  input: Types.DeleteChallengeInput;
}>;

export type DeleteChallengeMutation = {
  deleteChallenge:
    | ({
        id: string | null;
        name: string | null;
        status: Types.ChallengeStatus | null;
      } & { __typename?: "ChallengeResult" })
    | null;
} & { __typename?: "Mutation" };

export type ForceCloseVotingMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type ForceCloseVotingMutation = {
  forceCloseVoting:
    | ({ id: string | null; name: string | null; status: string | null } & {
        __typename?: "ForceCloseVotingResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type ChallengesQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type ChallengesQuery = {
  challenges:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    tripId: string | null;
                    name: string | null;
                    description: string | null;
                    submissionType: Types.SubmissionType | null;
                    scoringCategory: Types.ScoringCategory | null;
                    status: Types.ChallengeStatus | null;
                    startTime: Date | null;
                    endTime: Date | null;
                    targetLatitude: number | null;
                    targetLongitude: number | null;
                    qrCodeValue: string | null;
                    basePoints: number | null;
                    firstPlacePoints: number | null;
                    secondPlacePoints: number | null;
                    thirdPlacePoints: number | null;
                    autoApprove: boolean | null;
                    isRecurring: boolean | null;
                    dailyStartTime: string | null;
                    dailyEndTime: string | null;
                    expectedValue: string | null;
                    image: string | null;
                    votingStartTime: Date | null;
                    votingEndTime: Date | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                  } & { __typename?: "Challenge" })
                | null;
            } & { __typename?: "ChallengeEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "ChallengeConnection" })
    | null;
} & { __typename?: "Query" };

export type ChallengeQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type ChallengeQuery = {
  challenge:
    | ({
        id: string | null;
        tripId: string | null;
        name: string | null;
        description: string | null;
        submissionType: Types.SubmissionType | null;
        scoringCategory: Types.ScoringCategory | null;
        status: Types.ChallengeStatus | null;
        startTime: Date | null;
        endTime: Date | null;
        targetLatitude: number | null;
        targetLongitude: number | null;
        qrCodeValue: string | null;
        basePoints: number | null;
        firstPlacePoints: number | null;
        secondPlacePoints: number | null;
        thirdPlacePoints: number | null;
        autoApprove: boolean | null;
        isRecurring: boolean | null;
        dailyStartTime: string | null;
        dailyEndTime: string | null;
        expectedValue: string | null;
        image: string | null;
        votingStartTime: Date | null;
        votingEndTime: Date | null;
        createdAt: Date | null;
        updatedAt: Date | null;
      } & { __typename?: "Challenge" })
    | null;
} & { __typename?: "Query" };

export type AllChallengesQueryVariables = Types.Exact<{ [key: string]: never }>;

export type AllChallengesQuery = {
  allChallenges: Array<
    {
      id: string | null;
      tripId: string | null;
      name: string | null;
      description: string | null;
      submissionType: Types.SubmissionType | null;
      scoringCategory: Types.ScoringCategory | null;
      status: Types.ChallengeStatus | null;
      startTime: Date | null;
      endTime: Date | null;
      targetLatitude: number | null;
      targetLongitude: number | null;
      qrCodeValue: string | null;
      basePoints: number | null;
      firstPlacePoints: number | null;
      secondPlacePoints: number | null;
      thirdPlacePoints: number | null;
      autoApprove: boolean | null;
      isRecurring: boolean | null;
      dailyStartTime: string | null;
      dailyEndTime: string | null;
      expectedValue: string | null;
      image: string | null;
      votingStartTime: Date | null;
      votingEndTime: Date | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    } & { __typename?: "Challenge" }
  > | null;
} & { __typename?: "Query" };

export type MyGroupBalanceQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type MyGroupBalanceQuery = {
  myGroupBalance:
    | ({
        groupId: string | null;
        name: string | null;
        coins: number | null;
        totalEarned: number | null;
        totalSpent: number | null;
      } & { __typename?: "CoinBalance" })
    | null;
} & { __typename?: "Query" };

export type GroupTransactionsQueryVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type GroupTransactionsQuery = {
  groupTransactions:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    groupId: string | null;
                    amount: number | null;
                    reason: string | null;
                    adminId: string | null;
                    createdAt: Date | null;
                  } & { __typename?: "CoinTransaction" })
                | null;
            } & { __typename?: "CoinTransactionEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "CoinTransactionConnection" })
    | null;
} & { __typename?: "Query" };

export type CreateGroupMutationVariables = Types.Exact<{
  input: Types.CreateGroupInput;
}>;

export type CreateGroupMutation = {
  createGroup:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        code: string | null;
        image: string | null;
        coins: number | null;
        organizer:
          | ({
              id: string | null;
              firstName: string | null;
              lastName: string | null;
              email: string | null;
            } & { __typename?: "GroupMember" })
          | null;
      } & { __typename?: "CreateGroupResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateGroupMutationVariables = Types.Exact<{
  input: Types.UpdateGroupInput;
}>;

export type UpdateGroupMutation = {
  updateGroup:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        image: string | null;
        organizerId: string | null;
      } & { __typename?: "UpdateGroupResult" })
    | null;
} & { __typename?: "Mutation" };

export type DeleteGroupMutationVariables = Types.Exact<{
  input: Types.DeleteGroupInput;
}>;

export type DeleteGroupMutation = {
  deleteGroup:
    | ({
        left: boolean | null;
        reassignedOrganizerId: string | null;
        groupDeleted: boolean | null;
      } & { __typename?: "LeaveGroupResult" })
    | null;
} & { __typename?: "Mutation" };

export type DeleteMyGroupMutationVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
}>;

export type DeleteMyGroupMutation = {
  deleteMyGroup:
    | ({
        left: boolean | null;
        reassignedOrganizerId: string | null;
        groupDeleted: boolean | null;
      } & { __typename?: "LeaveGroupResult" })
    | null;
} & { __typename?: "Mutation" };

export type JoinGroupMutationVariables = Types.Exact<{
  input: Types.JoinGroupInput;
}>;

export type JoinGroupMutation = {
  joinGroup:
    | ({ success: boolean | null; groupId: string | null } & {
        __typename?: "JoinGroupResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type LeaveGroupMutationVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
}>;

export type LeaveGroupMutation = {
  leaveGroup:
    | ({
        left: boolean | null;
        reassignedOrganizerId: string | null;
        groupDeleted: boolean | null;
      } & { __typename?: "LeaveGroupResult" })
    | null;
} & { __typename?: "Mutation" };

export type RequestJoinGroupMutationVariables = Types.Exact<{
  input: Types.RequestJoinGroupInput;
}>;

export type RequestJoinGroupMutation = {
  requestJoinGroup:
    | ({ success: boolean | null; groupId: string | null } & {
        __typename?: "JoinGroupResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type CancelJoinRequestMutationVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
}>;

export type CancelJoinRequestMutation = {
  cancelJoinRequest:
    | ({
        left: boolean | null;
        reassignedOrganizerId: string | null;
        groupDeleted: boolean | null;
      } & { __typename?: "LeaveGroupResult" })
    | null;
} & { __typename?: "Mutation" };

export type RespondToJoinRequestMutationVariables = Types.Exact<{
  input: Types.RespondJoinRequestInput;
}>;

export type RespondToJoinRequestMutation = {
  respondToJoinRequest:
    | ({ status: string | null } & { __typename?: "JoinRequestResponse" })
    | null;
} & { __typename?: "Mutation" };

export type RemoveUserFromGroupMutationVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type RemoveUserFromGroupMutation = {
  removeUserFromGroup:
    | ({ success: boolean | null; groupId: string | null } & {
        __typename?: "JoinGroupResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type BulkAssignUsersMutationVariables = Types.Exact<{
  input: Types.BulkAssignUsersInput;
}>;

export type BulkAssignUsersMutation = {
  bulkAssignUsers:
    | ({
        count: number | null;
        participants: Array<
          {
            id: string | null;
            joinedAt: Date | null;
            user:
              | ({
                  id: string | null;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                } & { __typename?: "GroupMember" })
              | null;
          } & { __typename?: "GroupParticipant" }
        > | null;
      } & { __typename?: "BulkAssignResult" })
    | null;
} & { __typename?: "Mutation" };

export type AddGroupCoinsMutationVariables = Types.Exact<{
  input: Types.AddGroupCoinsInput;
}>;

export type AddGroupCoinsMutation = {
  addGroupCoins:
    | ({
        groupId: string | null;
        amount: number | null;
        newCoins: number | null;
        previousCoins: number | null;
      } & { __typename?: "AddCoinsResult" })
    | null;
} & { __typename?: "Mutation" };

export type MyGroupQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type MyGroupQuery = {
  myGroup:
    | ({
        id: string | null;
        name: string | null;
        code: string | null;
        description: string | null;
        image: string | null;
        coins: number | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        tripId: string | null;
        participantCount: number | null;
        organizer:
          | ({
              id: string | null;
              firstName: string | null;
              lastName: string | null;
              email: string | null;
            } & { __typename?: "GroupMember" })
          | null;
        participants: Array<
          {
            id: string | null;
            joinedAt: Date | null;
            user:
              | ({
                  id: string | null;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                } & { __typename?: "GroupMember" })
              | null;
          } & { __typename?: "GroupParticipant" }
        > | null;
      } & { __typename?: "GroupWithDetails" })
    | null;
} & { __typename?: "Query" };

export type MyJoinRequestQueryVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
}>;

export type MyJoinRequestQuery = {
  myJoinRequest:
    | ({
        id: string | null;
        userId: string | null;
        groupId: string | null;
        tripId: string | null;
        status: string | null;
        requestedAt: Date | null;
        user:
          | ({
              id: string | null;
              firstName: string | null;
              lastName: string | null;
              email: string | null;
            } & { __typename?: "GroupMember" })
          | null;
      } & { __typename?: "GroupJoinRequest" })
    | null;
} & { __typename?: "Query" };

export type GroupsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type GroupsQuery = {
  groups:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    name: string | null;
                    code: string | null;
                    description: string | null;
                    image: string | null;
                    coins: number | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                    tripId: string | null;
                    participantCount: number | null;
                    organizer:
                      | ({
                          id: string | null;
                          firstName: string | null;
                          lastName: string | null;
                          email: string | null;
                        } & { __typename?: "GroupMember" })
                      | null;
                    participants: Array<
                      {
                        id: string | null;
                        joinedAt: Date | null;
                        user:
                          | ({
                              id: string | null;
                              firstName: string | null;
                              lastName: string | null;
                              email: string | null;
                            } & { __typename?: "GroupMember" })
                          | null;
                      } & { __typename?: "GroupParticipant" }
                    > | null;
                  } & { __typename?: "GroupWithDetails" })
                | null;
            } & { __typename?: "GroupEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "GroupConnection" })
    | null;
} & { __typename?: "Query" };

export type GroupQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type GroupQuery = {
  group:
    | ({
        id: string | null;
        name: string | null;
        code: string | null;
        description: string | null;
        image: string | null;
        coins: number | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        tripId: string | null;
        participantCount: number | null;
        organizer:
          | ({
              id: string | null;
              firstName: string | null;
              lastName: string | null;
              email: string | null;
            } & { __typename?: "GroupMember" })
          | null;
        participants: Array<
          {
            id: string | null;
            joinedAt: Date | null;
            user:
              | ({
                  id: string | null;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                } & { __typename?: "GroupMember" })
              | null;
          } & { __typename?: "GroupParticipant" }
        > | null;
      } & { __typename?: "GroupWithDetails" })
    | null;
} & { __typename?: "Query" };

export type GroupRankingQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type GroupRankingQuery = {
  groupRanking:
    | ({
        currentDate: Date | null;
        groups: Array<
          {
            id: string | null;
            name: string | null;
            image: string | null;
            coins: number | null;
            participantCount: number | null;
            rank: number | null;
          } & { __typename?: "GroupRankingEntry" }
        > | null;
      } & { __typename?: "GroupRankingResult" })
    | null;
} & { __typename?: "Query" };

export type GroupListQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type GroupListQuery = {
  groupList: Array<
    {
      id: string | null;
      name: string | null;
      code: string | null;
      image: string | null;
      coins: number | null;
      description: string | null;
      isDeleted: boolean | null;
      tripId: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    } & { __typename?: "Group" }
  > | null;
} & { __typename?: "Query" };

export type PendingJoinRequestsQueryVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
}>;

export type PendingJoinRequestsQuery = {
  pendingJoinRequests: Array<
    {
      id: string | null;
      userId: string | null;
      groupId: string | null;
      tripId: string | null;
      status: string | null;
      requestedAt: Date | null;
      user:
        | ({
            id: string | null;
            firstName: string | null;
            lastName: string | null;
            email: string | null;
          } & { __typename?: "GroupMember" })
        | null;
    } & { __typename?: "GroupJoinRequest" }
  > | null;
} & { __typename?: "Query" };

export type GroupGalleryQueryVariables = Types.Exact<{
  groupId: Types.Scalars["String"]["input"];
}>;

export type GroupGalleryQuery = {
  groupGallery: Array<
    {
      submissionId: string | null;
      challengeId: string | null;
      challengeTitle: string | null;
      imageStoragePath: string | null;
      approvedAt: Date | null;
    } & { __typename?: "GroupGallerySubmission" }
  > | null;
} & { __typename?: "Query" };

export type MarkNotificationReadMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type MarkNotificationReadMutation = {
  markNotificationRead: boolean | null;
} & { __typename?: "Mutation" };

export type MarkAllNotificationsReadMutationVariables = Types.Exact<{
  [key: string]: never;
}>;

export type MarkAllNotificationsReadMutation = {
  markAllNotificationsRead:
    | ({ count: number | null } & { __typename?: "MarkAllReadResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateNotificationPreferencesMutationVariables = Types.Exact<{
  input: Types.UpdateNotificationPreferencesInput;
}>;

export type UpdateNotificationPreferencesMutation = {
  updateNotificationPreferences:
    | ({
        pushEnabled: boolean | null;
        emailEnabled: boolean | null;
        challengeEnabled: boolean | null;
        rankingEnabled: boolean | null;
        systemEnabled: boolean | null;
      } & { __typename?: "UpdatePreferencesResult" })
    | null;
} & { __typename?: "Mutation" };

export type MyNotificationsQueryVariables = Types.Exact<{
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type MyNotificationsQuery = {
  myNotifications:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    body: string | null;
                    title: string | null;
                    url: string | null;
                    tripId: string | null;
                    createdById: string | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                  } & { __typename?: "Notification" })
                | null;
            } & { __typename?: "NotificationEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "NotificationConnection" })
    | null;
} & { __typename?: "Query" };

export type NotificationPreferencesQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type NotificationPreferencesQuery = {
  notificationPreferences:
    | ({
        userId: string | null;
        pushEnabled: boolean | null;
        emailEnabled: boolean | null;
        challengeEnabled: boolean | null;
        rankingEnabled: boolean | null;
        systemEnabled: boolean | null;
      } & { __typename?: "NotificationPreferences" })
    | null;
} & { __typename?: "Query" };

export type CreateRewardMutationVariables = Types.Exact<{
  coinCost: Types.Scalars["Int"]["input"];
  description: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  name: Types.Scalars["String"]["input"];
  quantity: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  tripId: Types.Scalars["String"]["input"];
}>;

export type CreateRewardMutation = {
  createReward:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        image: string | null;
        coinCost: number | null;
        availableQuantity: number | null;
        tripId: string | null;
        createdAt: Date | null;
      } & { __typename?: "Reward" })
    | null;
} & { __typename?: "Mutation" };

export type RedeemRewardMutationVariables = Types.Exact<{
  input: Types.RedeemRewardInput;
}>;

export type RedeemRewardMutation = {
  redeemReward:
    | ({
        id: string | null;
        rewardId: string | null;
        groupId: string | null;
        userId: string | null;
        status: string | null;
        redeemedAt: Date | null;
        reward:
          | ({
              id: string | null;
              name: string | null;
              description: string | null;
              image: string | null;
              coinCost: number | null;
            } & { __typename?: "Reward" })
          | null;
      } & { __typename?: "RedeemedReward" })
    | null;
} & { __typename?: "Mutation" };

export type AllRewardsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type AllRewardsQuery = {
  allRewards: Array<
    {
      id: string | null;
      name: string | null;
      description: string | null;
      image: string | null;
      coinCost: number | null;
      availableQuantity: number | null;
      isHidden: boolean | null;
      tripId: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    } & { __typename?: "Reward" }
  > | null;
} & { __typename?: "Query" };

export type RewardsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type RewardsQuery = {
  rewards:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    name: string | null;
                    description: string | null;
                    image: string | null;
                    coinCost: number | null;
                    availableQuantity: number | null;
                    isHidden: boolean | null;
                    tripId: string | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                  } & { __typename?: "Reward" })
                | null;
            } & { __typename?: "RewardEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "RewardConnection" })
    | null;
} & { __typename?: "Query" };

export type MyRedeemedRewardsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type MyRedeemedRewardsQuery = {
  myRedeemedRewards: Array<
    {
      id: string | null;
      rewardId: string | null;
      groupId: string | null;
      userId: string | null;
      status: string | null;
      redeemedAt: Date | null;
      reward:
        | ({
            id: string | null;
            name: string | null;
            description: string | null;
            image: string | null;
            coinCost: number | null;
            availableQuantity: number | null;
          } & { __typename?: "Reward" })
        | null;
    } & { __typename?: "RedeemedReward" }
  > | null;
} & { __typename?: "Query" };

export type DeleteFileMutationVariables = Types.Exact<{
  path: Types.Scalars["String"]["input"];
}>;

export type DeleteFileMutation = {
  deleteFile:
    | ({ success: boolean | null; path: string | null } & {
        __typename?: "StorageDeleteResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type UploadUrlQueryVariables = Types.Exact<{
  input: Types.GetUploadUrlInput;
}>;

export type UploadUrlQuery = {
  uploadUrl:
    | ({ url: string | null; path: string | null; expiresAt: Date | null } & {
        __typename?: "StorageUploadUrl";
      })
    | null;
} & { __typename?: "Query" };

export type CreateSubmissionMutationVariables = Types.Exact<{
  input: Types.CreateSubmissionInput;
}>;

export type CreateSubmissionMutation = {
  createSubmission:
    | ({ id: string | null; status: string | null } & {
        __typename?: "SubmissionResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type ReviewSubmissionMutationVariables = Types.Exact<{
  input: Types.ReviewSubmissionInput;
}>;

export type ReviewSubmissionMutation = {
  reviewSubmission:
    | ({ id: string | null; status: string | null } & {
        __typename?: "SubmissionResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type MySubmissionsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type MySubmissionsQuery = {
  mySubmissions:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    challengeId: string | null;
                    groupId: string | null;
                    status: Types.SubmissionStatus | null;
                    textContent: string | null;
                    imageIds: Array<string> | null;
                    videoId: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    awardedPoints: number | null;
                    bonusPoints: number | null;
                    ranking: number | null;
                    voteCount: number | null;
                    voteScore: number | null;
                    createdAt: Date | null;
                    reviewedAt: Date | null;
                  } & { __typename?: "ChallengeSubmission" })
                | null;
            } & { __typename?: "SubmissionEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "SubmissionConnection" })
    | null;
} & { __typename?: "Query" };

export type GroupSubmissionsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  challengeId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type GroupSubmissionsQuery = {
  groupSubmissions:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    challengeId: string | null;
                    groupId: string | null;
                    status: Types.SubmissionStatus | null;
                    textContent: string | null;
                    imageIds: Array<string> | null;
                    videoId: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    awardedPoints: number | null;
                    bonusPoints: number | null;
                    ranking: number | null;
                    voteCount: number | null;
                    voteScore: number | null;
                    createdAt: Date | null;
                    reviewedAt: Date | null;
                  } & { __typename?: "ChallengeSubmission" })
                | null;
            } & { __typename?: "SubmissionEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "SubmissionConnection" })
    | null;
} & { __typename?: "Query" };

export type PendingSubmissionsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type PendingSubmissionsQuery = {
  pendingSubmissions:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    challengeId: string | null;
                    groupId: string | null;
                    status: Types.SubmissionStatus | null;
                    textContent: string | null;
                    imageIds: Array<string> | null;
                    videoId: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    awardedPoints: number | null;
                    bonusPoints: number | null;
                    ranking: number | null;
                    rejectionReason: string | null;
                    createdAt: Date | null;
                    reviewedAt: Date | null;
                  } & { __typename?: "ChallengeSubmission" })
                | null;
            } & { __typename?: "SubmissionEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "SubmissionConnection" })
    | null;
} & { __typename?: "Query" };

export type CreateTripMutationVariables = Types.Exact<{
  input: Types.CreateTripInput;
}>;

export type CreateTripMutation = {
  createTrip:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        location: string | null;
        image: string | null;
        isActive: boolean | null;
      } & { __typename?: "CreateTripResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateTripMutationVariables = Types.Exact<{
  input: Types.UpdateTripInput;
}>;

export type UpdateTripMutation = {
  updateTrip:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        location: string | null;
        image: string | null;
        isActive: boolean | null;
      } & { __typename?: "UpdateTripResult" })
    | null;
} & { __typename?: "Mutation" };

export type DeleteTripMutationVariables = Types.Exact<{
  input: Types.DeleteTripInput;
}>;

export type DeleteTripMutation = {
  deleteTrip:
    | ({ success: boolean | null } & { __typename?: "DeleteTripResult" })
    | null;
} & { __typename?: "Mutation" };

export type MyTripsQueryVariables = Types.Exact<{
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type MyTripsQuery = {
  myTrips:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    name: string | null;
                    description: string | null;
                    startDate: Date | null;
                    endDate: Date | null;
                    location: string | null;
                    image: string | null;
                    isActive: boolean | null;
                    createdAt: Date | null;
                    updatedAt: Date | null;
                  } & { __typename?: "Trip" })
                | null;
            } & { __typename?: "TripEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "TripConnection" })
    | null;
} & { __typename?: "Query" };

export type TripQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type TripQuery = {
  trip:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        location: string | null;
        image: string | null;
        isActive: boolean | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        groups: Array<
          {
            id: string | null;
            name: string | null;
            code: string | null;
            image: string | null;
            coins: number | null;
            participantCount: number | null;
            isDeleted: boolean | null;
          } & { __typename?: "TripGroup" }
        > | null;
        tripSponsors: Array<
          {
            id: string | null;
            tripId: string | null;
            sponsorId: string | null;
            sponsor:
              | ({
                  id: string | null;
                  name: string | null;
                  logoPath: string | null;
                  description: string | null;
                  isActive: boolean | null;
                } & { __typename?: "Sponsor" })
              | null;
          } & { __typename?: "TripSponsor" }
        > | null;
        participants: Array<
          {
            userId: string | null;
            tripId: string | null;
            wristNumber: string | null;
            houseNumber: string | null;
            user:
              | ({
                  id: string | null;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                  role: string | null;
                } & { __typename?: "TripParticipantUser" })
              | null;
            group:
              | ({
                  id: string | null;
                  name: string | null;
                  code: string | null;
                  image: string | null;
                  coins: number | null;
                  participantCount: number | null;
                  isDeleted: boolean | null;
                } & { __typename?: "TripGroup" })
              | null;
          } & { __typename?: "TripParticipantDetail" }
        > | null;
      } & { __typename?: "TripWithParticipants" })
    | null;
} & { __typename?: "Query" };

export type TripAdminQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type TripAdminQuery = {
  tripAdmin:
    | ({
        id: string | null;
        name: string | null;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        location: string | null;
        image: string | null;
        isActive: boolean | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        groups: Array<
          {
            id: string | null;
            name: string | null;
            code: string | null;
            image: string | null;
            coins: number | null;
            participantCount: number | null;
            isDeleted: boolean | null;
          } & { __typename?: "TripGroup" }
        > | null;
        tripSponsors: Array<
          {
            id: string | null;
            tripId: string | null;
            sponsorId: string | null;
            sponsor:
              | ({
                  id: string | null;
                  name: string | null;
                  logoPath: string | null;
                  description: string | null;
                  isActive: boolean | null;
                } & { __typename?: "Sponsor" })
              | null;
          } & { __typename?: "TripSponsor" }
        > | null;
        participants: Array<
          {
            userId: string | null;
            tripId: string | null;
            wristNumber: string | null;
            houseNumber: string | null;
            user:
              | ({
                  id: string | null;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                  role: string | null;
                } & { __typename?: "TripParticipantUser" })
              | null;
            group:
              | ({
                  id: string | null;
                  name: string | null;
                  code: string | null;
                  image: string | null;
                  coins: number | null;
                  participantCount: number | null;
                  isDeleted: boolean | null;
                } & { __typename?: "TripGroup" })
              | null;
          } & { __typename?: "TripParticipantDetail" }
        > | null;
      } & { __typename?: "TripWithParticipants" })
    | null;
} & { __typename?: "Query" };

export type TripResourcesQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type TripResourcesQuery = {
  tripResources:
    | ({
        resources: Array<
          {
            id: string | null;
            tripId: string | null;
            title: string | null;
            description: string | null;
            content: string | null;
            iconName: string | null;
            sortOrder: number | null;
            createdAt: Date | null;
            updatedAt: Date | null;
          } & { __typename?: "TripResource" }
        > | null;
        insurance:
          | ({
              id: string | null;
              tripId: string | null;
              title: string | null;
              description: string | null;
              provider: string | null;
              policyNumber: string | null;
              createdAt: Date | null;
              updatedAt: Date | null;
              steps: Array<
                {
                  id: string | null;
                  stepNumber: number | null;
                  title: string | null;
                  description: string | null;
                } & { __typename?: "InsuranceStep" }
              > | null;
            } & { __typename?: "TripInsurance" })
          | null;
      } & { __typename?: "TripResourcesResult" })
    | null;
} & { __typename?: "Query" };

export type UpdateMyProfileMutationVariables = Types.Exact<{
  input: Types.UpdateUserProfileInput;
}>;

export type UpdateMyProfileMutation = {
  updateMyProfile:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
      } & { __typename?: "UpdateProfileResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateAvatarMutationVariables = Types.Exact<{
  input: Types.UpdateAvatarInput;
}>;

export type UpdateAvatarMutation = {
  updateAvatar:
    | ({ hasAvatar: boolean | null } & { __typename?: "AvatarUpdateResult" })
    | null;
} & { __typename?: "Mutation" };

export type CreateUserMutationVariables = Types.Exact<{
  input: Types.CreateUserInput;
}>;

export type CreateUserMutation = {
  createUser:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: Types.Role | null;
        wristNumber: string | null;
        houseNumber: string | null;
        groupId: string | null;
        groupName: string | null;
        tripId: string | null;
      } & { __typename?: "CreateUserResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateUserRoleMutationVariables = Types.Exact<{
  input: Types.UpdateUserRoleInput;
}>;

export type UpdateUserRoleMutation = {
  updateUserRole:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: Types.Role | null;
      } & { __typename?: "UpdateUserResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateUserNameMutationVariables = Types.Exact<{
  input: Types.UpdateUserNameInput;
}>;

export type UpdateUserNameMutation = {
  updateUserName:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: Types.Role | null;
      } & { __typename?: "UpdateUserResult" })
    | null;
} & { __typename?: "Mutation" };

export type BanUserMutationVariables = Types.Exact<{
  input: Types.BanUserInput;
}>;

export type BanUserMutation = {
  banUser:
    | ({ bannedUntil: string | null } & { __typename?: "BanUserResult" })
    | null;
} & { __typename?: "Mutation" };

export type DeleteUserMutationVariables = Types.Exact<{
  input: Types.DeleteUserInput;
}>;

export type DeleteUserMutation = {
  deleteUser:
    | ({ deletedFromSystem: boolean | null } & {
        __typename?: "DeleteUserResult";
      })
    | null;
} & { __typename?: "Mutation" };

export type UpdateWristNumberMutationVariables = Types.Exact<{
  input: Types.UpdateWristNumberInput;
}>;

export type UpdateWristNumberMutation = {
  updateWristNumber:
    | ({
        userId: string | null;
        tripId: string | null;
        wristNumber: string | null;
        houseNumber: string | null;
      } & { __typename?: "ParticipantNumberResult" })
    | null;
} & { __typename?: "Mutation" };

export type RemoveWristNumberMutationVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type RemoveWristNumberMutation = {
  removeWristNumber:
    | ({
        userId: string | null;
        tripId: string | null;
        wristNumber: string | null;
        houseNumber: string | null;
      } & { __typename?: "ParticipantNumberResult" })
    | null;
} & { __typename?: "Mutation" };

export type UpdateHouseNumberMutationVariables = Types.Exact<{
  input: Types.UpdateHouseNumberInput;
}>;

export type UpdateHouseNumberMutation = {
  updateHouseNumber:
    | ({
        userId: string | null;
        tripId: string | null;
        wristNumber: string | null;
        houseNumber: string | null;
      } & { __typename?: "ParticipantNumberResult" })
    | null;
} & { __typename?: "Mutation" };

export type RemoveHouseNumberMutationVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type RemoveHouseNumberMutation = {
  removeHouseNumber:
    | ({
        userId: string | null;
        tripId: string | null;
        wristNumber: string | null;
        houseNumber: string | null;
      } & { __typename?: "ParticipantNumberResult" })
    | null;
} & { __typename?: "Mutation" };

export type MeQueryVariables = Types.Exact<{ [key: string]: never }>;

export type MeQuery = {
  me:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: Types.Role | null;
        hasAvatar: boolean | null;
      } & { __typename?: "UserProfile" })
    | null;
} & { __typename?: "Query" };

export type MyBanStatusQueryVariables = Types.Exact<{ [key: string]: never }>;

export type MyBanStatusQuery = {
  myBanStatus:
    | ({
        banned: boolean | null;
        bannedUntil: string | null;
        reason: string | null;
        exists: boolean | null;
      } & { __typename?: "BanStatus" })
    | null;
} & { __typename?: "Query" };

export type MyGroupInfoQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type MyGroupInfoQuery = {
  myGroupInfo:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        trips: Array<
          {
            tripId: string | null;
            group:
              | ({ id: string | null; name: string | null } & {
                  __typename?: "GroupInfo";
                })
              | null;
            trip:
              | ({ id: string | null; name: string | null } & {
                  __typename?: "TripInfo";
                })
              | null;
          } & { __typename?: "UserTripInfo" }
        > | null;
        organizerGroup:
          | ({ id: string | null; name: string | null } & {
              __typename?: "GroupInfo";
            })
          | null;
      } & { __typename?: "UserWithGroupInfo" })
    | null;
} & { __typename?: "Query" };

export type UserQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type UserQuery = {
  user:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        role: Types.Role | null;
        hasAvatar: boolean | null;
      } & { __typename?: "User" })
    | null;
} & { __typename?: "Query" };

export type UserWithGroupQueryVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type UserWithGroupQuery = {
  userWithGroup:
    | ({
        id: string | null;
        firstName: string | null;
        lastName: string | null;
        trips: Array<
          {
            tripId: string | null;
            group:
              | ({ id: string | null; name: string | null } & {
                  __typename?: "GroupInfo";
                })
              | null;
            trip:
              | ({ id: string | null; name: string | null } & {
                  __typename?: "TripInfo";
                })
              | null;
          } & { __typename?: "UserTripInfo" }
        > | null;
        organizerGroup:
          | ({ id: string | null; name: string | null } & {
              __typename?: "GroupInfo";
            })
          | null;
      } & { __typename?: "UserWithGroupInfo" })
    | null;
} & { __typename?: "Query" };

export type TripParticipantQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
  tripId: Types.Scalars["String"]["input"];
}>;

export type TripParticipantQuery = {
  tripParticipant:
    | ({
        userId: string | null;
        tripId: string | null;
        wristNumber: string | null;
        houseNumber: string | null;
        group:
          | ({ id: string | null; name: string | null } & {
              __typename?: "GroupInfo";
            })
          | null;
      } & { __typename?: "TripParticipantInfo" })
    | null;
} & { __typename?: "Query" };

export type BanStatusByEmailQueryVariables = Types.Exact<{
  input: Types.GetUserByEmailInput;
}>;

export type BanStatusByEmailQuery = {
  banStatusByEmail:
    | ({
        banned: boolean | null;
        bannedUntil: string | null;
        reason: string | null;
        exists: boolean | null;
      } & { __typename?: "BanStatus" })
    | null;
} & { __typename?: "Query" };

export type UsersQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type UsersQuery = {
  users:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    firstName: string | null;
                    lastName: string | null;
                    email: string | null;
                    role: Types.Role | null;
                    hasAvatar: boolean | null;
                    wristNumber: string | null;
                    houseNumber: string | null;
                    groupId: string | null;
                    groupName: string | null;
                    tripId: string | null;
                    isBanned: boolean | null;
                    bannedUntil: string | null;
                    banReason: string | null;
                  } & { __typename?: "UserWithTripInfo" })
                | null;
            } & { __typename?: "UserEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "UserConnection" })
    | null;
} & { __typename?: "Query" };

export type SearchUsersQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
  field: Types.Scalars["String"]["input"];
  searchTerm: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  first: Types.InputMaybe<Types.Scalars["Int"]["input"]>;
  after: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type SearchUsersQuery = {
  searchUsers:
    | ({
        edges: Array<
          | ({
              cursor: string;
              node:
                | ({
                    id: string | null;
                    firstName: string | null;
                    lastName: string | null;
                    email: string | null;
                    role: Types.Role | null;
                    hasAvatar: boolean | null;
                    wristNumber: string | null;
                    houseNumber: string | null;
                    groupId: string | null;
                    groupName: string | null;
                    tripId: string | null;
                    isBanned: boolean | null;
                    bannedUntil: string | null;
                    banReason: string | null;
                  } & { __typename?: "UserWithTripInfo" })
                | null;
            } & { __typename?: "UserEdge" })
          | null
        > | null;
        pageInfo: { hasNextPage: boolean; endCursor: string | null } & {
          __typename?: "PageInfo";
        };
      } & { __typename?: "UserConnection" })
    | null;
} & { __typename?: "Query" };

export type AdminNamesQueryVariables = Types.Exact<{ [key: string]: never }>;

export type AdminNamesQuery = {
  adminNames: Array<
    { id: string | null; firstName: string | null; lastName: string | null } & {
      __typename?: "AdminName";
    }
  > | null;
} & { __typename?: "Query" };

export type ActivityFeedEventSubscriptionVariables = Types.Exact<{
  filter: Types.ActivityFeedSubscriptionFilter;
}>;

export type ActivityFeedEventSubscription = {
  activityFeedEvent:
    | ({
        id: string | null;
        type: string | null;
        title: string | null;
        description: string | null;
        groupId: string | null;
        userId: string | null;
        metadata: unknown | null;
        createdAt: Date | null;
      } & { __typename?: "ActivityFeedEvent" })
    | null;
} & { __typename?: "Subscription" };

export type ChallengeStatusEventSubscriptionVariables = Types.Exact<{
  filter: Types.ChallengeSubscriptionFilter;
}>;

export type ChallengeStatusEventSubscription = {
  challengeStatusEvent:
    | ({
        challengeId: string | null;
        tripId: string | null;
        previousStatus: string | null;
        newStatus: string | null;
        changedAt: Date | null;
      } & { __typename?: "ChallengeStatusEvent" })
    | null;
} & { __typename?: "Subscription" };

export type JoinRequestEventSubscriptionVariables = Types.Exact<{
  filter: Types.InputMaybe<Types.JoinRequestSubscriptionFilter>;
}>;

export type JoinRequestEventSubscription = {
  joinRequestEvent:
    | ({
        requestId: string | null;
        groupId: string | null;
        userId: string | null;
        userName: string | null;
        eventType: string | null;
        createdAt: Date | null;
      } & { __typename?: "JoinRequestEvent" })
    | null;
} & { __typename?: "Subscription" };

export type FriendLocationEventSubscriptionVariables = Types.Exact<{
  friendId: Types.Scalars["ID"]["input"];
}>;

export type FriendLocationEventSubscription = {
  friendLocationEvent:
    | ({
        userId: string | null;
        firstName: string | null;
        lastName: string | null;
        image: string | null;
        latitude: number | null;
        longitude: number | null;
        accuracy: number | null;
        isOnline: boolean | null;
        timestamp: Date | null;
      } & { __typename?: "FriendLocationEvent" })
    | null;
} & { __typename?: "Subscription" };

export type NotificationReceivedSubscriptionVariables = Types.Exact<{
  [key: string]: never;
}>;

export type NotificationReceivedSubscription = {
  notificationReceived:
    | ({
        id: string | null;
        type: string | null;
        priority: string | null;
        title: string | null;
        body: string | null;
        data: unknown | null;
        receivedAt: Date | null;
      } & { __typename?: "NotificationReceivedEvent" })
    | null;
} & { __typename?: "Subscription" };

export type GroupRankingEventSubscriptionVariables = Types.Exact<{
  filter: Types.GroupSubscriptionFilter;
}>;

export type GroupRankingEventSubscription = {
  groupRankingEvent:
    | ({
        groupId: string | null;
        tripId: string | null;
        previousRank: number | null;
        newRank: number | null;
        coinChange: number | null;
        changedAt: Date | null;
      } & { __typename?: "GroupRankingEvent" })
    | null;
} & { __typename?: "Subscription" };

export type SubmissionReviewedSubscriptionVariables = Types.Exact<{
  filter: Types.SubmissionSubscriptionFilter;
}>;

export type SubmissionReviewedSubscription = {
  submissionReviewed:
    | ({
        submissionId: string | null;
        challengeId: string | null;
        groupId: string | null;
        status: string | null;
        awardedPoints: number | null;
        reviewedAt: Date | null;
      } & { __typename?: "SubmissionReviewedEvent" })
    | null;
} & { __typename?: "Subscription" };
