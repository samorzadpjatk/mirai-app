import { GraphQLClient, RequestOptions } from 'graphql-request';
import { DocumentNode } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
};

/** An activity in the feed */
export type Activity = {
  __typename?: 'Activity';
  /** Type of activity */
  activityType: ActivityType;
  /** Admin who created this activity (null if user post) */
  admin?: Maybe<ActivityAdmin>;
  /** When activity was created */
  createdAt: Scalars['DateTime']['output'];
  /** Activity description */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique activity ID */
  id: Scalars['ID']['output'];
  /** Activity image URL */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** Whether activity is hidden */
  isHidden: Scalars['Boolean']['output'];
  /** Whether activity is pinned */
  isPinned: Scalars['Boolean']['output'];
  /** Activity title */
  title: Scalars['String']['output'];
  /** Trip ID this activity belongs to */
  tripId: Scalars['ID']['output'];
  /** When activity was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Admin user who created the activity */
export type ActivityAdmin = {
  __typename?: 'ActivityAdmin';
  /** Admin first name */
  firstName: Scalars['String']['output'];
  /** Admin user ID */
  id: Scalars['ID']['output'];
  /** Admin last name */
  lastName: Scalars['String']['output'];
};

/** Cursor for paginating through activities */
export type ActivityCursor = {
  __typename?: 'ActivityCursor';
  /** Created timestamp */
  createdAt: Scalars['DateTime']['output'];
  /** Activity ID */
  id: Scalars['ID']['output'];
  /** Whether cursor activity is pinned */
  isPinned: Scalars['Boolean']['output'];
};

/** Cursor for paginating through activity feed */
export type ActivityCursorInput = {
  /** Created timestamp for the cursor */
  createdAt: Scalars['DateTime']['input'];
  /** Activity ID for the cursor */
  id: Scalars['ID']['input'];
  /** Whether the cursor activity is pinned */
  isPinned: Scalars['Boolean']['input'];
};

/** Result of fetching activity feed for moderation */
export type ActivityFeedModerationResult = {
  __typename?: 'ActivityFeedModerationResult';
  /** List of activities (including hidden) */
  activities: Array<Activity>;
  /** Pagination information */
  pagination: ModerationPaginationInfo;
};

/** Result of fetching activity feed */
export type ActivityFeedResult = {
  __typename?: 'ActivityFeedResult';
  /** List of activities */
  activities: Array<Activity>;
  /** Cursor for next page (null if no more items) */
  nextCursor?: Maybe<ActivityCursor>;
  /** Pagination information */
  pagination: PaginationInfo;
};

/** Types of activities in the feed */
export enum ActivityType {
  ChallengeEvent = 'CHALLENGE_EVENT',
  Custom = 'CUSTOM',
  RankChange = 'RANK_CHANGE',
  Submission = 'SUBMISSION',
  UserPost = 'USER_POST'
}

/** Input for adding coins to a group */
export type AddCoinsInput = {
  /** Amount of coins to add (must be at least 1) */
  amount: Scalars['Int']['input'];
  /** ID of the group to add coins to */
  groupId: Scalars['ID']['input'];
  /** Reason for adding coins (optional) */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** ID of the trip the group belongs to */
  tripId: Scalars['ID']['input'];
};

/** Input for adding a user to location sharing */
export type AddSharingUserInput = {
  /** ID of the user to add */
  userId: Scalars['ID']['input'];
};

/** Voting progress for a single admin */
export type AdminVotingInfo = {
  __typename?: 'AdminVotingInfo';
  /** Whether this admin has voted all required positions */
  hasVotedAll: Scalars['Boolean']['output'];
  /** ID of the admin participant */
  participantId: Scalars['ID']['output'];
  /** Positions this admin has voted for (1-3) */
  votedPositions: Array<Scalars['Int']['output']>;
};

/** Result of fetching all notifications (admin only) */
export type AllNotificationsResult = {
  __typename?: 'AllNotificationsResult';
  /** List of notifications */
  notifications: Array<Notification>;
  /** Pagination information */
  pagination: NotificationOffsetPaginationInfo;
};

/** Result of bulk deleting notification schedules */
export type BulkDeleteNotificationSchedulesPayload = {
  __typename?: 'BulkDeleteNotificationSchedulesPayload';
  /** Number of schedules deleted */
  deletedCount: Scalars['Int']['output'];
  /** IDs that were not found */
  notFoundIds?: Maybe<Array<Scalars['String']['output']>>;
  /** Number of schedules requested for deletion */
  requestedCount: Scalars['Int']['output'];
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
};

/** Result of bulk toggling schedule active status */
export type BulkToggleActivePayload = {
  __typename?: 'BulkToggleActivePayload';
  /** Whether the operation was successful */
  success: Scalars['Boolean']['output'];
  /** Number of schedules updated */
  updatedCount: Scalars['Int']['output'];
};

/** A challenge/task within a trip */
export type Challenge = {
  __typename?: 'Challenge';
  /** Whether submissions are automatically approved */
  autoApprove: Scalars['Boolean']['output'];
  /** Base points awarded for completing this challenge */
  basePoints: Scalars['Int']['output'];
  /** When the challenge was created */
  createdAt: Scalars['DateTime']['output'];
  /** Daily closing time (HH:MM) for recurring challenges */
  dailyEndTime?: Maybe<Scalars['String']['output']>;
  /** Daily opening time (HH:MM) for recurring challenges */
  dailyStartTime?: Maybe<Scalars['String']['output']>;
  /** Challenge description (optional) */
  description?: Maybe<Scalars['String']['output']>;
  /** When the challenge closes */
  endTime?: Maybe<Scalars['DateTime']['output']>;
  /** Expected answer for QR code or text challenges */
  expectedValue?: Maybe<Scalars['String']['output']>;
  /** Bonus points for 1st place (speed challenges) */
  firstPlacePoints?: Maybe<Scalars['Int']['output']>;
  /** Whether this challenge has a peer voting phase */
  hasVotingPhase: Scalars['Boolean']['output'];
  /** Unique identifier for the challenge (UUID) */
  id: Scalars['ID']['output'];
  /** Challenge image URL (optional) */
  image?: Maybe<Scalars['String']['output']>;
  /** Whether the challenge is currently active */
  isActive: Scalars['Boolean']['output'];
  /** Whether submissions are currently accepted */
  isOpenForSubmission: Scalars['Boolean']['output'];
  /** Whether this challenge repeats daily */
  isRecurring: Scalars['Boolean']['output'];
  /** Challenge name/title */
  name: Scalars['String']['output'];
  /** Whether this challenge requires location data */
  requiresLocation: Scalars['Boolean']['output'];
  /** Whether this challenge requires a QR code scan */
  requiresQRCode: Scalars['Boolean']['output'];
  /** How points are awarded for this challenge */
  scoringCategory: ScoringCategory;
  /** Bonus points for 2nd place (speed challenges) */
  secondPlacePoints?: Maybe<Scalars['Int']['output']>;
  /** When the challenge becomes available */
  startTime?: Maybe<Scalars['DateTime']['output']>;
  /** Current status of the challenge */
  status: ChallengeStatus;
  /** Type of submission required */
  submissionType: SubmissionType;
  /** Target latitude for location-based challenges */
  targetLatitude?: Maybe<Scalars['Float']['output']>;
  /** Target longitude for location-based challenges */
  targetLongitude?: Maybe<Scalars['Float']['output']>;
  /** Bonus points for 3rd place (speed challenges) */
  thirdPlacePoints?: Maybe<Scalars['Int']['output']>;
  /** ID of the trip this challenge belongs to */
  tripId: Scalars['ID']['output'];
};

/** Types of challenge events */
export enum ChallengeEventType {
  ChallengeStarted = 'CHALLENGE_STARTED',
  Completed = 'COMPLETED',
  VotingStarted = 'VOTING_STARTED'
}

/** Pagination metadata for challenge lists */
export type ChallengePagination = {
  __typename?: 'ChallengePagination';
  /** Whether more items are available */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of challenges available */
  total: Scalars['Int']['output'];
};

/** Pagination parameters for list queries */
export type ChallengePaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Current status of a challenge in its lifecycle */
export enum ChallengeStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Hidden = 'HIDDEN',
  Visible = 'VISIBLE',
  VotingPhase = 'VOTING_PHASE'
}

/** A challenge submission made by a group */
export type ChallengeSubmission = {
  __typename?: 'ChallengeSubmission';
  /** Points awarded for this submission */
  awardedPoints: Scalars['Int']['output'];
  /** Bonus points awarded */
  bonusPoints: Scalars['Int']['output'];
  /** ID of the challenge this submission is for */
  challengeId: Scalars['ID']['output'];
  /** When the submission was created */
  createdAt: Scalars['DateTime']['output'];
  /** Group that made this submission */
  group?: Maybe<SubmissionGroupInfo>;
  /** ID of the group that made this submission */
  groupId: Scalars['ID']['output'];
  /** Whether the submission has location coordinates */
  hasLocation: Scalars['Boolean']['output'];
  /** Whether the submission has images or video */
  hasMedia: Scalars['Boolean']['output'];
  /** Unique identifier for the submission */
  id: Scalars['ID']['output'];
  /** IDs of uploaded images */
  imageIds: Array<Scalars['String']['output']>;
  /** Latitude coordinate (optional) */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** Longitude coordinate (optional) */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Ranking position (1-3) if awarded */
  ranking?: Maybe<Scalars['Int']['output']>;
  /** Reason for rejection (if rejected) */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** When the submission was reviewed */
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User who reviewed this submission */
  reviewedBy?: Maybe<SubmissionReviewerInfo>;
  /** ID of user who reviewed this submission */
  reviewedById?: Maybe<Scalars['ID']['output']>;
  /** Current review status of the submission */
  status: SubmissionStatus;
  /** Text content of the submission */
  textContent?: Maybe<Scalars['String']['output']>;
  /** Total points (awarded + bonus) */
  totalPoints: Scalars['Int']['output'];
  /** When the submission was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** ID of uploaded video (if any) */
  videoId?: Maybe<Scalars['String']['output']>;
  /** Number of votes received */
  voteCount: Scalars['Int']['output'];
  /** Calculated vote score */
  voteScore: Scalars['Float']['output'];
};

/** Result of creating a challenge submission */
export type ChallengeSubmissionCreateResult = {
  __typename?: 'ChallengeSubmissionCreateResult';
  /** Points awarded for this submission */
  awardedPoints: Scalars['Int']['output'];
  /** Bonus points awarded */
  bonusPoints: Scalars['Int']['output'];
  /** ID of the challenge this submission is for */
  challengeId: Scalars['ID']['output'];
  /** When the submission was created */
  createdAt: Scalars['DateTime']['output'];
  /** Group that made this submission */
  group?: Maybe<SubmissionGroupInfo>;
  /** ID of the group that made this submission */
  groupId: Scalars['ID']['output'];
  /** Whether the submission has location coordinates */
  hasLocation: Scalars['Boolean']['output'];
  /** Whether the submission has images or video */
  hasMedia: Scalars['Boolean']['output'];
  /** Unique identifier for the submission */
  id: Scalars['ID']['output'];
  /** IDs of uploaded images */
  imageIds: Array<Scalars['String']['output']>;
  /** Latitude coordinate (optional) */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** Longitude coordinate (optional) */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Ranking position (1-3) if awarded */
  ranking?: Maybe<Scalars['Int']['output']>;
  /** Reason for rejection (if rejected) */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** When the submission was reviewed */
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User who reviewed this submission */
  reviewedBy?: Maybe<SubmissionReviewerInfo>;
  /** ID of user who reviewed this submission */
  reviewedById?: Maybe<Scalars['ID']['output']>;
  /** Current review status of the submission */
  status: SubmissionStatus;
  /** Text content of the submission */
  textContent?: Maybe<Scalars['String']['output']>;
  /** Total points (awarded + bonus) */
  totalPoints: Scalars['Int']['output'];
  /** When the submission was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** ID of uploaded video (if any) */
  videoId?: Maybe<Scalars['String']['output']>;
  /** Number of votes received */
  voteCount: Scalars['Int']['output'];
  /** Calculated vote score */
  voteScore: Scalars['Float']['output'];
};

/** Paginated list of challenge submissions */
export type ChallengeSubmissionListResult = {
  __typename?: 'ChallengeSubmissionListResult';
  /** List of submissions */
  submissions: Array<ChallengeSubmission>;
  /** Total number of submissions (for pagination) */
  totalCount: Scalars['Int']['output'];
};

/** Result of updating a challenge submission */
export type ChallengeSubmissionUpdateResult = {
  __typename?: 'ChallengeSubmissionUpdateResult';
  /** Points awarded for this submission */
  awardedPoints: Scalars['Int']['output'];
  /** Bonus points awarded */
  bonusPoints: Scalars['Int']['output'];
  /** ID of the challenge this submission is for */
  challengeId: Scalars['ID']['output'];
  /** When the submission was created */
  createdAt: Scalars['DateTime']['output'];
  /** Group that made this submission */
  group?: Maybe<SubmissionGroupInfo>;
  /** ID of the group that made this submission */
  groupId: Scalars['ID']['output'];
  /** Whether the submission has location coordinates */
  hasLocation: Scalars['Boolean']['output'];
  /** Whether the submission has images or video */
  hasMedia: Scalars['Boolean']['output'];
  /** Unique identifier for the submission */
  id: Scalars['ID']['output'];
  /** IDs of uploaded images */
  imageIds: Array<Scalars['String']['output']>;
  /** Latitude coordinate (optional) */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** Longitude coordinate (optional) */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Ranking position (1-3) if awarded */
  ranking?: Maybe<Scalars['Int']['output']>;
  /** Reason for rejection (if rejected) */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** When the submission was reviewed */
  reviewedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User who reviewed this submission */
  reviewedBy?: Maybe<SubmissionReviewerInfo>;
  /** ID of user who reviewed this submission */
  reviewedById?: Maybe<Scalars['ID']['output']>;
  /** Current review status of the submission */
  status: SubmissionStatus;
  /** Text content of the submission */
  textContent?: Maybe<Scalars['String']['output']>;
  /** Total points (awarded + bonus) */
  totalPoints: Scalars['Int']['output'];
  /** When the submission was last updated */
  updatedAt: Scalars['DateTime']['output'];
  /** ID of uploaded video (if any) */
  videoId?: Maybe<Scalars['String']['output']>;
  /** Number of votes received */
  voteCount: Scalars['Int']['output'];
  /** Calculated vote score */
  voteScore: Scalars['Float']['output'];
};

/** A simplified view of a challenge for list displays */
export type ChallengeSummary = {
  __typename?: 'ChallengeSummary';
  /** Base points for completion */
  basePoints: Scalars['Int']['output'];
  /** When the challenge was created */
  createdAt: Scalars['DateTime']['output'];
  /** Challenge description */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the challenge */
  id: Scalars['ID']['output'];
  /** Challenge name */
  name: Scalars['String']['output'];
  /** How points are awarded */
  scoringCategory: ScoringCategory;
  /** Current challenge status */
  status: ChallengeStatus;
  /** Type of submission required */
  submissionType: SubmissionType;
  /** ID of the associated trip */
  tripId: Scalars['ID']['output'];
};

/** A vote cast for a challenge submission */
export type ChallengeVote = {
  __typename?: 'ChallengeVote';
  /** ID of the challenge being voted on */
  challengeId: Scalars['ID']['output'];
  /** Unique identifier for the vote (UUID) */
  id: Scalars['ID']['output'];
  /** Normalized weight of the vote (for weighted voting) */
  normalizedWeight: Scalars['Float']['output'];
  /** ID of the submission receiving the vote */
  submissionId: Scalars['ID']['output'];
  /** Points awarded for this vote */
  votePoints: Scalars['Int']['output'];
  /** Voting position (1st, 2nd, or 3rd place) */
  votePosition: Scalars['Int']['output'];
  /** When the vote was cast */
  votedAt: Scalars['DateTime']['output'];
  /** ID of the voter (trip participant) */
  voterId: Scalars['ID']['output'];
};

/** Admin view of votes with unique voter count */
export type ChallengeVoteAdminList = {
  __typename?: 'ChallengeVoteAdminList';
  /** Total number of votes cast */
  totalVotes: Scalars['Int']['output'];
  /** Number of unique voters */
  uniqueVoters: Scalars['Int']['output'];
  /** All votes for the challenge */
  votes: Array<ChallengeVote>;
};

/** List of votes with metadata */
export type ChallengeVoteList = {
  __typename?: 'ChallengeVoteList';
  /** Total number of votes */
  totalVotes: Scalars['Int']['output'];
  /** The votes in the list */
  votes: Array<ChallengeVote>;
};

/** A paginated list of challenges with metadata */
export type ChallengesConnection = {
  __typename?: 'ChallengesConnection';
  /** The challenges in this page */
  challenges: Array<ChallengeSummary>;
  /** Pagination metadata */
  pagination: ChallengePagination;
};

/** Result of checking inactive users */
export type CheckInactiveUsersPayload = {
  __typename?: 'CheckInactiveUsersPayload';
  /** Number of users checked for inactivity */
  checked: Scalars['Int']['output'];
  /** Number of errors encountered */
  errors: Scalars['Int']['output'];
  /** Number of users notified */
  notified: Scalars['Int']['output'];
  /** Number of users skipped */
  skipped: Scalars['Int']['output'];
};

/** Additional insights about coin transactions */
export type CoinAdditionalInsights = {
  __typename?: 'CoinAdditionalInsights';
  /** Information about the most active admin */
  mostActiveAdmin?: Maybe<FormattedUser>;
  /** Recent coin transactions */
  recentTransactions: Array<CoinTransaction>;
};

/** Quick overview statistics for coin distribution in a trip */
export type CoinQuickStats = {
  __typename?: 'CoinQuickStats';
  /** Average coins per group */
  averageCoinsPerGroup: Scalars['Int']['output'];
  /** ID of the group with the most coins */
  richestGroupId?: Maybe<Scalars['ID']['output']>;
  /** Name of the group with the most coins */
  richestGroupName?: Maybe<Scalars['String']['output']>;
  /** When the statistics were computed */
  time: Scalars['DateTime']['output'];
  /** Total coins across all groups */
  totalCoins: Scalars['Int']['output'];
  /** Total number of groups with transactions */
  totalGroups: Scalars['Int']['output'];
};

/** Comprehensive coin statistics for a trip */
export type CoinStatistics = {
  __typename?: 'CoinStatistics';
  /** Total coins added to groups (positive amounts) */
  addedCoins: Scalars['Int']['output'];
  /** Net balance of all transactions (added - removed) */
  netBalance: Scalars['Int']['output'];
  /** Total coins removed from groups (negative amounts, as positive number) */
  removedCoins: Scalars['Int']['output'];
  /** When the statistics were computed */
  time: Scalars['DateTime']['output'];
  /** Total number of coin transactions */
  transactionCount: Scalars['Int']['output'];
};

/** A coin transaction recording the addition or removal of coins from a group */
export type CoinTransaction = {
  __typename?: 'CoinTransaction';
  /** Admin information for this transaction */
  admin?: Maybe<CoinTransactionAdmin>;
  /** ID of the admin who performed this transaction */
  adminId: Scalars['ID']['output'];
  /** Amount of coins added (positive) or removed (negative) */
  amount: Scalars['Int']['output'];
  /** When the transaction was created */
  createdAt: Scalars['DateTime']['output'];
  /** Group information for this transaction */
  group?: Maybe<CoinTransactionGroup>;
  /** ID of the group affected by this transaction */
  groupId: Scalars['ID']['output'];
  /** Unique identifier for the transaction */
  id: Scalars['ID']['output'];
  /** Reason or note for this transaction */
  reason?: Maybe<Scalars['String']['output']>;
};

/** Admin information in a coin transaction context */
export type CoinTransactionAdmin = {
  __typename?: 'CoinTransactionAdmin';
  /** Admin's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Admin's full name (computed) */
  fullName: Scalars['String']['output'];
  /** Admin user ID */
  id: Scalars['ID']['output'];
  /** Admin's last name */
  lastName?: Maybe<Scalars['String']['output']>;
};

/** Group information in a coin transaction context */
export type CoinTransactionGroup = {
  __typename?: 'CoinTransactionGroup';
  /** Current coin balance of the group */
  coins: Scalars['Int']['output'];
  /** Group ID */
  id: Scalars['ID']['output'];
  /** Group name */
  name: Scalars['String']['output'];
};

/** Pagination metadata for coin transaction lists */
export type CoinTransactionPagination = {
  __typename?: 'CoinTransactionPagination';
  /** Whether more items are available */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of transactions available */
  total: Scalars['Int']['output'];
};

/** Pagination parameters for coin transaction queries */
export type CoinTransactionPaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Result of an add or remove coins operation */
export type CoinTransactionResult = {
  __typename?: 'CoinTransactionResult';
  /** Admin ID (convenience accessor) */
  adminId: Scalars['ID']['output'];
  /** Transaction amount */
  amount: Scalars['Int']['output'];
  /** Transaction timestamp (convenience accessor) */
  createdAt: Scalars['DateTime']['output'];
  /** Group ID (convenience accessor) */
  groupId: Scalars['ID']['output'];
  /** Transaction ID (convenience accessor) */
  id: Scalars['ID']['output'];
  /** The created coin transaction */
  transaction: CoinTransaction;
};

/** A paginated list of coin transactions with metadata */
export type CoinTransactionsConnection = {
  __typename?: 'CoinTransactionsConnection';
  /** Pagination metadata */
  pagination: CoinTransactionPagination;
  /** The transactions in this page */
  transactions: Array<CoinTransaction>;
};

/** Input for creating a challenge event activity */
export type CreateChallengeActivityInput = {
  /** Base points for challenge */
  basePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Challenge ID */
  challengeId: Scalars['ID']['input'];
  /** Activity description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Challenge end time */
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  /** Type of challenge event */
  eventType: ChallengeEventType;
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** Number of submissions */
  submissionCount?: InputMaybe<Scalars['Int']['input']>;
  /** Submission type */
  submissionType?: InputMaybe<Scalars['String']['input']>;
  /** Activity title */
  title: Scalars['String']['input'];
  /** Trip ID */
  tripId: Scalars['ID']['input'];
};

/** Input for creating a new challenge */
export type CreateChallengeInput = {
  /** Whether to auto-approve submissions */
  autoApprove?: InputMaybe<Scalars['Boolean']['input']>;
  /** Base points for completion (0-10000) */
  basePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Challenge description (max 2000 characters) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** When the challenge closes */
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  /** Expected answer for QR/text challenges */
  expectedValue?: InputMaybe<Scalars['String']['input']>;
  /** Bonus points for 1st place (speed challenges) */
  firstPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Challenge image URL */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Challenge name (1-200 characters) */
  name: Scalars['String']['input'];
  /** How points are awarded */
  scoringCategory: ScoringCategory;
  /** Bonus points for 2nd place (speed challenges) */
  secondPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  /** When the challenge becomes available */
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  /** Initial challenge status */
  status?: InputMaybe<ChallengeStatus>;
  /** Type of submission required */
  submissionType: SubmissionType;
  /** Target latitude for location challenges */
  targetLatitude?: InputMaybe<Scalars['Float']['input']>;
  /** Target longitude for location challenges */
  targetLongitude?: InputMaybe<Scalars['Float']['input']>;
  /** Bonus points for 3rd place (speed challenges) */
  thirdPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  /** ID of the trip this challenge belongs to */
  tripId: Scalars['ID']['input'];
};

/** Result of creating a new challenge */
export type CreateChallengePayload = {
  __typename?: 'CreateChallengePayload';
  /** The newly created challenge */
  challenge: ChallengeSummary;
};

/** Input for creating a custom activity */
export type CreateCustomActivityInput = {
  /** Activity description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Activity image URL */
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** Activity title */
  title: Scalars['String']['input'];
  /** Trip ID to create activity for */
  tripId: Scalars['ID']['input'];
};

/** Input for creating a signed download URL */
export type CreateDownloadUrlInput = {
  /** URL expiration time in seconds (60-3600, defaults to 600) */
  expiresInSeconds?: InputMaybe<Scalars['Int']['input']>;
  /** The full storage path (bucket/path) for the file */
  storagePath: Scalars['String']['input'];
};

/** Input for creating a new group */
export type CreateGroupInput = {
  /** Group description (max 500 characters) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Group image URL */
  image?: InputMaybe<Scalars['String']['input']>;
  /** Group name (1-100 characters) */
  name: Scalars['String']['input'];
  /** ID of the group organizer (defaults to current user) */
  organizerId?: InputMaybe<Scalars['ID']['input']>;
  /** ID of the trip this group belongs to */
  tripId: Scalars['ID']['input'];
};

/** Result of creating a new group */
export type CreateGroupPayload = {
  __typename?: 'CreateGroupPayload';
  /** The newly created group */
  group: Group;
};

/** Input for creating a new notification */
export type CreateNotificationInput = {
  /** Notification body content */
  body: Scalars['String']['input'];
  /** Notification priority */
  priority?: InputMaybe<NotificationPriority>;
  /** Notification title */
  title: Scalars['String']['input'];
  /** Optional trip ID to associate with notification */
  tripId?: InputMaybe<Scalars['ID']['input']>;
  /** Optional URL to open when notification is tapped */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Result of creating a notification */
export type CreateNotificationResult = {
  __typename?: 'CreateNotificationResult';
  /** The created notification */
  notification: Notification;
};

/** Input for creating a new notification schedule */
export type CreateNotificationScheduleInput = {
  /** When the schedule ends */
  endDate: Scalars['DateTime']['input'];
  /** Scheduled hour (0-23) */
  hour: Scalars['Int']['input'];
  /** Whether the schedule is initially active */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Scheduled minute (0-59) */
  minute: Scalars['Int']['input'];
  /** Schedule name (1-100 characters) */
  name: Scalars['String']['input'];
  /** Notification body (optional for INFO type, max 2000 chars) */
  notificationBody?: InputMaybe<Scalars['String']['input']>;
  /** Notification title (optional for INFO type, max 200 chars) */
  notificationTitle?: InputMaybe<Scalars['String']['input']>;
  /** Type of notification */
  notificationType: NotificationScheduleType;
  /** Optional URL for the notification (max 500 chars) */
  notificationUrl?: InputMaybe<Scalars['String']['input']>;
  /** When the schedule starts */
  startDate: Scalars['DateTime']['input'];
  /** Associated trip ID (optional) */
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Result of creating a new notification schedule */
export type CreateNotificationSchedulePayload = {
  __typename?: 'CreateNotificationSchedulePayload';
  /** The newly created schedule */
  schedule: NotificationSchedule;
};

/** Input for creating a public URL */
export type CreatePublicUrlInput = {
  /** The full storage path (bucket/path) for the file. Only 'files-public' bucket is supported. */
  storagePath: Scalars['String']['input'];
};

/** Input for creating a rank change activity */
export type CreateRankChangeActivityInput = {
  /** Coins gained */
  coinsGained: Scalars['Int']['input'];
  /** Activity description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Group ID */
  groupId: Scalars['ID']['input'];
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** New rank position */
  newRank: Scalars['Int']['input'];
  /** Activity title */
  title: Scalars['String']['input'];
  /** Total coins */
  totalCoins: Scalars['Int']['input'];
  /** Trip ID */
  tripId: Scalars['ID']['input'];
};

/** Input for creating a new submission report */
export type CreateReportInput = {
  /** Additional details (max 2000 characters) */
  details?: InputMaybe<Scalars['String']['input']>;
  /** Reason for reporting */
  reason: ReportReason;
  /** ID of the submission to report */
  submissionId: Scalars['ID']['input'];
};

/** Input for creating a new reward */
export type CreateRewardInput = {
  /** Number of rewards available (0-1000000) */
  availableQuantity: Scalars['Int']['input'];
  /** Percentage of total trip points (1-100) */
  coinCost: Scalars['Int']['input'];
  /** Reward description (max 2000 characters) */
  description: Scalars['String']['input'];
  /** Array of image URLs (max 10) */
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Whether the reward should be hidden initially */
  isHidden?: InputMaybe<Scalars['Boolean']['input']>;
  /** Reward name (1-200 characters) */
  name: Scalars['String']['input'];
  /** ID of the trip this reward belongs to */
  tripId: Scalars['ID']['input'];
};

/** Result of creating a new reward */
export type CreateRewardPayload = {
  __typename?: 'CreateRewardPayload';
  /** The newly created reward */
  reward: Reward;
};

/** Input for creating a new sponsor */
export type CreateSponsorInput = {
  /** Sponsor description (1-2000 characters) */
  description: Scalars['String']['input'];
  /** Logo height in pixels (optional) */
  height?: InputMaybe<Scalars['Int']['input']>;
  /** Whether the sponsor is active */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** URL path to sponsor logo image */
  logoPath: Scalars['String']['input'];
  /** Sponsor name (1-200 characters) */
  name: Scalars['String']['input'];
  /** Horizontal offset in pixels (optional) */
  offsetX?: InputMaybe<Scalars['Int']['input']>;
  /** Vertical offset in pixels (optional) */
  offsetY?: InputMaybe<Scalars['Int']['input']>;
};

/** Result of creating a sponsor */
export type CreateSponsorPayload = {
  __typename?: 'CreateSponsorPayload';
  /** The newly created sponsor */
  sponsor: Sponsor;
};

/** Input for creating a submission activity */
export type CreateSubmissionActivityInput = {
  /** Challenge ID */
  challengeId: Scalars['ID']['input'];
  /** Activity description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Group ID */
  groupId: Scalars['ID']['input'];
  /** Whether submission has video */
  hasVideo?: InputMaybe<Scalars['Boolean']['input']>;
  /** Activity image URL */
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** Whether submission is a winner */
  isWinner?: InputMaybe<Scalars['Boolean']['input']>;
  /** Points awarded */
  pointsAwarded?: InputMaybe<Scalars['Int']['input']>;
  /** Submission ranking */
  ranking?: InputMaybe<Scalars['Int']['input']>;
  /** Submission ID */
  submissionId: Scalars['ID']['input'];
  /** Activity title */
  title: Scalars['String']['input'];
  /** Trip ID */
  tripId: Scalars['ID']['input'];
};

/** Input for creating a new challenge submission */
export type CreateSubmissionInput = {
  /** ID of the challenge to submit to */
  challengeId: Scalars['ID']['input'];
  /** ID of the group making the submission */
  groupId: Scalars['ID']['input'];
  /** IDs of uploaded images (max 10) */
  imageIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Latitude coordinate */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** Longitude coordinate */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  /** Text content of the submission */
  textContent?: InputMaybe<Scalars['String']['input']>;
  /** ID of uploaded video */
  videoId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for creating a new trip */
export type CreateTripInput = {
  /** URL to background image */
  backgroundImagePath?: InputMaybe<Scalars['String']['input']>;
  /** Trip description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Trip end date */
  endDate: Scalars['DateTime']['input'];
  /** Trip name */
  name: Scalars['String']['input'];
  /** Trip start date */
  startDate: Scalars['DateTime']['input'];
};

/** Input for creating a signed upload URL */
export type CreateUploadUrlInput = {
  /** The full storage path (bucket/path) for the file */
  storagePath: Scalars['String']['input'];
  /** Whether to overwrite existing file (defaults to false) */
  upsert?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Input for creating a new user */
export type CreateUserInput = {
  /** External authentication provider user ID (required) */
  authUserId: Scalars['String']['input'];
  /** User's first name (2-100 characters, no digits) */
  firstName: Scalars['String']['input'];
  /** User's last name (2-100 characters, no digits) */
  lastName: Scalars['String']['input'];
  /** User's role (defaults to USER) */
  role?: InputMaybe<UserRole>;
};

/** Input for creating a user post activity */
export type CreateUserPostInput = {
  /** Additional image URLs (max 10) */
  additionalImages?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Post description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Post image URL */
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  /** Post title */
  title: Scalars['String']['input'];
  /** Trip ID to create post for */
  tripId: Scalars['ID']['input'];
};

/** Input for deleting an activity */
export type DeleteActivityInput = {
  /** Activity ID to delete */
  activityId: Scalars['ID']['input'];
};

/** Result of deleting an activity */
export type DeleteActivityResult = {
  __typename?: 'DeleteActivityResult';
  /** Whether deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Result of deleting (cancelling) a challenge */
export type DeleteChallengePayload = {
  __typename?: 'DeleteChallengePayload';
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Result of deleting a group */
export type DeleteGroupPayload = {
  __typename?: 'DeleteGroupPayload';
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Input for deleting a notification */
export type DeleteNotificationInput = {
  /** ID of notification to delete */
  notificationId: Scalars['ID']['input'];
};

/** Result of deleting a notification */
export type DeleteNotificationResult = {
  __typename?: 'DeleteNotificationResult';
  /** Whether deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Result of deleting a notification schedule */
export type DeleteNotificationSchedulePayload = {
  __typename?: 'DeleteNotificationSchedulePayload';
  /** Number of execution history records deleted */
  deletedExecutionCount?: Maybe<Scalars['Int']['output']>;
  /** Status message */
  message: Scalars['String']['output'];
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Result of deleting a reward */
export type DeleteRewardPayload = {
  __typename?: 'DeleteRewardPayload';
  /** ID of the deleted reward */
  deletedRewardId: Scalars['ID']['output'];
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Result of deleting a sponsor */
export type DeleteSponsorPayload = {
  __typename?: 'DeleteSponsorPayload';
  /** ID of the deleted sponsor */
  id: Scalars['ID']['output'];
  /** Whether the deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Input for deleting a trip */
export type DeleteTripInput = {
  /** Trip ID to delete */
  id: Scalars['ID']['input'];
};

/** Result of deleting a trip */
export type DeleteTripResult = {
  __typename?: 'DeleteTripResult';
  /** Whether deletion was successful */
  success: Scalars['Boolean']['output'];
};

/** Pagination information for delivery queries */
export type DeliveryPagination = {
  __typename?: 'DeliveryPagination';
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Current offset */
  offset: Scalars['Int']['output'];
  /** Total number of matching deliveries */
  total: Scalars['Int']['output'];
};

/** Statistics for notification deliveries */
export type DeliveryStats = {
  __typename?: 'DeliveryStats';
  /** Average failed deliveries per batch */
  avgFailuresPerDelivery: Scalars['Float']['output'];
  /** Average successful deliveries per batch */
  avgSuccessPerDelivery: Scalars['Float']['output'];
  /** Breakdown of deliveries by status */
  statusBreakdown: DeliveryStatusBreakdown;
  /** Overall success rate (0.0 - 1.0) */
  successRate: Scalars['Float']['output'];
  /** Total number of deliveries */
  totalDeliveries: Scalars['Int']['output'];
  /** Total failed deliveries */
  totalFailures: Scalars['Int']['output'];
  /** Total intended recipients across all deliveries */
  totalRecipients: Scalars['Int']['output'];
  /** Total successful deliveries */
  totalSuccess: Scalars['Int']['output'];
};

/** Status of a notification delivery */
export enum DeliveryStatus {
  Failure = 'FAILURE',
  PartialFailure = 'PARTIAL_FAILURE',
  Pending = 'PENDING',
  Success = 'SUCCESS'
}

/** Count of deliveries per status */
export type DeliveryStatusBreakdown = {
  __typename?: 'DeliveryStatusBreakdown';
  /** Number of failed deliveries */
  failure: Scalars['Int']['output'];
  /** Number of partially failed deliveries */
  partialFailure: Scalars['Int']['output'];
  /** Number of pending deliveries */
  pending: Scalars['Int']['output'];
  /** Number of successful deliveries */
  success: Scalars['Int']['output'];
};

/** Result of creating a signed download URL */
export type DownloadUrlResult = {
  __typename?: 'DownloadUrlResult';
  /** When the signed URL expires */
  expiresAt: Scalars['DateTime']['output'];
  /** The signed URL for downloading the file */
  signedUrl: Scalars['String']['output'];
};

/** Result of duplicating a notification schedule */
export type DuplicateNotificationSchedulePayload = {
  __typename?: 'DuplicateNotificationSchedulePayload';
  /** The duplicated schedule */
  schedule: NotificationSchedule;
};

/** A single execution history record */
export type ExecutionHistoryEntry = {
  __typename?: 'ExecutionHistoryEntry';
  /** When the execution occurred */
  executedAt: Scalars['DateTime']['output'];
  /** Execution record ID */
  id: Scalars['ID']['output'];
  /** The notification that was sent (null if failed) */
  notification?: Maybe<ExecutionHistoryNotification>;
};

/** Notification details in execution history */
export type ExecutionHistoryNotification = {
  __typename?: 'ExecutionHistoryNotification';
  /** Notification body */
  body: Scalars['String']['output'];
  /** When the notification was created */
  createdAt: Scalars['DateTime']['output'];
  /** Notification ID */
  id: Scalars['ID']['output'];
  /** Notification title */
  title: Scalars['String']['output'];
};

/** Result of querying execution history */
export type ExecutionHistoryResult = {
  __typename?: 'ExecutionHistoryResult';
  /** List of execution history entries */
  executions: Array<ExecutionHistoryEntry>;
};

/** Input for forcing the end of judged staff voting */
export type ForceEndVotingInput = {
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
  /** ID of the trip (for validation) */
  tripId: Scalars['ID']['input'];
};

/** Result of forcing the end of judged staff voting */
export type ForceEndVotingPayload = {
  __typename?: 'ForceEndVotingPayload';
  /** ID of the challenge */
  challengeId: Scalars['ID']['output'];
  /** Final status of the challenge */
  challengeStatus: Scalars['String']['output'];
  /** Whether voting was finalized */
  finalized: Scalars['Boolean']['output'];
  /** Whether the operation succeeded */
  success: Scalars['Boolean']['output'];
  /** Total number of votes counted */
  totalVotes: Scalars['Int']['output'];
};

/** User information formatted for display */
export type FormattedUser = {
  __typename?: 'FormattedUser';
  /** User's full name */
  name: Scalars['String']['output'];
  /** Number of transactions by this user */
  transactionCount: Scalars['Int']['output'];
};

/** A friend's location with optional distance information */
export type FriendLocation = {
  __typename?: 'FriendLocation';
  /** Accuracy in meters */
  accuracy?: Maybe<Scalars['Float']['output']>;
  /** Altitude in meters */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Distance from current user in kilometers */
  distanceKm?: Maybe<Scalars['Float']['output']>;
  /** Heading in degrees */
  heading?: Maybe<Scalars['Float']['output']>;
  /** Location ID */
  id: Scalars['ID']['output'];
  /** Whether friend is sharing location */
  isSharingLocation: Scalars['Boolean']['output'];
  /** Latitude */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** Longitude */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Speed in m/s */
  speed?: Maybe<Scalars['Float']['output']>;
  /** When location was recorded */
  timestamp: Scalars['DateTime']['output'];
  /** Friend's user ID */
  userId: Scalars['ID']['output'];
};

/** Real-time friend location update */
export type FriendLocationSubscription = {
  __typename?: 'FriendLocationSubscription';
  /** Accuracy in meters */
  accuracy?: Maybe<Scalars['Float']['output']>;
  /** Altitude in meters */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Distance from current user in kilometers */
  distanceKm?: Maybe<Scalars['Float']['output']>;
  /** Heading in degrees (0-360) */
  heading?: Maybe<Scalars['Float']['output']>;
  /** Location record ID */
  id: Scalars['ID']['output'];
  /** Whether user is currently sharing location */
  isSharingLocation: Scalars['Boolean']['output'];
  /** Latitude coordinate */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** Longitude coordinate */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Speed in meters per second */
  speed?: Maybe<Scalars['Float']['output']>;
  /** When the location was recorded */
  timestamp: Scalars['DateTime']['output'];
  /** User ID whose location is being shared */
  userId: Scalars['ID']['output'];
};

/** A list of friends' locations */
export type FriendsLocationsConnection = {
  __typename?: 'FriendsLocationsConnection';
  /** Friends' locations */
  locations: Array<FriendLocation>;
  /** Total number of locations */
  total: Scalars['Int']['output'];
};

/** Input for fetching all coin transactions (moderator view) */
export type GetAllCoinTransactionsInput = {
  /** Pagination parameters */
  pagination?: InputMaybe<CoinTransactionPaginationInput>;
  /** Trip ID to fetch transactions for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching all notifications (admin only) */
export type GetAllNotificationsInput = {
  /** Pagination options */
  pagination?: InputMaybe<NotificationOffsetPaginationInput>;
  /** Optional trip ID to filter by */
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for fetching a single activity by ID */
export type GetByIdInput = {
  /** Activity ID to fetch */
  id: Scalars['ID']['input'];
};

/** Input for fetching activities by trip ID */
export type GetByTripInput = {
  /** Cursor for pagination */
  cursor?: InputMaybe<ActivityCursorInput>;
  /** Number of activities to return (1-100) */
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  /** Trip ID to fetch activities for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching activities for moderation */
export type GetByTripModerationInput = {
  /** Page number (1-based) */
  page?: InputMaybe<Scalars['Int']['input']>;
  /** Number of activities to return (1-100) */
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  /** Trip ID to fetch activities for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching additional coin insights */
export type GetCoinAdditionalInsightsInput = {
  /** Trip ID to fetch insights for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching quick coin statistics */
export type GetCoinQuickStatsInput = {
  /** Trip ID to fetch statistics for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching coin statistics */
export type GetCoinStatisticsInput = {
  /** Trip ID to fetch statistics for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching notification deliveries with filters */
export type GetDeliveriesInput = {
  /** Filter deliveries before this date */
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Number of deliveries to return (1-100, default 50) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Offset for pagination (default 0) */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by schedule ID */
  scheduleId?: InputMaybe<Scalars['ID']['input']>;
  /** Filter deliveries after this date */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by delivery status */
  status?: InputMaybe<DeliveryStatus>;
  /** Filter by trip ID */
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for fetching a delivery by notification ID */
export type GetDeliveryByNotificationIdInput = {
  /** Notification ID to look up */
  notificationId: Scalars['ID']['input'];
  /** Trip ID for the notification */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching delivery statistics */
export type GetDeliveryStatsInput = {
  /** Filter deliveries before this date */
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by schedule ID */
  scheduleId?: InputMaybe<Scalars['ID']['input']>;
  /** Filter deliveries after this date */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by trip ID */
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for fetching failed deliveries */
export type GetFailedDeliveriesInput = {
  /** Number of deliveries to return (1-100, default 20) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Offset for pagination (default 0) */
  offset?: InputMaybe<Scalars['Int']['input']>;
  /** Filter by trip ID */
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Input for fetching judged staff voting progress */
export type GetJudgedStaffVotingProgressInput = {
  /** IDs of admin participants */
  adminParticipantIds: Array<Scalars['ID']['input']>;
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
  /** Number of eligible submissions */
  eligibleSubmissionsCount: Scalars['Int']['input'];
  /** Number of positions required per admin (1-3) */
  requiredPositions: Scalars['Int']['input'];
  /** ID of the trip */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching most active admin statistics */
export type GetMostActiveAdminStatsInput = {
  /** Trip ID to fetch statistics for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching my votes for a challenge */
export type GetMyVotesInput = {
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
  /** ID of the trip (for participant validation) */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching reports for a specific submission */
export type GetReportsBySubmissionInput = {
  /** ID of the submission to get reports for */
  submissionId: Scalars['ID']['input'];
};

/** Input for fetching coin transactions visible to a user */
export type GetUserCoinTransactionsInput = {
  /** Optional group ID to filter by */
  groupId?: InputMaybe<Scalars['ID']['input']>;
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Trip ID to fetch transactions for */
  tripId: Scalars['ID']['input'];
};

/** Input for fetching all votes for a challenge */
export type GetVotesByChallengeInput = {
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
};

/** Input for fetching voting progress */
export type GetVotingProgressInput = {
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
};

/** A participant group in a trip */
export type Group = {
  __typename?: 'Group';
  /** Unique code for joining the group */
  code: Scalars['String']['output'];
  /** Number of coins the group has earned */
  coins: Scalars['Int']['output'];
  /** When the group was created */
  createdAt: Scalars['DateTime']['output'];
  /** Group description */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the group (UUID) */
  id: Scalars['ID']['output'];
  /** Group image URL */
  image?: Maybe<Scalars['String']['output']>;
  /** Whether the group is currently active (not deleted) */
  isActive: Scalars['Boolean']['output'];
  /** Group name */
  name: Scalars['String']['output'];
  /** ID of the user who organized the group */
  organizerId: Scalars['ID']['output'];
  /** Current status of the group */
  status: GroupStatus;
  /** ID of the trip this group belongs to */
  tripId: Scalars['ID']['output'];
  /** When the group was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Pagination metadata for group lists */
export type GroupPagination = {
  __typename?: 'GroupPagination';
  /** Whether more items are available */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of groups available */
  total: Scalars['Int']['output'];
};

/** Pagination parameters for group queries */
export type GroupPaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Group information for ranking displays */
export type GroupRanking = {
  __typename?: 'GroupRanking';
  /** Unique group code */
  code: Scalars['String']['output'];
  /** Number of coins earned */
  coins: Scalars['Int']['output'];
  /** When the group was created */
  createdAt: Scalars['DateTime']['output'];
  /** Group description */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the group */
  id: Scalars['ID']['output'];
  /** Group image URL */
  image?: Maybe<Scalars['String']['output']>;
  /** Whether the group is active */
  isActive: Scalars['Boolean']['output'];
  /** Group name */
  name: Scalars['String']['output'];
  /** ID of the group organizer */
  organizerId: Scalars['ID']['output'];
  /** Current status of the group */
  status: GroupStatus;
  /** ID of the trip this group belongs to */
  tripId: Scalars['ID']['output'];
};

/** Result of fetching group rankings for a trip */
export type GroupRankingResult = {
  __typename?: 'GroupRankingResult';
  /** Current date for the ranking */
  currentDate: Scalars['DateTime']['output'];
  /** Groups sorted by coins (descending) */
  data: Array<GroupRanking>;
};

/** Current status of a group in the system */
export enum GroupStatus {
  Active = 'ACTIVE',
  Deleted = 'DELETED'
}

/** A simplified view of a group for list displays */
export type GroupSummary = {
  __typename?: 'GroupSummary';
  /** Unique identifier for the group */
  id: Scalars['ID']['output'];
  /** Group name */
  name: Scalars['String']['output'];
};

/** A paginated list of groups with metadata */
export type GroupsConnection = {
  __typename?: 'GroupsConnection';
  /** The groups in this page */
  groups: Array<Group>;
  /** Pagination metadata */
  pagination: GroupPagination;
};

/** Activity result with hide information */
export type HiddenActivityResult = {
  __typename?: 'HiddenActivityResult';
  /** Type of activity */
  activityType: ActivityType;
  /** Activity description */
  description?: Maybe<Scalars['String']['output']>;
  /** When activity was hidden */
  hiddenAt: Scalars['DateTime']['output'];
  /** Reason for hiding */
  hiddenReason?: Maybe<Scalars['String']['output']>;
  /** Activity ID */
  id: Scalars['ID']['output'];
  /** Activity image URL */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** Whether activity is hidden */
  isHidden: Scalars['Boolean']['output'];
  /** Whether activity is pinned */
  isPinned: Scalars['Boolean']['output'];
  /** Activity title */
  title: Scalars['String']['output'];
  /** Trip ID */
  tripId: Scalars['ID']['output'];
  /** When activity was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Input for hiding an activity */
export type HideActivityInput = {
  /** Activity ID to hide */
  activityId: Scalars['ID']['input'];
  /** Reason for hiding */
  reason?: InputMaybe<Scalars['String']['input']>;
};

/** Voting progress for judged staff challenges */
export type JudgedStaffVotingProgress = {
  __typename?: 'JudgedStaffVotingProgress';
  /** Voting progress for each admin */
  adminProgress: Array<AdminVotingInfo>;
  /** Whether all admins have completed voting */
  allAdminsVoted: Scalars['Boolean']['output'];
  /** Number of submissions eligible for voting */
  eligibleSubmissionsCount: Scalars['Int']['output'];
  /** Number of admins who haven't completed voting */
  pendingAdmins: Scalars['Int']['output'];
  /** Number of positions required per admin (1-3) */
  requiredPositions: Scalars['Int']['output'];
  /** Total number of admin participants */
  totalAdmins: Scalars['Int']['output'];
  /** Number of admins who have completed voting */
  votedAdmins: Scalars['Int']['output'];
};

/** Status of the last schedule execution */
export enum LastRunStatus {
  Failure = 'FAILURE',
  Partial = 'PARTIAL',
  Success = 'SUCCESS'
}

/** Input for linking a sponsor to a trip */
export type LinkSponsorToTripInput = {
  /** ID of the sponsor to link */
  sponsorId: Scalars['ID']['input'];
  /** ID of the trip to link to */
  tripId: Scalars['ID']['input'];
};

/** Result of linking a sponsor to a trip */
export type LinkSponsorToTripPayload = {
  __typename?: 'LinkSponsorToTripPayload';
  /** Whether the link was successful */
  linked: Scalars['Boolean']['output'];
  /** ID of the sponsor */
  sponsorId: Scalars['ID']['output'];
  /** ID of the trip */
  tripId: Scalars['ID']['output'];
};

/** A user's geographic location */
export type Location = {
  __typename?: 'Location';
  /** Location accuracy in meters */
  accuracy?: Maybe<Scalars['Float']['output']>;
  /** Altitude in meters above sea level */
  altitude?: Maybe<Scalars['Float']['output']>;
  /** Altitude accuracy in meters */
  altitudeAccuracy?: Maybe<Scalars['Float']['output']>;
  /** Direction of travel in degrees (0-360) */
  heading?: Maybe<Scalars['Float']['output']>;
  /** Unique identifier for the location record (UUID) */
  id: Scalars['ID']['output'];
  /** Whether the user is sharing their location with friends */
  isSharingLocation: Scalars['Boolean']['output'];
  /** Geographic latitude (-90 to 90 degrees) */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** Geographic longitude (-180 to 180 degrees) */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** Speed in meters per second */
  speed?: Maybe<Scalars['Float']['output']>;
  /** When the location was last updated */
  timestamp: Scalars['DateTime']['output'];
  /** ID of the user this location belongs to */
  userId: Scalars['ID']['output'];
  /** List of users allowed to see this location */
  usersToShareWith: Array<SharingUserInfo>;
};

/** Location sharing settings for a user */
export type LocationSharingSettings = {
  __typename?: 'LocationSharingSettings';
  /** Whether location sharing is enabled */
  isSharingLocation: Scalars['Boolean']['output'];
  /** Users allowed to see this location */
  usersToShareWith: Array<SharingUserInfo>;
};

/** Pagination information for moderation view */
export type ModerationPaginationInfo = {
  __typename?: 'ModerationPaginationInfo';
  /** Whether there are more pages */
  hasMore: Scalars['Boolean']['output'];
  /** Current page number */
  page: Scalars['Int']['output'];
  /** Items per page */
  pageSize: Scalars['Int']['output'];
  /** Total number of activities */
  total: Scalars['Int']['output'];
  /** Total number of pages */
  totalPages: Scalars['Int']['output'];
};

/** Statistics about the most active admin by transaction volume */
export type MostActiveAdminStats = {
  __typename?: 'MostActiveAdminStats';
  /** ID of the most active admin */
  adminId: Scalars['ID']['output'];
  /** Full name of the admin (resolved separately) */
  adminName?: Maybe<Scalars['String']['output']>;
  /** Total amount of coins this admin has processed */
  totalAmount: Scalars['Int']['output'];
  /** Number of transactions performed by this admin */
  transactionCount: Scalars['Int']['output'];
};

/** Root mutation type for modifying data */
export type Mutation = {
  __typename?: 'Mutation';
  /** Add coins to a group. Requires moderator or admin privileges. */
  addCoins?: Maybe<CoinTransactionResult>;
  /** Add a user to location sharing list */
  addUserToSharing?: Maybe<SharingUserPayload>;
  /** Bulk delete notification schedules (admin only) */
  bulkDeleteNotificationSchedules?: Maybe<BulkDeleteNotificationSchedulesPayload>;
  /** Bulk toggle active status of notification schedules (admin only) */
  bulkToggleNotificationScheduleActive?: Maybe<BulkToggleActivePayload>;
  /** Check for inactive users and send nudge notifications (admin only, currently disabled) */
  checkInactiveUsers?: Maybe<CheckInactiveUsersPayload>;
  /** Create a new challenge (admin only) */
  createChallenge?: Maybe<CreateChallengePayload>;
  /** Create a challenge event activity */
  createChallengeActivity: Activity;
  /** Create a new challenge submission */
  createChallengeSubmission?: Maybe<ChallengeSubmissionCreateResult>;
  /** Create a custom activity (admin only) */
  createCustomActivity: Activity;
  /** Create a new group */
  createGroup: CreateGroupPayload;
  /** Create a new notification (moderator only) */
  createNotification: CreateNotificationResult;
  /** Create a new notification schedule (admin only) */
  createNotificationSchedule?: Maybe<CreateNotificationSchedulePayload>;
  /** Create a rank change activity */
  createRankChangeActivity: Activity;
  /** Create a new reward (moderator only) */
  createReward?: Maybe<CreateRewardPayload>;
  /** Create a new sponsor (admin only) */
  createSponsor?: Maybe<CreateSponsorPayload>;
  /** Create a submission activity */
  createSubmissionActivity: Activity;
  /** Create a new submission report */
  createSubmissionReport?: Maybe<SubmissionReportCreateResult>;
  /** Create a new trip (admin only) */
  createTrip: Trip;
  /** Create a signed upload URL for resumable file uploads to Supabase Storage */
  createUploadUrl?: Maybe<UploadUrlResult>;
  /** Create a new user (admin only) */
  createUser?: Maybe<UserCreateResult>;
  /** Create a user post activity */
  createUserPost: Activity;
  /** Delete an activity (admin only) */
  deleteActivity: DeleteActivityResult;
  /** Delete (cancel) a challenge (admin only) */
  deleteChallenge?: Maybe<DeleteChallengePayload>;
  /** Delete a challenge submission (only allowed for pending submissions) */
  deleteChallengeSubmission?: Maybe<Scalars['Boolean']['output']>;
  /** Delete a group (admin only) */
  deleteGroup: DeleteGroupPayload;
  /** Delete a notification (admin only) */
  deleteNotification: DeleteNotificationResult;
  /** Delete a notification schedule (admin only) */
  deleteNotificationSchedule?: Maybe<DeleteNotificationSchedulePayload>;
  /** Delete a reward (moderator only) */
  deleteReward?: Maybe<DeleteRewardPayload>;
  /** Delete a sponsor (admin only) */
  deleteSponsor?: Maybe<DeleteSponsorPayload>;
  /** Delete a trip (admin only) */
  deleteTrip: DeleteTripResult;
  /** Duplicate a notification schedule (admin only) */
  duplicateNotificationSchedule?: Maybe<DuplicateNotificationSchedulePayload>;
  /** Force the end of voting for a judged staff challenge (admin only) */
  forceEndVoting?: Maybe<ForceEndVotingPayload>;
  /** Hide an activity */
  hideActivity: HiddenActivityResult;
  /** Link a sponsor to a trip (admin only) */
  linkSponsorToTrip?: Maybe<LinkSponsorToTripPayload>;
  /** Purchase a reward (authenticated users) */
  purchaseReward?: Maybe<PurchaseRewardPayload>;
  /** Remove coins from a group. Requires moderator or admin privileges. */
  removeCoins?: Maybe<CoinTransactionResult>;
  /** Remove a user from location sharing list */
  removeUserFromSharing?: Maybe<SharingUserPayload>;
  /** Send mobile push notifications (admin only) */
  sendMobileNotifications?: Maybe<SendMobileNotificationsPayload>;
  /** Pin or unpin an activity */
  setActivityPinned: Activity;
  /** Set reward hidden status (moderator only) */
  setRewardHidden?: Maybe<SetRewardHiddenPayload>;
  /** Submit a single vote for a challenge submission */
  submitVote?: Maybe<SubmitVotePayload>;
  /** Submit multiple votes for a challenge (batch) */
  submitVotes?: Maybe<SubmitVotesPayload>;
  /** Toggle a reaction on an activity */
  toggleActivityReaction: ToggleReactionResult;
  /** Toggle the active status of a notification schedule (admin only) */
  toggleNotificationScheduleActive?: Maybe<ToggleScheduleActivePayload>;
  /** Track the completion of a notification delivery (admin only) */
  trackDeliveryComplete?: Maybe<TrackDeliveryCompletePayload>;
  /** Track a notification delivery failure (admin only) */
  trackDeliveryFailure?: Maybe<TrackDeliveryFailurePayload>;
  /** Track the start of a notification delivery (admin only) */
  trackDeliveryStart?: Maybe<TrackDeliveryStartPayload>;
  /** Unhide an activity */
  unhideActivity: Activity;
  /** Unlink a sponsor from a trip (admin only) */
  unlinkSponsorFromTrip?: Maybe<UnlinkSponsorFromTripPayload>;
  /** Update an activity */
  updateActivity: Activity;
  /** Update an existing challenge (admin only) */
  updateChallenge?: Maybe<UpdateChallengePayload>;
  /** Update a challenge's status (admin only) */
  updateChallengeStatus?: Maybe<UpdateChallengeStatusPayload>;
  /** Update a challenge submission (content or review) */
  updateChallengeSubmission?: Maybe<ChallengeSubmissionUpdateResult>;
  /** Update an existing group */
  updateGroup: UpdateGroupPayload;
  /** Update the current user's location */
  updateLocation?: Maybe<UpdateLocationPayload>;
  /** Update own purchase status (group leader only, limited transitions) */
  updateMyPurchaseStatus?: Maybe<UpdateMyPurchaseStatusPayload>;
  /** Update a notification (admin only) */
  updateNotification: UpdateNotificationResult;
  /** Update an existing notification schedule (admin only) */
  updateNotificationSchedule?: Maybe<UpdateNotificationSchedulePayload>;
  /** Update the last run timestamp of a schedule (moderator+) */
  updateNotificationScheduleLastRun?: Maybe<UpdateLastRunPayload>;
  /** Update notification status (admin only) */
  updateNotificationStatus: UpdateNotificationStatusResult;
  /** Update a purchase status (moderator only) */
  updatePurchaseStatus?: Maybe<UpdatePurchaseStatusPayload>;
  /** Update an existing reward (moderator only) */
  updateReward?: Maybe<UpdateRewardPayload>;
  /** Update location sharing settings */
  updateSharingSettings?: Maybe<UpdateSharingSettingsPayload>;
  /** Update an existing sponsor (admin only) */
  updateSponsor?: Maybe<UpdateSponsorPayload>;
  /** Update a trip (admin only) */
  updateTrip: Trip;
  /** Update a user's profile information */
  updateUser?: Maybe<UserUpdateResult>;
};


/** Root mutation type for modifying data */
export type MutationAddCoinsArgs = {
  input: AddCoinsInput;
};


/** Root mutation type for modifying data */
export type MutationAddUserToSharingArgs = {
  input: AddSharingUserInput;
};


/** Root mutation type for modifying data */
export type MutationBulkDeleteNotificationSchedulesArgs = {
  ids: Array<Scalars['ID']['input']>;
};


/** Root mutation type for modifying data */
export type MutationBulkToggleNotificationScheduleActiveArgs = {
  ids: Array<Scalars['ID']['input']>;
  isActive: Scalars['Boolean']['input'];
};


/** Root mutation type for modifying data */
export type MutationCreateChallengeArgs = {
  input: CreateChallengeInput;
};


/** Root mutation type for modifying data */
export type MutationCreateChallengeActivityArgs = {
  input: CreateChallengeActivityInput;
};


/** Root mutation type for modifying data */
export type MutationCreateChallengeSubmissionArgs = {
  input: CreateSubmissionInput;
};


/** Root mutation type for modifying data */
export type MutationCreateCustomActivityArgs = {
  input: CreateCustomActivityInput;
};


/** Root mutation type for modifying data */
export type MutationCreateGroupArgs = {
  input: CreateGroupInput;
};


/** Root mutation type for modifying data */
export type MutationCreateNotificationArgs = {
  input: CreateNotificationInput;
};


/** Root mutation type for modifying data */
export type MutationCreateNotificationScheduleArgs = {
  input: CreateNotificationScheduleInput;
};


/** Root mutation type for modifying data */
export type MutationCreateRankChangeActivityArgs = {
  input: CreateRankChangeActivityInput;
};


/** Root mutation type for modifying data */
export type MutationCreateRewardArgs = {
  input: CreateRewardInput;
};


/** Root mutation type for modifying data */
export type MutationCreateSponsorArgs = {
  input: CreateSponsorInput;
};


/** Root mutation type for modifying data */
export type MutationCreateSubmissionActivityArgs = {
  input: CreateSubmissionActivityInput;
};


/** Root mutation type for modifying data */
export type MutationCreateSubmissionReportArgs = {
  input: CreateReportInput;
};


/** Root mutation type for modifying data */
export type MutationCreateTripArgs = {
  input: CreateTripInput;
};


/** Root mutation type for modifying data */
export type MutationCreateUploadUrlArgs = {
  input: CreateUploadUrlInput;
};


/** Root mutation type for modifying data */
export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


/** Root mutation type for modifying data */
export type MutationCreateUserPostArgs = {
  input: CreateUserPostInput;
};


/** Root mutation type for modifying data */
export type MutationDeleteActivityArgs = {
  input: DeleteActivityInput;
};


/** Root mutation type for modifying data */
export type MutationDeleteChallengeArgs = {
  id: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationDeleteChallengeSubmissionArgs = {
  submissionId: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationDeleteGroupArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationDeleteNotificationArgs = {
  input: DeleteNotificationInput;
};


/** Root mutation type for modifying data */
export type MutationDeleteNotificationScheduleArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationDeleteRewardArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationDeleteSponsorArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationDeleteTripArgs = {
  input: DeleteTripInput;
};


/** Root mutation type for modifying data */
export type MutationDuplicateNotificationScheduleArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationForceEndVotingArgs = {
  input: ForceEndVotingInput;
};


/** Root mutation type for modifying data */
export type MutationHideActivityArgs = {
  input: HideActivityInput;
};


/** Root mutation type for modifying data */
export type MutationLinkSponsorToTripArgs = {
  input: LinkSponsorToTripInput;
};


/** Root mutation type for modifying data */
export type MutationPurchaseRewardArgs = {
  input: PurchaseRewardInput;
};


/** Root mutation type for modifying data */
export type MutationRemoveCoinsArgs = {
  input: RemoveCoinsInput;
};


/** Root mutation type for modifying data */
export type MutationRemoveUserFromSharingArgs = {
  input: RemoveSharingUserInput;
};


/** Root mutation type for modifying data */
export type MutationSendMobileNotificationsArgs = {
  input: SendMobileNotificationsInput;
};


/** Root mutation type for modifying data */
export type MutationSetActivityPinnedArgs = {
  input: SetPinnedInput;
};


/** Root mutation type for modifying data */
export type MutationSetRewardHiddenArgs = {
  input: SetRewardHiddenInput;
};


/** Root mutation type for modifying data */
export type MutationSubmitVoteArgs = {
  input: SubmitVoteInput;
};


/** Root mutation type for modifying data */
export type MutationSubmitVotesArgs = {
  input: SubmitVotesInput;
};


/** Root mutation type for modifying data */
export type MutationToggleActivityReactionArgs = {
  input: ToggleReactionInput;
};


/** Root mutation type for modifying data */
export type MutationToggleNotificationScheduleActiveArgs = {
  id: Scalars['ID']['input'];
};


/** Root mutation type for modifying data */
export type MutationTrackDeliveryCompleteArgs = {
  input: TrackDeliveryCompleteInput;
};


/** Root mutation type for modifying data */
export type MutationTrackDeliveryFailureArgs = {
  input: TrackDeliveryFailureInput;
};


/** Root mutation type for modifying data */
export type MutationTrackDeliveryStartArgs = {
  input: TrackDeliveryStartInput;
};


/** Root mutation type for modifying data */
export type MutationUnhideActivityArgs = {
  input: UnhideActivityInput;
};


/** Root mutation type for modifying data */
export type MutationUnlinkSponsorFromTripArgs = {
  input: UnlinkSponsorFromTripInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateActivityArgs = {
  input: UpdateActivityInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateChallengeArgs = {
  input: UpdateChallengeInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateChallengeStatusArgs = {
  input: UpdateChallengeStatusInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateChallengeSubmissionArgs = {
  input: UpdateSubmissionInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateGroupArgs = {
  input: UpdateGroupInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateLocationArgs = {
  input: UpdateLocationInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateMyPurchaseStatusArgs = {
  input: UpdateMyPurchaseStatusInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateNotificationArgs = {
  input: UpdateNotificationInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateNotificationScheduleArgs = {
  input: UpdateNotificationScheduleInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateNotificationScheduleLastRunArgs = {
  input: UpdateLastRunInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateNotificationStatusArgs = {
  input: UpdateNotificationStatusInput;
};


/** Root mutation type for modifying data */
export type MutationUpdatePurchaseStatusArgs = {
  input: UpdatePurchaseStatusInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateRewardArgs = {
  input: UpdateRewardInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateSharingSettingsArgs = {
  input: UpdateSharingSettingsInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateSponsorArgs = {
  input: UpdateSponsorInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateTripArgs = {
  input: UpdateTripInput;
};


/** Root mutation type for modifying data */
export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};

/** Result of fetching current user's notifications */
export type MyNotificationsResult = {
  __typename?: 'MyNotificationsResult';
  /** List of notifications */
  notifications: Array<Notification>;
  /** Pagination information */
  pagination: NotificationPaginationInfo;
};

/** A notification message */
export type Notification = {
  __typename?: 'Notification';
  /** Notification body content */
  body: Scalars['String']['output'];
  /** When notification was created */
  createdAt: Scalars['DateTime']['output'];
  /** User ID who created the notification */
  createdById: Scalars['ID']['output'];
  /** Unique notification ID */
  id: Scalars['ID']['output'];
  /** Whether notification is ready to be sent */
  isReadyToSend?: Maybe<Scalars['Boolean']['output']>;
  /** Whether notification is scheduled for future delivery */
  isScheduled: Scalars['Boolean']['output'];
  /** Whether notification has been sent */
  isSent: Scalars['Boolean']['output'];
  /** Priority level */
  priority: NotificationPriority;
  /** When notification is scheduled to be sent */
  scheduledFor?: Maybe<Scalars['DateTime']['output']>;
  /** When notification was actually sent */
  sentAt?: Maybe<Scalars['DateTime']['output']>;
  /** Current status */
  status: NotificationStatus;
  /** Notification title */
  title: Scalars['String']['output'];
  /** Associated trip ID (null if global) */
  tripId?: Maybe<Scalars['ID']['output']>;
  /** When notification was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Optional URL to open when tapped */
  url?: Maybe<Scalars['String']['output']>;
};

/** Creator of the notification */
export type NotificationCreator = {
  __typename?: 'NotificationCreator';
  /** Auth provider user ID */
  authUserId?: Maybe<Scalars['String']['output']>;
  /** Creator first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Creator user ID */
  id: Scalars['ID']['output'];
  /** Creator last name */
  lastName?: Maybe<Scalars['String']['output']>;
};

/** A notification delivery record */
export type NotificationDelivery = {
  __typename?: 'NotificationDelivery';
  /** When delivery record was created */
  createdAt: Scalars['DateTime']['output'];
  /** When delivery completed (null if still in progress) */
  deliveryCompletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** When delivery started */
  deliveryStartedAt: Scalars['DateTime']['output'];
  /** Error log for failed deliveries */
  errorLog?: Maybe<Scalars['String']['output']>;
  /** Number of failed deliveries */
  failureCount: Scalars['Int']['output'];
  /** Unique delivery ID */
  id: Scalars['ID']['output'];
  /** Associated notification details */
  notification?: Maybe<NotificationInfo>;
  /** ID of the notification being delivered */
  notificationId: Scalars['ID']['output'];
  /** Associated schedule ID if scheduled delivery */
  scheduleId?: Maybe<Scalars['ID']['output']>;
  /** Current delivery status */
  status: DeliveryStatus;
  /** Number of successful deliveries */
  successCount: Scalars['Int']['output'];
  /** Total number of intended recipients */
  totalRecipients: Scalars['Int']['output'];
  /** Trip ID this delivery belongs to */
  tripId: Scalars['ID']['output'];
  /** When delivery record was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Result of fetching a list of notification deliveries */
export type NotificationDeliveryListResult = {
  __typename?: 'NotificationDeliveryListResult';
  /** List of deliveries */
  deliveries: Array<NotificationDelivery>;
  /** Pagination information */
  pagination: DeliveryPagination;
};

/** Status of a notification delivery */
export enum NotificationDeliveryStatus {
  Failure = 'FAILURE',
  PartialFailure = 'PARTIAL_FAILURE',
  Pending = 'PENDING',
  Success = 'SUCCESS'
}

/** Notification information within a delivery */
export type NotificationInfo = {
  __typename?: 'NotificationInfo';
  /** Notification body */
  body: Scalars['String']['output'];
  /** When notification was created */
  createdAt: Scalars['DateTime']['output'];
  /** User who created the notification */
  createdBy?: Maybe<NotificationCreator>;
  /** Notification ID */
  id: Scalars['ID']['output'];
  /** Notification title */
  title: Scalars['String']['output'];
  /** Trip ID the notification belongs to */
  tripId?: Maybe<Scalars['ID']['output']>;
  /** Notification URL/deep link */
  url?: Maybe<Scalars['String']['output']>;
};

/** Offset-based pagination information */
export type NotificationOffsetPaginationInfo = {
  __typename?: 'NotificationOffsetPaginationInfo';
  /** Whether there are more items */
  hasMore: Scalars['Boolean']['output'];
  /** Items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of items */
  total: Scalars['Int']['output'];
};

/** Offset-based pagination for admin queries */
export type NotificationOffsetPaginationInput = {
  /** Number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Pagination information for notification lists */
export type NotificationPaginationInfo = {
  __typename?: 'NotificationPaginationInfo';
  /** Current page number */
  page: Scalars['Int']['output'];
  /** Items per page */
  pageSize: Scalars['Int']['output'];
  /** Total number of items */
  total: Scalars['Int']['output'];
  /** Total number of pages */
  totalPages: Scalars['Int']['output'];
};

/** Pagination input for notification queries */
export type NotificationPaginationInput = {
  /** Page number (1-based) */
  page?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items per page (1-100) */
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

/** Priority level of a notification */
export enum NotificationPriority {
  High = 'HIGH',
  Low = 'LOW',
  Normal = 'NORMAL',
  Urgent = 'URGENT'
}

/** A scheduled notification campaign */
export type NotificationSchedule = {
  __typename?: 'NotificationSchedule';
  /** When the schedule was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this schedule */
  createdById: Scalars['ID']['output'];
  /** When the schedule expires */
  endDate: Scalars['DateTime']['output'];
  /** Formatted time string (HH:MM) */
  formattedTime: Scalars['String']['output'];
  /** Scheduled hour (0-23) */
  hour: Scalars['Int']['output'];
  /** Unique identifier for the schedule (UUID) */
  id: Scalars['ID']['output'];
  /** Whether the schedule is enabled */
  isActive: Scalars['Boolean']['output'];
  /** Whether the schedule is currently within its active time window */
  isCurrentlyActive: Scalars['Boolean']['output'];
  /** Whether the schedule has passed its end date */
  isExpired: Scalars['Boolean']['output'];
  /** Whether the schedule has not yet reached its start date */
  isUpcoming: Scalars['Boolean']['output'];
  /** When the schedule last ran (null if never run) */
  lastRun?: Maybe<Scalars['DateTime']['output']>;
  /** Scheduled minute (0-59) */
  minute: Scalars['Int']['output'];
  /** Schedule name/campaign name */
  name: Scalars['String']['output'];
  /** Notification body content (optional for INFO type) */
  notificationBody?: Maybe<Scalars['String']['output']>;
  /** Notification title (optional for INFO type) */
  notificationTitle?: Maybe<Scalars['String']['output']>;
  /** Type of notification to send */
  notificationType: NotificationScheduleType;
  /** Optional URL to include in the notification */
  notificationUrl?: Maybe<Scalars['String']['output']>;
  /** When the schedule becomes active */
  startDate: Scalars['DateTime']['output'];
  /** ID of the trip this schedule is associated with (optional) */
  tripId?: Maybe<Scalars['ID']['output']>;
  /** When the schedule was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Filter options for notification schedule queries */
export type NotificationScheduleFilterInput = {
  /** Filter by active status */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** Filter by notification type */
  notificationType?: InputMaybe<NotificationScheduleType>;
  /** Search by name */
  search?: InputMaybe<Scalars['String']['input']>;
  /** Filter by start date (from) */
  startDateFrom?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by start date (to) */
  startDateTo?: InputMaybe<Scalars['DateTime']['input']>;
  /** Filter by associated trip ID */
  tripId?: InputMaybe<Scalars['ID']['input']>;
};

/** Pagination metadata for notification schedule lists */
export type NotificationSchedulePagination = {
  __typename?: 'NotificationSchedulePagination';
  /** Whether more items are available */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of schedules available */
  total: Scalars['Int']['output'];
};

/** Pagination parameters for list queries */
export type NotificationSchedulePaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** A simplified view of a notification schedule for list displays */
export type NotificationScheduleSummary = {
  __typename?: 'NotificationScheduleSummary';
  /** Schedule end date */
  endDate: Scalars['DateTime']['output'];
  /** Scheduled hour */
  hour: Scalars['Int']['output'];
  /** Unique identifier for the schedule */
  id: Scalars['ID']['output'];
  /** Whether the schedule is enabled */
  isActive: Scalars['Boolean']['output'];
  /** Scheduled minute */
  minute: Scalars['Int']['output'];
  /** Schedule name */
  name: Scalars['String']['output'];
  /** Type of notification */
  notificationType: NotificationScheduleType;
  /** Schedule start date */
  startDate: Scalars['DateTime']['output'];
  /** Associated trip ID */
  tripId?: Maybe<Scalars['ID']['output']>;
};

/** Type of scheduled notification */
export enum NotificationScheduleType {
  Announcement = 'ANNOUNCEMENT',
  Challenge = 'CHALLENGE',
  DailyRanking = 'DAILY_RANKING',
  Info = 'INFO',
  Reminder = 'REMINDER'
}

/** A paginated list of notification schedules with metadata */
export type NotificationSchedulesConnection = {
  __typename?: 'NotificationSchedulesConnection';
  /** Pagination metadata */
  pagination: NotificationSchedulePagination;
  /** The schedules in this page */
  schedules: Array<NotificationScheduleSummary>;
};

/** Status of a notification */
export enum NotificationStatus {
  Cancelled = 'CANCELLED',
  Draft = 'DRAFT',
  Failed = 'FAILED',
  Ready = 'READY',
  Sent = 'SENT'
}

/** Direction for ordering results */
export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

/** Pagination information for activity feed */
export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  /** Whether there are more items */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  pageSize: Scalars['Int']['output'];
};

/** Pagination parameters for list queries */
export type PaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Result of creating a public URL */
export type PublicUrlResult = {
  __typename?: 'PublicUrlResult';
  /** The public URL for accessing the file */
  publicUrl: Scalars['String']['output'];
};

/** A paginated list of reward purchases with metadata */
export type PurchaseHistoryConnection = {
  __typename?: 'PurchaseHistoryConnection';
  /** Pagination metadata */
  pagination: RewardPagination;
  /** The purchases in this page */
  purchases: Array<RewardPurchase>;
};

/** Input for purchasing a reward */
export type PurchaseRewardInput = {
  /** Number of rewards to purchase (min 1) */
  quantity: Scalars['Int']['input'];
  /** ID of the reward to purchase */
  rewardId: Scalars['ID']['input'];
};

/** Result of purchasing a reward */
export type PurchaseRewardPayload = {
  __typename?: 'PurchaseRewardPayload';
  /** The purchase record */
  purchase: RewardPurchase;
  /** Remaining coins in the group after purchase */
  remainingGroupCoins: Scalars['Int']['output'];
  /** Remaining quantity of the reward after purchase */
  remainingRewardQuantity: Scalars['Int']['output'];
};

/** Root query type for fetching data */
export type Query = {
  __typename?: 'Query';
  /** Get all currently active notification schedules (moderator+) */
  activeNotificationSchedules?: Maybe<Array<NotificationSchedule>>;
  /** Get activities for a trip (cursor pagination) */
  activitiesByTrip: ActivityFeedResult;
  /** Get activities for moderation (includes hidden) */
  activitiesByTripModeration: ActivityFeedModerationResult;
  /** Get a single activity by ID */
  activity?: Maybe<Activity>;
  /** Get all notifications (admin only) */
  allNotifications: AllNotificationsResult;
  /** Get a challenge by its ID */
  challenge?: Maybe<Challenge>;
  /** Get a challenge submission by its unique ID */
  challengeSubmission?: Maybe<ChallengeSubmission>;
  /** Get a submission by challenge ID and group ID */
  challengeSubmissionByChallengeAndGroup?: Maybe<ChallengeSubmission>;
  /** List all submissions for a challenge with pagination and sorting */
  challengeSubmissions?: Maybe<ChallengeSubmissionListResult>;
  /** Get all active challenges (admin only) */
  challenges?: Maybe<Array<Challenge>>;
  /** Get challenges for a specific trip */
  challengesByTrip?: Maybe<ChallengesConnection>;
  /** Get additional coin insights for a trip (moderator only) */
  coinAdditionalInsights?: Maybe<CoinAdditionalInsights>;
  /** Get quick coin statistics for a trip (moderator only) */
  coinQuickStats?: Maybe<CoinQuickStats>;
  /** Get comprehensive coin statistics for a trip (moderator only) */
  coinStatistics?: Maybe<CoinStatistics>;
  /** Get all coin transactions for a trip (moderator only) */
  coinTransactions?: Maybe<CoinTransactionsConnection>;
  /** Create a signed download URL for a file in Supabase Storage */
  createDownloadUrl?: Maybe<DownloadUrlResult>;
  /** Create a public URL for a file in the 'files-public' bucket */
  createPublicUrl?: Maybe<PublicUrlResult>;
  /** Get notification delivery statistics */
  deliveryStats: DeliveryStats;
  /** Get failed notification deliveries */
  failedDeliveries: NotificationDeliveryListResult;
  /** Get locations of friends sharing with current user */
  friendsLocations?: Maybe<FriendsLocationsConnection>;
  /** Get a group by its ID */
  group?: Maybe<Group>;
  /** Get a group by its unique code */
  groupByCode?: Maybe<Group>;
  /** Get group names for a trip (moderator only) */
  groupNamesByTrip: Array<GroupSummary>;
  /** Get group rankings for a trip */
  groupRanking: GroupRankingResult;
  /** Get all groups (admin only) */
  groups: GroupsConnection;
  /** Get groups organized by a specific user */
  groupsByOrganizer: Array<Group>;
  /** Get groups for a specific trip */
  groupsByTrip: GroupsConnection;
  /** Get judged staff voting progress (moderator/admin only) */
  judgedStaffVotingProgress?: Maybe<JudgedStaffVotingProgress>;
  /** Get the currently authenticated user */
  me?: Maybe<User>;
  /** Get most active admin statistics (moderator only) */
  mostActiveAdminStats?: Maybe<MostActiveAdminStats>;
  /** Get coin transactions for the current user */
  myCoinTransactions: Array<CoinTransaction>;
  /** Get the current user's location */
  myLocation?: Maybe<Location>;
  /** Get current user's notifications */
  myNotifications: MyNotificationsResult;
  /** Get current user's location sharing settings */
  mySharingSettings?: Maybe<LocationSharingSettings>;
  /** Get my votes for a specific challenge */
  myVotes?: Maybe<ChallengeVoteList>;
  /** Get a single notification by ID (admin only) */
  notification?: Maybe<Notification>;
  /** Get notification deliveries with optional filters */
  notificationDeliveries: NotificationDeliveryListResult;
  /** Get a notification delivery by notification ID */
  notificationDeliveryByNotificationId?: Maybe<NotificationDelivery>;
  /** Get a notification schedule by its ID (moderator+) */
  notificationSchedule?: Maybe<NotificationSchedule>;
  /** Get execution history for a notification schedule (moderator+) */
  notificationScheduleExecutionHistory?: Maybe<ExecutionHistoryResult>;
  /** Get all notification schedules with filtering (moderator+) */
  notificationSchedules?: Maybe<NotificationSchedulesConnection>;
  /** Get purchase history for a trip */
  purchaseHistory?: Maybe<PurchaseHistoryConnection>;
  /** Get a reward by its ID */
  reward?: Maybe<Reward>;
  /** Get visible rewards for a specific trip */
  rewardsByTrip?: Maybe<RewardsConnection>;
  /** Get all rewards for a trip including hidden (admin only) */
  rewardsByTripAdmin?: Maybe<RewardsConnection>;
  /** Get a sponsor by its ID */
  sponsor?: Maybe<Sponsor>;
  /** Get all active sponsors */
  sponsors?: Maybe<SponsorListResult>;
  /** Get sponsors for a specific trip */
  sponsorsByTrip?: Maybe<Array<Sponsor>>;
  /** Get all reports filed against a specific submission */
  submissionReports?: Maybe<SubmissionReportListResult>;
  /** Get total available points for a trip (admin only) */
  totalAvailablePoints?: Maybe<TotalAvailablePointsPayload>;
  /** Get a trip by ID */
  trip?: Maybe<Trip>;
  /** Get a trip by ID (admin only) */
  tripAdmin?: Maybe<Trip>;
  /** Get trips where current user is a participant */
  trips: TripListResult;
  /** Get upcoming notification schedules (moderator+) */
  upcomingNotificationSchedules?: Maybe<Array<NotificationSchedule>>;
  /** Get a user by their unique ID */
  user?: Maybe<User>;
  /** Get all users (admin only) */
  users?: Maybe<Array<User>>;
  /** Get all votes for a challenge (moderator/admin only) */
  votesByChallenge?: Maybe<ChallengeVoteAdminList>;
  /** Get voting progress for a challenge */
  votingProgress?: Maybe<VotingProgress>;
};


/** Root query type for fetching data */
export type QueryActiveNotificationSchedulesArgs = {
  notificationType?: InputMaybe<NotificationScheduleType>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
};


/** Root query type for fetching data */
export type QueryActivitiesByTripArgs = {
  input: GetByTripInput;
};


/** Root query type for fetching data */
export type QueryActivitiesByTripModerationArgs = {
  input: GetByTripModerationInput;
};


/** Root query type for fetching data */
export type QueryActivityArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryAllNotificationsArgs = {
  input?: InputMaybe<GetAllNotificationsInput>;
};


/** Root query type for fetching data */
export type QueryChallengeArgs = {
  id: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryChallengeSubmissionArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryChallengeSubmissionByChallengeAndGroupArgs = {
  challengeId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryChallengeSubmissionsArgs = {
  challengeId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SubmissionOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
};


/** Root query type for fetching data */
export type QueryChallengesByTripArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryCoinAdditionalInsightsArgs = {
  input: GetCoinAdditionalInsightsInput;
};


/** Root query type for fetching data */
export type QueryCoinQuickStatsArgs = {
  input: GetCoinQuickStatsInput;
};


/** Root query type for fetching data */
export type QueryCoinStatisticsArgs = {
  input: GetCoinStatisticsInput;
};


/** Root query type for fetching data */
export type QueryCoinTransactionsArgs = {
  input: GetAllCoinTransactionsInput;
};


/** Root query type for fetching data */
export type QueryCreateDownloadUrlArgs = {
  input: CreateDownloadUrlInput;
};


/** Root query type for fetching data */
export type QueryCreatePublicUrlArgs = {
  input: CreatePublicUrlInput;
};


/** Root query type for fetching data */
export type QueryDeliveryStatsArgs = {
  input?: InputMaybe<GetDeliveryStatsInput>;
};


/** Root query type for fetching data */
export type QueryFailedDeliveriesArgs = {
  input?: InputMaybe<GetFailedDeliveriesInput>;
};


/** Root query type for fetching data */
export type QueryGroupArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryGroupByCodeArgs = {
  code: Scalars['String']['input'];
};


/** Root query type for fetching data */
export type QueryGroupNamesByTripArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryGroupRankingArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryGroupsArgs = {
  pagination?: InputMaybe<GroupPaginationInput>;
};


/** Root query type for fetching data */
export type QueryGroupsByOrganizerArgs = {
  organizerId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryGroupsByTripArgs = {
  pagination?: InputMaybe<GroupPaginationInput>;
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryJudgedStaffVotingProgressArgs = {
  input: GetJudgedStaffVotingProgressInput;
};


/** Root query type for fetching data */
export type QueryMostActiveAdminStatsArgs = {
  input: GetMostActiveAdminStatsInput;
};


/** Root query type for fetching data */
export type QueryMyCoinTransactionsArgs = {
  input: GetUserCoinTransactionsInput;
};


/** Root query type for fetching data */
export type QueryMyNotificationsArgs = {
  input?: InputMaybe<NotificationPaginationInput>;
};


/** Root query type for fetching data */
export type QueryMyVotesArgs = {
  input: GetMyVotesInput;
};


/** Root query type for fetching data */
export type QueryNotificationArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryNotificationDeliveriesArgs = {
  input?: InputMaybe<GetDeliveriesInput>;
};


/** Root query type for fetching data */
export type QueryNotificationDeliveryByNotificationIdArgs = {
  input: GetDeliveryByNotificationIdInput;
};


/** Root query type for fetching data */
export type QueryNotificationScheduleArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryNotificationScheduleExecutionHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
  scheduleId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryNotificationSchedulesArgs = {
  filter?: InputMaybe<NotificationScheduleFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};


/** Root query type for fetching data */
export type QueryPurchaseHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryRewardArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryRewardsByTripArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryRewardsByTripAdminArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QuerySponsorArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QuerySponsorsByTripArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QuerySubmissionReportsArgs = {
  submissionId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryTotalAvailablePointsArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryTripArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryTripAdminArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryTripsArgs = {
  pagination?: InputMaybe<TripPaginationInput>;
};


/** Root query type for fetching data */
export type QueryUpcomingNotificationSchedulesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  withinMinutes?: InputMaybe<Scalars['Int']['input']>;
};


/** Root query type for fetching data */
export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


/** Root query type for fetching data */
export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** Root query type for fetching data */
export type QueryVotesByChallengeArgs = {
  input: GetVotesByChallengeInput;
};


/** Root query type for fetching data */
export type QueryVotingProgressArgs = {
  input: GetVotingProgressInput;
};

/** Counts for each reaction type */
export type ReactionCounts = {
  __typename?: 'ReactionCounts';
  /** Number of clap reactions */
  clap: Scalars['Int']['output'];
  /** Number of fire reactions */
  fire: Scalars['Int']['output'];
  /** Number of heart reactions */
  heart: Scalars['Int']['output'];
  /** Number of star reactions */
  star: Scalars['Int']['output'];
};

/** Types of reactions users can add to activities */
export enum ReactionType {
  Clap = 'CLAP',
  Fire = 'FIRE',
  Heart = 'HEART',
  Star = 'STAR'
}

/** Summary of reactions on an activity */
export type ReactionsSummary = {
  __typename?: 'ReactionsSummary';
  /** Counts per reaction type */
  counts: ReactionCounts;
  /** Current user's reactions */
  myReactions: Array<ReactionType>;
  /** Total number of reactions */
  total: Scalars['Int']['output'];
};

/** Input for removing coins from a group */
export type RemoveCoinsInput = {
  /** Amount of coins to remove (must be at least 1) */
  amount: Scalars['Int']['input'];
  /** ID of the group to remove coins from */
  groupId: Scalars['ID']['input'];
  /** Reason for removing coins (optional) */
  reason?: InputMaybe<Scalars['String']['input']>;
  /** ID of the trip the group belongs to */
  tripId: Scalars['ID']['input'];
};

/** Input for removing a user from location sharing */
export type RemoveSharingUserInput = {
  /** ID of the user to remove */
  userId: Scalars['ID']['input'];
};

/** Standard reasons for reporting a submission */
export enum ReportReason {
  Cheating = 'CHEATING',
  Inappropriate = 'INAPPROPRIATE',
  Other = 'OTHER',
  Spam = 'SPAM',
  WrongSubmission = 'WRONG_SUBMISSION'
}

/** Action to take when reviewing a submission */
export enum ReviewAction {
  Approve = 'APPROVE',
  Reject = 'REJECT'
}

/** A reward that can be purchased with coins in a trip */
export type Reward = {
  __typename?: 'Reward';
  /** Number of rewards available for purchase */
  availableQuantity: Scalars['Int']['output'];
  /** Whether the reward can be purchased (in stock and not hidden) */
  canBePurchased: Scalars['Boolean']['output'];
  /** Percentage of total trip points that this reward costs (1-100) */
  coinCostPercentage: Scalars['Int']['output'];
  /** When the reward was created */
  createdAt: Scalars['DateTime']['output'];
  /** ID of the user who created this reward */
  createdById: Scalars['ID']['output'];
  /** Reward description */
  description: Scalars['String']['output'];
  /** Unique identifier for the reward (UUID) */
  id: Scalars['ID']['output'];
  /** Array of reward image URLs */
  images: Array<Scalars['String']['output']>;
  /** Whether the reward is hidden from users */
  isHidden: Scalars['Boolean']['output'];
  /** Whether the reward is currently in stock */
  isInStock: Scalars['Boolean']['output'];
  /** Reward name/title */
  name: Scalars['String']['output'];
  /** Primary/main image URL (first image or null) */
  primaryImage?: Maybe<Scalars['String']['output']>;
  /** Number of times this reward has been purchased */
  purchaseCount: Scalars['Int']['output'];
  /** ID of the trip this reward belongs to */
  tripId: Scalars['ID']['output'];
  /** When the reward was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Pagination metadata for reward lists */
export type RewardPagination = {
  __typename?: 'RewardPagination';
  /** Whether more items are available */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of rewards available */
  total: Scalars['Int']['output'];
};

/** A purchase record for a reward */
export type RewardPurchase = {
  __typename?: 'RewardPurchase';
  /** Method for collecting the reward (e.g., 'Pick up at hotel') */
  collectionMethod?: Maybe<Scalars['String']['output']>;
  /** ID of the group that made the purchase */
  groupId: Scalars['ID']['output'];
  /** Name of the group that made the purchase */
  groupName?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the purchase */
  purchaseId: Scalars['ID']['output'];
  /** When the purchase was made */
  purchasedAt: Scalars['DateTime']['output'];
  /** ID of the user who made the purchase */
  purchasedById: Scalars['ID']['output'];
  /** Name of the user who made the purchase */
  purchasedByName?: Maybe<Scalars['String']['output']>;
  /** Number of rewards purchased */
  quantity: Scalars['Int']['output'];
  /** ID of the purchased reward */
  rewardId: Scalars['ID']['output'];
  /** Name of the purchased reward */
  rewardName: Scalars['String']['output'];
  /** Current status of the purchase */
  status: RewardPurchaseStatus;
  /** When the status was last updated */
  statusUpdatedAt: Scalars['DateTime']['output'];
  /** ID of the user who last updated the status */
  statusUpdatedById?: Maybe<Scalars['ID']['output']>;
  /** Name of the user who last updated the status */
  statusUpdatedByName?: Maybe<Scalars['String']['output']>;
  /** Total coin cost for this purchase */
  totalCost: Scalars['Int']['output'];
};

/** Status of a reward purchase in its lifecycle */
export enum RewardPurchaseStatus {
  Accepted = 'ACCEPTED',
  Bought = 'BOUGHT',
  Cancelled = 'CANCELLED',
  Delivered = 'DELIVERED',
  InDelivery = 'IN_DELIVERY'
}

/** A reward with dynamic pricing calculations */
export type RewardWithCalculations = {
  __typename?: 'RewardWithCalculations';
  availableQuantity: Scalars['Int']['output'];
  /** Whether the user's group can afford this reward (null if groupCoins not provided) */
  canAfford?: Maybe<Scalars['Boolean']['output']>;
  canBePurchased: Scalars['Boolean']['output'];
  /** Static cost percentage (1-100) */
  coinCostPercentage: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdById: Scalars['ID']['output'];
  /** Description */
  description: Scalars['String']['output'];
  /** Calculated dynamic coin cost based on trip points */
  dynamicCoinCost: Scalars['Int']['output'];
  /** Unique identifier */
  id: Scalars['ID']['output'];
  /** Array of image URLs */
  images: Array<Scalars['String']['output']>;
  isHidden: Scalars['Boolean']['output'];
  isInStock: Scalars['Boolean']['output'];
  /** Reward name */
  name: Scalars['String']['output'];
  /** Primary image */
  primaryImage?: Maybe<Scalars['String']['output']>;
  purchaseCount: Scalars['Int']['output'];
  /** Trip ID */
  tripId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** A paginated list of rewards with metadata */
export type RewardsConnection = {
  __typename?: 'RewardsConnection';
  /** Pagination metadata */
  pagination: RewardPagination;
  /** The rewards in this page */
  rewards: Array<RewardWithCalculations>;
};

/** How points are awarded for a challenge */
export enum ScoringCategory {
  JudgedStaff = 'JUDGED_STAFF',
  PeerVoting = 'PEER_VOTING',
  Speed = 'SPEED',
  Unlimited = 'UNLIMITED'
}

/** Input for sending mobile push notifications */
export type SendMobileNotificationsInput = {
  /** ID of the notification to send */
  notificationId: Scalars['ID']['input'];
};

/** Result of sending mobile push notifications */
export type SendMobileNotificationsPayload = {
  __typename?: 'SendMobileNotificationsPayload';
  /** Number of notifications that failed to send */
  failed: Scalars['Int']['output'];
  /** Number of notifications successfully sent */
  sent: Scalars['Int']['output'];
  /** Whether the send operation was successful */
  success: Scalars['Boolean']['output'];
  /** Total number of recipients targeted */
  total: Scalars['Int']['output'];
};

/** Input for pinning/unpinning an activity */
export type SetPinnedInput = {
  /** Activity ID */
  activityId: Scalars['ID']['input'];
  /** Whether to pin or unpin */
  isPinned: Scalars['Boolean']['input'];
};

/** Input for setting reward hidden status */
export type SetRewardHiddenInput = {
  /** ID of the reward */
  id: Scalars['ID']['input'];
  /** Whether the reward should be hidden */
  isHidden: Scalars['Boolean']['input'];
};

/** Result of setting reward hidden status */
export type SetRewardHiddenPayload = {
  __typename?: 'SetRewardHiddenPayload';
  /** The previous hidden status */
  previousHidden: Scalars['Boolean']['output'];
  /** The reward with updated hidden status */
  reward: Reward;
};

/** User information for location sharing */
export type SharingUserInfo = {
  __typename?: 'SharingUserInfo';
  /** User's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** User ID */
  id: Scalars['ID']['output'];
  /** User's last name */
  lastName?: Maybe<Scalars['String']['output']>;
};

/** Result of adding or removing a sharing user */
export type SharingUserPayload = {
  __typename?: 'SharingUserPayload';
  /** The location with updated sharing list */
  location: Location;
};

/** A sponsor for a trip with logo and display settings */
export type Sponsor = {
  __typename?: 'Sponsor';
  /** When the sponsor was created */
  createdAt: Scalars['DateTime']['output'];
  /** Sponsor description */
  description: Scalars['String']['output'];
  /** Whether the sponsor has custom logo sizing/positioning */
  hasLogoAdjustments: Scalars['Boolean']['output'];
  /** Logo height in pixels (for custom sizing) */
  height?: Maybe<Scalars['Int']['output']>;
  /** Unique identifier for the sponsor */
  id: Scalars['ID']['output'];
  /** Whether the sponsor is currently active */
  isActive: Scalars['Boolean']['output'];
  /** URL path to sponsor logo image */
  logoPath: Scalars['String']['output'];
  /** Sponsor name */
  name: Scalars['String']['output'];
  /** Horizontal offset in pixels */
  offsetX?: Maybe<Scalars['Int']['output']>;
  /** Vertical offset in pixels */
  offsetY?: Maybe<Scalars['Int']['output']>;
  /** When the sponsor was last updated */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** Result of listing sponsors */
export type SponsorListResult = {
  __typename?: 'SponsorListResult';
  /** List of sponsors */
  sponsors: Array<Sponsor>;
  /** Total number of sponsors matching the query */
  total: Scalars['Int']['output'];
};

/** Group information embedded in a submission */
export type SubmissionGroupInfo = {
  __typename?: 'SubmissionGroupInfo';
  /** Group description */
  description?: Maybe<Scalars['String']['output']>;
  /** Group ID */
  id: Scalars['ID']['output'];
  /** Group image URL */
  image?: Maybe<Scalars['String']['output']>;
  /** Group name */
  name: Scalars['String']['output'];
};

/** Field to order submissions by */
export enum SubmissionOrderBy {
  CreatedAt = 'createdAt',
  VoteScore = 'voteScore'
}

/** A report filed against a challenge submission */
export type SubmissionReport = {
  __typename?: 'SubmissionReport';
  /** When the report was created */
  createdAt: Scalars['DateTime']['output'];
  /** Additional details provided by the reporter */
  details?: Maybe<Scalars['String']['output']>;
  /** Whether the report has additional details */
  hasDetails: Scalars['Boolean']['output'];
  /** Unique identifier for the report */
  id: Scalars['ID']['output'];
  /** Reason for the report */
  reason: ReportReason;
  /** Human-readable display text for the reason */
  reasonDisplay: Scalars['String']['output'];
  /** Reporter information with user details */
  reporter: SubmissionReportReporterInfo;
  /** ID of the user who filed the report */
  reporterId: Scalars['ID']['output'];
  /** ID of the submission being reported */
  submissionId: Scalars['ID']['output'];
};

/** Result of creating a submission report */
export type SubmissionReportCreateResult = {
  __typename?: 'SubmissionReportCreateResult';
  /** When the report was created */
  createdAt: Scalars['DateTime']['output'];
  /** Additional details provided by the reporter */
  details?: Maybe<Scalars['String']['output']>;
  /** Whether the report has additional details */
  hasDetails: Scalars['Boolean']['output'];
  /** Unique identifier for the report */
  id: Scalars['ID']['output'];
  /** Reason for the report */
  reason: ReportReason;
  /** Human-readable display text for the reason */
  reasonDisplay: Scalars['String']['output'];
  /** Reporter information (null on create) */
  reporter?: Maybe<SubmissionReportReporterInfo>;
  /** ID of the user who filed the report */
  reporterId: Scalars['ID']['output'];
  /** ID of the submission being reported */
  submissionId: Scalars['ID']['output'];
};

/** Paginated list of submission reports */
export type SubmissionReportListResult = {
  __typename?: 'SubmissionReportListResult';
  /** List of reports */
  reports: Array<SubmissionReport>;
  /** Total number of reports (for pagination) */
  totalCount: Scalars['Int']['output'];
};

/** Reporter information with participant and user details */
export type SubmissionReportReporterInfo = {
  __typename?: 'SubmissionReportReporterInfo';
  /** Participant ID */
  id: Scalars['ID']['output'];
  /** User details of the reporter */
  user: SubmissionReportUserInfo;
};

/** User information for a reporter */
export type SubmissionReportUserInfo = {
  __typename?: 'SubmissionReportUserInfo';
  /** User's email address */
  email?: Maybe<Scalars['String']['output']>;
  /** User's first name */
  firstName: Scalars['String']['output'];
  /** Whether the user has an avatar image */
  hasAvatar: Scalars['Boolean']['output'];
  /** User ID */
  id: Scalars['ID']['output'];
  /** User's last name */
  lastName: Scalars['String']['output'];
};

/** Reviewer information embedded in a submission */
export type SubmissionReviewerInfo = {
  __typename?: 'SubmissionReviewerInfo';
  /** Reviewer's email */
  email?: Maybe<Scalars['String']['output']>;
  /** Reviewer's first name */
  firstName: Scalars['String']['output'];
  /** Reviewer user ID */
  id: Scalars['ID']['output'];
  /** Reviewer's last name */
  lastName: Scalars['String']['output'];
};

/** The review status of a challenge submission */
export enum SubmissionStatus {
  Approved = 'APPROVED',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

/** Type of submission required for a challenge */
export enum SubmissionType {
  Image = 'IMAGE',
  ImageLocation = 'IMAGE_LOCATION',
  Location = 'LOCATION',
  MultiImage = 'MULTI_IMAGE',
  QrCode = 'QR_CODE',
  Text = 'TEXT',
  Video = 'VIDEO'
}

/** Vote statistics for a challenge submission */
export type SubmissionVoteCount = {
  __typename?: 'SubmissionVoteCount';
  /** ID of the submission */
  submissionId: Scalars['ID']['output'];
  /** Number of votes received */
  voteCount: Scalars['Int']['output'];
  /** Calculated vote score (weighted) */
  voteScore: Scalars['Float']['output'];
};

/** Input for submitting a single vote */
export type SubmitVoteInput = {
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
  /** Normalized weight for weighted voting (optional) */
  normalizedWeight?: InputMaybe<Scalars['Float']['input']>;
  /** ID of the submission being voted for */
  submissionId: Scalars['ID']['input'];
  /** ID of the trip (for participant validation) */
  tripId: Scalars['ID']['input'];
  /** Points to award (optional) */
  votePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Voting position (1, 2, or 3) */
  votePosition: Scalars['Int']['input'];
};

/** Result of submitting a single vote */
export type SubmitVotePayload = {
  __typename?: 'SubmitVotePayload';
  /** The submitted vote */
  vote: ChallengeVote;
};

/** Input for submitting multiple votes at once */
export type SubmitVotesInput = {
  /** ID of the challenge */
  challengeId: Scalars['ID']['input'];
  /** ID of the trip (for participant validation) */
  tripId: Scalars['ID']['input'];
  /** List of votes to submit (at least 1 required) */
  votes: Array<VoteInput>;
};

/** Result of submitting multiple votes */
export type SubmitVotesPayload = {
  __typename?: 'SubmitVotesPayload';
  /** Total number of votes cast */
  totalVotesCast: Scalars['Int']['output'];
  /** The submitted votes */
  votes: Array<ChallengeVote>;
};

/** Root subscription type for real-time updates */
export type Subscription = {
  __typename?: 'Subscription';
  /** Subscribe to new activities in a trip feed */
  activityFeedUpdated: Activity;
  /** Subscribe to voting progress updates for a challenge */
  challengeVotingUpdated: VotingProgressSubscription;
  /** Subscribe to location updates from specific users */
  locationUpdated: FriendLocationSubscription;
};


/** Root subscription type for real-time updates */
export type SubscriptionActivityFeedUpdatedArgs = {
  tripId: Scalars['ID']['input'];
};


/** Root subscription type for real-time updates */
export type SubscriptionChallengeVotingUpdatedArgs = {
  challengeId: Scalars['ID']['input'];
};


/** Root subscription type for real-time updates */
export type SubscriptionLocationUpdatedArgs = {
  userIds: Array<Scalars['ID']['input']>;
};

/** Input for toggling a reaction on an activity */
export type ToggleReactionInput = {
  /** Activity ID */
  activityId: Scalars['ID']['input'];
  /** Type of reaction */
  reactionType: ReactionType;
};

/** Result of toggling a reaction */
export type ToggleReactionResult = {
  __typename?: 'ToggleReactionResult';
  /** Activity ID */
  activityId: Scalars['ID']['output'];
  /** Whether reaction is now active */
  isActive: Scalars['Boolean']['output'];
  /** Reaction type that was toggled */
  reactionType: ReactionType;
  /** Updated reactions summary */
  reactionsSummary: ReactionsSummary;
};

/** Result of toggling schedule active status */
export type ToggleScheduleActivePayload = {
  __typename?: 'ToggleScheduleActivePayload';
  /** The schedule with toggled status */
  schedule: NotificationSchedule;
};

/** Total available points for a trip */
export type TotalAvailablePointsPayload = {
  __typename?: 'TotalAvailablePointsPayload';
  /** Total available points in the trip */
  totalPoints: Scalars['Int']['output'];
};

/** Input for tracking delivery completion */
export type TrackDeliveryCompleteInput = {
  /** Error details if any failures occurred */
  errors?: InputMaybe<Scalars['String']['input']>;
  /** Number of failed deliveries */
  failureCount: Scalars['Int']['input'];
  /** ID of the notification that was delivered */
  notificationId: Scalars['ID']['input'];
  /** Number of successful deliveries */
  successCount: Scalars['Int']['input'];
  /** Total number of recipients */
  totalRecipients: Scalars['Int']['input'];
};

/** Result of tracking delivery completion */
export type TrackDeliveryCompletePayload = {
  __typename?: 'TrackDeliveryCompletePayload';
  /** Whether the tracking was recorded successfully */
  success: Scalars['Boolean']['output'];
};

/** Input for tracking delivery failure */
export type TrackDeliveryFailureInput = {
  /** Error message describing the failure */
  error: Scalars['String']['input'];
  /** ID of the notification that failed */
  notificationId: Scalars['ID']['input'];
};

/** Result of tracking delivery failure */
export type TrackDeliveryFailurePayload = {
  __typename?: 'TrackDeliveryFailurePayload';
  /** Whether the failure was recorded successfully */
  success: Scalars['Boolean']['output'];
};

/** Input for tracking delivery start */
export type TrackDeliveryStartInput = {
  /** ID of the notification being delivered */
  notificationId: Scalars['ID']['input'];
};

/** Result of tracking delivery start */
export type TrackDeliveryStartPayload = {
  __typename?: 'TrackDeliveryStartPayload';
  /** Whether the tracking was recorded successfully */
  success: Scalars['Boolean']['output'];
};

/** A trip/event in the application */
export type Trip = {
  __typename?: 'Trip';
  /** Path to background image */
  backgroundImagePath?: Maybe<Scalars['String']['output']>;
  /** When the trip was created */
  createdAt: Scalars['DateTime']['output'];
  /** Trip description */
  description?: Maybe<Scalars['String']['output']>;
  /** When the trip ends */
  endDate: Scalars['DateTime']['output'];
  /** Unique trip identifier */
  id: Scalars['ID']['output'];
  /** Whether the trip is in active status */
  isActive: Scalars['Boolean']['output'];
  /** Whether the trip is cancelled */
  isCancelled: Scalars['Boolean']['output'];
  /** Whether the trip is completed */
  isCompleted: Scalars['Boolean']['output'];
  /** Whether the trip is in planning status */
  isPlanning: Scalars['Boolean']['output'];
  /** Trip name */
  name: Scalars['String']['output'];
  /** When the trip starts */
  startDate: Scalars['DateTime']['output'];
  /** Trip status */
  status: TripStatus;
  /** When the trip was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Input for fetching a trip by ID */
export type TripByIdInput = {
  /** Trip ID to fetch */
  id: Scalars['ID']['input'];
};

/** Result of fetching a list of trips */
export type TripListResult = {
  __typename?: 'TripListResult';
  /** Pagination information */
  pagination: TripPaginationInfo;
  /** List of trips */
  trips: Array<Trip>;
};

/** Pagination information for trip list */
export type TripPaginationInfo = {
  __typename?: 'TripPaginationInfo';
  /** Whether there are more items */
  hasMore: Scalars['Boolean']['output'];
  /** Number of items per page */
  limit: Scalars['Int']['output'];
  /** Number of items skipped */
  offset: Scalars['Int']['output'];
  /** Total number of trips */
  total: Scalars['Int']['output'];
};

/** Pagination input for trip queries */
export type TripPaginationInput = {
  /** Maximum number of trips to return (1-100) */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Number of trips to skip */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Status of a trip */
export enum TripStatus {
  Active = 'ACTIVE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Planning = 'PLANNING'
}

/** Input for unhiding an activity */
export type UnhideActivityInput = {
  /** Activity ID to unhide */
  activityId: Scalars['ID']['input'];
};

/** Input for unlinking a sponsor from a trip */
export type UnlinkSponsorFromTripInput = {
  /** ID of the sponsor to unlink */
  sponsorId: Scalars['ID']['input'];
  /** ID of the trip to unlink from */
  tripId: Scalars['ID']['input'];
};

/** Result of unlinking a sponsor from a trip */
export type UnlinkSponsorFromTripPayload = {
  __typename?: 'UnlinkSponsorFromTripPayload';
  /** ID of the sponsor */
  sponsorId: Scalars['ID']['output'];
  /** ID of the trip */
  tripId: Scalars['ID']['output'];
  /** Whether the unlink was successful */
  unlinked: Scalars['Boolean']['output'];
};

/** Input for updating an activity */
export type UpdateActivityInput = {
  /** Activity ID to update */
  activityId: Scalars['ID']['input'];
  /** New description (null to clear) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Pin/unpin the activity */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** New title */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating an existing challenge */
export type UpdateChallengeInput = {
  /** New auto-approve setting */
  autoApprove?: InputMaybe<Scalars['Boolean']['input']>;
  /** New base points (0-10000) */
  basePoints?: InputMaybe<Scalars['Int']['input']>;
  /** New description (max 2000 characters) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** New end time */
  endTime?: InputMaybe<Scalars['DateTime']['input']>;
  /** New expected value */
  expectedValue?: InputMaybe<Scalars['String']['input']>;
  /** New 1st place bonus points */
  firstPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  /** ID of the challenge to update */
  id: Scalars['ID']['input'];
  /** New image URL */
  image?: InputMaybe<Scalars['String']['input']>;
  /** New challenge name (1-200 characters) */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New 2nd place bonus points */
  secondPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  /** New start time */
  startTime?: InputMaybe<Scalars['DateTime']['input']>;
  /** New target latitude */
  targetLatitude?: InputMaybe<Scalars['Float']['input']>;
  /** New target longitude */
  targetLongitude?: InputMaybe<Scalars['Float']['input']>;
  /** New 3rd place bonus points */
  thirdPlacePoints?: InputMaybe<Scalars['Int']['input']>;
  /** ID of the trip (for validation) */
  tripId: Scalars['ID']['input'];
};

/** Result of updating a challenge */
export type UpdateChallengePayload = {
  __typename?: 'UpdateChallengePayload';
  /** The updated challenge */
  challenge: ChallengeSummary;
};

/** Input for updating a challenge's status */
export type UpdateChallengeStatusInput = {
  /** ID of the challenge */
  id: Scalars['ID']['input'];
  /** New status to transition to */
  newStatus: ChallengeStatus;
  /** ID of the trip (for validation) */
  tripId: Scalars['ID']['input'];
};

/** Result of updating a challenge's status */
export type UpdateChallengeStatusPayload = {
  __typename?: 'UpdateChallengeStatusPayload';
  /** The challenge with updated status */
  challenge: ChallengeSummary;
  /** The previous status before the update */
  previousStatus: ChallengeStatus;
};

/** Input for updating an existing group */
export type UpdateGroupInput = {
  /** New description (null to clear, max 500 characters) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** ID of the group to update */
  id: Scalars['ID']['input'];
  /** New image URL (null to clear) */
  image?: InputMaybe<Scalars['String']['input']>;
  /** New group name (1-100 characters) */
  name?: InputMaybe<Scalars['String']['input']>;
  /** ID of the trip (for validation) */
  tripId: Scalars['ID']['input'];
};

/** Result of updating a group */
export type UpdateGroupPayload = {
  __typename?: 'UpdateGroupPayload';
  /** The updated group */
  group: Group;
};

/** Input for updating the last run timestamp */
export type UpdateLastRunInput = {
  /** ID of the schedule */
  id: Scalars['ID']['input'];
  /** When the schedule last ran */
  lastRunAt: Scalars['DateTime']['input'];
  /** Error message if the run failed */
  lastRunError?: InputMaybe<Scalars['String']['input']>;
  /** Status of the last run */
  lastRunStatus: LastRunStatus;
};

/** Result of updating the last run timestamp */
export type UpdateLastRunPayload = {
  __typename?: 'UpdateLastRunPayload';
  /** The schedule with updated last run timestamp */
  schedule: NotificationSchedule;
};

/** Input for updating a user's location */
export type UpdateLocationInput = {
  /** Accuracy in meters */
  accuracy?: InputMaybe<Scalars['Float']['input']>;
  /** Altitude in meters */
  altitude?: InputMaybe<Scalars['Float']['input']>;
  /** Altitude accuracy in meters */
  altitudeAccuracy?: InputMaybe<Scalars['Float']['input']>;
  /** Heading (0-360 degrees) */
  heading?: InputMaybe<Scalars['Float']['input']>;
  /** Latitude (-90 to 90) */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** Longitude (-180 to 180) */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  /** Speed in meters per second */
  speed?: InputMaybe<Scalars['Float']['input']>;
};

/** Result of updating a location */
export type UpdateLocationPayload = {
  __typename?: 'UpdateLocationPayload';
  /** The updated location */
  location: Location;
};

/** Input for updating own purchase status (group leader only) */
export type UpdateMyPurchaseStatusInput = {
  /** ID of the purchase to update */
  purchaseId: Scalars['ID']['input'];
  /** New status (IN_DELIVERY or CANCELLED only) */
  status: RewardPurchaseStatus;
};

/** Result of updating own purchase status (group leader only) */
export type UpdateMyPurchaseStatusPayload = {
  __typename?: 'UpdateMyPurchaseStatusPayload';
  /** The previous status before the update */
  previousStatus: RewardPurchaseStatus;
  /** The updated purchase record */
  purchase: RewardPurchase;
};

/** Input for updating a notification */
export type UpdateNotificationInput = {
  /** New body content */
  body?: InputMaybe<Scalars['String']['input']>;
  /** ID of notification to update */
  notificationId: Scalars['ID']['input'];
  /** New priority */
  priority?: InputMaybe<NotificationPriority>;
  /** New title */
  title?: InputMaybe<Scalars['String']['input']>;
  /** New URL (null to clear) */
  url?: InputMaybe<Scalars['String']['input']>;
};

/** Result of updating a notification */
export type UpdateNotificationResult = {
  __typename?: 'UpdateNotificationResult';
  /** The updated notification */
  notification: Notification;
};

/** Input for updating an existing notification schedule */
export type UpdateNotificationScheduleInput = {
  /** New end date */
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** New scheduled hour (0-23) */
  hour?: InputMaybe<Scalars['Int']['input']>;
  /** ID of the schedule to update */
  id: Scalars['ID']['input'];
  /** New active status */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** New scheduled minute (0-59) */
  minute?: InputMaybe<Scalars['Int']['input']>;
  /** New schedule name (1-100 characters) */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New notification body (max 2000 chars) */
  notificationBody?: InputMaybe<Scalars['String']['input']>;
  /** New notification title (max 200 chars) */
  notificationTitle?: InputMaybe<Scalars['String']['input']>;
  /** New notification URL (max 500 chars) */
  notificationUrl?: InputMaybe<Scalars['String']['input']>;
  /** New start date */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Result of updating a notification schedule */
export type UpdateNotificationSchedulePayload = {
  __typename?: 'UpdateNotificationSchedulePayload';
  /** The updated schedule */
  schedule: NotificationSchedule;
};

/** Input for updating notification status */
export type UpdateNotificationStatusInput = {
  /** New status to set */
  newStatus: NotificationStatus;
  /** ID of notification to update */
  notificationId: Scalars['ID']['input'];
};

/** Result of updating notification status */
export type UpdateNotificationStatusResult = {
  __typename?: 'UpdateNotificationStatusResult';
  /** New status */
  newStatus: NotificationStatus;
  /** The notification with updated status */
  notification: Notification;
  /** Previous status */
  previousStatus: NotificationStatus;
};

/** Input for updating a purchase status (admin/staff only) */
export type UpdatePurchaseStatusInput = {
  /** Collection method (required for ACCEPTED status) */
  collectionMethod?: InputMaybe<Scalars['String']['input']>;
  /** ID of the purchase to update */
  purchaseId: Scalars['ID']['input'];
  /** New status to transition to */
  status: RewardPurchaseStatus;
};

/** Result of updating a purchase status */
export type UpdatePurchaseStatusPayload = {
  __typename?: 'UpdatePurchaseStatusPayload';
  /** The previous status before the update */
  previousStatus: RewardPurchaseStatus;
  /** The updated purchase record */
  purchase: RewardPurchase;
  /** Whether coins were refunded (only when cancelling) */
  refunded: Scalars['Boolean']['output'];
};

/** Input for updating an existing reward */
export type UpdateRewardInput = {
  /** New available quantity (0-1000000) */
  availableQuantity?: InputMaybe<Scalars['Int']['input']>;
  /** New percentage of total trip points (1-100) */
  coinCost?: InputMaybe<Scalars['Int']['input']>;
  /** New description (max 2000 characters) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** ID of the reward to update */
  id: Scalars['ID']['input'];
  /** New array of image URLs (max 10) */
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  /** New reward name (1-200 characters) */
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Result of updating a reward */
export type UpdateRewardPayload = {
  __typename?: 'UpdateRewardPayload';
  /** The updated reward */
  reward: Reward;
};

/** Input for updating location sharing settings */
export type UpdateSharingSettingsInput = {
  /** Whether to enable location sharing */
  isSharingLocation: Scalars['Boolean']['input'];
  /** IDs of users to share location with */
  userIdsToShareWith?: InputMaybe<Array<Scalars['ID']['input']>>;
};

/** Result of updating sharing settings */
export type UpdateSharingSettingsPayload = {
  __typename?: 'UpdateSharingSettingsPayload';
  /** The updated sharing settings */
  settings: LocationSharingSettings;
};

/** Input for updating an existing sponsor */
export type UpdateSponsorInput = {
  /** New sponsor description (1-2000 characters) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** New logo height in pixels (null to clear) */
  height?: InputMaybe<Scalars['Int']['input']>;
  /** ID of the sponsor to update */
  id: Scalars['ID']['input'];
  /** New active status */
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  /** New logo URL path */
  logoPath?: InputMaybe<Scalars['String']['input']>;
  /** New sponsor name (1-200 characters) */
  name?: InputMaybe<Scalars['String']['input']>;
  /** New horizontal offset in pixels (null to clear) */
  offsetX?: InputMaybe<Scalars['Int']['input']>;
  /** New vertical offset in pixels (null to clear) */
  offsetY?: InputMaybe<Scalars['Int']['input']>;
};

/** Result of updating a sponsor */
export type UpdateSponsorPayload = {
  __typename?: 'UpdateSponsorPayload';
  /** The updated sponsor */
  sponsor: Sponsor;
};

/** Input for updating a challenge submission */
export type UpdateSubmissionInput = {
  /** Points to award (for APPROVE action) */
  awardedPoints?: InputMaybe<Scalars['Int']['input']>;
  /** Bonus points to award */
  bonusPoints?: InputMaybe<Scalars['Int']['input']>;
  /** New image IDs (replaces existing) */
  imageIds?: InputMaybe<Array<Scalars['String']['input']>>;
  /** New latitude (null to remove) */
  latitude?: InputMaybe<Scalars['Float']['input']>;
  /** New longitude (null to remove) */
  longitude?: InputMaybe<Scalars['Float']['input']>;
  /** Ranking position 1-3 (for APPROVE action, null to clear) */
  ranking?: InputMaybe<Scalars['Int']['input']>;
  /** Reason for rejection (required for REJECT) */
  rejectionReason?: InputMaybe<Scalars['String']['input']>;
  /** Review action (APPROVE or REJECT) */
  reviewAction?: InputMaybe<ReviewAction>;
  /** ID of reviewer (required for review actions) */
  reviewedById?: InputMaybe<Scalars['ID']['input']>;
  /** ID of the submission to update */
  submissionId: Scalars['ID']['input'];
  /** New text content (null to remove) */
  textContent?: InputMaybe<Scalars['String']['input']>;
  /** New video ID (null to remove) */
  videoId?: InputMaybe<Scalars['String']['input']>;
};

/** Input for updating a trip */
export type UpdateTripInput = {
  /** URL to background image */
  backgroundImagePath?: InputMaybe<Scalars['String']['input']>;
  /** Trip description */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Trip end date */
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  /** Trip ID to update */
  id: Scalars['ID']['input'];
  /** Trip name */
  name?: InputMaybe<Scalars['String']['input']>;
  /** Trip start date */
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
};

/** Input for updating an existing user */
export type UpdateUserInput = {
  /** User's first name (2-100 characters, no digits) */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Whether the user has an avatar */
  hasAvatar?: InputMaybe<Scalars['Boolean']['input']>;
  /** User's last name (2-100 characters, no digits) */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** ID of the user to update */
  userId: Scalars['ID']['input'];
};

/** Result of creating a signed upload URL for resumable uploads */
export type UploadUrlResult = {
  __typename?: 'UploadUrlResult';
  /** The storage bucket name */
  bucket: Scalars['String']['output'];
  /** The path to the object within the bucket */
  objectPath: Scalars['String']['output'];
  /** The resumable upload endpoint URL */
  resumableUrl: Scalars['String']['output'];
  /** The full storage path (bucket/path) */
  storagePath: Scalars['String']['output'];
  /** The signed upload token (X-Ups-Authorization header) */
  token: Scalars['String']['output'];
};

/** A user in the Mirai App system */
export type User = {
  __typename?: 'User';
  /** External authentication provider user ID */
  authUserId: Scalars['String']['output'];
  /** When the user account was created */
  createdAt: Scalars['DateTime']['output'];
  /** User's first name */
  firstName: Scalars['String']['output'];
  /** Computed full name (firstName + lastName) */
  fullName: Scalars['String']['output'];
  /** Whether the user has uploaded an avatar image */
  hasAvatar: Scalars['Boolean']['output'];
  /** Unique identifier for the user (UUID) */
  id: Scalars['ID']['output'];
  /** Whether the user has admin privileges */
  isAdmin: Scalars['Boolean']['output'];
  /** Whether the user has moderator privileges or higher */
  isModerator: Scalars['Boolean']['output'];
  /** User's last name */
  lastName: Scalars['String']['output'];
  /** When the user was last active (null if never seen) */
  lastSeenOn?: Maybe<Scalars['DateTime']['output']>;
  /** User's role in the system */
  role: UserRole;
};

/** Result of creating a new user */
export type UserCreateResult = {
  __typename?: 'UserCreateResult';
  /** External authentication provider user ID */
  authUserId: Scalars['String']['output'];
  /** When the user account was created */
  createdAt: Scalars['DateTime']['output'];
  /** User's first name */
  firstName: Scalars['String']['output'];
  /** Computed full name (firstName + lastName) */
  fullName: Scalars['String']['output'];
  /** Whether the user has uploaded an avatar image */
  hasAvatar: Scalars['Boolean']['output'];
  /** Unique identifier for the user (UUID) */
  id: Scalars['ID']['output'];
  /** User's last name */
  lastName: Scalars['String']['output'];
  /** User's role in the system */
  role: UserRole;
};

/** Input for fetching a user by ID */
export type UserInput = {
  /** Unique user ID */
  id: Scalars['ID']['input'];
};

/** User roles in the system */
export enum UserRole {
  Admin = 'ADMIN',
  Moderator = 'MODERATOR',
  Service = 'SERVICE',
  User = 'USER'
}

/** Result of updating a user */
export type UserUpdateResult = {
  __typename?: 'UserUpdateResult';
  /** External authentication provider user ID */
  authUserId: Scalars['String']['output'];
  /** User's first name */
  firstName: Scalars['String']['output'];
  /** Computed full name (firstName + lastName) */
  fullName: Scalars['String']['output'];
  /** Whether the user has uploaded an avatar image */
  hasAvatar: Scalars['Boolean']['output'];
  /** Unique identifier for the user (UUID) */
  id: Scalars['ID']['output'];
  /** User's last name */
  lastName: Scalars['String']['output'];
  /** User's role in the system */
  role: UserRole;
  /** When the user was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

/** Input for a single vote in a batch submission */
export type VoteInput = {
  /** Normalized weight for weighted voting (optional) */
  normalizedWeight?: InputMaybe<Scalars['Float']['input']>;
  /** ID of the submission being voted for */
  submissionId: Scalars['ID']['input'];
  /** Points to award (optional) */
  votePoints?: InputMaybe<Scalars['Int']['input']>;
  /** Voting position (1, 2, or 3) */
  votePosition: Scalars['Int']['input'];
};

/** Current voting progress for a challenge */
export type VotingProgress = {
  __typename?: 'VotingProgress';
  /** ID of the challenge */
  challengeId: Scalars['ID']['output'];
  /** Vote statistics per submission (sorted by score) */
  submissionStats: Array<SubmissionVoteCount>;
  /** Total number of votes cast across all submissions */
  totalVotes: Scalars['Int']['output'];
};

/** Vote count for a specific submission */
export type VotingProgressSubmission = {
  __typename?: 'VotingProgressSubmission';
  /** Current rank based on votes */
  rank?: Maybe<Scalars['Int']['output']>;
  /** Submission ID */
  submissionId: Scalars['ID']['output'];
  /** Number of votes for this submission */
  voteCount: Scalars['Int']['output'];
  /** Calculated vote score */
  voteScore: Scalars['Float']['output'];
};

/** Real-time voting progress for a challenge */
export type VotingProgressSubscription = {
  __typename?: 'VotingProgressSubscription';
  /** Challenge ID */
  challengeId: Scalars['ID']['output'];
  /** When voting ends */
  endsAt?: Maybe<Scalars['DateTime']['output']>;
  /** Whether voting is complete */
  isComplete: Scalars['Boolean']['output'];
  /** Vote counts per submission */
  submissions: Array<VotingProgressSubmission>;
  /** Total number of votes cast */
  totalVotes: Scalars['Int']['output'];
  /** Number of unique voters */
  uniqueVoters: Scalars['Int']['output'];
  /** When this progress was last updated */
  updatedAt: Scalars['DateTime']['output'];
};

export type UserFieldsFragment = { __typename?: 'User', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, createdAt: any, lastSeenOn?: any | null, isAdmin: boolean, isModerator: boolean };

export type UserSummaryFieldsFragment = { __typename?: 'User', id: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean };

export type UserCreateResultFieldsFragment = { __typename?: 'UserCreateResult', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, createdAt: any };

export type UserUpdateResultFieldsFragment = { __typename?: 'UserUpdateResult', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, updatedAt: any };

export type TripFieldsFragment = { __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any };

export type TripSummaryFieldsFragment = { __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, status: TripStatus };

export type GroupFieldsFragment = { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any };

export type GroupSummaryFieldsFragment = { __typename?: 'GroupSummary', id: string, name: string };

export type GroupRankingFieldsFragment = { __typename?: 'GroupRanking', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any };

export type ActivityFieldsFragment = { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null };

export type ActivityAdminFieldsFragment = { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string };

export type HiddenActivityFieldsFragment = { __typename?: 'HiddenActivityResult', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, hiddenAt: any, hiddenReason?: string | null, updatedAt: any };

export type ChallengeFieldsFragment = { __typename?: 'Challenge', id: string, tripId: string, name: string, description?: string | null, image?: string | null, submissionType: SubmissionType, scoringCategory: ScoringCategory, basePoints: number, firstPlacePoints?: number | null, secondPlacePoints?: number | null, thirdPlacePoints?: number | null, isRecurring: boolean, dailyStartTime?: string | null, dailyEndTime?: string | null, status: ChallengeStatus, startTime?: any | null, endTime?: any | null, targetLatitude?: number | null, targetLongitude?: number | null, expectedValue?: string | null, autoApprove: boolean, isActive: boolean, isOpenForSubmission: boolean, hasVotingPhase: boolean, requiresLocation: boolean, requiresQRCode: boolean, createdAt: any };

export type ChallengeSummaryFieldsFragment = { __typename?: 'ChallengeSummary', id: string, tripId: string, name: string, description?: string | null, submissionType: SubmissionType, scoringCategory: ScoringCategory, basePoints: number, status: ChallengeStatus, createdAt: any };

export type ChallengeSubmissionFieldsFragment = { __typename?: 'ChallengeSubmission', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null };

export type ChallengeSubmissionCreateResultFieldsFragment = { __typename?: 'ChallengeSubmissionCreateResult', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null };

export type ChallengeSubmissionUpdateResultFieldsFragment = { __typename?: 'ChallengeSubmissionUpdateResult', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null };

export type SubmissionGroupFieldsFragment = { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null };

export type SubmissionReviewerFieldsFragment = { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null };

export type ChallengeVoteFieldsFragment = { __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any };

export type ChallengeVoteListFieldsFragment = { __typename?: 'ChallengeVoteList', totalVotes: number, votes: Array<{ __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any }> };

export type ChallengeVoteAdminListFieldsFragment = { __typename?: 'ChallengeVoteAdminList', totalVotes: number, uniqueVoters: number, votes: Array<{ __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any }> };

export type LocationFieldsFragment = { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> };

export type LocationSummaryFieldsFragment = { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, isSharingLocation: boolean, timestamp: any };

export type FriendLocationFieldsFragment = { __typename?: 'FriendLocation', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, distanceKm?: number | null, timestamp: any };

export type LocationSharingSettingsFieldsFragment = { __typename?: 'LocationSharingSettings', isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> };

export type SharingUserFieldsFragment = { __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null };

export type NotificationFieldsFragment = { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null };

export type NotificationWithCreatorFieldsFragment = { __typename?: 'NotificationInfo', id: string, title: string, body: string, url?: string | null, tripId?: string | null, createdAt: any, createdBy?: { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null } | null };

export type NotificationCreatorFieldsFragment = { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null };

export type NotificationScheduleFieldsFragment = { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any };

export type NotificationScheduleSummaryFieldsFragment = { __typename?: 'NotificationScheduleSummary', id: string, name: string, notificationType: NotificationScheduleType, hour: number, minute: number, isActive: boolean, startDate: any, endDate: any, tripId?: string | null };

export type NotificationDeliveryFieldsFragment = { __typename?: 'NotificationDelivery', id: string, notificationId: string, scheduleId?: string | null, tripId: string, status: DeliveryStatus, deliveryStartedAt: any, deliveryCompletedAt?: any | null, totalRecipients: number, successCount: number, failureCount: number, errorLog?: string | null, createdAt: any, updatedAt: any, notification?: { __typename?: 'NotificationInfo', id: string, title: string, body: string, url?: string | null, tripId?: string | null, createdAt: any, createdBy?: { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null } | null } | null };

export type ExecutionHistoryEntryFieldsFragment = { __typename?: 'ExecutionHistoryEntry', id: string, executedAt: any, notification?: { __typename?: 'ExecutionHistoryNotification', id: string, title: string, body: string, createdAt: any } | null };

export type ExecutionHistoryNotificationFieldsFragment = { __typename?: 'ExecutionHistoryNotification', id: string, title: string, body: string, createdAt: any };

export type SponsorFieldsFragment = { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null };

export type CoinTransactionFieldsFragment = { __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null };

export type CoinTransactionGroupFieldsFragment = { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number };

export type CoinTransactionAdminFieldsFragment = { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string };

export type CoinTransactionResultFieldsFragment = { __typename?: 'CoinTransactionResult', id: string, amount: number, groupId: string, adminId: string, createdAt: any, transaction: { __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null } };

export type RewardFieldsFragment = { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any };

export type RewardWithCalculationsFieldsFragment = { __typename?: 'RewardWithCalculations', id: string, name: string, description: string, coinCostPercentage: number, dynamicCoinCost: number, canAfford?: boolean | null, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any };

export type RewardPurchaseFieldsFragment = { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any };

export type SubmissionReportFieldsFragment = { __typename?: 'SubmissionReport', id: string, submissionId: string, reporterId: string, reason: ReportReason, reasonDisplay: string, details?: string | null, hasDetails: boolean, createdAt: any, reporter: { __typename?: 'SubmissionReportReporterInfo', id: string, user: { __typename?: 'SubmissionReportUserInfo', id: string, firstName: string, lastName: string, email?: string | null, hasAvatar: boolean } } };

export type SubmissionReportCreateResultFieldsFragment = { __typename?: 'SubmissionReportCreateResult', id: string, submissionId: string, reporterId: string, reason: ReportReason, reasonDisplay: string, details?: string | null, hasDetails: boolean, createdAt: any };

export type SubmissionReportReporterFieldsFragment = { __typename?: 'SubmissionReportReporterInfo', id: string, user: { __typename?: 'SubmissionReportUserInfo', id: string, firstName: string, lastName: string, email?: string | null, hasAvatar: boolean } };

export type SubmissionReportUserFieldsFragment = { __typename?: 'SubmissionReportUserInfo', id: string, firstName: string, lastName: string, email?: string | null, hasAvatar: boolean };

export type PaginationInfoFieldsFragment = { __typename?: 'PaginationInfo', hasMore: boolean, pageSize: number };

export type OffsetPaginationFieldsFragment = { __typename?: 'GroupPagination', hasMore: boolean, limit: number, offset: number, total: number };

export type TripPaginationInfoFieldsFragment = { __typename?: 'TripPaginationInfo', hasMore: boolean, limit: number, offset: number, total: number };

export type NotificationPaginationInfoFieldsFragment = { __typename?: 'NotificationPaginationInfo', page: number, pageSize: number, total: number, totalPages: number };

export type NotificationOffsetPaginationInfoFieldsFragment = { __typename?: 'NotificationOffsetPaginationInfo', hasMore: boolean, limit: number, offset: number, total: number };

export type CoinTransactionPaginationFieldsFragment = { __typename?: 'CoinTransactionPagination', hasMore: boolean, limit: number, offset: number, total: number };

export type RewardPaginationFieldsFragment = { __typename?: 'RewardPagination', hasMore: boolean, limit: number, offset: number, total: number };

export type NotificationSchedulePaginationFieldsFragment = { __typename?: 'NotificationSchedulePagination', hasMore: boolean, limit: number, offset: number, total: number };

export type DeliveryPaginationFieldsFragment = { __typename?: 'DeliveryPagination', limit: number, offset: number, total: number };

export type ModerationPaginationInfoFieldsFragment = { __typename?: 'ModerationPaginationInfo', hasMore: boolean, page: number, pageSize: number, total: number, totalPages: number };

export type ActivityCursorFieldsFragment = { __typename?: 'ActivityCursor', id: string, createdAt: any, isPinned: boolean };

export type ActivityFeedResultFieldsFragment = { __typename?: 'ActivityFeedResult', activities: Array<{ __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null }>, nextCursor?: { __typename?: 'ActivityCursor', id: string, createdAt: any, isPinned: boolean } | null, pagination: { __typename?: 'PaginationInfo', hasMore: boolean, pageSize: number } };

export type ActivityFeedModerationResultFieldsFragment = { __typename?: 'ActivityFeedModerationResult', activities: Array<{ __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null }>, pagination: { __typename?: 'ModerationPaginationInfo', hasMore: boolean, page: number, pageSize: number, total: number, totalPages: number } };

export type GroupsConnectionFieldsFragment = { __typename?: 'GroupsConnection', groups: Array<{ __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'GroupPagination', hasMore: boolean, limit: number, offset: number, total: number } };

export type CoinTransactionsConnectionFieldsFragment = { __typename?: 'CoinTransactionsConnection', transactions: Array<{ __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null }>, pagination: { __typename?: 'CoinTransactionPagination', hasMore: boolean, limit: number, offset: number, total: number } };

export type RewardsConnectionFieldsFragment = { __typename?: 'RewardsConnection', rewards: Array<{ __typename?: 'RewardWithCalculations', id: string, name: string, description: string, coinCostPercentage: number, dynamicCoinCost: number, canAfford?: boolean | null, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'RewardPagination', hasMore: boolean, limit: number, offset: number, total: number } };

export type PurchaseHistoryConnectionFieldsFragment = { __typename?: 'PurchaseHistoryConnection', purchases: Array<{ __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any }>, pagination: { __typename?: 'RewardPagination', hasMore: boolean, limit: number, offset: number, total: number } };

export type NotificationSchedulesConnectionFieldsFragment = { __typename?: 'NotificationSchedulesConnection', schedules: Array<{ __typename?: 'NotificationScheduleSummary', id: string, name: string, notificationType: NotificationScheduleType, hour: number, minute: number, isActive: boolean, startDate: any, endDate: any, tripId?: string | null }>, pagination: { __typename?: 'NotificationSchedulePagination', hasMore: boolean, limit: number, offset: number, total: number } };

export type NotificationDeliveryListResultFieldsFragment = { __typename?: 'NotificationDeliveryListResult', deliveries: Array<{ __typename?: 'NotificationDelivery', id: string, notificationId: string, scheduleId?: string | null, tripId: string, status: DeliveryStatus, deliveryStartedAt: any, deliveryCompletedAt?: any | null, totalRecipients: number, successCount: number, failureCount: number, errorLog?: string | null, createdAt: any, updatedAt: any, notification?: { __typename?: 'NotificationInfo', id: string, title: string, body: string, url?: string | null, tripId?: string | null, createdAt: any, createdBy?: { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null } | null } | null }>, pagination: { __typename?: 'DeliveryPagination', limit: number, offset: number, total: number } };

export type ChallengeSubmissionListResultFieldsFragment = { __typename?: 'ChallengeSubmissionListResult', totalCount: number, submissions: Array<{ __typename?: 'ChallengeSubmission', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null }> };

export type SubmissionReportListResultFieldsFragment = { __typename?: 'SubmissionReportListResult', totalCount: number, reports: Array<{ __typename?: 'SubmissionReport', id: string, submissionId: string, reporterId: string, reason: ReportReason, reasonDisplay: string, details?: string | null, hasDetails: boolean, createdAt: any, reporter: { __typename?: 'SubmissionReportReporterInfo', id: string, user: { __typename?: 'SubmissionReportUserInfo', id: string, firstName: string, lastName: string, email?: string | null, hasAvatar: boolean } } }> };

export type FriendsLocationsConnectionFieldsFragment = { __typename?: 'FriendsLocationsConnection', total: number, locations: Array<{ __typename?: 'FriendLocation', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, distanceKm?: number | null, timestamp: any }> };

export type TripListResultFieldsFragment = { __typename?: 'TripListResult', trips: Array<{ __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'TripPaginationInfo', hasMore: boolean, limit: number, offset: number, total: number } };

export type SponsorListResultFieldsFragment = { __typename?: 'SponsorListResult', total: number, sponsors: Array<{ __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null }> };

export type MyNotificationsResultFieldsFragment = { __typename?: 'MyNotificationsResult', notifications: Array<{ __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null }>, pagination: { __typename?: 'NotificationPaginationInfo', page: number, pageSize: number, total: number, totalPages: number } };

export type AllNotificationsResultFieldsFragment = { __typename?: 'AllNotificationsResult', notifications: Array<{ __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null }>, pagination: { __typename?: 'NotificationOffsetPaginationInfo', hasMore: boolean, limit: number, offset: number, total: number } };

export type CoinStatisticsFieldsFragment = { __typename?: 'CoinStatistics', addedCoins: number, removedCoins: number, netBalance: number, transactionCount: number, time: any };

export type CoinQuickStatsFieldsFragment = { __typename?: 'CoinQuickStats', totalCoins: number, totalGroups: number, averageCoinsPerGroup: number, richestGroupId?: string | null, richestGroupName?: string | null, time: any };

export type CoinAdditionalInsightsFieldsFragment = { __typename?: 'CoinAdditionalInsights', mostActiveAdmin?: { __typename?: 'FormattedUser', name: string, transactionCount: number } | null, recentTransactions: Array<{ __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null }> };

export type FormattedUserFieldsFragment = { __typename?: 'FormattedUser', name: string, transactionCount: number };

export type MostActiveAdminStatsFieldsFragment = { __typename?: 'MostActiveAdminStats', adminId: string, adminName?: string | null, transactionCount: number, totalAmount: number };

export type GroupRankingResultFieldsFragment = { __typename?: 'GroupRankingResult', currentDate: any, data: Array<{ __typename?: 'GroupRanking', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any }> };

export type DeliveryStatsFieldsFragment = { __typename?: 'DeliveryStats', totalDeliveries: number, totalSuccess: number, totalFailures: number, totalRecipients: number, successRate: number, avgSuccessPerDelivery: number, avgFailuresPerDelivery: number, statusBreakdown: { __typename?: 'DeliveryStatusBreakdown', success: number, failure: number, partialFailure: number, pending: number } };

export type DeliveryStatusBreakdownFieldsFragment = { __typename?: 'DeliveryStatusBreakdown', success: number, failure: number, partialFailure: number, pending: number };

export type VotingProgressFieldsFragment = { __typename?: 'VotingProgress', challengeId: string, totalVotes: number, submissionStats: Array<{ __typename?: 'SubmissionVoteCount', submissionId: string, voteCount: number, voteScore: number }> };

export type SubmissionVoteCountFieldsFragment = { __typename?: 'SubmissionVoteCount', submissionId: string, voteCount: number, voteScore: number };

export type JudgedStaffVotingProgressFieldsFragment = { __typename?: 'JudgedStaffVotingProgress', allAdminsVoted: boolean, totalAdmins: number, votedAdmins: number, pendingAdmins: number, eligibleSubmissionsCount: number, requiredPositions: number, adminProgress: Array<{ __typename?: 'AdminVotingInfo', participantId: string, hasVotedAll: boolean, votedPositions: Array<number> }> };

export type AdminVotingInfoFieldsFragment = { __typename?: 'AdminVotingInfo', participantId: string, hasVotedAll: boolean, votedPositions: Array<number> };

export type ReactionCountsFieldsFragment = { __typename?: 'ReactionCounts', clap: number, fire: number, heart: number, star: number };

export type ReactionsSummaryFieldsFragment = { __typename?: 'ReactionsSummary', total: number, myReactions: Array<ReactionType>, counts: { __typename?: 'ReactionCounts', clap: number, fire: number, heart: number, star: number } };

export type CreateGroupPayloadFieldsFragment = { __typename?: 'CreateGroupPayload', group: { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any } };

export type UpdateGroupPayloadFieldsFragment = { __typename?: 'UpdateGroupPayload', group: { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any } };

export type DeleteGroupPayloadFieldsFragment = { __typename?: 'DeleteGroupPayload', success: boolean };

export type CreateRewardPayloadFieldsFragment = { __typename?: 'CreateRewardPayload', reward: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } };

export type UpdateRewardPayloadFieldsFragment = { __typename?: 'UpdateRewardPayload', reward: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } };

export type DeleteRewardPayloadFieldsFragment = { __typename?: 'DeleteRewardPayload', success: boolean, deletedRewardId: string };

export type SetRewardHiddenPayloadFieldsFragment = { __typename?: 'SetRewardHiddenPayload', previousHidden: boolean, reward: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } };

export type PurchaseRewardPayloadFieldsFragment = { __typename?: 'PurchaseRewardPayload', remainingGroupCoins: number, remainingRewardQuantity: number, purchase: { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any } };

export type UpdatePurchaseStatusPayloadFieldsFragment = { __typename?: 'UpdatePurchaseStatusPayload', previousStatus: RewardPurchaseStatus, refunded: boolean, purchase: { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any } };

export type UpdateMyPurchaseStatusPayloadFieldsFragment = { __typename?: 'UpdateMyPurchaseStatusPayload', previousStatus: RewardPurchaseStatus, purchase: { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any } };

export type CreateSponsorPayloadFieldsFragment = { __typename?: 'CreateSponsorPayload', sponsor: { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null } };

export type UpdateSponsorPayloadFieldsFragment = { __typename?: 'UpdateSponsorPayload', sponsor: { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null } };

export type DeleteSponsorPayloadFieldsFragment = { __typename?: 'DeleteSponsorPayload', success: boolean, id: string };

export type LinkSponsorToTripPayloadFieldsFragment = { __typename?: 'LinkSponsorToTripPayload', linked: boolean, sponsorId: string, tripId: string };

export type UnlinkSponsorFromTripPayloadFieldsFragment = { __typename?: 'UnlinkSponsorFromTripPayload', unlinked: boolean, sponsorId: string, tripId: string };

export type CreateNotificationResultFieldsFragment = { __typename?: 'CreateNotificationResult', notification: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } };

export type UpdateNotificationResultFieldsFragment = { __typename?: 'UpdateNotificationResult', notification: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } };

export type DeleteNotificationResultFieldsFragment = { __typename?: 'DeleteNotificationResult', success: boolean };

export type UpdateNotificationStatusResultFieldsFragment = { __typename?: 'UpdateNotificationStatusResult', previousStatus: NotificationStatus, newStatus: NotificationStatus, notification: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } };

export type CreateNotificationSchedulePayloadFieldsFragment = { __typename?: 'CreateNotificationSchedulePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } };

export type UpdateNotificationSchedulePayloadFieldsFragment = { __typename?: 'UpdateNotificationSchedulePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } };

export type DeleteNotificationSchedulePayloadFieldsFragment = { __typename?: 'DeleteNotificationSchedulePayload', success: boolean, message: string, deletedExecutionCount?: number | null };

export type DuplicateNotificationSchedulePayloadFieldsFragment = { __typename?: 'DuplicateNotificationSchedulePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } };

export type ToggleScheduleActivePayloadFieldsFragment = { __typename?: 'ToggleScheduleActivePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } };

export type BulkToggleActivePayloadFieldsFragment = { __typename?: 'BulkToggleActivePayload', success: boolean, updatedCount: number };

export type BulkDeleteNotificationSchedulesPayloadFieldsFragment = { __typename?: 'BulkDeleteNotificationSchedulesPayload', success: boolean, requestedCount: number, deletedCount: number, notFoundIds?: Array<string> | null };

export type UpdateLastRunPayloadFieldsFragment = { __typename?: 'UpdateLastRunPayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } };

export type SendMobileNotificationsPayloadFieldsFragment = { __typename?: 'SendMobileNotificationsPayload', success: boolean, sent: number, failed: number, total: number };

export type TrackDeliveryStartPayloadFieldsFragment = { __typename?: 'TrackDeliveryStartPayload', success: boolean };

export type TrackDeliveryCompletePayloadFieldsFragment = { __typename?: 'TrackDeliveryCompletePayload', success: boolean };

export type TrackDeliveryFailurePayloadFieldsFragment = { __typename?: 'TrackDeliveryFailurePayload', success: boolean };

export type DeleteActivityResultFieldsFragment = { __typename?: 'DeleteActivityResult', success: boolean };

export type ToggleReactionResultFieldsFragment = { __typename?: 'ToggleReactionResult', activityId: string, reactionType: ReactionType, isActive: boolean, reactionsSummary: { __typename?: 'ReactionsSummary', total: number, myReactions: Array<ReactionType>, counts: { __typename?: 'ReactionCounts', clap: number, fire: number, heart: number, star: number } } };

export type SubmitVotePayloadFieldsFragment = { __typename?: 'SubmitVotePayload', vote: { __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any } };

export type SubmitVotesPayloadFieldsFragment = { __typename?: 'SubmitVotesPayload', totalVotesCast: number, votes: Array<{ __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any }> };

export type ForceEndVotingPayloadFieldsFragment = { __typename?: 'ForceEndVotingPayload', success: boolean, challengeId: string, challengeStatus: string, finalized: boolean, totalVotes: number };

export type DeleteTripResultFieldsFragment = { __typename?: 'DeleteTripResult', success: boolean };

export type UpdateLocationPayloadFieldsFragment = { __typename?: 'UpdateLocationPayload', location: { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } };

export type UpdateSharingSettingsPayloadFieldsFragment = { __typename?: 'UpdateSharingSettingsPayload', settings: { __typename?: 'LocationSharingSettings', isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } };

export type SharingUserPayloadFieldsFragment = { __typename?: 'SharingUserPayload', location: { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } };

export type TotalAvailablePointsPayloadFieldsFragment = { __typename?: 'TotalAvailablePointsPayload', totalPoints: number };

export type CheckInactiveUsersPayloadFieldsFragment = { __typename?: 'CheckInactiveUsersPayload', checked: number, notified: number, skipped: number, errors: number };

export type DownloadUrlResultFieldsFragment = { __typename?: 'DownloadUrlResult', signedUrl: string, expiresAt: any };

export type UploadUrlResultFieldsFragment = { __typename?: 'UploadUrlResult', bucket: string, storagePath: string, objectPath: string, resumableUrl: string, token: string };

export type PublicUrlResultFieldsFragment = { __typename?: 'PublicUrlResult', publicUrl: string };

export type ExecutionHistoryResultFieldsFragment = { __typename?: 'ExecutionHistoryResult', executions: Array<{ __typename?: 'ExecutionHistoryEntry', id: string, executedAt: any, notification?: { __typename?: 'ExecutionHistoryNotification', id: string, title: string, body: string, createdAt: any } | null }> };

export type GetActivityQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetActivityQuery = { __typename?: 'Query', activity?: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } | null };

export type GetActivitiesByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  cursor?: InputMaybe<ActivityCursorInput>;
}>;


export type GetActivitiesByTripQuery = { __typename?: 'Query', activitiesByTrip: { __typename?: 'ActivityFeedResult', activities: Array<{ __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null }>, nextCursor?: { __typename?: 'ActivityCursor', id: string, createdAt: any, isPinned: boolean } | null, pagination: { __typename?: 'PaginationInfo', hasMore: boolean, pageSize: number } } };

export type GetActivitiesByTripModerationQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
  includeHidden?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type GetActivitiesByTripModerationQuery = { __typename?: 'Query', activitiesByTripModeration: { __typename?: 'ActivityFeedModerationResult', activities: Array<{ __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null }>, pagination: { __typename?: 'ModerationPaginationInfo', hasMore: boolean, page: number, pageSize: number, total: number, totalPages: number } } };

export type CreateCustomActivityMutationVariables = Exact<{
  input: CreateCustomActivityInput;
}>;


export type CreateCustomActivityMutation = { __typename?: 'Mutation', createCustomActivity: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type CreateRankChangeActivityMutationVariables = Exact<{
  input: CreateRankChangeActivityInput;
}>;


export type CreateRankChangeActivityMutation = { __typename?: 'Mutation', createRankChangeActivity: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type CreateSubmissionActivityMutationVariables = Exact<{
  input: CreateSubmissionActivityInput;
}>;


export type CreateSubmissionActivityMutation = { __typename?: 'Mutation', createSubmissionActivity: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type UpdateActivityMutationVariables = Exact<{
  input: UpdateActivityInput;
}>;


export type UpdateActivityMutation = { __typename?: 'Mutation', updateActivity: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type DeleteActivityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteActivityMutation = { __typename?: 'Mutation', deleteActivity: { __typename?: 'DeleteActivityResult', success: boolean } };

export type HideActivityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  reason?: InputMaybe<Scalars['String']['input']>;
}>;


export type HideActivityMutation = { __typename?: 'Mutation', hideActivity: { __typename?: 'HiddenActivityResult', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, hiddenAt: any, hiddenReason?: string | null, updatedAt: any } };

export type UnhideActivityMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnhideActivityMutation = { __typename?: 'Mutation', unhideActivity: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type SetActivityPinnedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  isPinned: Scalars['Boolean']['input'];
}>;


export type SetActivityPinnedMutation = { __typename?: 'Mutation', setActivityPinned: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type ToggleActivityReactionMutationVariables = Exact<{
  activityId: Scalars['ID']['input'];
  reaction: ReactionType;
}>;


export type ToggleActivityReactionMutation = { __typename?: 'Mutation', toggleActivityReaction: { __typename?: 'ToggleReactionResult', activityId: string, reactionType: ReactionType, isActive: boolean, reactionsSummary: { __typename?: 'ReactionsSummary', total: number, myReactions: Array<ReactionType>, counts: { __typename?: 'ReactionCounts', clap: number, fire: number, heart: number, star: number } } } };

export type GetChallengeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type GetChallengeQuery = { __typename?: 'Query', challenge?: { __typename?: 'Challenge', id: string, tripId: string, name: string, description?: string | null, image?: string | null, submissionType: SubmissionType, scoringCategory: ScoringCategory, basePoints: number, firstPlacePoints?: number | null, secondPlacePoints?: number | null, thirdPlacePoints?: number | null, isRecurring: boolean, dailyStartTime?: string | null, dailyEndTime?: string | null, status: ChallengeStatus, startTime?: any | null, endTime?: any | null, targetLatitude?: number | null, targetLongitude?: number | null, expectedValue?: string | null, autoApprove: boolean, isActive: boolean, isOpenForSubmission: boolean, hasVotingPhase: boolean, requiresLocation: boolean, requiresQRCode: boolean, createdAt: any } | null };

export type GetChallengesByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetChallengesByTripQuery = { __typename?: 'Query', challengesByTrip?: { __typename?: 'ChallengesConnection', challenges: Array<{ __typename?: 'ChallengeSummary', id: string, tripId: string, name: string, description?: string | null, submissionType: SubmissionType, scoringCategory: ScoringCategory, basePoints: number, status: ChallengeStatus, createdAt: any }>, pagination: { __typename?: 'ChallengePagination', total: number, limit: number, offset: number, hasMore: boolean } } | null };

export type GetChallengeSubmissionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetChallengeSubmissionQuery = { __typename?: 'Query', challengeSubmission?: { __typename?: 'ChallengeSubmission', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null } | null };

export type GetChallengeSubmissionsQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SubmissionOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type GetChallengeSubmissionsQuery = { __typename?: 'Query', challengeSubmissions?: { __typename?: 'ChallengeSubmissionListResult', totalCount: number, submissions: Array<{ __typename?: 'ChallengeSubmission', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null }> } | null };

export type GetChallengeSubmissionByChallengeAndGroupQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  groupId: Scalars['ID']['input'];
}>;


export type GetChallengeSubmissionByChallengeAndGroupQuery = { __typename?: 'Query', challengeSubmissionByChallengeAndGroup?: { __typename?: 'ChallengeSubmission', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null } | null };

export type GetVotesByChallengeQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
}>;


export type GetVotesByChallengeQuery = { __typename?: 'Query', votesByChallenge?: { __typename?: 'ChallengeVoteAdminList', totalVotes: number, uniqueVoters: number, votes: Array<{ __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any }> } | null };

export type GetMyVotesQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type GetMyVotesQuery = { __typename?: 'Query', myVotes?: { __typename?: 'ChallengeVoteList', totalVotes: number, votes: Array<{ __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any }> } | null };

export type GetVotingProgressQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
}>;


export type GetVotingProgressQuery = { __typename?: 'Query', votingProgress?: { __typename?: 'VotingProgress', challengeId: string, totalVotes: number, submissionStats: Array<{ __typename?: 'SubmissionVoteCount', submissionId: string, voteCount: number, voteScore: number }> } | null };

export type GetJudgedStaffVotingProgressQueryVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
  adminParticipantIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
  eligibleSubmissionsCount: Scalars['Int']['input'];
  requiredPositions: Scalars['Int']['input'];
}>;


export type GetJudgedStaffVotingProgressQuery = { __typename?: 'Query', judgedStaffVotingProgress?: { __typename?: 'JudgedStaffVotingProgress', allAdminsVoted: boolean, eligibleSubmissionsCount: number, pendingAdmins: number, requiredPositions: number, totalAdmins: number, votedAdmins: number, adminProgress: Array<{ __typename?: 'AdminVotingInfo', participantId: string, hasVotedAll: boolean, votedPositions: Array<number> }> } | null };

export type CreateChallengeSubmissionMutationVariables = Exact<{
  input: CreateSubmissionInput;
}>;


export type CreateChallengeSubmissionMutation = { __typename?: 'Mutation', createChallengeSubmission?: { __typename?: 'ChallengeSubmissionCreateResult', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null } | null };

export type UpdateChallengeSubmissionMutationVariables = Exact<{
  input: UpdateSubmissionInput;
}>;


export type UpdateChallengeSubmissionMutation = { __typename?: 'Mutation', updateChallengeSubmission?: { __typename?: 'ChallengeSubmissionUpdateResult', id: string, challengeId: string, groupId: string, textContent?: string | null, imageIds: Array<string>, videoId?: string | null, hasMedia: boolean, hasLocation: boolean, latitude?: number | null, longitude?: number | null, awardedPoints: number, bonusPoints: number, totalPoints: number, ranking?: number | null, status: SubmissionStatus, reviewedById?: string | null, reviewedAt?: any | null, rejectionReason?: string | null, voteCount: number, voteScore: number, createdAt: any, updatedAt: any, reviewedBy?: { __typename?: 'SubmissionReviewerInfo', id: string, firstName: string, lastName: string, email?: string | null } | null, group?: { __typename?: 'SubmissionGroupInfo', id: string, name: string, description?: string | null, image?: string | null } | null } | null };

export type DeleteChallengeSubmissionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteChallengeSubmissionMutation = { __typename?: 'Mutation', deleteChallengeSubmission?: boolean | null };

export type CreateChallengeActivityMutationVariables = Exact<{
  input: CreateChallengeActivityInput;
}>;


export type CreateChallengeActivityMutation = { __typename?: 'Mutation', createChallengeActivity: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type SubmitVoteMutationVariables = Exact<{
  input: SubmitVoteInput;
}>;


export type SubmitVoteMutation = { __typename?: 'Mutation', submitVote?: { __typename?: 'SubmitVotePayload', vote: { __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any } } | null };

export type SubmitVotesMutationVariables = Exact<{
  input: SubmitVotesInput;
}>;


export type SubmitVotesMutation = { __typename?: 'Mutation', submitVotes?: { __typename?: 'SubmitVotesPayload', totalVotesCast: number, votes: Array<{ __typename?: 'ChallengeVote', id: string, challengeId: string, submissionId: string, voterId: string, votePosition: number, votePoints: number, normalizedWeight: number, votedAt: any }> } | null };

export type ForceEndVotingMutationVariables = Exact<{
  challengeId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type ForceEndVotingMutation = { __typename?: 'Mutation', forceEndVoting?: { __typename?: 'ForceEndVotingPayload', success: boolean, finalized: boolean, challengeId: string, challengeStatus: string, totalVotes: number } | null };

export type CreateChallengeMutationVariables = Exact<{
  input: CreateChallengeInput;
}>;


export type CreateChallengeMutation = { __typename?: 'Mutation', createChallenge?: { __typename?: 'CreateChallengePayload', challenge: { __typename?: 'ChallengeSummary', id: string, tripId: string, name: string, description?: string | null, submissionType: SubmissionType, scoringCategory: ScoringCategory, basePoints: number, status: ChallengeStatus, createdAt: any } } | null };

export type UpdateChallengeMutationVariables = Exact<{
  input: UpdateChallengeInput;
}>;


export type UpdateChallengeMutation = { __typename?: 'Mutation', updateChallenge?: { __typename?: 'UpdateChallengePayload', challenge: { __typename?: 'ChallengeSummary', id: string, tripId: string, name: string, description?: string | null, submissionType: SubmissionType, scoringCategory: ScoringCategory, basePoints: number, status: ChallengeStatus, createdAt: any } } | null };

export type GetCoinStatisticsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetCoinStatisticsQuery = { __typename?: 'Query', coinStatistics?: { __typename?: 'CoinStatistics', addedCoins: number, removedCoins: number, netBalance: number, transactionCount: number, time: any } | null };

export type GetCoinQuickStatsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetCoinQuickStatsQuery = { __typename?: 'Query', coinQuickStats?: { __typename?: 'CoinQuickStats', totalCoins: number, totalGroups: number, averageCoinsPerGroup: number, richestGroupId?: string | null, richestGroupName?: string | null, time: any } | null };

export type GetCoinAdditionalInsightsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetCoinAdditionalInsightsQuery = { __typename?: 'Query', coinAdditionalInsights?: { __typename?: 'CoinAdditionalInsights', mostActiveAdmin?: { __typename?: 'FormattedUser', name: string, transactionCount: number } | null, recentTransactions: Array<{ __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null }> } | null };

export type GetCoinTransactionsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetCoinTransactionsQuery = { __typename?: 'Query', coinTransactions?: { __typename?: 'CoinTransactionsConnection', transactions: Array<{ __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null }>, pagination: { __typename?: 'CoinTransactionPagination', hasMore: boolean, limit: number, offset: number, total: number } } | null };

export type GetMyCoinTransactionsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  groupId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMyCoinTransactionsQuery = { __typename?: 'Query', myCoinTransactions: Array<{ __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null }> };

export type AddCoinsMutationVariables = Exact<{
  input: AddCoinsInput;
}>;


export type AddCoinsMutation = { __typename?: 'Mutation', addCoins?: { __typename?: 'CoinTransactionResult', id: string, amount: number, groupId: string, adminId: string, createdAt: any, transaction: { __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null } } | null };

export type RemoveCoinsMutationVariables = Exact<{
  input: RemoveCoinsInput;
}>;


export type RemoveCoinsMutation = { __typename?: 'Mutation', removeCoins?: { __typename?: 'CoinTransactionResult', id: string, amount: number, groupId: string, adminId: string, createdAt: any, transaction: { __typename?: 'CoinTransaction', id: string, amount: number, reason?: string | null, groupId: string, adminId: string, createdAt: any, group?: { __typename?: 'CoinTransactionGroup', id: string, name: string, coins: number } | null, admin?: { __typename?: 'CoinTransactionAdmin', id: string, firstName?: string | null, lastName?: string | null, fullName: string } | null } } | null };

export type GetGroupQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetGroupQuery = { __typename?: 'Query', group?: { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any } | null };

export type GetGroupByCodeQueryVariables = Exact<{
  code: Scalars['String']['input'];
}>;


export type GetGroupByCodeQuery = { __typename?: 'Query', groupByCode?: { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any } | null };

export type GetGroupsQueryVariables = Exact<{
  pagination?: InputMaybe<GroupPaginationInput>;
}>;


export type GetGroupsQuery = { __typename?: 'Query', groups: { __typename?: 'GroupsConnection', groups: Array<{ __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'GroupPagination', total: number, hasMore: boolean, limit: number, offset: number } } };

export type GetGroupsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  pagination?: InputMaybe<GroupPaginationInput>;
}>;


export type GetGroupsByTripQuery = { __typename?: 'Query', groupsByTrip: { __typename?: 'GroupsConnection', groups: Array<{ __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'GroupPagination', total: number, hasMore: boolean, limit: number, offset: number } } };

export type GetGroupsByOrganizerQueryVariables = Exact<{
  organizerId: Scalars['ID']['input'];
}>;


export type GetGroupsByOrganizerQuery = { __typename?: 'Query', groupsByOrganizer: Array<{ __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any }> };

export type GetGroupNamesByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetGroupNamesByTripQuery = { __typename?: 'Query', groupNamesByTrip: Array<{ __typename?: 'GroupSummary', id: string, name: string }> };

export type GetGroupRankingQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetGroupRankingQuery = { __typename?: 'Query', groupRanking: { __typename?: 'GroupRankingResult', currentDate: any, data: Array<{ __typename?: 'GroupRanking', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any }> } };

export type CreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;


export type CreateGroupMutation = { __typename?: 'Mutation', createGroup: { __typename?: 'CreateGroupPayload', group: { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any } } };

export type UpdateGroupMutationVariables = Exact<{
  input: UpdateGroupInput;
}>;


export type UpdateGroupMutation = { __typename?: 'Mutation', updateGroup: { __typename?: 'UpdateGroupPayload', group: { __typename?: 'Group', id: string, name: string, description?: string | null, code: string, image?: string | null, coins: number, isActive: boolean, status: GroupStatus, tripId: string, organizerId: string, createdAt: any, updatedAt: any } } };

export type DeleteGroupMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteGroupMutation = { __typename?: 'Mutation', deleteGroup: { __typename?: 'DeleteGroupPayload', success: boolean } };

export type AddUserToSharingMutationVariables = Exact<{
  groupId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type AddUserToSharingMutation = { __typename?: 'Mutation', addUserToSharing?: { __typename?: 'SharingUserPayload', location: { __typename?: 'Location', id: string, isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type RemoveUserFromSharingMutationVariables = Exact<{
  groupId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type RemoveUserFromSharingMutation = { __typename?: 'Mutation', removeUserFromSharing?: { __typename?: 'SharingUserPayload', location: { __typename?: 'Location', id: string, isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type UpdateSharingSettingsMutationVariables = Exact<{
  input: UpdateSharingSettingsInput;
}>;


export type UpdateSharingSettingsMutation = { __typename?: 'Mutation', updateSharingSettings?: { __typename?: 'UpdateSharingSettingsPayload', settings: { __typename?: 'LocationSharingSettings', isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type GetMyLocationQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMyLocationQuery = { __typename?: 'Query', myLocation?: { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } | null };

export type GetMySharingSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMySharingSettingsQuery = { __typename?: 'Query', mySharingSettings?: { __typename?: 'LocationSharingSettings', isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } | null };

export type GetFriendsLocationsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFriendsLocationsQuery = { __typename?: 'Query', friendsLocations?: { __typename?: 'FriendsLocationsConnection', total: number, locations: Array<{ __typename?: 'FriendLocation', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, distanceKm?: number | null, timestamp: any }> } | null };

export type UpdateLocationMutationVariables = Exact<{
  input: UpdateLocationInput;
}>;


export type UpdateLocationMutation = { __typename?: 'Mutation', updateLocation?: { __typename?: 'UpdateLocationPayload', location: { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type UpdateLocationSharingSettingsMutationVariables = Exact<{
  input: UpdateSharingSettingsInput;
}>;


export type UpdateLocationSharingSettingsMutation = { __typename?: 'Mutation', updateSharingSettings?: { __typename?: 'UpdateSharingSettingsPayload', settings: { __typename?: 'LocationSharingSettings', isSharingLocation: boolean, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type AddUserToLocationSharingMutationVariables = Exact<{
  input: AddSharingUserInput;
}>;


export type AddUserToLocationSharingMutation = { __typename?: 'Mutation', addUserToSharing?: { __typename?: 'SharingUserPayload', location: { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type RemoveUserFromLocationSharingMutationVariables = Exact<{
  input: RemoveSharingUserInput;
}>;


export type RemoveUserFromLocationSharingMutation = { __typename?: 'Mutation', removeUserFromSharing?: { __typename?: 'SharingUserPayload', location: { __typename?: 'Location', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, altitudeAccuracy?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, timestamp: any, usersToShareWith: Array<{ __typename?: 'SharingUserInfo', id: string, firstName?: string | null, lastName?: string | null }> } } | null };

export type GetNotificationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetNotificationQuery = { __typename?: 'Query', notification?: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } | null };

export type GetMyNotificationsQueryVariables = Exact<{
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMyNotificationsQuery = { __typename?: 'Query', myNotifications: { __typename?: 'MyNotificationsResult', notifications: Array<{ __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null }>, pagination: { __typename?: 'NotificationPaginationInfo', page: number, pageSize: number, total: number, totalPages: number } } };

export type GetAllNotificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetAllNotificationsQuery = { __typename?: 'Query', allNotifications: { __typename?: 'AllNotificationsResult', notifications: Array<{ __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null }>, pagination: { __typename?: 'NotificationOffsetPaginationInfo', hasMore: boolean, limit: number, offset: number, total: number } } };

export type GetNotificationSchedulesQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  notificationType?: InputMaybe<NotificationScheduleType>;
  search?: InputMaybe<Scalars['String']['input']>;
  startDateFrom?: InputMaybe<Scalars['DateTime']['input']>;
  startDateTo?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type GetNotificationSchedulesQuery = { __typename?: 'Query', notificationSchedules?: { __typename?: 'NotificationSchedulesConnection', schedules: Array<{ __typename?: 'NotificationScheduleSummary', id: string, name: string, notificationType: NotificationScheduleType, hour: number, minute: number, isActive: boolean, startDate: any, endDate: any, tripId?: string | null }>, pagination: { __typename?: 'NotificationSchedulePagination', hasMore: boolean, limit: number, offset: number, total: number } } | null };

export type GetNotificationScheduleQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetNotificationScheduleQuery = { __typename?: 'Query', notificationSchedule?: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } | null };

export type GetActiveNotificationSchedulesQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars['ID']['input']>;
  notificationType?: InputMaybe<NotificationScheduleType>;
}>;


export type GetActiveNotificationSchedulesQuery = { __typename?: 'Query', activeNotificationSchedules?: Array<{ __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any }> | null };

export type GetUpcomingNotificationSchedulesQueryVariables = Exact<{
  withinMinutes?: InputMaybe<Scalars['Int']['input']>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetUpcomingNotificationSchedulesQuery = { __typename?: 'Query', upcomingNotificationSchedules?: Array<{ __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any }> | null };

export type GetNotificationScheduleExecutionHistoryQueryVariables = Exact<{
  scheduleId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetNotificationScheduleExecutionHistoryQuery = { __typename?: 'Query', notificationScheduleExecutionHistory?: { __typename?: 'ExecutionHistoryResult', executions: Array<{ __typename?: 'ExecutionHistoryEntry', id: string, executedAt: any, notification?: { __typename?: 'ExecutionHistoryNotification', id: string, title: string, body: string, createdAt: any } | null }> } | null };

export type GetNotificationDeliveriesQueryVariables = Exact<{
  scheduleId?: InputMaybe<Scalars['ID']['input']>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<DeliveryStatus>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetNotificationDeliveriesQuery = { __typename?: 'Query', notificationDeliveries: { __typename?: 'NotificationDeliveryListResult', deliveries: Array<{ __typename?: 'NotificationDelivery', id: string, notificationId: string, scheduleId?: string | null, tripId: string, status: DeliveryStatus, deliveryStartedAt: any, deliveryCompletedAt?: any | null, totalRecipients: number, successCount: number, failureCount: number, errorLog?: string | null, createdAt: any, updatedAt: any, notification?: { __typename?: 'NotificationInfo', id: string, title: string, body: string, url?: string | null, tripId?: string | null, createdAt: any, createdBy?: { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null } | null } | null }>, pagination: { __typename?: 'DeliveryPagination', limit: number, offset: number, total: number } } };

export type GetNotificationDeliveryByNotificationIdQueryVariables = Exact<{
  notificationId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type GetNotificationDeliveryByNotificationIdQuery = { __typename?: 'Query', notificationDeliveryByNotificationId?: { __typename?: 'NotificationDelivery', id: string, notificationId: string, scheduleId?: string | null, tripId: string, status: DeliveryStatus, deliveryStartedAt: any, deliveryCompletedAt?: any | null, totalRecipients: number, successCount: number, failureCount: number, errorLog?: string | null, createdAt: any, updatedAt: any, notification?: { __typename?: 'NotificationInfo', id: string, title: string, body: string, url?: string | null, tripId?: string | null, createdAt: any, createdBy?: { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null } | null } | null } | null };

export type GetFailedDeliveriesQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars['ID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetFailedDeliveriesQuery = { __typename?: 'Query', failedDeliveries: { __typename?: 'NotificationDeliveryListResult', deliveries: Array<{ __typename?: 'NotificationDelivery', id: string, notificationId: string, scheduleId?: string | null, tripId: string, status: DeliveryStatus, deliveryStartedAt: any, deliveryCompletedAt?: any | null, totalRecipients: number, successCount: number, failureCount: number, errorLog?: string | null, createdAt: any, updatedAt: any, notification?: { __typename?: 'NotificationInfo', id: string, title: string, body: string, url?: string | null, tripId?: string | null, createdAt: any, createdBy?: { __typename?: 'NotificationCreator', id: string, firstName?: string | null, lastName?: string | null, authUserId?: string | null } | null } | null }>, pagination: { __typename?: 'DeliveryPagination', limit: number, offset: number, total: number } } };

export type GetDeliveryStatsQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars['ID']['input']>;
  scheduleId?: InputMaybe<Scalars['ID']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type GetDeliveryStatsQuery = { __typename?: 'Query', deliveryStats: { __typename?: 'DeliveryStats', totalDeliveries: number, totalSuccess: number, totalFailures: number, totalRecipients: number, successRate: number, avgSuccessPerDelivery: number, avgFailuresPerDelivery: number, statusBreakdown: { __typename?: 'DeliveryStatusBreakdown', success: number, failure: number, partialFailure: number, pending: number } } };

export type CreateNotificationMutationVariables = Exact<{
  title: Scalars['String']['input'];
  body: Scalars['String']['input'];
  priority?: InputMaybe<NotificationPriority>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateNotificationMutation = { __typename?: 'Mutation', createNotification: { __typename?: 'CreateNotificationResult', notification: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } } };

export type UpdateNotificationMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  body?: InputMaybe<Scalars['String']['input']>;
  priority?: InputMaybe<NotificationPriority>;
  url?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateNotificationMutation = { __typename?: 'Mutation', updateNotification: { __typename?: 'UpdateNotificationResult', notification: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } } };

export type DeleteNotificationMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type DeleteNotificationMutation = { __typename?: 'Mutation', deleteNotification: { __typename?: 'DeleteNotificationResult', success: boolean } };

export type CreateNotificationScheduleMutationVariables = Exact<{
  name: Scalars['String']['input'];
  hour: Scalars['Int']['input'];
  minute: Scalars['Int']['input'];
  startDate: Scalars['DateTime']['input'];
  endDate: Scalars['DateTime']['input'];
  notificationType: NotificationScheduleType;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  notificationTitle?: InputMaybe<Scalars['String']['input']>;
  notificationBody?: InputMaybe<Scalars['String']['input']>;
  notificationUrl?: InputMaybe<Scalars['String']['input']>;
  tripId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type CreateNotificationScheduleMutation = { __typename?: 'Mutation', createNotificationSchedule?: { __typename?: 'CreateNotificationSchedulePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } } | null };

export type UpdateNotificationScheduleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  hour?: InputMaybe<Scalars['Int']['input']>;
  minute?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['DateTime']['input']>;
  endDate?: InputMaybe<Scalars['DateTime']['input']>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  notificationTitle?: InputMaybe<Scalars['String']['input']>;
  notificationBody?: InputMaybe<Scalars['String']['input']>;
  notificationUrl?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateNotificationScheduleMutation = { __typename?: 'Mutation', updateNotificationSchedule?: { __typename?: 'UpdateNotificationSchedulePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } } | null };

export type DeleteNotificationScheduleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteNotificationScheduleMutation = { __typename?: 'Mutation', deleteNotificationSchedule?: { __typename?: 'DeleteNotificationSchedulePayload', success: boolean, message: string, deletedExecutionCount?: number | null } | null };

export type DuplicateNotificationScheduleMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DuplicateNotificationScheduleMutation = { __typename?: 'Mutation', duplicateNotificationSchedule?: { __typename?: 'DuplicateNotificationSchedulePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } } | null };

export type ToggleNotificationScheduleActiveMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ToggleNotificationScheduleActiveMutation = { __typename?: 'Mutation', toggleNotificationScheduleActive?: { __typename?: 'ToggleScheduleActivePayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } } | null };

export type BulkToggleNotificationScheduleActiveMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
  isActive: Scalars['Boolean']['input'];
}>;


export type BulkToggleNotificationScheduleActiveMutation = { __typename?: 'Mutation', bulkToggleNotificationScheduleActive?: { __typename?: 'BulkToggleActivePayload', success: boolean, updatedCount: number } | null };

export type BulkDeleteNotificationScheduleMutationVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type BulkDeleteNotificationScheduleMutation = { __typename?: 'Mutation', bulkDeleteNotificationSchedules?: { __typename?: 'BulkDeleteNotificationSchedulesPayload', success: boolean, requestedCount: number, deletedCount: number, notFoundIds?: Array<string> | null } | null };

export type UpdateNotificationScheduleLastRunMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  lastRunAt: Scalars['DateTime']['input'];
  lastRunStatus: LastRunStatus;
  lastRunError?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateNotificationScheduleLastRunMutation = { __typename?: 'Mutation', updateNotificationScheduleLastRun?: { __typename?: 'UpdateLastRunPayload', schedule: { __typename?: 'NotificationSchedule', id: string, name: string, notificationType: NotificationScheduleType, notificationTitle?: string | null, notificationBody?: string | null, notificationUrl?: string | null, hour: number, minute: number, formattedTime: string, startDate: any, endDate: any, isActive: boolean, isCurrentlyActive: boolean, isExpired: boolean, isUpcoming: boolean, lastRun?: any | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt: any } } | null };

export type UpdateNotificationStatusMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
  newStatus: NotificationStatus;
}>;


export type UpdateNotificationStatusMutation = { __typename?: 'Mutation', updateNotificationStatus: { __typename?: 'UpdateNotificationStatusResult', previousStatus: NotificationStatus, newStatus: NotificationStatus, notification: { __typename?: 'Notification', id: string, title: string, body: string, isSent: boolean, isScheduled: boolean, isReadyToSend?: boolean | null, status: NotificationStatus, priority: NotificationPriority, scheduledFor?: any | null, sentAt?: any | null, url?: string | null, tripId?: string | null, createdById: string, createdAt: any, updatedAt?: any | null } } };

export type SendMobileNotificationsMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type SendMobileNotificationsMutation = { __typename?: 'Mutation', sendMobileNotifications?: { __typename?: 'SendMobileNotificationsPayload', success: boolean, sent: number, failed: number, total: number } | null };

export type TrackDeliveryStartMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
}>;


export type TrackDeliveryStartMutation = { __typename?: 'Mutation', trackDeliveryStart?: { __typename?: 'TrackDeliveryStartPayload', success: boolean } | null };

export type TrackDeliveryCompleteMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
  totalRecipients: Scalars['Int']['input'];
  successCount: Scalars['Int']['input'];
  failureCount: Scalars['Int']['input'];
  errors?: InputMaybe<Scalars['String']['input']>;
}>;


export type TrackDeliveryCompleteMutation = { __typename?: 'Mutation', trackDeliveryComplete?: { __typename?: 'TrackDeliveryCompletePayload', success: boolean } | null };

export type TrackDeliveryFailureMutationVariables = Exact<{
  notificationId: Scalars['ID']['input'];
  error: Scalars['String']['input'];
}>;


export type TrackDeliveryFailureMutation = { __typename?: 'Mutation', trackDeliveryFailure?: { __typename?: 'TrackDeliveryFailurePayload', success: boolean } | null };

export type GetRewardQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetRewardQuery = { __typename?: 'Query', reward?: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } | null };

export type GetRewardsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetRewardsByTripQuery = { __typename?: 'Query', rewardsByTrip?: { __typename?: 'RewardsConnection', rewards: Array<{ __typename?: 'RewardWithCalculations', id: string, name: string, description: string, coinCostPercentage: number, dynamicCoinCost: number, canAfford?: boolean | null, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'RewardPagination', hasMore: boolean, limit: number, offset: number, total: number } } | null };

export type GetRewardsByTripAdminQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetRewardsByTripAdminQuery = { __typename?: 'Query', rewardsByTripAdmin?: { __typename?: 'RewardsConnection', rewards: Array<{ __typename?: 'RewardWithCalculations', id: string, name: string, description: string, coinCostPercentage: number, dynamicCoinCost: number, canAfford?: boolean | null, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'RewardPagination', hasMore: boolean, limit: number, offset: number, total: number } } | null };

export type GetPurchaseHistoryQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPurchaseHistoryQuery = { __typename?: 'Query', purchaseHistory?: { __typename?: 'PurchaseHistoryConnection', purchases: Array<{ __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any }>, pagination: { __typename?: 'RewardPagination', hasMore: boolean, limit: number, offset: number, total: number } } | null };

export type GetTotalAvailablePointsQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetTotalAvailablePointsQuery = { __typename?: 'Query', totalAvailablePoints?: { __typename?: 'TotalAvailablePointsPayload', totalPoints: number } | null };

export type CreateRewardMutationVariables = Exact<{
  input: CreateRewardInput;
}>;


export type CreateRewardMutation = { __typename?: 'Mutation', createReward?: { __typename?: 'CreateRewardPayload', reward: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } } | null };

export type UpdateRewardMutationVariables = Exact<{
  input: UpdateRewardInput;
}>;


export type UpdateRewardMutation = { __typename?: 'Mutation', updateReward?: { __typename?: 'UpdateRewardPayload', reward: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } } | null };

export type DeleteRewardMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteRewardMutation = { __typename?: 'Mutation', deleteReward?: { __typename?: 'DeleteRewardPayload', success: boolean, deletedRewardId: string } | null };

export type PurchaseRewardMutationVariables = Exact<{
  input: PurchaseRewardInput;
}>;


export type PurchaseRewardMutation = { __typename?: 'Mutation', purchaseReward?: { __typename?: 'PurchaseRewardPayload', remainingGroupCoins: number, remainingRewardQuantity: number, purchase: { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any } } | null };

export type SetRewardHiddenMutationVariables = Exact<{
  rewardId: Scalars['ID']['input'];
  isHidden: Scalars['Boolean']['input'];
}>;


export type SetRewardHiddenMutation = { __typename?: 'Mutation', setRewardHidden?: { __typename?: 'SetRewardHiddenPayload', previousHidden: boolean, reward: { __typename?: 'Reward', id: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, isInStock: boolean, canBePurchased: boolean, images: Array<string>, primaryImage?: string | null, purchaseCount: number, isHidden: boolean, tripId: string, createdById: string, createdAt: any, updatedAt: any } } | null };

export type UpdatePurchaseStatusMutationVariables = Exact<{
  input: UpdatePurchaseStatusInput;
}>;


export type UpdatePurchaseStatusMutation = { __typename?: 'Mutation', updatePurchaseStatus?: { __typename?: 'UpdatePurchaseStatusPayload', previousStatus: RewardPurchaseStatus, refunded: boolean, purchase: { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any } } | null };

export type UpdateMyPurchaseStatusMutationVariables = Exact<{
  input: UpdateMyPurchaseStatusInput;
}>;


export type UpdateMyPurchaseStatusMutation = { __typename?: 'Mutation', updateMyPurchaseStatus?: { __typename?: 'UpdateMyPurchaseStatusPayload', previousStatus: RewardPurchaseStatus, purchase: { __typename?: 'RewardPurchase', purchaseId: string, rewardId: string, rewardName: string, groupId: string, groupName?: string | null, purchasedById: string, purchasedByName?: string | null, quantity: number, totalCost: number, status: RewardPurchaseStatus, collectionMethod?: string | null, statusUpdatedAt: any, statusUpdatedById?: string | null, statusUpdatedByName?: string | null, purchasedAt: any } } | null };

export type SeedCreateSponsorMutationVariables = Exact<{
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  logoPath: Scalars['String']['input'];
  height?: InputMaybe<Scalars['Int']['input']>;
  offsetX?: InputMaybe<Scalars['Int']['input']>;
  offsetY?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SeedCreateSponsorMutation = { __typename?: 'Mutation', createSponsor?: { __typename?: 'CreateSponsorPayload', sponsor: { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, createdAt: any } } | null };

export type SeedLinkSponsorToTripMutationVariables = Exact<{
  sponsorId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type SeedLinkSponsorToTripMutation = { __typename?: 'Mutation', linkSponsorToTrip?: { __typename?: 'LinkSponsorToTripPayload', linked: boolean, sponsorId: string, tripId: string } | null };

export type SeedCreateRewardMutationVariables = Exact<{
  tripId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  description: Scalars['String']['input'];
  availableQuantity: Scalars['Int']['input'];
  coinCost: Scalars['Int']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  isHidden?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type SeedCreateRewardMutation = { __typename?: 'Mutation', createReward?: { __typename?: 'CreateRewardPayload', reward: { __typename?: 'Reward', id: string, tripId: string, name: string, description: string, coinCostPercentage: number, availableQuantity: number, images: Array<string>, isHidden: boolean, createdAt: any } } | null };

export type GetSponsorQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSponsorQuery = { __typename?: 'Query', sponsor?: { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null } | null };

export type GetSponsorsByTripQueryVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type GetSponsorsByTripQuery = { __typename?: 'Query', sponsorsByTrip?: Array<{ __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null }> | null };

export type CreateSponsorMutationVariables = Exact<{
  input: CreateSponsorInput;
}>;


export type CreateSponsorMutation = { __typename?: 'Mutation', createSponsor?: { __typename?: 'CreateSponsorPayload', sponsor: { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null } } | null };

export type UpdateSponsorMutationVariables = Exact<{
  input: UpdateSponsorInput;
}>;


export type UpdateSponsorMutation = { __typename?: 'Mutation', updateSponsor?: { __typename?: 'UpdateSponsorPayload', sponsor: { __typename?: 'Sponsor', id: string, name: string, description: string, logoPath: string, isActive: boolean, height?: number | null, offsetX?: number | null, offsetY?: number | null, hasLogoAdjustments: boolean, createdAt: any, updatedAt?: any | null } } | null };

export type DeleteSponsorMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteSponsorMutation = { __typename?: 'Mutation', deleteSponsor?: { __typename?: 'DeleteSponsorPayload', success: boolean, id: string } | null };

export type LinkSponsorToTripMutationVariables = Exact<{
  sponsorId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type LinkSponsorToTripMutation = { __typename?: 'Mutation', linkSponsorToTrip?: { __typename?: 'LinkSponsorToTripPayload', linked: boolean, sponsorId: string, tripId: string } | null };

export type UnlinkSponsorFromTripMutationVariables = Exact<{
  sponsorId: Scalars['ID']['input'];
  tripId: Scalars['ID']['input'];
}>;


export type UnlinkSponsorFromTripMutation = { __typename?: 'Mutation', unlinkSponsorFromTrip?: { __typename?: 'UnlinkSponsorFromTripPayload', unlinked: boolean, sponsorId: string, tripId: string } | null };

export type GetSubmissionReportsQueryVariables = Exact<{
  submissionId: Scalars['ID']['input'];
}>;


export type GetSubmissionReportsQuery = { __typename?: 'Query', submissionReports?: { __typename?: 'SubmissionReportListResult', totalCount: number, reports: Array<{ __typename?: 'SubmissionReport', id: string, submissionId: string, reporterId: string, reason: ReportReason, reasonDisplay: string, details?: string | null, hasDetails: boolean, createdAt: any, reporter: { __typename?: 'SubmissionReportReporterInfo', id: string, user: { __typename?: 'SubmissionReportUserInfo', id: string, firstName: string, lastName: string, email?: string | null, hasAvatar: boolean } } }> } | null };

export type CreateSubmissionReportMutationVariables = Exact<{
  input: CreateReportInput;
}>;


export type CreateSubmissionReportMutation = { __typename?: 'Mutation', createSubmissionReport?: { __typename?: 'SubmissionReportCreateResult', id: string, submissionId: string, reporterId: string, reason: ReportReason, reasonDisplay: string, details?: string | null, hasDetails: boolean, createdAt: any } | null };

export type GetTripQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTripQuery = { __typename?: 'Query', trip?: { __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any } | null };

export type GetTripsQueryVariables = Exact<{
  pagination?: InputMaybe<TripPaginationInput>;
}>;


export type GetTripsQuery = { __typename?: 'Query', trips: { __typename?: 'TripListResult', trips: Array<{ __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any }>, pagination: { __typename?: 'TripPaginationInfo', total: number, hasMore: boolean, limit: number, offset: number } } };

export type GetTripAdminQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTripAdminQuery = { __typename?: 'Query', tripAdmin?: { __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any } | null };

export type CreateTripMutationVariables = Exact<{
  input: CreateTripInput;
}>;


export type CreateTripMutation = { __typename?: 'Mutation', createTrip: { __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any } };

export type UpdateTripMutationVariables = Exact<{
  input: UpdateTripInput;
}>;


export type UpdateTripMutation = { __typename?: 'Mutation', updateTrip: { __typename?: 'Trip', id: string, name: string, description?: string | null, startDate: any, endDate: any, isActive: boolean, isPlanning: boolean, isCompleted: boolean, isCancelled: boolean, status: TripStatus, backgroundImagePath?: string | null, createdAt: any, updatedAt: any } };

export type DeleteTripMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteTripMutation = { __typename?: 'Mutation', deleteTrip: { __typename?: 'DeleteTripResult', success: boolean } };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, createdAt: any, lastSeenOn?: any | null, isAdmin: boolean, isModerator: boolean } | null };

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, createdAt: any, lastSeenOn?: any | null, isAdmin: boolean, isModerator: boolean } | null };

export type GetUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users?: Array<{ __typename?: 'User', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, createdAt: any, lastSeenOn?: any | null, isAdmin: boolean, isModerator: boolean }> | null };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser?: { __typename?: 'UserCreateResult', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, createdAt: any } | null };

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser?: { __typename?: 'UserUpdateResult', id: string, authUserId: string, firstName: string, lastName: string, fullName: string, hasAvatar: boolean, role: UserRole, updatedAt: any } | null };

export type ActivityFeedUpdatedSubscriptionVariables = Exact<{
  tripId: Scalars['ID']['input'];
}>;


export type ActivityFeedUpdatedSubscription = { __typename?: 'Subscription', activityFeedUpdated: { __typename?: 'Activity', id: string, tripId: string, title: string, description?: string | null, imageUrl?: string | null, activityType: ActivityType, isPinned: boolean, isHidden: boolean, createdAt: any, updatedAt: any, admin?: { __typename?: 'ActivityAdmin', id: string, firstName: string, lastName: string } | null } };

export type ChallengeVotingUpdatedSubscriptionVariables = Exact<{
  challengeId: Scalars['ID']['input'];
}>;


export type ChallengeVotingUpdatedSubscription = { __typename?: 'Subscription', challengeVotingUpdated: { __typename?: 'VotingProgressSubscription', challengeId: string, totalVotes: number, uniqueVoters: number, isComplete: boolean, endsAt?: any | null, updatedAt: any, submissions: Array<{ __typename?: 'VotingProgressSubmission', submissionId: string, voteCount: number, voteScore: number, rank?: number | null }> } };

export type LocationUpdatedSubscriptionVariables = Exact<{
  userIds: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type LocationUpdatedSubscription = { __typename?: 'Subscription', locationUpdated: { __typename?: 'FriendLocationSubscription', id: string, userId: string, latitude?: number | null, longitude?: number | null, accuracy?: number | null, altitude?: number | null, heading?: number | null, speed?: number | null, isSharingLocation: boolean, distanceKm?: number | null, timestamp: any } };

export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All user fields including computed properties and role information.\nUse for detailed user views, profiles, and admin user management.","block":true},"name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenOn"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isModerator"}}]}}]} as unknown as DocumentNode;
export const UserSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal user fields for list displays and references.\nUse when you only need basic identification.","block":true},"name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}}]}}]} as unknown as DocumentNode;
export const UserCreateResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User fields for creation/update results.\nThese types omit lastSeenOn and role flags.","block":true},"name":{"kind":"Name","value":"UserCreateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserCreateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const UserUpdateResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserUpdateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserUpdateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const TripSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal trip fields for references and lists.","block":true},"name":{"kind":"Name","value":"TripSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]} as unknown as DocumentNode;
export const GroupSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal group fields for lists and references.","block":true},"name":{"kind":"Name","value":"GroupSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode;
export const HiddenActivityFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Hidden activity result fields (includes hide metadata).","block":true},"name":{"kind":"Name","value":"HiddenActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HiddenActivityResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"hiddenAt"}},{"kind":"Field","name":{"kind":"Name","value":"hiddenReason"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const ChallengeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge fields including configuration and scheduling.\nUse for challenge details, editing, and administration.","block":true},"name":{"kind":"Name","value":"ChallengeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Challenge"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"submissionType"}},{"kind":"Field","name":{"kind":"Name","value":"scoringCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basePoints"}},{"kind":"Field","name":{"kind":"Name","value":"firstPlacePoints"}},{"kind":"Field","name":{"kind":"Name","value":"secondPlacePoints"}},{"kind":"Field","name":{"kind":"Name","value":"thirdPlacePoints"}},{"kind":"Field","name":{"kind":"Name","value":"isRecurring"}},{"kind":"Field","name":{"kind":"Name","value":"dailyStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"dailyEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"targetLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"targetLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"expectedValue"}},{"kind":"Field","name":{"kind":"Name","value":"autoApprove"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isOpenForSubmission"}},{"kind":"Field","name":{"kind":"Name","value":"hasVotingPhase"}},{"kind":"Field","name":{"kind":"Name","value":"requiresLocation"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQRCode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const ChallengeSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal challenge fields for lists and summary views.\nUse when you only need basic challenge information.","block":true},"name":{"kind":"Name","value":"ChallengeSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"submissionType"}},{"kind":"Field","name":{"kind":"Name","value":"scoringCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basePoints"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const SubmissionReviewerFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const SubmissionGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}}]} as unknown as DocumentNode;
export const ChallengeSubmissionCreateResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Challenge submission create result fields.\nSame as ChallengeSubmission but on create result type.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionCreateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmissionCreateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const ChallengeSubmissionUpdateResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Challenge submission update result fields.\nSame fields on update result type.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionUpdateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmissionUpdateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const ChallengeVoteFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const ChallengeVoteListFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Vote list with metadata.","block":true},"name":{"kind":"Name","value":"ChallengeVoteListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVoteList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}},{"kind":"Field","name":{"kind":"Name","value":"votes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const ChallengeVoteAdminListFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin vote list with unique voter count.","block":true},"name":{"kind":"Name","value":"ChallengeVoteAdminListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVoteAdminList"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueVoters"}},{"kind":"Field","name":{"kind":"Name","value":"votes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const LocationSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal location fields for lists.","block":true},"name":{"kind":"Name","value":"LocationSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode;
export const CoinTransactionGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}}]} as unknown as DocumentNode;
export const CoinTransactionAdminFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]} as unknown as DocumentNode;
export const CoinTransactionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]} as unknown as DocumentNode;
export const CoinTransactionResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transaction result (with embedded transaction).","block":true},"name":{"kind":"Name","value":"CoinTransactionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"transaction"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]} as unknown as DocumentNode;
export const SubmissionReportCreateResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Report create result fields.","block":true},"name":{"kind":"Name","value":"SubmissionReportCreateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportCreateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"reporterId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"hasDetails"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const ActivityAdminFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const ActivityFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const ActivityCursorFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Activity cursor for pagination.","block":true},"name":{"kind":"Name","value":"ActivityCursorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityCursor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]} as unknown as DocumentNode;
export const PaginationInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Standard pagination info.","block":true},"name":{"kind":"Name","value":"PaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}}]}}]} as unknown as DocumentNode;
export const ActivityFeedResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Activity feed result with pagination.","block":true},"name":{"kind":"Name","value":"ActivityFeedResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityFeedResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityCursorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationInfoFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Standard pagination info.","block":true},"name":{"kind":"Name","value":"PaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Activity cursor for pagination.","block":true},"name":{"kind":"Name","value":"ActivityCursorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityCursor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]} as unknown as DocumentNode;
export const ModerationPaginationInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Moderation pagination info.","block":true},"name":{"kind":"Name","value":"ModerationPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModerationPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]} as unknown as DocumentNode;
export const ActivityFeedModerationResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Activity feed moderation result.","block":true},"name":{"kind":"Name","value":"ActivityFeedModerationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityFeedModerationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModerationPaginationInfoFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Moderation pagination info.","block":true},"name":{"kind":"Name","value":"ModerationPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModerationPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]} as unknown as DocumentNode;
export const GroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const OffsetPaginationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Offset-based pagination info.","block":true},"name":{"kind":"Name","value":"OffsetPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const GroupsConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Groups connection with pagination.","block":true},"name":{"kind":"Name","value":"GroupsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OffsetPaginationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Offset-based pagination info.","block":true},"name":{"kind":"Name","value":"OffsetPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const CoinTransactionPaginationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transaction pagination.","block":true},"name":{"kind":"Name","value":"CoinTransactionPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const CoinTransactionsConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transactions connection.","block":true},"name":{"kind":"Name","value":"CoinTransactionsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionPaginationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transaction pagination.","block":true},"name":{"kind":"Name","value":"CoinTransactionPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const RewardWithCalculationsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward with dynamic calculations.\nUse for user-facing reward displays.","block":true},"name":{"kind":"Name","value":"RewardWithCalculationsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardWithCalculations"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"dynamicCoinCost"}},{"kind":"Field","name":{"kind":"Name","value":"canAfford"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const RewardPaginationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward pagination.","block":true},"name":{"kind":"Name","value":"RewardPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const RewardsConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Rewards connection.","block":true},"name":{"kind":"Name","value":"RewardsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rewards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardWithCalculationsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPaginationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward with dynamic calculations.\nUse for user-facing reward displays.","block":true},"name":{"kind":"Name","value":"RewardWithCalculationsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardWithCalculations"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"dynamicCoinCost"}},{"kind":"Field","name":{"kind":"Name","value":"canAfford"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward pagination.","block":true},"name":{"kind":"Name","value":"RewardPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const RewardPurchaseFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}}]} as unknown as DocumentNode;
export const PurchaseHistoryConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Purchase history connection.","block":true},"name":{"kind":"Name","value":"PurchaseHistoryConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseHistoryConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPaginationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward pagination.","block":true},"name":{"kind":"Name","value":"RewardPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const NotificationScheduleSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal schedule fields for lists.","block":true},"name":{"kind":"Name","value":"NotificationScheduleSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationScheduleSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}}]} as unknown as DocumentNode;
export const NotificationSchedulePaginationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification schedule pagination.","block":true},"name":{"kind":"Name","value":"NotificationSchedulePaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedulePagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const NotificationSchedulesConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification schedules connection.","block":true},"name":{"kind":"Name","value":"NotificationSchedulesConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedulesConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleSummaryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationSchedulePaginationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal schedule fields for lists.","block":true},"name":{"kind":"Name","value":"NotificationScheduleSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationScheduleSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification schedule pagination.","block":true},"name":{"kind":"Name","value":"NotificationSchedulePaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedulePagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const NotificationCreatorFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}}]} as unknown as DocumentNode;
export const NotificationWithCreatorFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification with creator info (for admin views).","block":true},"name":{"kind":"Name","value":"NotificationWithCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}}]} as unknown as DocumentNode;
export const NotificationDeliveryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification delivery fields.\nUse for delivery tracking and monitoring.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDelivery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryCompletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successCount"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"errorLog"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationWithCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification with creator info (for admin views).","block":true},"name":{"kind":"Name","value":"NotificationWithCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}}]} as unknown as DocumentNode;
export const DeliveryPaginationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery pagination.","block":true},"name":{"kind":"Name","value":"DeliveryPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const NotificationDeliveryListResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification delivery list result.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDeliveryListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationDeliveryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryPaginationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification with creator info (for admin views).","block":true},"name":{"kind":"Name","value":"NotificationWithCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification delivery fields.\nUse for delivery tracking and monitoring.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDelivery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryCompletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successCount"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"errorLog"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationWithCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery pagination.","block":true},"name":{"kind":"Name","value":"DeliveryPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const ChallengeSubmissionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge submission fields.\nUse for submission details, review, and voting.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const ChallengeSubmissionListResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Challenge submission list result.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmissionListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSubmissionFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge submission fields.\nUse for submission details, review, and voting.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const SubmissionReportUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info in submission report context.","block":true},"name":{"kind":"Name","value":"SubmissionReportUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}}]}}]} as unknown as DocumentNode;
export const SubmissionReportReporterFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reporter info in submission reports.","block":true},"name":{"kind":"Name","value":"SubmissionReportReporterFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportReporterInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info in submission report context.","block":true},"name":{"kind":"Name","value":"SubmissionReportUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}}]}}]} as unknown as DocumentNode;
export const SubmissionReportFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All submission report fields.\nUse for moderation and content review.","block":true},"name":{"kind":"Name","value":"SubmissionReportFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"reporterId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"hasDetails"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"reporter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportReporterFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reporter info in submission reports.","block":true},"name":{"kind":"Name","value":"SubmissionReportReporterFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportReporterInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info in submission report context.","block":true},"name":{"kind":"Name","value":"SubmissionReportUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}}]}}]} as unknown as DocumentNode;
export const SubmissionReportListResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Submission report list result.","block":true},"name":{"kind":"Name","value":"SubmissionReportListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All submission report fields.\nUse for moderation and content review.","block":true},"name":{"kind":"Name","value":"SubmissionReportFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"reporterId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"hasDetails"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"reporter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportReporterFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reporter info in submission reports.","block":true},"name":{"kind":"Name","value":"SubmissionReportReporterFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportReporterInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info in submission report context.","block":true},"name":{"kind":"Name","value":"SubmissionReportUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}}]}}]} as unknown as DocumentNode;
export const FriendLocationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Friend location with optional distance.\nUse for displaying friends on a map.","block":true},"name":{"kind":"Name","value":"FriendLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FriendLocation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"distanceKm"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode;
export const FriendsLocationsConnectionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Friends locations connection.","block":true},"name":{"kind":"Name","value":"FriendsLocationsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FriendsLocationsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FriendLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Friend location with optional distance.\nUse for displaying friends on a map.","block":true},"name":{"kind":"Name","value":"FriendLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FriendLocation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"distanceKm"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]} as unknown as DocumentNode;
export const TripFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const TripPaginationInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Trip pagination info.","block":true},"name":{"kind":"Name","value":"TripPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TripPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const TripListResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Trip list result.","block":true},"name":{"kind":"Name","value":"TripListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TripListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripPaginationInfoFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Trip pagination info.","block":true},"name":{"kind":"Name","value":"TripPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TripPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const SponsorFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const SponsorListResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Sponsor list result.","block":true},"name":{"kind":"Name","value":"SponsorListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SponsorListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const NotificationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const NotificationPaginationInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification pagination info.","block":true},"name":{"kind":"Name","value":"NotificationPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]} as unknown as DocumentNode;
export const MyNotificationsResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"My notifications result.","block":true},"name":{"kind":"Name","value":"MyNotificationsResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MyNotificationsResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationPaginationInfoFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification pagination info.","block":true},"name":{"kind":"Name","value":"NotificationPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]} as unknown as DocumentNode;
export const NotificationOffsetPaginationInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification offset pagination info.","block":true},"name":{"kind":"Name","value":"NotificationOffsetPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationOffsetPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const AllNotificationsResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notifications result (admin).","block":true},"name":{"kind":"Name","value":"AllNotificationsResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AllNotificationsResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationOffsetPaginationInfoFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification offset pagination info.","block":true},"name":{"kind":"Name","value":"NotificationOffsetPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationOffsetPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const CoinStatisticsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin statistics for a trip.","block":true},"name":{"kind":"Name","value":"CoinStatisticsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addedCoins"}},{"kind":"Field","name":{"kind":"Name","value":"removedCoins"}},{"kind":"Field","name":{"kind":"Name","value":"netBalance"}},{"kind":"Field","name":{"kind":"Name","value":"transactionCount"}},{"kind":"Field","name":{"kind":"Name","value":"time"}}]}}]} as unknown as DocumentNode;
export const CoinQuickStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin quick stats overview.","block":true},"name":{"kind":"Name","value":"CoinQuickStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinQuickStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCoins"}},{"kind":"Field","name":{"kind":"Name","value":"totalGroups"}},{"kind":"Field","name":{"kind":"Name","value":"averageCoinsPerGroup"}},{"kind":"Field","name":{"kind":"Name","value":"richestGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"richestGroupName"}},{"kind":"Field","name":{"kind":"Name","value":"time"}}]}}]} as unknown as DocumentNode;
export const FormattedUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Formatted user for stats displays.","block":true},"name":{"kind":"Name","value":"FormattedUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FormattedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transactionCount"}}]}}]} as unknown as DocumentNode;
export const CoinAdditionalInsightsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin additional insights.","block":true},"name":{"kind":"Name","value":"CoinAdditionalInsightsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinAdditionalInsights"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mostActiveAdmin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormattedUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentTransactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Formatted user for stats displays.","block":true},"name":{"kind":"Name","value":"FormattedUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FormattedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transactionCount"}}]}}]} as unknown as DocumentNode;
export const MostActiveAdminStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Most active admin stats.","block":true},"name":{"kind":"Name","value":"MostActiveAdminStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MostActiveAdminStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"adminName"}},{"kind":"Field","name":{"kind":"Name","value":"transactionCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmount"}}]}}]} as unknown as DocumentNode;
export const GroupRankingFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group fields for ranking displays.\nSame as GroupFields but on GroupRanking type.","block":true},"name":{"kind":"Name","value":"GroupRankingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupRanking"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const GroupRankingResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group ranking result.","block":true},"name":{"kind":"Name","value":"GroupRankingResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupRankingResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentDate"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupRankingFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group fields for ranking displays.\nSame as GroupFields but on GroupRanking type.","block":true},"name":{"kind":"Name","value":"GroupRankingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupRanking"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const DeliveryStatusBreakdownFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery status breakdown.","block":true},"name":{"kind":"Name","value":"DeliveryStatusBreakdownFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryStatusBreakdown"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"failure"}},{"kind":"Field","name":{"kind":"Name","value":"partialFailure"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}}]}}]} as unknown as DocumentNode;
export const DeliveryStatsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery statistics.","block":true},"name":{"kind":"Name","value":"DeliveryStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalDeliveries"}},{"kind":"Field","name":{"kind":"Name","value":"totalSuccess"}},{"kind":"Field","name":{"kind":"Name","value":"totalFailures"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgSuccessPerDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"avgFailuresPerDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"statusBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryStatusBreakdownFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery status breakdown.","block":true},"name":{"kind":"Name","value":"DeliveryStatusBreakdownFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryStatusBreakdown"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"failure"}},{"kind":"Field","name":{"kind":"Name","value":"partialFailure"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}}]}}]} as unknown as DocumentNode;
export const SubmissionVoteCountFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Submission vote count statistics.","block":true},"name":{"kind":"Name","value":"SubmissionVoteCountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionVoteCount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}}]}}]} as unknown as DocumentNode;
export const VotingProgressFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Voting progress for a challenge.","block":true},"name":{"kind":"Name","value":"VotingProgressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"VotingProgress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}},{"kind":"Field","name":{"kind":"Name","value":"submissionStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionVoteCountFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Submission vote count statistics.","block":true},"name":{"kind":"Name","value":"SubmissionVoteCountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionVoteCount"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}}]}}]} as unknown as DocumentNode;
export const AdminVotingInfoFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin voting info.","block":true},"name":{"kind":"Name","value":"AdminVotingInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminVotingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participantId"}},{"kind":"Field","name":{"kind":"Name","value":"hasVotedAll"}},{"kind":"Field","name":{"kind":"Name","value":"votedPositions"}}]}}]} as unknown as DocumentNode;
export const JudgedStaffVotingProgressFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Judged staff voting progress.","block":true},"name":{"kind":"Name","value":"JudgedStaffVotingProgressFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JudgedStaffVotingProgress"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allAdminsVoted"}},{"kind":"Field","name":{"kind":"Name","value":"totalAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"votedAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"pendingAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleSubmissionsCount"}},{"kind":"Field","name":{"kind":"Name","value":"requiredPositions"}},{"kind":"Field","name":{"kind":"Name","value":"adminProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminVotingInfoFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin voting info.","block":true},"name":{"kind":"Name","value":"AdminVotingInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminVotingInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participantId"}},{"kind":"Field","name":{"kind":"Name","value":"hasVotedAll"}},{"kind":"Field","name":{"kind":"Name","value":"votedPositions"}}]}}]} as unknown as DocumentNode;
export const CreateGroupPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create group payload.","block":true},"name":{"kind":"Name","value":"CreateGroupPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateGroupPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update group payload.","block":true},"name":{"kind":"Name","value":"UpdateGroupPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteGroupPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete group payload.","block":true},"name":{"kind":"Name","value":"DeleteGroupPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteGroupPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const RewardFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const CreateRewardPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create reward payload.","block":true},"name":{"kind":"Name","value":"CreateRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateRewardPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update reward payload.","block":true},"name":{"kind":"Name","value":"UpdateRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteRewardPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete reward payload.","block":true},"name":{"kind":"Name","value":"DeleteRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"deletedRewardId"}}]}}]} as unknown as DocumentNode;
export const SetRewardHiddenPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Set reward hidden payload.","block":true},"name":{"kind":"Name","value":"SetRewardHiddenPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SetRewardHiddenPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previousHidden"}},{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const PurchaseRewardPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Purchase reward payload.","block":true},"name":{"kind":"Name","value":"PurchaseRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"remainingGroupCoins"}},{"kind":"Field","name":{"kind":"Name","value":"remainingRewardQuantity"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}}]} as unknown as DocumentNode;
export const UpdatePurchaseStatusPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update purchase status payload.","block":true},"name":{"kind":"Name","value":"UpdatePurchaseStatusPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePurchaseStatusPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}},{"kind":"Field","name":{"kind":"Name","value":"refunded"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateMyPurchaseStatusPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update my purchase status payload.","block":true},"name":{"kind":"Name","value":"UpdateMyPurchaseStatusPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMyPurchaseStatusPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}}]} as unknown as DocumentNode;
export const CreateSponsorPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create sponsor payload.","block":true},"name":{"kind":"Name","value":"CreateSponsorPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSponsorPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateSponsorPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update sponsor payload.","block":true},"name":{"kind":"Name","value":"UpdateSponsorPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSponsorPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteSponsorPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete sponsor payload.","block":true},"name":{"kind":"Name","value":"DeleteSponsorPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteSponsorPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]} as unknown as DocumentNode;
export const LinkSponsorToTripPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Link sponsor to trip payload.","block":true},"name":{"kind":"Name","value":"LinkSponsorToTripPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkSponsorToTripPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linked"}},{"kind":"Field","name":{"kind":"Name","value":"sponsorId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}}]} as unknown as DocumentNode;
export const UnlinkSponsorFromTripPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Unlink sponsor from trip payload.","block":true},"name":{"kind":"Name","value":"UnlinkSponsorFromTripPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnlinkSponsorFromTripPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinked"}},{"kind":"Field","name":{"kind":"Name","value":"sponsorId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}}]} as unknown as DocumentNode;
export const CreateNotificationResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create notification result.","block":true},"name":{"kind":"Name","value":"CreateNotificationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNotificationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update notification result.","block":true},"name":{"kind":"Name","value":"UpdateNotificationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteNotificationResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete notification result.","block":true},"name":{"kind":"Name","value":"DeleteNotificationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteNotificationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationStatusResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update notification status result.","block":true},"name":{"kind":"Name","value":"UpdateNotificationStatusResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationStatusResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}},{"kind":"Field","name":{"kind":"Name","value":"newStatus"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const NotificationScheduleFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const CreateNotificationSchedulePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create notification schedule payload.","block":true},"name":{"kind":"Name","value":"CreateNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationSchedulePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update notification schedule payload.","block":true},"name":{"kind":"Name","value":"UpdateNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteNotificationSchedulePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete notification schedule payload.","block":true},"name":{"kind":"Name","value":"DeleteNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"deletedExecutionCount"}}]}}]} as unknown as DocumentNode;
export const DuplicateNotificationSchedulePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Duplicate notification schedule payload.","block":true},"name":{"kind":"Name","value":"DuplicateNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DuplicateNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const ToggleScheduleActivePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Toggle schedule active payload.","block":true},"name":{"kind":"Name","value":"ToggleScheduleActivePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ToggleScheduleActivePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const BulkToggleActivePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Bulk toggle active payload.","block":true},"name":{"kind":"Name","value":"BulkToggleActivePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BulkToggleActivePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"updatedCount"}}]}}]} as unknown as DocumentNode;
export const BulkDeleteNotificationSchedulesPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Bulk delete notification schedules payload.","block":true},"name":{"kind":"Name","value":"BulkDeleteNotificationSchedulesPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BulkDeleteNotificationSchedulesPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"requestedCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedCount"}},{"kind":"Field","name":{"kind":"Name","value":"notFoundIds"}}]}}]} as unknown as DocumentNode;
export const UpdateLastRunPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update last run payload.","block":true},"name":{"kind":"Name","value":"UpdateLastRunPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLastRunPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const SendMobileNotificationsPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Send mobile notifications payload.","block":true},"name":{"kind":"Name","value":"SendMobileNotificationsPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SendMobileNotificationsPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"sent"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const TrackDeliveryStartPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Track delivery start payload.","block":true},"name":{"kind":"Name","value":"TrackDeliveryStartPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TrackDeliveryStartPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const TrackDeliveryCompletePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Track delivery complete payload.","block":true},"name":{"kind":"Name","value":"TrackDeliveryCompletePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TrackDeliveryCompletePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const TrackDeliveryFailurePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Track delivery failure payload.","block":true},"name":{"kind":"Name","value":"TrackDeliveryFailurePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TrackDeliveryFailurePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const DeleteActivityResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete activity result.","block":true},"name":{"kind":"Name","value":"DeleteActivityResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteActivityResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const ReactionCountsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reaction counts by type.","block":true},"name":{"kind":"Name","value":"ReactionCountsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clap"}},{"kind":"Field","name":{"kind":"Name","value":"fire"}},{"kind":"Field","name":{"kind":"Name","value":"heart"}},{"kind":"Field","name":{"kind":"Name","value":"star"}}]}}]} as unknown as DocumentNode;
export const ReactionsSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reactions summary on activities.","block":true},"name":{"kind":"Name","value":"ReactionsSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionsSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"myReactions"}},{"kind":"Field","name":{"kind":"Name","value":"counts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ReactionCountsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reaction counts by type.","block":true},"name":{"kind":"Name","value":"ReactionCountsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clap"}},{"kind":"Field","name":{"kind":"Name","value":"fire"}},{"kind":"Field","name":{"kind":"Name","value":"heart"}},{"kind":"Field","name":{"kind":"Name","value":"star"}}]}}]} as unknown as DocumentNode;
export const ToggleReactionResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Toggle reaction result.","block":true},"name":{"kind":"Name","value":"ToggleReactionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ToggleReactionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityId"}},{"kind":"Field","name":{"kind":"Name","value":"reactionType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"reactionsSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ReactionsSummaryFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reaction counts by type.","block":true},"name":{"kind":"Name","value":"ReactionCountsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clap"}},{"kind":"Field","name":{"kind":"Name","value":"fire"}},{"kind":"Field","name":{"kind":"Name","value":"heart"}},{"kind":"Field","name":{"kind":"Name","value":"star"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reactions summary on activities.","block":true},"name":{"kind":"Name","value":"ReactionsSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionsSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"myReactions"}},{"kind":"Field","name":{"kind":"Name","value":"counts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ReactionCountsFields"}}]}}]}}]} as unknown as DocumentNode;
export const SubmitVotePayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Submit vote payload.","block":true},"name":{"kind":"Name","value":"SubmitVotePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitVotePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const SubmitVotesPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Submit votes payload.","block":true},"name":{"kind":"Name","value":"SubmitVotesPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitVotesPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalVotesCast"}},{"kind":"Field","name":{"kind":"Name","value":"votes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const ForceEndVotingPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Force end voting payload.","block":true},"name":{"kind":"Name","value":"ForceEndVotingPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ForceEndVotingPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"challengeStatus"}},{"kind":"Field","name":{"kind":"Name","value":"finalized"}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}}]}}]} as unknown as DocumentNode;
export const DeleteTripResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete trip result.","block":true},"name":{"kind":"Name","value":"DeleteTripResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteTripResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const SharingUserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const LocationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const UpdateLocationPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update location payload.","block":true},"name":{"kind":"Name","value":"UpdateLocationPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLocationPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const LocationSharingSettingsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Location sharing settings.","block":true},"name":{"kind":"Name","value":"LocationSharingSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LocationSharingSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const UpdateSharingSettingsPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update sharing settings payload.","block":true},"name":{"kind":"Name","value":"UpdateSharingSettingsPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSharingSettingsPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationSharingSettingsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Location sharing settings.","block":true},"name":{"kind":"Name","value":"LocationSharingSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LocationSharingSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const SharingUserPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Sharing user payload.","block":true},"name":{"kind":"Name","value":"SharingUserPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const TotalAvailablePointsPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Total available points payload.","block":true},"name":{"kind":"Name","value":"TotalAvailablePointsPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TotalAvailablePointsPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}}]}}]} as unknown as DocumentNode;
export const CheckInactiveUsersPayloadFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Check inactive users payload.","block":true},"name":{"kind":"Name","value":"CheckInactiveUsersPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CheckInactiveUsersPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checked"}},{"kind":"Field","name":{"kind":"Name","value":"notified"}},{"kind":"Field","name":{"kind":"Name","value":"skipped"}},{"kind":"Field","name":{"kind":"Name","value":"errors"}}]}}]} as unknown as DocumentNode;
export const DownloadUrlResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Download URL result.","block":true},"name":{"kind":"Name","value":"DownloadUrlResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DownloadUrlResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"signedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]} as unknown as DocumentNode;
export const UploadUrlResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Upload URL result.","block":true},"name":{"kind":"Name","value":"UploadUrlResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UploadUrlResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bucket"}},{"kind":"Field","name":{"kind":"Name","value":"storagePath"}},{"kind":"Field","name":{"kind":"Name","value":"objectPath"}},{"kind":"Field","name":{"kind":"Name","value":"resumableUrl"}},{"kind":"Field","name":{"kind":"Name","value":"token"}}]}}]} as unknown as DocumentNode;
export const PublicUrlResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Public URL result.","block":true},"name":{"kind":"Name","value":"PublicUrlResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PublicUrlResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publicUrl"}}]}}]} as unknown as DocumentNode;
export const ExecutionHistoryNotificationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification info in execution history.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryNotification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const ExecutionHistoryEntryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Execution history entry for schedules.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executedAt"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification info in execution history.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryNotification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const ExecutionHistoryResultFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Execution history result.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExecutionHistoryEntryFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Execution history entry for schedules.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executedAt"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification info in execution history.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryNotification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const GetActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const GetActivitiesByTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivitiesByTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityCursorInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activitiesByTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"cursor"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cursor"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityCursorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaginationInfoFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Standard pagination info.","block":true},"name":{"kind":"Name","value":"PaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Activity cursor for pagination.","block":true},"name":{"kind":"Name","value":"ActivityCursorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityCursor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]} as unknown as DocumentNode;
export const GetActivitiesByTripModerationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivitiesByTripModeration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeHidden"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activitiesByTripModeration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ModerationPaginationInfoFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Moderation pagination info.","block":true},"name":{"kind":"Name","value":"ModerationPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ModerationPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]} as unknown as DocumentNode;
export const CreateCustomActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCustomActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCustomActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCustomActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const CreateRankChangeActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRankChangeActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRankChangeActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRankChangeActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const CreateSubmissionActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSubmissionActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSubmissionActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubmissionActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const UpdateActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const DeleteActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeleteActivityResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete activity result.","block":true},"name":{"kind":"Name","value":"DeleteActivityResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteActivityResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const HideActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"HideActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hideActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HiddenActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Hidden activity result fields (includes hide metadata).","block":true},"name":{"kind":"Name","value":"HiddenActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HiddenActivityResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"hiddenAt"}},{"kind":"Field","name":{"kind":"Name","value":"hiddenReason"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UnhideActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnhideActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unhideActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const SetActivityPinnedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetActivityPinned"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPinned"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setActivityPinned"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isPinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPinned"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const ToggleActivityReactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ToggleActivityReaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reaction"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleActivityReaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"activityId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"activityId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"reactionType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reaction"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ToggleReactionResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reaction counts by type.","block":true},"name":{"kind":"Name","value":"ReactionCountsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionCounts"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clap"}},{"kind":"Field","name":{"kind":"Name","value":"fire"}},{"kind":"Field","name":{"kind":"Name","value":"heart"}},{"kind":"Field","name":{"kind":"Name","value":"star"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reactions summary on activities.","block":true},"name":{"kind":"Name","value":"ReactionsSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReactionsSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"myReactions"}},{"kind":"Field","name":{"kind":"Name","value":"counts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ReactionCountsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Toggle reaction result.","block":true},"name":{"kind":"Name","value":"ToggleReactionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ToggleReactionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityId"}},{"kind":"Field","name":{"kind":"Name","value":"reactionType"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"reactionsSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ReactionsSummaryFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetChallengeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChallenge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challenge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge fields including configuration and scheduling.\nUse for challenge details, editing, and administration.","block":true},"name":{"kind":"Name","value":"ChallengeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Challenge"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"submissionType"}},{"kind":"Field","name":{"kind":"Name","value":"scoringCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basePoints"}},{"kind":"Field","name":{"kind":"Name","value":"firstPlacePoints"}},{"kind":"Field","name":{"kind":"Name","value":"secondPlacePoints"}},{"kind":"Field","name":{"kind":"Name","value":"thirdPlacePoints"}},{"kind":"Field","name":{"kind":"Name","value":"isRecurring"}},{"kind":"Field","name":{"kind":"Name","value":"dailyStartTime"}},{"kind":"Field","name":{"kind":"Name","value":"dailyEndTime"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"targetLatitude"}},{"kind":"Field","name":{"kind":"Name","value":"targetLongitude"}},{"kind":"Field","name":{"kind":"Name","value":"expectedValue"}},{"kind":"Field","name":{"kind":"Name","value":"autoApprove"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isOpenForSubmission"}},{"kind":"Field","name":{"kind":"Name","value":"hasVotingPhase"}},{"kind":"Field","name":{"kind":"Name","value":"requiresLocation"}},{"kind":"Field","name":{"kind":"Name","value":"requiresQRCode"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const GetChallengesByTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChallengesByTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"30"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengesByTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challenges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSummaryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal challenge fields for lists and summary views.\nUse when you only need basic challenge information.","block":true},"name":{"kind":"Name","value":"ChallengeSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"submissionType"}},{"kind":"Field","name":{"kind":"Name","value":"scoringCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basePoints"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const GetChallengeSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChallengeSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSubmissionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge submission fields.\nUse for submission details, review, and voting.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const GetChallengeSubmissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChallengeSubmissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionOrderBy"}},"defaultValue":{"kind":"EnumValue","value":"voteScore"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OrderDirection"}},"defaultValue":{"kind":"EnumValue","value":"desc"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeSubmissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderDirection"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderDirection"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSubmissionFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge submission fields.\nUse for submission details, review, and voting.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const GetChallengeSubmissionByChallengeAndGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetChallengeSubmissionByChallengeAndGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeSubmissionByChallengeAndGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"Argument","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSubmissionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge submission fields.\nUse for submission details, review, and voting.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const GetVotesByChallengeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVotesByChallenge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votesByChallenge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueVoters"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const GetMyVotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyVotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myVotes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const GetVotingProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetVotingProgress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votingProgress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}},{"kind":"Field","name":{"kind":"Name","value":"submissionStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetJudgedStaffVotingProgressDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetJudgedStaffVotingProgress"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminParticipantIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"eligibleSubmissionsCount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requiredPositions"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgedStaffVotingProgress"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"adminParticipantIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminParticipantIds"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"eligibleSubmissionsCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"eligibleSubmissionsCount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"requiredPositions"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requiredPositions"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allAdminsVoted"}},{"kind":"Field","name":{"kind":"Name","value":"eligibleSubmissionsCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"requiredPositions"}},{"kind":"Field","name":{"kind":"Name","value":"totalAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"votedAdmins"}},{"kind":"Field","name":{"kind":"Name","value":"adminProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"participantId"}},{"kind":"Field","name":{"kind":"Name","value":"hasVotedAll"}},{"kind":"Field","name":{"kind":"Name","value":"votedPositions"}}]}}]}}]}}]} as unknown as DocumentNode;
export const CreateChallengeSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChallengeSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSubmissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChallengeSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSubmissionCreateResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Challenge submission create result fields.\nSame as ChallengeSubmission but on create result type.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionCreateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmissionCreateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const UpdateChallengeSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateChallengeSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSubmissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateChallengeSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSubmissionUpdateResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Challenge submission update result fields.\nSame fields on update result type.","block":true},"name":{"kind":"Name","value":"ChallengeSubmissionUpdateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSubmissionUpdateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"textContent"}},{"kind":"Field","name":{"kind":"Name","value":"imageIds"}},{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"hasMedia"}},{"kind":"Field","name":{"kind":"Name","value":"hasLocation"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"awardedPoints"}},{"kind":"Field","name":{"kind":"Name","value":"bonusPoints"}},{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}},{"kind":"Field","name":{"kind":"Name","value":"ranking"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedById"}},{"kind":"Field","name":{"kind":"Name","value":"reviewedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReviewerFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reviewedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rejectionReason"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionGroupInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"image"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reviewer info embedded in submissions.","block":true},"name":{"kind":"Name","value":"SubmissionReviewerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReviewerInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]} as unknown as DocumentNode;
export const DeleteChallengeSubmissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteChallengeSubmission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteChallengeSubmission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"submissionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode;
export const CreateChallengeActivityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChallengeActivity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateChallengeActivityInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChallengeActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All activity fields for feed items.\nUse for activity feeds, posts, and challenge events.","block":true},"name":{"kind":"Name","value":"ActivityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Activity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ActivityAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin information embedded in activities.","block":true},"name":{"kind":"Name","value":"ActivityAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActivityAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const SubmitVoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitVote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitVoteInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitVote"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"vote"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const SubmitVotesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitVotes"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitVotesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitVotes"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"votes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeVoteFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalVotesCast"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All challenge vote fields.\nUse for voting displays and results.","block":true},"name":{"kind":"Name","value":"ChallengeVoteFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeVote"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voterId"}},{"kind":"Field","name":{"kind":"Name","value":"votePosition"}},{"kind":"Field","name":{"kind":"Name","value":"votePoints"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedWeight"}},{"kind":"Field","name":{"kind":"Name","value":"votedAt"}}]}}]} as unknown as DocumentNode;
export const ForceEndVotingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ForceEndVoting"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"forceEndVoting"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"finalized"}},{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"challengeStatus"}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}}]}}]}}]} as unknown as DocumentNode;
export const CreateChallengeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChallenge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateChallengeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChallenge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challenge"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSummaryFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal challenge fields for lists and summary views.\nUse when you only need basic challenge information.","block":true},"name":{"kind":"Name","value":"ChallengeSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"submissionType"}},{"kind":"Field","name":{"kind":"Name","value":"scoringCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basePoints"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const UpdateChallengeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateChallenge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateChallengeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateChallenge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challenge"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChallengeSummaryFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal challenge fields for lists and summary views.\nUse when you only need basic challenge information.","block":true},"name":{"kind":"Name","value":"ChallengeSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ChallengeSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"submissionType"}},{"kind":"Field","name":{"kind":"Name","value":"scoringCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basePoints"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const GetCoinStatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCoinStatistics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coinStatistics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinStatisticsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin statistics for a trip.","block":true},"name":{"kind":"Name","value":"CoinStatisticsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addedCoins"}},{"kind":"Field","name":{"kind":"Name","value":"removedCoins"}},{"kind":"Field","name":{"kind":"Name","value":"netBalance"}},{"kind":"Field","name":{"kind":"Name","value":"transactionCount"}},{"kind":"Field","name":{"kind":"Name","value":"time"}}]}}]} as unknown as DocumentNode;
export const GetCoinQuickStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCoinQuickStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coinQuickStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinQuickStatsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin quick stats overview.","block":true},"name":{"kind":"Name","value":"CoinQuickStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinQuickStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCoins"}},{"kind":"Field","name":{"kind":"Name","value":"totalGroups"}},{"kind":"Field","name":{"kind":"Name","value":"averageCoinsPerGroup"}},{"kind":"Field","name":{"kind":"Name","value":"richestGroupId"}},{"kind":"Field","name":{"kind":"Name","value":"richestGroupName"}},{"kind":"Field","name":{"kind":"Name","value":"time"}}]}}]} as unknown as DocumentNode;
export const GetCoinAdditionalInsightsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCoinAdditionalInsights"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coinAdditionalInsights"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinAdditionalInsightsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin additional insights.","block":true},"name":{"kind":"Name","value":"CoinAdditionalInsightsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinAdditionalInsights"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mostActiveAdmin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FormattedUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentTransactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Formatted user for stats displays.","block":true},"name":{"kind":"Name","value":"FormattedUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FormattedUser"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"transactionCount"}}]}}]} as unknown as DocumentNode;
export const GetCoinTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCoinTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"coinTransactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionsConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transaction pagination.","block":true},"name":{"kind":"Name","value":"CoinTransactionPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transactions connection.","block":true},"name":{"kind":"Name","value":"CoinTransactionsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionPaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetMyCoinTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMyCoinTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myCoinTransactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"groupId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}}]} as unknown as DocumentNode;
export const AddCoinsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddCoins"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddCoinsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addCoins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transaction result (with embedded transaction).","block":true},"name":{"kind":"Name","value":"CoinTransactionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"transaction"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}}]}}]} as unknown as DocumentNode;
export const RemoveCoinsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveCoins"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoveCoinsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeCoins"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All coin transaction fields.\nUse for coin history and financial tracking.","block":true},"name":{"kind":"Name","value":"CoinTransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionGroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionAdminFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Admin info in coin transaction context.","block":true},"name":{"kind":"Name","value":"CoinTransactionAdminFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Coin transaction result (with embedded transaction).","block":true},"name":{"kind":"Name","value":"CoinTransactionResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CoinTransactionResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"transaction"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CoinTransactionFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetGroupByCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroupByCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupByCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GroupPaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetGroupsByTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroupsByTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GroupPaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupsByTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetGroupsByOrganizerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroupsByOrganizer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupsByOrganizer"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"organizerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizerId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetGroupNamesByTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroupNamesByTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupNamesByTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupSummaryFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal group fields for lists and references.","block":true},"name":{"kind":"Name","value":"GroupSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]} as unknown as DocumentNode;
export const GetGroupRankingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetGroupRanking"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"groupRanking"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentDate"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupRankingFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Group fields for ranking displays.\nSame as GroupFields but on GroupRanking type.","block":true},"name":{"kind":"Name","value":"GroupRankingFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"GroupRanking"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const CreateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"GroupFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All group fields including coins and status.\nUse for group details, rankings, and management.","block":true},"name":{"kind":"Name","value":"GroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Group"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"coins"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"organizerId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteGroupDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteGroup"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteGroup"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode;
export const AddUserToSharingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserToSharing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserToSharing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const RemoveUserFromSharingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserFromSharing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"groupId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserFromSharing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const UpdateSharingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSharingSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSharingSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSharingSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetMyLocationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get current user's location.\nReturns: Location object or null if not set.","block":true},"name":{"kind":"Name","value":"GetMyLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const GetMySharingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get current user's location sharing settings.\nReturns: Sharing settings including enabled status and users to share with.","block":true},"name":{"kind":"Name","value":"GetMySharingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mySharingSettings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationSharingSettingsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Location sharing settings.","block":true},"name":{"kind":"Name","value":"LocationSharingSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LocationSharingSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const GetFriendsLocationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get friends' locations.\nReturns: Connection of friend locations for the current user.","block":true},"name":{"kind":"Name","value":"GetFriendsLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"friendsLocations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FriendsLocationsConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Friend location with optional distance.\nUse for displaying friends on a map.","block":true},"name":{"kind":"Name","value":"FriendLocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FriendLocation"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"distanceKm"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Friends locations connection.","block":true},"name":{"kind":"Name","value":"FriendsLocationsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FriendsLocationsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"FriendLocationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const UpdateLocationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update current user's location.\nRequires: latitude, longitude. Optional: accuracy, altitude, etc.\nReturns: Updated location.","block":true},"name":{"kind":"Name","value":"UpdateLocation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLocationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLocation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateLocationPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update location payload.","block":true},"name":{"kind":"Name","value":"UpdateLocationPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLocationPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdateLocationSharingSettingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update location sharing settings.\nRequires: isSharingLocation boolean.\nOptional: userIdsToShareWith list.\nReturns: Updated sharing settings.","block":true},"name":{"kind":"Name","value":"UpdateLocationSharingSettings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSharingSettingsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSharingSettings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateSharingSettingsPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Location sharing settings.","block":true},"name":{"kind":"Name","value":"LocationSharingSettingsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LocationSharingSettings"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update sharing settings payload.","block":true},"name":{"kind":"Name","value":"UpdateSharingSettingsPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSharingSettingsPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"settings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationSharingSettingsFields"}}]}}]}}]} as unknown as DocumentNode;
export const AddUserToLocationSharingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Add a user to location sharing list.\nRequires: userId to add.\nReturns: Location with updated sharing list.","block":true},"name":{"kind":"Name","value":"AddUserToLocationSharing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddSharingUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addUserToSharing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const RemoveUserFromLocationSharingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Remove a user from location sharing list.\nRequires: userId to remove.\nReturns: Location with updated sharing list.","block":true},"name":{"kind":"Name","value":"RemoveUserFromLocationSharing"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RemoveSharingUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeUserFromSharing"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LocationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All location fields including coordinates and movement data.\nUse for location tracking and maps.","block":true},"name":{"kind":"Name","value":"LocationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Location"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"altitudeAccuracy"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"usersToShareWith"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SharingUserFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info for location sharing.","block":true},"name":{"kind":"Name","value":"SharingUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SharingUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}}]} as unknown as DocumentNode;
export const GetNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get a single notification by ID (admin only).\nRequires: ID of notification to fetch.\nReturns: Full notification details.","block":true},"name":{"kind":"Name","value":"GetNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetMyNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get current user's notifications with pagination.\nOptional: page number and items per page.\nReturns: Paginated list of user's notifications.","block":true},"name":{"kind":"Name","value":"GetMyNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"perPage"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MyNotificationsResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification pagination info.","block":true},"name":{"kind":"Name","value":"NotificationPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"pageSize"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"My notifications result.","block":true},"name":{"kind":"Name","value":"MyNotificationsResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MyNotificationsResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationPaginationInfoFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetAllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get all notifications with pagination (admin only).\nOptional: limit, offset for pagination, tripId for filtering.\nReturns: Paginated list of all notifications.","block":true},"name":{"kind":"Name","value":"GetAllNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AllNotificationsResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification offset pagination info.","block":true},"name":{"kind":"Name","value":"NotificationOffsetPaginationInfoFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationOffsetPaginationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notifications result (admin).","block":true},"name":{"kind":"Name","value":"AllNotificationsResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AllNotificationsResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationOffsetPaginationInfoFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetNotificationSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get notification schedules with filtering (moderator+).\nOptional: tripId to filter by trip, various filter options.\nReturns: Paginated list of notification schedules.","block":true},"name":{"kind":"Name","value":"GetNotificationSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationScheduleType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDateFrom"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDateTo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationType"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startDateFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDateFrom"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startDateTo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDateTo"}}}]}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationSchedulesConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Minimal schedule fields for lists.","block":true},"name":{"kind":"Name","value":"NotificationScheduleSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationScheduleSummary"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification schedule pagination.","block":true},"name":{"kind":"Name","value":"NotificationSchedulePaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedulePagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification schedules connection.","block":true},"name":{"kind":"Name","value":"NotificationSchedulesConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedulesConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleSummaryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationSchedulePaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetNotificationScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get a single notification schedule by ID (moderator+).\nRequires: ID of schedule to fetch.\nReturns: Full schedule details.","block":true},"name":{"kind":"Name","value":"GetNotificationSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetActiveNotificationSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get currently active notification schedules (moderator+).\nOptional: tripId and notificationType for filtering.\nReturns: List of schedules currently within their active window.","block":true},"name":{"kind":"Name","value":"GetActiveNotificationSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationScheduleType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeNotificationSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"Argument","name":{"kind":"Name","value":"notificationType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetUpcomingNotificationSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get upcoming notification schedules within a time window (moderator+).\nRequires: time window in minutes (default 30).\nOptional: tripId for filtering.\nReturns: List of schedules that will run soon.","block":true},"name":{"kind":"Name","value":"GetUpcomingNotificationSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withinMinutes"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"30"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upcomingNotificationSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"withinMinutes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withinMinutes"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetNotificationScheduleExecutionHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get execution history for a notification schedule (moderator+).\nRequires: ID of the schedule.\nOptional: pagination parameters.\nReturns: List of execution history entries.","block":true},"name":{"kind":"Name","value":"GetNotificationScheduleExecutionHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scheduleId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationScheduleExecutionHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"scheduleId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scheduleId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExecutionHistoryResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Execution history entry for schedules.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryEntryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryEntry"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"executedAt"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification info in execution history.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryNotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryNotification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Execution history result.","block":true},"name":{"kind":"Name","value":"ExecutionHistoryResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ExecutionHistoryResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ExecutionHistoryEntryFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetNotificationDeliveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get notification deliveries with optional filters (moderator+).\nOptional: notificationId, scheduleId, tripId, status, date range, pagination.\nReturns: Paginated list of delivery records.","block":true},"name":{"kind":"Name","value":"GetNotificationDeliveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scheduleId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryStatus"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationDeliveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"scheduleId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scheduleId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationDeliveryListResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification with creator info (for admin views).","block":true},"name":{"kind":"Name","value":"NotificationWithCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification delivery fields.\nUse for delivery tracking and monitoring.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDelivery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryCompletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successCount"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"errorLog"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationWithCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery pagination.","block":true},"name":{"kind":"Name","value":"DeliveryPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification delivery list result.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDeliveryListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationDeliveryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryPaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetNotificationDeliveryByNotificationIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get a notification delivery by notification ID (moderator+).\nRequires: notificationId and tripId.\nReturns: Delivery record for the specified notification.","block":true},"name":{"kind":"Name","value":"GetNotificationDeliveryByNotificationId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationDeliveryByNotificationId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationDeliveryFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification with creator info (for admin views).","block":true},"name":{"kind":"Name","value":"NotificationWithCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification delivery fields.\nUse for delivery tracking and monitoring.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDelivery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryCompletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successCount"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"errorLog"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationWithCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetFailedDeliveriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get failed notification deliveries (moderator+).\nOptional: tripId for filtering, limit and offset for pagination.\nReturns: Paginated list of failed deliveries.","block":true},"name":{"kind":"Name","value":"GetFailedDeliveries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"failedDeliveries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationDeliveryListResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification with creator info (for admin views).","block":true},"name":{"kind":"Name","value":"NotificationWithCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification creator info.","block":true},"name":{"kind":"Name","value":"NotificationCreatorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationCreator"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification delivery fields.\nUse for delivery tracking and monitoring.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDelivery"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"notificationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryStartedAt"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryCompletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successCount"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"errorLog"}},{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationWithCreatorFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery pagination.","block":true},"name":{"kind":"Name","value":"DeliveryPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Notification delivery list result.","block":true},"name":{"kind":"Name","value":"NotificationDeliveryListResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationDeliveryListResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationDeliveryFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryPaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetDeliveryStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get delivery statistics (moderator+).\nOptional: tripId, scheduleId, date range filters.\nReturns: Comprehensive delivery statistics.","block":true},"name":{"kind":"Name","value":"GetDeliveryStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"scheduleId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveryStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"scheduleId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"scheduleId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryStatsFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery statistics.","block":true},"name":{"kind":"Name","value":"DeliveryStatsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryStats"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalDeliveries"}},{"kind":"Field","name":{"kind":"Name","value":"totalSuccess"}},{"kind":"Field","name":{"kind":"Name","value":"totalFailures"}},{"kind":"Field","name":{"kind":"Name","value":"totalRecipients"}},{"kind":"Field","name":{"kind":"Name","value":"successRate"}},{"kind":"Field","name":{"kind":"Name","value":"avgSuccessPerDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"avgFailuresPerDelivery"}},{"kind":"Field","name":{"kind":"Name","value":"statusBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryStatusBreakdownFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delivery status breakdown.","block":true},"name":{"kind":"Name","value":"DeliveryStatusBreakdownFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryStatusBreakdown"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"failure"}},{"kind":"Field","name":{"kind":"Name","value":"partialFailure"}},{"kind":"Field","name":{"kind":"Name","value":"pending"}}]}}]} as unknown as DocumentNode;
export const CreateNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Create a new notification (moderator only).\nRequires: title, body. Optional: priority, tripId, url.\nReturns: The created notification.","block":true},"name":{"kind":"Name","value":"CreateNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"body"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"priority"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPriority"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"body"},"value":{"kind":"Variable","name":{"kind":"Name","value":"body"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"priority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"priority"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CreateNotificationResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create notification result.","block":true},"name":{"kind":"Name","value":"CreateNotificationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNotificationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update an existing notification (admin only).\nRequires: notificationId. Optional: title, body, priority, url.\nReturns: The updated notification.","block":true},"name":{"kind":"Name","value":"UpdateNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"body"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"priority"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationPriority"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"url"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"body"},"value":{"kind":"Variable","name":{"kind":"Name","value":"body"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"priority"},"value":{"kind":"Variable","name":{"kind":"Name","value":"priority"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"url"},"value":{"kind":"Variable","name":{"kind":"Name","value":"url"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateNotificationResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update notification result.","block":true},"name":{"kind":"Name","value":"UpdateNotificationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}}]} as unknown as DocumentNode;
export const DeleteNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Delete a notification (admin only).\nRequires: notificationId.\nReturns: Success status.","block":true},"name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeleteNotificationResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete notification result.","block":true},"name":{"kind":"Name","value":"DeleteNotificationResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteNotificationResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const CreateNotificationScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Create a new notification schedule (admin only).\nRequires: name, hour, minute, startDate, endDate, notificationType.\nOptional: isActive, notificationTitle, notificationBody, notificationUrl, tripId.\nReturns: The created schedule.","block":true},"name":{"kind":"Name","value":"CreateNotificationSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hour"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"minute"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationScheduleType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationTitle"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationBody"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNotificationSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"hour"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hour"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"minute"},"value":{"kind":"Variable","name":{"kind":"Name","value":"minute"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationType"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationTitle"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationTitle"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationBody"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationBody"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationUrl"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CreateNotificationSchedulePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create notification schedule payload.","block":true},"name":{"kind":"Name","value":"CreateNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update an existing notification schedule (admin only).\nRequires: id. Optional: name, hour, minute, startDate, endDate,\nnotificationType, isActive, notificationTitle, notificationBody, notificationUrl.\nReturns: The updated schedule.","block":true},"name":{"kind":"Name","value":"UpdateNotificationSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hour"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"minute"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationTitle"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationBody"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationUrl"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotificationSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"hour"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hour"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"minute"},"value":{"kind":"Variable","name":{"kind":"Name","value":"minute"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationTitle"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationTitle"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationBody"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationBody"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"notificationUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationUrl"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateNotificationSchedulePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update notification schedule payload.","block":true},"name":{"kind":"Name","value":"UpdateNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}}]} as unknown as DocumentNode;
export const DeleteNotificationScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Delete a notification schedule (admin only).\nRequires: id.\nReturns: Success status and deletion count.","block":true},"name":{"kind":"Name","value":"DeleteNotificationSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotificationSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeleteNotificationSchedulePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete notification schedule payload.","block":true},"name":{"kind":"Name","value":"DeleteNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"deletedExecutionCount"}}]}}]} as unknown as DocumentNode;
export const DuplicateNotificationScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Duplicate a notification schedule (admin only).\nRequires: id of schedule to duplicate.\nReturns: The duplicated schedule.","block":true},"name":{"kind":"Name","value":"DuplicateNotificationSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duplicateNotificationSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DuplicateNotificationSchedulePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Duplicate notification schedule payload.","block":true},"name":{"kind":"Name","value":"DuplicateNotificationSchedulePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DuplicateNotificationSchedulePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}}]} as unknown as DocumentNode;
export const ToggleNotificationScheduleActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Toggle the active status of a notification schedule (admin only).\nRequires: id of schedule to toggle.\nReturns: Schedule with updated active status.","block":true},"name":{"kind":"Name","value":"ToggleNotificationScheduleActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"toggleNotificationScheduleActive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ToggleScheduleActivePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Toggle schedule active payload.","block":true},"name":{"kind":"Name","value":"ToggleScheduleActivePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ToggleScheduleActivePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}}]} as unknown as DocumentNode;
export const BulkToggleNotificationScheduleActiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Bulk toggle active status of multiple notification schedules (admin only).\nRequires: ids of schedules, isActive target status.\nReturns: Success status and count updated.","block":true},"name":{"kind":"Name","value":"BulkToggleNotificationScheduleActive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkToggleNotificationScheduleActive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}},{"kind":"Argument","name":{"kind":"Name","value":"isActive"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isActive"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BulkToggleActivePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Bulk toggle active payload.","block":true},"name":{"kind":"Name","value":"BulkToggleActivePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BulkToggleActivePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"updatedCount"}}]}}]} as unknown as DocumentNode;
export const BulkDeleteNotificationScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Bulk delete multiple notification schedules (admin only).\nRequires: ids of schedules to delete.\nReturns: Success status, counts, and any not-found IDs.","block":true},"name":{"kind":"Name","value":"BulkDeleteNotificationSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"bulkDeleteNotificationSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BulkDeleteNotificationSchedulesPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Bulk delete notification schedules payload.","block":true},"name":{"kind":"Name","value":"BulkDeleteNotificationSchedulesPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BulkDeleteNotificationSchedulesPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"requestedCount"}},{"kind":"Field","name":{"kind":"Name","value":"deletedCount"}},{"kind":"Field","name":{"kind":"Name","value":"notFoundIds"}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationScheduleLastRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update the last run timestamp of a schedule (moderator+).\nRequires: id, lastRunAt, lastRunStatus.\nOptional: lastRunError message.\nReturns: Schedule with updated last run info.","block":true},"name":{"kind":"Name","value":"UpdateNotificationScheduleLastRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastRunAt"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastRunStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LastRunStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"lastRunError"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotificationScheduleLastRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastRunAt"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastRunAt"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastRunStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastRunStatus"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"lastRunError"},"value":{"kind":"Variable","name":{"kind":"Name","value":"lastRunError"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateLastRunPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification schedule fields.\nUse for schedule management and automation.","block":true},"name":{"kind":"Name","value":"NotificationScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"notificationType"}},{"kind":"Field","name":{"kind":"Name","value":"notificationTitle"}},{"kind":"Field","name":{"kind":"Name","value":"notificationBody"}},{"kind":"Field","name":{"kind":"Name","value":"notificationUrl"}},{"kind":"Field","name":{"kind":"Name","value":"hour"}},{"kind":"Field","name":{"kind":"Name","value":"minute"}},{"kind":"Field","name":{"kind":"Name","value":"formattedTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentlyActive"}},{"kind":"Field","name":{"kind":"Name","value":"isExpired"}},{"kind":"Field","name":{"kind":"Name","value":"isUpcoming"}},{"kind":"Field","name":{"kind":"Name","value":"lastRun"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update last run payload.","block":true},"name":{"kind":"Name","value":"UpdateLastRunPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateLastRunPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationScheduleFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdateNotificationStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update the status of a notification (admin only).\nRequires: notificationId, newStatus.\nReturns: Notification with status change info.","block":true},"name":{"kind":"Name","value":"UpdateNotificationStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NotificationStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotificationStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateNotificationStatusResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All notification fields.\nUse for notification displays and management.","block":true},"name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"body"}},{"kind":"Field","name":{"kind":"Name","value":"isSent"}},{"kind":"Field","name":{"kind":"Name","value":"isScheduled"}},{"kind":"Field","name":{"kind":"Name","value":"isReadyToSend"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"scheduledFor"}},{"kind":"Field","name":{"kind":"Name","value":"sentAt"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update notification status result.","block":true},"name":{"kind":"Name","value":"UpdateNotificationStatusResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateNotificationStatusResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}},{"kind":"Field","name":{"kind":"Name","value":"newStatus"}}]}}]} as unknown as DocumentNode;
export const SendMobileNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Send mobile push notifications (admin only).\nRequires: notificationId.\nReturns: Send statistics (success, failed, total).","block":true},"name":{"kind":"Name","value":"SendMobileNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendMobileNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SendMobileNotificationsPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Send mobile notifications payload.","block":true},"name":{"kind":"Name","value":"SendMobileNotificationsPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SendMobileNotificationsPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"sent"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}}]} as unknown as DocumentNode;
export const TrackDeliveryStartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Track the start of a notification delivery (admin only).\nRequires: notificationId.\nReturns: Success status.","block":true},"name":{"kind":"Name","value":"TrackDeliveryStart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trackDeliveryStart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TrackDeliveryStartPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Track delivery start payload.","block":true},"name":{"kind":"Name","value":"TrackDeliveryStartPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TrackDeliveryStartPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const TrackDeliveryCompleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Track the completion of a notification delivery (admin only).\nRequires: notificationId, totalRecipients, successCount, failureCount.\nOptional: errors message.\nReturns: Success status.","block":true},"name":{"kind":"Name","value":"TrackDeliveryComplete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"totalRecipients"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"successCount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"failureCount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"errors"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trackDeliveryComplete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"totalRecipients"},"value":{"kind":"Variable","name":{"kind":"Name","value":"totalRecipients"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"successCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"successCount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"failureCount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"failureCount"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"errors"},"value":{"kind":"Variable","name":{"kind":"Name","value":"errors"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TrackDeliveryCompletePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Track delivery complete payload.","block":true},"name":{"kind":"Name","value":"TrackDeliveryCompletePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TrackDeliveryCompletePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const TrackDeliveryFailureDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Track a notification delivery failure (admin only).\nRequires: notificationId, error message.\nReturns: Success status.","block":true},"name":{"kind":"Name","value":"TrackDeliveryFailure"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"error"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trackDeliveryFailure"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"notificationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"notificationId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"error"},"value":{"kind":"Variable","name":{"kind":"Name","value":"error"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TrackDeliveryFailurePayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Track delivery failure payload.","block":true},"name":{"kind":"Name","value":"TrackDeliveryFailurePayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TrackDeliveryFailurePayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]} as unknown as DocumentNode;
export const GetRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get a single reward by its ID.\nReturns the reward with all fields including purchase tracking.","block":true},"name":{"kind":"Name","value":"GetReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetRewardsByTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get visible rewards for a specific trip.\nReturns rewards with dynamic calculations (affordability, dynamic cost).\nUse for user-facing reward displays.","block":true},"name":{"kind":"Name","value":"GetRewardsByTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"30"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rewardsByTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardsConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward with dynamic calculations.\nUse for user-facing reward displays.","block":true},"name":{"kind":"Name","value":"RewardWithCalculationsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardWithCalculations"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"dynamicCoinCost"}},{"kind":"Field","name":{"kind":"Name","value":"canAfford"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward pagination.","block":true},"name":{"kind":"Name","value":"RewardPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Rewards connection.","block":true},"name":{"kind":"Name","value":"RewardsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rewards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardWithCalculationsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetRewardsByTripAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get all rewards for a trip including hidden ones (admin only).\nReturns rewards with dynamic calculations for moderation purposes.","block":true},"name":{"kind":"Name","value":"GetRewardsByTripAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"30"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rewardsByTripAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardsConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward with dynamic calculations.\nUse for user-facing reward displays.","block":true},"name":{"kind":"Name","value":"RewardWithCalculationsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardWithCalculations"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"dynamicCoinCost"}},{"kind":"Field","name":{"kind":"Name","value":"canAfford"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward pagination.","block":true},"name":{"kind":"Name","value":"RewardPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Rewards connection.","block":true},"name":{"kind":"Name","value":"RewardsConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardsConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rewards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardWithCalculationsFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetPurchaseHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get purchase history for a trip.\nReturns all reward purchases with status, buyer info, and group info.","block":true},"name":{"kind":"Name","value":"GetPurchaseHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"30"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseHistoryConnectionFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward pagination.","block":true},"name":{"kind":"Name","value":"RewardPaginationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPagination"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"total"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Purchase history connection.","block":true},"name":{"kind":"Name","value":"PurchaseHistoryConnectionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseHistoryConnection"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPaginationFields"}}]}}]}}]} as unknown as DocumentNode;
export const GetTotalAvailablePointsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get total available points for a trip (admin only).\nReturns the total number of points available across all groups in the trip.","block":true},"name":{"kind":"Name","value":"GetTotalAvailablePoints"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalAvailablePoints"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TotalAvailablePointsPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Total available points payload.","block":true},"name":{"kind":"Name","value":"TotalAvailablePointsPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TotalAvailablePointsPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalPoints"}}]}}]} as unknown as DocumentNode;
export const CreateRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Create a new reward (moderator only).\nRequires: name, description, coinCost (percentage), availableQuantity, tripId.","block":true},"name":{"kind":"Name","value":"CreateReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRewardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createReward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CreateRewardPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create reward payload.","block":true},"name":{"kind":"Name","value":"CreateRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdateRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update an existing reward (moderator only).\nAll fields are optional; only provided fields will be updated.","block":true},"name":{"kind":"Name","value":"UpdateReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRewardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateReward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateRewardPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update reward payload.","block":true},"name":{"kind":"Name","value":"UpdateRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}}]} as unknown as DocumentNode;
export const DeleteRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Delete a reward (moderator only).\nReturns success status and the deleted reward ID.","block":true},"name":{"kind":"Name","value":"DeleteReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteReward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeleteRewardPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete reward payload.","block":true},"name":{"kind":"Name","value":"DeleteRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"deletedRewardId"}}]}}]} as unknown as DocumentNode;
export const PurchaseRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Purchase a reward (authenticated users).\nRequires rewardId and quantity. Returns purchase record and remaining balances.","block":true},"name":{"kind":"Name","value":"PurchaseReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseRewardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseReward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseRewardPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Purchase reward payload.","block":true},"name":{"kind":"Name","value":"PurchaseRewardPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseRewardPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"remainingGroupCoins"}},{"kind":"Field","name":{"kind":"Name","value":"remainingRewardQuantity"}}]}}]} as unknown as DocumentNode;
export const SetRewardHiddenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Set reward hidden status (moderator only).\nToggles whether a reward is visible to users. Returns previous and current state.","block":true},"name":{"kind":"Name","value":"SetRewardHidden"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rewardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isHidden"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setRewardHidden"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rewardId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isHidden"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isHidden"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SetRewardHiddenPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All reward fields.\nUse for reward management and display.","block":true},"name":{"kind":"Name","value":"RewardFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Reward"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"isInStock"}},{"kind":"Field","name":{"kind":"Name","value":"canBePurchased"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseCount"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"createdById"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Set reward hidden payload.","block":true},"name":{"kind":"Name","value":"SetRewardHiddenPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SetRewardHiddenPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previousHidden"}},{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdatePurchaseStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update purchase status (moderator only).\nFor moderators to manage order fulfillment: ACCEPTED, IN_DELIVERY, DELIVERED, CANCELLED.","block":true},"name":{"kind":"Name","value":"UpdatePurchaseStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePurchaseStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePurchaseStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdatePurchaseStatusPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update purchase status payload.","block":true},"name":{"kind":"Name","value":"UpdatePurchaseStatusPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePurchaseStatusPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}},{"kind":"Field","name":{"kind":"Name","value":"refunded"}}]}}]} as unknown as DocumentNode;
export const UpdateMyPurchaseStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update own purchase status (group leader only).\nFor group leaders to update their own purchases: IN_DELIVERY or CANCELLED only.","block":true},"name":{"kind":"Name","value":"UpdateMyPurchaseStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMyPurchaseStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateMyPurchaseStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateMyPurchaseStatusPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reward purchase fields.\nUse for purchase history and order management.","block":true},"name":{"kind":"Name","value":"RewardPurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RewardPurchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardId"}},{"kind":"Field","name":{"kind":"Name","value":"rewardName"}},{"kind":"Field","name":{"kind":"Name","value":"groupId"}},{"kind":"Field","name":{"kind":"Name","value":"groupName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedById"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedByName"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"totalCost"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"collectionMethod"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedById"}},{"kind":"Field","name":{"kind":"Name","value":"statusUpdatedByName"}},{"kind":"Field","name":{"kind":"Name","value":"purchasedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update my purchase status payload.","block":true},"name":{"kind":"Name","value":"UpdateMyPurchaseStatusPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateMyPurchaseStatusPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RewardPurchaseFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"previousStatus"}}]}}]} as unknown as DocumentNode;
export const SeedCreateSponsorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SeedCreateSponsor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"logoPath"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"height"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offsetX"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offsetY"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSponsor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"logoPath"},"value":{"kind":"Variable","name":{"kind":"Name","value":"logoPath"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"height"},"value":{"kind":"Variable","name":{"kind":"Name","value":"height"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offsetX"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offsetX"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"offsetY"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offsetY"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode;
export const SeedLinkSponsorToTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SeedLinkSponsorToTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sponsorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkSponsorToTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sponsorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sponsorId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linked"}},{"kind":"Field","name":{"kind":"Name","value":"sponsorId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}}]}}]} as unknown as DocumentNode;
export const SeedCreateRewardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SeedCreateReward"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"description"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"availableQuantity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"coinCost"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"images"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isHidden"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createReward"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"description"},"value":{"kind":"Variable","name":{"kind":"Name","value":"description"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"availableQuantity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"availableQuantity"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"coinCost"},"value":{"kind":"Variable","name":{"kind":"Name","value":"coinCost"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"images"},"value":{"kind":"Variable","name":{"kind":"Name","value":"images"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"isHidden"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isHidden"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reward"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"coinCostPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode;
export const GetSponsorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get a single sponsor by its unique ID.\nReturns null if sponsor not found or is inactive (for non-admin users).","block":true},"name":{"kind":"Name","value":"GetSponsor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetSponsorsByTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","description":{"kind":"StringValue","value":"Get all sponsors linked to a specific trip.\nReturns an empty list if the trip has no sponsors or if trip not found.","block":true},"name":{"kind":"Name","value":"GetSponsorsByTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsorsByTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const CreateSponsorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Create a new sponsor.\nRequires admin privileges.\nReturns the created sponsor with full details.","block":true},"name":{"kind":"Name","value":"CreateSponsor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSponsorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSponsor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CreateSponsorPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Create sponsor payload.","block":true},"name":{"kind":"Name","value":"CreateSponsorPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSponsorPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}}]}}]} as unknown as DocumentNode;
export const UpdateSponsorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Update an existing sponsor.\nRequires admin privileges.\nOnly provided fields will be updated; null values clear optional fields.\nReturns the updated sponsor with full details.","block":true},"name":{"kind":"Name","value":"UpdateSponsor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSponsorInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSponsor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpdateSponsorPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All sponsor fields including logo adjustments.\nUse for sponsor management and display.","block":true},"name":{"kind":"Name","value":"SponsorFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sponsor"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"logoPath"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"offsetX"}},{"kind":"Field","name":{"kind":"Name","value":"offsetY"}},{"kind":"Field","name":{"kind":"Name","value":"hasLogoAdjustments"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Update sponsor payload.","block":true},"name":{"kind":"Name","value":"UpdateSponsorPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSponsorPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sponsor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SponsorFields"}}]}}]}}]} as unknown as DocumentNode;
export const DeleteSponsorDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Delete a sponsor.\nRequires admin privileges.\nReturns success flag and deleted sponsor ID.\nNote: This may fail if the sponsor is linked to active trips.","block":true},"name":{"kind":"Name","value":"DeleteSponsor"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSponsor"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeleteSponsorPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Delete sponsor payload.","block":true},"name":{"kind":"Name","value":"DeleteSponsorPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteSponsorPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]} as unknown as DocumentNode;
export const LinkSponsorToTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Link a sponsor to a trip.\nRequires admin privileges.\nAssociates an existing sponsor with a trip for display in the trip context.\nReturns success status and the IDs of the linked sponsor and trip.","block":true},"name":{"kind":"Name","value":"LinkSponsorToTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sponsorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linkSponsorToTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sponsorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sponsorId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"LinkSponsorToTripPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Link sponsor to trip payload.","block":true},"name":{"kind":"Name","value":"LinkSponsorToTripPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LinkSponsorToTripPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"linked"}},{"kind":"Field","name":{"kind":"Name","value":"sponsorId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}}]} as unknown as DocumentNode;
export const UnlinkSponsorFromTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","description":{"kind":"StringValue","value":"Unlink a sponsor from a trip.\nRequires admin privileges.\nRemoves the association between a sponsor and a trip.\nReturns success status and the IDs of the unlinked sponsor and trip.","block":true},"name":{"kind":"Name","value":"UnlinkSponsorFromTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sponsorId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinkSponsorFromTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"sponsorId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sponsorId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UnlinkSponsorFromTripPayloadFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Unlink sponsor from trip payload.","block":true},"name":{"kind":"Name","value":"UnlinkSponsorFromTripPayloadFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UnlinkSponsorFromTripPayload"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unlinked"}},{"kind":"Field","name":{"kind":"Name","value":"sponsorId"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}}]}}]} as unknown as DocumentNode;
export const GetSubmissionReportsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSubmissionReports"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"submissionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissionReports"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"submissionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"submissionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reports"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All submission report fields.\nUse for moderation and content review.","block":true},"name":{"kind":"Name","value":"SubmissionReportFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReport"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"reporterId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"hasDetails"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"reporter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportReporterFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Reporter info in submission reports.","block":true},"name":{"kind":"Name","value":"SubmissionReportReporterFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportReporterInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportUserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User info in submission report context.","block":true},"name":{"kind":"Name","value":"SubmissionReportUserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportUserInfo"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}}]}}]} as unknown as DocumentNode;
export const CreateSubmissionReportDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSubmissionReport"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateReportInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubmissionReport"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SubmissionReportCreateResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"Report create result fields.","block":true},"name":{"kind":"Name","value":"SubmissionReportCreateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SubmissionReportCreateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"reporterId"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"reasonDisplay"}},{"kind":"Field","name":{"kind":"Name","value":"details"}},{"kind":"Field","name":{"kind":"Name","value":"hasDetails"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const GetTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetTripsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTrips"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TripPaginationInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"trips"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"offset"}}]}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const GetTripAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTripAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tripAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const CreateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const UpdateTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateTripInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TripFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All trip fields including status flags and dates.\nUse for trip details, trip management, and listings.","block":true},"name":{"kind":"Name","value":"TripFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Trip"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}},{"kind":"Field","name":{"kind":"Name","value":"isPlanning"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isCancelled"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"backgroundImagePath"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const DeleteTripDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTrip"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTrip"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode;
export const GetUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All user fields including computed properties and role information.\nUse for detailed user views, profiles, and admin user management.","block":true},"name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenOn"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isModerator"}}]}}]} as unknown as DocumentNode;
export const GetCurrentUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCurrentUser"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All user fields including computed properties and role information.\nUse for detailed user views, profiles, and admin user management.","block":true},"name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenOn"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isModerator"}}]}}]} as unknown as DocumentNode;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"20"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":{"kind":"IntValue","value":"0"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"All user fields including computed properties and role information.\nUse for detailed user views, profiles, and admin user management.","block":true},"name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenOn"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isModerator"}}]}}]} as unknown as DocumentNode;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserCreateResultFields"}}]}}]}},{"kind":"FragmentDefinition","description":{"kind":"StringValue","value":"User fields for creation/update results.\nThese types omit lastSeenOn and role flags.","block":true},"name":{"kind":"Name","value":"UserCreateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserCreateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserUpdateResultFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserUpdateResultFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserUpdateResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authUserId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"fullName"}},{"kind":"Field","name":{"kind":"Name","value":"hasAvatar"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode;
export const ActivityFeedUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ActivityFeedUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activityFeedUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tripId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tripId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tripId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"admin"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode;
export const ChallengeVotingUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"ChallengeVotingUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeVotingUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"challengeId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"challengeId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"challengeId"}},{"kind":"Field","name":{"kind":"Name","value":"totalVotes"}},{"kind":"Field","name":{"kind":"Name","value":"uniqueVoters"}},{"kind":"Field","name":{"kind":"Name","value":"submissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submissionId"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"voteScore"}},{"kind":"Field","name":{"kind":"Name","value":"rank"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isComplete"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode;
export const LocationUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"LocationUpdated"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"locationUpdated"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"accuracy"}},{"kind":"Field","name":{"kind":"Name","value":"altitude"}},{"kind":"Field","name":{"kind":"Name","value":"heading"}},{"kind":"Field","name":{"kind":"Name","value":"speed"}},{"kind":"Field","name":{"kind":"Name","value":"isSharingLocation"}},{"kind":"Field","name":{"kind":"Name","value":"distanceKm"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}}]}}]}}]} as unknown as DocumentNode;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetActivity(variables: GetActivityQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetActivityQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetActivityQuery>({ document: GetActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetActivity', 'query', variables);
    },
    GetActivitiesByTrip(variables: GetActivitiesByTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetActivitiesByTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetActivitiesByTripQuery>({ document: GetActivitiesByTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetActivitiesByTrip', 'query', variables);
    },
    GetActivitiesByTripModeration(variables: GetActivitiesByTripModerationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetActivitiesByTripModerationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetActivitiesByTripModerationQuery>({ document: GetActivitiesByTripModerationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetActivitiesByTripModeration', 'query', variables);
    },
    CreateCustomActivity(variables: CreateCustomActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateCustomActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateCustomActivityMutation>({ document: CreateCustomActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateCustomActivity', 'mutation', variables);
    },
    CreateRankChangeActivity(variables: CreateRankChangeActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateRankChangeActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRankChangeActivityMutation>({ document: CreateRankChangeActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateRankChangeActivity', 'mutation', variables);
    },
    CreateSubmissionActivity(variables: CreateSubmissionActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateSubmissionActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSubmissionActivityMutation>({ document: CreateSubmissionActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateSubmissionActivity', 'mutation', variables);
    },
    UpdateActivity(variables: UpdateActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateActivityMutation>({ document: UpdateActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateActivity', 'mutation', variables);
    },
    DeleteActivity(variables: DeleteActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteActivityMutation>({ document: DeleteActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteActivity', 'mutation', variables);
    },
    HideActivity(variables: HideActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<HideActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<HideActivityMutation>({ document: HideActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'HideActivity', 'mutation', variables);
    },
    UnhideActivity(variables: UnhideActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UnhideActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnhideActivityMutation>({ document: UnhideActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UnhideActivity', 'mutation', variables);
    },
    SetActivityPinned(variables: SetActivityPinnedMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetActivityPinnedMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetActivityPinnedMutation>({ document: SetActivityPinnedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetActivityPinned', 'mutation', variables);
    },
    ToggleActivityReaction(variables: ToggleActivityReactionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ToggleActivityReactionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ToggleActivityReactionMutation>({ document: ToggleActivityReactionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ToggleActivityReaction', 'mutation', variables);
    },
    GetChallenge(variables: GetChallengeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetChallengeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetChallengeQuery>({ document: GetChallengeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetChallenge', 'query', variables);
    },
    GetChallengesByTrip(variables: GetChallengesByTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetChallengesByTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetChallengesByTripQuery>({ document: GetChallengesByTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetChallengesByTrip', 'query', variables);
    },
    GetChallengeSubmission(variables: GetChallengeSubmissionQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetChallengeSubmissionQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetChallengeSubmissionQuery>({ document: GetChallengeSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetChallengeSubmission', 'query', variables);
    },
    GetChallengeSubmissions(variables: GetChallengeSubmissionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetChallengeSubmissionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetChallengeSubmissionsQuery>({ document: GetChallengeSubmissionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetChallengeSubmissions', 'query', variables);
    },
    GetChallengeSubmissionByChallengeAndGroup(variables: GetChallengeSubmissionByChallengeAndGroupQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetChallengeSubmissionByChallengeAndGroupQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetChallengeSubmissionByChallengeAndGroupQuery>({ document: GetChallengeSubmissionByChallengeAndGroupDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetChallengeSubmissionByChallengeAndGroup', 'query', variables);
    },
    GetVotesByChallenge(variables: GetVotesByChallengeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetVotesByChallengeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetVotesByChallengeQuery>({ document: GetVotesByChallengeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetVotesByChallenge', 'query', variables);
    },
    GetMyVotes(variables: GetMyVotesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyVotesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyVotesQuery>({ document: GetMyVotesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyVotes', 'query', variables);
    },
    GetVotingProgress(variables: GetVotingProgressQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetVotingProgressQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetVotingProgressQuery>({ document: GetVotingProgressDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetVotingProgress', 'query', variables);
    },
    GetJudgedStaffVotingProgress(variables: GetJudgedStaffVotingProgressQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetJudgedStaffVotingProgressQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetJudgedStaffVotingProgressQuery>({ document: GetJudgedStaffVotingProgressDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetJudgedStaffVotingProgress', 'query', variables);
    },
    CreateChallengeSubmission(variables: CreateChallengeSubmissionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateChallengeSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateChallengeSubmissionMutation>({ document: CreateChallengeSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateChallengeSubmission', 'mutation', variables);
    },
    UpdateChallengeSubmission(variables: UpdateChallengeSubmissionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateChallengeSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateChallengeSubmissionMutation>({ document: UpdateChallengeSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateChallengeSubmission', 'mutation', variables);
    },
    DeleteChallengeSubmission(variables: DeleteChallengeSubmissionMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteChallengeSubmissionMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteChallengeSubmissionMutation>({ document: DeleteChallengeSubmissionDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteChallengeSubmission', 'mutation', variables);
    },
    CreateChallengeActivity(variables: CreateChallengeActivityMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateChallengeActivityMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateChallengeActivityMutation>({ document: CreateChallengeActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateChallengeActivity', 'mutation', variables);
    },
    SubmitVote(variables: SubmitVoteMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SubmitVoteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitVoteMutation>({ document: SubmitVoteDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SubmitVote', 'mutation', variables);
    },
    SubmitVotes(variables: SubmitVotesMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SubmitVotesMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SubmitVotesMutation>({ document: SubmitVotesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SubmitVotes', 'mutation', variables);
    },
    ForceEndVoting(variables: ForceEndVotingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ForceEndVotingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ForceEndVotingMutation>({ document: ForceEndVotingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ForceEndVoting', 'mutation', variables);
    },
    CreateChallenge(variables: CreateChallengeMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateChallengeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateChallengeMutation>({ document: CreateChallengeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateChallenge', 'mutation', variables);
    },
    UpdateChallenge(variables: UpdateChallengeMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateChallengeMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateChallengeMutation>({ document: UpdateChallengeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateChallenge', 'mutation', variables);
    },
    GetCoinStatistics(variables: GetCoinStatisticsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCoinStatisticsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCoinStatisticsQuery>({ document: GetCoinStatisticsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCoinStatistics', 'query', variables);
    },
    GetCoinQuickStats(variables: GetCoinQuickStatsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCoinQuickStatsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCoinQuickStatsQuery>({ document: GetCoinQuickStatsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCoinQuickStats', 'query', variables);
    },
    GetCoinAdditionalInsights(variables: GetCoinAdditionalInsightsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCoinAdditionalInsightsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCoinAdditionalInsightsQuery>({ document: GetCoinAdditionalInsightsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCoinAdditionalInsights', 'query', variables);
    },
    GetCoinTransactions(variables: GetCoinTransactionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCoinTransactionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCoinTransactionsQuery>({ document: GetCoinTransactionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCoinTransactions', 'query', variables);
    },
    GetMyCoinTransactions(variables: GetMyCoinTransactionsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyCoinTransactionsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyCoinTransactionsQuery>({ document: GetMyCoinTransactionsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyCoinTransactions', 'query', variables);
    },
    AddCoins(variables: AddCoinsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddCoinsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddCoinsMutation>({ document: AddCoinsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddCoins', 'mutation', variables);
    },
    RemoveCoins(variables: RemoveCoinsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveCoinsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveCoinsMutation>({ document: RemoveCoinsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveCoins', 'mutation', variables);
    },
    GetGroup(variables: GetGroupQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupQuery>({ document: GetGroupDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroup', 'query', variables);
    },
    GetGroupByCode(variables: GetGroupByCodeQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupByCodeQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupByCodeQuery>({ document: GetGroupByCodeDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroupByCode', 'query', variables);
    },
    GetGroups(variables?: GetGroupsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupsQuery>({ document: GetGroupsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroups', 'query', variables);
    },
    GetGroupsByTrip(variables: GetGroupsByTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupsByTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupsByTripQuery>({ document: GetGroupsByTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroupsByTrip', 'query', variables);
    },
    GetGroupsByOrganizer(variables: GetGroupsByOrganizerQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupsByOrganizerQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupsByOrganizerQuery>({ document: GetGroupsByOrganizerDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroupsByOrganizer', 'query', variables);
    },
    GetGroupNamesByTrip(variables: GetGroupNamesByTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupNamesByTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupNamesByTripQuery>({ document: GetGroupNamesByTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroupNamesByTrip', 'query', variables);
    },
    GetGroupRanking(variables: GetGroupRankingQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetGroupRankingQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetGroupRankingQuery>({ document: GetGroupRankingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetGroupRanking', 'query', variables);
    },
    CreateGroup(variables: CreateGroupMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateGroupMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateGroupMutation>({ document: CreateGroupDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateGroup', 'mutation', variables);
    },
    UpdateGroup(variables: UpdateGroupMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateGroupMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateGroupMutation>({ document: UpdateGroupDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateGroup', 'mutation', variables);
    },
    DeleteGroup(variables: DeleteGroupMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteGroupMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteGroupMutation>({ document: DeleteGroupDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteGroup', 'mutation', variables);
    },
    AddUserToSharing(variables: AddUserToSharingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddUserToSharingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddUserToSharingMutation>({ document: AddUserToSharingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddUserToSharing', 'mutation', variables);
    },
    RemoveUserFromSharing(variables: RemoveUserFromSharingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveUserFromSharingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveUserFromSharingMutation>({ document: RemoveUserFromSharingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveUserFromSharing', 'mutation', variables);
    },
    UpdateSharingSettings(variables: UpdateSharingSettingsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateSharingSettingsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSharingSettingsMutation>({ document: UpdateSharingSettingsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateSharingSettings', 'mutation', variables);
    },
    /**
     * Get current user's location.
     * Returns: Location object or null if not set.
     */
    GetMyLocation(variables?: GetMyLocationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyLocationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyLocationQuery>({ document: GetMyLocationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyLocation', 'query', variables);
    },
    /**
     * Get current user's location sharing settings.
     * Returns: Sharing settings including enabled status and users to share with.
     */
    GetMySharingSettings(variables?: GetMySharingSettingsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMySharingSettingsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMySharingSettingsQuery>({ document: GetMySharingSettingsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMySharingSettings', 'query', variables);
    },
    /**
     * Get friends' locations.
     * Returns: Connection of friend locations for the current user.
     */
    GetFriendsLocations(variables?: GetFriendsLocationsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFriendsLocationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFriendsLocationsQuery>({ document: GetFriendsLocationsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFriendsLocations', 'query', variables);
    },
    /**
     * Update current user's location.
     * Requires: latitude, longitude. Optional: accuracy, altitude, etc.
     * Returns: Updated location.
     */
    UpdateLocation(variables: UpdateLocationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateLocationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateLocationMutation>({ document: UpdateLocationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateLocation', 'mutation', variables);
    },
    /**
     * Update location sharing settings.
     * Requires: isSharingLocation boolean.
     * Optional: userIdsToShareWith list.
     * Returns: Updated sharing settings.
     */
    UpdateLocationSharingSettings(variables: UpdateLocationSharingSettingsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateLocationSharingSettingsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateLocationSharingSettingsMutation>({ document: UpdateLocationSharingSettingsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateLocationSharingSettings', 'mutation', variables);
    },
    /**
     * Add a user to location sharing list.
     * Requires: userId to add.
     * Returns: Location with updated sharing list.
     */
    AddUserToLocationSharing(variables: AddUserToLocationSharingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AddUserToLocationSharingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<AddUserToLocationSharingMutation>({ document: AddUserToLocationSharingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AddUserToLocationSharing', 'mutation', variables);
    },
    /**
     * Remove a user from location sharing list.
     * Requires: userId to remove.
     * Returns: Location with updated sharing list.
     */
    RemoveUserFromLocationSharing(variables: RemoveUserFromLocationSharingMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RemoveUserFromLocationSharingMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RemoveUserFromLocationSharingMutation>({ document: RemoveUserFromLocationSharingDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RemoveUserFromLocationSharing', 'mutation', variables);
    },
    /**
     * Get a single notification by ID (admin only).
     * Requires: ID of notification to fetch.
     * Returns: Full notification details.
     */
    GetNotification(variables: GetNotificationQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetNotificationQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNotificationQuery>({ document: GetNotificationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetNotification', 'query', variables);
    },
    /**
     * Get current user's notifications with pagination.
     * Optional: page number and items per page.
     * Returns: Paginated list of user's notifications.
     */
    GetMyNotifications(variables?: GetMyNotificationsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMyNotificationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMyNotificationsQuery>({ document: GetMyNotificationsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMyNotifications', 'query', variables);
    },
    /**
     * Get all notifications with pagination (admin only).
     * Optional: limit, offset for pagination, tripId for filtering.
     * Returns: Paginated list of all notifications.
     */
    GetAllNotifications(variables?: GetAllNotificationsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAllNotificationsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAllNotificationsQuery>({ document: GetAllNotificationsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAllNotifications', 'query', variables);
    },
    /**
     * Get notification schedules with filtering (moderator+).
     * Optional: tripId to filter by trip, various filter options.
     * Returns: Paginated list of notification schedules.
     */
    GetNotificationSchedules(variables?: GetNotificationSchedulesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetNotificationSchedulesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNotificationSchedulesQuery>({ document: GetNotificationSchedulesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetNotificationSchedules', 'query', variables);
    },
    /**
     * Get a single notification schedule by ID (moderator+).
     * Requires: ID of schedule to fetch.
     * Returns: Full schedule details.
     */
    GetNotificationSchedule(variables: GetNotificationScheduleQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetNotificationScheduleQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNotificationScheduleQuery>({ document: GetNotificationScheduleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetNotificationSchedule', 'query', variables);
    },
    /**
     * Get currently active notification schedules (moderator+).
     * Optional: tripId and notificationType for filtering.
     * Returns: List of schedules currently within their active window.
     */
    GetActiveNotificationSchedules(variables?: GetActiveNotificationSchedulesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetActiveNotificationSchedulesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetActiveNotificationSchedulesQuery>({ document: GetActiveNotificationSchedulesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetActiveNotificationSchedules', 'query', variables);
    },
    /**
     * Get upcoming notification schedules within a time window (moderator+).
     * Requires: time window in minutes (default 30).
     * Optional: tripId for filtering.
     * Returns: List of schedules that will run soon.
     */
    GetUpcomingNotificationSchedules(variables?: GetUpcomingNotificationSchedulesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetUpcomingNotificationSchedulesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetUpcomingNotificationSchedulesQuery>({ document: GetUpcomingNotificationSchedulesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetUpcomingNotificationSchedules', 'query', variables);
    },
    /**
     * Get execution history for a notification schedule (moderator+).
     * Requires: ID of the schedule.
     * Optional: pagination parameters.
     * Returns: List of execution history entries.
     */
    GetNotificationScheduleExecutionHistory(variables: GetNotificationScheduleExecutionHistoryQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetNotificationScheduleExecutionHistoryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNotificationScheduleExecutionHistoryQuery>({ document: GetNotificationScheduleExecutionHistoryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetNotificationScheduleExecutionHistory', 'query', variables);
    },
    /**
     * Get notification deliveries with optional filters (moderator+).
     * Optional: notificationId, scheduleId, tripId, status, date range, pagination.
     * Returns: Paginated list of delivery records.
     */
    GetNotificationDeliveries(variables?: GetNotificationDeliveriesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetNotificationDeliveriesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNotificationDeliveriesQuery>({ document: GetNotificationDeliveriesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetNotificationDeliveries', 'query', variables);
    },
    /**
     * Get a notification delivery by notification ID (moderator+).
     * Requires: notificationId and tripId.
     * Returns: Delivery record for the specified notification.
     */
    GetNotificationDeliveryByNotificationId(variables: GetNotificationDeliveryByNotificationIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetNotificationDeliveryByNotificationIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetNotificationDeliveryByNotificationIdQuery>({ document: GetNotificationDeliveryByNotificationIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetNotificationDeliveryByNotificationId', 'query', variables);
    },
    /**
     * Get failed notification deliveries (moderator+).
     * Optional: tripId for filtering, limit and offset for pagination.
     * Returns: Paginated list of failed deliveries.
     */
    GetFailedDeliveries(variables?: GetFailedDeliveriesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFailedDeliveriesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFailedDeliveriesQuery>({ document: GetFailedDeliveriesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFailedDeliveries', 'query', variables);
    },
    /**
     * Get delivery statistics (moderator+).
     * Optional: tripId, scheduleId, date range filters.
     * Returns: Comprehensive delivery statistics.
     */
    GetDeliveryStats(variables?: GetDeliveryStatsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetDeliveryStatsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetDeliveryStatsQuery>({ document: GetDeliveryStatsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetDeliveryStats', 'query', variables);
    },
    /**
     * Create a new notification (moderator only).
     * Requires: title, body. Optional: priority, tripId, url.
     * Returns: The created notification.
     */
    CreateNotification(variables: CreateNotificationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateNotificationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateNotificationMutation>({ document: CreateNotificationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateNotification', 'mutation', variables);
    },
    /**
     * Update an existing notification (admin only).
     * Requires: notificationId. Optional: title, body, priority, url.
     * Returns: The updated notification.
     */
    UpdateNotification(variables: UpdateNotificationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateNotificationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateNotificationMutation>({ document: UpdateNotificationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateNotification', 'mutation', variables);
    },
    /**
     * Delete a notification (admin only).
     * Requires: notificationId.
     * Returns: Success status.
     */
    DeleteNotification(variables: DeleteNotificationMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteNotificationMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteNotificationMutation>({ document: DeleteNotificationDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteNotification', 'mutation', variables);
    },
    /**
     * Create a new notification schedule (admin only).
     * Requires: name, hour, minute, startDate, endDate, notificationType.
     * Optional: isActive, notificationTitle, notificationBody, notificationUrl, tripId.
     * Returns: The created schedule.
     */
    CreateNotificationSchedule(variables: CreateNotificationScheduleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateNotificationScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateNotificationScheduleMutation>({ document: CreateNotificationScheduleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateNotificationSchedule', 'mutation', variables);
    },
    /**
     * Update an existing notification schedule (admin only).
     * Requires: id. Optional: name, hour, minute, startDate, endDate,
     * notificationType, isActive, notificationTitle, notificationBody, notificationUrl.
     * Returns: The updated schedule.
     */
    UpdateNotificationSchedule(variables: UpdateNotificationScheduleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateNotificationScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateNotificationScheduleMutation>({ document: UpdateNotificationScheduleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateNotificationSchedule', 'mutation', variables);
    },
    /**
     * Delete a notification schedule (admin only).
     * Requires: id.
     * Returns: Success status and deletion count.
     */
    DeleteNotificationSchedule(variables: DeleteNotificationScheduleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteNotificationScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteNotificationScheduleMutation>({ document: DeleteNotificationScheduleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteNotificationSchedule', 'mutation', variables);
    },
    /**
     * Duplicate a notification schedule (admin only).
     * Requires: id of schedule to duplicate.
     * Returns: The duplicated schedule.
     */
    DuplicateNotificationSchedule(variables: DuplicateNotificationScheduleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DuplicateNotificationScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DuplicateNotificationScheduleMutation>({ document: DuplicateNotificationScheduleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DuplicateNotificationSchedule', 'mutation', variables);
    },
    /**
     * Toggle the active status of a notification schedule (admin only).
     * Requires: id of schedule to toggle.
     * Returns: Schedule with updated active status.
     */
    ToggleNotificationScheduleActive(variables: ToggleNotificationScheduleActiveMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ToggleNotificationScheduleActiveMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ToggleNotificationScheduleActiveMutation>({ document: ToggleNotificationScheduleActiveDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ToggleNotificationScheduleActive', 'mutation', variables);
    },
    /**
     * Bulk toggle active status of multiple notification schedules (admin only).
     * Requires: ids of schedules, isActive target status.
     * Returns: Success status and count updated.
     */
    BulkToggleNotificationScheduleActive(variables: BulkToggleNotificationScheduleActiveMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<BulkToggleNotificationScheduleActiveMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<BulkToggleNotificationScheduleActiveMutation>({ document: BulkToggleNotificationScheduleActiveDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'BulkToggleNotificationScheduleActive', 'mutation', variables);
    },
    /**
     * Bulk delete multiple notification schedules (admin only).
     * Requires: ids of schedules to delete.
     * Returns: Success status, counts, and any not-found IDs.
     */
    BulkDeleteNotificationSchedule(variables: BulkDeleteNotificationScheduleMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<BulkDeleteNotificationScheduleMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<BulkDeleteNotificationScheduleMutation>({ document: BulkDeleteNotificationScheduleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'BulkDeleteNotificationSchedule', 'mutation', variables);
    },
    /**
     * Update the last run timestamp of a schedule (moderator+).
     * Requires: id, lastRunAt, lastRunStatus.
     * Optional: lastRunError message.
     * Returns: Schedule with updated last run info.
     */
    UpdateNotificationScheduleLastRun(variables: UpdateNotificationScheduleLastRunMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateNotificationScheduleLastRunMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateNotificationScheduleLastRunMutation>({ document: UpdateNotificationScheduleLastRunDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateNotificationScheduleLastRun', 'mutation', variables);
    },
    /**
     * Update the status of a notification (admin only).
     * Requires: notificationId, newStatus.
     * Returns: Notification with status change info.
     */
    UpdateNotificationStatus(variables: UpdateNotificationStatusMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateNotificationStatusMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateNotificationStatusMutation>({ document: UpdateNotificationStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateNotificationStatus', 'mutation', variables);
    },
    /**
     * Send mobile push notifications (admin only).
     * Requires: notificationId.
     * Returns: Send statistics (success, failed, total).
     */
    SendMobileNotifications(variables: SendMobileNotificationsMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SendMobileNotificationsMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SendMobileNotificationsMutation>({ document: SendMobileNotificationsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SendMobileNotifications', 'mutation', variables);
    },
    /**
     * Track the start of a notification delivery (admin only).
     * Requires: notificationId.
     * Returns: Success status.
     */
    TrackDeliveryStart(variables: TrackDeliveryStartMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<TrackDeliveryStartMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<TrackDeliveryStartMutation>({ document: TrackDeliveryStartDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'TrackDeliveryStart', 'mutation', variables);
    },
    /**
     * Track the completion of a notification delivery (admin only).
     * Requires: notificationId, totalRecipients, successCount, failureCount.
     * Optional: errors message.
     * Returns: Success status.
     */
    TrackDeliveryComplete(variables: TrackDeliveryCompleteMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<TrackDeliveryCompleteMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<TrackDeliveryCompleteMutation>({ document: TrackDeliveryCompleteDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'TrackDeliveryComplete', 'mutation', variables);
    },
    /**
     * Track a notification delivery failure (admin only).
     * Requires: notificationId, error message.
     * Returns: Success status.
     */
    TrackDeliveryFailure(variables: TrackDeliveryFailureMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<TrackDeliveryFailureMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<TrackDeliveryFailureMutation>({ document: TrackDeliveryFailureDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'TrackDeliveryFailure', 'mutation', variables);
    },
    /**
     * Get a single reward by its ID.
     * Returns the reward with all fields including purchase tracking.
     */
    GetReward(variables: GetRewardQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRewardQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRewardQuery>({ document: GetRewardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetReward', 'query', variables);
    },
    /**
     * Get visible rewards for a specific trip.
     * Returns rewards with dynamic calculations (affordability, dynamic cost).
     * Use for user-facing reward displays.
     */
    GetRewardsByTrip(variables: GetRewardsByTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRewardsByTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRewardsByTripQuery>({ document: GetRewardsByTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRewardsByTrip', 'query', variables);
    },
    /**
     * Get all rewards for a trip including hidden ones (admin only).
     * Returns rewards with dynamic calculations for moderation purposes.
     */
    GetRewardsByTripAdmin(variables: GetRewardsByTripAdminQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRewardsByTripAdminQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRewardsByTripAdminQuery>({ document: GetRewardsByTripAdminDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRewardsByTripAdmin', 'query', variables);
    },
    /**
     * Get purchase history for a trip.
     * Returns all reward purchases with status, buyer info, and group info.
     */
    GetPurchaseHistory(variables: GetPurchaseHistoryQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPurchaseHistoryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPurchaseHistoryQuery>({ document: GetPurchaseHistoryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPurchaseHistory', 'query', variables);
    },
    /**
     * Get total available points for a trip (admin only).
     * Returns the total number of points available across all groups in the trip.
     */
    GetTotalAvailablePoints(variables: GetTotalAvailablePointsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTotalAvailablePointsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTotalAvailablePointsQuery>({ document: GetTotalAvailablePointsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTotalAvailablePoints', 'query', variables);
    },
    /**
     * Create a new reward (moderator only).
     * Requires: name, description, coinCost (percentage), availableQuantity, tripId.
     */
    CreateReward(variables: CreateRewardMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateRewardMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateRewardMutation>({ document: CreateRewardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateReward', 'mutation', variables);
    },
    /**
     * Update an existing reward (moderator only).
     * All fields are optional; only provided fields will be updated.
     */
    UpdateReward(variables: UpdateRewardMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateRewardMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateRewardMutation>({ document: UpdateRewardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateReward', 'mutation', variables);
    },
    /**
     * Delete a reward (moderator only).
     * Returns success status and the deleted reward ID.
     */
    DeleteReward(variables: DeleteRewardMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteRewardMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteRewardMutation>({ document: DeleteRewardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteReward', 'mutation', variables);
    },
    /**
     * Purchase a reward (authenticated users).
     * Requires rewardId and quantity. Returns purchase record and remaining balances.
     */
    PurchaseReward(variables: PurchaseRewardMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<PurchaseRewardMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<PurchaseRewardMutation>({ document: PurchaseRewardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'PurchaseReward', 'mutation', variables);
    },
    /**
     * Set reward hidden status (moderator only).
     * Toggles whether a reward is visible to users. Returns previous and current state.
     */
    SetRewardHidden(variables: SetRewardHiddenMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetRewardHiddenMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetRewardHiddenMutation>({ document: SetRewardHiddenDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetRewardHidden', 'mutation', variables);
    },
    /**
     * Update purchase status (moderator only).
     * For moderators to manage order fulfillment: ACCEPTED, IN_DELIVERY, DELIVERED, CANCELLED.
     */
    UpdatePurchaseStatus(variables: UpdatePurchaseStatusMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdatePurchaseStatusMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdatePurchaseStatusMutation>({ document: UpdatePurchaseStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdatePurchaseStatus', 'mutation', variables);
    },
    /**
     * Update own purchase status (group leader only).
     * For group leaders to update their own purchases: IN_DELIVERY or CANCELLED only.
     */
    UpdateMyPurchaseStatus(variables: UpdateMyPurchaseStatusMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMyPurchaseStatusMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMyPurchaseStatusMutation>({ document: UpdateMyPurchaseStatusDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMyPurchaseStatus', 'mutation', variables);
    },
    SeedCreateSponsor(variables: SeedCreateSponsorMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SeedCreateSponsorMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SeedCreateSponsorMutation>({ document: SeedCreateSponsorDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SeedCreateSponsor', 'mutation', variables);
    },
    SeedLinkSponsorToTrip(variables: SeedLinkSponsorToTripMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SeedLinkSponsorToTripMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SeedLinkSponsorToTripMutation>({ document: SeedLinkSponsorToTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SeedLinkSponsorToTrip', 'mutation', variables);
    },
    SeedCreateReward(variables: SeedCreateRewardMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SeedCreateRewardMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SeedCreateRewardMutation>({ document: SeedCreateRewardDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SeedCreateReward', 'mutation', variables);
    },
    /**
     * Get a single sponsor by its unique ID.
     * Returns null if sponsor not found or is inactive (for non-admin users).
     */
    GetSponsor(variables: GetSponsorQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSponsorQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSponsorQuery>({ document: GetSponsorDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSponsor', 'query', variables);
    },
    /**
     * Get all sponsors linked to a specific trip.
     * Returns an empty list if the trip has no sponsors or if trip not found.
     */
    GetSponsorsByTrip(variables: GetSponsorsByTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSponsorsByTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSponsorsByTripQuery>({ document: GetSponsorsByTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSponsorsByTrip', 'query', variables);
    },
    /**
     * Create a new sponsor.
     * Requires admin privileges.
     * Returns the created sponsor with full details.
     */
    CreateSponsor(variables: CreateSponsorMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateSponsorMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSponsorMutation>({ document: CreateSponsorDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateSponsor', 'mutation', variables);
    },
    /**
     * Update an existing sponsor.
     * Requires admin privileges.
     * Only provided fields will be updated; null values clear optional fields.
     * Returns the updated sponsor with full details.
     */
    UpdateSponsor(variables: UpdateSponsorMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateSponsorMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateSponsorMutation>({ document: UpdateSponsorDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateSponsor', 'mutation', variables);
    },
    /**
     * Delete a sponsor.
     * Requires admin privileges.
     * Returns success flag and deleted sponsor ID.
     * Note: This may fail if the sponsor is linked to active trips.
     */
    DeleteSponsor(variables: DeleteSponsorMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteSponsorMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteSponsorMutation>({ document: DeleteSponsorDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteSponsor', 'mutation', variables);
    },
    /**
     * Link a sponsor to a trip.
     * Requires admin privileges.
     * Associates an existing sponsor with a trip for display in the trip context.
     * Returns success status and the IDs of the linked sponsor and trip.
     */
    LinkSponsorToTrip(variables: LinkSponsorToTripMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<LinkSponsorToTripMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<LinkSponsorToTripMutation>({ document: LinkSponsorToTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'LinkSponsorToTrip', 'mutation', variables);
    },
    /**
     * Unlink a sponsor from a trip.
     * Requires admin privileges.
     * Removes the association between a sponsor and a trip.
     * Returns success status and the IDs of the unlinked sponsor and trip.
     */
    UnlinkSponsorFromTrip(variables: UnlinkSponsorFromTripMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UnlinkSponsorFromTripMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnlinkSponsorFromTripMutation>({ document: UnlinkSponsorFromTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UnlinkSponsorFromTrip', 'mutation', variables);
    },
    GetSubmissionReports(variables: GetSubmissionReportsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSubmissionReportsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSubmissionReportsQuery>({ document: GetSubmissionReportsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSubmissionReports', 'query', variables);
    },
    CreateSubmissionReport(variables: CreateSubmissionReportMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateSubmissionReportMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateSubmissionReportMutation>({ document: CreateSubmissionReportDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateSubmissionReport', 'mutation', variables);
    },
    GetTrip(variables: GetTripQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTripQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTripQuery>({ document: GetTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTrip', 'query', variables);
    },
    GetTrips(variables?: GetTripsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTripsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTripsQuery>({ document: GetTripsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTrips', 'query', variables);
    },
    GetTripAdmin(variables: GetTripAdminQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTripAdminQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTripAdminQuery>({ document: GetTripAdminDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTripAdmin', 'query', variables);
    },
    CreateTrip(variables: CreateTripMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateTripMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateTripMutation>({ document: CreateTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateTrip', 'mutation', variables);
    },
    UpdateTrip(variables: UpdateTripMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateTripMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateTripMutation>({ document: UpdateTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateTrip', 'mutation', variables);
    },
    DeleteTrip(variables: DeleteTripMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DeleteTripMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<DeleteTripMutation>({ document: DeleteTripDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'DeleteTrip', 'mutation', variables);
    },
    GetUser(variables: GetUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetUserQuery>({ document: GetUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetUser', 'query', variables);
    },
    GetCurrentUser(variables?: GetCurrentUserQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCurrentUserQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCurrentUserQuery>({ document: GetCurrentUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCurrentUser', 'query', variables);
    },
    GetUsers(variables?: GetUsersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetUsersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetUsersQuery>({ document: GetUsersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetUsers', 'query', variables);
    },
    CreateUser(variables: CreateUserMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateUserMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateUserMutation>({ document: CreateUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateUser', 'mutation', variables);
    },
    UpdateUser(variables: UpdateUserMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateUserMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateUserMutation>({ document: UpdateUserDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateUser', 'mutation', variables);
    },
    ActivityFeedUpdated(variables: ActivityFeedUpdatedSubscriptionVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActivityFeedUpdatedSubscription> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActivityFeedUpdatedSubscription>({ document: ActivityFeedUpdatedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActivityFeedUpdated', 'subscription', variables);
    },
    ChallengeVotingUpdated(variables: ChallengeVotingUpdatedSubscriptionVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ChallengeVotingUpdatedSubscription> {
      return withWrapper((wrappedRequestHeaders) => client.request<ChallengeVotingUpdatedSubscription>({ document: ChallengeVotingUpdatedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ChallengeVotingUpdated', 'subscription', variables);
    },
    LocationUpdated(variables: LocationUpdatedSubscriptionVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<LocationUpdatedSubscription> {
      return withWrapper((wrappedRequestHeaders) => client.request<LocationUpdatedSubscription>({ document: LocationUpdatedDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'LocationUpdated', 'subscription', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;