import { GraphQLClient } from "graphql-request";
import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

type RequestInit = globalThis.RequestInit;
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

function fetcher<TData, TVariables extends { [key: string]: any }>(
  client: GraphQLClient,
  query: string,
  variables?: TVariables,
  requestHeaders?: RequestInit["headers"],
) {
  return async (): Promise<TData> =>
    client.request({
      document: query,
      variables,
      requestHeaders,
    });
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any };
};

/** An activity in the feed */
export type Activity = {
  __typename?: "Activity";
  /** Type of activity */
  activityType: ActivityType;
  /** Admin who created this activity (null if user post) */
  admin?: Maybe<ActivityAdmin>;
  /** When activity was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Activity description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Unique activity ID */
  id: Scalars["ID"]["output"];
  /** Activity image URL */
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  /** Whether activity is hidden */
  isHidden: Scalars["Boolean"]["output"];
  /** Whether activity is pinned */
  isPinned: Scalars["Boolean"]["output"];
  /** Activity title */
  title: Scalars["String"]["output"];
  /** Trip ID this activity belongs to */
  tripId: Scalars["ID"]["output"];
  /** When activity was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Admin user who created the activity */
export type ActivityAdmin = {
  __typename?: "ActivityAdmin";
  /** Admin first name */
  firstName: Scalars["String"]["output"];
  /** Admin user ID */
  id: Scalars["ID"]["output"];
  /** Admin last name */
  lastName: Scalars["String"]["output"];
};

/** Cursor for paginating through activities */
export type ActivityCursor = {
  __typename?: "ActivityCursor";
  /** Created timestamp */
  createdAt: Scalars["DateTime"]["output"];
  /** Activity ID */
  id: Scalars["ID"]["output"];
  /** Whether cursor activity is pinned */
  isPinned: Scalars["Boolean"]["output"];
};

/** Cursor for paginating through activity feed */
export type ActivityCursorInput = {
  /** Created timestamp for the cursor */
  createdAt: Scalars["DateTime"]["input"];
  /** Activity ID for the cursor */
  id: Scalars["ID"]["input"];
  /** Whether the cursor activity is pinned */
  isPinned: Scalars["Boolean"]["input"];
};

/** Result of fetching activity feed for moderation */
export type ActivityFeedModerationResult = {
  __typename?: "ActivityFeedModerationResult";
  /** List of activities (including hidden) */
  activities: Array<Activity>;
  /** Pagination information */
  pagination: ModerationPaginationInfo;
};

/** Result of fetching activity feed */
export type ActivityFeedResult = {
  __typename?: "ActivityFeedResult";
  /** List of activities */
  activities: Array<Activity>;
  /** Cursor for next page (null if no more items) */
  nextCursor?: Maybe<ActivityCursor>;
  /** Pagination information */
  pagination: PaginationInfo;
};

/** Types of activities in the feed */
export enum ActivityType {
  ChallengeEvent = "CHALLENGE_EVENT",
  Custom = "CUSTOM",
  RankChange = "RANK_CHANGE",
  Submission = "SUBMISSION",
  UserPost = "USER_POST",
}

/** Input for adding coins to a group */
export type AddCoinsInput = {
  /** Amount of coins to add (must be at least 1) */
  amount: Scalars["Int"]["input"];
  /** ID of the group to add coins to */
  groupId: Scalars["ID"]["input"];
  /** Reason for adding coins (optional) */
  reason?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the trip the group belongs to */
  tripId: Scalars["ID"]["input"];
};

/** Input for adding a user to location sharing */
export type AddSharingUserInput = {
  /** ID of the user to add */
  userId: Scalars["ID"]["input"];
};

/** Voting progress for a single admin */
export type AdminVotingInfo = {
  __typename?: "AdminVotingInfo";
  /** Whether this admin has voted all required positions */
  hasVotedAll: Scalars["Boolean"]["output"];
  /** ID of the admin participant */
  participantId: Scalars["ID"]["output"];
  /** Positions this admin has voted for (1-3) */
  votedPositions: Array<Scalars["Int"]["output"]>;
};

/** Result of fetching all notifications (admin only) */
export type AllNotificationsResult = {
  __typename?: "AllNotificationsResult";
  /** List of notifications */
  notifications: Array<Notification>;
  /** Pagination information */
  pagination: NotificationOffsetPaginationInfo;
};

/** Result of bulk deleting notification schedules */
export type BulkDeleteNotificationSchedulesPayload = {
  __typename?: "BulkDeleteNotificationSchedulesPayload";
  /** Number of schedules deleted */
  deletedCount: Scalars["Int"]["output"];
  /** IDs that were not found */
  notFoundIds?: Maybe<Array<Scalars["String"]["output"]>>;
  /** Number of schedules requested for deletion */
  requestedCount: Scalars["Int"]["output"];
  /** Whether the operation was successful */
  success: Scalars["Boolean"]["output"];
};

/** Result of bulk toggling schedule active status */
export type BulkToggleActivePayload = {
  __typename?: "BulkToggleActivePayload";
  /** Whether the operation was successful */
  success: Scalars["Boolean"]["output"];
  /** Number of schedules updated */
  updatedCount: Scalars["Int"]["output"];
};

/** Types of challenge events */
export enum ChallengeEventType {
  ChallengeStarted = "CHALLENGE_STARTED",
  Completed = "COMPLETED",
  VotingStarted = "VOTING_STARTED",
}

/** A challenge submission made by a group */
export type ChallengeSubmission = {
  __typename?: "ChallengeSubmission";
  /** Points awarded for this submission */
  awardedPoints: Scalars["Int"]["output"];
  /** Bonus points awarded */
  bonusPoints: Scalars["Int"]["output"];
  /** ID of the challenge this submission is for */
  challengeId: Scalars["ID"]["output"];
  /** When the submission was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Group that made this submission */
  group?: Maybe<SubmissionGroupInfo>;
  /** ID of the group that made this submission */
  groupId: Scalars["ID"]["output"];
  /** Whether the submission has location coordinates */
  hasLocation: Scalars["Boolean"]["output"];
  /** Whether the submission has images or video */
  hasMedia: Scalars["Boolean"]["output"];
  /** Unique identifier for the submission */
  id: Scalars["ID"]["output"];
  /** IDs of uploaded images */
  imageIds: Array<Scalars["String"]["output"]>;
  /** Latitude coordinate (optional) */
  latitude?: Maybe<Scalars["Float"]["output"]>;
  /** Longitude coordinate (optional) */
  longitude?: Maybe<Scalars["Float"]["output"]>;
  /** Ranking position (1-3) if awarded */
  ranking?: Maybe<Scalars["Int"]["output"]>;
  /** Reason for rejection (if rejected) */
  rejectionReason?: Maybe<Scalars["String"]["output"]>;
  /** When the submission was reviewed */
  reviewedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** User who reviewed this submission */
  reviewedBy?: Maybe<SubmissionReviewerInfo>;
  /** ID of user who reviewed this submission */
  reviewedById?: Maybe<Scalars["ID"]["output"]>;
  /** Current review status of the submission */
  status: SubmissionStatus;
  /** Text content of the submission */
  textContent?: Maybe<Scalars["String"]["output"]>;
  /** Total points (awarded + bonus) */
  totalPoints: Scalars["Int"]["output"];
  /** When the submission was last updated */
  updatedAt: Scalars["DateTime"]["output"];
  /** ID of uploaded video (if any) */
  videoId?: Maybe<Scalars["String"]["output"]>;
  /** Number of votes received */
  voteCount: Scalars["Int"]["output"];
  /** Calculated vote score */
  voteScore: Scalars["Float"]["output"];
};

/** Result of creating a challenge submission */
export type ChallengeSubmissionCreateResult = {
  __typename?: "ChallengeSubmissionCreateResult";
  /** Points awarded for this submission */
  awardedPoints: Scalars["Int"]["output"];
  /** Bonus points awarded */
  bonusPoints: Scalars["Int"]["output"];
  /** ID of the challenge this submission is for */
  challengeId: Scalars["ID"]["output"];
  /** When the submission was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Group that made this submission */
  group?: Maybe<SubmissionGroupInfo>;
  /** ID of the group that made this submission */
  groupId: Scalars["ID"]["output"];
  /** Whether the submission has location coordinates */
  hasLocation: Scalars["Boolean"]["output"];
  /** Whether the submission has images or video */
  hasMedia: Scalars["Boolean"]["output"];
  /** Unique identifier for the submission */
  id: Scalars["ID"]["output"];
  /** IDs of uploaded images */
  imageIds: Array<Scalars["String"]["output"]>;
  /** Latitude coordinate (optional) */
  latitude?: Maybe<Scalars["Float"]["output"]>;
  /** Longitude coordinate (optional) */
  longitude?: Maybe<Scalars["Float"]["output"]>;
  /** Ranking position (1-3) if awarded */
  ranking?: Maybe<Scalars["Int"]["output"]>;
  /** Reason for rejection (if rejected) */
  rejectionReason?: Maybe<Scalars["String"]["output"]>;
  /** When the submission was reviewed */
  reviewedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** User who reviewed this submission */
  reviewedBy?: Maybe<SubmissionReviewerInfo>;
  /** ID of user who reviewed this submission */
  reviewedById?: Maybe<Scalars["ID"]["output"]>;
  /** Current review status of the submission */
  status: SubmissionStatus;
  /** Text content of the submission */
  textContent?: Maybe<Scalars["String"]["output"]>;
  /** Total points (awarded + bonus) */
  totalPoints: Scalars["Int"]["output"];
  /** When the submission was last updated */
  updatedAt: Scalars["DateTime"]["output"];
  /** ID of uploaded video (if any) */
  videoId?: Maybe<Scalars["String"]["output"]>;
  /** Number of votes received */
  voteCount: Scalars["Int"]["output"];
  /** Calculated vote score */
  voteScore: Scalars["Float"]["output"];
};

/** Paginated list of challenge submissions */
export type ChallengeSubmissionListResult = {
  __typename?: "ChallengeSubmissionListResult";
  /** List of submissions */
  submissions: Array<ChallengeSubmission>;
  /** Total number of submissions (for pagination) */
  totalCount: Scalars["Int"]["output"];
};

/** Result of updating a challenge submission */
export type ChallengeSubmissionUpdateResult = {
  __typename?: "ChallengeSubmissionUpdateResult";
  /** Points awarded for this submission */
  awardedPoints: Scalars["Int"]["output"];
  /** Bonus points awarded */
  bonusPoints: Scalars["Int"]["output"];
  /** ID of the challenge this submission is for */
  challengeId: Scalars["ID"]["output"];
  /** When the submission was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Group that made this submission */
  group?: Maybe<SubmissionGroupInfo>;
  /** ID of the group that made this submission */
  groupId: Scalars["ID"]["output"];
  /** Whether the submission has location coordinates */
  hasLocation: Scalars["Boolean"]["output"];
  /** Whether the submission has images or video */
  hasMedia: Scalars["Boolean"]["output"];
  /** Unique identifier for the submission */
  id: Scalars["ID"]["output"];
  /** IDs of uploaded images */
  imageIds: Array<Scalars["String"]["output"]>;
  /** Latitude coordinate (optional) */
  latitude?: Maybe<Scalars["Float"]["output"]>;
  /** Longitude coordinate (optional) */
  longitude?: Maybe<Scalars["Float"]["output"]>;
  /** Ranking position (1-3) if awarded */
  ranking?: Maybe<Scalars["Int"]["output"]>;
  /** Reason for rejection (if rejected) */
  rejectionReason?: Maybe<Scalars["String"]["output"]>;
  /** When the submission was reviewed */
  reviewedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** User who reviewed this submission */
  reviewedBy?: Maybe<SubmissionReviewerInfo>;
  /** ID of user who reviewed this submission */
  reviewedById?: Maybe<Scalars["ID"]["output"]>;
  /** Current review status of the submission */
  status: SubmissionStatus;
  /** Text content of the submission */
  textContent?: Maybe<Scalars["String"]["output"]>;
  /** Total points (awarded + bonus) */
  totalPoints: Scalars["Int"]["output"];
  /** When the submission was last updated */
  updatedAt: Scalars["DateTime"]["output"];
  /** ID of uploaded video (if any) */
  videoId?: Maybe<Scalars["String"]["output"]>;
  /** Number of votes received */
  voteCount: Scalars["Int"]["output"];
  /** Calculated vote score */
  voteScore: Scalars["Float"]["output"];
};

/** A vote cast for a challenge submission */
export type ChallengeVote = {
  __typename?: "ChallengeVote";
  /** ID of the challenge being voted on */
  challengeId: Scalars["ID"]["output"];
  /** Unique identifier for the vote (UUID) */
  id: Scalars["ID"]["output"];
  /** Normalized weight of the vote (for weighted voting) */
  normalizedWeight: Scalars["Float"]["output"];
  /** ID of the submission receiving the vote */
  submissionId: Scalars["ID"]["output"];
  /** Points awarded for this vote */
  votePoints: Scalars["Int"]["output"];
  /** Voting position (1st, 2nd, or 3rd place) */
  votePosition: Scalars["Int"]["output"];
  /** When the vote was cast */
  votedAt: Scalars["DateTime"]["output"];
  /** ID of the voter (trip participant) */
  voterId: Scalars["ID"]["output"];
};

/** Admin view of votes with unique voter count */
export type ChallengeVoteAdminList = {
  __typename?: "ChallengeVoteAdminList";
  /** Total number of votes cast */
  totalVotes: Scalars["Int"]["output"];
  /** Number of unique voters */
  uniqueVoters: Scalars["Int"]["output"];
  /** All votes for the challenge */
  votes: Array<ChallengeVote>;
};

/** List of votes with metadata */
export type ChallengeVoteList = {
  __typename?: "ChallengeVoteList";
  /** Total number of votes */
  totalVotes: Scalars["Int"]["output"];
  /** The votes in the list */
  votes: Array<ChallengeVote>;
};

/** Result of checking inactive users */
export type CheckInactiveUsersPayload = {
  __typename?: "CheckInactiveUsersPayload";
  /** Number of users checked for inactivity */
  checked: Scalars["Int"]["output"];
  /** Number of errors encountered */
  errors: Scalars["Int"]["output"];
  /** Number of users notified */
  notified: Scalars["Int"]["output"];
  /** Number of users skipped */
  skipped: Scalars["Int"]["output"];
};

/** Additional insights about coin transactions */
export type CoinAdditionalInsights = {
  __typename?: "CoinAdditionalInsights";
  /** Information about the most active admin */
  mostActiveAdmin?: Maybe<FormattedUser>;
  /** Recent coin transactions */
  recentTransactions: Array<CoinTransaction>;
};

/** Quick overview statistics for coin distribution in a trip */
export type CoinQuickStats = {
  __typename?: "CoinQuickStats";
  /** Average coins per group */
  averageCoinsPerGroup: Scalars["Int"]["output"];
  /** ID of the group with the most coins */
  richestGroupId?: Maybe<Scalars["ID"]["output"]>;
  /** Name of the group with the most coins */
  richestGroupName?: Maybe<Scalars["String"]["output"]>;
  /** When the statistics were computed */
  time: Scalars["DateTime"]["output"];
  /** Total coins across all groups */
  totalCoins: Scalars["Int"]["output"];
  /** Total number of groups with transactions */
  totalGroups: Scalars["Int"]["output"];
};

/** Comprehensive coin statistics for a trip */
export type CoinStatistics = {
  __typename?: "CoinStatistics";
  /** Total coins added to groups (positive amounts) */
  addedCoins: Scalars["Int"]["output"];
  /** Net balance of all transactions (added - removed) */
  netBalance: Scalars["Int"]["output"];
  /** Total coins removed from groups (negative amounts, as positive number) */
  removedCoins: Scalars["Int"]["output"];
  /** When the statistics were computed */
  time: Scalars["DateTime"]["output"];
  /** Total number of coin transactions */
  transactionCount: Scalars["Int"]["output"];
};

/** A coin transaction recording the addition or removal of coins from a group */
export type CoinTransaction = {
  __typename?: "CoinTransaction";
  /** Admin information for this transaction */
  admin?: Maybe<CoinTransactionAdmin>;
  /** ID of the admin who performed this transaction */
  adminId: Scalars["ID"]["output"];
  /** Amount of coins added (positive) or removed (negative) */
  amount: Scalars["Int"]["output"];
  /** When the transaction was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Group information for this transaction */
  group?: Maybe<CoinTransactionGroup>;
  /** ID of the group affected by this transaction */
  groupId: Scalars["ID"]["output"];
  /** Unique identifier for the transaction */
  id: Scalars["ID"]["output"];
  /** Reason or note for this transaction */
  reason?: Maybe<Scalars["String"]["output"]>;
};

/** Admin information in a coin transaction context */
export type CoinTransactionAdmin = {
  __typename?: "CoinTransactionAdmin";
  /** Admin's first name */
  firstName?: Maybe<Scalars["String"]["output"]>;
  /** Admin's full name (computed) */
  fullName: Scalars["String"]["output"];
  /** Admin user ID */
  id: Scalars["ID"]["output"];
  /** Admin's last name */
  lastName?: Maybe<Scalars["String"]["output"]>;
};

/** Group information in a coin transaction context */
export type CoinTransactionGroup = {
  __typename?: "CoinTransactionGroup";
  /** Current coin balance of the group */
  coins: Scalars["Int"]["output"];
  /** Group ID */
  id: Scalars["ID"]["output"];
  /** Group name */
  name: Scalars["String"]["output"];
};

/** Pagination metadata for coin transaction lists */
export type CoinTransactionPagination = {
  __typename?: "CoinTransactionPagination";
  /** Whether more items are available */
  hasMore: Scalars["Boolean"]["output"];
  /** Number of items per page */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped */
  offset: Scalars["Int"]["output"];
  /** Total number of transactions available */
  total: Scalars["Int"]["output"];
};

/** Pagination parameters for coin transaction queries */
export type CoinTransactionPaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Result of an add or remove coins operation */
export type CoinTransactionResult = {
  __typename?: "CoinTransactionResult";
  /** Admin ID (convenience accessor) */
  adminId: Scalars["ID"]["output"];
  /** Transaction amount */
  amount: Scalars["Int"]["output"];
  /** Transaction timestamp (convenience accessor) */
  createdAt: Scalars["DateTime"]["output"];
  /** Group ID (convenience accessor) */
  groupId: Scalars["ID"]["output"];
  /** Transaction ID (convenience accessor) */
  id: Scalars["ID"]["output"];
  /** The created coin transaction */
  transaction: CoinTransaction;
};

/** A paginated list of coin transactions with metadata */
export type CoinTransactionsConnection = {
  __typename?: "CoinTransactionsConnection";
  /** Pagination metadata */
  pagination: CoinTransactionPagination;
  /** The transactions in this page */
  transactions: Array<CoinTransaction>;
};

/** Input for creating a challenge event activity */
export type CreateChallengeActivityInput = {
  /** Base points for challenge */
  basePoints?: InputMaybe<Scalars["Int"]["input"]>;
  /** Challenge ID */
  challengeId: Scalars["ID"]["input"];
  /** Activity description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Challenge end time */
  endTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Type of challenge event */
  eventType: ChallengeEventType;
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Number of submissions */
  submissionCount?: InputMaybe<Scalars["Int"]["input"]>;
  /** Submission type */
  submissionType?: InputMaybe<Scalars["String"]["input"]>;
  /** Activity title */
  title: Scalars["String"]["input"];
  /** Trip ID */
  tripId: Scalars["ID"]["input"];
};

/** Input for creating a custom activity */
export type CreateCustomActivityInput = {
  /** Activity description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Activity image URL */
  imageUrl?: InputMaybe<Scalars["String"]["input"]>;
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Activity title */
  title: Scalars["String"]["input"];
  /** Trip ID to create activity for */
  tripId: Scalars["ID"]["input"];
};

/** Input for creating a signed download URL */
export type CreateDownloadUrlInput = {
  /** URL expiration time in seconds (60-3600, defaults to 600) */
  expiresInSeconds?: InputMaybe<Scalars["Int"]["input"]>;
  /** The full storage path (bucket/path) for the file */
  storagePath: Scalars["String"]["input"];
};

/** Input for creating a new group */
export type CreateGroupInput = {
  /** Group description (max 500 characters) */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Group image URL */
  image?: InputMaybe<Scalars["String"]["input"]>;
  /** Group name (1-100 characters) */
  name: Scalars["String"]["input"];
  /** ID of the group organizer (defaults to current user) */
  organizerId?: InputMaybe<Scalars["ID"]["input"]>;
  /** ID of the trip this group belongs to */
  tripId: Scalars["ID"]["input"];
};

/** Result of creating a new group */
export type CreateGroupPayload = {
  __typename?: "CreateGroupPayload";
  /** The newly created group */
  group: Group;
};

/** Input for creating a new notification */
export type CreateNotificationInput = {
  /** Notification body content */
  body: Scalars["String"]["input"];
  /** Notification priority */
  priority?: InputMaybe<NotificationPriority>;
  /** Notification title */
  title: Scalars["String"]["input"];
  /** Optional trip ID to associate with notification */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Optional URL to open when notification is tapped */
  url?: InputMaybe<Scalars["String"]["input"]>;
};

/** Result of creating a notification */
export type CreateNotificationResult = {
  __typename?: "CreateNotificationResult";
  /** The created notification */
  notification: Notification;
};

/** Input for creating a new notification schedule */
export type CreateNotificationScheduleInput = {
  /** When the schedule ends */
  endDate: Scalars["DateTime"]["input"];
  /** Scheduled hour (0-23) */
  hour: Scalars["Int"]["input"];
  /** Whether the schedule is initially active */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Scheduled minute (0-59) */
  minute: Scalars["Int"]["input"];
  /** Schedule name (1-100 characters) */
  name: Scalars["String"]["input"];
  /** Notification body (optional for INFO type, max 2000 chars) */
  notificationBody?: InputMaybe<Scalars["String"]["input"]>;
  /** Notification title (optional for INFO type, max 200 chars) */
  notificationTitle?: InputMaybe<Scalars["String"]["input"]>;
  /** Type of notification */
  notificationType: NotificationScheduleType;
  /** Optional URL for the notification (max 500 chars) */
  notificationUrl?: InputMaybe<Scalars["String"]["input"]>;
  /** When the schedule starts */
  startDate: Scalars["DateTime"]["input"];
  /** Associated trip ID (optional) */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
};

/** Result of creating a new notification schedule */
export type CreateNotificationSchedulePayload = {
  __typename?: "CreateNotificationSchedulePayload";
  /** The newly created schedule */
  schedule: NotificationSchedule;
};

/** Input for creating a public URL */
export type CreatePublicUrlInput = {
  /** The full storage path (bucket/path) for the file. Only 'files-public' bucket is supported. */
  storagePath: Scalars["String"]["input"];
};

/** Input for creating a rank change activity */
export type CreateRankChangeActivityInput = {
  /** Coins gained */
  coinsGained: Scalars["Int"]["input"];
  /** Activity description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Group ID */
  groupId: Scalars["ID"]["input"];
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** New rank position */
  newRank: Scalars["Int"]["input"];
  /** Activity title */
  title: Scalars["String"]["input"];
  /** Total coins */
  totalCoins: Scalars["Int"]["input"];
  /** Trip ID */
  tripId: Scalars["ID"]["input"];
};

/** Input for creating a new submission report */
export type CreateReportInput = {
  /** Additional details (max 2000 characters) */
  details?: InputMaybe<Scalars["String"]["input"]>;
  /** Reason for reporting */
  reason: ReportReason;
  /** ID of the submission to report */
  submissionId: Scalars["ID"]["input"];
};

/** Input for creating a new reward */
export type CreateRewardInput = {
  /** Number of rewards available (0-1000000) */
  availableQuantity: Scalars["Int"]["input"];
  /** Percentage of total trip points (1-100) */
  coinCost: Scalars["Int"]["input"];
  /** Reward description (max 2000 characters) */
  description: Scalars["String"]["input"];
  /** Array of image URLs (max 10) */
  images?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Whether the reward should be hidden initially */
  isHidden?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Reward name (1-200 characters) */
  name: Scalars["String"]["input"];
  /** ID of the trip this reward belongs to */
  tripId: Scalars["ID"]["input"];
};

/** Result of creating a new reward */
export type CreateRewardPayload = {
  __typename?: "CreateRewardPayload";
  /** The newly created reward */
  reward: Reward;
};

/** Input for creating a new sponsor */
export type CreateSponsorInput = {
  /** Sponsor description (1-2000 characters) */
  description: Scalars["String"]["input"];
  /** Logo height in pixels (optional) */
  height?: InputMaybe<Scalars["Int"]["input"]>;
  /** Whether the sponsor is active */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** URL path to sponsor logo image */
  logoPath: Scalars["String"]["input"];
  /** Sponsor name (1-200 characters) */
  name: Scalars["String"]["input"];
  /** Horizontal offset in pixels (optional) */
  offsetX?: InputMaybe<Scalars["Int"]["input"]>;
  /** Vertical offset in pixels (optional) */
  offsetY?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Result of creating a sponsor */
export type CreateSponsorPayload = {
  __typename?: "CreateSponsorPayload";
  /** The newly created sponsor */
  sponsor: Sponsor;
};

/** Input for creating a submission activity */
export type CreateSubmissionActivityInput = {
  /** Challenge ID */
  challengeId: Scalars["ID"]["input"];
  /** Activity description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Group ID */
  groupId: Scalars["ID"]["input"];
  /** Whether submission has video */
  hasVideo?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Activity image URL */
  imageUrl?: InputMaybe<Scalars["String"]["input"]>;
  /** Whether to pin the activity */
  isPinned?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Whether submission is a winner */
  isWinner?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Points awarded */
  pointsAwarded?: InputMaybe<Scalars["Int"]["input"]>;
  /** Submission ranking */
  ranking?: InputMaybe<Scalars["Int"]["input"]>;
  /** Submission ID */
  submissionId: Scalars["ID"]["input"];
  /** Activity title */
  title: Scalars["String"]["input"];
  /** Trip ID */
  tripId: Scalars["ID"]["input"];
};

/** Input for creating a new challenge submission */
export type CreateSubmissionInput = {
  /** ID of the challenge to submit to */
  challengeId: Scalars["ID"]["input"];
  /** ID of the group making the submission */
  groupId: Scalars["ID"]["input"];
  /** IDs of uploaded images (max 10) */
  imageIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Latitude coordinate */
  latitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** Longitude coordinate */
  longitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** Text content of the submission */
  textContent?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of uploaded video */
  videoId?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for creating a new trip */
export type CreateTripInput = {
  /** URL to background image */
  backgroundImagePath?: InputMaybe<Scalars["String"]["input"]>;
  /** Trip description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Trip end date */
  endDate: Scalars["DateTime"]["input"];
  /** Trip name */
  name: Scalars["String"]["input"];
  /** Trip start date */
  startDate: Scalars["DateTime"]["input"];
};

/** Input for creating a signed upload URL */
export type CreateUploadUrlInput = {
  /** The full storage path (bucket/path) for the file */
  storagePath: Scalars["String"]["input"];
  /** Whether to overwrite existing file (defaults to false) */
  upsert?: InputMaybe<Scalars["Boolean"]["input"]>;
};

/** Input for creating a new user */
export type CreateUserInput = {
  /** External authentication provider user ID (required) */
  authUserId: Scalars["String"]["input"];
  /** User's first name (2-100 characters, no digits) */
  firstName: Scalars["String"]["input"];
  /** User's last name (2-100 characters, no digits) */
  lastName: Scalars["String"]["input"];
  /** User's role (defaults to USER) */
  role?: InputMaybe<UserRole>;
};

/** Input for creating a user post activity */
export type CreateUserPostInput = {
  /** Additional image URLs (max 10) */
  additionalImages?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** Post description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Post image URL */
  imageUrl?: InputMaybe<Scalars["String"]["input"]>;
  /** Post title */
  title: Scalars["String"]["input"];
  /** Trip ID to create post for */
  tripId: Scalars["ID"]["input"];
};

/** Input for deleting an activity */
export type DeleteActivityInput = {
  /** Activity ID to delete */
  activityId: Scalars["ID"]["input"];
};

/** Result of deleting an activity */
export type DeleteActivityResult = {
  __typename?: "DeleteActivityResult";
  /** Whether deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Result of deleting a group */
export type DeleteGroupPayload = {
  __typename?: "DeleteGroupPayload";
  /** Whether the deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Input for deleting a notification */
export type DeleteNotificationInput = {
  /** ID of notification to delete */
  notificationId: Scalars["ID"]["input"];
};

/** Result of deleting a notification */
export type DeleteNotificationResult = {
  __typename?: "DeleteNotificationResult";
  /** Whether deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Result of deleting a notification schedule */
export type DeleteNotificationSchedulePayload = {
  __typename?: "DeleteNotificationSchedulePayload";
  /** Number of execution history records deleted */
  deletedExecutionCount?: Maybe<Scalars["Int"]["output"]>;
  /** Status message */
  message: Scalars["String"]["output"];
  /** Whether the deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Result of deleting a reward */
export type DeleteRewardPayload = {
  __typename?: "DeleteRewardPayload";
  /** ID of the deleted reward */
  deletedRewardId: Scalars["ID"]["output"];
  /** Whether the deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Result of deleting a sponsor */
export type DeleteSponsorPayload = {
  __typename?: "DeleteSponsorPayload";
  /** ID of the deleted sponsor */
  id: Scalars["ID"]["output"];
  /** Whether the deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Input for deleting a trip */
export type DeleteTripInput = {
  /** Trip ID to delete */
  id: Scalars["ID"]["input"];
};

/** Result of deleting a trip */
export type DeleteTripResult = {
  __typename?: "DeleteTripResult";
  /** Whether deletion was successful */
  success: Scalars["Boolean"]["output"];
};

/** Pagination information for delivery queries */
export type DeliveryPagination = {
  __typename?: "DeliveryPagination";
  /** Number of items per page */
  limit: Scalars["Int"]["output"];
  /** Current offset */
  offset: Scalars["Int"]["output"];
  /** Total number of matching deliveries */
  total: Scalars["Int"]["output"];
};

/** Statistics for notification deliveries */
export type DeliveryStats = {
  __typename?: "DeliveryStats";
  /** Average failed deliveries per batch */
  avgFailuresPerDelivery: Scalars["Float"]["output"];
  /** Average successful deliveries per batch */
  avgSuccessPerDelivery: Scalars["Float"]["output"];
  /** Breakdown of deliveries by status */
  statusBreakdown: DeliveryStatusBreakdown;
  /** Overall success rate (0.0 - 1.0) */
  successRate: Scalars["Float"]["output"];
  /** Total number of deliveries */
  totalDeliveries: Scalars["Int"]["output"];
  /** Total failed deliveries */
  totalFailures: Scalars["Int"]["output"];
  /** Total intended recipients across all deliveries */
  totalRecipients: Scalars["Int"]["output"];
  /** Total successful deliveries */
  totalSuccess: Scalars["Int"]["output"];
};

/** Status of a notification delivery */
export enum DeliveryStatus {
  Failure = "FAILURE",
  PartialFailure = "PARTIAL_FAILURE",
  Pending = "PENDING",
  Success = "SUCCESS",
}

/** Count of deliveries per status */
export type DeliveryStatusBreakdown = {
  __typename?: "DeliveryStatusBreakdown";
  /** Number of failed deliveries */
  failure: Scalars["Int"]["output"];
  /** Number of partially failed deliveries */
  partialFailure: Scalars["Int"]["output"];
  /** Number of pending deliveries */
  pending: Scalars["Int"]["output"];
  /** Number of successful deliveries */
  success: Scalars["Int"]["output"];
};

/** Result of creating a signed download URL */
export type DownloadUrlResult = {
  __typename?: "DownloadUrlResult";
  /** When the signed URL expires */
  expiresAt: Scalars["DateTime"]["output"];
  /** The signed URL for downloading the file */
  signedUrl: Scalars["String"]["output"];
};

/** Result of duplicating a notification schedule */
export type DuplicateNotificationSchedulePayload = {
  __typename?: "DuplicateNotificationSchedulePayload";
  /** The duplicated schedule */
  schedule: NotificationSchedule;
};

/** A single execution history record */
export type ExecutionHistoryEntry = {
  __typename?: "ExecutionHistoryEntry";
  /** When the execution occurred */
  executedAt: Scalars["DateTime"]["output"];
  /** Execution record ID */
  id: Scalars["ID"]["output"];
  /** The notification that was sent (null if failed) */
  notification?: Maybe<ExecutionHistoryNotification>;
};

/** Notification details in execution history */
export type ExecutionHistoryNotification = {
  __typename?: "ExecutionHistoryNotification";
  /** Notification body */
  body: Scalars["String"]["output"];
  /** When the notification was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Notification ID */
  id: Scalars["ID"]["output"];
  /** Notification title */
  title: Scalars["String"]["output"];
};

/** Result of querying execution history */
export type ExecutionHistoryResult = {
  __typename?: "ExecutionHistoryResult";
  /** List of execution history entries */
  executions: Array<ExecutionHistoryEntry>;
};

/** Input for forcing the end of judged staff voting */
export type ForceEndVotingInput = {
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
  /** ID of the trip (for validation) */
  tripId: Scalars["ID"]["input"];
};

/** Result of forcing the end of judged staff voting */
export type ForceEndVotingPayload = {
  __typename?: "ForceEndVotingPayload";
  /** ID of the challenge */
  challengeId: Scalars["ID"]["output"];
  /** Final status of the challenge */
  challengeStatus: Scalars["String"]["output"];
  /** Whether voting was finalized */
  finalized: Scalars["Boolean"]["output"];
  /** Whether the operation succeeded */
  success: Scalars["Boolean"]["output"];
  /** Total number of votes counted */
  totalVotes: Scalars["Int"]["output"];
};

/** User information formatted for display */
export type FormattedUser = {
  __typename?: "FormattedUser";
  /** User's full name */
  name: Scalars["String"]["output"];
  /** Number of transactions by this user */
  transactionCount: Scalars["Int"]["output"];
};

/** A friend's location with optional distance information */
export type FriendLocation = {
  __typename?: "FriendLocation";
  /** Accuracy in meters */
  accuracy?: Maybe<Scalars["Float"]["output"]>;
  /** Altitude in meters */
  altitude?: Maybe<Scalars["Float"]["output"]>;
  /** Distance from current user in kilometers */
  distanceKm?: Maybe<Scalars["Float"]["output"]>;
  /** Heading in degrees */
  heading?: Maybe<Scalars["Float"]["output"]>;
  /** Location ID */
  id: Scalars["ID"]["output"];
  /** Whether friend is sharing location */
  isSharingLocation: Scalars["Boolean"]["output"];
  /** Latitude */
  latitude?: Maybe<Scalars["Float"]["output"]>;
  /** Longitude */
  longitude?: Maybe<Scalars["Float"]["output"]>;
  /** Speed in m/s */
  speed?: Maybe<Scalars["Float"]["output"]>;
  /** When location was recorded */
  timestamp: Scalars["DateTime"]["output"];
  /** Friend's user ID */
  userId: Scalars["ID"]["output"];
};

/** A list of friends' locations */
export type FriendsLocationsConnection = {
  __typename?: "FriendsLocationsConnection";
  /** Friends' locations */
  locations: Array<FriendLocation>;
  /** Total number of locations */
  total: Scalars["Int"]["output"];
};

/** Input for fetching all coin transactions (moderator view) */
export type GetAllCoinTransactionsInput = {
  /** Pagination parameters */
  pagination?: InputMaybe<CoinTransactionPaginationInput>;
  /** Trip ID to fetch transactions for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching all notifications (admin only) */
export type GetAllNotificationsInput = {
  /** Pagination options */
  pagination?: InputMaybe<NotificationOffsetPaginationInput>;
  /** Optional trip ID to filter by */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
};

/** Input for fetching a single activity by ID */
export type GetByIdInput = {
  /** Activity ID to fetch */
  id: Scalars["ID"]["input"];
};

/** Input for fetching activities by trip ID */
export type GetByTripInput = {
  /** Cursor for pagination */
  cursor?: InputMaybe<ActivityCursorInput>;
  /** Number of activities to return (1-100) */
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  /** Trip ID to fetch activities for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching activities for moderation */
export type GetByTripModerationInput = {
  /** Page number (1-based) */
  page?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of activities to return (1-100) */
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
  /** Trip ID to fetch activities for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching additional coin insights */
export type GetCoinAdditionalInsightsInput = {
  /** Trip ID to fetch insights for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching quick coin statistics */
export type GetCoinQuickStatsInput = {
  /** Trip ID to fetch statistics for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching coin statistics */
export type GetCoinStatisticsInput = {
  /** Trip ID to fetch statistics for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching notification deliveries with filters */
export type GetDeliveriesInput = {
  /** Filter deliveries before this date */
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Number of deliveries to return (1-100, default 50) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Offset for pagination (default 0) */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  /** Filter by schedule ID */
  scheduleId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter deliveries after this date */
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Filter by delivery status */
  status?: InputMaybe<DeliveryStatus>;
  /** Filter by trip ID */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
};

/** Input for fetching a delivery by notification ID */
export type GetDeliveryByNotificationIdInput = {
  /** Notification ID to look up */
  notificationId: Scalars["ID"]["input"];
  /** Trip ID for the notification */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching delivery statistics */
export type GetDeliveryStatsInput = {
  /** Filter deliveries before this date */
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Filter by schedule ID */
  scheduleId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Filter deliveries after this date */
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Filter by trip ID */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
};

/** Input for fetching failed deliveries */
export type GetFailedDeliveriesInput = {
  /** Number of deliveries to return (1-100, default 20) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Offset for pagination (default 0) */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  /** Filter by trip ID */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
};

/** Input for fetching judged staff voting progress */
export type GetJudgedStaffVotingProgressInput = {
  /** IDs of admin participants */
  adminParticipantIds: Array<Scalars["ID"]["input"]>;
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
  /** Number of eligible submissions */
  eligibleSubmissionsCount: Scalars["Int"]["input"];
  /** Number of positions required per admin (1-3) */
  requiredPositions: Scalars["Int"]["input"];
  /** ID of the trip */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching most active admin statistics */
export type GetMostActiveAdminStatsInput = {
  /** Trip ID to fetch statistics for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching my votes for a challenge */
export type GetMyVotesInput = {
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
  /** ID of the trip (for participant validation) */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching reports for a specific submission */
export type GetReportsBySubmissionInput = {
  /** ID of the submission to get reports for */
  submissionId: Scalars["ID"]["input"];
};

/** Input for fetching coin transactions visible to a user */
export type GetUserCoinTransactionsInput = {
  /** Optional group ID to filter by */
  groupId?: InputMaybe<Scalars["ID"]["input"]>;
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Trip ID to fetch transactions for */
  tripId: Scalars["ID"]["input"];
};

/** Input for fetching all votes for a challenge */
export type GetVotesByChallengeInput = {
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
};

/** Input for fetching voting progress */
export type GetVotingProgressInput = {
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
};

/** A participant group in a trip */
export type Group = {
  __typename?: "Group";
  /** Unique code for joining the group */
  code: Scalars["String"]["output"];
  /** Number of coins the group has earned */
  coins: Scalars["Int"]["output"];
  /** When the group was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Group description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Unique identifier for the group (UUID) */
  id: Scalars["ID"]["output"];
  /** Group image URL */
  image?: Maybe<Scalars["String"]["output"]>;
  /** Whether the group is currently active (not deleted) */
  isActive: Scalars["Boolean"]["output"];
  /** Group name */
  name: Scalars["String"]["output"];
  /** ID of the user who organized the group */
  organizerId: Scalars["ID"]["output"];
  /** Current status of the group */
  status: GroupStatus;
  /** ID of the trip this group belongs to */
  tripId: Scalars["ID"]["output"];
  /** When the group was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Pagination metadata for group lists */
export type GroupPagination = {
  __typename?: "GroupPagination";
  /** Whether more items are available */
  hasMore: Scalars["Boolean"]["output"];
  /** Number of items per page */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped */
  offset: Scalars["Int"]["output"];
  /** Total number of groups available */
  total: Scalars["Int"]["output"];
};

/** Pagination parameters for group queries */
export type GroupPaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Group information for ranking displays */
export type GroupRanking = {
  __typename?: "GroupRanking";
  /** Unique group code */
  code: Scalars["String"]["output"];
  /** Number of coins earned */
  coins: Scalars["Int"]["output"];
  /** When the group was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Group description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Unique identifier for the group */
  id: Scalars["ID"]["output"];
  /** Group image URL */
  image?: Maybe<Scalars["String"]["output"]>;
  /** Whether the group is active */
  isActive: Scalars["Boolean"]["output"];
  /** Group name */
  name: Scalars["String"]["output"];
  /** ID of the group organizer */
  organizerId: Scalars["ID"]["output"];
  /** Current status of the group */
  status: GroupStatus;
  /** ID of the trip this group belongs to */
  tripId: Scalars["ID"]["output"];
};

/** Result of fetching group rankings for a trip */
export type GroupRankingResult = {
  __typename?: "GroupRankingResult";
  /** Current date for the ranking */
  currentDate: Scalars["DateTime"]["output"];
  /** Groups sorted by coins (descending) */
  data: Array<GroupRanking>;
};

/** Current status of a group in the system */
export enum GroupStatus {
  Active = "ACTIVE",
  Deleted = "DELETED",
}

/** A simplified view of a group for list displays */
export type GroupSummary = {
  __typename?: "GroupSummary";
  /** Unique identifier for the group */
  id: Scalars["ID"]["output"];
  /** Group name */
  name: Scalars["String"]["output"];
};

/** A paginated list of groups with metadata */
export type GroupsConnection = {
  __typename?: "GroupsConnection";
  /** The groups in this page */
  groups: Array<Group>;
  /** Pagination metadata */
  pagination: GroupPagination;
};

/** Activity result with hide information */
export type HiddenActivityResult = {
  __typename?: "HiddenActivityResult";
  /** Type of activity */
  activityType: ActivityType;
  /** Activity description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** When activity was hidden */
  hiddenAt: Scalars["DateTime"]["output"];
  /** Reason for hiding */
  hiddenReason?: Maybe<Scalars["String"]["output"]>;
  /** Activity ID */
  id: Scalars["ID"]["output"];
  /** Activity image URL */
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  /** Whether activity is hidden */
  isHidden: Scalars["Boolean"]["output"];
  /** Whether activity is pinned */
  isPinned: Scalars["Boolean"]["output"];
  /** Activity title */
  title: Scalars["String"]["output"];
  /** Trip ID */
  tripId: Scalars["ID"]["output"];
  /** When activity was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Input for hiding an activity */
export type HideActivityInput = {
  /** Activity ID to hide */
  activityId: Scalars["ID"]["input"];
  /** Reason for hiding */
  reason?: InputMaybe<Scalars["String"]["input"]>;
};

/** Voting progress for judged staff challenges */
export type JudgedStaffVotingProgress = {
  __typename?: "JudgedStaffVotingProgress";
  /** Voting progress for each admin */
  adminProgress: Array<AdminVotingInfo>;
  /** Whether all admins have completed voting */
  allAdminsVoted: Scalars["Boolean"]["output"];
  /** Number of submissions eligible for voting */
  eligibleSubmissionsCount: Scalars["Int"]["output"];
  /** Number of admins who haven't completed voting */
  pendingAdmins: Scalars["Int"]["output"];
  /** Number of positions required per admin (1-3) */
  requiredPositions: Scalars["Int"]["output"];
  /** Total number of admin participants */
  totalAdmins: Scalars["Int"]["output"];
  /** Number of admins who have completed voting */
  votedAdmins: Scalars["Int"]["output"];
};

/** Status of the last schedule execution */
export enum LastRunStatus {
  Failure = "FAILURE",
  Partial = "PARTIAL",
  Success = "SUCCESS",
}

/** Input for linking a sponsor to a trip */
export type LinkSponsorToTripInput = {
  /** ID of the sponsor to link */
  sponsorId: Scalars["ID"]["input"];
  /** ID of the trip to link to */
  tripId: Scalars["ID"]["input"];
};

/** Result of linking a sponsor to a trip */
export type LinkSponsorToTripPayload = {
  __typename?: "LinkSponsorToTripPayload";
  /** Whether the link was successful */
  linked: Scalars["Boolean"]["output"];
  /** ID of the sponsor */
  sponsorId: Scalars["ID"]["output"];
  /** ID of the trip */
  tripId: Scalars["ID"]["output"];
};

/** A user's geographic location */
export type Location = {
  __typename?: "Location";
  /** Location accuracy in meters */
  accuracy?: Maybe<Scalars["Float"]["output"]>;
  /** Altitude in meters above sea level */
  altitude?: Maybe<Scalars["Float"]["output"]>;
  /** Altitude accuracy in meters */
  altitudeAccuracy?: Maybe<Scalars["Float"]["output"]>;
  /** Direction of travel in degrees (0-360) */
  heading?: Maybe<Scalars["Float"]["output"]>;
  /** Unique identifier for the location record (UUID) */
  id: Scalars["ID"]["output"];
  /** Whether the user is sharing their location with friends */
  isSharingLocation: Scalars["Boolean"]["output"];
  /** Geographic latitude (-90 to 90 degrees) */
  latitude?: Maybe<Scalars["Float"]["output"]>;
  /** Geographic longitude (-180 to 180 degrees) */
  longitude?: Maybe<Scalars["Float"]["output"]>;
  /** Speed in meters per second */
  speed?: Maybe<Scalars["Float"]["output"]>;
  /** When the location was last updated */
  timestamp: Scalars["DateTime"]["output"];
  /** ID of the user this location belongs to */
  userId: Scalars["ID"]["output"];
  /** List of users allowed to see this location */
  usersToShareWith: Array<SharingUserInfo>;
};

/** Location sharing settings for a user */
export type LocationSharingSettings = {
  __typename?: "LocationSharingSettings";
  /** Whether location sharing is enabled */
  isSharingLocation: Scalars["Boolean"]["output"];
  /** Users allowed to see this location */
  usersToShareWith: Array<SharingUserInfo>;
};

/** Pagination information for moderation view */
export type ModerationPaginationInfo = {
  __typename?: "ModerationPaginationInfo";
  /** Whether there are more pages */
  hasMore: Scalars["Boolean"]["output"];
  /** Current page number */
  page: Scalars["Int"]["output"];
  /** Items per page */
  pageSize: Scalars["Int"]["output"];
  /** Total number of activities */
  total: Scalars["Int"]["output"];
  /** Total number of pages */
  totalPages: Scalars["Int"]["output"];
};

/** Statistics about the most active admin by transaction volume */
export type MostActiveAdminStats = {
  __typename?: "MostActiveAdminStats";
  /** ID of the most active admin */
  adminId: Scalars["ID"]["output"];
  /** Full name of the admin (resolved separately) */
  adminName?: Maybe<Scalars["String"]["output"]>;
  /** Total amount of coins this admin has processed */
  totalAmount: Scalars["Int"]["output"];
  /** Number of transactions performed by this admin */
  transactionCount: Scalars["Int"]["output"];
};

/** Root mutation type for modifying data */
export type Mutation = {
  __typename?: "Mutation";
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
  /** Delete a challenge submission (only allowed for pending submissions) */
  deleteChallengeSubmission?: Maybe<Scalars["Boolean"]["output"]>;
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
  ids: Array<Scalars["ID"]["input"]>;
};

/** Root mutation type for modifying data */
export type MutationBulkToggleNotificationScheduleActiveArgs = {
  ids: Array<Scalars["ID"]["input"]>;
  isActive: Scalars["Boolean"]["input"];
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
export type MutationDeleteChallengeSubmissionArgs = {
  submissionId: Scalars["ID"]["input"];
};

/** Root mutation type for modifying data */
export type MutationDeleteGroupArgs = {
  id: Scalars["ID"]["input"];
};

/** Root mutation type for modifying data */
export type MutationDeleteNotificationArgs = {
  input: DeleteNotificationInput;
};

/** Root mutation type for modifying data */
export type MutationDeleteNotificationScheduleArgs = {
  id: Scalars["ID"]["input"];
};

/** Root mutation type for modifying data */
export type MutationDeleteRewardArgs = {
  id: Scalars["ID"]["input"];
};

/** Root mutation type for modifying data */
export type MutationDeleteSponsorArgs = {
  id: Scalars["ID"]["input"];
};

/** Root mutation type for modifying data */
export type MutationDeleteTripArgs = {
  input: DeleteTripInput;
};

/** Root mutation type for modifying data */
export type MutationDuplicateNotificationScheduleArgs = {
  id: Scalars["ID"]["input"];
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
  id: Scalars["ID"]["input"];
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
  __typename?: "MyNotificationsResult";
  /** List of notifications */
  notifications: Array<Notification>;
  /** Pagination information */
  pagination: NotificationPaginationInfo;
};

/** A notification message */
export type Notification = {
  __typename?: "Notification";
  /** Notification body content */
  body: Scalars["String"]["output"];
  /** When notification was created */
  createdAt: Scalars["DateTime"]["output"];
  /** User ID who created the notification */
  createdById: Scalars["ID"]["output"];
  /** Unique notification ID */
  id: Scalars["ID"]["output"];
  /** Whether notification is ready to be sent */
  isReadyToSend?: Maybe<Scalars["Boolean"]["output"]>;
  /** Whether notification is scheduled for future delivery */
  isScheduled: Scalars["Boolean"]["output"];
  /** Whether notification has been sent */
  isSent: Scalars["Boolean"]["output"];
  /** Priority level */
  priority: NotificationPriority;
  /** When notification is scheduled to be sent */
  scheduledFor?: Maybe<Scalars["DateTime"]["output"]>;
  /** When notification was actually sent */
  sentAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Current status */
  status: NotificationStatus;
  /** Notification title */
  title: Scalars["String"]["output"];
  /** Associated trip ID (null if global) */
  tripId?: Maybe<Scalars["ID"]["output"]>;
  /** When notification was last updated */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** Optional URL to open when tapped */
  url?: Maybe<Scalars["String"]["output"]>;
};

/** Creator of the notification */
export type NotificationCreator = {
  __typename?: "NotificationCreator";
  /** Auth provider user ID */
  authUserId?: Maybe<Scalars["String"]["output"]>;
  /** Creator first name */
  firstName?: Maybe<Scalars["String"]["output"]>;
  /** Creator user ID */
  id: Scalars["ID"]["output"];
  /** Creator last name */
  lastName?: Maybe<Scalars["String"]["output"]>;
};

/** A notification delivery record */
export type NotificationDelivery = {
  __typename?: "NotificationDelivery";
  /** When delivery record was created */
  createdAt: Scalars["DateTime"]["output"];
  /** When delivery completed (null if still in progress) */
  deliveryCompletedAt?: Maybe<Scalars["DateTime"]["output"]>;
  /** When delivery started */
  deliveryStartedAt: Scalars["DateTime"]["output"];
  /** Error log for failed deliveries */
  errorLog?: Maybe<Scalars["String"]["output"]>;
  /** Number of failed deliveries */
  failureCount: Scalars["Int"]["output"];
  /** Unique delivery ID */
  id: Scalars["ID"]["output"];
  /** Associated notification details */
  notification?: Maybe<NotificationInfo>;
  /** ID of the notification being delivered */
  notificationId: Scalars["ID"]["output"];
  /** Associated schedule ID if scheduled delivery */
  scheduleId?: Maybe<Scalars["ID"]["output"]>;
  /** Current delivery status */
  status: DeliveryStatus;
  /** Number of successful deliveries */
  successCount: Scalars["Int"]["output"];
  /** Total number of intended recipients */
  totalRecipients: Scalars["Int"]["output"];
  /** Trip ID this delivery belongs to */
  tripId: Scalars["ID"]["output"];
  /** When delivery record was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Result of fetching a list of notification deliveries */
export type NotificationDeliveryListResult = {
  __typename?: "NotificationDeliveryListResult";
  /** List of deliveries */
  deliveries: Array<NotificationDelivery>;
  /** Pagination information */
  pagination: DeliveryPagination;
};

/** Status of a notification delivery */
export enum NotificationDeliveryStatus {
  Failure = "FAILURE",
  PartialFailure = "PARTIAL_FAILURE",
  Pending = "PENDING",
  Success = "SUCCESS",
}

/** Notification information within a delivery */
export type NotificationInfo = {
  __typename?: "NotificationInfo";
  /** Notification body */
  body: Scalars["String"]["output"];
  /** When notification was created */
  createdAt: Scalars["DateTime"]["output"];
  /** User who created the notification */
  createdBy?: Maybe<NotificationCreator>;
  /** Notification ID */
  id: Scalars["ID"]["output"];
  /** Notification title */
  title: Scalars["String"]["output"];
  /** Trip ID the notification belongs to */
  tripId?: Maybe<Scalars["ID"]["output"]>;
  /** Notification URL/deep link */
  url?: Maybe<Scalars["String"]["output"]>;
};

/** Offset-based pagination information */
export type NotificationOffsetPaginationInfo = {
  __typename?: "NotificationOffsetPaginationInfo";
  /** Whether there are more items */
  hasMore: Scalars["Boolean"]["output"];
  /** Items per page */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped */
  offset: Scalars["Int"]["output"];
  /** Total number of items */
  total: Scalars["Int"]["output"];
};

/** Offset-based pagination for admin queries */
export type NotificationOffsetPaginationInput = {
  /** Number of items to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Pagination information for notification lists */
export type NotificationPaginationInfo = {
  __typename?: "NotificationPaginationInfo";
  /** Current page number */
  page: Scalars["Int"]["output"];
  /** Items per page */
  pageSize: Scalars["Int"]["output"];
  /** Total number of items */
  total: Scalars["Int"]["output"];
  /** Total number of pages */
  totalPages: Scalars["Int"]["output"];
};

/** Pagination input for notification queries */
export type NotificationPaginationInput = {
  /** Page number (1-based) */
  page?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of items per page (1-100) */
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Priority level of a notification */
export enum NotificationPriority {
  High = "HIGH",
  Low = "LOW",
  Normal = "NORMAL",
  Urgent = "URGENT",
}

/** A scheduled notification campaign */
export type NotificationSchedule = {
  __typename?: "NotificationSchedule";
  /** When the schedule was created */
  createdAt: Scalars["DateTime"]["output"];
  /** ID of the user who created this schedule */
  createdById: Scalars["ID"]["output"];
  /** When the schedule expires */
  endDate: Scalars["DateTime"]["output"];
  /** Formatted time string (HH:MM) */
  formattedTime: Scalars["String"]["output"];
  /** Scheduled hour (0-23) */
  hour: Scalars["Int"]["output"];
  /** Unique identifier for the schedule (UUID) */
  id: Scalars["ID"]["output"];
  /** Whether the schedule is enabled */
  isActive: Scalars["Boolean"]["output"];
  /** Whether the schedule is currently within its active time window */
  isCurrentlyActive: Scalars["Boolean"]["output"];
  /** Whether the schedule has passed its end date */
  isExpired: Scalars["Boolean"]["output"];
  /** Whether the schedule has not yet reached its start date */
  isUpcoming: Scalars["Boolean"]["output"];
  /** When the schedule last ran (null if never run) */
  lastRun?: Maybe<Scalars["DateTime"]["output"]>;
  /** Scheduled minute (0-59) */
  minute: Scalars["Int"]["output"];
  /** Schedule name/campaign name */
  name: Scalars["String"]["output"];
  /** Notification body content (optional for INFO type) */
  notificationBody?: Maybe<Scalars["String"]["output"]>;
  /** Notification title (optional for INFO type) */
  notificationTitle?: Maybe<Scalars["String"]["output"]>;
  /** Type of notification to send */
  notificationType: NotificationScheduleType;
  /** Optional URL to include in the notification */
  notificationUrl?: Maybe<Scalars["String"]["output"]>;
  /** When the schedule becomes active */
  startDate: Scalars["DateTime"]["output"];
  /** ID of the trip this schedule is associated with (optional) */
  tripId?: Maybe<Scalars["ID"]["output"]>;
  /** When the schedule was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Filter options for notification schedule queries */
export type NotificationScheduleFilterInput = {
  /** Filter by active status */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** Filter by notification type */
  notificationType?: InputMaybe<NotificationScheduleType>;
  /** Search by name */
  search?: InputMaybe<Scalars["String"]["input"]>;
  /** Filter by start date (from) */
  startDateFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Filter by start date (to) */
  startDateTo?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Filter by associated trip ID */
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
};

/** Pagination metadata for notification schedule lists */
export type NotificationSchedulePagination = {
  __typename?: "NotificationSchedulePagination";
  /** Whether more items are available */
  hasMore: Scalars["Boolean"]["output"];
  /** Number of items per page */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped */
  offset: Scalars["Int"]["output"];
  /** Total number of schedules available */
  total: Scalars["Int"]["output"];
};

/** Pagination parameters for list queries */
export type NotificationSchedulePaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** A simplified view of a notification schedule for list displays */
export type NotificationScheduleSummary = {
  __typename?: "NotificationScheduleSummary";
  /** Schedule end date */
  endDate: Scalars["DateTime"]["output"];
  /** Scheduled hour */
  hour: Scalars["Int"]["output"];
  /** Unique identifier for the schedule */
  id: Scalars["ID"]["output"];
  /** Whether the schedule is enabled */
  isActive: Scalars["Boolean"]["output"];
  /** Scheduled minute */
  minute: Scalars["Int"]["output"];
  /** Schedule name */
  name: Scalars["String"]["output"];
  /** Type of notification */
  notificationType: NotificationScheduleType;
  /** Schedule start date */
  startDate: Scalars["DateTime"]["output"];
  /** Associated trip ID */
  tripId?: Maybe<Scalars["ID"]["output"]>;
};

/** Type of scheduled notification */
export enum NotificationScheduleType {
  Announcement = "ANNOUNCEMENT",
  Challenge = "CHALLENGE",
  DailyRanking = "DAILY_RANKING",
  Info = "INFO",
  Reminder = "REMINDER",
}

/** A paginated list of notification schedules with metadata */
export type NotificationSchedulesConnection = {
  __typename?: "NotificationSchedulesConnection";
  /** Pagination metadata */
  pagination: NotificationSchedulePagination;
  /** The schedules in this page */
  schedules: Array<NotificationScheduleSummary>;
};

/** Status of a notification */
export enum NotificationStatus {
  Cancelled = "CANCELLED",
  Draft = "DRAFT",
  Failed = "FAILED",
  Ready = "READY",
  Sent = "SENT",
}

/** Direction for ordering results */
export enum OrderDirection {
  Asc = "asc",
  Desc = "desc",
}

/** Pagination information for activity feed */
export type PaginationInfo = {
  __typename?: "PaginationInfo";
  /** Whether there are more items */
  hasMore: Scalars["Boolean"]["output"];
  /** Number of items per page */
  pageSize: Scalars["Int"]["output"];
};

/** Pagination parameters for list queries */
export type PaginationInput = {
  /** Maximum number of items to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of items to skip */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Result of creating a public URL */
export type PublicUrlResult = {
  __typename?: "PublicUrlResult";
  /** The public URL for accessing the file */
  publicUrl: Scalars["String"]["output"];
};

/** A paginated list of reward purchases with metadata */
export type PurchaseHistoryConnection = {
  __typename?: "PurchaseHistoryConnection";
  /** Pagination metadata */
  pagination: RewardPagination;
  /** The purchases in this page */
  purchases: Array<RewardPurchase>;
};

/** Input for purchasing a reward */
export type PurchaseRewardInput = {
  /** Number of rewards to purchase (min 1) */
  quantity: Scalars["Int"]["input"];
  /** ID of the reward to purchase */
  rewardId: Scalars["ID"]["input"];
};

/** Result of purchasing a reward */
export type PurchaseRewardPayload = {
  __typename?: "PurchaseRewardPayload";
  /** The purchase record */
  purchase: RewardPurchase;
  /** Remaining coins in the group after purchase */
  remainingGroupCoins: Scalars["Int"]["output"];
  /** Remaining quantity of the reward after purchase */
  remainingRewardQuantity: Scalars["Int"]["output"];
};

/** Root query type for fetching data */
export type Query = {
  __typename?: "Query";
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
  /** Get a challenge submission by its unique ID */
  challengeSubmission?: Maybe<ChallengeSubmission>;
  /** Get a submission by challenge ID and group ID */
  challengeSubmissionByChallengeAndGroup?: Maybe<ChallengeSubmission>;
  /** List all submissions for a challenge with pagination and sorting */
  challengeSubmissions?: Maybe<ChallengeSubmissionListResult>;
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
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
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
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryAllNotificationsArgs = {
  input?: InputMaybe<GetAllNotificationsInput>;
};

/** Root query type for fetching data */
export type QueryChallengeSubmissionArgs = {
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryChallengeSubmissionByChallengeAndGroupArgs = {
  challengeId: Scalars["ID"]["input"];
  groupId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryChallengeSubmissionsArgs = {
  challengeId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<SubmissionOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
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
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryGroupByCodeArgs = {
  code: Scalars["String"]["input"];
};

/** Root query type for fetching data */
export type QueryGroupNamesByTripArgs = {
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryGroupRankingArgs = {
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryGroupsArgs = {
  pagination?: InputMaybe<GroupPaginationInput>;
};

/** Root query type for fetching data */
export type QueryGroupsByOrganizerArgs = {
  organizerId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryGroupsByTripArgs = {
  pagination?: InputMaybe<GroupPaginationInput>;
  tripId: Scalars["ID"]["input"];
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
  id: Scalars["ID"]["input"];
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
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryNotificationScheduleExecutionHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
  scheduleId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryNotificationSchedulesArgs = {
  filter?: InputMaybe<NotificationScheduleFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};

/** Root query type for fetching data */
export type QueryPurchaseHistoryArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryRewardArgs = {
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryRewardsByTripArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryRewardsByTripAdminArgs = {
  pagination?: InputMaybe<PaginationInput>;
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QuerySponsorArgs = {
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QuerySponsorsByTripArgs = {
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QuerySubmissionReportsArgs = {
  submissionId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryTotalAvailablePointsArgs = {
  tripId: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryTripArgs = {
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryTripAdminArgs = {
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryTripsArgs = {
  pagination?: InputMaybe<TripPaginationInput>;
};

/** Root query type for fetching data */
export type QueryUpcomingNotificationSchedulesArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  withinMinutes?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Root query type for fetching data */
export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

/** Root query type for fetching data */
export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
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
  __typename?: "ReactionCounts";
  /** Number of clap reactions */
  clap: Scalars["Int"]["output"];
  /** Number of fire reactions */
  fire: Scalars["Int"]["output"];
  /** Number of heart reactions */
  heart: Scalars["Int"]["output"];
  /** Number of star reactions */
  star: Scalars["Int"]["output"];
};

/** Types of reactions users can add to activities */
export enum ReactionType {
  Clap = "CLAP",
  Fire = "FIRE",
  Heart = "HEART",
  Star = "STAR",
}

/** Summary of reactions on an activity */
export type ReactionsSummary = {
  __typename?: "ReactionsSummary";
  /** Counts per reaction type */
  counts: ReactionCounts;
  /** Current user's reactions */
  myReactions: Array<ReactionType>;
  /** Total number of reactions */
  total: Scalars["Int"]["output"];
};

/** Input for removing coins from a group */
export type RemoveCoinsInput = {
  /** Amount of coins to remove (must be at least 1) */
  amount: Scalars["Int"]["input"];
  /** ID of the group to remove coins from */
  groupId: Scalars["ID"]["input"];
  /** Reason for removing coins (optional) */
  reason?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the trip the group belongs to */
  tripId: Scalars["ID"]["input"];
};

/** Input for removing a user from location sharing */
export type RemoveSharingUserInput = {
  /** ID of the user to remove */
  userId: Scalars["ID"]["input"];
};

/** Standard reasons for reporting a submission */
export enum ReportReason {
  Cheating = "CHEATING",
  Inappropriate = "INAPPROPRIATE",
  Other = "OTHER",
  Spam = "SPAM",
  WrongSubmission = "WRONG_SUBMISSION",
}

/** Action to take when reviewing a submission */
export enum ReviewAction {
  Approve = "APPROVE",
  Reject = "REJECT",
}

/** A reward that can be purchased with coins in a trip */
export type Reward = {
  __typename?: "Reward";
  /** Number of rewards available for purchase */
  availableQuantity: Scalars["Int"]["output"];
  /** Whether the reward can be purchased (in stock and not hidden) */
  canBePurchased: Scalars["Boolean"]["output"];
  /** Percentage of total trip points that this reward costs (1-100) */
  coinCostPercentage: Scalars["Int"]["output"];
  /** When the reward was created */
  createdAt: Scalars["DateTime"]["output"];
  /** ID of the user who created this reward */
  createdById: Scalars["ID"]["output"];
  /** Reward description */
  description: Scalars["String"]["output"];
  /** Unique identifier for the reward (UUID) */
  id: Scalars["ID"]["output"];
  /** Array of reward image URLs */
  images: Array<Scalars["String"]["output"]>;
  /** Whether the reward is hidden from users */
  isHidden: Scalars["Boolean"]["output"];
  /** Whether the reward is currently in stock */
  isInStock: Scalars["Boolean"]["output"];
  /** Reward name/title */
  name: Scalars["String"]["output"];
  /** Primary/main image URL (first image or null) */
  primaryImage?: Maybe<Scalars["String"]["output"]>;
  /** Number of times this reward has been purchased */
  purchaseCount: Scalars["Int"]["output"];
  /** ID of the trip this reward belongs to */
  tripId: Scalars["ID"]["output"];
  /** When the reward was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Pagination metadata for reward lists */
export type RewardPagination = {
  __typename?: "RewardPagination";
  /** Whether more items are available */
  hasMore: Scalars["Boolean"]["output"];
  /** Number of items per page */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped */
  offset: Scalars["Int"]["output"];
  /** Total number of rewards available */
  total: Scalars["Int"]["output"];
};

/** A purchase record for a reward */
export type RewardPurchase = {
  __typename?: "RewardPurchase";
  /** Method for collecting the reward (e.g., 'Pick up at hotel') */
  collectionMethod?: Maybe<Scalars["String"]["output"]>;
  /** ID of the group that made the purchase */
  groupId: Scalars["ID"]["output"];
  /** Name of the group that made the purchase */
  groupName?: Maybe<Scalars["String"]["output"]>;
  /** Unique identifier for the purchase */
  purchaseId: Scalars["ID"]["output"];
  /** When the purchase was made */
  purchasedAt: Scalars["DateTime"]["output"];
  /** ID of the user who made the purchase */
  purchasedById: Scalars["ID"]["output"];
  /** Name of the user who made the purchase */
  purchasedByName?: Maybe<Scalars["String"]["output"]>;
  /** Number of rewards purchased */
  quantity: Scalars["Int"]["output"];
  /** ID of the purchased reward */
  rewardId: Scalars["ID"]["output"];
  /** Name of the purchased reward */
  rewardName: Scalars["String"]["output"];
  /** Current status of the purchase */
  status: RewardPurchaseStatus;
  /** When the status was last updated */
  statusUpdatedAt: Scalars["DateTime"]["output"];
  /** ID of the user who last updated the status */
  statusUpdatedById?: Maybe<Scalars["ID"]["output"]>;
  /** Name of the user who last updated the status */
  statusUpdatedByName?: Maybe<Scalars["String"]["output"]>;
  /** Total coin cost for this purchase */
  totalCost: Scalars["Int"]["output"];
};

/** Status of a reward purchase in its lifecycle */
export enum RewardPurchaseStatus {
  Accepted = "ACCEPTED",
  Bought = "BOUGHT",
  Cancelled = "CANCELLED",
  Delivered = "DELIVERED",
  InDelivery = "IN_DELIVERY",
}

/** A reward with dynamic pricing calculations */
export type RewardWithCalculations = {
  __typename?: "RewardWithCalculations";
  availableQuantity: Scalars["Int"]["output"];
  /** Whether the user's group can afford this reward (null if groupCoins not provided) */
  canAfford?: Maybe<Scalars["Boolean"]["output"]>;
  canBePurchased: Scalars["Boolean"]["output"];
  /** Static cost percentage (1-100) */
  coinCostPercentage: Scalars["Int"]["output"];
  createdAt: Scalars["DateTime"]["output"];
  createdById: Scalars["ID"]["output"];
  /** Description */
  description: Scalars["String"]["output"];
  /** Calculated dynamic coin cost based on trip points */
  dynamicCoinCost: Scalars["Int"]["output"];
  /** Unique identifier */
  id: Scalars["ID"]["output"];
  /** Array of image URLs */
  images: Array<Scalars["String"]["output"]>;
  isHidden: Scalars["Boolean"]["output"];
  isInStock: Scalars["Boolean"]["output"];
  /** Reward name */
  name: Scalars["String"]["output"];
  /** Primary image */
  primaryImage?: Maybe<Scalars["String"]["output"]>;
  purchaseCount: Scalars["Int"]["output"];
  /** Trip ID */
  tripId: Scalars["ID"]["output"];
  updatedAt: Scalars["DateTime"]["output"];
};

/** A paginated list of rewards with metadata */
export type RewardsConnection = {
  __typename?: "RewardsConnection";
  /** Pagination metadata */
  pagination: RewardPagination;
  /** The rewards in this page */
  rewards: Array<RewardWithCalculations>;
};

/** Input for sending mobile push notifications */
export type SendMobileNotificationsInput = {
  /** ID of the notification to send */
  notificationId: Scalars["ID"]["input"];
};

/** Result of sending mobile push notifications */
export type SendMobileNotificationsPayload = {
  __typename?: "SendMobileNotificationsPayload";
  /** Number of notifications that failed to send */
  failed: Scalars["Int"]["output"];
  /** Number of notifications successfully sent */
  sent: Scalars["Int"]["output"];
  /** Whether the send operation was successful */
  success: Scalars["Boolean"]["output"];
  /** Total number of recipients targeted */
  total: Scalars["Int"]["output"];
};

/** Input for pinning/unpinning an activity */
export type SetPinnedInput = {
  /** Activity ID */
  activityId: Scalars["ID"]["input"];
  /** Whether to pin or unpin */
  isPinned: Scalars["Boolean"]["input"];
};

/** Input for setting reward hidden status */
export type SetRewardHiddenInput = {
  /** ID of the reward */
  id: Scalars["ID"]["input"];
  /** Whether the reward should be hidden */
  isHidden: Scalars["Boolean"]["input"];
};

/** Result of setting reward hidden status */
export type SetRewardHiddenPayload = {
  __typename?: "SetRewardHiddenPayload";
  /** The previous hidden status */
  previousHidden: Scalars["Boolean"]["output"];
  /** The reward with updated hidden status */
  reward: Reward;
};

/** User information for location sharing */
export type SharingUserInfo = {
  __typename?: "SharingUserInfo";
  /** User's first name */
  firstName?: Maybe<Scalars["String"]["output"]>;
  /** User ID */
  id: Scalars["ID"]["output"];
  /** User's last name */
  lastName?: Maybe<Scalars["String"]["output"]>;
};

/** Result of adding or removing a sharing user */
export type SharingUserPayload = {
  __typename?: "SharingUserPayload";
  /** The location with updated sharing list */
  location: Location;
};

/** A sponsor for a trip with logo and display settings */
export type Sponsor = {
  __typename?: "Sponsor";
  /** When the sponsor was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Sponsor description */
  description: Scalars["String"]["output"];
  /** Whether the sponsor has custom logo sizing/positioning */
  hasLogoAdjustments: Scalars["Boolean"]["output"];
  /** Logo height in pixels (for custom sizing) */
  height?: Maybe<Scalars["Int"]["output"]>;
  /** Unique identifier for the sponsor */
  id: Scalars["ID"]["output"];
  /** Whether the sponsor is currently active */
  isActive: Scalars["Boolean"]["output"];
  /** URL path to sponsor logo image */
  logoPath: Scalars["String"]["output"];
  /** Sponsor name */
  name: Scalars["String"]["output"];
  /** Horizontal offset in pixels */
  offsetX?: Maybe<Scalars["Int"]["output"]>;
  /** Vertical offset in pixels */
  offsetY?: Maybe<Scalars["Int"]["output"]>;
  /** When the sponsor was last updated */
  updatedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

/** Result of listing sponsors */
export type SponsorListResult = {
  __typename?: "SponsorListResult";
  /** List of sponsors */
  sponsors: Array<Sponsor>;
  /** Total number of sponsors matching the query */
  total: Scalars["Int"]["output"];
};

/** Group information embedded in a submission */
export type SubmissionGroupInfo = {
  __typename?: "SubmissionGroupInfo";
  /** Group description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** Group ID */
  id: Scalars["ID"]["output"];
  /** Group image URL */
  image?: Maybe<Scalars["String"]["output"]>;
  /** Group name */
  name: Scalars["String"]["output"];
};

/** Field to order submissions by */
export enum SubmissionOrderBy {
  CreatedAt = "createdAt",
  VoteScore = "voteScore",
}

/** A report filed against a challenge submission */
export type SubmissionReport = {
  __typename?: "SubmissionReport";
  /** When the report was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Additional details provided by the reporter */
  details?: Maybe<Scalars["String"]["output"]>;
  /** Whether the report has additional details */
  hasDetails: Scalars["Boolean"]["output"];
  /** Unique identifier for the report */
  id: Scalars["ID"]["output"];
  /** Reason for the report */
  reason: ReportReason;
  /** Human-readable display text for the reason */
  reasonDisplay: Scalars["String"]["output"];
  /** Reporter information with user details */
  reporter: SubmissionReportReporterInfo;
  /** ID of the user who filed the report */
  reporterId: Scalars["ID"]["output"];
  /** ID of the submission being reported */
  submissionId: Scalars["ID"]["output"];
};

/** Result of creating a submission report */
export type SubmissionReportCreateResult = {
  __typename?: "SubmissionReportCreateResult";
  /** When the report was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Additional details provided by the reporter */
  details?: Maybe<Scalars["String"]["output"]>;
  /** Whether the report has additional details */
  hasDetails: Scalars["Boolean"]["output"];
  /** Unique identifier for the report */
  id: Scalars["ID"]["output"];
  /** Reason for the report */
  reason: ReportReason;
  /** Human-readable display text for the reason */
  reasonDisplay: Scalars["String"]["output"];
  /** Reporter information (null on create) */
  reporter?: Maybe<SubmissionReportReporterInfo>;
  /** ID of the user who filed the report */
  reporterId: Scalars["ID"]["output"];
  /** ID of the submission being reported */
  submissionId: Scalars["ID"]["output"];
};

/** Paginated list of submission reports */
export type SubmissionReportListResult = {
  __typename?: "SubmissionReportListResult";
  /** List of reports */
  reports: Array<SubmissionReport>;
  /** Total number of reports (for pagination) */
  totalCount: Scalars["Int"]["output"];
};

/** Reporter information with participant and user details */
export type SubmissionReportReporterInfo = {
  __typename?: "SubmissionReportReporterInfo";
  /** Participant ID */
  id: Scalars["ID"]["output"];
  /** User details of the reporter */
  user: SubmissionReportUserInfo;
};

/** User information for a reporter */
export type SubmissionReportUserInfo = {
  __typename?: "SubmissionReportUserInfo";
  /** User's email address */
  email?: Maybe<Scalars["String"]["output"]>;
  /** User's first name */
  firstName: Scalars["String"]["output"];
  /** Whether the user has an avatar image */
  hasAvatar: Scalars["Boolean"]["output"];
  /** User ID */
  id: Scalars["ID"]["output"];
  /** User's last name */
  lastName: Scalars["String"]["output"];
};

/** Reviewer information embedded in a submission */
export type SubmissionReviewerInfo = {
  __typename?: "SubmissionReviewerInfo";
  /** Reviewer's email */
  email?: Maybe<Scalars["String"]["output"]>;
  /** Reviewer's first name */
  firstName: Scalars["String"]["output"];
  /** Reviewer user ID */
  id: Scalars["ID"]["output"];
  /** Reviewer's last name */
  lastName: Scalars["String"]["output"];
};

/** The review status of a challenge submission */
export enum SubmissionStatus {
  Approved = "APPROVED",
  Pending = "PENDING",
  Rejected = "REJECTED",
}

/** Vote statistics for a challenge submission */
export type SubmissionVoteCount = {
  __typename?: "SubmissionVoteCount";
  /** ID of the submission */
  submissionId: Scalars["ID"]["output"];
  /** Number of votes received */
  voteCount: Scalars["Int"]["output"];
  /** Calculated vote score (weighted) */
  voteScore: Scalars["Float"]["output"];
};

/** Input for submitting a single vote */
export type SubmitVoteInput = {
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
  /** Normalized weight for weighted voting (optional) */
  normalizedWeight?: InputMaybe<Scalars["Float"]["input"]>;
  /** ID of the submission being voted for */
  submissionId: Scalars["ID"]["input"];
  /** ID of the trip (for participant validation) */
  tripId: Scalars["ID"]["input"];
  /** Points to award (optional) */
  votePoints?: InputMaybe<Scalars["Int"]["input"]>;
  /** Voting position (1, 2, or 3) */
  votePosition: Scalars["Int"]["input"];
};

/** Result of submitting a single vote */
export type SubmitVotePayload = {
  __typename?: "SubmitVotePayload";
  /** The submitted vote */
  vote: ChallengeVote;
};

/** Input for submitting multiple votes at once */
export type SubmitVotesInput = {
  /** ID of the challenge */
  challengeId: Scalars["ID"]["input"];
  /** ID of the trip (for participant validation) */
  tripId: Scalars["ID"]["input"];
  /** List of votes to submit (at least 1 required) */
  votes: Array<VoteInput>;
};

/** Result of submitting multiple votes */
export type SubmitVotesPayload = {
  __typename?: "SubmitVotesPayload";
  /** Total number of votes cast */
  totalVotesCast: Scalars["Int"]["output"];
  /** The submitted votes */
  votes: Array<ChallengeVote>;
};

/** Input for toggling a reaction on an activity */
export type ToggleReactionInput = {
  /** Activity ID */
  activityId: Scalars["ID"]["input"];
  /** Type of reaction */
  reactionType: ReactionType;
};

/** Result of toggling a reaction */
export type ToggleReactionResult = {
  __typename?: "ToggleReactionResult";
  /** Activity ID */
  activityId: Scalars["ID"]["output"];
  /** Whether reaction is now active */
  isActive: Scalars["Boolean"]["output"];
  /** Reaction type that was toggled */
  reactionType: ReactionType;
  /** Updated reactions summary */
  reactionsSummary: ReactionsSummary;
};

/** Result of toggling schedule active status */
export type ToggleScheduleActivePayload = {
  __typename?: "ToggleScheduleActivePayload";
  /** The schedule with toggled status */
  schedule: NotificationSchedule;
};

/** Total available points for a trip */
export type TotalAvailablePointsPayload = {
  __typename?: "TotalAvailablePointsPayload";
  /** Total available points in the trip */
  totalPoints: Scalars["Int"]["output"];
};

/** Input for tracking delivery completion */
export type TrackDeliveryCompleteInput = {
  /** Error details if any failures occurred */
  errors?: InputMaybe<Scalars["String"]["input"]>;
  /** Number of failed deliveries */
  failureCount: Scalars["Int"]["input"];
  /** ID of the notification that was delivered */
  notificationId: Scalars["ID"]["input"];
  /** Number of successful deliveries */
  successCount: Scalars["Int"]["input"];
  /** Total number of recipients */
  totalRecipients: Scalars["Int"]["input"];
};

/** Result of tracking delivery completion */
export type TrackDeliveryCompletePayload = {
  __typename?: "TrackDeliveryCompletePayload";
  /** Whether the tracking was recorded successfully */
  success: Scalars["Boolean"]["output"];
};

/** Input for tracking delivery failure */
export type TrackDeliveryFailureInput = {
  /** Error message describing the failure */
  error: Scalars["String"]["input"];
  /** ID of the notification that failed */
  notificationId: Scalars["ID"]["input"];
};

/** Result of tracking delivery failure */
export type TrackDeliveryFailurePayload = {
  __typename?: "TrackDeliveryFailurePayload";
  /** Whether the failure was recorded successfully */
  success: Scalars["Boolean"]["output"];
};

/** Input for tracking delivery start */
export type TrackDeliveryStartInput = {
  /** ID of the notification being delivered */
  notificationId: Scalars["ID"]["input"];
};

/** Result of tracking delivery start */
export type TrackDeliveryStartPayload = {
  __typename?: "TrackDeliveryStartPayload";
  /** Whether the tracking was recorded successfully */
  success: Scalars["Boolean"]["output"];
};

/** A trip/event in the application */
export type Trip = {
  __typename?: "Trip";
  /** Path to background image */
  backgroundImagePath?: Maybe<Scalars["String"]["output"]>;
  /** When the trip was created */
  createdAt: Scalars["DateTime"]["output"];
  /** Trip description */
  description?: Maybe<Scalars["String"]["output"]>;
  /** When the trip ends */
  endDate: Scalars["DateTime"]["output"];
  /** Unique trip identifier */
  id: Scalars["ID"]["output"];
  /** Whether the trip is in active status */
  isActive: Scalars["Boolean"]["output"];
  /** Whether the trip is cancelled */
  isCancelled: Scalars["Boolean"]["output"];
  /** Whether the trip is completed */
  isCompleted: Scalars["Boolean"]["output"];
  /** Whether the trip is in planning status */
  isPlanning: Scalars["Boolean"]["output"];
  /** Trip name */
  name: Scalars["String"]["output"];
  /** When the trip starts */
  startDate: Scalars["DateTime"]["output"];
  /** Trip status */
  status: TripStatus;
  /** When the trip was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Input for fetching a trip by ID */
export type TripByIdInput = {
  /** Trip ID to fetch */
  id: Scalars["ID"]["input"];
};

/** Result of fetching a list of trips */
export type TripListResult = {
  __typename?: "TripListResult";
  /** Pagination information */
  pagination: TripPaginationInfo;
  /** List of trips */
  trips: Array<Trip>;
};

/** Pagination information for trip list */
export type TripPaginationInfo = {
  __typename?: "TripPaginationInfo";
  /** Whether there are more items */
  hasMore: Scalars["Boolean"]["output"];
  /** Number of items per page */
  limit: Scalars["Int"]["output"];
  /** Number of items skipped */
  offset: Scalars["Int"]["output"];
  /** Total number of trips */
  total: Scalars["Int"]["output"];
};

/** Pagination input for trip queries */
export type TripPaginationInput = {
  /** Maximum number of trips to return (1-100) */
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  /** Number of trips to skip */
  offset?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Status of a trip */
export enum TripStatus {
  Active = "ACTIVE",
  Cancelled = "CANCELLED",
  Completed = "COMPLETED",
  Planning = "PLANNING",
}

/** Input for unhiding an activity */
export type UnhideActivityInput = {
  /** Activity ID to unhide */
  activityId: Scalars["ID"]["input"];
};

/** Input for unlinking a sponsor from a trip */
export type UnlinkSponsorFromTripInput = {
  /** ID of the sponsor to unlink */
  sponsorId: Scalars["ID"]["input"];
  /** ID of the trip to unlink from */
  tripId: Scalars["ID"]["input"];
};

/** Result of unlinking a sponsor from a trip */
export type UnlinkSponsorFromTripPayload = {
  __typename?: "UnlinkSponsorFromTripPayload";
  /** ID of the sponsor */
  sponsorId: Scalars["ID"]["output"];
  /** ID of the trip */
  tripId: Scalars["ID"]["output"];
  /** Whether the unlink was successful */
  unlinked: Scalars["Boolean"]["output"];
};

/** Input for updating an activity */
export type UpdateActivityInput = {
  /** Activity ID to update */
  activityId: Scalars["ID"]["input"];
  /** New description (null to clear) */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Pin/unpin the activity */
  isPinned?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** New title */
  title?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for updating an existing group */
export type UpdateGroupInput = {
  /** New description (null to clear, max 500 characters) */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the group to update */
  id: Scalars["ID"]["input"];
  /** New image URL (null to clear) */
  image?: InputMaybe<Scalars["String"]["input"]>;
  /** New group name (1-100 characters) */
  name?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the trip (for validation) */
  tripId: Scalars["ID"]["input"];
};

/** Result of updating a group */
export type UpdateGroupPayload = {
  __typename?: "UpdateGroupPayload";
  /** The updated group */
  group: Group;
};

/** Input for updating the last run timestamp */
export type UpdateLastRunInput = {
  /** ID of the schedule */
  id: Scalars["ID"]["input"];
  /** When the schedule last ran */
  lastRunAt: Scalars["DateTime"]["input"];
  /** Error message if the run failed */
  lastRunError?: InputMaybe<Scalars["String"]["input"]>;
  /** Status of the last run */
  lastRunStatus: LastRunStatus;
};

/** Result of updating the last run timestamp */
export type UpdateLastRunPayload = {
  __typename?: "UpdateLastRunPayload";
  /** The schedule with updated last run timestamp */
  schedule: NotificationSchedule;
};

/** Input for updating a user's location */
export type UpdateLocationInput = {
  /** Accuracy in meters */
  accuracy?: InputMaybe<Scalars["Float"]["input"]>;
  /** Altitude in meters */
  altitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** Altitude accuracy in meters */
  altitudeAccuracy?: InputMaybe<Scalars["Float"]["input"]>;
  /** Heading (0-360 degrees) */
  heading?: InputMaybe<Scalars["Float"]["input"]>;
  /** Latitude (-90 to 90) */
  latitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** Longitude (-180 to 180) */
  longitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** Speed in meters per second */
  speed?: InputMaybe<Scalars["Float"]["input"]>;
};

/** Result of updating a location */
export type UpdateLocationPayload = {
  __typename?: "UpdateLocationPayload";
  /** The updated location */
  location: Location;
};

/** Input for updating own purchase status (group leader only) */
export type UpdateMyPurchaseStatusInput = {
  /** ID of the purchase to update */
  purchaseId: Scalars["ID"]["input"];
  /** New status (IN_DELIVERY or CANCELLED only) */
  status: RewardPurchaseStatus;
};

/** Result of updating own purchase status (group leader only) */
export type UpdateMyPurchaseStatusPayload = {
  __typename?: "UpdateMyPurchaseStatusPayload";
  /** The previous status before the update */
  previousStatus: RewardPurchaseStatus;
  /** The updated purchase record */
  purchase: RewardPurchase;
};

/** Input for updating a notification */
export type UpdateNotificationInput = {
  /** New body content */
  body?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of notification to update */
  notificationId: Scalars["ID"]["input"];
  /** New priority */
  priority?: InputMaybe<NotificationPriority>;
  /** New title */
  title?: InputMaybe<Scalars["String"]["input"]>;
  /** New URL (null to clear) */
  url?: InputMaybe<Scalars["String"]["input"]>;
};

/** Result of updating a notification */
export type UpdateNotificationResult = {
  __typename?: "UpdateNotificationResult";
  /** The updated notification */
  notification: Notification;
};

/** Input for updating an existing notification schedule */
export type UpdateNotificationScheduleInput = {
  /** New end date */
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** New scheduled hour (0-23) */
  hour?: InputMaybe<Scalars["Int"]["input"]>;
  /** ID of the schedule to update */
  id: Scalars["ID"]["input"];
  /** New active status */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** New scheduled minute (0-59) */
  minute?: InputMaybe<Scalars["Int"]["input"]>;
  /** New schedule name (1-100 characters) */
  name?: InputMaybe<Scalars["String"]["input"]>;
  /** New notification body (max 2000 chars) */
  notificationBody?: InputMaybe<Scalars["String"]["input"]>;
  /** New notification title (max 200 chars) */
  notificationTitle?: InputMaybe<Scalars["String"]["input"]>;
  /** New notification URL (max 500 chars) */
  notificationUrl?: InputMaybe<Scalars["String"]["input"]>;
  /** New start date */
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
};

/** Result of updating a notification schedule */
export type UpdateNotificationSchedulePayload = {
  __typename?: "UpdateNotificationSchedulePayload";
  /** The updated schedule */
  schedule: NotificationSchedule;
};

/** Input for updating notification status */
export type UpdateNotificationStatusInput = {
  /** New status to set */
  newStatus: NotificationStatus;
  /** ID of notification to update */
  notificationId: Scalars["ID"]["input"];
};

/** Result of updating notification status */
export type UpdateNotificationStatusResult = {
  __typename?: "UpdateNotificationStatusResult";
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
  collectionMethod?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the purchase to update */
  purchaseId: Scalars["ID"]["input"];
  /** New status to transition to */
  status: RewardPurchaseStatus;
};

/** Result of updating a purchase status */
export type UpdatePurchaseStatusPayload = {
  __typename?: "UpdatePurchaseStatusPayload";
  /** The previous status before the update */
  previousStatus: RewardPurchaseStatus;
  /** The updated purchase record */
  purchase: RewardPurchase;
  /** Whether coins were refunded (only when cancelling) */
  refunded: Scalars["Boolean"]["output"];
};

/** Input for updating an existing reward */
export type UpdateRewardInput = {
  /** New available quantity (0-1000000) */
  availableQuantity?: InputMaybe<Scalars["Int"]["input"]>;
  /** New percentage of total trip points (1-100) */
  coinCost?: InputMaybe<Scalars["Int"]["input"]>;
  /** New description (max 2000 characters) */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the reward to update */
  id: Scalars["ID"]["input"];
  /** New array of image URLs (max 10) */
  images?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** New reward name (1-200 characters) */
  name?: InputMaybe<Scalars["String"]["input"]>;
};

/** Result of updating a reward */
export type UpdateRewardPayload = {
  __typename?: "UpdateRewardPayload";
  /** The updated reward */
  reward: Reward;
};

/** Input for updating location sharing settings */
export type UpdateSharingSettingsInput = {
  /** Whether to enable location sharing */
  isSharingLocation: Scalars["Boolean"]["input"];
  /** IDs of users to share location with */
  userIdsToShareWith?: InputMaybe<Array<Scalars["ID"]["input"]>>;
};

/** Result of updating sharing settings */
export type UpdateSharingSettingsPayload = {
  __typename?: "UpdateSharingSettingsPayload";
  /** The updated sharing settings */
  settings: LocationSharingSettings;
};

/** Input for updating an existing sponsor */
export type UpdateSponsorInput = {
  /** New sponsor description (1-2000 characters) */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** New logo height in pixels (null to clear) */
  height?: InputMaybe<Scalars["Int"]["input"]>;
  /** ID of the sponsor to update */
  id: Scalars["ID"]["input"];
  /** New active status */
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** New logo URL path */
  logoPath?: InputMaybe<Scalars["String"]["input"]>;
  /** New sponsor name (1-200 characters) */
  name?: InputMaybe<Scalars["String"]["input"]>;
  /** New horizontal offset in pixels (null to clear) */
  offsetX?: InputMaybe<Scalars["Int"]["input"]>;
  /** New vertical offset in pixels (null to clear) */
  offsetY?: InputMaybe<Scalars["Int"]["input"]>;
};

/** Result of updating a sponsor */
export type UpdateSponsorPayload = {
  __typename?: "UpdateSponsorPayload";
  /** The updated sponsor */
  sponsor: Sponsor;
};

/** Input for updating a challenge submission */
export type UpdateSubmissionInput = {
  /** Points to award (for APPROVE action) */
  awardedPoints?: InputMaybe<Scalars["Int"]["input"]>;
  /** Bonus points to award */
  bonusPoints?: InputMaybe<Scalars["Int"]["input"]>;
  /** New image IDs (replaces existing) */
  imageIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  /** New latitude (null to remove) */
  latitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** New longitude (null to remove) */
  longitude?: InputMaybe<Scalars["Float"]["input"]>;
  /** Ranking position 1-3 (for APPROVE action, null to clear) */
  ranking?: InputMaybe<Scalars["Int"]["input"]>;
  /** Reason for rejection (required for REJECT) */
  rejectionReason?: InputMaybe<Scalars["String"]["input"]>;
  /** Review action (APPROVE or REJECT) */
  reviewAction?: InputMaybe<ReviewAction>;
  /** ID of reviewer (required for review actions) */
  reviewedById?: InputMaybe<Scalars["ID"]["input"]>;
  /** ID of the submission to update */
  submissionId: Scalars["ID"]["input"];
  /** New text content (null to remove) */
  textContent?: InputMaybe<Scalars["String"]["input"]>;
  /** New video ID (null to remove) */
  videoId?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for updating a trip */
export type UpdateTripInput = {
  /** URL to background image */
  backgroundImagePath?: InputMaybe<Scalars["String"]["input"]>;
  /** Trip description */
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** Trip end date */
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  /** Trip ID to update */
  id: Scalars["ID"]["input"];
  /** Trip name */
  name?: InputMaybe<Scalars["String"]["input"]>;
  /** Trip start date */
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
};

/** Input for updating an existing user */
export type UpdateUserInput = {
  /** User's first name (2-100 characters, no digits) */
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  /** Whether the user has an avatar */
  hasAvatar?: InputMaybe<Scalars["Boolean"]["input"]>;
  /** User's last name (2-100 characters, no digits) */
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  /** ID of the user to update */
  userId: Scalars["ID"]["input"];
};

/** Result of creating a signed upload URL for resumable uploads */
export type UploadUrlResult = {
  __typename?: "UploadUrlResult";
  /** The storage bucket name */
  bucket: Scalars["String"]["output"];
  /** The path to the object within the bucket */
  objectPath: Scalars["String"]["output"];
  /** The resumable upload endpoint URL */
  resumableUrl: Scalars["String"]["output"];
  /** The full storage path (bucket/path) */
  storagePath: Scalars["String"]["output"];
  /** The signed upload token (X-Ups-Authorization header) */
  token: Scalars["String"]["output"];
};

/** A user in the Mirai App system */
export type User = {
  __typename?: "User";
  /** External authentication provider user ID */
  authUserId: Scalars["String"]["output"];
  /** When the user account was created */
  createdAt: Scalars["DateTime"]["output"];
  /** User's first name */
  firstName: Scalars["String"]["output"];
  /** Computed full name (firstName + lastName) */
  fullName: Scalars["String"]["output"];
  /** Whether the user has uploaded an avatar image */
  hasAvatar: Scalars["Boolean"]["output"];
  /** Unique identifier for the user (UUID) */
  id: Scalars["ID"]["output"];
  /** Whether the user has admin privileges */
  isAdmin: Scalars["Boolean"]["output"];
  /** Whether the user has moderator privileges or higher */
  isModerator: Scalars["Boolean"]["output"];
  /** User's last name */
  lastName: Scalars["String"]["output"];
  /** When the user was last active (null if never seen) */
  lastSeenOn?: Maybe<Scalars["DateTime"]["output"]>;
  /** User's role in the system */
  role: UserRole;
};

/** Result of creating a new user */
export type UserCreateResult = {
  __typename?: "UserCreateResult";
  /** External authentication provider user ID */
  authUserId: Scalars["String"]["output"];
  /** When the user account was created */
  createdAt: Scalars["DateTime"]["output"];
  /** User's first name */
  firstName: Scalars["String"]["output"];
  /** Computed full name (firstName + lastName) */
  fullName: Scalars["String"]["output"];
  /** Whether the user has uploaded an avatar image */
  hasAvatar: Scalars["Boolean"]["output"];
  /** Unique identifier for the user (UUID) */
  id: Scalars["ID"]["output"];
  /** User's last name */
  lastName: Scalars["String"]["output"];
  /** User's role in the system */
  role: UserRole;
};

/** Input for fetching a user by ID */
export type UserInput = {
  /** Unique user ID */
  id: Scalars["ID"]["input"];
};

/** User roles in the system */
export enum UserRole {
  Admin = "ADMIN",
  Moderator = "MODERATOR",
  Service = "SERVICE",
  User = "USER",
}

/** Result of updating a user */
export type UserUpdateResult = {
  __typename?: "UserUpdateResult";
  /** External authentication provider user ID */
  authUserId: Scalars["String"]["output"];
  /** User's first name */
  firstName: Scalars["String"]["output"];
  /** Computed full name (firstName + lastName) */
  fullName: Scalars["String"]["output"];
  /** Whether the user has uploaded an avatar image */
  hasAvatar: Scalars["Boolean"]["output"];
  /** Unique identifier for the user (UUID) */
  id: Scalars["ID"]["output"];
  /** User's last name */
  lastName: Scalars["String"]["output"];
  /** User's role in the system */
  role: UserRole;
  /** When the user was last updated */
  updatedAt: Scalars["DateTime"]["output"];
};

/** Input for a single vote in a batch submission */
export type VoteInput = {
  /** Normalized weight for weighted voting (optional) */
  normalizedWeight?: InputMaybe<Scalars["Float"]["input"]>;
  /** ID of the submission being voted for */
  submissionId: Scalars["ID"]["input"];
  /** Points to award (optional) */
  votePoints?: InputMaybe<Scalars["Int"]["input"]>;
  /** Voting position (1, 2, or 3) */
  votePosition: Scalars["Int"]["input"];
};

/** Current voting progress for a challenge */
export type VotingProgress = {
  __typename?: "VotingProgress";
  /** ID of the challenge */
  challengeId: Scalars["ID"]["output"];
  /** Vote statistics per submission (sorted by score) */
  submissionStats: Array<SubmissionVoteCount>;
  /** Total number of votes cast across all submissions */
  totalVotes: Scalars["Int"]["output"];
};

export type UserFieldsFragment = {
  __typename?: "User";
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  hasAvatar: boolean;
  role: UserRole;
  createdAt: any;
  lastSeenOn?: any | null;
  isAdmin: boolean;
  isModerator: boolean;
};

export type UserSummaryFieldsFragment = {
  __typename?: "User";
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  hasAvatar: boolean;
};

export type UserCreateResultFieldsFragment = {
  __typename?: "UserCreateResult";
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  hasAvatar: boolean;
  role: UserRole;
  createdAt: any;
};

export type UserUpdateResultFieldsFragment = {
  __typename?: "UserUpdateResult";
  id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  hasAvatar: boolean;
  role: UserRole;
  updatedAt: any;
};

export type TripFieldsFragment = {
  __typename?: "Trip";
  id: string;
  name: string;
  description?: string | null;
  startDate: any;
  endDate: any;
  isActive: boolean;
  isPlanning: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  status: TripStatus;
  backgroundImagePath?: string | null;
  createdAt: any;
  updatedAt: any;
};

export type TripSummaryFieldsFragment = {
  __typename?: "Trip";
  id: string;
  name: string;
  description?: string | null;
  startDate: any;
  endDate: any;
  status: TripStatus;
};

export type GroupFieldsFragment = {
  __typename?: "Group";
  id: string;
  name: string;
  description?: string | null;
  code: string;
  image?: string | null;
  coins: number;
  isActive: boolean;
  status: GroupStatus;
  tripId: string;
  organizerId: string;
  createdAt: any;
  updatedAt: any;
};

export type GroupSummaryFieldsFragment = {
  __typename?: "GroupSummary";
  id: string;
  name: string;
};

export type GroupRankingFieldsFragment = {
  __typename?: "GroupRanking";
  id: string;
  name: string;
  description?: string | null;
  code: string;
  image?: string | null;
  coins: number;
  isActive: boolean;
  status: GroupStatus;
  tripId: string;
  organizerId: string;
  createdAt: any;
};

export type ActivityFieldsFragment = {
  __typename?: "Activity";
  id: string;
  tripId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  activityType: ActivityType;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: any;
  updatedAt: any;
  admin?: {
    __typename?: "ActivityAdmin";
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type ActivityAdminFieldsFragment = {
  __typename?: "ActivityAdmin";
  id: string;
  firstName: string;
  lastName: string;
};

export type HiddenActivityFieldsFragment = {
  __typename?: "HiddenActivityResult";
  id: string;
  tripId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  activityType: ActivityType;
  isPinned: boolean;
  isHidden: boolean;
  hiddenAt: any;
  hiddenReason?: string | null;
  updatedAt: any;
};

export type ChallengeSubmissionFieldsFragment = {
  __typename?: "ChallengeSubmission";
  id: string;
  challengeId: string;
  groupId: string;
  textContent?: string | null;
  imageIds: Array<string>;
  videoId?: string | null;
  hasMedia: boolean;
  hasLocation: boolean;
  latitude?: number | null;
  longitude?: number | null;
  awardedPoints: number;
  bonusPoints: number;
  totalPoints: number;
  ranking?: number | null;
  status: SubmissionStatus;
  reviewedById?: string | null;
  reviewedAt?: any | null;
  rejectionReason?: string | null;
  voteCount: number;
  voteScore: number;
  createdAt: any;
  updatedAt: any;
  reviewedBy?: {
    __typename?: "SubmissionReviewerInfo";
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
  group?: {
    __typename?: "SubmissionGroupInfo";
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
  } | null;
};

export type ChallengeSubmissionCreateResultFieldsFragment = {
  __typename?: "ChallengeSubmissionCreateResult";
  id: string;
  challengeId: string;
  groupId: string;
  textContent?: string | null;
  imageIds: Array<string>;
  videoId?: string | null;
  hasMedia: boolean;
  hasLocation: boolean;
  latitude?: number | null;
  longitude?: number | null;
  awardedPoints: number;
  bonusPoints: number;
  totalPoints: number;
  ranking?: number | null;
  status: SubmissionStatus;
  reviewedById?: string | null;
  reviewedAt?: any | null;
  rejectionReason?: string | null;
  voteCount: number;
  voteScore: number;
  createdAt: any;
  updatedAt: any;
  reviewedBy?: {
    __typename?: "SubmissionReviewerInfo";
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
  group?: {
    __typename?: "SubmissionGroupInfo";
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
  } | null;
};

export type ChallengeSubmissionUpdateResultFieldsFragment = {
  __typename?: "ChallengeSubmissionUpdateResult";
  id: string;
  challengeId: string;
  groupId: string;
  textContent?: string | null;
  imageIds: Array<string>;
  videoId?: string | null;
  hasMedia: boolean;
  hasLocation: boolean;
  latitude?: number | null;
  longitude?: number | null;
  awardedPoints: number;
  bonusPoints: number;
  totalPoints: number;
  ranking?: number | null;
  status: SubmissionStatus;
  reviewedById?: string | null;
  reviewedAt?: any | null;
  rejectionReason?: string | null;
  voteCount: number;
  voteScore: number;
  createdAt: any;
  updatedAt: any;
  reviewedBy?: {
    __typename?: "SubmissionReviewerInfo";
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
  group?: {
    __typename?: "SubmissionGroupInfo";
    id: string;
    name: string;
    description?: string | null;
    image?: string | null;
  } | null;
};

export type SubmissionGroupFieldsFragment = {
  __typename?: "SubmissionGroupInfo";
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
};

export type SubmissionReviewerFieldsFragment = {
  __typename?: "SubmissionReviewerInfo";
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export type ChallengeVoteFieldsFragment = {
  __typename?: "ChallengeVote";
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: any;
};

export type ChallengeVoteListFieldsFragment = {
  __typename?: "ChallengeVoteList";
  totalVotes: number;
  votes: Array<{
    __typename?: "ChallengeVote";
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
    votedAt: any;
  }>;
};

export type ChallengeVoteAdminListFieldsFragment = {
  __typename?: "ChallengeVoteAdminList";
  totalVotes: number;
  uniqueVoters: number;
  votes: Array<{
    __typename?: "ChallengeVote";
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
    votedAt: any;
  }>;
};

export type LocationFieldsFragment = {
  __typename?: "Location";
  id: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  isSharingLocation: boolean;
  timestamp: any;
  usersToShareWith: Array<{
    __typename?: "SharingUserInfo";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  }>;
};

export type LocationSummaryFieldsFragment = {
  __typename?: "Location";
  id: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  isSharingLocation: boolean;
  timestamp: any;
};

export type FriendLocationFieldsFragment = {
  __typename?: "FriendLocation";
  id: string;
  userId: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  isSharingLocation: boolean;
  distanceKm?: number | null;
  timestamp: any;
};

export type LocationSharingSettingsFieldsFragment = {
  __typename?: "LocationSharingSettings";
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    __typename?: "SharingUserInfo";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  }>;
};

export type SharingUserFieldsFragment = {
  __typename?: "SharingUserInfo";
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type NotificationFieldsFragment = {
  __typename?: "Notification";
  id: string;
  title: string;
  body: string;
  isSent: boolean;
  isScheduled: boolean;
  isReadyToSend?: boolean | null;
  status: NotificationStatus;
  priority: NotificationPriority;
  scheduledFor?: any | null;
  sentAt?: any | null;
  url?: string | null;
  tripId?: string | null;
  createdById: string;
  createdAt: any;
  updatedAt?: any | null;
};

export type NotificationWithCreatorFieldsFragment = {
  __typename?: "NotificationInfo";
  id: string;
  title: string;
  body: string;
  url?: string | null;
  tripId?: string | null;
  createdAt: any;
  createdBy?: {
    __typename?: "NotificationCreator";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    authUserId?: string | null;
  } | null;
};

export type NotificationCreatorFieldsFragment = {
  __typename?: "NotificationCreator";
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  authUserId?: string | null;
};

export type NotificationScheduleFieldsFragment = {
  __typename?: "NotificationSchedule";
  id: string;
  name: string;
  notificationType: NotificationScheduleType;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  hour: number;
  minute: number;
  formattedTime: string;
  startDate: any;
  endDate: any;
  isActive: boolean;
  isCurrentlyActive: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  lastRun?: any | null;
  tripId?: string | null;
  createdById: string;
  createdAt: any;
  updatedAt: any;
};

export type NotificationScheduleSummaryFieldsFragment = {
  __typename?: "NotificationScheduleSummary";
  id: string;
  name: string;
  notificationType: NotificationScheduleType;
  hour: number;
  minute: number;
  isActive: boolean;
  startDate: any;
  endDate: any;
  tripId?: string | null;
};

export type NotificationDeliveryFieldsFragment = {
  __typename?: "NotificationDelivery";
  id: string;
  notificationId: string;
  scheduleId?: string | null;
  tripId: string;
  status: DeliveryStatus;
  deliveryStartedAt: any;
  deliveryCompletedAt?: any | null;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  errorLog?: string | null;
  createdAt: any;
  updatedAt: any;
  notification?: {
    __typename?: "NotificationInfo";
    id: string;
    title: string;
    body: string;
    url?: string | null;
    tripId?: string | null;
    createdAt: any;
    createdBy?: {
      __typename?: "NotificationCreator";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      authUserId?: string | null;
    } | null;
  } | null;
};

export type ExecutionHistoryEntryFieldsFragment = {
  __typename?: "ExecutionHistoryEntry";
  id: string;
  executedAt: any;
  notification?: {
    __typename?: "ExecutionHistoryNotification";
    id: string;
    title: string;
    body: string;
    createdAt: any;
  } | null;
};

export type ExecutionHistoryNotificationFieldsFragment = {
  __typename?: "ExecutionHistoryNotification";
  id: string;
  title: string;
  body: string;
  createdAt: any;
};

export type SponsorFieldsFragment = {
  __typename?: "Sponsor";
  id: string;
  name: string;
  description: string;
  logoPath: string;
  isActive: boolean;
  height?: number | null;
  offsetX?: number | null;
  offsetY?: number | null;
  hasLogoAdjustments: boolean;
  createdAt: any;
  updatedAt?: any | null;
};

export type CoinTransactionFieldsFragment = {
  __typename?: "CoinTransaction";
  id: string;
  amount: number;
  reason?: string | null;
  groupId: string;
  adminId: string;
  createdAt: any;
  group?: {
    __typename?: "CoinTransactionGroup";
    id: string;
    name: string;
    coins: number;
  } | null;
  admin?: {
    __typename?: "CoinTransactionAdmin";
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName: string;
  } | null;
};

export type CoinTransactionGroupFieldsFragment = {
  __typename?: "CoinTransactionGroup";
  id: string;
  name: string;
  coins: number;
};

export type CoinTransactionAdminFieldsFragment = {
  __typename?: "CoinTransactionAdmin";
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
};

export type CoinTransactionResultFieldsFragment = {
  __typename?: "CoinTransactionResult";
  id: string;
  amount: number;
  groupId: string;
  adminId: string;
  createdAt: any;
  transaction: {
    __typename?: "CoinTransaction";
    id: string;
    amount: number;
    reason?: string | null;
    groupId: string;
    adminId: string;
    createdAt: any;
    group?: {
      __typename?: "CoinTransactionGroup";
      id: string;
      name: string;
      coins: number;
    } | null;
    admin?: {
      __typename?: "CoinTransactionAdmin";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      fullName: string;
    } | null;
  };
};

export type RewardFieldsFragment = {
  __typename?: "Reward";
  id: string;
  name: string;
  description: string;
  coinCostPercentage: number;
  availableQuantity: number;
  isInStock: boolean;
  canBePurchased: boolean;
  images: Array<string>;
  primaryImage?: string | null;
  purchaseCount: number;
  isHidden: boolean;
  tripId: string;
  createdById: string;
  createdAt: any;
  updatedAt: any;
};

export type RewardWithCalculationsFieldsFragment = {
  __typename?: "RewardWithCalculations";
  id: string;
  name: string;
  description: string;
  coinCostPercentage: number;
  dynamicCoinCost: number;
  canAfford?: boolean | null;
  availableQuantity: number;
  isInStock: boolean;
  canBePurchased: boolean;
  images: Array<string>;
  primaryImage?: string | null;
  purchaseCount: number;
  isHidden: boolean;
  tripId: string;
  createdById: string;
  createdAt: any;
  updatedAt: any;
};

export type RewardPurchaseFieldsFragment = {
  __typename?: "RewardPurchase";
  purchaseId: string;
  rewardId: string;
  rewardName: string;
  groupId: string;
  groupName?: string | null;
  purchasedById: string;
  purchasedByName?: string | null;
  quantity: number;
  totalCost: number;
  status: RewardPurchaseStatus;
  collectionMethod?: string | null;
  statusUpdatedAt: any;
  statusUpdatedById?: string | null;
  statusUpdatedByName?: string | null;
  purchasedAt: any;
};

export type SubmissionReportFieldsFragment = {
  __typename?: "SubmissionReport";
  id: string;
  submissionId: string;
  reporterId: string;
  reason: ReportReason;
  reasonDisplay: string;
  details?: string | null;
  hasDetails: boolean;
  createdAt: any;
  reporter: {
    __typename?: "SubmissionReportReporterInfo";
    id: string;
    user: {
      __typename?: "SubmissionReportUserInfo";
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      hasAvatar: boolean;
    };
  };
};

export type SubmissionReportCreateResultFieldsFragment = {
  __typename?: "SubmissionReportCreateResult";
  id: string;
  submissionId: string;
  reporterId: string;
  reason: ReportReason;
  reasonDisplay: string;
  details?: string | null;
  hasDetails: boolean;
  createdAt: any;
};

export type SubmissionReportReporterFieldsFragment = {
  __typename?: "SubmissionReportReporterInfo";
  id: string;
  user: {
    __typename?: "SubmissionReportUserInfo";
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    hasAvatar: boolean;
  };
};

export type SubmissionReportUserFieldsFragment = {
  __typename?: "SubmissionReportUserInfo";
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  hasAvatar: boolean;
};

export type PaginationInfoFieldsFragment = {
  __typename?: "PaginationInfo";
  hasMore: boolean;
  pageSize: number;
};

export type OffsetPaginationFieldsFragment = {
  __typename?: "GroupPagination";
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
};

export type TripPaginationInfoFieldsFragment = {
  __typename?: "TripPaginationInfo";
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
};

export type NotificationPaginationInfoFieldsFragment = {
  __typename?: "NotificationPaginationInfo";
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type NotificationOffsetPaginationInfoFieldsFragment = {
  __typename?: "NotificationOffsetPaginationInfo";
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
};

export type CoinTransactionPaginationFieldsFragment = {
  __typename?: "CoinTransactionPagination";
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
};

export type RewardPaginationFieldsFragment = {
  __typename?: "RewardPagination";
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
};

export type NotificationSchedulePaginationFieldsFragment = {
  __typename?: "NotificationSchedulePagination";
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
};

export type DeliveryPaginationFieldsFragment = {
  __typename?: "DeliveryPagination";
  limit: number;
  offset: number;
  total: number;
};

export type ModerationPaginationInfoFieldsFragment = {
  __typename?: "ModerationPaginationInfo";
  hasMore: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ActivityCursorFieldsFragment = {
  __typename?: "ActivityCursor";
  id: string;
  createdAt: any;
  isPinned: boolean;
};

export type ActivityFeedResultFieldsFragment = {
  __typename?: "ActivityFeedResult";
  activities: Array<{
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  nextCursor?: {
    __typename?: "ActivityCursor";
    id: string;
    createdAt: any;
    isPinned: boolean;
  } | null;
  pagination: {
    __typename?: "PaginationInfo";
    hasMore: boolean;
    pageSize: number;
  };
};

export type ActivityFeedModerationResultFieldsFragment = {
  __typename?: "ActivityFeedModerationResult";
  activities: Array<{
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
  pagination: {
    __typename?: "ModerationPaginationInfo";
    hasMore: boolean;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type GroupsConnectionFieldsFragment = {
  __typename?: "GroupsConnection";
  groups: Array<{
    __typename?: "Group";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
    updatedAt: any;
  }>;
  pagination: {
    __typename?: "GroupPagination";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type CoinTransactionsConnectionFieldsFragment = {
  __typename?: "CoinTransactionsConnection";
  transactions: Array<{
    __typename?: "CoinTransaction";
    id: string;
    amount: number;
    reason?: string | null;
    groupId: string;
    adminId: string;
    createdAt: any;
    group?: {
      __typename?: "CoinTransactionGroup";
      id: string;
      name: string;
      coins: number;
    } | null;
    admin?: {
      __typename?: "CoinTransactionAdmin";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      fullName: string;
    } | null;
  }>;
  pagination: {
    __typename?: "CoinTransactionPagination";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type RewardsConnectionFieldsFragment = {
  __typename?: "RewardsConnection";
  rewards: Array<{
    __typename?: "RewardWithCalculations";
    id: string;
    name: string;
    description: string;
    coinCostPercentage: number;
    dynamicCoinCost: number;
    canAfford?: boolean | null;
    availableQuantity: number;
    isInStock: boolean;
    canBePurchased: boolean;
    images: Array<string>;
    primaryImage?: string | null;
    purchaseCount: number;
    isHidden: boolean;
    tripId: string;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  }>;
  pagination: {
    __typename?: "RewardPagination";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type PurchaseHistoryConnectionFieldsFragment = {
  __typename?: "PurchaseHistoryConnection";
  purchases: Array<{
    __typename?: "RewardPurchase";
    purchaseId: string;
    rewardId: string;
    rewardName: string;
    groupId: string;
    groupName?: string | null;
    purchasedById: string;
    purchasedByName?: string | null;
    quantity: number;
    totalCost: number;
    status: RewardPurchaseStatus;
    collectionMethod?: string | null;
    statusUpdatedAt: any;
    statusUpdatedById?: string | null;
    statusUpdatedByName?: string | null;
    purchasedAt: any;
  }>;
  pagination: {
    __typename?: "RewardPagination";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type NotificationSchedulesConnectionFieldsFragment = {
  __typename?: "NotificationSchedulesConnection";
  schedules: Array<{
    __typename?: "NotificationScheduleSummary";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    hour: number;
    minute: number;
    isActive: boolean;
    startDate: any;
    endDate: any;
    tripId?: string | null;
  }>;
  pagination: {
    __typename?: "NotificationSchedulePagination";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type NotificationDeliveryListResultFieldsFragment = {
  __typename?: "NotificationDeliveryListResult";
  deliveries: Array<{
    __typename?: "NotificationDelivery";
    id: string;
    notificationId: string;
    scheduleId?: string | null;
    tripId: string;
    status: DeliveryStatus;
    deliveryStartedAt: any;
    deliveryCompletedAt?: any | null;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    errorLog?: string | null;
    createdAt: any;
    updatedAt: any;
    notification?: {
      __typename?: "NotificationInfo";
      id: string;
      title: string;
      body: string;
      url?: string | null;
      tripId?: string | null;
      createdAt: any;
      createdBy?: {
        __typename?: "NotificationCreator";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        authUserId?: string | null;
      } | null;
    } | null;
  }>;
  pagination: {
    __typename?: "DeliveryPagination";
    limit: number;
    offset: number;
    total: number;
  };
};

export type ChallengeSubmissionListResultFieldsFragment = {
  __typename?: "ChallengeSubmissionListResult";
  totalCount: number;
  submissions: Array<{
    __typename?: "ChallengeSubmission";
    id: string;
    challengeId: string;
    groupId: string;
    textContent?: string | null;
    imageIds: Array<string>;
    videoId?: string | null;
    hasMedia: boolean;
    hasLocation: boolean;
    latitude?: number | null;
    longitude?: number | null;
    awardedPoints: number;
    bonusPoints: number;
    totalPoints: number;
    ranking?: number | null;
    status: SubmissionStatus;
    reviewedById?: string | null;
    reviewedAt?: any | null;
    rejectionReason?: string | null;
    voteCount: number;
    voteScore: number;
    createdAt: any;
    updatedAt: any;
    reviewedBy?: {
      __typename?: "SubmissionReviewerInfo";
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    } | null;
    group?: {
      __typename?: "SubmissionGroupInfo";
      id: string;
      name: string;
      description?: string | null;
      image?: string | null;
    } | null;
  }>;
};

export type SubmissionReportListResultFieldsFragment = {
  __typename?: "SubmissionReportListResult";
  totalCount: number;
  reports: Array<{
    __typename?: "SubmissionReport";
    id: string;
    submissionId: string;
    reporterId: string;
    reason: ReportReason;
    reasonDisplay: string;
    details?: string | null;
    hasDetails: boolean;
    createdAt: any;
    reporter: {
      __typename?: "SubmissionReportReporterInfo";
      id: string;
      user: {
        __typename?: "SubmissionReportUserInfo";
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
        hasAvatar: boolean;
      };
    };
  }>;
};

export type FriendsLocationsConnectionFieldsFragment = {
  __typename?: "FriendsLocationsConnection";
  total: number;
  locations: Array<{
    __typename?: "FriendLocation";
    id: string;
    userId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
    isSharingLocation: boolean;
    distanceKm?: number | null;
    timestamp: any;
  }>;
};

export type TripListResultFieldsFragment = {
  __typename?: "TripListResult";
  trips: Array<{
    __typename?: "Trip";
    id: string;
    name: string;
    description?: string | null;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isPlanning: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    status: TripStatus;
    backgroundImagePath?: string | null;
    createdAt: any;
    updatedAt: any;
  }>;
  pagination: {
    __typename?: "TripPaginationInfo";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type SponsorListResultFieldsFragment = {
  __typename?: "SponsorListResult";
  total: number;
  sponsors: Array<{
    __typename?: "Sponsor";
    id: string;
    name: string;
    description: string;
    logoPath: string;
    isActive: boolean;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    hasLogoAdjustments: boolean;
    createdAt: any;
    updatedAt?: any | null;
  }>;
};

export type MyNotificationsResultFieldsFragment = {
  __typename?: "MyNotificationsResult";
  notifications: Array<{
    __typename?: "Notification";
    id: string;
    title: string;
    body: string;
    isSent: boolean;
    isScheduled: boolean;
    isReadyToSend?: boolean | null;
    status: NotificationStatus;
    priority: NotificationPriority;
    scheduledFor?: any | null;
    sentAt?: any | null;
    url?: string | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt?: any | null;
  }>;
  pagination: {
    __typename?: "NotificationPaginationInfo";
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type AllNotificationsResultFieldsFragment = {
  __typename?: "AllNotificationsResult";
  notifications: Array<{
    __typename?: "Notification";
    id: string;
    title: string;
    body: string;
    isSent: boolean;
    isScheduled: boolean;
    isReadyToSend?: boolean | null;
    status: NotificationStatus;
    priority: NotificationPriority;
    scheduledFor?: any | null;
    sentAt?: any | null;
    url?: string | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt?: any | null;
  }>;
  pagination: {
    __typename?: "NotificationOffsetPaginationInfo";
    hasMore: boolean;
    limit: number;
    offset: number;
    total: number;
  };
};

export type CoinStatisticsFieldsFragment = {
  __typename?: "CoinStatistics";
  addedCoins: number;
  removedCoins: number;
  netBalance: number;
  transactionCount: number;
  time: any;
};

export type CoinQuickStatsFieldsFragment = {
  __typename?: "CoinQuickStats";
  totalCoins: number;
  totalGroups: number;
  averageCoinsPerGroup: number;
  richestGroupId?: string | null;
  richestGroupName?: string | null;
  time: any;
};

export type CoinAdditionalInsightsFieldsFragment = {
  __typename?: "CoinAdditionalInsights";
  mostActiveAdmin?: {
    __typename?: "FormattedUser";
    name: string;
    transactionCount: number;
  } | null;
  recentTransactions: Array<{
    __typename?: "CoinTransaction";
    id: string;
    amount: number;
    reason?: string | null;
    groupId: string;
    adminId: string;
    createdAt: any;
    group?: {
      __typename?: "CoinTransactionGroup";
      id: string;
      name: string;
      coins: number;
    } | null;
    admin?: {
      __typename?: "CoinTransactionAdmin";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      fullName: string;
    } | null;
  }>;
};

export type FormattedUserFieldsFragment = {
  __typename?: "FormattedUser";
  name: string;
  transactionCount: number;
};

export type MostActiveAdminStatsFieldsFragment = {
  __typename?: "MostActiveAdminStats";
  adminId: string;
  adminName?: string | null;
  transactionCount: number;
  totalAmount: number;
};

export type GroupRankingResultFieldsFragment = {
  __typename?: "GroupRankingResult";
  currentDate: any;
  data: Array<{
    __typename?: "GroupRanking";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
  }>;
};

export type DeliveryStatsFieldsFragment = {
  __typename?: "DeliveryStats";
  totalDeliveries: number;
  totalSuccess: number;
  totalFailures: number;
  totalRecipients: number;
  successRate: number;
  avgSuccessPerDelivery: number;
  avgFailuresPerDelivery: number;
  statusBreakdown: {
    __typename?: "DeliveryStatusBreakdown";
    success: number;
    failure: number;
    partialFailure: number;
    pending: number;
  };
};

export type DeliveryStatusBreakdownFieldsFragment = {
  __typename?: "DeliveryStatusBreakdown";
  success: number;
  failure: number;
  partialFailure: number;
  pending: number;
};

export type VotingProgressFieldsFragment = {
  __typename?: "VotingProgress";
  challengeId: string;
  totalVotes: number;
  submissionStats: Array<{
    __typename?: "SubmissionVoteCount";
    submissionId: string;
    voteCount: number;
    voteScore: number;
  }>;
};

export type SubmissionVoteCountFieldsFragment = {
  __typename?: "SubmissionVoteCount";
  submissionId: string;
  voteCount: number;
  voteScore: number;
};

export type JudgedStaffVotingProgressFieldsFragment = {
  __typename?: "JudgedStaffVotingProgress";
  allAdminsVoted: boolean;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  eligibleSubmissionsCount: number;
  requiredPositions: number;
  adminProgress: Array<{
    __typename?: "AdminVotingInfo";
    participantId: string;
    hasVotedAll: boolean;
    votedPositions: Array<number>;
  }>;
};

export type AdminVotingInfoFieldsFragment = {
  __typename?: "AdminVotingInfo";
  participantId: string;
  hasVotedAll: boolean;
  votedPositions: Array<number>;
};

export type ReactionCountsFieldsFragment = {
  __typename?: "ReactionCounts";
  clap: number;
  fire: number;
  heart: number;
  star: number;
};

export type ReactionsSummaryFieldsFragment = {
  __typename?: "ReactionsSummary";
  total: number;
  myReactions: Array<ReactionType>;
  counts: {
    __typename?: "ReactionCounts";
    clap: number;
    fire: number;
    heart: number;
    star: number;
  };
};

export type CreateGroupPayloadFieldsFragment = {
  __typename?: "CreateGroupPayload";
  group: {
    __typename?: "Group";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateGroupPayloadFieldsFragment = {
  __typename?: "UpdateGroupPayload";
  group: {
    __typename?: "Group";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type DeleteGroupPayloadFieldsFragment = {
  __typename?: "DeleteGroupPayload";
  success: boolean;
};

export type CreateRewardPayloadFieldsFragment = {
  __typename?: "CreateRewardPayload";
  reward: {
    __typename?: "Reward";
    id: string;
    name: string;
    description: string;
    coinCostPercentage: number;
    availableQuantity: number;
    isInStock: boolean;
    canBePurchased: boolean;
    images: Array<string>;
    primaryImage?: string | null;
    purchaseCount: number;
    isHidden: boolean;
    tripId: string;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateRewardPayloadFieldsFragment = {
  __typename?: "UpdateRewardPayload";
  reward: {
    __typename?: "Reward";
    id: string;
    name: string;
    description: string;
    coinCostPercentage: number;
    availableQuantity: number;
    isInStock: boolean;
    canBePurchased: boolean;
    images: Array<string>;
    primaryImage?: string | null;
    purchaseCount: number;
    isHidden: boolean;
    tripId: string;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type DeleteRewardPayloadFieldsFragment = {
  __typename?: "DeleteRewardPayload";
  success: boolean;
  deletedRewardId: string;
};

export type SetRewardHiddenPayloadFieldsFragment = {
  __typename?: "SetRewardHiddenPayload";
  previousHidden: boolean;
  reward: {
    __typename?: "Reward";
    id: string;
    name: string;
    description: string;
    coinCostPercentage: number;
    availableQuantity: number;
    isInStock: boolean;
    canBePurchased: boolean;
    images: Array<string>;
    primaryImage?: string | null;
    purchaseCount: number;
    isHidden: boolean;
    tripId: string;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type PurchaseRewardPayloadFieldsFragment = {
  __typename?: "PurchaseRewardPayload";
  remainingGroupCoins: number;
  remainingRewardQuantity: number;
  purchase: {
    __typename?: "RewardPurchase";
    purchaseId: string;
    rewardId: string;
    rewardName: string;
    groupId: string;
    groupName?: string | null;
    purchasedById: string;
    purchasedByName?: string | null;
    quantity: number;
    totalCost: number;
    status: RewardPurchaseStatus;
    collectionMethod?: string | null;
    statusUpdatedAt: any;
    statusUpdatedById?: string | null;
    statusUpdatedByName?: string | null;
    purchasedAt: any;
  };
};

export type UpdatePurchaseStatusPayloadFieldsFragment = {
  __typename?: "UpdatePurchaseStatusPayload";
  previousStatus: RewardPurchaseStatus;
  refunded: boolean;
  purchase: {
    __typename?: "RewardPurchase";
    purchaseId: string;
    rewardId: string;
    rewardName: string;
    groupId: string;
    groupName?: string | null;
    purchasedById: string;
    purchasedByName?: string | null;
    quantity: number;
    totalCost: number;
    status: RewardPurchaseStatus;
    collectionMethod?: string | null;
    statusUpdatedAt: any;
    statusUpdatedById?: string | null;
    statusUpdatedByName?: string | null;
    purchasedAt: any;
  };
};

export type UpdateMyPurchaseStatusPayloadFieldsFragment = {
  __typename?: "UpdateMyPurchaseStatusPayload";
  previousStatus: RewardPurchaseStatus;
  purchase: {
    __typename?: "RewardPurchase";
    purchaseId: string;
    rewardId: string;
    rewardName: string;
    groupId: string;
    groupName?: string | null;
    purchasedById: string;
    purchasedByName?: string | null;
    quantity: number;
    totalCost: number;
    status: RewardPurchaseStatus;
    collectionMethod?: string | null;
    statusUpdatedAt: any;
    statusUpdatedById?: string | null;
    statusUpdatedByName?: string | null;
    purchasedAt: any;
  };
};

export type CreateSponsorPayloadFieldsFragment = {
  __typename?: "CreateSponsorPayload";
  sponsor: {
    __typename?: "Sponsor";
    id: string;
    name: string;
    description: string;
    logoPath: string;
    isActive: boolean;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    hasLogoAdjustments: boolean;
    createdAt: any;
    updatedAt?: any | null;
  };
};

export type UpdateSponsorPayloadFieldsFragment = {
  __typename?: "UpdateSponsorPayload";
  sponsor: {
    __typename?: "Sponsor";
    id: string;
    name: string;
    description: string;
    logoPath: string;
    isActive: boolean;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    hasLogoAdjustments: boolean;
    createdAt: any;
    updatedAt?: any | null;
  };
};

export type DeleteSponsorPayloadFieldsFragment = {
  __typename?: "DeleteSponsorPayload";
  success: boolean;
  id: string;
};

export type LinkSponsorToTripPayloadFieldsFragment = {
  __typename?: "LinkSponsorToTripPayload";
  linked: boolean;
  sponsorId: string;
  tripId: string;
};

export type UnlinkSponsorFromTripPayloadFieldsFragment = {
  __typename?: "UnlinkSponsorFromTripPayload";
  unlinked: boolean;
  sponsorId: string;
  tripId: string;
};

export type CreateNotificationResultFieldsFragment = {
  __typename?: "CreateNotificationResult";
  notification: {
    __typename?: "Notification";
    id: string;
    title: string;
    body: string;
    isSent: boolean;
    isScheduled: boolean;
    isReadyToSend?: boolean | null;
    status: NotificationStatus;
    priority: NotificationPriority;
    scheduledFor?: any | null;
    sentAt?: any | null;
    url?: string | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt?: any | null;
  };
};

export type UpdateNotificationResultFieldsFragment = {
  __typename?: "UpdateNotificationResult";
  notification: {
    __typename?: "Notification";
    id: string;
    title: string;
    body: string;
    isSent: boolean;
    isScheduled: boolean;
    isReadyToSend?: boolean | null;
    status: NotificationStatus;
    priority: NotificationPriority;
    scheduledFor?: any | null;
    sentAt?: any | null;
    url?: string | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt?: any | null;
  };
};

export type DeleteNotificationResultFieldsFragment = {
  __typename?: "DeleteNotificationResult";
  success: boolean;
};

export type UpdateNotificationStatusResultFieldsFragment = {
  __typename?: "UpdateNotificationStatusResult";
  previousStatus: NotificationStatus;
  newStatus: NotificationStatus;
  notification: {
    __typename?: "Notification";
    id: string;
    title: string;
    body: string;
    isSent: boolean;
    isScheduled: boolean;
    isReadyToSend?: boolean | null;
    status: NotificationStatus;
    priority: NotificationPriority;
    scheduledFor?: any | null;
    sentAt?: any | null;
    url?: string | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt?: any | null;
  };
};

export type CreateNotificationSchedulePayloadFieldsFragment = {
  __typename?: "CreateNotificationSchedulePayload";
  schedule: {
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateNotificationSchedulePayloadFieldsFragment = {
  __typename?: "UpdateNotificationSchedulePayload";
  schedule: {
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type DeleteNotificationSchedulePayloadFieldsFragment = {
  __typename?: "DeleteNotificationSchedulePayload";
  success: boolean;
  message: string;
  deletedExecutionCount?: number | null;
};

export type DuplicateNotificationSchedulePayloadFieldsFragment = {
  __typename?: "DuplicateNotificationSchedulePayload";
  schedule: {
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type ToggleScheduleActivePayloadFieldsFragment = {
  __typename?: "ToggleScheduleActivePayload";
  schedule: {
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type BulkToggleActivePayloadFieldsFragment = {
  __typename?: "BulkToggleActivePayload";
  success: boolean;
  updatedCount: number;
};

export type BulkDeleteNotificationSchedulesPayloadFieldsFragment = {
  __typename?: "BulkDeleteNotificationSchedulesPayload";
  success: boolean;
  requestedCount: number;
  deletedCount: number;
  notFoundIds?: Array<string> | null;
};

export type UpdateLastRunPayloadFieldsFragment = {
  __typename?: "UpdateLastRunPayload";
  schedule: {
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  };
};

export type SendMobileNotificationsPayloadFieldsFragment = {
  __typename?: "SendMobileNotificationsPayload";
  success: boolean;
  sent: number;
  failed: number;
  total: number;
};

export type TrackDeliveryStartPayloadFieldsFragment = {
  __typename?: "TrackDeliveryStartPayload";
  success: boolean;
};

export type TrackDeliveryCompletePayloadFieldsFragment = {
  __typename?: "TrackDeliveryCompletePayload";
  success: boolean;
};

export type TrackDeliveryFailurePayloadFieldsFragment = {
  __typename?: "TrackDeliveryFailurePayload";
  success: boolean;
};

export type DeleteActivityResultFieldsFragment = {
  __typename?: "DeleteActivityResult";
  success: boolean;
};

export type ToggleReactionResultFieldsFragment = {
  __typename?: "ToggleReactionResult";
  activityId: string;
  reactionType: ReactionType;
  isActive: boolean;
  reactionsSummary: {
    __typename?: "ReactionsSummary";
    total: number;
    myReactions: Array<ReactionType>;
    counts: {
      __typename?: "ReactionCounts";
      clap: number;
      fire: number;
      heart: number;
      star: number;
    };
  };
};

export type SubmitVotePayloadFieldsFragment = {
  __typename?: "SubmitVotePayload";
  vote: {
    __typename?: "ChallengeVote";
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
    votedAt: any;
  };
};

export type SubmitVotesPayloadFieldsFragment = {
  __typename?: "SubmitVotesPayload";
  totalVotesCast: number;
  votes: Array<{
    __typename?: "ChallengeVote";
    id: string;
    challengeId: string;
    submissionId: string;
    voterId: string;
    votePosition: number;
    votePoints: number;
    normalizedWeight: number;
    votedAt: any;
  }>;
};

export type ForceEndVotingPayloadFieldsFragment = {
  __typename?: "ForceEndVotingPayload";
  success: boolean;
  challengeId: string;
  challengeStatus: string;
  finalized: boolean;
  totalVotes: number;
};

export type DeleteTripResultFieldsFragment = {
  __typename?: "DeleteTripResult";
  success: boolean;
};

export type UpdateLocationPayloadFieldsFragment = {
  __typename?: "UpdateLocationPayload";
  location: {
    __typename?: "Location";
    id: string;
    userId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    isSharingLocation: boolean;
    timestamp: any;
    usersToShareWith: Array<{
      __typename?: "SharingUserInfo";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    }>;
  };
};

export type UpdateSharingSettingsPayloadFieldsFragment = {
  __typename?: "UpdateSharingSettingsPayload";
  settings: {
    __typename?: "LocationSharingSettings";
    isSharingLocation: boolean;
    usersToShareWith: Array<{
      __typename?: "SharingUserInfo";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    }>;
  };
};

export type SharingUserPayloadFieldsFragment = {
  __typename?: "SharingUserPayload";
  location: {
    __typename?: "Location";
    id: string;
    userId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    isSharingLocation: boolean;
    timestamp: any;
    usersToShareWith: Array<{
      __typename?: "SharingUserInfo";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
    }>;
  };
};

export type TotalAvailablePointsPayloadFieldsFragment = {
  __typename?: "TotalAvailablePointsPayload";
  totalPoints: number;
};

export type CheckInactiveUsersPayloadFieldsFragment = {
  __typename?: "CheckInactiveUsersPayload";
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
};

export type DownloadUrlResultFieldsFragment = {
  __typename?: "DownloadUrlResult";
  signedUrl: string;
  expiresAt: any;
};

export type UploadUrlResultFieldsFragment = {
  __typename?: "UploadUrlResult";
  bucket: string;
  storagePath: string;
  objectPath: string;
  resumableUrl: string;
  token: string;
};

export type PublicUrlResultFieldsFragment = {
  __typename?: "PublicUrlResult";
  publicUrl: string;
};

export type ExecutionHistoryResultFieldsFragment = {
  __typename?: "ExecutionHistoryResult";
  executions: Array<{
    __typename?: "ExecutionHistoryEntry";
    id: string;
    executedAt: any;
    notification?: {
      __typename?: "ExecutionHistoryNotification";
      id: string;
      title: string;
      body: string;
      createdAt: any;
    } | null;
  }>;
};

export type GetActivityQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetActivityQuery = {
  __typename?: "Query";
  activity?: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
};

export type GetActivitiesByTripQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  cursor?: InputMaybe<ActivityCursorInput>;
}>;

export type GetActivitiesByTripQuery = {
  __typename?: "Query";
  activitiesByTrip: {
    __typename?: "ActivityFeedResult";
    activities: Array<{
      __typename?: "Activity";
      id: string;
      tripId: string;
      title: string;
      description?: string | null;
      imageUrl?: string | null;
      activityType: ActivityType;
      isPinned: boolean;
      isHidden: boolean;
      createdAt: any;
      updatedAt: any;
      admin?: {
        __typename?: "ActivityAdmin";
        id: string;
        firstName: string;
        lastName: string;
      } | null;
    }>;
    nextCursor?: {
      __typename?: "ActivityCursor";
      id: string;
      createdAt: any;
      isPinned: boolean;
    } | null;
    pagination: {
      __typename?: "PaginationInfo";
      hasMore: boolean;
      pageSize: number;
    };
  };
};

export type GetActivitiesByTripModerationQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  page?: InputMaybe<Scalars["Int"]["input"]>;
  perPage?: InputMaybe<Scalars["Int"]["input"]>;
  includeHidden?: InputMaybe<Scalars["Boolean"]["input"]>;
}>;

export type GetActivitiesByTripModerationQuery = {
  __typename?: "Query";
  activitiesByTripModeration: {
    __typename?: "ActivityFeedModerationResult";
    activities: Array<{
      __typename?: "Activity";
      id: string;
      tripId: string;
      title: string;
      description?: string | null;
      imageUrl?: string | null;
      activityType: ActivityType;
      isPinned: boolean;
      isHidden: boolean;
      createdAt: any;
      updatedAt: any;
      admin?: {
        __typename?: "ActivityAdmin";
        id: string;
        firstName: string;
        lastName: string;
      } | null;
    }>;
    pagination: {
      __typename?: "ModerationPaginationInfo";
      hasMore: boolean;
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export type CreateCustomActivityMutationVariables = Exact<{
  input: CreateCustomActivityInput;
}>;

export type CreateCustomActivityMutation = {
  __typename?: "Mutation";
  createCustomActivity: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type CreateRankChangeActivityMutationVariables = Exact<{
  input: CreateRankChangeActivityInput;
}>;

export type CreateRankChangeActivityMutation = {
  __typename?: "Mutation";
  createRankChangeActivity: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type CreateSubmissionActivityMutationVariables = Exact<{
  input: CreateSubmissionActivityInput;
}>;

export type CreateSubmissionActivityMutation = {
  __typename?: "Mutation";
  createSubmissionActivity: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type UpdateActivityMutationVariables = Exact<{
  input: UpdateActivityInput;
}>;

export type UpdateActivityMutation = {
  __typename?: "Mutation";
  updateActivity: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type DeleteActivityMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteActivityMutation = {
  __typename?: "Mutation";
  deleteActivity: { __typename?: "DeleteActivityResult"; success: boolean };
};

export type HideActivityMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  reason?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type HideActivityMutation = {
  __typename?: "Mutation";
  hideActivity: {
    __typename?: "HiddenActivityResult";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    hiddenAt: any;
    hiddenReason?: string | null;
    updatedAt: any;
  };
};

export type UnhideActivityMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type UnhideActivityMutation = {
  __typename?: "Mutation";
  unhideActivity: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type SetActivityPinnedMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  isPinned: Scalars["Boolean"]["input"];
}>;

export type SetActivityPinnedMutation = {
  __typename?: "Mutation";
  setActivityPinned: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type ToggleActivityReactionMutationVariables = Exact<{
  activityId: Scalars["ID"]["input"];
  reaction: ReactionType;
}>;

export type ToggleActivityReactionMutation = {
  __typename?: "Mutation";
  toggleActivityReaction: {
    __typename?: "ToggleReactionResult";
    activityId: string;
    reactionType: ReactionType;
    isActive: boolean;
    reactionsSummary: {
      __typename?: "ReactionsSummary";
      total: number;
      myReactions: Array<ReactionType>;
      counts: {
        __typename?: "ReactionCounts";
        clap: number;
        fire: number;
        heart: number;
        star: number;
      };
    };
  };
};

export type GetChallengeSubmissionQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetChallengeSubmissionQuery = {
  __typename?: "Query";
  challengeSubmission?: {
    __typename?: "ChallengeSubmission";
    id: string;
    challengeId: string;
    groupId: string;
    textContent?: string | null;
    imageIds: Array<string>;
    videoId?: string | null;
    hasMedia: boolean;
    hasLocation: boolean;
    latitude?: number | null;
    longitude?: number | null;
    awardedPoints: number;
    bonusPoints: number;
    totalPoints: number;
    ranking?: number | null;
    status: SubmissionStatus;
    reviewedById?: string | null;
    reviewedAt?: any | null;
    rejectionReason?: string | null;
    voteCount: number;
    voteScore: number;
    createdAt: any;
    updatedAt: any;
    reviewedBy?: {
      __typename?: "SubmissionReviewerInfo";
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    } | null;
    group?: {
      __typename?: "SubmissionGroupInfo";
      id: string;
      name: string;
      description?: string | null;
      image?: string | null;
    } | null;
  } | null;
};

export type GetChallengeSubmissionsQueryVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  orderBy?: InputMaybe<SubmissionOrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;

export type GetChallengeSubmissionsQuery = {
  __typename?: "Query";
  challengeSubmissions?: {
    __typename?: "ChallengeSubmissionListResult";
    totalCount: number;
    submissions: Array<{
      __typename?: "ChallengeSubmission";
      id: string;
      challengeId: string;
      groupId: string;
      textContent?: string | null;
      imageIds: Array<string>;
      videoId?: string | null;
      hasMedia: boolean;
      hasLocation: boolean;
      latitude?: number | null;
      longitude?: number | null;
      awardedPoints: number;
      bonusPoints: number;
      totalPoints: number;
      ranking?: number | null;
      status: SubmissionStatus;
      reviewedById?: string | null;
      reviewedAt?: any | null;
      rejectionReason?: string | null;
      voteCount: number;
      voteScore: number;
      createdAt: any;
      updatedAt: any;
      reviewedBy?: {
        __typename?: "SubmissionReviewerInfo";
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
      } | null;
      group?: {
        __typename?: "SubmissionGroupInfo";
        id: string;
        name: string;
        description?: string | null;
        image?: string | null;
      } | null;
    }>;
  } | null;
};

export type GetChallengeSubmissionByChallengeAndGroupQueryVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
  groupId: Scalars["ID"]["input"];
}>;

export type GetChallengeSubmissionByChallengeAndGroupQuery = {
  __typename?: "Query";
  challengeSubmissionByChallengeAndGroup?: {
    __typename?: "ChallengeSubmission";
    id: string;
    challengeId: string;
    groupId: string;
    textContent?: string | null;
    imageIds: Array<string>;
    videoId?: string | null;
    hasMedia: boolean;
    hasLocation: boolean;
    latitude?: number | null;
    longitude?: number | null;
    awardedPoints: number;
    bonusPoints: number;
    totalPoints: number;
    ranking?: number | null;
    status: SubmissionStatus;
    reviewedById?: string | null;
    reviewedAt?: any | null;
    rejectionReason?: string | null;
    voteCount: number;
    voteScore: number;
    createdAt: any;
    updatedAt: any;
    reviewedBy?: {
      __typename?: "SubmissionReviewerInfo";
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    } | null;
    group?: {
      __typename?: "SubmissionGroupInfo";
      id: string;
      name: string;
      description?: string | null;
      image?: string | null;
    } | null;
  } | null;
};

export type GetVotesByChallengeQueryVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
}>;

export type GetVotesByChallengeQuery = {
  __typename?: "Query";
  votesByChallenge?: {
    __typename?: "ChallengeVoteAdminList";
    totalVotes: number;
    uniqueVoters: number;
    votes: Array<{
      __typename?: "ChallengeVote";
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      votePosition: number;
      votePoints: number;
      normalizedWeight: number;
      votedAt: any;
    }>;
  } | null;
};

export type GetMyVotesQueryVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
  tripId: Scalars["ID"]["input"];
}>;

export type GetMyVotesQuery = {
  __typename?: "Query";
  myVotes?: {
    __typename?: "ChallengeVoteList";
    totalVotes: number;
    votes: Array<{
      __typename?: "ChallengeVote";
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      votePosition: number;
      votePoints: number;
      normalizedWeight: number;
      votedAt: any;
    }>;
  } | null;
};

export type GetVotingProgressQueryVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
}>;

export type GetVotingProgressQuery = {
  __typename?: "Query";
  votingProgress?: {
    __typename?: "VotingProgress";
    challengeId: string;
    totalVotes: number;
    submissionStats: Array<{
      __typename?: "SubmissionVoteCount";
      submissionId: string;
      voteCount: number;
      voteScore: number;
    }>;
  } | null;
};

export type GetJudgedStaffVotingProgressQueryVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
  tripId: Scalars["ID"]["input"];
  adminParticipantIds: Array<Scalars["ID"]["input"]> | Scalars["ID"]["input"];
  eligibleSubmissionsCount: Scalars["Int"]["input"];
  requiredPositions: Scalars["Int"]["input"];
}>;

export type GetJudgedStaffVotingProgressQuery = {
  __typename?: "Query";
  judgedStaffVotingProgress?: {
    __typename?: "JudgedStaffVotingProgress";
    allAdminsVoted: boolean;
    eligibleSubmissionsCount: number;
    pendingAdmins: number;
    requiredPositions: number;
    totalAdmins: number;
    votedAdmins: number;
    adminProgress: Array<{
      __typename?: "AdminVotingInfo";
      participantId: string;
      hasVotedAll: boolean;
      votedPositions: Array<number>;
    }>;
  } | null;
};

export type CreateChallengeSubmissionMutationVariables = Exact<{
  input: CreateSubmissionInput;
}>;

export type CreateChallengeSubmissionMutation = {
  __typename?: "Mutation";
  createChallengeSubmission?: {
    __typename?: "ChallengeSubmissionCreateResult";
    id: string;
    challengeId: string;
    groupId: string;
    textContent?: string | null;
    imageIds: Array<string>;
    videoId?: string | null;
    hasMedia: boolean;
    hasLocation: boolean;
    latitude?: number | null;
    longitude?: number | null;
    awardedPoints: number;
    bonusPoints: number;
    totalPoints: number;
    ranking?: number | null;
    status: SubmissionStatus;
    reviewedById?: string | null;
    reviewedAt?: any | null;
    rejectionReason?: string | null;
    voteCount: number;
    voteScore: number;
    createdAt: any;
    updatedAt: any;
    reviewedBy?: {
      __typename?: "SubmissionReviewerInfo";
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    } | null;
    group?: {
      __typename?: "SubmissionGroupInfo";
      id: string;
      name: string;
      description?: string | null;
      image?: string | null;
    } | null;
  } | null;
};

export type UpdateChallengeSubmissionMutationVariables = Exact<{
  input: UpdateSubmissionInput;
}>;

export type UpdateChallengeSubmissionMutation = {
  __typename?: "Mutation";
  updateChallengeSubmission?: {
    __typename?: "ChallengeSubmissionUpdateResult";
    id: string;
    challengeId: string;
    groupId: string;
    textContent?: string | null;
    imageIds: Array<string>;
    videoId?: string | null;
    hasMedia: boolean;
    hasLocation: boolean;
    latitude?: number | null;
    longitude?: number | null;
    awardedPoints: number;
    bonusPoints: number;
    totalPoints: number;
    ranking?: number | null;
    status: SubmissionStatus;
    reviewedById?: string | null;
    reviewedAt?: any | null;
    rejectionReason?: string | null;
    voteCount: number;
    voteScore: number;
    createdAt: any;
    updatedAt: any;
    reviewedBy?: {
      __typename?: "SubmissionReviewerInfo";
      id: string;
      firstName: string;
      lastName: string;
      email?: string | null;
    } | null;
    group?: {
      __typename?: "SubmissionGroupInfo";
      id: string;
      name: string;
      description?: string | null;
      image?: string | null;
    } | null;
  } | null;
};

export type DeleteChallengeSubmissionMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteChallengeSubmissionMutation = {
  __typename?: "Mutation";
  deleteChallengeSubmission?: boolean | null;
};

export type CreateChallengeActivityMutationVariables = Exact<{
  input: CreateChallengeActivityInput;
}>;

export type CreateChallengeActivityMutation = {
  __typename?: "Mutation";
  createChallengeActivity: {
    __typename?: "Activity";
    id: string;
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    activityType: ActivityType;
    isPinned: boolean;
    isHidden: boolean;
    createdAt: any;
    updatedAt: any;
    admin?: {
      __typename?: "ActivityAdmin";
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
};

export type SubmitVoteMutationVariables = Exact<{
  input: SubmitVoteInput;
}>;

export type SubmitVoteMutation = {
  __typename?: "Mutation";
  submitVote?: {
    __typename?: "SubmitVotePayload";
    vote: {
      __typename?: "ChallengeVote";
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      votePosition: number;
      votePoints: number;
      normalizedWeight: number;
      votedAt: any;
    };
  } | null;
};

export type SubmitVotesMutationVariables = Exact<{
  input: SubmitVotesInput;
}>;

export type SubmitVotesMutation = {
  __typename?: "Mutation";
  submitVotes?: {
    __typename?: "SubmitVotesPayload";
    totalVotesCast: number;
    votes: Array<{
      __typename?: "ChallengeVote";
      id: string;
      challengeId: string;
      submissionId: string;
      voterId: string;
      votePosition: number;
      votePoints: number;
      normalizedWeight: number;
      votedAt: any;
    }>;
  } | null;
};

export type ForceEndVotingMutationVariables = Exact<{
  challengeId: Scalars["ID"]["input"];
  tripId: Scalars["ID"]["input"];
}>;

export type ForceEndVotingMutation = {
  __typename?: "Mutation";
  forceEndVoting?: {
    __typename?: "ForceEndVotingPayload";
    success: boolean;
    finalized: boolean;
    challengeId: string;
    challengeStatus: string;
    totalVotes: number;
  } | null;
};

export type GetCoinStatisticsQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetCoinStatisticsQuery = {
  __typename?: "Query";
  coinStatistics?: {
    __typename?: "CoinStatistics";
    addedCoins: number;
    removedCoins: number;
    netBalance: number;
    transactionCount: number;
    time: any;
  } | null;
};

export type GetCoinQuickStatsQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetCoinQuickStatsQuery = {
  __typename?: "Query";
  coinQuickStats?: {
    __typename?: "CoinQuickStats";
    totalCoins: number;
    totalGroups: number;
    averageCoinsPerGroup: number;
    richestGroupId?: string | null;
    richestGroupName?: string | null;
    time: any;
  } | null;
};

export type GetCoinAdditionalInsightsQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetCoinAdditionalInsightsQuery = {
  __typename?: "Query";
  coinAdditionalInsights?: {
    __typename?: "CoinAdditionalInsights";
    mostActiveAdmin?: {
      __typename?: "FormattedUser";
      name: string;
      transactionCount: number;
    } | null;
    recentTransactions: Array<{
      __typename?: "CoinTransaction";
      id: string;
      amount: number;
      reason?: string | null;
      groupId: string;
      adminId: string;
      createdAt: any;
      group?: {
        __typename?: "CoinTransactionGroup";
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        __typename?: "CoinTransactionAdmin";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        fullName: string;
      } | null;
    }>;
  } | null;
};

export type GetCoinTransactionsQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetCoinTransactionsQuery = {
  __typename?: "Query";
  coinTransactions?: {
    __typename?: "CoinTransactionsConnection";
    transactions: Array<{
      __typename?: "CoinTransaction";
      id: string;
      amount: number;
      reason?: string | null;
      groupId: string;
      adminId: string;
      createdAt: any;
      group?: {
        __typename?: "CoinTransactionGroup";
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        __typename?: "CoinTransactionAdmin";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        fullName: string;
      } | null;
    }>;
    pagination: {
      __typename?: "CoinTransactionPagination";
      hasMore: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  } | null;
};

export type GetMyCoinTransactionsQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  groupId?: InputMaybe<Scalars["ID"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetMyCoinTransactionsQuery = {
  __typename?: "Query";
  myCoinTransactions: Array<{
    __typename?: "CoinTransaction";
    id: string;
    amount: number;
    reason?: string | null;
    groupId: string;
    adminId: string;
    createdAt: any;
    group?: {
      __typename?: "CoinTransactionGroup";
      id: string;
      name: string;
      coins: number;
    } | null;
    admin?: {
      __typename?: "CoinTransactionAdmin";
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      fullName: string;
    } | null;
  }>;
};

export type AddCoinsMutationVariables = Exact<{
  input: AddCoinsInput;
}>;

export type AddCoinsMutation = {
  __typename?: "Mutation";
  addCoins?: {
    __typename?: "CoinTransactionResult";
    id: string;
    amount: number;
    groupId: string;
    adminId: string;
    createdAt: any;
    transaction: {
      __typename?: "CoinTransaction";
      id: string;
      amount: number;
      reason?: string | null;
      groupId: string;
      adminId: string;
      createdAt: any;
      group?: {
        __typename?: "CoinTransactionGroup";
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        __typename?: "CoinTransactionAdmin";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        fullName: string;
      } | null;
    };
  } | null;
};

export type RemoveCoinsMutationVariables = Exact<{
  input: RemoveCoinsInput;
}>;

export type RemoveCoinsMutation = {
  __typename?: "Mutation";
  removeCoins?: {
    __typename?: "CoinTransactionResult";
    id: string;
    amount: number;
    groupId: string;
    adminId: string;
    createdAt: any;
    transaction: {
      __typename?: "CoinTransaction";
      id: string;
      amount: number;
      reason?: string | null;
      groupId: string;
      adminId: string;
      createdAt: any;
      group?: {
        __typename?: "CoinTransactionGroup";
        id: string;
        name: string;
        coins: number;
      } | null;
      admin?: {
        __typename?: "CoinTransactionAdmin";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        fullName: string;
      } | null;
    };
  } | null;
};

export type GetGroupQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetGroupQuery = {
  __typename?: "Query";
  group?: {
    __typename?: "Group";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
    updatedAt: any;
  } | null;
};

export type GetGroupByCodeQueryVariables = Exact<{
  code: Scalars["String"]["input"];
}>;

export type GetGroupByCodeQuery = {
  __typename?: "Query";
  groupByCode?: {
    __typename?: "Group";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
    updatedAt: any;
  } | null;
};

export type GetGroupsQueryVariables = Exact<{
  pagination?: InputMaybe<GroupPaginationInput>;
}>;

export type GetGroupsQuery = {
  __typename?: "Query";
  groups: {
    __typename?: "GroupsConnection";
    groups: Array<{
      __typename?: "Group";
      id: string;
      name: string;
      description?: string | null;
      code: string;
      image?: string | null;
      coins: number;
      isActive: boolean;
      status: GroupStatus;
      tripId: string;
      organizerId: string;
      createdAt: any;
      updatedAt: any;
    }>;
    pagination: {
      __typename?: "GroupPagination";
      total: number;
      hasMore: boolean;
      limit: number;
      offset: number;
    };
  };
};

export type GetGroupsByTripQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  pagination?: InputMaybe<GroupPaginationInput>;
}>;

export type GetGroupsByTripQuery = {
  __typename?: "Query";
  groupsByTrip: {
    __typename?: "GroupsConnection";
    groups: Array<{
      __typename?: "Group";
      id: string;
      name: string;
      description?: string | null;
      code: string;
      image?: string | null;
      coins: number;
      isActive: boolean;
      status: GroupStatus;
      tripId: string;
      organizerId: string;
      createdAt: any;
      updatedAt: any;
    }>;
    pagination: {
      __typename?: "GroupPagination";
      total: number;
      hasMore: boolean;
      limit: number;
      offset: number;
    };
  };
};

export type GetGroupsByOrganizerQueryVariables = Exact<{
  organizerId: Scalars["ID"]["input"];
}>;

export type GetGroupsByOrganizerQuery = {
  __typename?: "Query";
  groupsByOrganizer: Array<{
    __typename?: "Group";
    id: string;
    name: string;
    description?: string | null;
    code: string;
    image?: string | null;
    coins: number;
    isActive: boolean;
    status: GroupStatus;
    tripId: string;
    organizerId: string;
    createdAt: any;
    updatedAt: any;
  }>;
};

export type GetGroupNamesByTripQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetGroupNamesByTripQuery = {
  __typename?: "Query";
  groupNamesByTrip: Array<{
    __typename?: "GroupSummary";
    id: string;
    name: string;
  }>;
};

export type GetGroupRankingQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetGroupRankingQuery = {
  __typename?: "Query";
  groupRanking: {
    __typename?: "GroupRankingResult";
    currentDate: any;
    data: Array<{
      __typename?: "GroupRanking";
      id: string;
      name: string;
      description?: string | null;
      code: string;
      image?: string | null;
      coins: number;
      isActive: boolean;
      status: GroupStatus;
      tripId: string;
      organizerId: string;
      createdAt: any;
    }>;
  };
};

export type CreateGroupMutationVariables = Exact<{
  input: CreateGroupInput;
}>;

export type CreateGroupMutation = {
  __typename?: "Mutation";
  createGroup: {
    __typename?: "CreateGroupPayload";
    group: {
      __typename?: "Group";
      id: string;
      name: string;
      description?: string | null;
      code: string;
      image?: string | null;
      coins: number;
      isActive: boolean;
      status: GroupStatus;
      tripId: string;
      organizerId: string;
      createdAt: any;
      updatedAt: any;
    };
  };
};

export type UpdateGroupMutationVariables = Exact<{
  input: UpdateGroupInput;
}>;

export type UpdateGroupMutation = {
  __typename?: "Mutation";
  updateGroup: {
    __typename?: "UpdateGroupPayload";
    group: {
      __typename?: "Group";
      id: string;
      name: string;
      description?: string | null;
      code: string;
      image?: string | null;
      coins: number;
      isActive: boolean;
      status: GroupStatus;
      tripId: string;
      organizerId: string;
      createdAt: any;
      updatedAt: any;
    };
  };
};

export type DeleteGroupMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteGroupMutation = {
  __typename?: "Mutation";
  deleteGroup: { __typename?: "DeleteGroupPayload"; success: boolean };
};

export type AddUserToSharingMutationVariables = Exact<{
  groupId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
}>;

export type AddUserToSharingMutation = {
  __typename?: "Mutation";
  addUserToSharing?: {
    __typename?: "SharingUserPayload";
    location: {
      __typename?: "Location";
      id: string;
      isSharingLocation: boolean;
      usersToShareWith: Array<{
        __typename?: "SharingUserInfo";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
      }>;
    };
  } | null;
};

export type RemoveUserFromSharingMutationVariables = Exact<{
  groupId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
}>;

export type RemoveUserFromSharingMutation = {
  __typename?: "Mutation";
  removeUserFromSharing?: {
    __typename?: "SharingUserPayload";
    location: {
      __typename?: "Location";
      id: string;
      isSharingLocation: boolean;
      usersToShareWith: Array<{
        __typename?: "SharingUserInfo";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
      }>;
    };
  } | null;
};

export type UpdateSharingSettingsMutationVariables = Exact<{
  input: UpdateSharingSettingsInput;
}>;

export type UpdateSharingSettingsMutation = {
  __typename?: "Mutation";
  updateSharingSettings?: {
    __typename?: "UpdateSharingSettingsPayload";
    settings: {
      __typename?: "LocationSharingSettings";
      isSharingLocation: boolean;
      usersToShareWith: Array<{
        __typename?: "SharingUserInfo";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
      }>;
    };
  } | null;
};

export type GetNotificationQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetNotificationQuery = {
  __typename?: "Query";
  notification?: {
    __typename?: "Notification";
    id: string;
    title: string;
    body: string;
    isSent: boolean;
    isScheduled: boolean;
    isReadyToSend?: boolean | null;
    status: NotificationStatus;
    priority: NotificationPriority;
    scheduledFor?: any | null;
    sentAt?: any | null;
    url?: string | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt?: any | null;
  } | null;
};

export type GetMyNotificationsQueryVariables = Exact<{
  page?: InputMaybe<Scalars["Int"]["input"]>;
  perPage?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetMyNotificationsQuery = {
  __typename?: "Query";
  myNotifications: {
    __typename?: "MyNotificationsResult";
    notifications: Array<{
      __typename?: "Notification";
      id: string;
      title: string;
      body: string;
      isSent: boolean;
      isScheduled: boolean;
      isReadyToSend?: boolean | null;
      status: NotificationStatus;
      priority: NotificationPriority;
      scheduledFor?: any | null;
      sentAt?: any | null;
      url?: string | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt?: any | null;
    }>;
    pagination: {
      __typename?: "NotificationPaginationInfo";
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export type GetAllNotificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
}>;

export type GetAllNotificationsQuery = {
  __typename?: "Query";
  allNotifications: {
    __typename?: "AllNotificationsResult";
    notifications: Array<{
      __typename?: "Notification";
      id: string;
      title: string;
      body: string;
      isSent: boolean;
      isScheduled: boolean;
      isReadyToSend?: boolean | null;
      status: NotificationStatus;
      priority: NotificationPriority;
      scheduledFor?: any | null;
      sentAt?: any | null;
      url?: string | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt?: any | null;
    }>;
    pagination: {
      __typename?: "NotificationOffsetPaginationInfo";
      hasMore: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  };
};

export type GetNotificationSchedulesQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  notificationType?: InputMaybe<NotificationScheduleType>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  startDateFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDateTo?: InputMaybe<Scalars["DateTime"]["input"]>;
}>;

export type GetNotificationSchedulesQuery = {
  __typename?: "Query";
  notificationSchedules?: {
    __typename?: "NotificationSchedulesConnection";
    schedules: Array<{
      __typename?: "NotificationScheduleSummary";
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
      hour: number;
      minute: number;
      isActive: boolean;
      startDate: any;
      endDate: any;
      tripId?: string | null;
    }>;
    pagination: {
      __typename?: "NotificationSchedulePagination";
      hasMore: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  } | null;
};

export type GetNotificationScheduleQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetNotificationScheduleQuery = {
  __typename?: "Query";
  notificationSchedule?: {
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  } | null;
};

export type GetActiveNotificationSchedulesQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  notificationType?: InputMaybe<NotificationScheduleType>;
}>;

export type GetActiveNotificationSchedulesQuery = {
  __typename?: "Query";
  activeNotificationSchedules?: Array<{
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  }> | null;
};

export type GetUpcomingNotificationSchedulesQueryVariables = Exact<{
  withinMinutes?: InputMaybe<Scalars["Int"]["input"]>;
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
}>;

export type GetUpcomingNotificationSchedulesQuery = {
  __typename?: "Query";
  upcomingNotificationSchedules?: Array<{
    __typename?: "NotificationSchedule";
    id: string;
    name: string;
    notificationType: NotificationScheduleType;
    notificationTitle?: string | null;
    notificationBody?: string | null;
    notificationUrl?: string | null;
    hour: number;
    minute: number;
    formattedTime: string;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isCurrentlyActive: boolean;
    isExpired: boolean;
    isUpcoming: boolean;
    lastRun?: any | null;
    tripId?: string | null;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  }> | null;
};

export type GetNotificationScheduleExecutionHistoryQueryVariables = Exact<{
  scheduleId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetNotificationScheduleExecutionHistoryQuery = {
  __typename?: "Query";
  notificationScheduleExecutionHistory?: {
    __typename?: "ExecutionHistoryResult";
    executions: Array<{
      __typename?: "ExecutionHistoryEntry";
      id: string;
      executedAt: any;
      notification?: {
        __typename?: "ExecutionHistoryNotification";
        id: string;
        title: string;
        body: string;
        createdAt: any;
      } | null;
    }>;
  } | null;
};

export type GetNotificationDeliveriesQueryVariables = Exact<{
  scheduleId?: InputMaybe<Scalars["ID"]["input"]>;
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  status?: InputMaybe<DeliveryStatus>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetNotificationDeliveriesQuery = {
  __typename?: "Query";
  notificationDeliveries: {
    __typename?: "NotificationDeliveryListResult";
    deliveries: Array<{
      __typename?: "NotificationDelivery";
      id: string;
      notificationId: string;
      scheduleId?: string | null;
      tripId: string;
      status: DeliveryStatus;
      deliveryStartedAt: any;
      deliveryCompletedAt?: any | null;
      totalRecipients: number;
      successCount: number;
      failureCount: number;
      errorLog?: string | null;
      createdAt: any;
      updatedAt: any;
      notification?: {
        __typename?: "NotificationInfo";
        id: string;
        title: string;
        body: string;
        url?: string | null;
        tripId?: string | null;
        createdAt: any;
        createdBy?: {
          __typename?: "NotificationCreator";
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          authUserId?: string | null;
        } | null;
      } | null;
    }>;
    pagination: {
      __typename?: "DeliveryPagination";
      limit: number;
      offset: number;
      total: number;
    };
  };
};

export type GetNotificationDeliveryByNotificationIdQueryVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
  tripId: Scalars["ID"]["input"];
}>;

export type GetNotificationDeliveryByNotificationIdQuery = {
  __typename?: "Query";
  notificationDeliveryByNotificationId?: {
    __typename?: "NotificationDelivery";
    id: string;
    notificationId: string;
    scheduleId?: string | null;
    tripId: string;
    status: DeliveryStatus;
    deliveryStartedAt: any;
    deliveryCompletedAt?: any | null;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    errorLog?: string | null;
    createdAt: any;
    updatedAt: any;
    notification?: {
      __typename?: "NotificationInfo";
      id: string;
      title: string;
      body: string;
      url?: string | null;
      tripId?: string | null;
      createdAt: any;
      createdBy?: {
        __typename?: "NotificationCreator";
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        authUserId?: string | null;
      } | null;
    } | null;
  } | null;
};

export type GetFailedDeliveriesQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetFailedDeliveriesQuery = {
  __typename?: "Query";
  failedDeliveries: {
    __typename?: "NotificationDeliveryListResult";
    deliveries: Array<{
      __typename?: "NotificationDelivery";
      id: string;
      notificationId: string;
      scheduleId?: string | null;
      tripId: string;
      status: DeliveryStatus;
      deliveryStartedAt: any;
      deliveryCompletedAt?: any | null;
      totalRecipients: number;
      successCount: number;
      failureCount: number;
      errorLog?: string | null;
      createdAt: any;
      updatedAt: any;
      notification?: {
        __typename?: "NotificationInfo";
        id: string;
        title: string;
        body: string;
        url?: string | null;
        tripId?: string | null;
        createdAt: any;
        createdBy?: {
          __typename?: "NotificationCreator";
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          authUserId?: string | null;
        } | null;
      } | null;
    }>;
    pagination: {
      __typename?: "DeliveryPagination";
      limit: number;
      offset: number;
      total: number;
    };
  };
};

export type GetDeliveryStatsQueryVariables = Exact<{
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  scheduleId?: InputMaybe<Scalars["ID"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
}>;

export type GetDeliveryStatsQuery = {
  __typename?: "Query";
  deliveryStats: {
    __typename?: "DeliveryStats";
    totalDeliveries: number;
    totalSuccess: number;
    totalFailures: number;
    totalRecipients: number;
    successRate: number;
    avgSuccessPerDelivery: number;
    avgFailuresPerDelivery: number;
    statusBreakdown: {
      __typename?: "DeliveryStatusBreakdown";
      success: number;
      failure: number;
      partialFailure: number;
      pending: number;
    };
  };
};

export type CreateNotificationMutationVariables = Exact<{
  title: Scalars["String"]["input"];
  body: Scalars["String"]["input"];
  priority?: InputMaybe<NotificationPriority>;
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
  url?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type CreateNotificationMutation = {
  __typename?: "Mutation";
  createNotification: {
    __typename?: "CreateNotificationResult";
    notification: {
      __typename?: "Notification";
      id: string;
      title: string;
      body: string;
      isSent: boolean;
      isScheduled: boolean;
      isReadyToSend?: boolean | null;
      status: NotificationStatus;
      priority: NotificationPriority;
      scheduledFor?: any | null;
      sentAt?: any | null;
      url?: string | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt?: any | null;
    };
  };
};

export type UpdateNotificationMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
  title?: InputMaybe<Scalars["String"]["input"]>;
  body?: InputMaybe<Scalars["String"]["input"]>;
  priority?: InputMaybe<NotificationPriority>;
  url?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UpdateNotificationMutation = {
  __typename?: "Mutation";
  updateNotification: {
    __typename?: "UpdateNotificationResult";
    notification: {
      __typename?: "Notification";
      id: string;
      title: string;
      body: string;
      isSent: boolean;
      isScheduled: boolean;
      isReadyToSend?: boolean | null;
      status: NotificationStatus;
      priority: NotificationPriority;
      scheduledFor?: any | null;
      sentAt?: any | null;
      url?: string | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt?: any | null;
    };
  };
};

export type DeleteNotificationMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
}>;

export type DeleteNotificationMutation = {
  __typename?: "Mutation";
  deleteNotification: {
    __typename?: "DeleteNotificationResult";
    success: boolean;
  };
};

export type CreateNotificationScheduleMutationVariables = Exact<{
  name: Scalars["String"]["input"];
  hour: Scalars["Int"]["input"];
  minute: Scalars["Int"]["input"];
  startDate: Scalars["DateTime"]["input"];
  endDate: Scalars["DateTime"]["input"];
  notificationType: NotificationScheduleType;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  notificationTitle?: InputMaybe<Scalars["String"]["input"]>;
  notificationBody?: InputMaybe<Scalars["String"]["input"]>;
  notificationUrl?: InputMaybe<Scalars["String"]["input"]>;
  tripId?: InputMaybe<Scalars["ID"]["input"]>;
}>;

export type CreateNotificationScheduleMutation = {
  __typename?: "Mutation";
  createNotificationSchedule?: {
    __typename?: "CreateNotificationSchedulePayload";
    schedule: {
      __typename?: "NotificationSchedule";
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
      notificationTitle?: string | null;
      notificationBody?: string | null;
      notificationUrl?: string | null;
      hour: number;
      minute: number;
      formattedTime: string;
      startDate: any;
      endDate: any;
      isActive: boolean;
      isCurrentlyActive: boolean;
      isExpired: boolean;
      isUpcoming: boolean;
      lastRun?: any | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type UpdateNotificationScheduleMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  name?: InputMaybe<Scalars["String"]["input"]>;
  hour?: InputMaybe<Scalars["Int"]["input"]>;
  minute?: InputMaybe<Scalars["Int"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  isActive?: InputMaybe<Scalars["Boolean"]["input"]>;
  notificationTitle?: InputMaybe<Scalars["String"]["input"]>;
  notificationBody?: InputMaybe<Scalars["String"]["input"]>;
  notificationUrl?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UpdateNotificationScheduleMutation = {
  __typename?: "Mutation";
  updateNotificationSchedule?: {
    __typename?: "UpdateNotificationSchedulePayload";
    schedule: {
      __typename?: "NotificationSchedule";
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
      notificationTitle?: string | null;
      notificationBody?: string | null;
      notificationUrl?: string | null;
      hour: number;
      minute: number;
      formattedTime: string;
      startDate: any;
      endDate: any;
      isActive: boolean;
      isCurrentlyActive: boolean;
      isExpired: boolean;
      isUpcoming: boolean;
      lastRun?: any | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type DeleteNotificationScheduleMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteNotificationScheduleMutation = {
  __typename?: "Mutation";
  deleteNotificationSchedule?: {
    __typename?: "DeleteNotificationSchedulePayload";
    success: boolean;
    message: string;
    deletedExecutionCount?: number | null;
  } | null;
};

export type DuplicateNotificationScheduleMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DuplicateNotificationScheduleMutation = {
  __typename?: "Mutation";
  duplicateNotificationSchedule?: {
    __typename?: "DuplicateNotificationSchedulePayload";
    schedule: {
      __typename?: "NotificationSchedule";
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
      notificationTitle?: string | null;
      notificationBody?: string | null;
      notificationUrl?: string | null;
      hour: number;
      minute: number;
      formattedTime: string;
      startDate: any;
      endDate: any;
      isActive: boolean;
      isCurrentlyActive: boolean;
      isExpired: boolean;
      isUpcoming: boolean;
      lastRun?: any | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type ToggleNotificationScheduleActiveMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type ToggleNotificationScheduleActiveMutation = {
  __typename?: "Mutation";
  toggleNotificationScheduleActive?: {
    __typename?: "ToggleScheduleActivePayload";
    schedule: {
      __typename?: "NotificationSchedule";
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
      notificationTitle?: string | null;
      notificationBody?: string | null;
      notificationUrl?: string | null;
      hour: number;
      minute: number;
      formattedTime: string;
      startDate: any;
      endDate: any;
      isActive: boolean;
      isCurrentlyActive: boolean;
      isExpired: boolean;
      isUpcoming: boolean;
      lastRun?: any | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type BulkToggleNotificationScheduleActiveMutationVariables = Exact<{
  ids: Array<Scalars["ID"]["input"]> | Scalars["ID"]["input"];
  isActive: Scalars["Boolean"]["input"];
}>;

export type BulkToggleNotificationScheduleActiveMutation = {
  __typename?: "Mutation";
  bulkToggleNotificationScheduleActive?: {
    __typename?: "BulkToggleActivePayload";
    success: boolean;
    updatedCount: number;
  } | null;
};

export type BulkDeleteNotificationScheduleMutationVariables = Exact<{
  ids: Array<Scalars["ID"]["input"]> | Scalars["ID"]["input"];
}>;

export type BulkDeleteNotificationScheduleMutation = {
  __typename?: "Mutation";
  bulkDeleteNotificationSchedules?: {
    __typename?: "BulkDeleteNotificationSchedulesPayload";
    success: boolean;
    requestedCount: number;
    deletedCount: number;
    notFoundIds?: Array<string> | null;
  } | null;
};

export type UpdateNotificationScheduleLastRunMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
  lastRunAt: Scalars["DateTime"]["input"];
  lastRunStatus: LastRunStatus;
  lastRunError?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type UpdateNotificationScheduleLastRunMutation = {
  __typename?: "Mutation";
  updateNotificationScheduleLastRun?: {
    __typename?: "UpdateLastRunPayload";
    schedule: {
      __typename?: "NotificationSchedule";
      id: string;
      name: string;
      notificationType: NotificationScheduleType;
      notificationTitle?: string | null;
      notificationBody?: string | null;
      notificationUrl?: string | null;
      hour: number;
      minute: number;
      formattedTime: string;
      startDate: any;
      endDate: any;
      isActive: boolean;
      isCurrentlyActive: boolean;
      isExpired: boolean;
      isUpcoming: boolean;
      lastRun?: any | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type UpdateNotificationStatusMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
  newStatus: NotificationStatus;
}>;

export type UpdateNotificationStatusMutation = {
  __typename?: "Mutation";
  updateNotificationStatus: {
    __typename?: "UpdateNotificationStatusResult";
    previousStatus: NotificationStatus;
    newStatus: NotificationStatus;
    notification: {
      __typename?: "Notification";
      id: string;
      title: string;
      body: string;
      isSent: boolean;
      isScheduled: boolean;
      isReadyToSend?: boolean | null;
      status: NotificationStatus;
      priority: NotificationPriority;
      scheduledFor?: any | null;
      sentAt?: any | null;
      url?: string | null;
      tripId?: string | null;
      createdById: string;
      createdAt: any;
      updatedAt?: any | null;
    };
  };
};

export type SendMobileNotificationsMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
}>;

export type SendMobileNotificationsMutation = {
  __typename?: "Mutation";
  sendMobileNotifications?: {
    __typename?: "SendMobileNotificationsPayload";
    success: boolean;
    sent: number;
    failed: number;
    total: number;
  } | null;
};

export type TrackDeliveryStartMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
}>;

export type TrackDeliveryStartMutation = {
  __typename?: "Mutation";
  trackDeliveryStart?: {
    __typename?: "TrackDeliveryStartPayload";
    success: boolean;
  } | null;
};

export type TrackDeliveryCompleteMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
  totalRecipients: Scalars["Int"]["input"];
  successCount: Scalars["Int"]["input"];
  failureCount: Scalars["Int"]["input"];
  errors?: InputMaybe<Scalars["String"]["input"]>;
}>;

export type TrackDeliveryCompleteMutation = {
  __typename?: "Mutation";
  trackDeliveryComplete?: {
    __typename?: "TrackDeliveryCompletePayload";
    success: boolean;
  } | null;
};

export type TrackDeliveryFailureMutationVariables = Exact<{
  notificationId: Scalars["ID"]["input"];
  error: Scalars["String"]["input"];
}>;

export type TrackDeliveryFailureMutation = {
  __typename?: "Mutation";
  trackDeliveryFailure?: {
    __typename?: "TrackDeliveryFailurePayload";
    success: boolean;
  } | null;
};

export type GetRewardQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetRewardQuery = {
  __typename?: "Query";
  reward?: {
    __typename?: "Reward";
    id: string;
    name: string;
    description: string;
    coinCostPercentage: number;
    availableQuantity: number;
    isInStock: boolean;
    canBePurchased: boolean;
    images: Array<string>;
    primaryImage?: string | null;
    purchaseCount: number;
    isHidden: boolean;
    tripId: string;
    createdById: string;
    createdAt: any;
    updatedAt: any;
  } | null;
};

export type GetRewardsByTripQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetRewardsByTripQuery = {
  __typename?: "Query";
  rewardsByTrip?: {
    __typename?: "RewardsConnection";
    rewards: Array<{
      __typename?: "RewardWithCalculations";
      id: string;
      name: string;
      description: string;
      coinCostPercentage: number;
      dynamicCoinCost: number;
      canAfford?: boolean | null;
      availableQuantity: number;
      isInStock: boolean;
      canBePurchased: boolean;
      images: Array<string>;
      primaryImage?: string | null;
      purchaseCount: number;
      isHidden: boolean;
      tripId: string;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    }>;
    pagination: {
      __typename?: "RewardPagination";
      hasMore: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  } | null;
};

export type GetRewardsByTripAdminQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetRewardsByTripAdminQuery = {
  __typename?: "Query";
  rewardsByTripAdmin?: {
    __typename?: "RewardsConnection";
    rewards: Array<{
      __typename?: "RewardWithCalculations";
      id: string;
      name: string;
      description: string;
      coinCostPercentage: number;
      dynamicCoinCost: number;
      canAfford?: boolean | null;
      availableQuantity: number;
      isInStock: boolean;
      canBePurchased: boolean;
      images: Array<string>;
      primaryImage?: string | null;
      purchaseCount: number;
      isHidden: boolean;
      tripId: string;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    }>;
    pagination: {
      __typename?: "RewardPagination";
      hasMore: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  } | null;
};

export type GetPurchaseHistoryQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetPurchaseHistoryQuery = {
  __typename?: "Query";
  purchaseHistory?: {
    __typename?: "PurchaseHistoryConnection";
    purchases: Array<{
      __typename?: "RewardPurchase";
      purchaseId: string;
      rewardId: string;
      rewardName: string;
      groupId: string;
      groupName?: string | null;
      purchasedById: string;
      purchasedByName?: string | null;
      quantity: number;
      totalCost: number;
      status: RewardPurchaseStatus;
      collectionMethod?: string | null;
      statusUpdatedAt: any;
      statusUpdatedById?: string | null;
      statusUpdatedByName?: string | null;
      purchasedAt: any;
    }>;
    pagination: {
      __typename?: "RewardPagination";
      hasMore: boolean;
      limit: number;
      offset: number;
      total: number;
    };
  } | null;
};

export type GetTotalAvailablePointsQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetTotalAvailablePointsQuery = {
  __typename?: "Query";
  totalAvailablePoints?: {
    __typename?: "TotalAvailablePointsPayload";
    totalPoints: number;
  } | null;
};

export type CreateRewardMutationVariables = Exact<{
  input: CreateRewardInput;
}>;

export type CreateRewardMutation = {
  __typename?: "Mutation";
  createReward?: {
    __typename?: "CreateRewardPayload";
    reward: {
      __typename?: "Reward";
      id: string;
      name: string;
      description: string;
      coinCostPercentage: number;
      availableQuantity: number;
      isInStock: boolean;
      canBePurchased: boolean;
      images: Array<string>;
      primaryImage?: string | null;
      purchaseCount: number;
      isHidden: boolean;
      tripId: string;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type UpdateRewardMutationVariables = Exact<{
  input: UpdateRewardInput;
}>;

export type UpdateRewardMutation = {
  __typename?: "Mutation";
  updateReward?: {
    __typename?: "UpdateRewardPayload";
    reward: {
      __typename?: "Reward";
      id: string;
      name: string;
      description: string;
      coinCostPercentage: number;
      availableQuantity: number;
      isInStock: boolean;
      canBePurchased: boolean;
      images: Array<string>;
      primaryImage?: string | null;
      purchaseCount: number;
      isHidden: boolean;
      tripId: string;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type DeleteRewardMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteRewardMutation = {
  __typename?: "Mutation";
  deleteReward?: {
    __typename?: "DeleteRewardPayload";
    success: boolean;
    deletedRewardId: string;
  } | null;
};

export type PurchaseRewardMutationVariables = Exact<{
  input: PurchaseRewardInput;
}>;

export type PurchaseRewardMutation = {
  __typename?: "Mutation";
  purchaseReward?: {
    __typename?: "PurchaseRewardPayload";
    remainingGroupCoins: number;
    remainingRewardQuantity: number;
    purchase: {
      __typename?: "RewardPurchase";
      purchaseId: string;
      rewardId: string;
      rewardName: string;
      groupId: string;
      groupName?: string | null;
      purchasedById: string;
      purchasedByName?: string | null;
      quantity: number;
      totalCost: number;
      status: RewardPurchaseStatus;
      collectionMethod?: string | null;
      statusUpdatedAt: any;
      statusUpdatedById?: string | null;
      statusUpdatedByName?: string | null;
      purchasedAt: any;
    };
  } | null;
};

export type SetRewardHiddenMutationVariables = Exact<{
  rewardId: Scalars["ID"]["input"];
  isHidden: Scalars["Boolean"]["input"];
}>;

export type SetRewardHiddenMutation = {
  __typename?: "Mutation";
  setRewardHidden?: {
    __typename?: "SetRewardHiddenPayload";
    previousHidden: boolean;
    reward: {
      __typename?: "Reward";
      id: string;
      name: string;
      description: string;
      coinCostPercentage: number;
      availableQuantity: number;
      isInStock: boolean;
      canBePurchased: boolean;
      images: Array<string>;
      primaryImage?: string | null;
      purchaseCount: number;
      isHidden: boolean;
      tripId: string;
      createdById: string;
      createdAt: any;
      updatedAt: any;
    };
  } | null;
};

export type UpdatePurchaseStatusMutationVariables = Exact<{
  input: UpdatePurchaseStatusInput;
}>;

export type UpdatePurchaseStatusMutation = {
  __typename?: "Mutation";
  updatePurchaseStatus?: {
    __typename?: "UpdatePurchaseStatusPayload";
    previousStatus: RewardPurchaseStatus;
    refunded: boolean;
    purchase: {
      __typename?: "RewardPurchase";
      purchaseId: string;
      rewardId: string;
      rewardName: string;
      groupId: string;
      groupName?: string | null;
      purchasedById: string;
      purchasedByName?: string | null;
      quantity: number;
      totalCost: number;
      status: RewardPurchaseStatus;
      collectionMethod?: string | null;
      statusUpdatedAt: any;
      statusUpdatedById?: string | null;
      statusUpdatedByName?: string | null;
      purchasedAt: any;
    };
  } | null;
};

export type UpdateMyPurchaseStatusMutationVariables = Exact<{
  input: UpdateMyPurchaseStatusInput;
}>;

export type UpdateMyPurchaseStatusMutation = {
  __typename?: "Mutation";
  updateMyPurchaseStatus?: {
    __typename?: "UpdateMyPurchaseStatusPayload";
    previousStatus: RewardPurchaseStatus;
    purchase: {
      __typename?: "RewardPurchase";
      purchaseId: string;
      rewardId: string;
      rewardName: string;
      groupId: string;
      groupName?: string | null;
      purchasedById: string;
      purchasedByName?: string | null;
      quantity: number;
      totalCost: number;
      status: RewardPurchaseStatus;
      collectionMethod?: string | null;
      statusUpdatedAt: any;
      statusUpdatedById?: string | null;
      statusUpdatedByName?: string | null;
      purchasedAt: any;
    };
  } | null;
};

export type GetSponsorQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetSponsorQuery = {
  __typename?: "Query";
  sponsor?: {
    __typename?: "Sponsor";
    id: string;
    name: string;
    description: string;
    logoPath: string;
    isActive: boolean;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    hasLogoAdjustments: boolean;
    createdAt: any;
    updatedAt?: any | null;
  } | null;
};

export type GetSponsorsByTripQueryVariables = Exact<{
  tripId: Scalars["ID"]["input"];
}>;

export type GetSponsorsByTripQuery = {
  __typename?: "Query";
  sponsorsByTrip?: Array<{
    __typename?: "Sponsor";
    id: string;
    name: string;
    description: string;
    logoPath: string;
    isActive: boolean;
    height?: number | null;
    offsetX?: number | null;
    offsetY?: number | null;
    hasLogoAdjustments: boolean;
    createdAt: any;
    updatedAt?: any | null;
  }> | null;
};

export type CreateSponsorMutationVariables = Exact<{
  input: CreateSponsorInput;
}>;

export type CreateSponsorMutation = {
  __typename?: "Mutation";
  createSponsor?: {
    __typename?: "CreateSponsorPayload";
    sponsor: {
      __typename?: "Sponsor";
      id: string;
      name: string;
      description: string;
      logoPath: string;
      isActive: boolean;
      height?: number | null;
      offsetX?: number | null;
      offsetY?: number | null;
      hasLogoAdjustments: boolean;
      createdAt: any;
      updatedAt?: any | null;
    };
  } | null;
};

export type UpdateSponsorMutationVariables = Exact<{
  input: UpdateSponsorInput;
}>;

export type UpdateSponsorMutation = {
  __typename?: "Mutation";
  updateSponsor?: {
    __typename?: "UpdateSponsorPayload";
    sponsor: {
      __typename?: "Sponsor";
      id: string;
      name: string;
      description: string;
      logoPath: string;
      isActive: boolean;
      height?: number | null;
      offsetX?: number | null;
      offsetY?: number | null;
      hasLogoAdjustments: boolean;
      createdAt: any;
      updatedAt?: any | null;
    };
  } | null;
};

export type DeleteSponsorMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteSponsorMutation = {
  __typename?: "Mutation";
  deleteSponsor?: {
    __typename?: "DeleteSponsorPayload";
    success: boolean;
    id: string;
  } | null;
};

export type LinkSponsorToTripMutationVariables = Exact<{
  sponsorId: Scalars["ID"]["input"];
  tripId: Scalars["ID"]["input"];
}>;

export type LinkSponsorToTripMutation = {
  __typename?: "Mutation";
  linkSponsorToTrip?: {
    __typename?: "LinkSponsorToTripPayload";
    linked: boolean;
    sponsorId: string;
    tripId: string;
  } | null;
};

export type UnlinkSponsorFromTripMutationVariables = Exact<{
  sponsorId: Scalars["ID"]["input"];
  tripId: Scalars["ID"]["input"];
}>;

export type UnlinkSponsorFromTripMutation = {
  __typename?: "Mutation";
  unlinkSponsorFromTrip?: {
    __typename?: "UnlinkSponsorFromTripPayload";
    unlinked: boolean;
    sponsorId: string;
    tripId: string;
  } | null;
};

export type GetSubmissionReportsQueryVariables = Exact<{
  submissionId: Scalars["ID"]["input"];
}>;

export type GetSubmissionReportsQuery = {
  __typename?: "Query";
  submissionReports?: {
    __typename?: "SubmissionReportListResult";
    totalCount: number;
    reports: Array<{
      __typename?: "SubmissionReport";
      id: string;
      submissionId: string;
      reporterId: string;
      reason: ReportReason;
      reasonDisplay: string;
      details?: string | null;
      hasDetails: boolean;
      createdAt: any;
      reporter: {
        __typename?: "SubmissionReportReporterInfo";
        id: string;
        user: {
          __typename?: "SubmissionReportUserInfo";
          id: string;
          firstName: string;
          lastName: string;
          email?: string | null;
          hasAvatar: boolean;
        };
      };
    }>;
  } | null;
};

export type CreateSubmissionReportMutationVariables = Exact<{
  input: CreateReportInput;
}>;

export type CreateSubmissionReportMutation = {
  __typename?: "Mutation";
  createSubmissionReport?: {
    __typename?: "SubmissionReportCreateResult";
    id: string;
    submissionId: string;
    reporterId: string;
    reason: ReportReason;
    reasonDisplay: string;
    details?: string | null;
    hasDetails: boolean;
    createdAt: any;
  } | null;
};

export type GetTripQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetTripQuery = {
  __typename?: "Query";
  trip?: {
    __typename?: "Trip";
    id: string;
    name: string;
    description?: string | null;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isPlanning: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    status: TripStatus;
    backgroundImagePath?: string | null;
    createdAt: any;
    updatedAt: any;
  } | null;
};

export type GetTripsQueryVariables = Exact<{
  pagination?: InputMaybe<TripPaginationInput>;
}>;

export type GetTripsQuery = {
  __typename?: "Query";
  trips: {
    __typename?: "TripListResult";
    trips: Array<{
      __typename?: "Trip";
      id: string;
      name: string;
      description?: string | null;
      startDate: any;
      endDate: any;
      isActive: boolean;
      isPlanning: boolean;
      isCompleted: boolean;
      isCancelled: boolean;
      status: TripStatus;
      backgroundImagePath?: string | null;
      createdAt: any;
      updatedAt: any;
    }>;
    pagination: {
      __typename?: "TripPaginationInfo";
      total: number;
      hasMore: boolean;
      limit: number;
      offset: number;
    };
  };
};

export type GetTripAdminQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetTripAdminQuery = {
  __typename?: "Query";
  tripAdmin?: {
    __typename?: "Trip";
    id: string;
    name: string;
    description?: string | null;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isPlanning: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    status: TripStatus;
    backgroundImagePath?: string | null;
    createdAt: any;
    updatedAt: any;
  } | null;
};

export type CreateTripMutationVariables = Exact<{
  input: CreateTripInput;
}>;

export type CreateTripMutation = {
  __typename?: "Mutation";
  createTrip: {
    __typename?: "Trip";
    id: string;
    name: string;
    description?: string | null;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isPlanning: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    status: TripStatus;
    backgroundImagePath?: string | null;
    createdAt: any;
    updatedAt: any;
  };
};

export type UpdateTripMutationVariables = Exact<{
  input: UpdateTripInput;
}>;

export type UpdateTripMutation = {
  __typename?: "Mutation";
  updateTrip: {
    __typename?: "Trip";
    id: string;
    name: string;
    description?: string | null;
    startDate: any;
    endDate: any;
    isActive: boolean;
    isPlanning: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    status: TripStatus;
    backgroundImagePath?: string | null;
    createdAt: any;
    updatedAt: any;
  };
};

export type DeleteTripMutationVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type DeleteTripMutation = {
  __typename?: "Mutation";
  deleteTrip: { __typename?: "DeleteTripResult"; success: boolean };
};

export type GetUserQueryVariables = Exact<{
  id: Scalars["ID"]["input"];
}>;

export type GetUserQuery = {
  __typename?: "Query";
  user?: {
    __typename?: "User";
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    hasAvatar: boolean;
    role: UserRole;
    createdAt: any;
    lastSeenOn?: any | null;
    isAdmin: boolean;
    isModerator: boolean;
  } | null;
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type GetCurrentUserQuery = {
  __typename?: "Query";
  me?: {
    __typename?: "User";
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    hasAvatar: boolean;
    role: UserRole;
    createdAt: any;
    lastSeenOn?: any | null;
    isAdmin: boolean;
    isModerator: boolean;
  } | null;
};

export type GetUsersQueryVariables = Exact<{
  limit?: InputMaybe<Scalars["Int"]["input"]>;
  offset?: InputMaybe<Scalars["Int"]["input"]>;
}>;

export type GetUsersQuery = {
  __typename?: "Query";
  users?: Array<{
    __typename?: "User";
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    hasAvatar: boolean;
    role: UserRole;
    createdAt: any;
    lastSeenOn?: any | null;
    isAdmin: boolean;
    isModerator: boolean;
  }> | null;
};

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;

export type CreateUserMutation = {
  __typename?: "Mutation";
  createUser?: {
    __typename?: "UserCreateResult";
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    hasAvatar: boolean;
    role: UserRole;
    createdAt: any;
  } | null;
};

export type UpdateUserMutationVariables = Exact<{
  input: UpdateUserInput;
}>;

export type UpdateUserMutation = {
  __typename?: "Mutation";
  updateUser?: {
    __typename?: "UserUpdateResult";
    id: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    hasAvatar: boolean;
    role: UserRole;
    updatedAt: any;
  } | null;
};

export const UserFieldsFragmentDoc = `
    """
All user fields including computed properties and role information.
Use for detailed user views, profiles, and admin user management.
"""
fragment UserFields on User {
  id
  authUserId
  firstName
  lastName
  fullName
  hasAvatar
  role
  createdAt
  lastSeenOn
  isAdmin
  isModerator
}
    `;
export const UserSummaryFieldsFragmentDoc = `
    """
Minimal user fields for list displays and references.
Use when you only need basic identification.
"""
fragment UserSummaryFields on User {
  id
  firstName
  lastName
  fullName
  hasAvatar
}
    `;
export const UserCreateResultFieldsFragmentDoc = `
    """
User fields for creation/update results.
These types omit lastSeenOn and role flags.
"""
fragment UserCreateResultFields on UserCreateResult {
  id
  authUserId
  firstName
  lastName
  fullName
  hasAvatar
  role
  createdAt
}
    `;
export const UserUpdateResultFieldsFragmentDoc = `
    fragment UserUpdateResultFields on UserUpdateResult {
  id
  authUserId
  firstName
  lastName
  fullName
  hasAvatar
  role
  updatedAt
}
    `;
export const TripSummaryFieldsFragmentDoc = `
    """Minimal trip fields for references and lists."""
fragment TripSummaryFields on Trip {
  id
  name
  description
  startDate
  endDate
  status
}
    `;
export const GroupSummaryFieldsFragmentDoc = `
    """Minimal group fields for lists and references."""
fragment GroupSummaryFields on GroupSummary {
  id
  name
}
    `;
export const HiddenActivityFieldsFragmentDoc = `
    """Hidden activity result fields (includes hide metadata)."""
fragment HiddenActivityFields on HiddenActivityResult {
  id
  tripId
  title
  description
  imageUrl
  activityType
  isPinned
  isHidden
  hiddenAt
  hiddenReason
  updatedAt
}
    `;
export const SubmissionReviewerFieldsFragmentDoc = `
    """Reviewer info embedded in submissions."""
fragment SubmissionReviewerFields on SubmissionReviewerInfo {
  id
  firstName
  lastName
  email
}
    `;
export const SubmissionGroupFieldsFragmentDoc = `
    """Group info embedded in submissions."""
fragment SubmissionGroupFields on SubmissionGroupInfo {
  id
  name
  description
  image
}
    `;
export const ChallengeSubmissionCreateResultFieldsFragmentDoc = `
    """
Challenge submission create result fields.
Same as ChallengeSubmission but on create result type.
"""
fragment ChallengeSubmissionCreateResultFields on ChallengeSubmissionCreateResult {
  id
  challengeId
  groupId
  textContent
  imageIds
  videoId
  hasMedia
  hasLocation
  latitude
  longitude
  awardedPoints
  bonusPoints
  totalPoints
  ranking
  status
  reviewedById
  reviewedBy {
    ...SubmissionReviewerFields
  }
  reviewedAt
  rejectionReason
  voteCount
  voteScore
  group {
    ...SubmissionGroupFields
  }
  createdAt
  updatedAt
}
    ${SubmissionReviewerFieldsFragmentDoc}
${SubmissionGroupFieldsFragmentDoc}`;
export const ChallengeSubmissionUpdateResultFieldsFragmentDoc = `
    """
Challenge submission update result fields.
Same fields on update result type.
"""
fragment ChallengeSubmissionUpdateResultFields on ChallengeSubmissionUpdateResult {
  id
  challengeId
  groupId
  textContent
  imageIds
  videoId
  hasMedia
  hasLocation
  latitude
  longitude
  awardedPoints
  bonusPoints
  totalPoints
  ranking
  status
  reviewedById
  reviewedBy {
    ...SubmissionReviewerFields
  }
  reviewedAt
  rejectionReason
  voteCount
  voteScore
  group {
    ...SubmissionGroupFields
  }
  createdAt
  updatedAt
}
    ${SubmissionReviewerFieldsFragmentDoc}
${SubmissionGroupFieldsFragmentDoc}`;
export const ChallengeVoteFieldsFragmentDoc = `
    """
All challenge vote fields.
Use for voting displays and results.
"""
fragment ChallengeVoteFields on ChallengeVote {
  id
  challengeId
  submissionId
  voterId
  votePosition
  votePoints
  normalizedWeight
  votedAt
}
    `;
export const ChallengeVoteListFieldsFragmentDoc = `
    """Vote list with metadata."""
fragment ChallengeVoteListFields on ChallengeVoteList {
  totalVotes
  votes {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const ChallengeVoteAdminListFieldsFragmentDoc = `
    """Admin vote list with unique voter count."""
fragment ChallengeVoteAdminListFields on ChallengeVoteAdminList {
  totalVotes
  uniqueVoters
  votes {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const LocationSummaryFieldsFragmentDoc = `
    """Minimal location fields for lists."""
fragment LocationSummaryFields on Location {
  id
  userId
  latitude
  longitude
  isSharingLocation
  timestamp
}
    `;
export const CoinTransactionGroupFieldsFragmentDoc = `
    """Group info in coin transaction context."""
fragment CoinTransactionGroupFields on CoinTransactionGroup {
  id
  name
  coins
}
    `;
export const CoinTransactionAdminFieldsFragmentDoc = `
    """Admin info in coin transaction context."""
fragment CoinTransactionAdminFields on CoinTransactionAdmin {
  id
  firstName
  lastName
  fullName
}
    `;
export const CoinTransactionFieldsFragmentDoc = `
    """
All coin transaction fields.
Use for coin history and financial tracking.
"""
fragment CoinTransactionFields on CoinTransaction {
  id
  amount
  reason
  groupId
  adminId
  group {
    ...CoinTransactionGroupFields
  }
  admin {
    ...CoinTransactionAdminFields
  }
  createdAt
}
    ${CoinTransactionGroupFieldsFragmentDoc}
${CoinTransactionAdminFieldsFragmentDoc}`;
export const CoinTransactionResultFieldsFragmentDoc = `
    """Coin transaction result (with embedded transaction)."""
fragment CoinTransactionResultFields on CoinTransactionResult {
  id
  amount
  groupId
  adminId
  createdAt
  transaction {
    ...CoinTransactionFields
  }
}
    ${CoinTransactionFieldsFragmentDoc}`;
export const SubmissionReportCreateResultFieldsFragmentDoc = `
    """Report create result fields."""
fragment SubmissionReportCreateResultFields on SubmissionReportCreateResult {
  id
  submissionId
  reporterId
  reason
  reasonDisplay
  details
  hasDetails
  createdAt
}
    `;
export const ActivityAdminFieldsFragmentDoc = `
    """Admin information embedded in activities."""
fragment ActivityAdminFields on ActivityAdmin {
  id
  firstName
  lastName
}
    `;
export const ActivityFieldsFragmentDoc = `
    """
All activity fields for feed items.
Use for activity feeds, posts, and challenge events.
"""
fragment ActivityFields on Activity {
  id
  tripId
  title
  description
  imageUrl
  activityType
  isPinned
  isHidden
  admin {
    ...ActivityAdminFields
  }
  createdAt
  updatedAt
}
    ${ActivityAdminFieldsFragmentDoc}`;
export const ActivityCursorFieldsFragmentDoc = `
    """Activity cursor for pagination."""
fragment ActivityCursorFields on ActivityCursor {
  id
  createdAt
  isPinned
}
    `;
export const PaginationInfoFieldsFragmentDoc = `
    """Standard pagination info."""
fragment PaginationInfoFields on PaginationInfo {
  hasMore
  pageSize
}
    `;
export const ActivityFeedResultFieldsFragmentDoc = `
    """Activity feed result with pagination."""
fragment ActivityFeedResultFields on ActivityFeedResult {
  activities {
    ...ActivityFields
  }
  nextCursor {
    ...ActivityCursorFields
  }
  pagination {
    ...PaginationInfoFields
  }
}
    ${ActivityFieldsFragmentDoc}
${ActivityCursorFieldsFragmentDoc}
${PaginationInfoFieldsFragmentDoc}`;
export const ModerationPaginationInfoFieldsFragmentDoc = `
    """Moderation pagination info."""
fragment ModerationPaginationInfoFields on ModerationPaginationInfo {
  hasMore
  page
  pageSize
  total
  totalPages
}
    `;
export const ActivityFeedModerationResultFieldsFragmentDoc = `
    """Activity feed moderation result."""
fragment ActivityFeedModerationResultFields on ActivityFeedModerationResult {
  activities {
    ...ActivityFields
  }
  pagination {
    ...ModerationPaginationInfoFields
  }
}
    ${ActivityFieldsFragmentDoc}
${ModerationPaginationInfoFieldsFragmentDoc}`;
export const GroupFieldsFragmentDoc = `
    """
All group fields including coins and status.
Use for group details, rankings, and management.
"""
fragment GroupFields on Group {
  id
  name
  description
  code
  image
  coins
  isActive
  status
  tripId
  organizerId
  createdAt
  updatedAt
}
    `;
export const OffsetPaginationFieldsFragmentDoc = `
    """Offset-based pagination info."""
fragment OffsetPaginationFields on GroupPagination {
  hasMore
  limit
  offset
  total
}
    `;
export const GroupsConnectionFieldsFragmentDoc = `
    """Groups connection with pagination."""
fragment GroupsConnectionFields on GroupsConnection {
  groups {
    ...GroupFields
  }
  pagination {
    ...OffsetPaginationFields
  }
}
    ${GroupFieldsFragmentDoc}
${OffsetPaginationFieldsFragmentDoc}`;
export const CoinTransactionPaginationFieldsFragmentDoc = `
    """Coin transaction pagination."""
fragment CoinTransactionPaginationFields on CoinTransactionPagination {
  hasMore
  limit
  offset
  total
}
    `;
export const CoinTransactionsConnectionFieldsFragmentDoc = `
    """Coin transactions connection."""
fragment CoinTransactionsConnectionFields on CoinTransactionsConnection {
  transactions {
    ...CoinTransactionFields
  }
  pagination {
    ...CoinTransactionPaginationFields
  }
}
    ${CoinTransactionFieldsFragmentDoc}
${CoinTransactionPaginationFieldsFragmentDoc}`;
export const RewardWithCalculationsFieldsFragmentDoc = `
    """
Reward with dynamic calculations.
Use for user-facing reward displays.
"""
fragment RewardWithCalculationsFields on RewardWithCalculations {
  id
  name
  description
  coinCostPercentage
  dynamicCoinCost
  canAfford
  availableQuantity
  isInStock
  canBePurchased
  images
  primaryImage
  purchaseCount
  isHidden
  tripId
  createdById
  createdAt
  updatedAt
}
    `;
export const RewardPaginationFieldsFragmentDoc = `
    """Reward pagination."""
fragment RewardPaginationFields on RewardPagination {
  hasMore
  limit
  offset
  total
}
    `;
export const RewardsConnectionFieldsFragmentDoc = `
    """Rewards connection."""
fragment RewardsConnectionFields on RewardsConnection {
  rewards {
    ...RewardWithCalculationsFields
  }
  pagination {
    ...RewardPaginationFields
  }
}
    ${RewardWithCalculationsFieldsFragmentDoc}
${RewardPaginationFieldsFragmentDoc}`;
export const RewardPurchaseFieldsFragmentDoc = `
    """
Reward purchase fields.
Use for purchase history and order management.
"""
fragment RewardPurchaseFields on RewardPurchase {
  purchaseId
  rewardId
  rewardName
  groupId
  groupName
  purchasedById
  purchasedByName
  quantity
  totalCost
  status
  collectionMethod
  statusUpdatedAt
  statusUpdatedById
  statusUpdatedByName
  purchasedAt
}
    `;
export const PurchaseHistoryConnectionFieldsFragmentDoc = `
    """Purchase history connection."""
fragment PurchaseHistoryConnectionFields on PurchaseHistoryConnection {
  purchases {
    ...RewardPurchaseFields
  }
  pagination {
    ...RewardPaginationFields
  }
}
    ${RewardPurchaseFieldsFragmentDoc}
${RewardPaginationFieldsFragmentDoc}`;
export const NotificationScheduleSummaryFieldsFragmentDoc = `
    """Minimal schedule fields for lists."""
fragment NotificationScheduleSummaryFields on NotificationScheduleSummary {
  id
  name
  notificationType
  hour
  minute
  isActive
  startDate
  endDate
  tripId
}
    `;
export const NotificationSchedulePaginationFieldsFragmentDoc = `
    """Notification schedule pagination."""
fragment NotificationSchedulePaginationFields on NotificationSchedulePagination {
  hasMore
  limit
  offset
  total
}
    `;
export const NotificationSchedulesConnectionFieldsFragmentDoc = `
    """Notification schedules connection."""
fragment NotificationSchedulesConnectionFields on NotificationSchedulesConnection {
  schedules {
    ...NotificationScheduleSummaryFields
  }
  pagination {
    ...NotificationSchedulePaginationFields
  }
}
    ${NotificationScheduleSummaryFieldsFragmentDoc}
${NotificationSchedulePaginationFieldsFragmentDoc}`;
export const NotificationCreatorFieldsFragmentDoc = `
    """Notification creator info."""
fragment NotificationCreatorFields on NotificationCreator {
  id
  firstName
  lastName
  authUserId
}
    `;
export const NotificationWithCreatorFieldsFragmentDoc = `
    """Notification with creator info (for admin views)."""
fragment NotificationWithCreatorFields on NotificationInfo {
  id
  title
  body
  url
  tripId
  createdBy {
    ...NotificationCreatorFields
  }
  createdAt
}
    ${NotificationCreatorFieldsFragmentDoc}`;
export const NotificationDeliveryFieldsFragmentDoc = `
    """
All notification delivery fields.
Use for delivery tracking and monitoring.
"""
fragment NotificationDeliveryFields on NotificationDelivery {
  id
  notificationId
  scheduleId
  tripId
  status
  deliveryStartedAt
  deliveryCompletedAt
  totalRecipients
  successCount
  failureCount
  errorLog
  notification {
    ...NotificationWithCreatorFields
  }
  createdAt
  updatedAt
}
    ${NotificationWithCreatorFieldsFragmentDoc}`;
export const DeliveryPaginationFieldsFragmentDoc = `
    """Delivery pagination."""
fragment DeliveryPaginationFields on DeliveryPagination {
  limit
  offset
  total
}
    `;
export const NotificationDeliveryListResultFieldsFragmentDoc = `
    """Notification delivery list result."""
fragment NotificationDeliveryListResultFields on NotificationDeliveryListResult {
  deliveries {
    ...NotificationDeliveryFields
  }
  pagination {
    ...DeliveryPaginationFields
  }
}
    ${NotificationDeliveryFieldsFragmentDoc}
${DeliveryPaginationFieldsFragmentDoc}`;
export const ChallengeSubmissionFieldsFragmentDoc = `
    """
All challenge submission fields.
Use for submission details, review, and voting.
"""
fragment ChallengeSubmissionFields on ChallengeSubmission {
  id
  challengeId
  groupId
  textContent
  imageIds
  videoId
  hasMedia
  hasLocation
  latitude
  longitude
  awardedPoints
  bonusPoints
  totalPoints
  ranking
  status
  reviewedById
  reviewedBy {
    ...SubmissionReviewerFields
  }
  reviewedAt
  rejectionReason
  voteCount
  voteScore
  group {
    ...SubmissionGroupFields
  }
  createdAt
  updatedAt
}
    ${SubmissionReviewerFieldsFragmentDoc}
${SubmissionGroupFieldsFragmentDoc}`;
export const ChallengeSubmissionListResultFieldsFragmentDoc = `
    """Challenge submission list result."""
fragment ChallengeSubmissionListResultFields on ChallengeSubmissionListResult {
  submissions {
    ...ChallengeSubmissionFields
  }
  totalCount
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;
export const SubmissionReportUserFieldsFragmentDoc = `
    """User info in submission report context."""
fragment SubmissionReportUserFields on SubmissionReportUserInfo {
  id
  firstName
  lastName
  email
  hasAvatar
}
    `;
export const SubmissionReportReporterFieldsFragmentDoc = `
    """Reporter info in submission reports."""
fragment SubmissionReportReporterFields on SubmissionReportReporterInfo {
  id
  user {
    ...SubmissionReportUserFields
  }
}
    ${SubmissionReportUserFieldsFragmentDoc}`;
export const SubmissionReportFieldsFragmentDoc = `
    """
All submission report fields.
Use for moderation and content review.
"""
fragment SubmissionReportFields on SubmissionReport {
  id
  submissionId
  reporterId
  reason
  reasonDisplay
  details
  hasDetails
  createdAt
  reporter {
    ...SubmissionReportReporterFields
  }
}
    ${SubmissionReportReporterFieldsFragmentDoc}`;
export const SubmissionReportListResultFieldsFragmentDoc = `
    """Submission report list result."""
fragment SubmissionReportListResultFields on SubmissionReportListResult {
  reports {
    ...SubmissionReportFields
  }
  totalCount
}
    ${SubmissionReportFieldsFragmentDoc}`;
export const FriendLocationFieldsFragmentDoc = `
    """
Friend location with optional distance.
Use for displaying friends on a map.
"""
fragment FriendLocationFields on FriendLocation {
  id
  userId
  latitude
  longitude
  accuracy
  altitude
  heading
  speed
  isSharingLocation
  distanceKm
  timestamp
}
    `;
export const FriendsLocationsConnectionFieldsFragmentDoc = `
    """Friends locations connection."""
fragment FriendsLocationsConnectionFields on FriendsLocationsConnection {
  locations {
    ...FriendLocationFields
  }
  total
}
    ${FriendLocationFieldsFragmentDoc}`;
export const TripFieldsFragmentDoc = `
    """
All trip fields including status flags and dates.
Use for trip details, trip management, and listings.
"""
fragment TripFields on Trip {
  id
  name
  description
  startDate
  endDate
  isActive
  isPlanning
  isCompleted
  isCancelled
  status
  backgroundImagePath
  createdAt
  updatedAt
}
    `;
export const TripPaginationInfoFieldsFragmentDoc = `
    """Trip pagination info."""
fragment TripPaginationInfoFields on TripPaginationInfo {
  hasMore
  limit
  offset
  total
}
    `;
export const TripListResultFieldsFragmentDoc = `
    """Trip list result."""
fragment TripListResultFields on TripListResult {
  trips {
    ...TripFields
  }
  pagination {
    ...TripPaginationInfoFields
  }
}
    ${TripFieldsFragmentDoc}
${TripPaginationInfoFieldsFragmentDoc}`;
export const SponsorFieldsFragmentDoc = `
    """
All sponsor fields including logo adjustments.
Use for sponsor management and display.
"""
fragment SponsorFields on Sponsor {
  id
  name
  description
  logoPath
  isActive
  height
  offsetX
  offsetY
  hasLogoAdjustments
  createdAt
  updatedAt
}
    `;
export const SponsorListResultFieldsFragmentDoc = `
    """Sponsor list result."""
fragment SponsorListResultFields on SponsorListResult {
  sponsors {
    ...SponsorFields
  }
  total
}
    ${SponsorFieldsFragmentDoc}`;
export const NotificationFieldsFragmentDoc = `
    """
All notification fields.
Use for notification displays and management.
"""
fragment NotificationFields on Notification {
  id
  title
  body
  isSent
  isScheduled
  isReadyToSend
  status
  priority
  scheduledFor
  sentAt
  url
  tripId
  createdById
  createdAt
  updatedAt
}
    `;
export const NotificationPaginationInfoFieldsFragmentDoc = `
    """Notification pagination info."""
fragment NotificationPaginationInfoFields on NotificationPaginationInfo {
  page
  pageSize
  total
  totalPages
}
    `;
export const MyNotificationsResultFieldsFragmentDoc = `
    """My notifications result."""
fragment MyNotificationsResultFields on MyNotificationsResult {
  notifications {
    ...NotificationFields
  }
  pagination {
    ...NotificationPaginationInfoFields
  }
}
    ${NotificationFieldsFragmentDoc}
${NotificationPaginationInfoFieldsFragmentDoc}`;
export const NotificationOffsetPaginationInfoFieldsFragmentDoc = `
    """Notification offset pagination info."""
fragment NotificationOffsetPaginationInfoFields on NotificationOffsetPaginationInfo {
  hasMore
  limit
  offset
  total
}
    `;
export const AllNotificationsResultFieldsFragmentDoc = `
    """All notifications result (admin)."""
fragment AllNotificationsResultFields on AllNotificationsResult {
  notifications {
    ...NotificationFields
  }
  pagination {
    ...NotificationOffsetPaginationInfoFields
  }
}
    ${NotificationFieldsFragmentDoc}
${NotificationOffsetPaginationInfoFieldsFragmentDoc}`;
export const CoinStatisticsFieldsFragmentDoc = `
    """Coin statistics for a trip."""
fragment CoinStatisticsFields on CoinStatistics {
  addedCoins
  removedCoins
  netBalance
  transactionCount
  time
}
    `;
export const CoinQuickStatsFieldsFragmentDoc = `
    """Coin quick stats overview."""
fragment CoinQuickStatsFields on CoinQuickStats {
  totalCoins
  totalGroups
  averageCoinsPerGroup
  richestGroupId
  richestGroupName
  time
}
    `;
export const FormattedUserFieldsFragmentDoc = `
    """Formatted user for stats displays."""
fragment FormattedUserFields on FormattedUser {
  name
  transactionCount
}
    `;
export const CoinAdditionalInsightsFieldsFragmentDoc = `
    """Coin additional insights."""
fragment CoinAdditionalInsightsFields on CoinAdditionalInsights {
  mostActiveAdmin {
    ...FormattedUserFields
  }
  recentTransactions {
    ...CoinTransactionFields
  }
}
    ${FormattedUserFieldsFragmentDoc}
${CoinTransactionFieldsFragmentDoc}`;
export const MostActiveAdminStatsFieldsFragmentDoc = `
    """Most active admin stats."""
fragment MostActiveAdminStatsFields on MostActiveAdminStats {
  adminId
  adminName
  transactionCount
  totalAmount
}
    `;
export const GroupRankingFieldsFragmentDoc = `
    """
Group fields for ranking displays.
Same as GroupFields but on GroupRanking type.
"""
fragment GroupRankingFields on GroupRanking {
  id
  name
  description
  code
  image
  coins
  isActive
  status
  tripId
  organizerId
  createdAt
}
    `;
export const GroupRankingResultFieldsFragmentDoc = `
    """Group ranking result."""
fragment GroupRankingResultFields on GroupRankingResult {
  currentDate
  data {
    ...GroupRankingFields
  }
}
    ${GroupRankingFieldsFragmentDoc}`;
export const DeliveryStatusBreakdownFieldsFragmentDoc = `
    """Delivery status breakdown."""
fragment DeliveryStatusBreakdownFields on DeliveryStatusBreakdown {
  success
  failure
  partialFailure
  pending
}
    `;
export const DeliveryStatsFieldsFragmentDoc = `
    """Delivery statistics."""
fragment DeliveryStatsFields on DeliveryStats {
  totalDeliveries
  totalSuccess
  totalFailures
  totalRecipients
  successRate
  avgSuccessPerDelivery
  avgFailuresPerDelivery
  statusBreakdown {
    ...DeliveryStatusBreakdownFields
  }
}
    ${DeliveryStatusBreakdownFieldsFragmentDoc}`;
export const SubmissionVoteCountFieldsFragmentDoc = `
    """Submission vote count statistics."""
fragment SubmissionVoteCountFields on SubmissionVoteCount {
  submissionId
  voteCount
  voteScore
}
    `;
export const VotingProgressFieldsFragmentDoc = `
    """Voting progress for a challenge."""
fragment VotingProgressFields on VotingProgress {
  challengeId
  totalVotes
  submissionStats {
    ...SubmissionVoteCountFields
  }
}
    ${SubmissionVoteCountFieldsFragmentDoc}`;
export const AdminVotingInfoFieldsFragmentDoc = `
    """Admin voting info."""
fragment AdminVotingInfoFields on AdminVotingInfo {
  participantId
  hasVotedAll
  votedPositions
}
    `;
export const JudgedStaffVotingProgressFieldsFragmentDoc = `
    """Judged staff voting progress."""
fragment JudgedStaffVotingProgressFields on JudgedStaffVotingProgress {
  allAdminsVoted
  totalAdmins
  votedAdmins
  pendingAdmins
  eligibleSubmissionsCount
  requiredPositions
  adminProgress {
    ...AdminVotingInfoFields
  }
}
    ${AdminVotingInfoFieldsFragmentDoc}`;
export const CreateGroupPayloadFieldsFragmentDoc = `
    """Create group payload."""
fragment CreateGroupPayloadFields on CreateGroupPayload {
  group {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;
export const UpdateGroupPayloadFieldsFragmentDoc = `
    """Update group payload."""
fragment UpdateGroupPayloadFields on UpdateGroupPayload {
  group {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;
export const DeleteGroupPayloadFieldsFragmentDoc = `
    """Delete group payload."""
fragment DeleteGroupPayloadFields on DeleteGroupPayload {
  success
}
    `;
export const RewardFieldsFragmentDoc = `
    """
All reward fields.
Use for reward management and display.
"""
fragment RewardFields on Reward {
  id
  name
  description
  coinCostPercentage
  availableQuantity
  isInStock
  canBePurchased
  images
  primaryImage
  purchaseCount
  isHidden
  tripId
  createdById
  createdAt
  updatedAt
}
    `;
export const CreateRewardPayloadFieldsFragmentDoc = `
    """Create reward payload."""
fragment CreateRewardPayloadFields on CreateRewardPayload {
  reward {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;
export const UpdateRewardPayloadFieldsFragmentDoc = `
    """Update reward payload."""
fragment UpdateRewardPayloadFields on UpdateRewardPayload {
  reward {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;
export const DeleteRewardPayloadFieldsFragmentDoc = `
    """Delete reward payload."""
fragment DeleteRewardPayloadFields on DeleteRewardPayload {
  success
  deletedRewardId
}
    `;
export const SetRewardHiddenPayloadFieldsFragmentDoc = `
    """Set reward hidden payload."""
fragment SetRewardHiddenPayloadFields on SetRewardHiddenPayload {
  previousHidden
  reward {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;
export const PurchaseRewardPayloadFieldsFragmentDoc = `
    """Purchase reward payload."""
fragment PurchaseRewardPayloadFields on PurchaseRewardPayload {
  purchase {
    ...RewardPurchaseFields
  }
  remainingGroupCoins
  remainingRewardQuantity
}
    ${RewardPurchaseFieldsFragmentDoc}`;
export const UpdatePurchaseStatusPayloadFieldsFragmentDoc = `
    """Update purchase status payload."""
fragment UpdatePurchaseStatusPayloadFields on UpdatePurchaseStatusPayload {
  purchase {
    ...RewardPurchaseFields
  }
  previousStatus
  refunded
}
    ${RewardPurchaseFieldsFragmentDoc}`;
export const UpdateMyPurchaseStatusPayloadFieldsFragmentDoc = `
    """Update my purchase status payload."""
fragment UpdateMyPurchaseStatusPayloadFields on UpdateMyPurchaseStatusPayload {
  purchase {
    ...RewardPurchaseFields
  }
  previousStatus
}
    ${RewardPurchaseFieldsFragmentDoc}`;
export const CreateSponsorPayloadFieldsFragmentDoc = `
    """Create sponsor payload."""
fragment CreateSponsorPayloadFields on CreateSponsorPayload {
  sponsor {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;
export const UpdateSponsorPayloadFieldsFragmentDoc = `
    """Update sponsor payload."""
fragment UpdateSponsorPayloadFields on UpdateSponsorPayload {
  sponsor {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;
export const DeleteSponsorPayloadFieldsFragmentDoc = `
    """Delete sponsor payload."""
fragment DeleteSponsorPayloadFields on DeleteSponsorPayload {
  success
  id
}
    `;
export const LinkSponsorToTripPayloadFieldsFragmentDoc = `
    """Link sponsor to trip payload."""
fragment LinkSponsorToTripPayloadFields on LinkSponsorToTripPayload {
  linked
  sponsorId
  tripId
}
    `;
export const UnlinkSponsorFromTripPayloadFieldsFragmentDoc = `
    """Unlink sponsor from trip payload."""
fragment UnlinkSponsorFromTripPayloadFields on UnlinkSponsorFromTripPayload {
  unlinked
  sponsorId
  tripId
}
    `;
export const CreateNotificationResultFieldsFragmentDoc = `
    """Create notification result."""
fragment CreateNotificationResultFields on CreateNotificationResult {
  notification {
    ...NotificationFields
  }
}
    ${NotificationFieldsFragmentDoc}`;
export const UpdateNotificationResultFieldsFragmentDoc = `
    """Update notification result."""
fragment UpdateNotificationResultFields on UpdateNotificationResult {
  notification {
    ...NotificationFields
  }
}
    ${NotificationFieldsFragmentDoc}`;
export const DeleteNotificationResultFieldsFragmentDoc = `
    """Delete notification result."""
fragment DeleteNotificationResultFields on DeleteNotificationResult {
  success
}
    `;
export const UpdateNotificationStatusResultFieldsFragmentDoc = `
    """Update notification status result."""
fragment UpdateNotificationStatusResultFields on UpdateNotificationStatusResult {
  notification {
    ...NotificationFields
  }
  previousStatus
  newStatus
}
    ${NotificationFieldsFragmentDoc}`;
export const NotificationScheduleFieldsFragmentDoc = `
    """
All notification schedule fields.
Use for schedule management and automation.
"""
fragment NotificationScheduleFields on NotificationSchedule {
  id
  name
  notificationType
  notificationTitle
  notificationBody
  notificationUrl
  hour
  minute
  formattedTime
  startDate
  endDate
  isActive
  isCurrentlyActive
  isExpired
  isUpcoming
  lastRun
  tripId
  createdById
  createdAt
  updatedAt
}
    `;
export const CreateNotificationSchedulePayloadFieldsFragmentDoc = `
    """Create notification schedule payload."""
fragment CreateNotificationSchedulePayloadFields on CreateNotificationSchedulePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const UpdateNotificationSchedulePayloadFieldsFragmentDoc = `
    """Update notification schedule payload."""
fragment UpdateNotificationSchedulePayloadFields on UpdateNotificationSchedulePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const DeleteNotificationSchedulePayloadFieldsFragmentDoc = `
    """Delete notification schedule payload."""
fragment DeleteNotificationSchedulePayloadFields on DeleteNotificationSchedulePayload {
  success
  message
  deletedExecutionCount
}
    `;
export const DuplicateNotificationSchedulePayloadFieldsFragmentDoc = `
    """Duplicate notification schedule payload."""
fragment DuplicateNotificationSchedulePayloadFields on DuplicateNotificationSchedulePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const ToggleScheduleActivePayloadFieldsFragmentDoc = `
    """Toggle schedule active payload."""
fragment ToggleScheduleActivePayloadFields on ToggleScheduleActivePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const BulkToggleActivePayloadFieldsFragmentDoc = `
    """Bulk toggle active payload."""
fragment BulkToggleActivePayloadFields on BulkToggleActivePayload {
  success
  updatedCount
}
    `;
export const BulkDeleteNotificationSchedulesPayloadFieldsFragmentDoc = `
    """Bulk delete notification schedules payload."""
fragment BulkDeleteNotificationSchedulesPayloadFields on BulkDeleteNotificationSchedulesPayload {
  success
  requestedCount
  deletedCount
  notFoundIds
}
    `;
export const UpdateLastRunPayloadFieldsFragmentDoc = `
    """Update last run payload."""
fragment UpdateLastRunPayloadFields on UpdateLastRunPayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const SendMobileNotificationsPayloadFieldsFragmentDoc = `
    """Send mobile notifications payload."""
fragment SendMobileNotificationsPayloadFields on SendMobileNotificationsPayload {
  success
  sent
  failed
  total
}
    `;
export const TrackDeliveryStartPayloadFieldsFragmentDoc = `
    """Track delivery start payload."""
fragment TrackDeliveryStartPayloadFields on TrackDeliveryStartPayload {
  success
}
    `;
export const TrackDeliveryCompletePayloadFieldsFragmentDoc = `
    """Track delivery complete payload."""
fragment TrackDeliveryCompletePayloadFields on TrackDeliveryCompletePayload {
  success
}
    `;
export const TrackDeliveryFailurePayloadFieldsFragmentDoc = `
    """Track delivery failure payload."""
fragment TrackDeliveryFailurePayloadFields on TrackDeliveryFailurePayload {
  success
}
    `;
export const DeleteActivityResultFieldsFragmentDoc = `
    """Delete activity result."""
fragment DeleteActivityResultFields on DeleteActivityResult {
  success
}
    `;
export const ReactionCountsFieldsFragmentDoc = `
    """Reaction counts by type."""
fragment ReactionCountsFields on ReactionCounts {
  clap
  fire
  heart
  star
}
    `;
export const ReactionsSummaryFieldsFragmentDoc = `
    """Reactions summary on activities."""
fragment ReactionsSummaryFields on ReactionsSummary {
  total
  myReactions
  counts {
    ...ReactionCountsFields
  }
}
    ${ReactionCountsFieldsFragmentDoc}`;
export const ToggleReactionResultFieldsFragmentDoc = `
    """Toggle reaction result."""
fragment ToggleReactionResultFields on ToggleReactionResult {
  activityId
  reactionType
  isActive
  reactionsSummary {
    ...ReactionsSummaryFields
  }
}
    ${ReactionsSummaryFieldsFragmentDoc}`;
export const SubmitVotePayloadFieldsFragmentDoc = `
    """Submit vote payload."""
fragment SubmitVotePayloadFields on SubmitVotePayload {
  vote {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const SubmitVotesPayloadFieldsFragmentDoc = `
    """Submit votes payload."""
fragment SubmitVotesPayloadFields on SubmitVotesPayload {
  totalVotesCast
  votes {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const ForceEndVotingPayloadFieldsFragmentDoc = `
    """Force end voting payload."""
fragment ForceEndVotingPayloadFields on ForceEndVotingPayload {
  success
  challengeId
  challengeStatus
  finalized
  totalVotes
}
    `;
export const DeleteTripResultFieldsFragmentDoc = `
    """Delete trip result."""
fragment DeleteTripResultFields on DeleteTripResult {
  success
}
    `;
export const SharingUserFieldsFragmentDoc = `
    """User info for location sharing."""
fragment SharingUserFields on SharingUserInfo {
  id
  firstName
  lastName
}
    `;
export const LocationFieldsFragmentDoc = `
    """
All location fields including coordinates and movement data.
Use for location tracking and maps.
"""
fragment LocationFields on Location {
  id
  userId
  latitude
  longitude
  accuracy
  altitude
  altitudeAccuracy
  heading
  speed
  isSharingLocation
  usersToShareWith {
    ...SharingUserFields
  }
  timestamp
}
    ${SharingUserFieldsFragmentDoc}`;
export const UpdateLocationPayloadFieldsFragmentDoc = `
    """Update location payload."""
fragment UpdateLocationPayloadFields on UpdateLocationPayload {
  location {
    ...LocationFields
  }
}
    ${LocationFieldsFragmentDoc}`;
export const LocationSharingSettingsFieldsFragmentDoc = `
    """Location sharing settings."""
fragment LocationSharingSettingsFields on LocationSharingSettings {
  isSharingLocation
  usersToShareWith {
    ...SharingUserFields
  }
}
    ${SharingUserFieldsFragmentDoc}`;
export const UpdateSharingSettingsPayloadFieldsFragmentDoc = `
    """Update sharing settings payload."""
fragment UpdateSharingSettingsPayloadFields on UpdateSharingSettingsPayload {
  settings {
    ...LocationSharingSettingsFields
  }
}
    ${LocationSharingSettingsFieldsFragmentDoc}`;
export const SharingUserPayloadFieldsFragmentDoc = `
    """Sharing user payload."""
fragment SharingUserPayloadFields on SharingUserPayload {
  location {
    ...LocationFields
  }
}
    ${LocationFieldsFragmentDoc}`;
export const TotalAvailablePointsPayloadFieldsFragmentDoc = `
    """Total available points payload."""
fragment TotalAvailablePointsPayloadFields on TotalAvailablePointsPayload {
  totalPoints
}
    `;
export const CheckInactiveUsersPayloadFieldsFragmentDoc = `
    """Check inactive users payload."""
fragment CheckInactiveUsersPayloadFields on CheckInactiveUsersPayload {
  checked
  notified
  skipped
  errors
}
    `;
export const DownloadUrlResultFieldsFragmentDoc = `
    """Download URL result."""
fragment DownloadUrlResultFields on DownloadUrlResult {
  signedUrl
  expiresAt
}
    `;
export const UploadUrlResultFieldsFragmentDoc = `
    """Upload URL result."""
fragment UploadUrlResultFields on UploadUrlResult {
  bucket
  storagePath
  objectPath
  resumableUrl
  token
}
    `;
export const PublicUrlResultFieldsFragmentDoc = `
    """Public URL result."""
fragment PublicUrlResultFields on PublicUrlResult {
  publicUrl
}
    `;
export const ExecutionHistoryNotificationFieldsFragmentDoc = `
    """Notification info in execution history."""
fragment ExecutionHistoryNotificationFields on ExecutionHistoryNotification {
  id
  title
  body
  createdAt
}
    `;
export const ExecutionHistoryEntryFieldsFragmentDoc = `
    """Execution history entry for schedules."""
fragment ExecutionHistoryEntryFields on ExecutionHistoryEntry {
  id
  executedAt
  notification {
    ...ExecutionHistoryNotificationFields
  }
}
    ${ExecutionHistoryNotificationFieldsFragmentDoc}`;
export const ExecutionHistoryResultFieldsFragmentDoc = `
    """Execution history result."""
fragment ExecutionHistoryResultFields on ExecutionHistoryResult {
  executions {
    ...ExecutionHistoryEntryFields
  }
}
    ${ExecutionHistoryEntryFieldsFragmentDoc}`;
export const GetActivityDocument = `
    query GetActivity($id: ID!) {
  activity(id: $id) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useGetActivityQuery = <TData = GetActivityQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetActivityQueryVariables,
  options?: Omit<
    UseQueryOptions<GetActivityQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetActivityQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetActivityQuery, TError, TData>({
    queryKey: ["GetActivity", variables],
    queryFn: fetcher<GetActivityQuery, GetActivityQueryVariables>(
      client,
      GetActivityDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetActivityQuery.getKey = (variables: GetActivityQueryVariables) => [
  "GetActivity",
  variables,
];

export const GetActivitiesByTripDocument = `
    query GetActivitiesByTrip($tripId: ID!, $limit: Int, $cursor: ActivityCursorInput) {
  activitiesByTrip(input: {tripId: $tripId, pageSize: $limit, cursor: $cursor}) {
    activities {
      ...ActivityFields
    }
    nextCursor {
      ...ActivityCursorFields
    }
    pagination {
      ...PaginationInfoFields
    }
  }
}
    ${ActivityFieldsFragmentDoc}
${ActivityCursorFieldsFragmentDoc}
${PaginationInfoFieldsFragmentDoc}`;

export const useGetActivitiesByTripQuery = <
  TData = GetActivitiesByTripQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetActivitiesByTripQueryVariables,
  options?: Omit<
    UseQueryOptions<GetActivitiesByTripQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetActivitiesByTripQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetActivitiesByTripQuery, TError, TData>({
    queryKey: ["GetActivitiesByTrip", variables],
    queryFn: fetcher<
      GetActivitiesByTripQuery,
      GetActivitiesByTripQueryVariables
    >(client, GetActivitiesByTripDocument, variables, headers),
    ...options,
  });
};

useGetActivitiesByTripQuery.getKey = (
  variables: GetActivitiesByTripQueryVariables,
) => ["GetActivitiesByTrip", variables];

export const GetActivitiesByTripModerationDocument = `
    query GetActivitiesByTripModeration($tripId: ID!, $page: Int, $perPage: Int, $includeHidden: Boolean) {
  activitiesByTripModeration(
    input: {tripId: $tripId, page: $page, pageSize: $perPage}
  ) {
    activities {
      ...ActivityFields
    }
    pagination {
      ...ModerationPaginationInfoFields
    }
  }
}
    ${ActivityFieldsFragmentDoc}
${ModerationPaginationInfoFieldsFragmentDoc}`;

export const useGetActivitiesByTripModerationQuery = <
  TData = GetActivitiesByTripModerationQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetActivitiesByTripModerationQueryVariables,
  options?: Omit<
    UseQueryOptions<GetActivitiesByTripModerationQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetActivitiesByTripModerationQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetActivitiesByTripModerationQuery, TError, TData>({
    queryKey: ["GetActivitiesByTripModeration", variables],
    queryFn: fetcher<
      GetActivitiesByTripModerationQuery,
      GetActivitiesByTripModerationQueryVariables
    >(client, GetActivitiesByTripModerationDocument, variables, headers),
    ...options,
  });
};

useGetActivitiesByTripModerationQuery.getKey = (
  variables: GetActivitiesByTripModerationQueryVariables,
) => ["GetActivitiesByTripModeration", variables];

export const CreateCustomActivityDocument = `
    mutation CreateCustomActivity($input: CreateCustomActivityInput!) {
  createCustomActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useCreateCustomActivityMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateCustomActivityMutation,
    TError,
    CreateCustomActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateCustomActivityMutation,
    TError,
    CreateCustomActivityMutationVariables,
    TContext
  >({
    mutationKey: ["CreateCustomActivity"],
    mutationFn: (variables?: CreateCustomActivityMutationVariables) =>
      fetcher<
        CreateCustomActivityMutation,
        CreateCustomActivityMutationVariables
      >(client, CreateCustomActivityDocument, variables, headers)(),
    ...options,
  });
};

export const CreateRankChangeActivityDocument = `
    mutation CreateRankChangeActivity($input: CreateRankChangeActivityInput!) {
  createRankChangeActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useCreateRankChangeActivityMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateRankChangeActivityMutation,
    TError,
    CreateRankChangeActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateRankChangeActivityMutation,
    TError,
    CreateRankChangeActivityMutationVariables,
    TContext
  >({
    mutationKey: ["CreateRankChangeActivity"],
    mutationFn: (variables?: CreateRankChangeActivityMutationVariables) =>
      fetcher<
        CreateRankChangeActivityMutation,
        CreateRankChangeActivityMutationVariables
      >(client, CreateRankChangeActivityDocument, variables, headers)(),
    ...options,
  });
};

export const CreateSubmissionActivityDocument = `
    mutation CreateSubmissionActivity($input: CreateSubmissionActivityInput!) {
  createSubmissionActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useCreateSubmissionActivityMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateSubmissionActivityMutation,
    TError,
    CreateSubmissionActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateSubmissionActivityMutation,
    TError,
    CreateSubmissionActivityMutationVariables,
    TContext
  >({
    mutationKey: ["CreateSubmissionActivity"],
    mutationFn: (variables?: CreateSubmissionActivityMutationVariables) =>
      fetcher<
        CreateSubmissionActivityMutation,
        CreateSubmissionActivityMutationVariables
      >(client, CreateSubmissionActivityDocument, variables, headers)(),
    ...options,
  });
};

export const UpdateActivityDocument = `
    mutation UpdateActivity($input: UpdateActivityInput!) {
  updateActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useUpdateActivityMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateActivityMutation,
    TError,
    UpdateActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateActivityMutation,
    TError,
    UpdateActivityMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateActivity"],
    mutationFn: (variables?: UpdateActivityMutationVariables) =>
      fetcher<UpdateActivityMutation, UpdateActivityMutationVariables>(
        client,
        UpdateActivityDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const DeleteActivityDocument = `
    mutation DeleteActivity($id: ID!) {
  deleteActivity(input: {activityId: $id}) {
    ...DeleteActivityResultFields
  }
}
    ${DeleteActivityResultFieldsFragmentDoc}`;

export const useDeleteActivityMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteActivityMutation,
    TError,
    DeleteActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteActivityMutation,
    TError,
    DeleteActivityMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteActivity"],
    mutationFn: (variables?: DeleteActivityMutationVariables) =>
      fetcher<DeleteActivityMutation, DeleteActivityMutationVariables>(
        client,
        DeleteActivityDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const HideActivityDocument = `
    mutation HideActivity($id: ID!, $reason: String) {
  hideActivity(input: {activityId: $id, reason: $reason}) {
    ...HiddenActivityFields
  }
}
    ${HiddenActivityFieldsFragmentDoc}`;

export const useHideActivityMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    HideActivityMutation,
    TError,
    HideActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    HideActivityMutation,
    TError,
    HideActivityMutationVariables,
    TContext
  >({
    mutationKey: ["HideActivity"],
    mutationFn: (variables?: HideActivityMutationVariables) =>
      fetcher<HideActivityMutation, HideActivityMutationVariables>(
        client,
        HideActivityDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UnhideActivityDocument = `
    mutation UnhideActivity($id: ID!) {
  unhideActivity(input: {activityId: $id}) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useUnhideActivityMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UnhideActivityMutation,
    TError,
    UnhideActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UnhideActivityMutation,
    TError,
    UnhideActivityMutationVariables,
    TContext
  >({
    mutationKey: ["UnhideActivity"],
    mutationFn: (variables?: UnhideActivityMutationVariables) =>
      fetcher<UnhideActivityMutation, UnhideActivityMutationVariables>(
        client,
        UnhideActivityDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const SetActivityPinnedDocument = `
    mutation SetActivityPinned($id: ID!, $isPinned: Boolean!) {
  setActivityPinned(input: {activityId: $id, isPinned: $isPinned}) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useSetActivityPinnedMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    SetActivityPinnedMutation,
    TError,
    SetActivityPinnedMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    SetActivityPinnedMutation,
    TError,
    SetActivityPinnedMutationVariables,
    TContext
  >({
    mutationKey: ["SetActivityPinned"],
    mutationFn: (variables?: SetActivityPinnedMutationVariables) =>
      fetcher<SetActivityPinnedMutation, SetActivityPinnedMutationVariables>(
        client,
        SetActivityPinnedDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const ToggleActivityReactionDocument = `
    mutation ToggleActivityReaction($activityId: ID!, $reaction: ReactionType!) {
  toggleActivityReaction(
    input: {activityId: $activityId, reactionType: $reaction}
  ) {
    ...ToggleReactionResultFields
  }
}
    ${ToggleReactionResultFieldsFragmentDoc}`;

export const useToggleActivityReactionMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    ToggleActivityReactionMutation,
    TError,
    ToggleActivityReactionMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    ToggleActivityReactionMutation,
    TError,
    ToggleActivityReactionMutationVariables,
    TContext
  >({
    mutationKey: ["ToggleActivityReaction"],
    mutationFn: (variables?: ToggleActivityReactionMutationVariables) =>
      fetcher<
        ToggleActivityReactionMutation,
        ToggleActivityReactionMutationVariables
      >(client, ToggleActivityReactionDocument, variables, headers)(),
    ...options,
  });
};

export const GetChallengeSubmissionDocument = `
    query GetChallengeSubmission($id: ID!) {
  challengeSubmission(id: $id) {
    ...ChallengeSubmissionFields
  }
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;

export const useGetChallengeSubmissionQuery = <
  TData = GetChallengeSubmissionQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetChallengeSubmissionQueryVariables,
  options?: Omit<
    UseQueryOptions<GetChallengeSubmissionQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetChallengeSubmissionQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetChallengeSubmissionQuery, TError, TData>({
    queryKey: ["GetChallengeSubmission", variables],
    queryFn: fetcher<
      GetChallengeSubmissionQuery,
      GetChallengeSubmissionQueryVariables
    >(client, GetChallengeSubmissionDocument, variables, headers),
    ...options,
  });
};

useGetChallengeSubmissionQuery.getKey = (
  variables: GetChallengeSubmissionQueryVariables,
) => ["GetChallengeSubmission", variables];

export const GetChallengeSubmissionsDocument = `
    query GetChallengeSubmissions($challengeId: ID!, $limit: Int = 20, $offset: Int = 0, $orderBy: SubmissionOrderBy = voteScore, $orderDirection: OrderDirection = desc) {
  challengeSubmissions(
    challengeId: $challengeId
    limit: $limit
    offset: $offset
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    submissions {
      ...ChallengeSubmissionFields
    }
    totalCount
  }
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;

export const useGetChallengeSubmissionsQuery = <
  TData = GetChallengeSubmissionsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetChallengeSubmissionsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetChallengeSubmissionsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetChallengeSubmissionsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetChallengeSubmissionsQuery, TError, TData>({
    queryKey: ["GetChallengeSubmissions", variables],
    queryFn: fetcher<
      GetChallengeSubmissionsQuery,
      GetChallengeSubmissionsQueryVariables
    >(client, GetChallengeSubmissionsDocument, variables, headers),
    ...options,
  });
};

useGetChallengeSubmissionsQuery.getKey = (
  variables: GetChallengeSubmissionsQueryVariables,
) => ["GetChallengeSubmissions", variables];

export const GetChallengeSubmissionByChallengeAndGroupDocument = `
    query GetChallengeSubmissionByChallengeAndGroup($challengeId: ID!, $groupId: ID!) {
  challengeSubmissionByChallengeAndGroup(
    challengeId: $challengeId
    groupId: $groupId
  ) {
    ...ChallengeSubmissionFields
  }
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;

export const useGetChallengeSubmissionByChallengeAndGroupQuery = <
  TData = GetChallengeSubmissionByChallengeAndGroupQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetChallengeSubmissionByChallengeAndGroupQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetChallengeSubmissionByChallengeAndGroupQuery,
      TError,
      TData
    >,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetChallengeSubmissionByChallengeAndGroupQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<
    GetChallengeSubmissionByChallengeAndGroupQuery,
    TError,
    TData
  >({
    queryKey: ["GetChallengeSubmissionByChallengeAndGroup", variables],
    queryFn: fetcher<
      GetChallengeSubmissionByChallengeAndGroupQuery,
      GetChallengeSubmissionByChallengeAndGroupQueryVariables
    >(
      client,
      GetChallengeSubmissionByChallengeAndGroupDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetChallengeSubmissionByChallengeAndGroupQuery.getKey = (
  variables: GetChallengeSubmissionByChallengeAndGroupQueryVariables,
) => ["GetChallengeSubmissionByChallengeAndGroup", variables];

export const GetVotesByChallengeDocument = `
    query GetVotesByChallenge($challengeId: ID!) {
  votesByChallenge(input: {challengeId: $challengeId}) {
    votes {
      ...ChallengeVoteFields
    }
    totalVotes
    uniqueVoters
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export const useGetVotesByChallengeQuery = <
  TData = GetVotesByChallengeQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetVotesByChallengeQueryVariables,
  options?: Omit<
    UseQueryOptions<GetVotesByChallengeQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetVotesByChallengeQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetVotesByChallengeQuery, TError, TData>({
    queryKey: ["GetVotesByChallenge", variables],
    queryFn: fetcher<
      GetVotesByChallengeQuery,
      GetVotesByChallengeQueryVariables
    >(client, GetVotesByChallengeDocument, variables, headers),
    ...options,
  });
};

useGetVotesByChallengeQuery.getKey = (
  variables: GetVotesByChallengeQueryVariables,
) => ["GetVotesByChallenge", variables];

export const GetMyVotesDocument = `
    query GetMyVotes($challengeId: ID!, $tripId: ID!) {
  myVotes(input: {challengeId: $challengeId, tripId: $tripId}) {
    votes {
      ...ChallengeVoteFields
    }
    totalVotes
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export const useGetMyVotesQuery = <TData = GetMyVotesQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetMyVotesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyVotesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetMyVotesQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetMyVotesQuery, TError, TData>({
    queryKey: ["GetMyVotes", variables],
    queryFn: fetcher<GetMyVotesQuery, GetMyVotesQueryVariables>(
      client,
      GetMyVotesDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetMyVotesQuery.getKey = (variables: GetMyVotesQueryVariables) => [
  "GetMyVotes",
  variables,
];

export const GetVotingProgressDocument = `
    query GetVotingProgress($challengeId: ID!) {
  votingProgress(input: {challengeId: $challengeId}) {
    challengeId
    totalVotes
    submissionStats {
      submissionId
      voteCount
      voteScore
    }
  }
}
    `;

export const useGetVotingProgressQuery = <
  TData = GetVotingProgressQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetVotingProgressQueryVariables,
  options?: Omit<
    UseQueryOptions<GetVotingProgressQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetVotingProgressQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetVotingProgressQuery, TError, TData>({
    queryKey: ["GetVotingProgress", variables],
    queryFn: fetcher<GetVotingProgressQuery, GetVotingProgressQueryVariables>(
      client,
      GetVotingProgressDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetVotingProgressQuery.getKey = (
  variables: GetVotingProgressQueryVariables,
) => ["GetVotingProgress", variables];

export const GetJudgedStaffVotingProgressDocument = `
    query GetJudgedStaffVotingProgress($challengeId: ID!, $tripId: ID!, $adminParticipantIds: [ID!]!, $eligibleSubmissionsCount: Int!, $requiredPositions: Int!) {
  judgedStaffVotingProgress(
    input: {challengeId: $challengeId, tripId: $tripId, adminParticipantIds: $adminParticipantIds, eligibleSubmissionsCount: $eligibleSubmissionsCount, requiredPositions: $requiredPositions}
  ) {
    allAdminsVoted
    eligibleSubmissionsCount
    pendingAdmins
    requiredPositions
    totalAdmins
    votedAdmins
    adminProgress {
      participantId
      hasVotedAll
      votedPositions
    }
  }
}
    `;

export const useGetJudgedStaffVotingProgressQuery = <
  TData = GetJudgedStaffVotingProgressQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetJudgedStaffVotingProgressQueryVariables,
  options?: Omit<
    UseQueryOptions<GetJudgedStaffVotingProgressQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetJudgedStaffVotingProgressQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetJudgedStaffVotingProgressQuery, TError, TData>({
    queryKey: ["GetJudgedStaffVotingProgress", variables],
    queryFn: fetcher<
      GetJudgedStaffVotingProgressQuery,
      GetJudgedStaffVotingProgressQueryVariables
    >(client, GetJudgedStaffVotingProgressDocument, variables, headers),
    ...options,
  });
};

useGetJudgedStaffVotingProgressQuery.getKey = (
  variables: GetJudgedStaffVotingProgressQueryVariables,
) => ["GetJudgedStaffVotingProgress", variables];

export const CreateChallengeSubmissionDocument = `
    mutation CreateChallengeSubmission($input: CreateSubmissionInput!) {
  createChallengeSubmission(input: $input) {
    ...ChallengeSubmissionCreateResultFields
  }
}
    ${ChallengeSubmissionCreateResultFieldsFragmentDoc}`;

export const useCreateChallengeSubmissionMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateChallengeSubmissionMutation,
    TError,
    CreateChallengeSubmissionMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateChallengeSubmissionMutation,
    TError,
    CreateChallengeSubmissionMutationVariables,
    TContext
  >({
    mutationKey: ["CreateChallengeSubmission"],
    mutationFn: (variables?: CreateChallengeSubmissionMutationVariables) =>
      fetcher<
        CreateChallengeSubmissionMutation,
        CreateChallengeSubmissionMutationVariables
      >(client, CreateChallengeSubmissionDocument, variables, headers)(),
    ...options,
  });
};

export const UpdateChallengeSubmissionDocument = `
    mutation UpdateChallengeSubmission($input: UpdateSubmissionInput!) {
  updateChallengeSubmission(input: $input) {
    ...ChallengeSubmissionUpdateResultFields
  }
}
    ${ChallengeSubmissionUpdateResultFieldsFragmentDoc}`;

export const useUpdateChallengeSubmissionMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateChallengeSubmissionMutation,
    TError,
    UpdateChallengeSubmissionMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateChallengeSubmissionMutation,
    TError,
    UpdateChallengeSubmissionMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateChallengeSubmission"],
    mutationFn: (variables?: UpdateChallengeSubmissionMutationVariables) =>
      fetcher<
        UpdateChallengeSubmissionMutation,
        UpdateChallengeSubmissionMutationVariables
      >(client, UpdateChallengeSubmissionDocument, variables, headers)(),
    ...options,
  });
};

export const DeleteChallengeSubmissionDocument = `
    mutation DeleteChallengeSubmission($id: ID!) {
  deleteChallengeSubmission(submissionId: $id)
}
    `;

export const useDeleteChallengeSubmissionMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteChallengeSubmissionMutation,
    TError,
    DeleteChallengeSubmissionMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteChallengeSubmissionMutation,
    TError,
    DeleteChallengeSubmissionMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteChallengeSubmission"],
    mutationFn: (variables?: DeleteChallengeSubmissionMutationVariables) =>
      fetcher<
        DeleteChallengeSubmissionMutation,
        DeleteChallengeSubmissionMutationVariables
      >(client, DeleteChallengeSubmissionDocument, variables, headers)(),
    ...options,
  });
};

export const CreateChallengeActivityDocument = `
    mutation CreateChallengeActivity($input: CreateChallengeActivityInput!) {
  createChallengeActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export const useCreateChallengeActivityMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateChallengeActivityMutation,
    TError,
    CreateChallengeActivityMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateChallengeActivityMutation,
    TError,
    CreateChallengeActivityMutationVariables,
    TContext
  >({
    mutationKey: ["CreateChallengeActivity"],
    mutationFn: (variables?: CreateChallengeActivityMutationVariables) =>
      fetcher<
        CreateChallengeActivityMutation,
        CreateChallengeActivityMutationVariables
      >(client, CreateChallengeActivityDocument, variables, headers)(),
    ...options,
  });
};

export const SubmitVoteDocument = `
    mutation SubmitVote($input: SubmitVoteInput!) {
  submitVote(input: $input) {
    vote {
      ...ChallengeVoteFields
    }
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export const useSubmitVoteMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    SubmitVoteMutation,
    TError,
    SubmitVoteMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    SubmitVoteMutation,
    TError,
    SubmitVoteMutationVariables,
    TContext
  >({
    mutationKey: ["SubmitVote"],
    mutationFn: (variables?: SubmitVoteMutationVariables) =>
      fetcher<SubmitVoteMutation, SubmitVoteMutationVariables>(
        client,
        SubmitVoteDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const SubmitVotesDocument = `
    mutation SubmitVotes($input: SubmitVotesInput!) {
  submitVotes(input: $input) {
    votes {
      ...ChallengeVoteFields
    }
    totalVotesCast
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export const useSubmitVotesMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    SubmitVotesMutation,
    TError,
    SubmitVotesMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    SubmitVotesMutation,
    TError,
    SubmitVotesMutationVariables,
    TContext
  >({
    mutationKey: ["SubmitVotes"],
    mutationFn: (variables?: SubmitVotesMutationVariables) =>
      fetcher<SubmitVotesMutation, SubmitVotesMutationVariables>(
        client,
        SubmitVotesDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const ForceEndVotingDocument = `
    mutation ForceEndVoting($challengeId: ID!, $tripId: ID!) {
  forceEndVoting(input: {challengeId: $challengeId, tripId: $tripId}) {
    success
    finalized
    challengeId
    challengeStatus
    totalVotes
  }
}
    `;

export const useForceEndVotingMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    ForceEndVotingMutation,
    TError,
    ForceEndVotingMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    ForceEndVotingMutation,
    TError,
    ForceEndVotingMutationVariables,
    TContext
  >({
    mutationKey: ["ForceEndVoting"],
    mutationFn: (variables?: ForceEndVotingMutationVariables) =>
      fetcher<ForceEndVotingMutation, ForceEndVotingMutationVariables>(
        client,
        ForceEndVotingDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const GetCoinStatisticsDocument = `
    query GetCoinStatistics($tripId: ID!) {
  coinStatistics(input: {tripId: $tripId}) {
    ...CoinStatisticsFields
  }
}
    ${CoinStatisticsFieldsFragmentDoc}`;

export const useGetCoinStatisticsQuery = <
  TData = GetCoinStatisticsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetCoinStatisticsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCoinStatisticsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetCoinStatisticsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetCoinStatisticsQuery, TError, TData>({
    queryKey: ["GetCoinStatistics", variables],
    queryFn: fetcher<GetCoinStatisticsQuery, GetCoinStatisticsQueryVariables>(
      client,
      GetCoinStatisticsDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetCoinStatisticsQuery.getKey = (
  variables: GetCoinStatisticsQueryVariables,
) => ["GetCoinStatistics", variables];

export const GetCoinQuickStatsDocument = `
    query GetCoinQuickStats($tripId: ID!) {
  coinQuickStats(input: {tripId: $tripId}) {
    ...CoinQuickStatsFields
  }
}
    ${CoinQuickStatsFieldsFragmentDoc}`;

export const useGetCoinQuickStatsQuery = <
  TData = GetCoinQuickStatsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetCoinQuickStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCoinQuickStatsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetCoinQuickStatsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetCoinQuickStatsQuery, TError, TData>({
    queryKey: ["GetCoinQuickStats", variables],
    queryFn: fetcher<GetCoinQuickStatsQuery, GetCoinQuickStatsQueryVariables>(
      client,
      GetCoinQuickStatsDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetCoinQuickStatsQuery.getKey = (
  variables: GetCoinQuickStatsQueryVariables,
) => ["GetCoinQuickStats", variables];

export const GetCoinAdditionalInsightsDocument = `
    query GetCoinAdditionalInsights($tripId: ID!) {
  coinAdditionalInsights(input: {tripId: $tripId}) {
    ...CoinAdditionalInsightsFields
  }
}
    ${CoinAdditionalInsightsFieldsFragmentDoc}`;

export const useGetCoinAdditionalInsightsQuery = <
  TData = GetCoinAdditionalInsightsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetCoinAdditionalInsightsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCoinAdditionalInsightsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetCoinAdditionalInsightsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetCoinAdditionalInsightsQuery, TError, TData>({
    queryKey: ["GetCoinAdditionalInsights", variables],
    queryFn: fetcher<
      GetCoinAdditionalInsightsQuery,
      GetCoinAdditionalInsightsQueryVariables
    >(client, GetCoinAdditionalInsightsDocument, variables, headers),
    ...options,
  });
};

useGetCoinAdditionalInsightsQuery.getKey = (
  variables: GetCoinAdditionalInsightsQueryVariables,
) => ["GetCoinAdditionalInsights", variables];

export const GetCoinTransactionsDocument = `
    query GetCoinTransactions($tripId: ID!, $limit: Int, $offset: Int) {
  coinTransactions(
    input: {tripId: $tripId, pagination: {limit: $limit, offset: $offset}}
  ) {
    ...CoinTransactionsConnectionFields
  }
}
    ${CoinTransactionsConnectionFieldsFragmentDoc}`;

export const useGetCoinTransactionsQuery = <
  TData = GetCoinTransactionsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetCoinTransactionsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCoinTransactionsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetCoinTransactionsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetCoinTransactionsQuery, TError, TData>({
    queryKey: ["GetCoinTransactions", variables],
    queryFn: fetcher<
      GetCoinTransactionsQuery,
      GetCoinTransactionsQueryVariables
    >(client, GetCoinTransactionsDocument, variables, headers),
    ...options,
  });
};

useGetCoinTransactionsQuery.getKey = (
  variables: GetCoinTransactionsQueryVariables,
) => ["GetCoinTransactions", variables];

export const GetMyCoinTransactionsDocument = `
    query GetMyCoinTransactions($tripId: ID!, $groupId: ID, $limit: Int) {
  myCoinTransactions(input: {tripId: $tripId, groupId: $groupId, limit: $limit}) {
    ...CoinTransactionFields
  }
}
    ${CoinTransactionFieldsFragmentDoc}`;

export const useGetMyCoinTransactionsQuery = <
  TData = GetMyCoinTransactionsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetMyCoinTransactionsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyCoinTransactionsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetMyCoinTransactionsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetMyCoinTransactionsQuery, TError, TData>({
    queryKey: ["GetMyCoinTransactions", variables],
    queryFn: fetcher<
      GetMyCoinTransactionsQuery,
      GetMyCoinTransactionsQueryVariables
    >(client, GetMyCoinTransactionsDocument, variables, headers),
    ...options,
  });
};

useGetMyCoinTransactionsQuery.getKey = (
  variables: GetMyCoinTransactionsQueryVariables,
) => ["GetMyCoinTransactions", variables];

export const AddCoinsDocument = `
    mutation AddCoins($input: AddCoinsInput!) {
  addCoins(input: $input) {
    ...CoinTransactionResultFields
  }
}
    ${CoinTransactionResultFieldsFragmentDoc}`;

export const useAddCoinsMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    AddCoinsMutation,
    TError,
    AddCoinsMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    AddCoinsMutation,
    TError,
    AddCoinsMutationVariables,
    TContext
  >({
    mutationKey: ["AddCoins"],
    mutationFn: (variables?: AddCoinsMutationVariables) =>
      fetcher<AddCoinsMutation, AddCoinsMutationVariables>(
        client,
        AddCoinsDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const RemoveCoinsDocument = `
    mutation RemoveCoins($input: RemoveCoinsInput!) {
  removeCoins(input: $input) {
    ...CoinTransactionResultFields
  }
}
    ${CoinTransactionResultFieldsFragmentDoc}`;

export const useRemoveCoinsMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    RemoveCoinsMutation,
    TError,
    RemoveCoinsMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    RemoveCoinsMutation,
    TError,
    RemoveCoinsMutationVariables,
    TContext
  >({
    mutationKey: ["RemoveCoins"],
    mutationFn: (variables?: RemoveCoinsMutationVariables) =>
      fetcher<RemoveCoinsMutation, RemoveCoinsMutationVariables>(
        client,
        RemoveCoinsDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const GetGroupDocument = `
    query GetGroup($id: ID!) {
  group(id: $id) {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useGetGroupQuery = <TData = GetGroupQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetGroupQueryVariables,
  options?: Omit<UseQueryOptions<GetGroupQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetGroupQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupQuery, TError, TData>({
    queryKey: ["GetGroup", variables],
    queryFn: fetcher<GetGroupQuery, GetGroupQueryVariables>(
      client,
      GetGroupDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetGroupQuery.getKey = (variables: GetGroupQueryVariables) => [
  "GetGroup",
  variables,
];

export const GetGroupByCodeDocument = `
    query GetGroupByCode($code: String!) {
  groupByCode(code: $code) {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useGetGroupByCodeQuery = <
  TData = GetGroupByCodeQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetGroupByCodeQueryVariables,
  options?: Omit<
    UseQueryOptions<GetGroupByCodeQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetGroupByCodeQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupByCodeQuery, TError, TData>({
    queryKey: ["GetGroupByCode", variables],
    queryFn: fetcher<GetGroupByCodeQuery, GetGroupByCodeQueryVariables>(
      client,
      GetGroupByCodeDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetGroupByCodeQuery.getKey = (variables: GetGroupByCodeQueryVariables) => [
  "GetGroupByCode",
  variables,
];

export const GetGroupsDocument = `
    query GetGroups($pagination: GroupPaginationInput) {
  groups(pagination: $pagination) {
    groups {
      ...GroupFields
    }
    pagination {
      total
      hasMore
      limit
      offset
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useGetGroupsQuery = <TData = GetGroupsQuery, TError = unknown>(
  client: GraphQLClient,
  variables?: GetGroupsQueryVariables,
  options?: Omit<UseQueryOptions<GetGroupsQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetGroupsQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupsQuery, TError, TData>({
    queryKey:
      variables === undefined ? ["GetGroups"] : ["GetGroups", variables],
    queryFn: fetcher<GetGroupsQuery, GetGroupsQueryVariables>(
      client,
      GetGroupsDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetGroupsQuery.getKey = (variables?: GetGroupsQueryVariables) =>
  variables === undefined ? ["GetGroups"] : ["GetGroups", variables];

export const GetGroupsByTripDocument = `
    query GetGroupsByTrip($tripId: ID!, $pagination: GroupPaginationInput) {
  groupsByTrip(tripId: $tripId, pagination: $pagination) {
    groups {
      ...GroupFields
    }
    pagination {
      total
      hasMore
      limit
      offset
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useGetGroupsByTripQuery = <
  TData = GetGroupsByTripQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetGroupsByTripQueryVariables,
  options?: Omit<
    UseQueryOptions<GetGroupsByTripQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetGroupsByTripQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupsByTripQuery, TError, TData>({
    queryKey: ["GetGroupsByTrip", variables],
    queryFn: fetcher<GetGroupsByTripQuery, GetGroupsByTripQueryVariables>(
      client,
      GetGroupsByTripDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetGroupsByTripQuery.getKey = (variables: GetGroupsByTripQueryVariables) => [
  "GetGroupsByTrip",
  variables,
];

export const GetGroupsByOrganizerDocument = `
    query GetGroupsByOrganizer($organizerId: ID!) {
  groupsByOrganizer(organizerId: $organizerId) {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useGetGroupsByOrganizerQuery = <
  TData = GetGroupsByOrganizerQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetGroupsByOrganizerQueryVariables,
  options?: Omit<
    UseQueryOptions<GetGroupsByOrganizerQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetGroupsByOrganizerQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupsByOrganizerQuery, TError, TData>({
    queryKey: ["GetGroupsByOrganizer", variables],
    queryFn: fetcher<
      GetGroupsByOrganizerQuery,
      GetGroupsByOrganizerQueryVariables
    >(client, GetGroupsByOrganizerDocument, variables, headers),
    ...options,
  });
};

useGetGroupsByOrganizerQuery.getKey = (
  variables: GetGroupsByOrganizerQueryVariables,
) => ["GetGroupsByOrganizer", variables];

export const GetGroupNamesByTripDocument = `
    query GetGroupNamesByTrip($tripId: ID!) {
  groupNamesByTrip(tripId: $tripId) {
    ...GroupSummaryFields
  }
}
    ${GroupSummaryFieldsFragmentDoc}`;

export const useGetGroupNamesByTripQuery = <
  TData = GetGroupNamesByTripQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetGroupNamesByTripQueryVariables,
  options?: Omit<
    UseQueryOptions<GetGroupNamesByTripQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetGroupNamesByTripQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupNamesByTripQuery, TError, TData>({
    queryKey: ["GetGroupNamesByTrip", variables],
    queryFn: fetcher<
      GetGroupNamesByTripQuery,
      GetGroupNamesByTripQueryVariables
    >(client, GetGroupNamesByTripDocument, variables, headers),
    ...options,
  });
};

useGetGroupNamesByTripQuery.getKey = (
  variables: GetGroupNamesByTripQueryVariables,
) => ["GetGroupNamesByTrip", variables];

export const GetGroupRankingDocument = `
    query GetGroupRanking($tripId: ID!) {
  groupRanking(tripId: $tripId) {
    currentDate
    data {
      ...GroupRankingFields
    }
  }
}
    ${GroupRankingFieldsFragmentDoc}`;

export const useGetGroupRankingQuery = <
  TData = GetGroupRankingQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetGroupRankingQueryVariables,
  options?: Omit<
    UseQueryOptions<GetGroupRankingQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetGroupRankingQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetGroupRankingQuery, TError, TData>({
    queryKey: ["GetGroupRanking", variables],
    queryFn: fetcher<GetGroupRankingQuery, GetGroupRankingQueryVariables>(
      client,
      GetGroupRankingDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetGroupRankingQuery.getKey = (variables: GetGroupRankingQueryVariables) => [
  "GetGroupRanking",
  variables,
];

export const CreateGroupDocument = `
    mutation CreateGroup($input: CreateGroupInput!) {
  createGroup(input: $input) {
    group {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useCreateGroupMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateGroupMutation,
    TError,
    CreateGroupMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateGroupMutation,
    TError,
    CreateGroupMutationVariables,
    TContext
  >({
    mutationKey: ["CreateGroup"],
    mutationFn: (variables?: CreateGroupMutationVariables) =>
      fetcher<CreateGroupMutation, CreateGroupMutationVariables>(
        client,
        CreateGroupDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateGroupDocument = `
    mutation UpdateGroup($input: UpdateGroupInput!) {
  updateGroup(input: $input) {
    group {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export const useUpdateGroupMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateGroupMutation,
    TError,
    UpdateGroupMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateGroupMutation,
    TError,
    UpdateGroupMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateGroup"],
    mutationFn: (variables?: UpdateGroupMutationVariables) =>
      fetcher<UpdateGroupMutation, UpdateGroupMutationVariables>(
        client,
        UpdateGroupDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const DeleteGroupDocument = `
    mutation DeleteGroup($id: ID!) {
  deleteGroup(id: $id) {
    success
  }
}
    `;

export const useDeleteGroupMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteGroupMutation,
    TError,
    DeleteGroupMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteGroupMutation,
    TError,
    DeleteGroupMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteGroup"],
    mutationFn: (variables?: DeleteGroupMutationVariables) =>
      fetcher<DeleteGroupMutation, DeleteGroupMutationVariables>(
        client,
        DeleteGroupDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const AddUserToSharingDocument = `
    mutation AddUserToSharing($groupId: ID!, $userId: ID!) {
  addUserToSharing(input: {userId: $userId}) {
    location {
      id
      isSharingLocation
      usersToShareWith {
        id
        firstName
        lastName
      }
    }
  }
}
    `;

export const useAddUserToSharingMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    AddUserToSharingMutation,
    TError,
    AddUserToSharingMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    AddUserToSharingMutation,
    TError,
    AddUserToSharingMutationVariables,
    TContext
  >({
    mutationKey: ["AddUserToSharing"],
    mutationFn: (variables?: AddUserToSharingMutationVariables) =>
      fetcher<AddUserToSharingMutation, AddUserToSharingMutationVariables>(
        client,
        AddUserToSharingDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const RemoveUserFromSharingDocument = `
    mutation RemoveUserFromSharing($groupId: ID!, $userId: ID!) {
  removeUserFromSharing(input: {userId: $userId}) {
    location {
      id
      isSharingLocation
      usersToShareWith {
        id
        firstName
        lastName
      }
    }
  }
}
    `;

export const useRemoveUserFromSharingMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    RemoveUserFromSharingMutation,
    TError,
    RemoveUserFromSharingMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    RemoveUserFromSharingMutation,
    TError,
    RemoveUserFromSharingMutationVariables,
    TContext
  >({
    mutationKey: ["RemoveUserFromSharing"],
    mutationFn: (variables?: RemoveUserFromSharingMutationVariables) =>
      fetcher<
        RemoveUserFromSharingMutation,
        RemoveUserFromSharingMutationVariables
      >(client, RemoveUserFromSharingDocument, variables, headers)(),
    ...options,
  });
};

export const UpdateSharingSettingsDocument = `
    mutation UpdateSharingSettings($input: UpdateSharingSettingsInput!) {
  updateSharingSettings(input: $input) {
    settings {
      isSharingLocation
      usersToShareWith {
        id
        firstName
        lastName
      }
    }
  }
}
    `;

export const useUpdateSharingSettingsMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateSharingSettingsMutation,
    TError,
    UpdateSharingSettingsMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateSharingSettingsMutation,
    TError,
    UpdateSharingSettingsMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateSharingSettings"],
    mutationFn: (variables?: UpdateSharingSettingsMutationVariables) =>
      fetcher<
        UpdateSharingSettingsMutation,
        UpdateSharingSettingsMutationVariables
      >(client, UpdateSharingSettingsDocument, variables, headers)(),
    ...options,
  });
};

export const GetNotificationDocument = `
    """
Get a single notification by ID (admin only).
Requires: ID of notification to fetch.
Returns: Full notification details.
"""
query GetNotification($id: ID!) {
  notification(id: $id) {
    ...NotificationFields
  }
}
    ${NotificationFieldsFragmentDoc}`;

export const useGetNotificationQuery = <
  TData = GetNotificationQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetNotificationQueryVariables,
  options?: Omit<
    UseQueryOptions<GetNotificationQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetNotificationQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetNotificationQuery, TError, TData>({
    queryKey: ["GetNotification", variables],
    queryFn: fetcher<GetNotificationQuery, GetNotificationQueryVariables>(
      client,
      GetNotificationDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetNotificationQuery.getKey = (variables: GetNotificationQueryVariables) => [
  "GetNotification",
  variables,
];

export const GetMyNotificationsDocument = `
    """
Get current user's notifications with pagination.
Optional: page number and items per page.
Returns: Paginated list of user's notifications.
"""
query GetMyNotifications($page: Int, $perPage: Int) {
  myNotifications(input: {page: $page, pageSize: $perPage}) {
    ...MyNotificationsResultFields
  }
}
    ${MyNotificationsResultFieldsFragmentDoc}`;

export const useGetMyNotificationsQuery = <
  TData = GetMyNotificationsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetMyNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetMyNotificationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetMyNotificationsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetMyNotificationsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetMyNotifications"]
        : ["GetMyNotifications", variables],
    queryFn: fetcher<GetMyNotificationsQuery, GetMyNotificationsQueryVariables>(
      client,
      GetMyNotificationsDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetMyNotificationsQuery.getKey = (
  variables?: GetMyNotificationsQueryVariables,
) =>
  variables === undefined
    ? ["GetMyNotifications"]
    : ["GetMyNotifications", variables];

export const GetAllNotificationsDocument = `
    """
Get all notifications with pagination (admin only).
Optional: limit, offset for pagination, tripId for filtering.
Returns: Paginated list of all notifications.
"""
query GetAllNotifications($limit: Int, $offset: Int, $tripId: ID) {
  allNotifications(
    input: {pagination: {limit: $limit, offset: $offset}, tripId: $tripId}
  ) {
    ...AllNotificationsResultFields
  }
}
    ${AllNotificationsResultFieldsFragmentDoc}`;

export const useGetAllNotificationsQuery = <
  TData = GetAllNotificationsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetAllNotificationsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetAllNotificationsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetAllNotificationsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetAllNotificationsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetAllNotifications"]
        : ["GetAllNotifications", variables],
    queryFn: fetcher<
      GetAllNotificationsQuery,
      GetAllNotificationsQueryVariables
    >(client, GetAllNotificationsDocument, variables, headers),
    ...options,
  });
};

useGetAllNotificationsQuery.getKey = (
  variables?: GetAllNotificationsQueryVariables,
) =>
  variables === undefined
    ? ["GetAllNotifications"]
    : ["GetAllNotifications", variables];

export const GetNotificationSchedulesDocument = `
    """
Get notification schedules with filtering (moderator+).
Optional: tripId to filter by trip, various filter options.
Returns: Paginated list of notification schedules.
"""
query GetNotificationSchedules($tripId: ID, $limit: Int, $offset: Int, $isActive: Boolean, $notificationType: NotificationScheduleType, $search: String, $startDateFrom: DateTime, $startDateTo: DateTime) {
  notificationSchedules(
    filter: {tripId: $tripId, isActive: $isActive, notificationType: $notificationType, search: $search, startDateFrom: $startDateFrom, startDateTo: $startDateTo}
    pagination: {limit: $limit, offset: $offset}
  ) {
    ...NotificationSchedulesConnectionFields
  }
}
    ${NotificationSchedulesConnectionFieldsFragmentDoc}`;

export const useGetNotificationSchedulesQuery = <
  TData = GetNotificationSchedulesQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetNotificationSchedulesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetNotificationSchedulesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetNotificationSchedulesQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetNotificationSchedulesQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetNotificationSchedules"]
        : ["GetNotificationSchedules", variables],
    queryFn: fetcher<
      GetNotificationSchedulesQuery,
      GetNotificationSchedulesQueryVariables
    >(client, GetNotificationSchedulesDocument, variables, headers),
    ...options,
  });
};

useGetNotificationSchedulesQuery.getKey = (
  variables?: GetNotificationSchedulesQueryVariables,
) =>
  variables === undefined
    ? ["GetNotificationSchedules"]
    : ["GetNotificationSchedules", variables];

export const GetNotificationScheduleDocument = `
    """
Get a single notification schedule by ID (moderator+).
Requires: ID of schedule to fetch.
Returns: Full schedule details.
"""
query GetNotificationSchedule($id: ID!) {
  notificationSchedule(id: $id) {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;

export const useGetNotificationScheduleQuery = <
  TData = GetNotificationScheduleQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetNotificationScheduleQueryVariables,
  options?: Omit<
    UseQueryOptions<GetNotificationScheduleQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetNotificationScheduleQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetNotificationScheduleQuery, TError, TData>({
    queryKey: ["GetNotificationSchedule", variables],
    queryFn: fetcher<
      GetNotificationScheduleQuery,
      GetNotificationScheduleQueryVariables
    >(client, GetNotificationScheduleDocument, variables, headers),
    ...options,
  });
};

useGetNotificationScheduleQuery.getKey = (
  variables: GetNotificationScheduleQueryVariables,
) => ["GetNotificationSchedule", variables];

export const GetActiveNotificationSchedulesDocument = `
    """
Get currently active notification schedules (moderator+).
Optional: tripId and notificationType for filtering.
Returns: List of schedules currently within their active window.
"""
query GetActiveNotificationSchedules($tripId: ID, $notificationType: NotificationScheduleType) {
  activeNotificationSchedules(
    tripId: $tripId
    notificationType: $notificationType
  ) {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;

export const useGetActiveNotificationSchedulesQuery = <
  TData = GetActiveNotificationSchedulesQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetActiveNotificationSchedulesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetActiveNotificationSchedulesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetActiveNotificationSchedulesQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetActiveNotificationSchedulesQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetActiveNotificationSchedules"]
        : ["GetActiveNotificationSchedules", variables],
    queryFn: fetcher<
      GetActiveNotificationSchedulesQuery,
      GetActiveNotificationSchedulesQueryVariables
    >(client, GetActiveNotificationSchedulesDocument, variables, headers),
    ...options,
  });
};

useGetActiveNotificationSchedulesQuery.getKey = (
  variables?: GetActiveNotificationSchedulesQueryVariables,
) =>
  variables === undefined
    ? ["GetActiveNotificationSchedules"]
    : ["GetActiveNotificationSchedules", variables];

export const GetUpcomingNotificationSchedulesDocument = `
    """
Get upcoming notification schedules within a time window (moderator+).
Requires: time window in minutes (default 30).
Optional: tripId for filtering.
Returns: List of schedules that will run soon.
"""
query GetUpcomingNotificationSchedules($withinMinutes: Int = 30, $tripId: ID) {
  upcomingNotificationSchedules(withinMinutes: $withinMinutes) {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;

export const useGetUpcomingNotificationSchedulesQuery = <
  TData = GetUpcomingNotificationSchedulesQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetUpcomingNotificationSchedulesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetUpcomingNotificationSchedulesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetUpcomingNotificationSchedulesQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetUpcomingNotificationSchedulesQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetUpcomingNotificationSchedules"]
        : ["GetUpcomingNotificationSchedules", variables],
    queryFn: fetcher<
      GetUpcomingNotificationSchedulesQuery,
      GetUpcomingNotificationSchedulesQueryVariables
    >(client, GetUpcomingNotificationSchedulesDocument, variables, headers),
    ...options,
  });
};

useGetUpcomingNotificationSchedulesQuery.getKey = (
  variables?: GetUpcomingNotificationSchedulesQueryVariables,
) =>
  variables === undefined
    ? ["GetUpcomingNotificationSchedules"]
    : ["GetUpcomingNotificationSchedules", variables];

export const GetNotificationScheduleExecutionHistoryDocument = `
    """
Get execution history for a notification schedule (moderator+).
Requires: ID of the schedule.
Optional: pagination parameters.
Returns: List of execution history entries.
"""
query GetNotificationScheduleExecutionHistory($scheduleId: ID!, $limit: Int, $offset: Int) {
  notificationScheduleExecutionHistory(
    scheduleId: $scheduleId
    pagination: {limit: $limit, offset: $offset}
  ) {
    ...ExecutionHistoryResultFields
  }
}
    ${ExecutionHistoryResultFieldsFragmentDoc}`;

export const useGetNotificationScheduleExecutionHistoryQuery = <
  TData = GetNotificationScheduleExecutionHistoryQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetNotificationScheduleExecutionHistoryQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetNotificationScheduleExecutionHistoryQuery,
      TError,
      TData
    >,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetNotificationScheduleExecutionHistoryQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetNotificationScheduleExecutionHistoryQuery, TError, TData>({
    queryKey: ["GetNotificationScheduleExecutionHistory", variables],
    queryFn: fetcher<
      GetNotificationScheduleExecutionHistoryQuery,
      GetNotificationScheduleExecutionHistoryQueryVariables
    >(
      client,
      GetNotificationScheduleExecutionHistoryDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetNotificationScheduleExecutionHistoryQuery.getKey = (
  variables: GetNotificationScheduleExecutionHistoryQueryVariables,
) => ["GetNotificationScheduleExecutionHistory", variables];

export const GetNotificationDeliveriesDocument = `
    """
Get notification deliveries with optional filters (moderator+).
Optional: notificationId, scheduleId, tripId, status, date range, pagination.
Returns: Paginated list of delivery records.
"""
query GetNotificationDeliveries($scheduleId: ID, $tripId: ID, $status: DeliveryStatus, $startDate: DateTime, $endDate: DateTime, $limit: Int, $offset: Int) {
  notificationDeliveries(
    input: {scheduleId: $scheduleId, tripId: $tripId, status: $status, startDate: $startDate, endDate: $endDate, limit: $limit, offset: $offset}
  ) {
    ...NotificationDeliveryListResultFields
  }
}
    ${NotificationDeliveryListResultFieldsFragmentDoc}`;

export const useGetNotificationDeliveriesQuery = <
  TData = GetNotificationDeliveriesQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetNotificationDeliveriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetNotificationDeliveriesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetNotificationDeliveriesQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetNotificationDeliveriesQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetNotificationDeliveries"]
        : ["GetNotificationDeliveries", variables],
    queryFn: fetcher<
      GetNotificationDeliveriesQuery,
      GetNotificationDeliveriesQueryVariables
    >(client, GetNotificationDeliveriesDocument, variables, headers),
    ...options,
  });
};

useGetNotificationDeliveriesQuery.getKey = (
  variables?: GetNotificationDeliveriesQueryVariables,
) =>
  variables === undefined
    ? ["GetNotificationDeliveries"]
    : ["GetNotificationDeliveries", variables];

export const GetNotificationDeliveryByNotificationIdDocument = `
    """
Get a notification delivery by notification ID (moderator+).
Requires: notificationId and tripId.
Returns: Delivery record for the specified notification.
"""
query GetNotificationDeliveryByNotificationId($notificationId: ID!, $tripId: ID!) {
  notificationDeliveryByNotificationId(
    input: {notificationId: $notificationId, tripId: $tripId}
  ) {
    ...NotificationDeliveryFields
  }
}
    ${NotificationDeliveryFieldsFragmentDoc}`;

export const useGetNotificationDeliveryByNotificationIdQuery = <
  TData = GetNotificationDeliveryByNotificationIdQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetNotificationDeliveryByNotificationIdQueryVariables,
  options?: Omit<
    UseQueryOptions<
      GetNotificationDeliveryByNotificationIdQuery,
      TError,
      TData
    >,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetNotificationDeliveryByNotificationIdQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetNotificationDeliveryByNotificationIdQuery, TError, TData>({
    queryKey: ["GetNotificationDeliveryByNotificationId", variables],
    queryFn: fetcher<
      GetNotificationDeliveryByNotificationIdQuery,
      GetNotificationDeliveryByNotificationIdQueryVariables
    >(
      client,
      GetNotificationDeliveryByNotificationIdDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetNotificationDeliveryByNotificationIdQuery.getKey = (
  variables: GetNotificationDeliveryByNotificationIdQueryVariables,
) => ["GetNotificationDeliveryByNotificationId", variables];

export const GetFailedDeliveriesDocument = `
    """
Get failed notification deliveries (moderator+).
Optional: tripId for filtering, limit and offset for pagination.
Returns: Paginated list of failed deliveries.
"""
query GetFailedDeliveries($tripId: ID, $limit: Int, $offset: Int) {
  failedDeliveries(input: {tripId: $tripId, limit: $limit, offset: $offset}) {
    ...NotificationDeliveryListResultFields
  }
}
    ${NotificationDeliveryListResultFieldsFragmentDoc}`;

export const useGetFailedDeliveriesQuery = <
  TData = GetFailedDeliveriesQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetFailedDeliveriesQueryVariables,
  options?: Omit<
    UseQueryOptions<GetFailedDeliveriesQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetFailedDeliveriesQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetFailedDeliveriesQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetFailedDeliveries"]
        : ["GetFailedDeliveries", variables],
    queryFn: fetcher<
      GetFailedDeliveriesQuery,
      GetFailedDeliveriesQueryVariables
    >(client, GetFailedDeliveriesDocument, variables, headers),
    ...options,
  });
};

useGetFailedDeliveriesQuery.getKey = (
  variables?: GetFailedDeliveriesQueryVariables,
) =>
  variables === undefined
    ? ["GetFailedDeliveries"]
    : ["GetFailedDeliveries", variables];

export const GetDeliveryStatsDocument = `
    """
Get delivery statistics (moderator+).
Optional: tripId, scheduleId, date range filters.
Returns: Comprehensive delivery statistics.
"""
query GetDeliveryStats($tripId: ID, $scheduleId: ID, $startDate: DateTime, $endDate: DateTime) {
  deliveryStats(
    input: {tripId: $tripId, scheduleId: $scheduleId, startDate: $startDate, endDate: $endDate}
  ) {
    ...DeliveryStatsFields
  }
}
    ${DeliveryStatsFieldsFragmentDoc}`;

export const useGetDeliveryStatsQuery = <
  TData = GetDeliveryStatsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetDeliveryStatsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetDeliveryStatsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetDeliveryStatsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetDeliveryStatsQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetDeliveryStats"]
        : ["GetDeliveryStats", variables],
    queryFn: fetcher<GetDeliveryStatsQuery, GetDeliveryStatsQueryVariables>(
      client,
      GetDeliveryStatsDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetDeliveryStatsQuery.getKey = (
  variables?: GetDeliveryStatsQueryVariables,
) =>
  variables === undefined
    ? ["GetDeliveryStats"]
    : ["GetDeliveryStats", variables];

export const CreateNotificationDocument = `
    """
Create a new notification (moderator only).
Requires: title, body. Optional: priority, tripId, url.
Returns: The created notification.
"""
mutation CreateNotification($title: String!, $body: String!, $priority: NotificationPriority, $tripId: ID, $url: String) {
  createNotification(
    input: {title: $title, body: $body, priority: $priority, tripId: $tripId, url: $url}
  ) {
    ...CreateNotificationResultFields
  }
}
    ${CreateNotificationResultFieldsFragmentDoc}`;

export const useCreateNotificationMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateNotificationMutation,
    TError,
    CreateNotificationMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateNotificationMutation,
    TError,
    CreateNotificationMutationVariables,
    TContext
  >({
    mutationKey: ["CreateNotification"],
    mutationFn: (variables?: CreateNotificationMutationVariables) =>
      fetcher<CreateNotificationMutation, CreateNotificationMutationVariables>(
        client,
        CreateNotificationDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateNotificationDocument = `
    """
Update an existing notification (admin only).
Requires: notificationId. Optional: title, body, priority, url.
Returns: The updated notification.
"""
mutation UpdateNotification($notificationId: ID!, $title: String, $body: String, $priority: NotificationPriority, $url: String) {
  updateNotification(
    input: {notificationId: $notificationId, title: $title, body: $body, priority: $priority, url: $url}
  ) {
    ...UpdateNotificationResultFields
  }
}
    ${UpdateNotificationResultFieldsFragmentDoc}`;

export const useUpdateNotificationMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateNotificationMutation,
    TError,
    UpdateNotificationMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateNotificationMutation,
    TError,
    UpdateNotificationMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateNotification"],
    mutationFn: (variables?: UpdateNotificationMutationVariables) =>
      fetcher<UpdateNotificationMutation, UpdateNotificationMutationVariables>(
        client,
        UpdateNotificationDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const DeleteNotificationDocument = `
    """
Delete a notification (admin only).
Requires: notificationId.
Returns: Success status.
"""
mutation DeleteNotification($notificationId: ID!) {
  deleteNotification(input: {notificationId: $notificationId}) {
    ...DeleteNotificationResultFields
  }
}
    ${DeleteNotificationResultFieldsFragmentDoc}`;

export const useDeleteNotificationMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteNotificationMutation,
    TError,
    DeleteNotificationMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteNotificationMutation,
    TError,
    DeleteNotificationMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteNotification"],
    mutationFn: (variables?: DeleteNotificationMutationVariables) =>
      fetcher<DeleteNotificationMutation, DeleteNotificationMutationVariables>(
        client,
        DeleteNotificationDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const CreateNotificationScheduleDocument = `
    """
Create a new notification schedule (admin only).
Requires: name, hour, minute, startDate, endDate, notificationType.
Optional: isActive, notificationTitle, notificationBody, notificationUrl, tripId.
Returns: The created schedule.
"""
mutation CreateNotificationSchedule($name: String!, $hour: Int!, $minute: Int!, $startDate: DateTime!, $endDate: DateTime!, $notificationType: NotificationScheduleType!, $isActive: Boolean, $notificationTitle: String, $notificationBody: String, $notificationUrl: String, $tripId: ID) {
  createNotificationSchedule(
    input: {name: $name, hour: $hour, minute: $minute, startDate: $startDate, endDate: $endDate, notificationType: $notificationType, isActive: $isActive, notificationTitle: $notificationTitle, notificationBody: $notificationBody, notificationUrl: $notificationUrl, tripId: $tripId}
  ) {
    ...CreateNotificationSchedulePayloadFields
  }
}
    ${CreateNotificationSchedulePayloadFieldsFragmentDoc}`;

export const useCreateNotificationScheduleMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateNotificationScheduleMutation,
    TError,
    CreateNotificationScheduleMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateNotificationScheduleMutation,
    TError,
    CreateNotificationScheduleMutationVariables,
    TContext
  >({
    mutationKey: ["CreateNotificationSchedule"],
    mutationFn: (variables?: CreateNotificationScheduleMutationVariables) =>
      fetcher<
        CreateNotificationScheduleMutation,
        CreateNotificationScheduleMutationVariables
      >(client, CreateNotificationScheduleDocument, variables, headers)(),
    ...options,
  });
};

export const UpdateNotificationScheduleDocument = `
    """
Update an existing notification schedule (admin only).
Requires: id. Optional: name, hour, minute, startDate, endDate,
notificationType, isActive, notificationTitle, notificationBody, notificationUrl.
Returns: The updated schedule.
"""
mutation UpdateNotificationSchedule($id: ID!, $name: String, $hour: Int, $minute: Int, $startDate: DateTime, $endDate: DateTime, $isActive: Boolean, $notificationTitle: String, $notificationBody: String, $notificationUrl: String) {
  updateNotificationSchedule(
    input: {id: $id, name: $name, hour: $hour, minute: $minute, startDate: $startDate, endDate: $endDate, isActive: $isActive, notificationTitle: $notificationTitle, notificationBody: $notificationBody, notificationUrl: $notificationUrl}
  ) {
    ...UpdateNotificationSchedulePayloadFields
  }
}
    ${UpdateNotificationSchedulePayloadFieldsFragmentDoc}`;

export const useUpdateNotificationScheduleMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateNotificationScheduleMutation,
    TError,
    UpdateNotificationScheduleMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateNotificationScheduleMutation,
    TError,
    UpdateNotificationScheduleMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateNotificationSchedule"],
    mutationFn: (variables?: UpdateNotificationScheduleMutationVariables) =>
      fetcher<
        UpdateNotificationScheduleMutation,
        UpdateNotificationScheduleMutationVariables
      >(client, UpdateNotificationScheduleDocument, variables, headers)(),
    ...options,
  });
};

export const DeleteNotificationScheduleDocument = `
    """
Delete a notification schedule (admin only).
Requires: id.
Returns: Success status and deletion count.
"""
mutation DeleteNotificationSchedule($id: ID!) {
  deleteNotificationSchedule(id: $id) {
    ...DeleteNotificationSchedulePayloadFields
  }
}
    ${DeleteNotificationSchedulePayloadFieldsFragmentDoc}`;

export const useDeleteNotificationScheduleMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteNotificationScheduleMutation,
    TError,
    DeleteNotificationScheduleMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteNotificationScheduleMutation,
    TError,
    DeleteNotificationScheduleMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteNotificationSchedule"],
    mutationFn: (variables?: DeleteNotificationScheduleMutationVariables) =>
      fetcher<
        DeleteNotificationScheduleMutation,
        DeleteNotificationScheduleMutationVariables
      >(client, DeleteNotificationScheduleDocument, variables, headers)(),
    ...options,
  });
};

export const DuplicateNotificationScheduleDocument = `
    """
Duplicate a notification schedule (admin only).
Requires: id of schedule to duplicate.
Returns: The duplicated schedule.
"""
mutation DuplicateNotificationSchedule($id: ID!) {
  duplicateNotificationSchedule(id: $id) {
    ...DuplicateNotificationSchedulePayloadFields
  }
}
    ${DuplicateNotificationSchedulePayloadFieldsFragmentDoc}`;

export const useDuplicateNotificationScheduleMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DuplicateNotificationScheduleMutation,
    TError,
    DuplicateNotificationScheduleMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DuplicateNotificationScheduleMutation,
    TError,
    DuplicateNotificationScheduleMutationVariables,
    TContext
  >({
    mutationKey: ["DuplicateNotificationSchedule"],
    mutationFn: (variables?: DuplicateNotificationScheduleMutationVariables) =>
      fetcher<
        DuplicateNotificationScheduleMutation,
        DuplicateNotificationScheduleMutationVariables
      >(client, DuplicateNotificationScheduleDocument, variables, headers)(),
    ...options,
  });
};

export const ToggleNotificationScheduleActiveDocument = `
    """
Toggle the active status of a notification schedule (admin only).
Requires: id of schedule to toggle.
Returns: Schedule with updated active status.
"""
mutation ToggleNotificationScheduleActive($id: ID!) {
  toggleNotificationScheduleActive(id: $id) {
    ...ToggleScheduleActivePayloadFields
  }
}
    ${ToggleScheduleActivePayloadFieldsFragmentDoc}`;

export const useToggleNotificationScheduleActiveMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    ToggleNotificationScheduleActiveMutation,
    TError,
    ToggleNotificationScheduleActiveMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    ToggleNotificationScheduleActiveMutation,
    TError,
    ToggleNotificationScheduleActiveMutationVariables,
    TContext
  >({
    mutationKey: ["ToggleNotificationScheduleActive"],
    mutationFn: (
      variables?: ToggleNotificationScheduleActiveMutationVariables,
    ) =>
      fetcher<
        ToggleNotificationScheduleActiveMutation,
        ToggleNotificationScheduleActiveMutationVariables
      >(client, ToggleNotificationScheduleActiveDocument, variables, headers)(),
    ...options,
  });
};

export const BulkToggleNotificationScheduleActiveDocument = `
    """
Bulk toggle active status of multiple notification schedules (admin only).
Requires: ids of schedules, isActive target status.
Returns: Success status and count updated.
"""
mutation BulkToggleNotificationScheduleActive($ids: [ID!]!, $isActive: Boolean!) {
  bulkToggleNotificationScheduleActive(ids: $ids, isActive: $isActive) {
    ...BulkToggleActivePayloadFields
  }
}
    ${BulkToggleActivePayloadFieldsFragmentDoc}`;

export const useBulkToggleNotificationScheduleActiveMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    BulkToggleNotificationScheduleActiveMutation,
    TError,
    BulkToggleNotificationScheduleActiveMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    BulkToggleNotificationScheduleActiveMutation,
    TError,
    BulkToggleNotificationScheduleActiveMutationVariables,
    TContext
  >({
    mutationKey: ["BulkToggleNotificationScheduleActive"],
    mutationFn: (
      variables?: BulkToggleNotificationScheduleActiveMutationVariables,
    ) =>
      fetcher<
        BulkToggleNotificationScheduleActiveMutation,
        BulkToggleNotificationScheduleActiveMutationVariables
      >(
        client,
        BulkToggleNotificationScheduleActiveDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const BulkDeleteNotificationScheduleDocument = `
    """
Bulk delete multiple notification schedules (admin only).
Requires: ids of schedules to delete.
Returns: Success status, counts, and any not-found IDs.
"""
mutation BulkDeleteNotificationSchedule($ids: [ID!]!) {
  bulkDeleteNotificationSchedules(ids: $ids) {
    ...BulkDeleteNotificationSchedulesPayloadFields
  }
}
    ${BulkDeleteNotificationSchedulesPayloadFieldsFragmentDoc}`;

export const useBulkDeleteNotificationScheduleMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    BulkDeleteNotificationScheduleMutation,
    TError,
    BulkDeleteNotificationScheduleMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    BulkDeleteNotificationScheduleMutation,
    TError,
    BulkDeleteNotificationScheduleMutationVariables,
    TContext
  >({
    mutationKey: ["BulkDeleteNotificationSchedule"],
    mutationFn: (variables?: BulkDeleteNotificationScheduleMutationVariables) =>
      fetcher<
        BulkDeleteNotificationScheduleMutation,
        BulkDeleteNotificationScheduleMutationVariables
      >(client, BulkDeleteNotificationScheduleDocument, variables, headers)(),
    ...options,
  });
};

export const UpdateNotificationScheduleLastRunDocument = `
    """
Update the last run timestamp of a schedule (moderator+).
Requires: id, lastRunAt, lastRunStatus.
Optional: lastRunError message.
Returns: Schedule with updated last run info.
"""
mutation UpdateNotificationScheduleLastRun($id: ID!, $lastRunAt: DateTime!, $lastRunStatus: LastRunStatus!, $lastRunError: String) {
  updateNotificationScheduleLastRun(
    input: {id: $id, lastRunAt: $lastRunAt, lastRunStatus: $lastRunStatus, lastRunError: $lastRunError}
  ) {
    ...UpdateLastRunPayloadFields
  }
}
    ${UpdateLastRunPayloadFieldsFragmentDoc}`;

export const useUpdateNotificationScheduleLastRunMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateNotificationScheduleLastRunMutation,
    TError,
    UpdateNotificationScheduleLastRunMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateNotificationScheduleLastRunMutation,
    TError,
    UpdateNotificationScheduleLastRunMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateNotificationScheduleLastRun"],
    mutationFn: (
      variables?: UpdateNotificationScheduleLastRunMutationVariables,
    ) =>
      fetcher<
        UpdateNotificationScheduleLastRunMutation,
        UpdateNotificationScheduleLastRunMutationVariables
      >(
        client,
        UpdateNotificationScheduleLastRunDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateNotificationStatusDocument = `
    """
Update the status of a notification (admin only).
Requires: notificationId, newStatus.
Returns: Notification with status change info.
"""
mutation UpdateNotificationStatus($notificationId: ID!, $newStatus: NotificationStatus!) {
  updateNotificationStatus(
    input: {notificationId: $notificationId, newStatus: $newStatus}
  ) {
    ...UpdateNotificationStatusResultFields
  }
}
    ${UpdateNotificationStatusResultFieldsFragmentDoc}`;

export const useUpdateNotificationStatusMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateNotificationStatusMutation,
    TError,
    UpdateNotificationStatusMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateNotificationStatusMutation,
    TError,
    UpdateNotificationStatusMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateNotificationStatus"],
    mutationFn: (variables?: UpdateNotificationStatusMutationVariables) =>
      fetcher<
        UpdateNotificationStatusMutation,
        UpdateNotificationStatusMutationVariables
      >(client, UpdateNotificationStatusDocument, variables, headers)(),
    ...options,
  });
};

export const SendMobileNotificationsDocument = `
    """
Send mobile push notifications (admin only).
Requires: notificationId.
Returns: Send statistics (success, failed, total).
"""
mutation SendMobileNotifications($notificationId: ID!) {
  sendMobileNotifications(input: {notificationId: $notificationId}) {
    ...SendMobileNotificationsPayloadFields
  }
}
    ${SendMobileNotificationsPayloadFieldsFragmentDoc}`;

export const useSendMobileNotificationsMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    SendMobileNotificationsMutation,
    TError,
    SendMobileNotificationsMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    SendMobileNotificationsMutation,
    TError,
    SendMobileNotificationsMutationVariables,
    TContext
  >({
    mutationKey: ["SendMobileNotifications"],
    mutationFn: (variables?: SendMobileNotificationsMutationVariables) =>
      fetcher<
        SendMobileNotificationsMutation,
        SendMobileNotificationsMutationVariables
      >(client, SendMobileNotificationsDocument, variables, headers)(),
    ...options,
  });
};

export const TrackDeliveryStartDocument = `
    """
Track the start of a notification delivery (admin only).
Requires: notificationId.
Returns: Success status.
"""
mutation TrackDeliveryStart($notificationId: ID!) {
  trackDeliveryStart(input: {notificationId: $notificationId}) {
    ...TrackDeliveryStartPayloadFields
  }
}
    ${TrackDeliveryStartPayloadFieldsFragmentDoc}`;

export const useTrackDeliveryStartMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    TrackDeliveryStartMutation,
    TError,
    TrackDeliveryStartMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    TrackDeliveryStartMutation,
    TError,
    TrackDeliveryStartMutationVariables,
    TContext
  >({
    mutationKey: ["TrackDeliveryStart"],
    mutationFn: (variables?: TrackDeliveryStartMutationVariables) =>
      fetcher<TrackDeliveryStartMutation, TrackDeliveryStartMutationVariables>(
        client,
        TrackDeliveryStartDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const TrackDeliveryCompleteDocument = `
    """
Track the completion of a notification delivery (admin only).
Requires: notificationId, totalRecipients, successCount, failureCount.
Optional: errors message.
Returns: Success status.
"""
mutation TrackDeliveryComplete($notificationId: ID!, $totalRecipients: Int!, $successCount: Int!, $failureCount: Int!, $errors: String) {
  trackDeliveryComplete(
    input: {notificationId: $notificationId, totalRecipients: $totalRecipients, successCount: $successCount, failureCount: $failureCount, errors: $errors}
  ) {
    ...TrackDeliveryCompletePayloadFields
  }
}
    ${TrackDeliveryCompletePayloadFieldsFragmentDoc}`;

export const useTrackDeliveryCompleteMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    TrackDeliveryCompleteMutation,
    TError,
    TrackDeliveryCompleteMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    TrackDeliveryCompleteMutation,
    TError,
    TrackDeliveryCompleteMutationVariables,
    TContext
  >({
    mutationKey: ["TrackDeliveryComplete"],
    mutationFn: (variables?: TrackDeliveryCompleteMutationVariables) =>
      fetcher<
        TrackDeliveryCompleteMutation,
        TrackDeliveryCompleteMutationVariables
      >(client, TrackDeliveryCompleteDocument, variables, headers)(),
    ...options,
  });
};

export const TrackDeliveryFailureDocument = `
    """
Track a notification delivery failure (admin only).
Requires: notificationId, error message.
Returns: Success status.
"""
mutation TrackDeliveryFailure($notificationId: ID!, $error: String!) {
  trackDeliveryFailure(input: {notificationId: $notificationId, error: $error}) {
    ...TrackDeliveryFailurePayloadFields
  }
}
    ${TrackDeliveryFailurePayloadFieldsFragmentDoc}`;

export const useTrackDeliveryFailureMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    TrackDeliveryFailureMutation,
    TError,
    TrackDeliveryFailureMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    TrackDeliveryFailureMutation,
    TError,
    TrackDeliveryFailureMutationVariables,
    TContext
  >({
    mutationKey: ["TrackDeliveryFailure"],
    mutationFn: (variables?: TrackDeliveryFailureMutationVariables) =>
      fetcher<
        TrackDeliveryFailureMutation,
        TrackDeliveryFailureMutationVariables
      >(client, TrackDeliveryFailureDocument, variables, headers)(),
    ...options,
  });
};

export const GetRewardDocument = `
    """
Get a single reward by its ID.
Returns the reward with all fields including purchase tracking.
"""
query GetReward($id: ID!) {
  reward(id: $id) {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;

export const useGetRewardQuery = <TData = GetRewardQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetRewardQueryVariables,
  options?: Omit<UseQueryOptions<GetRewardQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetRewardQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetRewardQuery, TError, TData>({
    queryKey: ["GetReward", variables],
    queryFn: fetcher<GetRewardQuery, GetRewardQueryVariables>(
      client,
      GetRewardDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetRewardQuery.getKey = (variables: GetRewardQueryVariables) => [
  "GetReward",
  variables,
];

export const GetRewardsByTripDocument = `
    """
Get visible rewards for a specific trip.
Returns rewards with dynamic calculations (affordability, dynamic cost).
Use for user-facing reward displays.
"""
query GetRewardsByTrip($tripId: ID!, $limit: Int = 30, $offset: Int = 0) {
  rewardsByTrip(tripId: $tripId, pagination: {limit: $limit, offset: $offset}) {
    ...RewardsConnectionFields
  }
}
    ${RewardsConnectionFieldsFragmentDoc}`;

export const useGetRewardsByTripQuery = <
  TData = GetRewardsByTripQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetRewardsByTripQueryVariables,
  options?: Omit<
    UseQueryOptions<GetRewardsByTripQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetRewardsByTripQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetRewardsByTripQuery, TError, TData>({
    queryKey: ["GetRewardsByTrip", variables],
    queryFn: fetcher<GetRewardsByTripQuery, GetRewardsByTripQueryVariables>(
      client,
      GetRewardsByTripDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetRewardsByTripQuery.getKey = (
  variables: GetRewardsByTripQueryVariables,
) => ["GetRewardsByTrip", variables];

export const GetRewardsByTripAdminDocument = `
    """
Get all rewards for a trip including hidden ones (admin only).
Returns rewards with dynamic calculations for moderation purposes.
"""
query GetRewardsByTripAdmin($tripId: ID!, $limit: Int = 30, $offset: Int = 0) {
  rewardsByTripAdmin(
    tripId: $tripId
    pagination: {limit: $limit, offset: $offset}
  ) {
    ...RewardsConnectionFields
  }
}
    ${RewardsConnectionFieldsFragmentDoc}`;

export const useGetRewardsByTripAdminQuery = <
  TData = GetRewardsByTripAdminQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetRewardsByTripAdminQueryVariables,
  options?: Omit<
    UseQueryOptions<GetRewardsByTripAdminQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetRewardsByTripAdminQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetRewardsByTripAdminQuery, TError, TData>({
    queryKey: ["GetRewardsByTripAdmin", variables],
    queryFn: fetcher<
      GetRewardsByTripAdminQuery,
      GetRewardsByTripAdminQueryVariables
    >(client, GetRewardsByTripAdminDocument, variables, headers),
    ...options,
  });
};

useGetRewardsByTripAdminQuery.getKey = (
  variables: GetRewardsByTripAdminQueryVariables,
) => ["GetRewardsByTripAdmin", variables];

export const GetPurchaseHistoryDocument = `
    """
Get purchase history for a trip.
Returns all reward purchases with status, buyer info, and group info.
"""
query GetPurchaseHistory($tripId: ID!, $limit: Int = 30, $offset: Int = 0) {
  purchaseHistory(tripId: $tripId, pagination: {limit: $limit, offset: $offset}) {
    ...PurchaseHistoryConnectionFields
  }
}
    ${PurchaseHistoryConnectionFieldsFragmentDoc}`;

export const useGetPurchaseHistoryQuery = <
  TData = GetPurchaseHistoryQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetPurchaseHistoryQueryVariables,
  options?: Omit<
    UseQueryOptions<GetPurchaseHistoryQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetPurchaseHistoryQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetPurchaseHistoryQuery, TError, TData>({
    queryKey: ["GetPurchaseHistory", variables],
    queryFn: fetcher<GetPurchaseHistoryQuery, GetPurchaseHistoryQueryVariables>(
      client,
      GetPurchaseHistoryDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetPurchaseHistoryQuery.getKey = (
  variables: GetPurchaseHistoryQueryVariables,
) => ["GetPurchaseHistory", variables];

export const GetTotalAvailablePointsDocument = `
    """
Get total available points for a trip (admin only).
Returns the total number of points available across all groups in the trip.
"""
query GetTotalAvailablePoints($tripId: ID!) {
  totalAvailablePoints(tripId: $tripId) {
    ...TotalAvailablePointsPayloadFields
  }
}
    ${TotalAvailablePointsPayloadFieldsFragmentDoc}`;

export const useGetTotalAvailablePointsQuery = <
  TData = GetTotalAvailablePointsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetTotalAvailablePointsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTotalAvailablePointsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetTotalAvailablePointsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetTotalAvailablePointsQuery, TError, TData>({
    queryKey: ["GetTotalAvailablePoints", variables],
    queryFn: fetcher<
      GetTotalAvailablePointsQuery,
      GetTotalAvailablePointsQueryVariables
    >(client, GetTotalAvailablePointsDocument, variables, headers),
    ...options,
  });
};

useGetTotalAvailablePointsQuery.getKey = (
  variables: GetTotalAvailablePointsQueryVariables,
) => ["GetTotalAvailablePoints", variables];

export const CreateRewardDocument = `
    """
Create a new reward (moderator only).
Requires: name, description, coinCost (percentage), availableQuantity, tripId.
"""
mutation CreateReward($input: CreateRewardInput!) {
  createReward(input: $input) {
    ...CreateRewardPayloadFields
  }
}
    ${CreateRewardPayloadFieldsFragmentDoc}`;

export const useCreateRewardMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateRewardMutation,
    TError,
    CreateRewardMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateRewardMutation,
    TError,
    CreateRewardMutationVariables,
    TContext
  >({
    mutationKey: ["CreateReward"],
    mutationFn: (variables?: CreateRewardMutationVariables) =>
      fetcher<CreateRewardMutation, CreateRewardMutationVariables>(
        client,
        CreateRewardDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateRewardDocument = `
    """
Update an existing reward (moderator only).
All fields are optional; only provided fields will be updated.
"""
mutation UpdateReward($input: UpdateRewardInput!) {
  updateReward(input: $input) {
    ...UpdateRewardPayloadFields
  }
}
    ${UpdateRewardPayloadFieldsFragmentDoc}`;

export const useUpdateRewardMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateRewardMutation,
    TError,
    UpdateRewardMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateRewardMutation,
    TError,
    UpdateRewardMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateReward"],
    mutationFn: (variables?: UpdateRewardMutationVariables) =>
      fetcher<UpdateRewardMutation, UpdateRewardMutationVariables>(
        client,
        UpdateRewardDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const DeleteRewardDocument = `
    """
Delete a reward (moderator only).
Returns success status and the deleted reward ID.
"""
mutation DeleteReward($id: ID!) {
  deleteReward(id: $id) {
    ...DeleteRewardPayloadFields
  }
}
    ${DeleteRewardPayloadFieldsFragmentDoc}`;

export const useDeleteRewardMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteRewardMutation,
    TError,
    DeleteRewardMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteRewardMutation,
    TError,
    DeleteRewardMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteReward"],
    mutationFn: (variables?: DeleteRewardMutationVariables) =>
      fetcher<DeleteRewardMutation, DeleteRewardMutationVariables>(
        client,
        DeleteRewardDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const PurchaseRewardDocument = `
    """
Purchase a reward (authenticated users).
Requires rewardId and quantity. Returns purchase record and remaining balances.
"""
mutation PurchaseReward($input: PurchaseRewardInput!) {
  purchaseReward(input: $input) {
    ...PurchaseRewardPayloadFields
  }
}
    ${PurchaseRewardPayloadFieldsFragmentDoc}`;

export const usePurchaseRewardMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    PurchaseRewardMutation,
    TError,
    PurchaseRewardMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    PurchaseRewardMutation,
    TError,
    PurchaseRewardMutationVariables,
    TContext
  >({
    mutationKey: ["PurchaseReward"],
    mutationFn: (variables?: PurchaseRewardMutationVariables) =>
      fetcher<PurchaseRewardMutation, PurchaseRewardMutationVariables>(
        client,
        PurchaseRewardDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const SetRewardHiddenDocument = `
    """
Set reward hidden status (moderator only).
Toggles whether a reward is visible to users. Returns previous and current state.
"""
mutation SetRewardHidden($rewardId: ID!, $isHidden: Boolean!) {
  setRewardHidden(input: {id: $rewardId, isHidden: $isHidden}) {
    ...SetRewardHiddenPayloadFields
  }
}
    ${SetRewardHiddenPayloadFieldsFragmentDoc}`;

export const useSetRewardHiddenMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    SetRewardHiddenMutation,
    TError,
    SetRewardHiddenMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    SetRewardHiddenMutation,
    TError,
    SetRewardHiddenMutationVariables,
    TContext
  >({
    mutationKey: ["SetRewardHidden"],
    mutationFn: (variables?: SetRewardHiddenMutationVariables) =>
      fetcher<SetRewardHiddenMutation, SetRewardHiddenMutationVariables>(
        client,
        SetRewardHiddenDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdatePurchaseStatusDocument = `
    """
Update purchase status (moderator only).
For moderators to manage order fulfillment: ACCEPTED, IN_DELIVERY, DELIVERED, CANCELLED.
"""
mutation UpdatePurchaseStatus($input: UpdatePurchaseStatusInput!) {
  updatePurchaseStatus(input: $input) {
    ...UpdatePurchaseStatusPayloadFields
  }
}
    ${UpdatePurchaseStatusPayloadFieldsFragmentDoc}`;

export const useUpdatePurchaseStatusMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdatePurchaseStatusMutation,
    TError,
    UpdatePurchaseStatusMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdatePurchaseStatusMutation,
    TError,
    UpdatePurchaseStatusMutationVariables,
    TContext
  >({
    mutationKey: ["UpdatePurchaseStatus"],
    mutationFn: (variables?: UpdatePurchaseStatusMutationVariables) =>
      fetcher<
        UpdatePurchaseStatusMutation,
        UpdatePurchaseStatusMutationVariables
      >(client, UpdatePurchaseStatusDocument, variables, headers)(),
    ...options,
  });
};

export const UpdateMyPurchaseStatusDocument = `
    """
Update own purchase status (group leader only).
For group leaders to update their own purchases: IN_DELIVERY or CANCELLED only.
"""
mutation UpdateMyPurchaseStatus($input: UpdateMyPurchaseStatusInput!) {
  updateMyPurchaseStatus(input: $input) {
    ...UpdateMyPurchaseStatusPayloadFields
  }
}
    ${UpdateMyPurchaseStatusPayloadFieldsFragmentDoc}`;

export const useUpdateMyPurchaseStatusMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateMyPurchaseStatusMutation,
    TError,
    UpdateMyPurchaseStatusMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateMyPurchaseStatusMutation,
    TError,
    UpdateMyPurchaseStatusMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateMyPurchaseStatus"],
    mutationFn: (variables?: UpdateMyPurchaseStatusMutationVariables) =>
      fetcher<
        UpdateMyPurchaseStatusMutation,
        UpdateMyPurchaseStatusMutationVariables
      >(client, UpdateMyPurchaseStatusDocument, variables, headers)(),
    ...options,
  });
};

export const GetSponsorDocument = `
    """
Get a single sponsor by its unique ID.
Returns null if sponsor not found or is inactive (for non-admin users).
"""
query GetSponsor($id: ID!) {
  sponsor(id: $id) {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;

export const useGetSponsorQuery = <TData = GetSponsorQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetSponsorQueryVariables,
  options?: Omit<
    UseQueryOptions<GetSponsorQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetSponsorQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetSponsorQuery, TError, TData>({
    queryKey: ["GetSponsor", variables],
    queryFn: fetcher<GetSponsorQuery, GetSponsorQueryVariables>(
      client,
      GetSponsorDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetSponsorQuery.getKey = (variables: GetSponsorQueryVariables) => [
  "GetSponsor",
  variables,
];

export const GetSponsorsByTripDocument = `
    """
Get all sponsors linked to a specific trip.
Returns an empty list if the trip has no sponsors or if trip not found.
"""
query GetSponsorsByTrip($tripId: ID!) {
  sponsorsByTrip(tripId: $tripId) {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;

export const useGetSponsorsByTripQuery = <
  TData = GetSponsorsByTripQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetSponsorsByTripQueryVariables,
  options?: Omit<
    UseQueryOptions<GetSponsorsByTripQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetSponsorsByTripQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetSponsorsByTripQuery, TError, TData>({
    queryKey: ["GetSponsorsByTrip", variables],
    queryFn: fetcher<GetSponsorsByTripQuery, GetSponsorsByTripQueryVariables>(
      client,
      GetSponsorsByTripDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetSponsorsByTripQuery.getKey = (
  variables: GetSponsorsByTripQueryVariables,
) => ["GetSponsorsByTrip", variables];

export const CreateSponsorDocument = `
    """
Create a new sponsor.
Requires admin privileges.
Returns the created sponsor with full details.
"""
mutation CreateSponsor($input: CreateSponsorInput!) {
  createSponsor(input: $input) {
    ...CreateSponsorPayloadFields
  }
}
    ${CreateSponsorPayloadFieldsFragmentDoc}`;

export const useCreateSponsorMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateSponsorMutation,
    TError,
    CreateSponsorMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateSponsorMutation,
    TError,
    CreateSponsorMutationVariables,
    TContext
  >({
    mutationKey: ["CreateSponsor"],
    mutationFn: (variables?: CreateSponsorMutationVariables) =>
      fetcher<CreateSponsorMutation, CreateSponsorMutationVariables>(
        client,
        CreateSponsorDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateSponsorDocument = `
    """
Update an existing sponsor.
Requires admin privileges.
Only provided fields will be updated; null values clear optional fields.
Returns the updated sponsor with full details.
"""
mutation UpdateSponsor($input: UpdateSponsorInput!) {
  updateSponsor(input: $input) {
    ...UpdateSponsorPayloadFields
  }
}
    ${UpdateSponsorPayloadFieldsFragmentDoc}`;

export const useUpdateSponsorMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateSponsorMutation,
    TError,
    UpdateSponsorMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateSponsorMutation,
    TError,
    UpdateSponsorMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateSponsor"],
    mutationFn: (variables?: UpdateSponsorMutationVariables) =>
      fetcher<UpdateSponsorMutation, UpdateSponsorMutationVariables>(
        client,
        UpdateSponsorDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const DeleteSponsorDocument = `
    """
Delete a sponsor.
Requires admin privileges.
Returns success flag and deleted sponsor ID.
Note: This may fail if the sponsor is linked to active trips.
"""
mutation DeleteSponsor($id: ID!) {
  deleteSponsor(id: $id) {
    ...DeleteSponsorPayloadFields
  }
}
    ${DeleteSponsorPayloadFieldsFragmentDoc}`;

export const useDeleteSponsorMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteSponsorMutation,
    TError,
    DeleteSponsorMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteSponsorMutation,
    TError,
    DeleteSponsorMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteSponsor"],
    mutationFn: (variables?: DeleteSponsorMutationVariables) =>
      fetcher<DeleteSponsorMutation, DeleteSponsorMutationVariables>(
        client,
        DeleteSponsorDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const LinkSponsorToTripDocument = `
    """
Link a sponsor to a trip.
Requires admin privileges.
Associates an existing sponsor with a trip for display in the trip context.
Returns success status and the IDs of the linked sponsor and trip.
"""
mutation LinkSponsorToTrip($sponsorId: ID!, $tripId: ID!) {
  linkSponsorToTrip(input: {sponsorId: $sponsorId, tripId: $tripId}) {
    ...LinkSponsorToTripPayloadFields
  }
}
    ${LinkSponsorToTripPayloadFieldsFragmentDoc}`;

export const useLinkSponsorToTripMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    LinkSponsorToTripMutation,
    TError,
    LinkSponsorToTripMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    LinkSponsorToTripMutation,
    TError,
    LinkSponsorToTripMutationVariables,
    TContext
  >({
    mutationKey: ["LinkSponsorToTrip"],
    mutationFn: (variables?: LinkSponsorToTripMutationVariables) =>
      fetcher<LinkSponsorToTripMutation, LinkSponsorToTripMutationVariables>(
        client,
        LinkSponsorToTripDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UnlinkSponsorFromTripDocument = `
    """
Unlink a sponsor from a trip.
Requires admin privileges.
Removes the association between a sponsor and a trip.
Returns success status and the IDs of the unlinked sponsor and trip.
"""
mutation UnlinkSponsorFromTrip($sponsorId: ID!, $tripId: ID!) {
  unlinkSponsorFromTrip(input: {sponsorId: $sponsorId, tripId: $tripId}) {
    ...UnlinkSponsorFromTripPayloadFields
  }
}
    ${UnlinkSponsorFromTripPayloadFieldsFragmentDoc}`;

export const useUnlinkSponsorFromTripMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UnlinkSponsorFromTripMutation,
    TError,
    UnlinkSponsorFromTripMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UnlinkSponsorFromTripMutation,
    TError,
    UnlinkSponsorFromTripMutationVariables,
    TContext
  >({
    mutationKey: ["UnlinkSponsorFromTrip"],
    mutationFn: (variables?: UnlinkSponsorFromTripMutationVariables) =>
      fetcher<
        UnlinkSponsorFromTripMutation,
        UnlinkSponsorFromTripMutationVariables
      >(client, UnlinkSponsorFromTripDocument, variables, headers)(),
    ...options,
  });
};

export const GetSubmissionReportsDocument = `
    query GetSubmissionReports($submissionId: ID!) {
  submissionReports(submissionId: $submissionId) {
    reports {
      ...SubmissionReportFields
    }
    totalCount
  }
}
    ${SubmissionReportFieldsFragmentDoc}`;

export const useGetSubmissionReportsQuery = <
  TData = GetSubmissionReportsQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetSubmissionReportsQueryVariables,
  options?: Omit<
    UseQueryOptions<GetSubmissionReportsQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<
      GetSubmissionReportsQuery,
      TError,
      TData
    >["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetSubmissionReportsQuery, TError, TData>({
    queryKey: ["GetSubmissionReports", variables],
    queryFn: fetcher<
      GetSubmissionReportsQuery,
      GetSubmissionReportsQueryVariables
    >(client, GetSubmissionReportsDocument, variables, headers),
    ...options,
  });
};

useGetSubmissionReportsQuery.getKey = (
  variables: GetSubmissionReportsQueryVariables,
) => ["GetSubmissionReports", variables];

export const CreateSubmissionReportDocument = `
    mutation CreateSubmissionReport($input: CreateReportInput!) {
  createSubmissionReport(input: $input) {
    ...SubmissionReportCreateResultFields
  }
}
    ${SubmissionReportCreateResultFieldsFragmentDoc}`;

export const useCreateSubmissionReportMutation = <
  TError = unknown,
  TContext = unknown,
>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateSubmissionReportMutation,
    TError,
    CreateSubmissionReportMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateSubmissionReportMutation,
    TError,
    CreateSubmissionReportMutationVariables,
    TContext
  >({
    mutationKey: ["CreateSubmissionReport"],
    mutationFn: (variables?: CreateSubmissionReportMutationVariables) =>
      fetcher<
        CreateSubmissionReportMutation,
        CreateSubmissionReportMutationVariables
      >(client, CreateSubmissionReportDocument, variables, headers)(),
    ...options,
  });
};

export const GetTripDocument = `
    query GetTrip($id: ID!) {
  trip(id: $id) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export const useGetTripQuery = <TData = GetTripQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetTripQueryVariables,
  options?: Omit<UseQueryOptions<GetTripQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetTripQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetTripQuery, TError, TData>({
    queryKey: ["GetTrip", variables],
    queryFn: fetcher<GetTripQuery, GetTripQueryVariables>(
      client,
      GetTripDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetTripQuery.getKey = (variables: GetTripQueryVariables) => [
  "GetTrip",
  variables,
];

export const GetTripsDocument = `
    query GetTrips($pagination: TripPaginationInput) {
  trips(pagination: $pagination) {
    trips {
      ...TripFields
    }
    pagination {
      total
      hasMore
      limit
      offset
    }
  }
}
    ${TripFieldsFragmentDoc}`;

export const useGetTripsQuery = <TData = GetTripsQuery, TError = unknown>(
  client: GraphQLClient,
  variables?: GetTripsQueryVariables,
  options?: Omit<UseQueryOptions<GetTripsQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetTripsQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetTripsQuery, TError, TData>({
    queryKey: variables === undefined ? ["GetTrips"] : ["GetTrips", variables],
    queryFn: fetcher<GetTripsQuery, GetTripsQueryVariables>(
      client,
      GetTripsDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetTripsQuery.getKey = (variables?: GetTripsQueryVariables) =>
  variables === undefined ? ["GetTrips"] : ["GetTrips", variables];

export const GetTripAdminDocument = `
    query GetTripAdmin($id: ID!) {
  tripAdmin(id: $id) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export const useGetTripAdminQuery = <
  TData = GetTripAdminQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables: GetTripAdminQueryVariables,
  options?: Omit<
    UseQueryOptions<GetTripAdminQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetTripAdminQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetTripAdminQuery, TError, TData>({
    queryKey: ["GetTripAdmin", variables],
    queryFn: fetcher<GetTripAdminQuery, GetTripAdminQueryVariables>(
      client,
      GetTripAdminDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetTripAdminQuery.getKey = (variables: GetTripAdminQueryVariables) => [
  "GetTripAdmin",
  variables,
];

export const CreateTripDocument = `
    mutation CreateTrip($input: CreateTripInput!) {
  createTrip(input: $input) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export const useCreateTripMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateTripMutation,
    TError,
    CreateTripMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateTripMutation,
    TError,
    CreateTripMutationVariables,
    TContext
  >({
    mutationKey: ["CreateTrip"],
    mutationFn: (variables?: CreateTripMutationVariables) =>
      fetcher<CreateTripMutation, CreateTripMutationVariables>(
        client,
        CreateTripDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateTripDocument = `
    mutation UpdateTrip($input: UpdateTripInput!) {
  updateTrip(input: $input) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export const useUpdateTripMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateTripMutation,
    TError,
    UpdateTripMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateTripMutation,
    TError,
    UpdateTripMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateTrip"],
    mutationFn: (variables?: UpdateTripMutationVariables) =>
      fetcher<UpdateTripMutation, UpdateTripMutationVariables>(
        client,
        UpdateTripDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const DeleteTripDocument = `
    mutation DeleteTrip($id: ID!) {
  deleteTrip(input: {id: $id}) {
    success
  }
}
    `;

export const useDeleteTripMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    DeleteTripMutation,
    TError,
    DeleteTripMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    DeleteTripMutation,
    TError,
    DeleteTripMutationVariables,
    TContext
  >({
    mutationKey: ["DeleteTrip"],
    mutationFn: (variables?: DeleteTripMutationVariables) =>
      fetcher<DeleteTripMutation, DeleteTripMutationVariables>(
        client,
        DeleteTripDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const GetUserDocument = `
    query GetUser($id: ID!) {
  user(id: $id) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export const useGetUserQuery = <TData = GetUserQuery, TError = unknown>(
  client: GraphQLClient,
  variables: GetUserQueryVariables,
  options?: Omit<UseQueryOptions<GetUserQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetUserQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetUserQuery, TError, TData>({
    queryKey: ["GetUser", variables],
    queryFn: fetcher<GetUserQuery, GetUserQueryVariables>(
      client,
      GetUserDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetUserQuery.getKey = (variables: GetUserQueryVariables) => [
  "GetUser",
  variables,
];

export const GetCurrentUserDocument = `
    query GetCurrentUser {
  me {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export const useGetCurrentUserQuery = <
  TData = GetCurrentUserQuery,
  TError = unknown,
>(
  client: GraphQLClient,
  variables?: GetCurrentUserQueryVariables,
  options?: Omit<
    UseQueryOptions<GetCurrentUserQuery, TError, TData>,
    "queryKey"
  > & {
    queryKey?: UseQueryOptions<GetCurrentUserQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetCurrentUserQuery, TError, TData>({
    queryKey:
      variables === undefined
        ? ["GetCurrentUser"]
        : ["GetCurrentUser", variables],
    queryFn: fetcher<GetCurrentUserQuery, GetCurrentUserQueryVariables>(
      client,
      GetCurrentUserDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetCurrentUserQuery.getKey = (variables?: GetCurrentUserQueryVariables) =>
  variables === undefined ? ["GetCurrentUser"] : ["GetCurrentUser", variables];

export const GetUsersDocument = `
    query GetUsers($limit: Int = 20, $offset: Int = 0) {
  users(limit: $limit, offset: $offset) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export const useGetUsersQuery = <TData = GetUsersQuery, TError = unknown>(
  client: GraphQLClient,
  variables?: GetUsersQueryVariables,
  options?: Omit<UseQueryOptions<GetUsersQuery, TError, TData>, "queryKey"> & {
    queryKey?: UseQueryOptions<GetUsersQuery, TError, TData>["queryKey"];
  },
  headers?: RequestInit["headers"],
) => {
  return useQuery<GetUsersQuery, TError, TData>({
    queryKey: variables === undefined ? ["GetUsers"] : ["GetUsers", variables],
    queryFn: fetcher<GetUsersQuery, GetUsersQueryVariables>(
      client,
      GetUsersDocument,
      variables,
      headers,
    ),
    ...options,
  });
};

useGetUsersQuery.getKey = (variables?: GetUsersQueryVariables) =>
  variables === undefined ? ["GetUsers"] : ["GetUsers", variables];

export const CreateUserDocument = `
    mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    ...UserCreateResultFields
  }
}
    ${UserCreateResultFieldsFragmentDoc}`;

export const useCreateUserMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    CreateUserMutation,
    TError,
    CreateUserMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    CreateUserMutation,
    TError,
    CreateUserMutationVariables,
    TContext
  >({
    mutationKey: ["CreateUser"],
    mutationFn: (variables?: CreateUserMutationVariables) =>
      fetcher<CreateUserMutation, CreateUserMutationVariables>(
        client,
        CreateUserDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};

export const UpdateUserDocument = `
    mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    ...UserUpdateResultFields
  }
}
    ${UserUpdateResultFieldsFragmentDoc}`;

export const useUpdateUserMutation = <TError = unknown, TContext = unknown>(
  client: GraphQLClient,
  options?: UseMutationOptions<
    UpdateUserMutation,
    TError,
    UpdateUserMutationVariables,
    TContext
  >,
  headers?: RequestInit["headers"],
) => {
  return useMutation<
    UpdateUserMutation,
    TError,
    UpdateUserMutationVariables,
    TContext
  >({
    mutationKey: ["UpdateUser"],
    mutationFn: (variables?: UpdateUserMutationVariables) =>
      fetcher<UpdateUserMutation, UpdateUserMutationVariables>(
        client,
        UpdateUserDocument,
        variables,
        headers,
      )(),
    ...options,
  });
};
