import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Arbitrary precision integer */
  BigInt: { input: any; output: any; }
  /** ISO 8601 date time string */
  DateTime: { input: Date; output: Date; }
  /** RFC 5322 compliant email address */
  EmailAddress: { input: any; output: any; }
  /** Arbitrary JSON object */
  JSONObject: { input: any; output: any; }
  /** RFC 3986 compliant URL */
  URL: { input: any; output: any; }
  /** Universally unique identifier */
  UUID: { input: any; output: any; }
};

/** An activity feed item in a trip */
export type Activity = {
  __typename?: 'Activity';
  activityType?: Maybe<ActivityType>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  hiddenAt?: Maybe<Scalars['DateTime']['output']>;
  hiddenByAdmin?: Maybe<Scalars['ID']['output']>;
  hiddenReason?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isHidden?: Maybe<Scalars['Boolean']['output']>;
  isPinned?: Maybe<Scalars['Boolean']['output']>;
  metadata?: Maybe<Scalars['JSONObject']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of activities for Relay pagination */
export type ActivityConnection = {
  __typename?: 'ActivityConnection';
  edges?: Maybe<Array<ActivityEdge>>;
  nodes?: Maybe<Array<Activity>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in an activity connection */
export type ActivityEdge = {
  __typename?: 'ActivityEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Activity>;
};

/** A reaction on an activity feed item */
export type ActivityReaction = {
  __typename?: 'ActivityReaction';
  activityId?: Maybe<Scalars['ID']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  reactionType?: Maybe<ReactionType>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** The type of activity feed item */
export enum ActivityType {
  Announcement = 'ANNOUNCEMENT',
  Challenge = 'CHALLENGE',
  Custom = 'CUSTOM',
  General = 'GENERAL',
  RankChange = 'RANK_CHANGE',
  Submission = 'SUBMISSION'
}

/** Input for approving a challenge submission */
export type ApproveChallengeSubmissionInput = {
  notes?: InputMaybe<Scalars['String']['input']>;
  score?: InputMaybe<Scalars['Int']['input']>;
  submissionId: Scalars['ID']['input'];
};

/** Input for approving a group join request */
export type ApproveGroupJoinRequestInput = {
  groupId: Scalars['ID']['input'];
  requestId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** Input for cancelling a reward purchase */
export type CancelRewardPurchaseInput = {
  purchaseId: Scalars['ID']['input'];
};

/** A challenge in the system */
export type Challenge = {
  __typename?: 'Challenge';
  allowVoting?: Maybe<Scalars['Boolean']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dailyEndTime?: Maybe<Scalars['DateTime']['output']>;
  dailyStartTime?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  maxSubmissions?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  points?: Maybe<Scalars['Int']['output']>;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<ChallengeStatus>;
  submissionType?: Maybe<SubmissionType>;
  tripId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<SubmissionType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  votingEndTime?: Maybe<Scalars['DateTime']['output']>;
  votingStartTime?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of challenges for Relay pagination */
export type ChallengeConnection = {
  __typename?: 'ChallengeConnection';
  edges?: Maybe<Array<ChallengeEdge>>;
  nodes?: Maybe<Array<Challenge>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a challenge connection */
export type ChallengeEdge = {
  __typename?: 'ChallengeEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Challenge>;
};

/** The status of a challenge */
export enum ChallengeStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Hidden = 'HIDDEN',
  Visible = 'VISIBLE',
  VotingPhase = 'VOTING_PHASE'
}

/** A submission to a challenge */
export type ChallengeSubmission = {
  __typename?: 'ChallengeSubmission';
  challengeId?: Maybe<Scalars['ID']['output']>;
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mediaUrls?: Maybe<Array<Scalars['String']['output']>>;
  score?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<SubmissionStatus>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
  voteScore?: Maybe<Scalars['Int']['output']>;
};

/** A connection of challenge submissions for Relay pagination */
export type ChallengeSubmissionConnection = {
  __typename?: 'ChallengeSubmissionConnection';
  edges?: Maybe<Array<ChallengeSubmissionEdge>>;
  nodes?: Maybe<Array<ChallengeSubmission>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a challenge submission connection */
export type ChallengeSubmissionEdge = {
  __typename?: 'ChallengeSubmissionEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<ChallengeSubmission>;
};

/** A vote on a challenge submission */
export type ChallengeVote = {
  __typename?: 'ChallengeVote';
  challengeId?: Maybe<Scalars['ID']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  points?: Maybe<Scalars['Int']['output']>;
  position?: Maybe<Scalars['Int']['output']>;
  submissionId?: Maybe<Scalars['ID']['output']>;
  voterId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of challenge votes for Relay pagination */
export type ChallengeVoteConnection = {
  __typename?: 'ChallengeVoteConnection';
  edges?: Maybe<Array<ChallengeVoteEdge>>;
  nodes?: Maybe<Array<ChallengeVote>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a challenge vote connection */
export type ChallengeVoteEdge = {
  __typename?: 'ChallengeVoteEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<ChallengeVote>;
};

/** A coin transaction in the system */
export type CoinTransaction = {
  __typename?: 'CoinTransaction';
  admin?: Maybe<CoinTransactionAdmin>;
  adminId?: Maybe<Scalars['ID']['output']>;
  amount?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  group?: Maybe<CoinTransactionGroup>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** Admin information for a coin transaction */
export type CoinTransactionAdmin = {
  __typename?: 'CoinTransactionAdmin';
  firstName?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
};

/** A connection of coin transactions for Relay pagination */
export type CoinTransactionConnection = {
  __typename?: 'CoinTransactionConnection';
  edges?: Maybe<Array<CoinTransactionEdge>>;
  nodes?: Maybe<Array<CoinTransaction>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a coin transaction connection */
export type CoinTransactionEdge = {
  __typename?: 'CoinTransactionEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<CoinTransaction>;
};

/** Group information for a coin transaction */
export type CoinTransactionGroup = {
  __typename?: 'CoinTransactionGroup';
  coins?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

/** Input for creating a challenge */
export type CreateChallengeInput = {
  autoApprove?: InputMaybe<Scalars['Boolean']['input']>;
  basePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Time in HH:MM format */
  dailyEndTime?: InputMaybe<Scalars['String']['input']>;
  /** Time in HH:MM format */
  dailyStartTime?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  expectedValue?: InputMaybe<Scalars['String']['input']>;
  firstPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  isRecurring?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  /** Scoring category: SPEED, UNLIMITED, JUDGED_STAFF, or PEER_VOTING */
  scoringCategory: ScoringCategory;
  secondPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<ChallengeStatus>;
  /** Type of submission accepted: PHOTO, VIDEO, or TEXT */
  submissionType: SubmissionType;
  targetLatitude?: InputMaybe<Scalars['Float']['input']>;
  targetLongitude?: InputMaybe<Scalars['Float']['input']>;
  thirdPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};

/** Input for creating a challenge submission */
export type CreateChallengeSubmissionInput = {
  challengeId: Scalars['ID']['input'];
  content?: InputMaybe<Scalars['String']['input']>;
  groupId?: InputMaybe<Scalars['ID']['input']>;
  mediaUrls?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Input for creating a challenge vote */
export type CreateChallengeVoteInput = {
  challengeId: Scalars['ID']['input'];
  /** Points to award */
  points?: InputMaybe<Scalars['Int']['input']>;
  /** Vote position (1, 2, 3, etc.) */
  position: Scalars['Int']['input'];
  submissionId: Scalars['ID']['input'];
};

/** Input for creating a custom activity */
export type CreateCustomActivityInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  title: Scalars['String']['input'];
  tripId: Scalars['ID']['input'];
};

/** Input for creating a new group */
export type CreateGroupInput = {
  code: Scalars['String']['input'];
  coins: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizerId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
};

/** Input for creating a group join request */
export type CreateGroupJoinRequestInput = {
  groupId: Scalars['ID']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};

/** Input for creating a notification */
export type CreateNotificationInput = {
  body: Scalars['String']['input'];
  priority: NotificationPriority;
  scheduledFor?: InputMaybe<Scalars['DateTime']['input']>;
  title: Scalars['String']['input'];
  tripId?: InputMaybe<Scalars['ID']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a notification schedule */
export type CreateNotificationScheduleInput = {
  endDate: Scalars['DateTime']['input'];
  hour: Scalars['Int']['input'];
  isActive: Scalars['Boolean']['input'];
  minute: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  notificationBody?: InputMaybe<Scalars['String']['input']>;
  notificationTitle?: InputMaybe<Scalars['String']['input']>;
  notificationType: NotificationScheduleType;
  notificationUrl?: InputMaybe<Scalars['String']['input']>;
  startDate: Scalars['DateTime']['input'];
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for creating a reward */
export type CreateRewardInput = {
  availableQuantity: Scalars['Int']['input'];
  coinCostPercentage: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  isHidden?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  tripId: Scalars['ID']['input'];
};

/** Input for creating a trip */
export type CreateTripInput = {
  basePrice?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  destination: Scalars['String']['input'];
  endDate: Scalars['DateTime']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  registrationDeadline?: InputMaybe<Scalars['DateTime']['input']>;
  startDate: Scalars['DateTime']['input'];
  totalSpots?: InputMaybe<Scalars['Int']['input']>;
};

/** Result of deleting a trip */
export type DeleteTripResult = {
  __typename?: 'DeleteTripResult';
  success?: Maybe<Scalars['Boolean']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
};

/** Status of a notification delivery */
export enum DeliveryStatus {
  Failed = 'FAILED',
  Pending = 'PENDING',
  Retrying = 'RETRYING',
  Sent = 'SENT'
}

/** An event in the system */
export type Event = {
  __typename?: 'Event';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdById?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  endTime?: Maybe<Scalars['DateTime']['output']>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  maxParticipants?: Maybe<Scalars['Int']['output']>;
  startTime?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of events for Relay pagination */
export type EventConnection = {
  __typename?: 'EventConnection';
  edges?: Maybe<Array<EventEdge>>;
  nodes?: Maybe<Array<Event>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in an event connection */
export type EventEdge = {
  __typename?: 'EventEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Event>;
};

/** A friend's location for trip location sharing */
export type FriendLocation = {
  __typename?: 'FriendLocation';
  accuracy?: Maybe<Scalars['BigInt']['output']>;
  isSharing?: Maybe<Scalars['Boolean']['output']>;
  lastUpdated?: Maybe<Scalars['DateTime']['output']>;
  latitude?: Maybe<Scalars['BigInt']['output']>;
  longitude?: Maybe<Scalars['BigInt']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A group within a trip */
export type Group = {
  __typename?: 'Group';
  coins?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  memberCount?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  organizerId?: Maybe<Scalars['ID']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of groups for Relay pagination */
export type GroupConnection = {
  __typename?: 'GroupConnection';
  edges?: Maybe<Array<GroupEdge>>;
  nodes?: Maybe<Array<Group>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a group connection */
export type GroupEdge = {
  __typename?: 'GroupEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Group>;
};

/** A request to join a group */
export type GroupJoinRequest = {
  __typename?: 'GroupJoinRequest';
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  requestedAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<JoinRequestStatus>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of group join requests for Relay pagination */
export type GroupJoinRequestConnection = {
  __typename?: 'GroupJoinRequestConnection';
  edges?: Maybe<Array<GroupJoinRequestEdge>>;
  nodes?: Maybe<Array<GroupJoinRequest>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a group join request connection */
export type GroupJoinRequestEdge = {
  __typename?: 'GroupJoinRequestEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<GroupJoinRequest>;
};

/** A member of a group */
export type GroupMember = {
  __typename?: 'GroupMember';
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  joinedAt?: Maybe<Scalars['DateTime']['output']>;
  role?: Maybe<GroupRole>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of group members for Relay pagination */
export type GroupMemberConnection = {
  __typename?: 'GroupMemberConnection';
  edges?: Maybe<Array<GroupMemberEdge>>;
  nodes?: Maybe<Array<GroupMember>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a group member connection */
export type GroupMemberEdge = {
  __typename?: 'GroupMemberEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<GroupMember>;
};

/** Role of a member within a group */
export enum GroupRole {
  Member = 'MEMBER',
  Organizer = 'ORGANIZER'
}

/** Result of hiding or unhiding an activity */
export type HiddenActivityResult = {
  __typename?: 'HiddenActivityResult';
  activity?: Maybe<Activity>;
  message?: Maybe<Scalars['String']['output']>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

/** Input for hiding an activity */
export type HideActivityInput = {
  activityId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};

/** Input for inviting someone to a trip */
export type InviteToTripInput = {
  /** Role to assign (MEMBER or LEADER) */
  role?: InputMaybe<TripParticipantRole>;
  tripId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** Input for joining a group */
export type JoinGroupInput = {
  groupId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** Status of a group join request */
export enum JoinRequestStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

/** Input for joining a trip */
export type JoinTripInput = {
  /** Role in the trip (MEMBER or LEADER) */
  role?: InputMaybe<TripParticipantRole>;
  tripId: Scalars['ID']['input'];
};

/** Status of the last schedule execution */
export enum LastRunStatus {
  Failure = 'FAILURE',
  PartialFailure = 'PARTIAL_FAILURE',
  Skipped = 'SKIPPED',
  Success = 'SUCCESS'
}

/** Input for leaving a group */
export type LeaveGroupInput = {
  groupId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** Result of leaving a trip */
export type LeaveTripResult = {
  __typename?: 'LeaveTripResult';
  success?: Maybe<Scalars['Boolean']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
};

/** A location record for user location sharing */
export type Location = {
  __typename?: 'Location';
  accuracy?: Maybe<Scalars['BigInt']['output']>;
  altitude?: Maybe<Scalars['BigInt']['output']>;
  altitudeAccuracy?: Maybe<Scalars['BigInt']['output']>;
  batteryLevel?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  heading?: Maybe<Scalars['BigInt']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isSharingLocation?: Maybe<Scalars['Boolean']['output']>;
  latitude?: Maybe<Scalars['BigInt']['output']>;
  longitude?: Maybe<Scalars['BigInt']['output']>;
  speed?: Maybe<Scalars['BigInt']['output']>;
  timestamp?: Maybe<Scalars['DateTime']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of locations for Relay pagination */
export type LocationConnection = {
  __typename?: 'LocationConnection';
  edges?: Maybe<Array<LocationEdge>>;
  nodes?: Maybe<Array<Location>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a location connection */
export type LocationEdge = {
  __typename?: 'LocationEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Location>;
};

/** Result of starting or stopping location sharing */
export type LocationSharingResult = {
  __typename?: 'LocationSharingResult';
  isSharingLocation?: Maybe<Scalars['Boolean']['output']>;
  sharedWithCount?: Maybe<Scalars['Int']['output']>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

/** Root Mutation type */
export type Mutation = {
  __typename?: 'Mutation';
  approveChallengeSubmission?: Maybe<ChallengeSubmission>;
  approveGroupJoinRequest?: Maybe<GroupJoinRequest>;
  cancelRewardPurchase?: Maybe<RewardPurchase>;
  createChallenge?: Maybe<Challenge>;
  createChallengeSubmission?: Maybe<ChallengeSubmission>;
  createChallengeVote?: Maybe<ChallengeVote>;
  createCustomActivity?: Maybe<Activity>;
  createGroup?: Maybe<Group>;
  createGroupJoinRequest?: Maybe<GroupJoinRequest>;
  createNotification?: Maybe<Notification>;
  createNotificationSchedule?: Maybe<NotificationSchedule>;
  createReward?: Maybe<Reward>;
  createTrip?: Maybe<Trip>;
  deleteActivity?: Maybe<Scalars['Boolean']['output']>;
  deleteChallenge?: Maybe<Scalars['Boolean']['output']>;
  deleteGroup?: Maybe<Scalars['Boolean']['output']>;
  deleteNotification?: Maybe<Scalars['Boolean']['output']>;
  deleteNotificationSchedule?: Maybe<Scalars['Boolean']['output']>;
  deleteReward?: Maybe<Scalars['Boolean']['output']>;
  deleteTrip?: Maybe<DeleteTripResult>;
  hideActivity?: Maybe<HiddenActivityResult>;
  inviteToTrip?: Maybe<TripParticipant>;
  joinGroup?: Maybe<GroupMember>;
  joinTrip?: Maybe<TripParticipant>;
  leaveGroup?: Maybe<Scalars['Boolean']['output']>;
  leaveTrip?: Maybe<LeaveTripResult>;
  markAllNotificationsRead?: Maybe<Scalars['Boolean']['output']>;
  markNotificationRead?: Maybe<Notification>;
  purchaseReward?: Maybe<RewardPurchase>;
  redeemReward?: Maybe<RewardPurchase>;
  rejectChallengeSubmission?: Maybe<ChallengeSubmission>;
  rejectGroupJoinRequest?: Maybe<GroupJoinRequest>;
  scheduleNotification?: Maybe<Notification>;
  setActivityPinned?: Maybe<Activity>;
  /** Start sharing location with specified friends or all friends */
  startLocationSharing?: Maybe<LocationSharingResult>;
  /** Stop sharing location with all friends */
  stopLocationSharing?: Maybe<LocationSharingResult>;
  toggleActivityReaction?: Maybe<Activity>;
  toggleNotificationScheduleActive?: Maybe<NotificationSchedule>;
  unhideActivity?: Maybe<HiddenActivityResult>;
  updateActivity?: Maybe<Activity>;
  updateChallenge?: Maybe<Challenge>;
  updateGroup?: Maybe<Group>;
  /** Update the current user's location coordinates */
  updateLocation?: Maybe<Location>;
  updateNotification?: Maybe<Notification>;
  updateNotificationSchedule?: Maybe<NotificationSchedule>;
  updateNotificationStatus?: Maybe<Notification>;
  updateReward?: Maybe<Reward>;
  updateTrip?: Maybe<Trip>;
  uploadTripResource?: Maybe<TripResource>;
};


/** Root Mutation type */
export type MutationApproveChallengeSubmissionArgs = {
  input: ApproveChallengeSubmissionInput;
};


/** Root Mutation type */
export type MutationApproveGroupJoinRequestArgs = {
  input: ApproveGroupJoinRequestInput;
};


/** Root Mutation type */
export type MutationCancelRewardPurchaseArgs = {
  input: CancelRewardPurchaseInput;
};


/** Root Mutation type */
export type MutationCreateChallengeArgs = {
  input: CreateChallengeInput;
};


/** Root Mutation type */
export type MutationCreateChallengeSubmissionArgs = {
  input: CreateChallengeSubmissionInput;
};


/** Root Mutation type */
export type MutationCreateChallengeVoteArgs = {
  input: CreateChallengeVoteInput;
};


/** Root Mutation type */
export type MutationCreateCustomActivityArgs = {
  input: CreateCustomActivityInput;
};


/** Root Mutation type */
export type MutationCreateGroupArgs = {
  input: CreateGroupInput;
};


/** Root Mutation type */
export type MutationCreateGroupJoinRequestArgs = {
  input: CreateGroupJoinRequestInput;
};


/** Root Mutation type */
export type MutationCreateNotificationArgs = {
  input: CreateNotificationInput;
};


/** Root Mutation type */
export type MutationCreateNotificationScheduleArgs = {
  input: CreateNotificationScheduleInput;
};


/** Root Mutation type */
export type MutationCreateRewardArgs = {
  input: CreateRewardInput;
};


/** Root Mutation type */
export type MutationCreateTripArgs = {
  input: CreateTripInput;
};


/** Root Mutation type */
export type MutationDeleteActivityArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationDeleteChallengeArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationDeleteGroupArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationDeleteNotificationArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationDeleteNotificationScheduleArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationDeleteRewardArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationDeleteTripArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationHideActivityArgs = {
  input: HideActivityInput;
};


/** Root Mutation type */
export type MutationInviteToTripArgs = {
  input: InviteToTripInput;
};


/** Root Mutation type */
export type MutationJoinGroupArgs = {
  input: JoinGroupInput;
};


/** Root Mutation type */
export type MutationJoinTripArgs = {
  input: JoinTripInput;
};


/** Root Mutation type */
export type MutationLeaveGroupArgs = {
  input: LeaveGroupInput;
};


/** Root Mutation type */
export type MutationLeaveTripArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationMarkNotificationReadArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationPurchaseRewardArgs = {
  input: PurchaseRewardInput;
};


/** Root Mutation type */
export type MutationRedeemRewardArgs = {
  input: RedeemRewardInput;
};


/** Root Mutation type */
export type MutationRejectChallengeSubmissionArgs = {
  input: RejectChallengeSubmissionInput;
};


/** Root Mutation type */
export type MutationRejectGroupJoinRequestArgs = {
  input: RejectGroupJoinRequestInput;
};


/** Root Mutation type */
export type MutationScheduleNotificationArgs = {
  id: Scalars['ID']['input'];
  input: ScheduleNotificationInput;
};


/** Root Mutation type */
export type MutationSetActivityPinnedArgs = {
  input: SetActivityPinnedInput;
};


/** Root Mutation type */
export type MutationStartLocationSharingArgs = {
  input: StartLocationSharingInput;
};


/** Root Mutation type */
export type MutationStopLocationSharingArgs = {
  input: StopLocationSharingInput;
};


/** Root Mutation type */
export type MutationToggleActivityReactionArgs = {
  input: ToggleActivityReactionInput;
};


/** Root Mutation type */
export type MutationToggleNotificationScheduleActiveArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationUnhideActivityArgs = {
  id: Scalars['ID']['input'];
};


/** Root Mutation type */
export type MutationUpdateActivityArgs = {
  id: Scalars['ID']['input'];
  input: UpdateActivityInput;
};


/** Root Mutation type */
export type MutationUpdateChallengeArgs = {
  id: Scalars['ID']['input'];
  input: UpdateChallengeInput;
};


/** Root Mutation type */
export type MutationUpdateGroupArgs = {
  id: Scalars['ID']['input'];
  input: UpdateGroupInput;
};


/** Root Mutation type */
export type MutationUpdateLocationArgs = {
  input: UpdateLocationInput;
};


/** Root Mutation type */
export type MutationUpdateNotificationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateNotificationInput;
};


/** Root Mutation type */
export type MutationUpdateNotificationScheduleArgs = {
  id: Scalars['ID']['input'];
  input: UpdateNotificationScheduleInput;
};


/** Root Mutation type */
export type MutationUpdateNotificationStatusArgs = {
  id: Scalars['ID']['input'];
  input: UpdateNotificationStatusInput;
};


/** Root Mutation type */
export type MutationUpdateRewardArgs = {
  id: Scalars['ID']['input'];
  input: UpdateRewardInput;
};


/** Root Mutation type */
export type MutationUpdateTripArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTripInput;
};


/** Root Mutation type */
export type MutationUploadTripResourceArgs = {
  input: UploadTripResourceInput;
};

/** A notification in the system */
export type Notification = {
  __typename?: 'Notification';
  content?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdById?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  priority?: Maybe<Scalars['String']['output']>;
  scheduledAt?: Maybe<Scalars['DateTime']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of notifications for Relay pagination */
export type NotificationConnection = {
  __typename?: 'NotificationConnection';
  edges?: Maybe<Array<NotificationEdge>>;
  nodes?: Maybe<Array<Notification>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** A notification delivery record in the system */
export type NotificationDelivery = {
  __typename?: 'NotificationDelivery';
  channel?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deliveredAt?: Maybe<Scalars['DateTime']['output']>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  failedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  notificationId?: Maybe<Scalars['ID']['output']>;
  retryCount?: Maybe<Scalars['Int']['output']>;
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of notification deliveries for Relay pagination */
export type NotificationDeliveryConnection = {
  __typename?: 'NotificationDeliveryConnection';
  edges?: Maybe<Array<NotificationDeliveryEdge>>;
  nodes?: Maybe<Array<NotificationDelivery>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a notification delivery connection */
export type NotificationDeliveryEdge = {
  __typename?: 'NotificationDeliveryEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<NotificationDelivery>;
};

/** An edge in a notification connection */
export type NotificationEdge = {
  __typename?: 'NotificationEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Notification>;
};

/** Priority levels for notifications */
export enum NotificationPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Urgent = 'URGENT'
}

/** A notification schedule in the system */
export type NotificationSchedule = {
  __typename?: 'NotificationSchedule';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdById?: Maybe<Scalars['ID']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  hour?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  isRecurring?: Maybe<Scalars['Boolean']['output']>;
  lastRun?: Maybe<Scalars['DateTime']['output']>;
  minute?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  nextRun?: Maybe<Scalars['DateTime']['output']>;
  notificationBody?: Maybe<Scalars['String']['output']>;
  notificationTitle?: Maybe<Scalars['String']['output']>;
  notificationType?: Maybe<Scalars['String']['output']>;
  recurrencePattern?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of notification schedules for Relay pagination */
export type NotificationScheduleConnection = {
  __typename?: 'NotificationScheduleConnection';
  edges?: Maybe<Array<NotificationScheduleEdge>>;
  nodes?: Maybe<Array<NotificationSchedule>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a notification schedule connection */
export type NotificationScheduleEdge = {
  __typename?: 'NotificationScheduleEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<NotificationSchedule>;
};

/** Types of notification schedules */
export enum NotificationScheduleType {
  OneTime = 'ONE_TIME',
  Recurring = 'RECURRING'
}

/** Status workflow for notifications */
export enum NotificationStatus {
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  Failed = 'FAILED',
  Ready = 'READY',
  Sent = 'SENT'
}

/** PageInfo for Relay-compliant pagination */
export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage?: Maybe<Scalars['Boolean']['output']>;
  hasPreviousPage?: Maybe<Scalars['Boolean']['output']>;
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** Input for purchasing a reward */
export type PurchaseRewardInput = {
  quantity: Scalars['Int']['input'];
  rewardId: Scalars['ID']['input'];
};

/** Status of a reward purchase */
export enum PurchaseStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Pending = 'PENDING',
  Refunded = 'REFUNDED'
}

/** Root Query type */
export type Query = {
  __typename?: 'Query';
  activitiesByTrip?: Maybe<ActivityConnection>;
  activitiesByTripModeration?: Maybe<ActivityConnection>;
  activity?: Maybe<ActivityConnection>;
  allNotifications?: Maybe<NotificationConnection>;
  challenge?: Maybe<Challenge>;
  challengeSubmissions?: Maybe<ChallengeSubmissionConnection>;
  challengeVotes?: Maybe<ChallengeVoteConnection>;
  challengesByTrip?: Maybe<ChallengeConnection>;
  coinTransactions?: Maybe<CoinTransactionConnection>;
  eventsByTrip?: Maybe<EventConnection>;
  friendLocations?: Maybe<Array<FriendLocation>>;
  group?: Maybe<Group>;
  groupJoinRequests?: Maybe<GroupJoinRequestConnection>;
  groupMembers?: Maybe<GroupMemberConnection>;
  groupsByTrip?: Maybe<GroupConnection>;
  myGroup?: Maybe<Group>;
  myLocation?: Maybe<Location>;
  myNotifications?: Maybe<NotificationConnection>;
  myPurchaseHistory?: Maybe<RewardPurchaseConnection>;
  notificationDeliveries?: Maybe<NotificationDeliveryConnection>;
  notificationSchedule?: Maybe<NotificationSchedule>;
  notificationSchedules?: Maybe<NotificationScheduleConnection>;
  notificationsByUser?: Maybe<NotificationConnection>;
  ongoingEventsByTrip?: Maybe<EventConnection>;
  pastEventsByTrip?: Maybe<EventConnection>;
  reward?: Maybe<Reward>;
  rewardsByTrip?: Maybe<RewardConnection>;
  sponsors?: Maybe<SponsorConnection>;
  sponsorsByTrip?: Maybe<TripSponsorConnection>;
  totalAvailablePoints?: Maybe<Scalars['Int']['output']>;
  trip?: Maybe<Trip>;
  tripParticipants?: Maybe<TripParticipantConnection>;
  trips?: Maybe<TripConnection>;
  unreadNotificationsByUser?: Maybe<NotificationConnection>;
  upcomingEventsByTrip?: Maybe<EventConnection>;
  users?: Maybe<UserConnection>;
  usersByRole?: Maybe<UserConnection>;
};


/** Root Query type */
export type QueryActivitiesByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryActivitiesByTripModerationArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryActivityArgs = {
  id: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryAllNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryChallengeArgs = {
  id: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryChallengeSubmissionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  challengeId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryChallengeVotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  challengeId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryChallengesByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryCoinTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  groupId?: InputMaybe<Scalars['ID']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryFriendLocationsArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryGroupArgs = {
  id: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryGroupJoinRequestsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  groupId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryGroupMembersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  groupId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryGroupsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryMyGroupArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryMyNotificationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryMyPurchaseHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryNotificationDeliveriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  notificationId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


/** Root Query type */
export type QueryNotificationScheduleArgs = {
  id: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryNotificationSchedulesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
};


/** Root Query type */
export type QueryNotificationsByUserArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryOngoingEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryPastEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryRewardArgs = {
  id: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryRewardsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QuerySponsorsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QuerySponsorsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryTotalAvailablePointsArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryTripArgs = {
  id: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryTripParticipantsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryTripsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryUnreadNotificationsByUserArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryUpcomingEventsByTripArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  tripId: Scalars['ID']['input'];
};


/** Root Query type */
export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Root Query type */
export type QueryUsersByRoleArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  role: Scalars['String']['input'];
};

/** The type of reaction on an activity */
export enum ReactionType {
  Clap = 'CLAP',
  Fire = 'FIRE',
  Heart = 'HEART',
  Star = 'STAR'
}

/** Input for redeeming a reward purchase (mark as delivered) */
export type RedeemRewardInput = {
  collectionMethod?: InputMaybe<Scalars['String']['input']>;
  purchaseId: Scalars['ID']['input'];
};

/** Input for rejecting a challenge submission */
export type RejectChallengeSubmissionInput = {
  reason: Scalars['String']['input'];
  submissionId: Scalars['ID']['input'];
};

/** Input for rejecting a group join request */
export type RejectGroupJoinRequestInput = {
  groupId: Scalars['ID']['input'];
  requestId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

/** A reward that users can purchase with points */
export type Reward = {
  __typename?: 'Reward';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  createdById?: Maybe<Scalars['ID']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  pointsCost?: Maybe<Scalars['Int']['output']>;
  quantityAvailable?: Maybe<Scalars['Int']['output']>;
  quantityTotal?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<RewardStatus>;
  tripId?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of rewards for Relay pagination */
export type RewardConnection = {
  __typename?: 'RewardConnection';
  edges?: Maybe<Array<RewardEdge>>;
  nodes?: Maybe<Array<Reward>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a reward connection */
export type RewardEdge = {
  __typename?: 'RewardEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Reward>;
};

/** A record of a reward purchase by a user */
export type RewardPurchase = {
  __typename?: 'RewardPurchase';
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  pointsSpent?: Maybe<Scalars['Int']['output']>;
  purchasedAt?: Maybe<Scalars['DateTime']['output']>;
  redeemedAt?: Maybe<Scalars['DateTime']['output']>;
  rewardId?: Maybe<Scalars['ID']['output']>;
  status?: Maybe<PurchaseStatus>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of reward purchases for Relay pagination */
export type RewardPurchaseConnection = {
  __typename?: 'RewardPurchaseConnection';
  edges?: Maybe<Array<RewardPurchaseEdge>>;
  nodes?: Maybe<Array<RewardPurchase>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a reward purchase connection */
export type RewardPurchaseEdge = {
  __typename?: 'RewardPurchaseEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<RewardPurchase>;
};

/** Status of a reward */
export enum RewardStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  SoldOut = 'SOLD_OUT'
}

/** Input for scheduling a notification */
export type ScheduleNotificationInput = {
  scheduledFor: Scalars['DateTime']['input'];
};

/** Scoring category for challenges */
export enum ScoringCategory {
  JudgedStaff = 'JUDGED_STAFF',
  PeerVoting = 'PEER_VOTING',
  Speed = 'SPEED',
  Unlimited = 'UNLIMITED'
}

/** Input for setting an activity as pinned or unpinned */
export type SetActivityPinnedInput = {
  activityId: Scalars['ID']['input'];
  isPinned: Scalars['Boolean']['input'];
};

/** A sponsor in the system */
export type Sponsor = {
  __typename?: 'Sponsor';
  contactEmail?: Maybe<Scalars['String']['output']>;
  contactPhone?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  logoUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  websiteUrl?: Maybe<Scalars['String']['output']>;
};

/** A connection of sponsors for Relay pagination */
export type SponsorConnection = {
  __typename?: 'SponsorConnection';
  edges?: Maybe<Array<SponsorEdge>>;
  nodes?: Maybe<Array<Sponsor>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a sponsor connection */
export type SponsorEdge = {
  __typename?: 'SponsorEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Sponsor>;
};

/** Input for starting location sharing with friends */
export type StartLocationSharingInput = {
  /** IDs of users to share location with (optional - if empty, shares with all friends) */
  userIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

/** Input for stopping location sharing */
export type StopLocationSharingInput = {
  /** If true, removes all shared users (default: true) */
  removeAll?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The status of a challenge submission */
export enum SubmissionStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

/** The type of submission accepted for a challenge */
export enum SubmissionType {
  Photo = 'PHOTO',
  Text = 'TEXT',
  Video = 'VIDEO'
}

/** Root Subscription type */
export type Subscription = {
  __typename?: 'Subscription';
  friendLocationsUpdated?: Maybe<Array<FriendLocation>>;
  locationUpdated?: Maybe<Location>;
};


/** Root Subscription type */
export type SubscriptionFriendLocationsUpdatedArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root Subscription type */
export type SubscriptionLocationUpdatedArgs = {
  userId: Scalars['ID']['input'];
};

/** Input for toggling a reaction on an activity */
export type ToggleActivityReactionInput = {
  activityId: Scalars['ID']['input'];
  /** One of: heart, fire, clap, star */
  reactionType: Scalars['String']['input'];
};

/** A trip in the system */
export type Trip = {
  __typename?: 'Trip';
  availableSpots?: Maybe<Scalars['Int']['output']>;
  basePrice?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  destination?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  imageUrl?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  registrationDeadline?: Maybe<Scalars['DateTime']['output']>;
  startDate?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<TripStatus>;
  totalSpots?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of trips for Relay pagination */
export type TripConnection = {
  __typename?: 'TripConnection';
  edges?: Maybe<Array<TripEdge>>;
  nodes?: Maybe<Array<Trip>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a trip connection */
export type TripEdge = {
  __typename?: 'TripEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Trip>;
};

/** A participant of a trip */
export type TripParticipant = {
  __typename?: 'TripParticipant';
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  invitedById?: Maybe<Scalars['ID']['output']>;
  joinedAt?: Maybe<Scalars['DateTime']['output']>;
  leftAt?: Maybe<Scalars['DateTime']['output']>;
  role?: Maybe<TripParticipantRole>;
  status?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of trip participants for Relay pagination */
export type TripParticipantConnection = {
  __typename?: 'TripParticipantConnection';
  edges?: Maybe<Array<TripParticipantEdge>>;
  nodes?: Maybe<Array<TripParticipant>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a trip participant connection */
export type TripParticipantEdge = {
  __typename?: 'TripParticipantEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<TripParticipant>;
};

/** The role of a trip participant */
export enum TripParticipantRole {
  Leader = 'LEADER',
  Member = 'MEMBER'
}

/** A resource attached to a trip */
export type TripResource = {
  __typename?: 'TripResource';
  description?: Maybe<Scalars['String']['output']>;
  fileSize?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  uploadedAt?: Maybe<Scalars['DateTime']['output']>;
  uploadedById?: Maybe<Scalars['ID']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

/** A sponsor linked to a trip */
export type TripSponsor = {
  __typename?: 'TripSponsor';
  benefits?: Maybe<Scalars['String']['output']>;
  displayOrder?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  linkedAt?: Maybe<Scalars['DateTime']['output']>;
  linkedById?: Maybe<Scalars['ID']['output']>;
  sponsor?: Maybe<Sponsor>;
  sponsorId?: Maybe<Scalars['ID']['output']>;
  tier?: Maybe<Scalars['String']['output']>;
  tripId?: Maybe<Scalars['ID']['output']>;
};

/** A connection of trip sponsors for Relay pagination */
export type TripSponsorConnection = {
  __typename?: 'TripSponsorConnection';
  edges?: Maybe<Array<TripSponsorEdge>>;
  nodes?: Maybe<Array<TripSponsor>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a trip sponsor connection */
export type TripSponsorEdge = {
  __typename?: 'TripSponsorEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<TripSponsor>;
};

/** The status of a trip */
export enum TripStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Planning = 'PLANNING'
}

/** Input for updating an activity */
export type UpdateActivityInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a challenge */
export type UpdateChallengeInput = {
  autoApprove?: InputMaybe<Scalars['Boolean']['input']>;
  basePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Time in HH:MM format */
  dailyEndTime?: InputMaybe<Scalars['String']['input']>;
  /** Time in HH:MM format */
  dailyStartTime?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  expectedValue?: InputMaybe<Scalars['String']['input']>;
  firstPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  secondPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  targetLatitude?: InputMaybe<Scalars['Float']['input']>;
  targetLongitude?: InputMaybe<Scalars['Float']['input']>;
  thirdPlacePoints?: InputMaybe<Scalars['Int']['input']>;
};

/** Input for updating a group */
export type UpdateGroupInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating user's current location */
export type UpdateLocationInput = {
  /** Location accuracy in meters */
  accuracy?: InputMaybe<Scalars['BigInt']['input']>;
  /** Altitude in meters above sea level */
  altitude?: InputMaybe<Scalars['BigInt']['input']>;
  /** Altitude accuracy in meters */
  altitudeAccuracy?: InputMaybe<Scalars['BigInt']['input']>;
  /** Heading in degrees (0-360) */
  heading?: InputMaybe<Scalars['BigInt']['input']>;
  /** Latitude in microdegrees (multiply by 1e6 for precision) */
  latitude: Scalars['BigInt']['input'];
  /** Longitude in microdegrees (multiply by 1e6 for precision) */
  longitude: Scalars['BigInt']['input'];
  /** Speed in meters per second */
  speed?: InputMaybe<Scalars['BigInt']['input']>;
};

/** Input for updating a notification */
export type UpdateNotificationInput = {
  body?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<NotificationPriority>;
  title?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a notification schedule */
export type UpdateNotificationScheduleInput = {
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  hour?: InputMaybe<Scalars['Int']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  minute?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  notificationBody?: InputMaybe<Scalars['String']['input']>;
  notificationTitle?: InputMaybe<Scalars['String']['input']>;
  notificationUrl?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Input for updating notification status */
export type UpdateNotificationStatusInput = {
  newStatus: NotificationStatus;
};

/** Input for updating a reward */
export type UpdateRewardInput = {
  availableQuantity?: InputMaybe<Scalars['Int']['input']>;
  coinCostPercentage?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a trip */
export type UpdateTripInput = {
  basePrice?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  destination?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  registrationDeadline?: InputMaybe<Scalars['DateTime']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  totalSpots?: InputMaybe<Scalars['Int']['input']>;
};

/** Input for uploading a trip resource */
export type UploadTripResourceInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  fileSize?: InputMaybe<Scalars['Int']['input']>;
  mimeType?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  tripId: Scalars['ID']['input'];
  type: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

/** A user in the system */
export type User = {
  __typename?: 'User';
  authUserId?: Maybe<Scalars['ID']['output']>;
  avatarUrl?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  birthDate?: Maybe<Scalars['DateTime']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  dietaryRequirements?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  groupId?: Maybe<Scalars['ID']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  medicalInfo?: Maybe<Scalars['String']['output']>;
  nickname?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  shirtSize?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A connection of users for Relay pagination */
export type UserConnection = {
  __typename?: 'UserConnection';
  edges?: Maybe<Array<UserEdge>>;
  nodes?: Maybe<Array<User>>;
  pageInfo?: Maybe<PageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a user connection */
export type UserEdge = {
  __typename?: 'UserEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<User>;
};

export type EventFieldsFragment = { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null };

export type EventEdgeFieldsFragment = { __typename?: 'EventEdge', cursor?: string | null, node?: { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null };

export type PageInfoFieldsFragment = { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null };

export type EventConnectionFieldsFragment = { __typename?: 'EventConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'EventEdge', cursor?: string | null, node?: { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null };

export type GetEventsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetEventsByTripQuery = { __typename?: 'Query', eventsByTrip?: { __typename?: 'EventConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'EventEdge', cursor?: string | null, node?: { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type GetUpcomingEventsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUpcomingEventsByTripQuery = { __typename?: 'Query', upcomingEventsByTrip?: { __typename?: 'EventConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'EventEdge', cursor?: string | null, node?: { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type GetOngoingEventsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetOngoingEventsByTripQuery = { __typename?: 'Query', ongoingEventsByTrip?: { __typename?: 'EventConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'EventEdge', cursor?: string | null, node?: { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type GetPastEventsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetPastEventsByTripQuery = { __typename?: 'Query', pastEventsByTrip?: { __typename?: 'EventConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'EventEdge', cursor?: string | null, node?: { __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Event', id?: string | null, createdAt?: Date | null, createdById?: string | null, description?: string | null, endTime?: Date | null, groupId?: string | null, location?: string | null, maxParticipants?: number | null, startTime?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type CoinPageInfoFieldsFragment = { __typename?: 'PageInfo', hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null, endCursor?: string | null };

export type CoinTransactionAdminFieldsFragment = { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null };

export type CoinTransactionGroupFieldsFragment = { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null };

export type CoinTransactionFieldsFragment = { __typename?: 'CoinTransaction', id?: string | null, amount?: number | null, reason?: string | null, adminId?: string | null, groupId?: string | null, createdAt?: Date | null, updatedAt?: Date | null, admin?: { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null } | null, group?: { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null } | null };

export type CoinTransactionEdgeFieldsFragment = { __typename?: 'CoinTransactionEdge', cursor?: string | null, node?: { __typename?: 'CoinTransaction', id?: string | null, amount?: number | null, reason?: string | null, adminId?: string | null, groupId?: string | null, createdAt?: Date | null, updatedAt?: Date | null, admin?: { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null } | null, group?: { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null } | null } | null };

export type CoinTransactionConnectionFieldsFragment = { __typename?: 'CoinTransactionConnection', totalCount?: number | null, pageInfo?: { __typename?: 'PageInfo', hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null, endCursor?: string | null } | null, edges?: Array<{ __typename?: 'CoinTransactionEdge', cursor?: string | null, node?: { __typename?: 'CoinTransaction', id?: string | null, amount?: number | null, reason?: string | null, adminId?: string | null, groupId?: string | null, createdAt?: Date | null, updatedAt?: Date | null, admin?: { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null } | null, group?: { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null } | null } | null }> | null, nodes?: Array<{ __typename?: 'CoinTransaction', id?: string | null, amount?: number | null, reason?: string | null, adminId?: string | null, groupId?: string | null, createdAt?: Date | null, updatedAt?: Date | null, admin?: { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null } | null, group?: { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null } | null }> | null };

export type GetCoinTransactionsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  groupId?: InputMaybe<Scalars['ID']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCoinTransactionsQuery = { __typename?: 'Query', coinTransactions?: { __typename?: 'CoinTransactionConnection', totalCount?: number | null, pageInfo?: { __typename?: 'PageInfo', hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null, endCursor?: string | null } | null, edges?: Array<{ __typename?: 'CoinTransactionEdge', cursor?: string | null, node?: { __typename?: 'CoinTransaction', id?: string | null, amount?: number | null, reason?: string | null, adminId?: string | null, groupId?: string | null, createdAt?: Date | null, updatedAt?: Date | null, admin?: { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null } | null, group?: { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null } | null } | null }> | null, nodes?: Array<{ __typename?: 'CoinTransaction', id?: string | null, amount?: number | null, reason?: string | null, adminId?: string | null, groupId?: string | null, createdAt?: Date | null, updatedAt?: Date | null, admin?: { __typename?: 'CoinTransactionAdmin', id?: string | null, firstName?: string | null, lastName?: string | null } | null, group?: { __typename?: 'CoinTransactionGroup', id?: string | null, name?: string | null, coins?: number | null } | null }> | null } | null };

export type NotificationFieldsFragment = { __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null };

export type NotificationEdgeFieldsFragment = { __typename?: 'NotificationEdge', cursor?: string | null, node?: { __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null };

export type NotificationConnectionFieldsFragment = { __typename?: 'NotificationConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'NotificationEdge', cursor?: string | null, node?: { __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null };

export type NotificationsByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type NotificationsByUserQuery = { __typename?: 'Query', notificationsByUser?: { __typename?: 'NotificationConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'NotificationEdge', cursor?: string | null, node?: { __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type UnreadNotificationsByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type UnreadNotificationsByUserQuery = { __typename?: 'Query', unreadNotificationsByUser?: { __typename?: 'NotificationConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'NotificationEdge', cursor?: string | null, node?: { __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Notification', id?: string | null, content?: string | null, createdAt?: Date | null, createdById?: string | null, priority?: string | null, scheduledAt?: Date | null, sentAt?: Date | null, status?: string | null, title?: string | null, tripId?: string | null, type?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type SponsorFieldsFragment = { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null };

export type SponsorEdgeFieldsFragment = { __typename?: 'SponsorEdge', cursor?: string | null, node?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null };

export type SponsorConnectionFieldsFragment = { __typename?: 'SponsorConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'SponsorEdge', cursor?: string | null, node?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null };

export type TripSponsorFieldsFragment = { __typename?: 'TripSponsor', id?: string | null, sponsorId?: string | null, tripId?: string | null, tier?: string | null, benefits?: string | null, displayOrder?: number | null, isActive?: boolean | null, linkedAt?: Date | null, linkedById?: string | null, sponsor?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null };

export type TripSponsorEdgeFieldsFragment = { __typename?: 'TripSponsorEdge', cursor?: string | null, node?: { __typename?: 'TripSponsor', id?: string | null, sponsorId?: string | null, tripId?: string | null, tier?: string | null, benefits?: string | null, displayOrder?: number | null, isActive?: boolean | null, linkedAt?: Date | null, linkedById?: string | null, sponsor?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null } | null };

export type TripSponsorConnectionFieldsFragment = { __typename?: 'TripSponsorConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'TripSponsorEdge', cursor?: string | null, node?: { __typename?: 'TripSponsor', id?: string | null, sponsorId?: string | null, tripId?: string | null, tier?: string | null, benefits?: string | null, displayOrder?: number | null, isActive?: boolean | null, linkedAt?: Date | null, linkedById?: string | null, sponsor?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null } | null }> | null, nodes?: Array<{ __typename?: 'TripSponsor', id?: string | null, sponsorId?: string | null, tripId?: string | null, tier?: string | null, benefits?: string | null, displayOrder?: number | null, isActive?: boolean | null, linkedAt?: Date | null, linkedById?: string | null, sponsor?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null };

export type GetSponsorsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSponsorsQuery = { __typename?: 'Query', sponsors?: { __typename?: 'SponsorConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'SponsorEdge', cursor?: string | null, node?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type GetSponsorsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSponsorsByTripQuery = { __typename?: 'Query', sponsorsByTrip?: { __typename?: 'TripSponsorConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'TripSponsorEdge', cursor?: string | null, node?: { __typename?: 'TripSponsor', id?: string | null, sponsorId?: string | null, tripId?: string | null, tier?: string | null, benefits?: string | null, displayOrder?: number | null, isActive?: boolean | null, linkedAt?: Date | null, linkedById?: string | null, sponsor?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null } | null }> | null, nodes?: Array<{ __typename?: 'TripSponsor', id?: string | null, sponsorId?: string | null, tripId?: string | null, tier?: string | null, benefits?: string | null, displayOrder?: number | null, isActive?: boolean | null, linkedAt?: Date | null, linkedById?: string | null, sponsor?: { __typename?: 'Sponsor', id?: string | null, name?: string | null, description?: string | null, logoUrl?: string | null, websiteUrl?: string | null, contactEmail?: string | null, contactPhone?: string | null, createdAt?: Date | null, updatedAt?: Date | null } | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type UserFieldsFragment = { __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null };

export type UserEdgeFieldsFragment = { __typename?: 'UserEdge', cursor?: string | null, node?: { __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null } | null };

export type UserConnectionFieldsFragment = { __typename?: 'UserConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'UserEdge', cursor?: string | null, node?: { __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null };

export type GetUsersQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users?: { __typename?: 'UserConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'UserEdge', cursor?: string | null, node?: { __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type GetUsersByRoleQueryVariables = Exact<{
  role: Scalars['String']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUsersByRoleQuery = { __typename?: 'Query', usersByRole?: { __typename?: 'UserConnection', totalCount?: number | null, edges?: Array<{ __typename?: 'UserEdge', cursor?: string | null, node?: { __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null } | null }> | null, nodes?: Array<{ __typename?: 'User', id?: string | null, authUserId?: string | null, avatarUrl?: string | null, bio?: string | null, birthDate?: Date | null, createdAt?: Date | null, dietaryRequirements?: string | null, email?: string | null, firstName?: string | null, groupId?: string | null, lastName?: string | null, medicalInfo?: string | null, nickname?: string | null, phone?: string | null, role?: string | null, shirtSize?: string | null, status?: string | null, updatedAt?: Date | null }> | null, pageInfo?: { __typename?: 'PageInfo', endCursor?: string | null, hasNextPage?: boolean | null, hasPreviousPage?: boolean | null, startCursor?: string | null } | null } | null };

export type LocationUpdatedSubscriptionVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type LocationUpdatedSubscription = { __typename?: 'Subscription', locationUpdated?: { __typename?: 'Location', id?: string | null, userId?: string | null, tripId?: string | null, latitude?: any | null, longitude?: any | null, accuracy?: any | null, altitude?: any | null, altitudeAccuracy?: any | null, heading?: any | null, speed?: any | null, isSharingLocation?: boolean | null, batteryLevel?: number | null, timestamp?: Date | null, createdAt?: Date | null } | null };

export type FriendLocationsUpdatedSubscriptionVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type FriendLocationsUpdatedSubscription = { __typename?: 'Subscription', friendLocationsUpdated?: Array<{ __typename?: 'FriendLocation', userId?: string | null, latitude?: any | null, longitude?: any | null, accuracy?: any | null, isSharing?: boolean | null, lastUpdated?: Date | null, user?: { __typename?: 'User', id?: string | null, firstName?: string | null, lastName?: string | null, nickname?: string | null, avatarUrl?: string | null } | null }> | null };

export const EventFieldsFragmentDoc = gql`
    fragment EventFields on Event {
  id
  createdAt
  createdById
  description
  endTime
  groupId
  location
  maxParticipants
  startTime
  status
  title
  tripId
  type
  updatedAt
}
    `;
export const EventEdgeFieldsFragmentDoc = gql`
    fragment EventEdgeFields on EventEdge {
  cursor
  node {
    ...EventFields
  }
}
    ${EventFieldsFragmentDoc}`;
export const PageInfoFieldsFragmentDoc = gql`
    fragment PageInfoFields on PageInfo {
  endCursor
  hasNextPage
  hasPreviousPage
  startCursor
}
    `;
export const EventConnectionFieldsFragmentDoc = gql`
    fragment EventConnectionFields on EventConnection {
  edges {
    ...EventEdgeFields
  }
  nodes {
    ...EventFields
  }
  pageInfo {
    ...PageInfoFields
  }
  totalCount
}
    ${EventEdgeFieldsFragmentDoc}
${EventFieldsFragmentDoc}
${PageInfoFieldsFragmentDoc}`;
export const CoinPageInfoFieldsFragmentDoc = gql`
    fragment CoinPageInfoFields on PageInfo {
  hasNextPage
  hasPreviousPage
  startCursor
  endCursor
}
    `;
export const CoinTransactionAdminFieldsFragmentDoc = gql`
    fragment CoinTransactionAdminFields on CoinTransactionAdmin {
  id
  firstName
  lastName
}
    `;
export const CoinTransactionGroupFieldsFragmentDoc = gql`
    fragment CoinTransactionGroupFields on CoinTransactionGroup {
  id
  name
  coins
}
    `;
export const CoinTransactionFieldsFragmentDoc = gql`
    fragment CoinTransactionFields on CoinTransaction {
  id
  amount
  reason
  adminId
  groupId
  createdAt
  updatedAt
  admin {
    ...CoinTransactionAdminFields
  }
  group {
    ...CoinTransactionGroupFields
  }
}
    ${CoinTransactionAdminFieldsFragmentDoc}
${CoinTransactionGroupFieldsFragmentDoc}`;
export const CoinTransactionEdgeFieldsFragmentDoc = gql`
    fragment CoinTransactionEdgeFields on CoinTransactionEdge {
  cursor
  node {
    ...CoinTransactionFields
  }
}
    ${CoinTransactionFieldsFragmentDoc}`;
export const CoinTransactionConnectionFieldsFragmentDoc = gql`
    fragment CoinTransactionConnectionFields on CoinTransactionConnection {
  totalCount
  pageInfo {
    ...CoinPageInfoFields
  }
  edges {
    ...CoinTransactionEdgeFields
  }
  nodes {
    ...CoinTransactionFields
  }
}
    ${CoinPageInfoFieldsFragmentDoc}
${CoinTransactionEdgeFieldsFragmentDoc}
${CoinTransactionFieldsFragmentDoc}`;
export const NotificationFieldsFragmentDoc = gql`
    fragment NotificationFields on Notification {
  id
  content
  createdAt
  createdById
  priority
  scheduledAt
  sentAt
  status
  title
  tripId
  type
  updatedAt
}
    `;
export const NotificationEdgeFieldsFragmentDoc = gql`
    fragment NotificationEdgeFields on NotificationEdge {
  cursor
  node {
    ...NotificationFields
  }
}
    ${NotificationFieldsFragmentDoc}`;
export const NotificationConnectionFieldsFragmentDoc = gql`
    fragment NotificationConnectionFields on NotificationConnection {
  edges {
    ...NotificationEdgeFields
  }
  nodes {
    ...NotificationFields
  }
  pageInfo {
    endCursor
    hasNextPage
    hasPreviousPage
    startCursor
  }
  totalCount
}
    ${NotificationEdgeFieldsFragmentDoc}
${NotificationFieldsFragmentDoc}`;
export const SponsorFieldsFragmentDoc = gql`
    fragment SponsorFields on Sponsor {
  id
  name
  description
  logoUrl
  websiteUrl
  contactEmail
  contactPhone
  createdAt
  updatedAt
}
    `;
export const SponsorEdgeFieldsFragmentDoc = gql`
    fragment SponsorEdgeFields on SponsorEdge {
  cursor
  node {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;
export const SponsorConnectionFieldsFragmentDoc = gql`
    fragment SponsorConnectionFields on SponsorConnection {
  edges {
    ...SponsorEdgeFields
  }
  nodes {
    ...SponsorFields
  }
  pageInfo {
    endCursor
    hasNextPage
    hasPreviousPage
    startCursor
  }
  totalCount
}
    ${SponsorEdgeFieldsFragmentDoc}
${SponsorFieldsFragmentDoc}`;
export const TripSponsorFieldsFragmentDoc = gql`
    fragment TripSponsorFields on TripSponsor {
  id
  sponsorId
  tripId
  tier
  benefits
  displayOrder
  isActive
  linkedAt
  linkedById
  sponsor {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;
export const TripSponsorEdgeFieldsFragmentDoc = gql`
    fragment TripSponsorEdgeFields on TripSponsorEdge {
  cursor
  node {
    ...TripSponsorFields
  }
}
    ${TripSponsorFieldsFragmentDoc}`;
export const TripSponsorConnectionFieldsFragmentDoc = gql`
    fragment TripSponsorConnectionFields on TripSponsorConnection {
  edges {
    ...TripSponsorEdgeFields
  }
  nodes {
    ...TripSponsorFields
  }
  pageInfo {
    endCursor
    hasNextPage
    hasPreviousPage
    startCursor
  }
  totalCount
}
    ${TripSponsorEdgeFieldsFragmentDoc}
${TripSponsorFieldsFragmentDoc}`;
export const UserFieldsFragmentDoc = gql`
    fragment UserFields on User {
  id
  authUserId
  avatarUrl
  bio
  birthDate
  createdAt
  dietaryRequirements
  email
  firstName
  groupId
  lastName
  medicalInfo
  nickname
  phone
  role
  shirtSize
  status
  updatedAt
}
    `;
export const UserEdgeFieldsFragmentDoc = gql`
    fragment UserEdgeFields on UserEdge {
  cursor
  node {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;
export const UserConnectionFieldsFragmentDoc = gql`
    fragment UserConnectionFields on UserConnection {
  edges {
    ...UserEdgeFields
  }
  nodes {
    ...UserFields
  }
  pageInfo {
    endCursor
    hasNextPage
    hasPreviousPage
    startCursor
  }
  totalCount
}
    ${UserEdgeFieldsFragmentDoc}
${UserFieldsFragmentDoc}`;
export const GetEventsByTripDocument = gql`
    query GetEventsByTrip($tripId: ID!, $first: Int, $after: String) {
  eventsByTrip(tripId: $tripId, first: $first, after: $after) {
    ...EventConnectionFields
  }
}
    ${EventConnectionFieldsFragmentDoc}`;

export function useGetEventsByTripQuery(options: Omit<Urql.UseQueryArgs<GetEventsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetEventsByTripQuery, GetEventsByTripQueryVariables>({ query: GetEventsByTripDocument, ...options });
};
export const GetUpcomingEventsByTripDocument = gql`
    query GetUpcomingEventsByTrip($tripId: ID!, $first: Int, $after: String) {
  upcomingEventsByTrip(tripId: $tripId, first: $first, after: $after) {
    ...EventConnectionFields
  }
}
    ${EventConnectionFieldsFragmentDoc}`;

export function useGetUpcomingEventsByTripQuery(options: Omit<Urql.UseQueryArgs<GetUpcomingEventsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUpcomingEventsByTripQuery, GetUpcomingEventsByTripQueryVariables>({ query: GetUpcomingEventsByTripDocument, ...options });
};
export const GetOngoingEventsByTripDocument = gql`
    query GetOngoingEventsByTrip($tripId: ID!, $first: Int, $after: String) {
  ongoingEventsByTrip(tripId: $tripId, first: $first, after: $after) {
    ...EventConnectionFields
  }
}
    ${EventConnectionFieldsFragmentDoc}`;

export function useGetOngoingEventsByTripQuery(options: Omit<Urql.UseQueryArgs<GetOngoingEventsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetOngoingEventsByTripQuery, GetOngoingEventsByTripQueryVariables>({ query: GetOngoingEventsByTripDocument, ...options });
};
export const GetPastEventsByTripDocument = gql`
    query GetPastEventsByTrip($tripId: ID!, $first: Int, $after: String) {
  pastEventsByTrip(tripId: $tripId, first: $first, after: $after) {
    ...EventConnectionFields
  }
}
    ${EventConnectionFieldsFragmentDoc}`;

export function useGetPastEventsByTripQuery(options: Omit<Urql.UseQueryArgs<GetPastEventsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetPastEventsByTripQuery, GetPastEventsByTripQueryVariables>({ query: GetPastEventsByTripDocument, ...options });
};
export const GetCoinTransactionsDocument = gql`
    query GetCoinTransactions($tripId: ID!, $groupId: ID, $first: Int, $after: String) {
  coinTransactions(
    tripId: $tripId
    groupId: $groupId
    first: $first
    after: $after
  ) {
    ...CoinTransactionConnectionFields
  }
}
    ${CoinTransactionConnectionFieldsFragmentDoc}`;

export function useGetCoinTransactionsQuery(options: Omit<Urql.UseQueryArgs<GetCoinTransactionsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCoinTransactionsQuery, GetCoinTransactionsQueryVariables>({ query: GetCoinTransactionsDocument, ...options });
};
export const NotificationsByUserDocument = gql`
    """
Get paginated notifications for a specific user.
Requires: userId.
Optional: first (limit), after (cursor for pagination).
Returns: Paginated list of notifications.
"""
query NotificationsByUser($userId: ID!, $first: Int, $after: String) {
  notificationsByUser(userId: $userId, first: $first, after: $after) {
    ...NotificationConnectionFields
  }
}
    ${NotificationConnectionFieldsFragmentDoc}`;

export function useNotificationsByUserQuery(options: Omit<Urql.UseQueryArgs<NotificationsByUserQueryVariables>, 'query'>) {
  return Urql.useQuery<NotificationsByUserQuery, NotificationsByUserQueryVariables>({ query: NotificationsByUserDocument, ...options });
};
export const UnreadNotificationsByUserDocument = gql`
    """
Get unread notifications for a specific user.
Requires: userId.
Optional: first (limit), after (cursor for pagination).
Returns: Paginated list of unread notifications.
"""
query UnreadNotificationsByUser($userId: ID!, $first: Int, $after: String) {
  unreadNotificationsByUser(userId: $userId, first: $first, after: $after) {
    ...NotificationConnectionFields
  }
}
    ${NotificationConnectionFieldsFragmentDoc}`;

export function useUnreadNotificationsByUserQuery(options: Omit<Urql.UseQueryArgs<UnreadNotificationsByUserQueryVariables>, 'query'>) {
  return Urql.useQuery<UnreadNotificationsByUserQuery, UnreadNotificationsByUserQueryVariables>({ query: UnreadNotificationsByUserDocument, ...options });
};
export const GetSponsorsDocument = gql`
    """
Get all sponsors with pagination.
Returns a SponsorConnection with Relay-style pagination.
"""
query GetSponsors($first: Int, $after: String) {
  sponsors(first: $first, after: $after) {
    ...SponsorConnectionFields
  }
}
    ${SponsorConnectionFieldsFragmentDoc}`;

export function useGetSponsorsQuery(options?: Omit<Urql.UseQueryArgs<GetSponsorsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetSponsorsQuery, GetSponsorsQueryVariables>({ query: GetSponsorsDocument, ...options });
};
export const GetSponsorsByTripDocument = gql`
    """
Get all sponsors linked to a specific trip with pagination.
Returns a TripSponsorConnection with Relay-style pagination.
Each edge contains a TripSponsor which wraps the Sponsor entity.
"""
query GetSponsorsByTrip($tripId: ID!, $first: Int, $after: String) {
  sponsorsByTrip(tripId: $tripId, first: $first, after: $after) {
    ...TripSponsorConnectionFields
  }
}
    ${TripSponsorConnectionFieldsFragmentDoc}`;

export function useGetSponsorsByTripQuery(options: Omit<Urql.UseQueryArgs<GetSponsorsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetSponsorsByTripQuery, GetSponsorsByTripQueryVariables>({ query: GetSponsorsByTripDocument, ...options });
};
export const GetUsersDocument = gql`
    query GetUsers($first: Int, $after: String) {
  users(first: $first, after: $after) {
    ...UserConnectionFields
  }
}
    ${UserConnectionFieldsFragmentDoc}`;

export function useGetUsersQuery(options?: Omit<Urql.UseQueryArgs<GetUsersQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUsersQuery, GetUsersQueryVariables>({ query: GetUsersDocument, ...options });
};
export const GetUsersByRoleDocument = gql`
    query GetUsersByRole($role: String!, $first: Int, $after: String) {
  usersByRole(role: $role, first: $first, after: $after) {
    ...UserConnectionFields
  }
}
    ${UserConnectionFieldsFragmentDoc}`;

export function useGetUsersByRoleQuery(options: Omit<Urql.UseQueryArgs<GetUsersByRoleQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUsersByRoleQuery, GetUsersByRoleQueryVariables>({ query: GetUsersByRoleDocument, ...options });
};
export const LocationUpdatedDocument = gql`
    subscription LocationUpdated($userId: ID!) {
  locationUpdated(userId: $userId) {
    id
    userId
    tripId
    latitude
    longitude
    accuracy
    altitude
    altitudeAccuracy
    heading
    speed
    isSharingLocation
    batteryLevel
    timestamp
    createdAt
  }
}
    `;

export function useLocationUpdatedSubscription<TData = LocationUpdatedSubscription>(options: Omit<Urql.UseSubscriptionArgs<LocationUpdatedSubscriptionVariables>, 'query'>, handler?: Urql.SubscriptionHandler<LocationUpdatedSubscription, TData>) {
  return Urql.useSubscription<LocationUpdatedSubscription, TData, LocationUpdatedSubscriptionVariables>({ query: LocationUpdatedDocument, ...options }, handler);
};
export const FriendLocationsUpdatedDocument = gql`
    subscription FriendLocationsUpdated($tripId: ID!) {
  friendLocationsUpdated(tripId: $tripId) {
    userId
    latitude
    longitude
    accuracy
    isSharing
    lastUpdated
    user {
      id
      firstName
      lastName
      nickname
      avatarUrl
    }
  }
}
    `;

export function useFriendLocationsUpdatedSubscription<TData = FriendLocationsUpdatedSubscription>(options: Omit<Urql.UseSubscriptionArgs<FriendLocationsUpdatedSubscriptionVariables>, 'query'>, handler?: Urql.SubscriptionHandler<FriendLocationsUpdatedSubscription, TData>) {
  return Urql.useSubscription<FriendLocationsUpdatedSubscription, TData, FriendLocationsUpdatedSubscriptionVariables>({ query: FriendLocationsUpdatedDocument, ...options }, handler);
};