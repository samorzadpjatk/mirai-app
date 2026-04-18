export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: Date; output: Date };
  JSON: { input: unknown; output: unknown };
}

export interface ActivityFeedConnection {
  __typename?: "ActivityFeedConnection";
  edges: Maybe<Array<Maybe<ActivityFeedEdge>>>;
  pageInfo: PageInfo;
}

export interface ActivityFeedEdge {
  __typename?: "ActivityFeedEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<ActivityFeedItem>;
}

/** New activity feed item event */
export interface ActivityFeedEvent {
  __typename?: "ActivityFeedEvent";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  metadata: Maybe<Scalars["JSON"]["output"]>;
  title: Maybe<Scalars["String"]["output"]>;
  type: Maybe<Scalars["String"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
}

/** Activity feed item */
export interface ActivityFeedItem {
  __typename?: "ActivityFeedItem";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  imageUrl: Maybe<Scalars["String"]["output"]>;
  isHidden: Maybe<Scalars["Boolean"]["output"]>;
  isPinned: Maybe<Scalars["Boolean"]["output"]>;
  title: Maybe<Scalars["String"]["output"]>;
  type: Maybe<Scalars["String"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

export interface ActivityFeedSubscriptionFilter {
  groupId?: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
}

/** Add coins to group result */
export interface AddCoinsResult {
  __typename?: "AddCoinsResult";
  amount: Maybe<Scalars["Int"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  newCoins: Maybe<Scalars["Int"]["output"]>;
  previousCoins: Maybe<Scalars["Int"]["output"]>;
}

export interface AddGroupCoinsInput {
  amount: Scalars["Int"]["input"];
  groupId: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

/** Admin user name information */
export interface AdminName {
  __typename?: "AdminName";
  firstName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
}

/** Avatar update result */
export interface AvatarUpdateResult {
  __typename?: "AvatarUpdateResult";
  hasAvatar: Maybe<Scalars["Boolean"]["output"]>;
}

/** User ban status information */
export interface BanStatus {
  __typename?: "BanStatus";
  banned: Maybe<Scalars["Boolean"]["output"]>;
  bannedUntil: Maybe<Scalars["String"]["output"]>;
  exists: Maybe<Scalars["Boolean"]["output"]>;
  reason: Maybe<Scalars["String"]["output"]>;
}

export interface BanUserInput {
  bannedUntilMs: Scalars["Int"]["input"];
  reason?: InputMaybe<Scalars["String"]["input"]>;
  userId: Scalars["String"]["input"];
}

/** Ban user result */
export interface BanUserResult {
  __typename?: "BanUserResult";
  bannedUntil: Maybe<Scalars["String"]["output"]>;
}

/** Bulk assign users result */
export interface BulkAssignResult {
  __typename?: "BulkAssignResult";
  count: Maybe<Scalars["Int"]["output"]>;
  participants: Maybe<Array<GroupParticipant>>;
}

export interface BulkAssignUsersInput {
  groupId: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
  userIds: Array<Scalars["String"]["input"]>;
}

export interface CastVoteInput {
  submissionId: Scalars["String"]["input"];
  voteType: VoteType;
}

/** Challenge entity */
export interface Challenge {
  __typename?: "Challenge";
  autoApprove: Maybe<Scalars["Boolean"]["output"]>;
  basePoints: Maybe<Scalars["Int"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  dailyEndTime: Maybe<Scalars["String"]["output"]>;
  dailyStartTime: Maybe<Scalars["String"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  endTime: Maybe<Scalars["DateTime"]["output"]>;
  expectedValue: Maybe<Scalars["String"]["output"]>;
  firstPlacePoints: Maybe<Scalars["Int"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isRecurring: Maybe<Scalars["Boolean"]["output"]>;
  myGroupSubmissionStatus: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  participantGroupsCount: Maybe<Scalars["Int"]["output"]>;
  pendingSubmissionsCount: Maybe<Scalars["Int"]["output"]>;
  qrCodeValue: Maybe<Scalars["String"]["output"]>;
  scoringCategory: Maybe<ScoringCategory>;
  secondPlacePoints: Maybe<Scalars["Int"]["output"]>;
  startTime: Maybe<Scalars["DateTime"]["output"]>;
  status: Maybe<ChallengeStatus>;
  submissionType: Maybe<SubmissionType>;
  targetLatitude: Maybe<Scalars["Float"]["output"]>;
  targetLongitude: Maybe<Scalars["Float"]["output"]>;
  thirdPlacePoints: Maybe<Scalars["Int"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
  votingEndTime: Maybe<Scalars["DateTime"]["output"]>;
  votingStartTime: Maybe<Scalars["DateTime"]["output"]>;
}

export interface ChallengeConnection {
  __typename?: "ChallengeConnection";
  edges: Maybe<Array<Maybe<ChallengeEdge>>>;
  pageInfo: PageInfo;
}

export interface ChallengeEdge {
  __typename?: "ChallengeEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<Challenge>;
}

/** Challenge operation result */
export interface ChallengeResult {
  __typename?: "ChallengeResult";
  id: Maybe<Scalars["ID"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  status: Maybe<ChallengeStatus>;
}

/** Current status of a challenge */
export type ChallengeStatus =
  | "ACTIVE"
  | "CANCELLED"
  | "COMPLETED"
  | "HIDDEN"
  | "VISIBLE"
  | "VOTING_PHASE";

/** Challenge status change notification */
export interface ChallengeStatusEvent {
  __typename?: "ChallengeStatusEvent";
  challengeId: Maybe<Scalars["ID"]["output"]>;
  changedAt: Maybe<Scalars["DateTime"]["output"]>;
  newStatus: Maybe<Scalars["String"]["output"]>;
  previousStatus: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
}

/** Challenge submission */
export interface ChallengeSubmission {
  __typename?: "ChallengeSubmission";
  awardedPoints: Maybe<Scalars["Int"]["output"]>;
  bonusPoints: Maybe<Scalars["Int"]["output"]>;
  challengeId: Maybe<Scalars["ID"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  imageIds: Maybe<Array<Scalars["String"]["output"]>>;
  latitude: Maybe<Scalars["Float"]["output"]>;
  longitude: Maybe<Scalars["Float"]["output"]>;
  ranking: Maybe<Scalars["Int"]["output"]>;
  rejectionReason: Maybe<Scalars["String"]["output"]>;
  reviewedAt: Maybe<Scalars["DateTime"]["output"]>;
  status: Maybe<SubmissionStatus>;
  textContent: Maybe<Scalars["String"]["output"]>;
  videoId: Maybe<Scalars["String"]["output"]>;
  voteCount: Maybe<Scalars["Int"]["output"]>;
  voteScore: Maybe<Scalars["Int"]["output"]>;
}

export interface ChallengeSubscriptionFilter {
  challengeIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tripId: Scalars["String"]["input"];
}

/** Vote on a challenge submission */
export interface ChallengeVote {
  __typename?: "ChallengeVote";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  score: Maybe<Scalars["Int"]["output"]>;
  submissionId: Maybe<Scalars["ID"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
}

/** Coin balance for a group */
export interface CoinBalance {
  __typename?: "CoinBalance";
  coins: Maybe<Scalars["Int"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  totalEarned: Maybe<Scalars["Int"]["output"]>;
  totalSpent: Maybe<Scalars["Int"]["output"]>;
}

/** Coin transaction record */
export interface CoinTransaction {
  __typename?: "CoinTransaction";
  adminId: Maybe<Scalars["ID"]["output"]>;
  amount: Maybe<Scalars["Int"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  reason: Maybe<Scalars["String"]["output"]>;
}

export interface CoinTransactionConnection {
  __typename?: "CoinTransactionConnection";
  edges: Maybe<Array<Maybe<CoinTransactionEdge>>>;
  pageInfo: PageInfo;
}

export interface CoinTransactionEdge {
  __typename?: "CoinTransactionEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<CoinTransaction>;
}

/** Type of coin transaction */
export type CoinTransactionType =
  | "ADJUSTMENT"
  | "BONUS"
  | "EARNED"
  | "REWARD"
  | "SPENT";

export interface CreateChallengeInput {
  autoApprove?: InputMaybe<Scalars["Boolean"]["input"]>;
  basePoints?: InputMaybe<Scalars["Int"]["input"]>;
  dailyEndTime?: InputMaybe<Scalars["String"]["input"]>;
  dailyStartTime?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  firstPlacePoints?: InputMaybe<Scalars["Int"]["input"]>;
  image?: InputMaybe<Scalars["String"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  name: Scalars["String"]["input"];
  qrCodeValue?: InputMaybe<Scalars["String"]["input"]>;
  recurringDays?: InputMaybe<Scalars["Int"]["input"]>;
  scoringCategory: ScoringCategory;
  secondPlacePoints?: InputMaybe<Scalars["Int"]["input"]>;
  startTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<ChallengeStatus>;
  submissionType: SubmissionType;
  targetLatitude?: InputMaybe<Scalars["Float"]["input"]>;
  targetLongitude?: InputMaybe<Scalars["Float"]["input"]>;
  textExpectedPhrase?: InputMaybe<Scalars["String"]["input"]>;
  thirdPlacePoints?: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
  votingDurationHours?: InputMaybe<Scalars["Int"]["input"]>;
  votingEndTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  votingStartTime?: InputMaybe<Scalars["DateTime"]["input"]>;
}

export interface CreateGroupInput {
  description?: InputMaybe<Scalars["String"]["input"]>;
  image?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  organizerId?: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
}

/** Group creation result */
export interface CreateGroupResult {
  __typename?: "CreateGroupResult";
  code: Maybe<Scalars["String"]["output"]>;
  coins: Maybe<Scalars["Int"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  organizer: Maybe<GroupMember>;
}

export interface CreateSubmissionInput {
  challengeId: Scalars["String"]["input"];
  imageIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  latitude?: InputMaybe<Scalars["Float"]["input"]>;
  longitude?: InputMaybe<Scalars["Float"]["input"]>;
  textContent?: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
  videoId?: InputMaybe<Scalars["String"]["input"]>;
}

export interface CreateTripInput {
  backgroundImagePath?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate: Scalars["DateTime"]["input"];
  name: Scalars["String"]["input"];
  startDate: Scalars["DateTime"]["input"];
}

/** Trip creation result */
export interface CreateTripResult {
  __typename?: "CreateTripResult";
  description: Maybe<Scalars["String"]["output"]>;
  endDate: Maybe<Scalars["DateTime"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isActive: Maybe<Scalars["Boolean"]["output"]>;
  location: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  startDate: Maybe<Scalars["DateTime"]["output"]>;
}

export interface CreateUserInput {
  email: Scalars["String"]["input"];
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

/** User creation result */
export interface CreateUserResult {
  __typename?: "CreateUserResult";
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  groupName: Maybe<Scalars["String"]["output"]>;
  houseNumber: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  role: Maybe<Role>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  wristNumber: Maybe<Scalars["String"]["output"]>;
}

export interface DeleteChallengeInput {
  id: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

export interface DeleteGroupInput {
  id: Scalars["String"]["input"];
}

export interface DeleteTripInput {
  id: Scalars["String"]["input"];
}

/** Trip deletion result */
export interface DeleteTripResult {
  __typename?: "DeleteTripResult";
  success: Maybe<Scalars["Boolean"]["output"]>;
}

export interface DeleteUserInput {
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

/** User deletion result */
export interface DeleteUserResult {
  __typename?: "DeleteUserResult";
  deletedFromSystem: Maybe<Scalars["Boolean"]["output"]>;
}

/** Error result from a mutation */
export interface ErrorResult {
  __typename?: "ErrorResult";
  code: Maybe<Scalars["String"]["output"]>;
  message: Maybe<Scalars["String"]["output"]>;
}

/** Force close voting result */
export interface ForceCloseVotingResult {
  __typename?: "ForceCloseVotingResult";
  id: Maybe<Scalars["ID"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  status: Maybe<Scalars["String"]["output"]>;
}

/** Real-time location update event for friends */
export interface FriendLocationEvent {
  __typename?: "FriendLocationEvent";
  /** GPS accuracy in meters (null if unavailable) */
  accuracy: Maybe<Scalars["Float"]["output"]>;
  /** User's first name */
  firstName: Maybe<Scalars["String"]["output"]>;
  /** User's avatar image URL */
  image: Maybe<Scalars["String"]["output"]>;
  /** Whether the user is currently online */
  isOnline: Maybe<Scalars["Boolean"]["output"]>;
  /** User's last name */
  lastName: Maybe<Scalars["String"]["output"]>;
  /** Latitude coordinate in decimal degrees (-90 to 90) */
  latitude: Maybe<Scalars["Float"]["output"]>;
  /** Longitude coordinate in decimal degrees (-180 to 180) */
  longitude: Maybe<Scalars["Float"]["output"]>;
  /** When the location update occurred */
  timestamp: Maybe<Scalars["DateTime"]["output"]>;
  /** The user who updated their location */
  userId: Maybe<Scalars["ID"]["output"]>;
}

export interface GetTripInput {
  id: Scalars["String"]["input"];
}

export interface GetUploadUrlInput {
  bucket?: InputMaybe<Scalars["String"]["input"]>;
  contentType: Scalars["String"]["input"];
  filename: Scalars["String"]["input"];
}

export interface GetUserByEmailInput {
  email: Scalars["String"]["input"];
}

/** Group entity */
export interface Group {
  __typename?: "Group";
  code: Maybe<Scalars["String"]["output"]>;
  coins: Maybe<Scalars["Int"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isDeleted: Maybe<Scalars["Boolean"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

/** Coin transaction in group context */
export interface GroupCoinTransaction {
  __typename?: "GroupCoinTransaction";
  adminId: Maybe<Scalars["ID"]["output"]>;
  amount: Maybe<Scalars["Int"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  reason: Maybe<Scalars["String"]["output"]>;
}

export interface GroupConnection {
  __typename?: "GroupConnection";
  edges: Maybe<Array<Maybe<GroupEdge>>>;
  pageInfo: PageInfo;
}

export interface GroupEdge {
  __typename?: "GroupEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<GroupWithDetails>;
}

/** Approved challenge submission for group gallery */
export interface GroupGallerySubmission {
  __typename?: "GroupGallerySubmission";
  approvedAt: Maybe<Scalars["DateTime"]["output"]>;
  challengeId: Maybe<Scalars["ID"]["output"]>;
  challengeTitle: Maybe<Scalars["String"]["output"]>;
  imageStoragePath: Maybe<Scalars["String"]["output"]>;
  submissionId: Maybe<Scalars["ID"]["output"]>;
}

/** Basic group information */
export interface GroupInfo {
  __typename?: "GroupInfo";
  id: Maybe<Scalars["ID"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
}

/** Group join request */
export interface GroupJoinRequest {
  __typename?: "GroupJoinRequest";
  groupId: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  requestedAt: Maybe<Scalars["DateTime"]["output"]>;
  status: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  user: Maybe<GroupMember>;
  userId: Maybe<Scalars["ID"]["output"]>;
}

/** Group member user details */
export interface GroupMember {
  __typename?: "GroupMember";
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
}

/** Group participant */
export interface GroupParticipant {
  __typename?: "GroupParticipant";
  id: Maybe<Scalars["ID"]["output"]>;
  joinedAt: Maybe<Scalars["DateTime"]["output"]>;
  user: Maybe<GroupMember>;
}

/** Group ranking entry */
export interface GroupRankingEntry {
  __typename?: "GroupRankingEntry";
  coins: Maybe<Scalars["Int"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  participantCount: Maybe<Scalars["Int"]["output"]>;
  rank: Maybe<Scalars["Int"]["output"]>;
}

/** Group ranking position change */
export interface GroupRankingEvent {
  __typename?: "GroupRankingEvent";
  changedAt: Maybe<Scalars["DateTime"]["output"]>;
  coinChange: Maybe<Scalars["Int"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  newRank: Maybe<Scalars["Int"]["output"]>;
  previousRank: Maybe<Scalars["Int"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
}

/** Group ranking for a trip */
export interface GroupRankingResult {
  __typename?: "GroupRankingResult";
  currentDate: Maybe<Scalars["DateTime"]["output"]>;
  groups: Maybe<Array<GroupRankingEntry>>;
}

export interface GroupSubscriptionFilter {
  groupId?: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
}

/** Group with participants and transactions */
export interface GroupWithDetails {
  __typename?: "GroupWithDetails";
  code: Maybe<Scalars["String"]["output"]>;
  coinTransactions: Maybe<Array<GroupCoinTransaction>>;
  coins: Maybe<Scalars["Int"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isDeleted: Maybe<Scalars["Boolean"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  organizer: Maybe<GroupMember>;
  participantCount: Maybe<Scalars["Int"]["output"]>;
  participants: Maybe<Array<GroupParticipant>>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

/** Group with participant statistics */
export interface GroupWithStats {
  __typename?: "GroupWithStats";
  code: Maybe<Scalars["String"]["output"]>;
  coins: Maybe<Scalars["Int"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  participantCount: Maybe<Scalars["Int"]["output"]>;
}

/** Insurance claim step */
export interface InsuranceStep {
  __typename?: "InsuranceStep";
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  stepNumber: Maybe<Scalars["Int"]["output"]>;
  title: Maybe<Scalars["String"]["output"]>;
}

export interface JoinGroupInput {
  groupId: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

/** Join group result */
export interface JoinGroupResult {
  __typename?: "JoinGroupResult";
  groupId: Maybe<Scalars["ID"]["output"]>;
  success: Maybe<Scalars["Boolean"]["output"]>;
}

/** Group join request notification */
export interface JoinRequestEvent {
  __typename?: "JoinRequestEvent";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  eventType: Maybe<Scalars["String"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  requestId: Maybe<Scalars["ID"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
  userName: Maybe<Scalars["String"]["output"]>;
}

/** Join request response result */
export interface JoinRequestResponse {
  __typename?: "JoinRequestResponse";
  status: Maybe<Scalars["String"]["output"]>;
}

export interface JoinRequestSubscriptionFilter {
  groupId?: InputMaybe<Scalars["String"]["input"]>;
  tripId?: InputMaybe<Scalars["String"]["input"]>;
}

/** Leave group result */
export interface LeaveGroupResult {
  __typename?: "LeaveGroupResult";
  groupDeleted: Maybe<Scalars["Boolean"]["output"]>;
  left: Maybe<Scalars["Boolean"]["output"]>;
  reassignedOrganizerId: Maybe<Scalars["ID"]["output"]>;
}

export interface LocationSubscriptionFilter {
  friendIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  tripId: Scalars["String"]["input"];
}

export interface MarkAllReadResult {
  __typename?: "MarkAllReadResult";
  count: Maybe<Scalars["Int"]["output"]>;
}

export interface Mutation {
  __typename?: "Mutation";
  addGroupCoins: Maybe<AddCoinsResult>;
  banUser: Maybe<BanUserResult>;
  bulkAssignUsers: Maybe<BulkAssignResult>;
  cancelJoinRequest: Maybe<LeaveGroupResult>;
  castVote: Maybe<VoteResult>;
  createChallenge: Maybe<ChallengeResult>;
  createGroup: Maybe<CreateGroupResult>;
  createReward: Maybe<Reward>;
  createSubmission: Maybe<SubmissionResult>;
  createTrip: Maybe<CreateTripResult>;
  createUser: Maybe<CreateUserResult>;
  deleteChallenge: Maybe<ChallengeResult>;
  deleteFile: Maybe<StorageDeleteResult>;
  deleteGroup: Maybe<LeaveGroupResult>;
  deleteMyGroup: Maybe<LeaveGroupResult>;
  deleteTrip: Maybe<DeleteTripResult>;
  deleteUser: Maybe<DeleteUserResult>;
  forceCloseVoting: Maybe<ForceCloseVotingResult>;
  joinGroup: Maybe<JoinGroupResult>;
  leaveGroup: Maybe<LeaveGroupResult>;
  markAllNotificationsRead: Maybe<MarkAllReadResult>;
  markNotificationRead: Maybe<Notification>;
  redeemReward: Maybe<RedeemedReward>;
  removeHouseNumber: Maybe<ParticipantNumberResult>;
  removeUserFromGroup: Maybe<JoinGroupResult>;
  removeVote: Maybe<VoteResult>;
  removeWristNumber: Maybe<ParticipantNumberResult>;
  requestJoinGroup: Maybe<JoinGroupResult>;
  respondToJoinRequest: Maybe<JoinRequestResponse>;
  reviewSubmission: Maybe<SubmissionResult>;
  updateAvatar: Maybe<AvatarUpdateResult>;
  updateChallenge: Maybe<ChallengeResult>;
  updateGroup: Maybe<UpdateGroupResult>;
  updateHouseNumber: Maybe<ParticipantNumberResult>;
  updateMyProfile: Maybe<UpdateProfileResult>;
  updateNotificationPreferences: Maybe<UpdatePreferencesResult>;
  updateTrip: Maybe<UpdateTripResult>;
  updateUserName: Maybe<UpdateUserResult>;
  updateUserRole: Maybe<UpdateUserResult>;
  updateWristNumber: Maybe<ParticipantNumberResult>;
}

export interface MutationAddGroupCoinsArgs {
  input: AddGroupCoinsInput;
}

export interface MutationBanUserArgs {
  input: BanUserInput;
}

export interface MutationBulkAssignUsersArgs {
  input: BulkAssignUsersInput;
}

export interface MutationCancelJoinRequestArgs {
  groupId: Scalars["String"]["input"];
}

export interface MutationCastVoteArgs {
  input: CastVoteInput;
}

export interface MutationCreateChallengeArgs {
  input: CreateChallengeInput;
}

export interface MutationCreateGroupArgs {
  input: CreateGroupInput;
}

export interface MutationCreateRewardArgs {
  coinCost: Scalars["Int"]["input"];
  description: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  quantity: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface MutationCreateSubmissionArgs {
  input: CreateSubmissionInput;
}

export interface MutationCreateTripArgs {
  input: CreateTripInput;
}

export interface MutationCreateUserArgs {
  input: CreateUserInput;
}

export interface MutationDeleteChallengeArgs {
  input: DeleteChallengeInput;
}

export interface MutationDeleteFileArgs {
  path: Scalars["String"]["input"];
}

export interface MutationDeleteGroupArgs {
  input: DeleteGroupInput;
}

export interface MutationDeleteMyGroupArgs {
  groupId: Scalars["String"]["input"];
}

export interface MutationDeleteTripArgs {
  input: DeleteTripInput;
}

export interface MutationDeleteUserArgs {
  input: DeleteUserInput;
}

export interface MutationForceCloseVotingArgs {
  id: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

export interface MutationJoinGroupArgs {
  input: JoinGroupInput;
}

export interface MutationLeaveGroupArgs {
  groupId: Scalars["String"]["input"];
}

export interface MutationMarkNotificationReadArgs {
  id: Scalars["String"]["input"];
}

export interface MutationRedeemRewardArgs {
  input: RedeemRewardInput;
}

export interface MutationRemoveHouseNumberArgs {
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

export interface MutationRemoveUserFromGroupArgs {
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

export interface MutationRemoveVoteArgs {
  submissionId: Scalars["String"]["input"];
}

export interface MutationRemoveWristNumberArgs {
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

export interface MutationRequestJoinGroupArgs {
  input: RequestJoinGroupInput;
}

export interface MutationRespondToJoinRequestArgs {
  input: RespondJoinRequestInput;
}

export interface MutationReviewSubmissionArgs {
  input: ReviewSubmissionInput;
}

export interface MutationUpdateAvatarArgs {
  input: UpdateAvatarInput;
}

export interface MutationUpdateChallengeArgs {
  input: UpdateChallengeInput;
}

export interface MutationUpdateGroupArgs {
  input: UpdateGroupInput;
}

export interface MutationUpdateHouseNumberArgs {
  input: UpdateHouseNumberInput;
}

export interface MutationUpdateMyProfileArgs {
  input: UpdateUserProfileInput;
}

export interface MutationUpdateNotificationPreferencesArgs {
  input: UpdateNotificationPreferencesInput;
}

export interface MutationUpdateTripArgs {
  input: UpdateTripInput;
}

export interface MutationUpdateUserNameArgs {
  input: UpdateUserNameInput;
}

export interface MutationUpdateUserRoleArgs {
  input: UpdateUserRoleInput;
}

export interface MutationUpdateWristNumberArgs {
  input: UpdateWristNumberInput;
}

/** Notification entity */
export interface Notification {
  __typename?: "Notification";
  body: Maybe<Scalars["String"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  createdById: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  title: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
  url: Maybe<Scalars["String"]["output"]>;
}

export interface NotificationConnection {
  __typename?: "NotificationConnection";
  edges: Maybe<Array<Maybe<NotificationEdge>>>;
  pageInfo: PageInfo;
}

export interface NotificationEdge {
  __typename?: "NotificationEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<Notification>;
}

export interface NotificationPreferences {
  __typename?: "NotificationPreferences";
  challengeEnabled: Maybe<Scalars["Boolean"]["output"]>;
  emailEnabled: Maybe<Scalars["Boolean"]["output"]>;
  pushEnabled: Maybe<Scalars["Boolean"]["output"]>;
  rankingEnabled: Maybe<Scalars["Boolean"]["output"]>;
  systemEnabled: Maybe<Scalars["Boolean"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
}

/** Priority level for notifications */
export type NotificationPriority = "CRITICAL" | "HIGH" | "LOW" | "NORMAL";

/** Real-time notification delivery */
export interface NotificationReceivedEvent {
  __typename?: "NotificationReceivedEvent";
  body: Maybe<Scalars["String"]["output"]>;
  data: Maybe<Scalars["JSON"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  priority: Maybe<Scalars["String"]["output"]>;
  receivedAt: Maybe<Scalars["DateTime"]["output"]>;
  title: Maybe<Scalars["String"]["output"]>;
  type: Maybe<Scalars["String"]["output"]>;
}

/** Type of notification */
export type NotificationType =
  | "ACTIVITY"
  | "APPROVAL"
  | "CHALLENGE"
  | "RANKING"
  | "REMINDER"
  | "SYSTEM";

export interface PageInfo {
  __typename?: "PageInfo";
  endCursor: Maybe<Scalars["String"]["output"]>;
  hasNextPage: Scalars["Boolean"]["output"];
  hasPreviousPage: Scalars["Boolean"]["output"];
  startCursor: Maybe<Scalars["String"]["output"]>;
}

/** Participant number update result */
export interface ParticipantNumberResult {
  __typename?: "ParticipantNumberResult";
  houseNumber: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
  wristNumber: Maybe<Scalars["String"]["output"]>;
}

export interface Query {
  __typename?: "Query";
  activityFeed: Maybe<ActivityFeedConnection>;
  adminNames: Maybe<Array<AdminName>>;
  allChallenges: Maybe<Array<Challenge>>;
  allRewards: Maybe<Array<Reward>>;
  banStatusByEmail: Maybe<BanStatus>;
  challenge: Maybe<Challenge>;
  challenges: Maybe<ChallengeConnection>;
  group: Maybe<GroupWithDetails>;
  groupActivity: Maybe<ActivityFeedConnection>;
  groupGallery: Maybe<Array<GroupGallerySubmission>>;
  groupList: Maybe<Array<Group>>;
  groupRanking: Maybe<GroupRankingResult>;
  groupSubmissions: Maybe<SubmissionConnection>;
  groupTransactions: Maybe<CoinTransactionConnection>;
  groups: Maybe<GroupConnection>;
  me: Maybe<UserProfile>;
  myBanStatus: Maybe<BanStatus>;
  myGroup: Maybe<GroupWithDetails>;
  myGroupBalance: Maybe<CoinBalance>;
  myGroupInfo: Maybe<UserWithGroupInfo>;
  myJoinRequest: Maybe<GroupJoinRequest>;
  myNotifications: Maybe<NotificationConnection>;
  myRedeemedRewards: Maybe<Array<RedeemedReward>>;
  mySubmissions: Maybe<SubmissionConnection>;
  myTrips: Maybe<TripConnection>;
  myVotes: Maybe<Array<ChallengeVote>>;
  notificationPreferences: Maybe<NotificationPreferences>;
  pendingJoinRequests: Maybe<Array<GroupJoinRequest>>;
  pendingSubmissions: Maybe<SubmissionConnection>;
  rewards: Maybe<RewardConnection>;
  searchUsers: Maybe<UserConnection>;
  sponsors: Maybe<Array<Sponsor>>;
  submissionVotes: Maybe<Array<ChallengeVote>>;
  trip: Maybe<TripWithParticipants>;
  tripAdmin: Maybe<TripWithParticipants>;
  tripParticipant: Maybe<TripParticipantInfo>;
  tripResources: Maybe<TripResourcesResult>;
  uploadUrl: Maybe<StorageUploadUrl>;
  user: Maybe<User>;
  userWithGroup: Maybe<UserWithGroupInfo>;
  users: Maybe<UserConnection>;
}

export interface QueryActivityFeedArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QueryBanStatusByEmailArgs {
  input: GetUserByEmailInput;
}

export interface QueryChallengeArgs {
  id: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

export interface QueryChallengesArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QueryGroupArgs {
  id: Scalars["String"]["input"];
}

export interface QueryGroupActivityArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  groupId: Scalars["String"]["input"];
}

export interface QueryGroupGalleryArgs {
  groupId: Scalars["String"]["input"];
}

export interface QueryGroupListArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryGroupRankingArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryGroupSubmissionsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  challengeId: Scalars["String"]["input"];
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QueryGroupTransactionsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  groupId: Scalars["String"]["input"];
}

export interface QueryGroupsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QueryMyGroupArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryMyGroupBalanceArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryMyGroupInfoArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryMyJoinRequestArgs {
  groupId: Scalars["String"]["input"];
}

export interface QueryMyNotificationsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
}

export interface QueryMyRedeemedRewardsArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryMySubmissionsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QueryMyTripsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
}

export interface QueryMyVotesArgs {
  challengeId: Scalars["String"]["input"];
}

export interface QueryPendingJoinRequestsArgs {
  groupId: Scalars["String"]["input"];
}

export interface QueryPendingSubmissionsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QueryRewardsArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QuerySearchUsersArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  field: Scalars["String"]["input"];
  first: InputMaybe<Scalars["Int"]["input"]>;
  searchTerm: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface QuerySubmissionVotesArgs {
  submissionId: Scalars["String"]["input"];
}

export interface QueryTripArgs {
  id: Scalars["String"]["input"];
}

export interface QueryTripAdminArgs {
  id: Scalars["String"]["input"];
}

export interface QueryTripParticipantArgs {
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

export interface QueryTripResourcesArgs {
  tripId: Scalars["String"]["input"];
}

export interface QueryUploadUrlArgs {
  input: GetUploadUrlInput;
}

export interface QueryUserArgs {
  id: Scalars["String"]["input"];
}

export interface QueryUserWithGroupArgs {
  id: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

export interface QueryUsersArgs {
  after: InputMaybe<Scalars["String"]["input"]>;
  first: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
}

export interface RedeemRewardInput {
  rewardId: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
}

export interface RedeemedReward {
  __typename?: "RedeemedReward";
  groupId: Maybe<Scalars["ID"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  redeemedAt: Maybe<Scalars["DateTime"]["output"]>;
  reward: Maybe<Reward>;
  rewardId: Maybe<Scalars["ID"]["output"]>;
  status: Maybe<Scalars["String"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
}

export interface RequestJoinGroupInput {
  groupId: Scalars["String"]["input"];
}

export interface RespondJoinRequestInput {
  accept: Scalars["Boolean"]["input"];
  requestId: Scalars["String"]["input"];
}

export interface ReviewSubmissionInput {
  awardedPoints?: InputMaybe<Scalars["Int"]["input"]>;
  bonusPoints?: InputMaybe<Scalars["Int"]["input"]>;
  rejectionReason?: InputMaybe<Scalars["String"]["input"]>;
  status: SubmissionStatus;
  submissionId: Scalars["String"]["input"];
}

/** Reward entity */
export interface Reward {
  __typename?: "Reward";
  availableQuantity: Maybe<Scalars["Int"]["output"]>;
  coinCost: Maybe<Scalars["Int"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  createdById: Maybe<Scalars["ID"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isHidden: Maybe<Scalars["Boolean"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

export interface RewardConnection {
  __typename?: "RewardConnection";
  edges: Maybe<Array<Maybe<RewardEdge>>>;
  pageInfo: PageInfo;
}

export interface RewardEdge {
  __typename?: "RewardEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<Reward>;
}

/** User role in the system */
export type Role = "ADMIN" | "MODERATOR" | "SERVICE" | "USER";

/** How challenge submissions are scored */
export type ScoringCategory =
  | "JUDGED_STAFF"
  | "PEER_VOTING"
  | "SPEED"
  | "UNLIMITED";

export interface SearchUsersInput {
  field: Scalars["String"]["input"];
  searchTerm?: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
}

/** Sponsor entity */
export interface Sponsor {
  __typename?: "Sponsor";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  height: Maybe<Scalars["Float"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  isActive: Maybe<Scalars["Boolean"]["output"]>;
  logoPath: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  offsetX: Maybe<Scalars["Float"]["output"]>;
  offsetY: Maybe<Scalars["Float"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

export interface StorageDeleteResult {
  __typename?: "StorageDeleteResult";
  path: Maybe<Scalars["String"]["output"]>;
  success: Maybe<Scalars["Boolean"]["output"]>;
}

/** Pre-signed upload URL for storage */
export interface StorageUploadUrl {
  __typename?: "StorageUploadUrl";
  expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  path: Maybe<Scalars["String"]["output"]>;
  url: Maybe<Scalars["String"]["output"]>;
}

export interface SubmissionConnection {
  __typename?: "SubmissionConnection";
  edges: Maybe<Array<Maybe<SubmissionEdge>>>;
  pageInfo: PageInfo;
}

export interface SubmissionEdge {
  __typename?: "SubmissionEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<ChallengeSubmission>;
}

export interface SubmissionResult {
  __typename?: "SubmissionResult";
  id: Maybe<Scalars["ID"]["output"]>;
  status: Maybe<Scalars["String"]["output"]>;
}

/** Challenge submission review notification */
export interface SubmissionReviewedEvent {
  __typename?: "SubmissionReviewedEvent";
  awardedPoints: Maybe<Scalars["Int"]["output"]>;
  challengeId: Maybe<Scalars["ID"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  reviewedAt: Maybe<Scalars["DateTime"]["output"]>;
  status: Maybe<Scalars["String"]["output"]>;
  submissionId: Maybe<Scalars["ID"]["output"]>;
}

/** Status of a challenge submission */
export type SubmissionStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface SubmissionSubscriptionFilter {
  challengeId?: InputMaybe<Scalars["String"]["input"]>;
  groupId: Scalars["String"]["input"];
}

/** Type of challenge submission required */
export type SubmissionType =
  | "IMAGE"
  | "IMAGE_LOCATION"
  | "LOCATION"
  | "MULTI_IMAGE"
  | "QR_CODE"
  | "TEXT"
  | "VIDEO";

export interface Subscription {
  __typename?: "Subscription";
  activityFeedEvent: Maybe<ActivityFeedEvent>;
  challengeStatusEvent: Maybe<ChallengeStatusEvent>;
  /** Subscribe to real-time location updates from a friend */
  friendLocationEvent: Maybe<FriendLocationEvent>;
  groupRankingEvent: Maybe<GroupRankingEvent>;
  joinRequestEvent: Maybe<JoinRequestEvent>;
  notificationReceived: Maybe<NotificationReceivedEvent>;
  submissionReviewed: Maybe<SubmissionReviewedEvent>;
}

export interface SubscriptionActivityFeedEventArgs {
  filter: ActivityFeedSubscriptionFilter;
}

export interface SubscriptionChallengeStatusEventArgs {
  filter: ChallengeSubscriptionFilter;
}

export interface SubscriptionFriendLocationEventArgs {
  friendId: Scalars["ID"]["input"];
}

export interface SubscriptionGroupRankingEventArgs {
  filter: GroupSubscriptionFilter;
}

export interface SubscriptionJoinRequestEventArgs {
  filter: InputMaybe<JoinRequestSubscriptionFilter>;
}

export interface SubscriptionSubmissionReviewedArgs {
  filter: SubmissionSubscriptionFilter;
}

/** Trip entity representing a travel event */
export interface Trip {
  __typename?: "Trip";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  endDate: Maybe<Scalars["DateTime"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isActive: Maybe<Scalars["Boolean"]["output"]>;
  location: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  startDate: Maybe<Scalars["DateTime"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

export interface TripConnection {
  __typename?: "TripConnection";
  edges: Maybe<Array<Maybe<TripEdge>>>;
  pageInfo: PageInfo;
}

export interface TripEdge {
  __typename?: "TripEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<Trip>;
}

/** Group information within trip context */
export interface TripGroup {
  __typename?: "TripGroup";
  code: Maybe<Scalars["String"]["output"]>;
  coins: Maybe<Scalars["Int"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isDeleted: Maybe<Scalars["Boolean"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  participantCount: Maybe<Scalars["Int"]["output"]>;
}

/** Basic trip information */
export interface TripInfo {
  __typename?: "TripInfo";
  id: Maybe<Scalars["ID"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
}

/** Trip insurance information */
export interface TripInsurance {
  __typename?: "TripInsurance";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  policyNumber: Maybe<Scalars["String"]["output"]>;
  provider: Maybe<Scalars["String"]["output"]>;
  steps: Maybe<Array<InsuranceStep>>;
  title: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

/** Detailed trip participant information */
export interface TripParticipantDetail {
  __typename?: "TripParticipantDetail";
  group: Maybe<TripGroup>;
  houseNumber: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  user: Maybe<TripParticipantUser>;
  userId: Maybe<Scalars["ID"]["output"]>;
  wristNumber: Maybe<Scalars["String"]["output"]>;
}

/** Trip participant information */
export interface TripParticipantInfo {
  __typename?: "TripParticipantInfo";
  group: Maybe<GroupInfo>;
  houseNumber: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  userId: Maybe<Scalars["ID"]["output"]>;
  wristNumber: Maybe<Scalars["String"]["output"]>;
}

/** User information for trip participant */
export interface TripParticipantUser {
  __typename?: "TripParticipantUser";
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  role: Maybe<Scalars["String"]["output"]>;
}

/** Trip resource or document */
export interface TripResource {
  __typename?: "TripResource";
  content: Maybe<Scalars["String"]["output"]>;
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  iconName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  sortOrder: Maybe<Scalars["Int"]["output"]>;
  title: Maybe<Scalars["String"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

/** Trip resources query result */
export interface TripResourcesResult {
  __typename?: "TripResourcesResult";
  insurance: Maybe<TripInsurance>;
  resources: Maybe<Array<TripResource>>;
}

/** Sponsor association with trip */
export interface TripSponsor {
  __typename?: "TripSponsor";
  id: Maybe<Scalars["ID"]["output"]>;
  sponsor: Maybe<Sponsor>;
  sponsorId: Maybe<Scalars["ID"]["output"]>;
  tripId: Maybe<Scalars["ID"]["output"]>;
}

/** Trip with groups and sponsors */
export interface TripWithDetails {
  __typename?: "TripWithDetails";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  endDate: Maybe<Scalars["DateTime"]["output"]>;
  groups: Maybe<Array<TripGroup>>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isActive: Maybe<Scalars["Boolean"]["output"]>;
  location: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  startDate: Maybe<Scalars["DateTime"]["output"]>;
  tripSponsors: Maybe<Array<TripSponsor>>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

/** Trip with full details including participants */
export interface TripWithParticipants {
  __typename?: "TripWithParticipants";
  createdAt: Maybe<Scalars["DateTime"]["output"]>;
  description: Maybe<Scalars["String"]["output"]>;
  endDate: Maybe<Scalars["DateTime"]["output"]>;
  groups: Maybe<Array<TripGroup>>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isActive: Maybe<Scalars["Boolean"]["output"]>;
  location: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  participants: Maybe<Array<TripParticipantDetail>>;
  startDate: Maybe<Scalars["DateTime"]["output"]>;
  tripSponsors: Maybe<Array<TripSponsor>>;
  updatedAt: Maybe<Scalars["DateTime"]["output"]>;
}

export interface UpdateAvatarInput {
  hasAvatar: Scalars["Boolean"]["input"];
}

export interface UpdateChallengeInput {
  autoApprove?: InputMaybe<Scalars["Boolean"]["input"]>;
  basePoints?: InputMaybe<Scalars["Int"]["input"]>;
  dailyEndTime?: InputMaybe<Scalars["String"]["input"]>;
  dailyStartTime?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  firstPlacePoints?: InputMaybe<Scalars["Int"]["input"]>;
  id: Scalars["String"]["input"];
  image?: InputMaybe<Scalars["String"]["input"]>;
  isRecurring?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  qrCodeValue?: InputMaybe<Scalars["String"]["input"]>;
  recurringDays?: InputMaybe<Scalars["Int"]["input"]>;
  scoringCategory?: InputMaybe<ScoringCategory>;
  secondPlacePoints?: InputMaybe<Scalars["Int"]["input"]>;
  startTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<ChallengeStatus>;
  submissionType?: InputMaybe<SubmissionType>;
  targetLatitude?: InputMaybe<Scalars["Float"]["input"]>;
  targetLongitude?: InputMaybe<Scalars["Float"]["input"]>;
  textExpectedPhrase?: InputMaybe<Scalars["String"]["input"]>;
  thirdPlacePoints?: InputMaybe<Scalars["Int"]["input"]>;
  tripId: Scalars["String"]["input"];
  votingDurationHours?: InputMaybe<Scalars["Int"]["input"]>;
  votingEndTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  votingStartTime?: InputMaybe<Scalars["DateTime"]["input"]>;
}

export interface UpdateGroupInput {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["String"]["input"];
  image?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  organizerId?: InputMaybe<Scalars["String"]["input"]>;
  tripId: Scalars["String"]["input"];
}

/** Group update result */
export interface UpdateGroupResult {
  __typename?: "UpdateGroupResult";
  description: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  organizerId: Maybe<Scalars["ID"]["output"]>;
}

export interface UpdateHouseNumberInput {
  houseNumber: Scalars["String"]["input"];
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

export interface UpdateNotificationPreferencesInput {
  challengeEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  emailEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  pushEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  rankingEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
  systemEnabled?: InputMaybe<Scalars["Boolean"]["input"]>;
}

export interface UpdatePreferencesResult {
  __typename?: "UpdatePreferencesResult";
  challengeEnabled: Maybe<Scalars["Boolean"]["output"]>;
  emailEnabled: Maybe<Scalars["Boolean"]["output"]>;
  pushEnabled: Maybe<Scalars["Boolean"]["output"]>;
  rankingEnabled: Maybe<Scalars["Boolean"]["output"]>;
  systemEnabled: Maybe<Scalars["Boolean"]["output"]>;
}

/** User profile update result */
export interface UpdateProfileResult {
  __typename?: "UpdateProfileResult";
  firstName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
}

export interface UpdateTripInput {
  backgroundImagePath?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  id: Scalars["String"]["input"];
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
}

/** Trip update result */
export interface UpdateTripResult {
  __typename?: "UpdateTripResult";
  description: Maybe<Scalars["String"]["output"]>;
  endDate: Maybe<Scalars["DateTime"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  image: Maybe<Scalars["String"]["output"]>;
  isActive: Maybe<Scalars["Boolean"]["output"]>;
  location: Maybe<Scalars["String"]["output"]>;
  name: Maybe<Scalars["String"]["output"]>;
  startDate: Maybe<Scalars["DateTime"]["output"]>;
}

export interface UpdateUserNameInput {
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
}

export interface UpdateUserProfileInput {
  firstName: Scalars["String"]["input"];
  lastName: Scalars["String"]["input"];
}

/** User update result */
export interface UpdateUserResult {
  __typename?: "UpdateUserResult";
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  role: Maybe<Role>;
}

export interface UpdateUserRoleInput {
  role: Role;
  userId: Scalars["String"]["input"];
}

export interface UpdateWristNumberInput {
  tripId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
  wristNumber: Scalars["String"]["input"];
}

/** User entity */
export interface User {
  __typename?: "User";
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  fullName: Maybe<Scalars["String"]["output"]>;
  hasAvatar: Maybe<Scalars["Boolean"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  role: Maybe<Role>;
}

export interface UserConnection {
  __typename?: "UserConnection";
  edges: Maybe<Array<Maybe<UserEdge>>>;
  pageInfo: PageInfo;
}

export interface UserEdge {
  __typename?: "UserEdge";
  cursor: Scalars["String"]["output"];
  node: Maybe<UserWithTripInfo>;
}

/** User profile information */
export interface UserProfile {
  __typename?: "UserProfile";
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  hasAvatar: Maybe<Scalars["Boolean"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  role: Maybe<Role>;
}

/** User's trip membership with group info */
export interface UserTripInfo {
  __typename?: "UserTripInfo";
  group: Maybe<GroupInfo>;
  trip: Maybe<TripInfo>;
  tripId: Maybe<Scalars["ID"]["output"]>;
}

/** User with group information for a trip */
export interface UserWithGroupInfo {
  __typename?: "UserWithGroupInfo";
  firstName: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  organizerGroup: Maybe<GroupInfo>;
  trips: Maybe<Array<UserTripInfo>>;
}

/** User with trip participant information */
export interface UserWithTripInfo {
  __typename?: "UserWithTripInfo";
  banReason: Maybe<Scalars["String"]["output"]>;
  bannedUntil: Maybe<Scalars["String"]["output"]>;
  email: Maybe<Scalars["String"]["output"]>;
  firstName: Maybe<Scalars["String"]["output"]>;
  groupId: Maybe<Scalars["ID"]["output"]>;
  groupName: Maybe<Scalars["String"]["output"]>;
  hasAvatar: Maybe<Scalars["Boolean"]["output"]>;
  houseNumber: Maybe<Scalars["String"]["output"]>;
  id: Maybe<Scalars["ID"]["output"]>;
  isBanned: Maybe<Scalars["Boolean"]["output"]>;
  lastName: Maybe<Scalars["String"]["output"]>;
  role: Maybe<Role>;
  tripId: Maybe<Scalars["ID"]["output"]>;
  wristNumber: Maybe<Scalars["String"]["output"]>;
}

export interface VoteResult {
  __typename?: "VoteResult";
  id: Maybe<Scalars["ID"]["output"]>;
  score: Maybe<Scalars["Int"]["output"]>;
  submissionId: Maybe<Scalars["ID"]["output"]>;
}

/** Type of vote on a submission */
export type VoteType = "DOWNVOTE" | "UPVOTE";
