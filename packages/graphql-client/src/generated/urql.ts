import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export const UserFieldsFragmentDoc = gql`
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
  emailVerified
  createdAt
  lastSeenOn
  isAdmin
  isModerator
}
    `;
export const UserSummaryFieldsFragmentDoc = gql`
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
export const UserCreateResultFieldsFragmentDoc = gql`
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
export const UserUpdateResultFieldsFragmentDoc = gql`
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
export const TripSummaryFieldsFragmentDoc = gql`
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
export const GroupSummaryFieldsFragmentDoc = gql`
    """Minimal group fields for lists and references."""
fragment GroupSummaryFields on GroupSummary {
  id
  name
}
    `;
export const HiddenActivityFieldsFragmentDoc = gql`
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
export const ChallengeFieldsFragmentDoc = gql`
    """
All challenge fields including configuration and scheduling.
Use for challenge details, editing, and administration.
"""
fragment ChallengeFields on Challenge {
  id
  tripId
  name
  description
  image
  submissionType
  scoringCategory
  basePoints
  firstPlacePoints
  secondPlacePoints
  thirdPlacePoints
  isRecurring
  dailyStartTime
  dailyEndTime
  status
  startTime
  endTime
  targetLatitude
  targetLongitude
  expectedValue
  autoApprove
  isActive
  isOpenForSubmission
  hasVotingPhase
  requiresLocation
  requiresQRCode
  createdAt
}
    `;
export const ChallengeSummaryFieldsFragmentDoc = gql`
    """
Minimal challenge fields for lists and summary views.
Use when you only need basic challenge information.
"""
fragment ChallengeSummaryFields on ChallengeSummary {
  id
  tripId
  name
  description
  submissionType
  scoringCategory
  basePoints
  status
  createdAt
}
    `;
export const SubmissionReviewerFieldsFragmentDoc = gql`
    """Reviewer info embedded in submissions."""
fragment SubmissionReviewerFields on SubmissionReviewerInfo {
  id
  firstName
  lastName
  email
}
    `;
export const SubmissionGroupFieldsFragmentDoc = gql`
    """Group info embedded in submissions."""
fragment SubmissionGroupFields on SubmissionGroupInfo {
  id
  name
  description
  image
}
    `;
export const ChallengeSubmissionCreateResultFieldsFragmentDoc = gql`
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
export const ChallengeSubmissionUpdateResultFieldsFragmentDoc = gql`
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
export const ChallengeVoteFieldsFragmentDoc = gql`
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
export const ChallengeVoteListFieldsFragmentDoc = gql`
    """Vote list with metadata."""
fragment ChallengeVoteListFields on ChallengeVoteList {
  totalVotes
  votes {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const ChallengeVoteAdminListFieldsFragmentDoc = gql`
    """Admin vote list with unique voter count."""
fragment ChallengeVoteAdminListFields on ChallengeVoteAdminList {
  totalVotes
  uniqueVoters
  votes {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const LocationSummaryFieldsFragmentDoc = gql`
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
export const CoinTransactionGroupFieldsFragmentDoc = gql`
    """Group info in coin transaction context."""
fragment CoinTransactionGroupFields on CoinTransactionGroup {
  id
  name
  coins
}
    `;
export const CoinTransactionAdminFieldsFragmentDoc = gql`
    """Admin info in coin transaction context."""
fragment CoinTransactionAdminFields on CoinTransactionAdmin {
  id
  firstName
  lastName
  fullName
}
    `;
export const CoinTransactionFieldsFragmentDoc = gql`
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
export const CoinTransactionResultFieldsFragmentDoc = gql`
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
export const SubmissionReportCreateResultFieldsFragmentDoc = gql`
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
export const ActivityAdminFieldsFragmentDoc = gql`
    """Admin information embedded in activities."""
fragment ActivityAdminFields on ActivityAdmin {
  id
  firstName
  lastName
}
    `;
export const ActivityFieldsFragmentDoc = gql`
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
export const ActivityCursorFieldsFragmentDoc = gql`
    """Activity cursor for pagination."""
fragment ActivityCursorFields on ActivityCursor {
  id
  createdAt
  isPinned
}
    `;
export const PaginationInfoFieldsFragmentDoc = gql`
    """Standard pagination info."""
fragment PaginationInfoFields on PaginationInfo {
  hasMore
  pageSize
}
    `;
export const ActivityFeedResultFieldsFragmentDoc = gql`
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
export const ModerationPaginationInfoFieldsFragmentDoc = gql`
    """Moderation pagination info."""
fragment ModerationPaginationInfoFields on ModerationPaginationInfo {
  hasMore
  page
  pageSize
  total
  totalPages
}
    `;
export const ActivityFeedModerationResultFieldsFragmentDoc = gql`
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
export const GroupFieldsFragmentDoc = gql`
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
export const OffsetPaginationFieldsFragmentDoc = gql`
    """Offset-based pagination info."""
fragment OffsetPaginationFields on GroupPagination {
  hasMore
  limit
  offset
  total
}
    `;
export const GroupsConnectionFieldsFragmentDoc = gql`
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
export const CoinTransactionPaginationFieldsFragmentDoc = gql`
    """Coin transaction pagination."""
fragment CoinTransactionPaginationFields on CoinTransactionPagination {
  hasMore
  limit
  offset
  total
}
    `;
export const CoinTransactionsConnectionFieldsFragmentDoc = gql`
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
export const RewardWithCalculationsFieldsFragmentDoc = gql`
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
export const RewardPaginationFieldsFragmentDoc = gql`
    """Reward pagination."""
fragment RewardPaginationFields on RewardPagination {
  hasMore
  limit
  offset
  total
}
    `;
export const RewardsConnectionFieldsFragmentDoc = gql`
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
export const RewardPurchaseFieldsFragmentDoc = gql`
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
export const PurchaseHistoryConnectionFieldsFragmentDoc = gql`
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
export const NotificationScheduleSummaryFieldsFragmentDoc = gql`
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
export const NotificationSchedulePaginationFieldsFragmentDoc = gql`
    """Notification schedule pagination."""
fragment NotificationSchedulePaginationFields on NotificationSchedulePagination {
  hasMore
  limit
  offset
  total
}
    `;
export const NotificationSchedulesConnectionFieldsFragmentDoc = gql`
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
export const NotificationCreatorFieldsFragmentDoc = gql`
    """Notification creator info."""
fragment NotificationCreatorFields on NotificationCreator {
  id
  firstName
  lastName
  authUserId
}
    `;
export const NotificationWithCreatorFieldsFragmentDoc = gql`
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
export const NotificationDeliveryFieldsFragmentDoc = gql`
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
export const DeliveryPaginationFieldsFragmentDoc = gql`
    """Delivery pagination."""
fragment DeliveryPaginationFields on DeliveryPagination {
  limit
  offset
  total
}
    `;
export const NotificationDeliveryListResultFieldsFragmentDoc = gql`
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
export const ChallengeSubmissionFieldsFragmentDoc = gql`
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
export const ChallengeSubmissionListResultFieldsFragmentDoc = gql`
    """Challenge submission list result."""
fragment ChallengeSubmissionListResultFields on ChallengeSubmissionListResult {
  submissions {
    ...ChallengeSubmissionFields
  }
  totalCount
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;
export const SubmissionReportUserFieldsFragmentDoc = gql`
    """User info in submission report context."""
fragment SubmissionReportUserFields on SubmissionReportUserInfo {
  id
  firstName
  lastName
  email
  hasAvatar
}
    `;
export const SubmissionReportReporterFieldsFragmentDoc = gql`
    """Reporter info in submission reports."""
fragment SubmissionReportReporterFields on SubmissionReportReporterInfo {
  id
  user {
    ...SubmissionReportUserFields
  }
}
    ${SubmissionReportUserFieldsFragmentDoc}`;
export const SubmissionReportFieldsFragmentDoc = gql`
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
export const SubmissionReportListResultFieldsFragmentDoc = gql`
    """Submission report list result."""
fragment SubmissionReportListResultFields on SubmissionReportListResult {
  reports {
    ...SubmissionReportFields
  }
  totalCount
}
    ${SubmissionReportFieldsFragmentDoc}`;
export const FriendLocationFieldsFragmentDoc = gql`
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
export const FriendsLocationsConnectionFieldsFragmentDoc = gql`
    """Friends locations connection."""
fragment FriendsLocationsConnectionFields on FriendsLocationsConnection {
  locations {
    ...FriendLocationFields
  }
  total
}
    ${FriendLocationFieldsFragmentDoc}`;
export const TripFieldsFragmentDoc = gql`
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
export const TripPaginationInfoFieldsFragmentDoc = gql`
    """Trip pagination info."""
fragment TripPaginationInfoFields on TripPaginationInfo {
  hasMore
  limit
  offset
  total
}
    `;
export const TripListResultFieldsFragmentDoc = gql`
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
export const SponsorFieldsFragmentDoc = gql`
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
export const SponsorListResultFieldsFragmentDoc = gql`
    """Sponsor list result."""
fragment SponsorListResultFields on SponsorListResult {
  sponsors {
    ...SponsorFields
  }
  total
}
    ${SponsorFieldsFragmentDoc}`;
export const NotificationFieldsFragmentDoc = gql`
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
export const NotificationPaginationInfoFieldsFragmentDoc = gql`
    """Notification pagination info."""
fragment NotificationPaginationInfoFields on NotificationPaginationInfo {
  page
  pageSize
  total
  totalPages
}
    `;
export const MyNotificationsResultFieldsFragmentDoc = gql`
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
export const NotificationOffsetPaginationInfoFieldsFragmentDoc = gql`
    """Notification offset pagination info."""
fragment NotificationOffsetPaginationInfoFields on NotificationOffsetPaginationInfo {
  hasMore
  limit
  offset
  total
}
    `;
export const AllNotificationsResultFieldsFragmentDoc = gql`
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
export const CoinStatisticsFieldsFragmentDoc = gql`
    """Coin statistics for a trip."""
fragment CoinStatisticsFields on CoinStatistics {
  addedCoins
  removedCoins
  netBalance
  transactionCount
  time
}
    `;
export const CoinQuickStatsFieldsFragmentDoc = gql`
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
export const FormattedUserFieldsFragmentDoc = gql`
    """Formatted user for stats displays."""
fragment FormattedUserFields on FormattedUser {
  name
  transactionCount
}
    `;
export const CoinAdditionalInsightsFieldsFragmentDoc = gql`
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
export const MostActiveAdminStatsFieldsFragmentDoc = gql`
    """Most active admin stats."""
fragment MostActiveAdminStatsFields on MostActiveAdminStats {
  adminId
  adminName
  transactionCount
  totalAmount
}
    `;
export const GroupRankingFieldsFragmentDoc = gql`
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
export const GroupRankingResultFieldsFragmentDoc = gql`
    """Group ranking result."""
fragment GroupRankingResultFields on GroupRankingResult {
  currentDate
  data {
    ...GroupRankingFields
  }
}
    ${GroupRankingFieldsFragmentDoc}`;
export const DeliveryStatusBreakdownFieldsFragmentDoc = gql`
    """Delivery status breakdown."""
fragment DeliveryStatusBreakdownFields on DeliveryStatusBreakdown {
  success
  failure
  partialFailure
  pending
}
    `;
export const DeliveryStatsFieldsFragmentDoc = gql`
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
export const SubmissionVoteCountFieldsFragmentDoc = gql`
    """Submission vote count statistics."""
fragment SubmissionVoteCountFields on SubmissionVoteCount {
  submissionId
  voteCount
  voteScore
}
    `;
export const VotingProgressFieldsFragmentDoc = gql`
    """Voting progress for a challenge."""
fragment VotingProgressFields on VotingProgress {
  challengeId
  totalVotes
  submissionStats {
    ...SubmissionVoteCountFields
  }
}
    ${SubmissionVoteCountFieldsFragmentDoc}`;
export const AdminVotingInfoFieldsFragmentDoc = gql`
    """Admin voting info."""
fragment AdminVotingInfoFields on AdminVotingInfo {
  participantId
  hasVotedAll
  votedPositions
}
    `;
export const JudgedStaffVotingProgressFieldsFragmentDoc = gql`
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
export const CreateGroupPayloadFieldsFragmentDoc = gql`
    """Create group payload."""
fragment CreateGroupPayloadFields on CreateGroupPayload {
  group {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;
export const UpdateGroupPayloadFieldsFragmentDoc = gql`
    """Update group payload."""
fragment UpdateGroupPayloadFields on UpdateGroupPayload {
  group {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;
export const DeleteGroupPayloadFieldsFragmentDoc = gql`
    """Delete group payload."""
fragment DeleteGroupPayloadFields on DeleteGroupPayload {
  success
}
    `;
export const RewardFieldsFragmentDoc = gql`
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
export const CreateRewardPayloadFieldsFragmentDoc = gql`
    """Create reward payload."""
fragment CreateRewardPayloadFields on CreateRewardPayload {
  reward {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;
export const UpdateRewardPayloadFieldsFragmentDoc = gql`
    """Update reward payload."""
fragment UpdateRewardPayloadFields on UpdateRewardPayload {
  reward {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;
export const DeleteRewardPayloadFieldsFragmentDoc = gql`
    """Delete reward payload."""
fragment DeleteRewardPayloadFields on DeleteRewardPayload {
  success
  deletedRewardId
}
    `;
export const SetRewardHiddenPayloadFieldsFragmentDoc = gql`
    """Set reward hidden payload."""
fragment SetRewardHiddenPayloadFields on SetRewardHiddenPayload {
  previousHidden
  reward {
    ...RewardFields
  }
}
    ${RewardFieldsFragmentDoc}`;
export const PurchaseRewardPayloadFieldsFragmentDoc = gql`
    """Purchase reward payload."""
fragment PurchaseRewardPayloadFields on PurchaseRewardPayload {
  purchase {
    ...RewardPurchaseFields
  }
  remainingGroupCoins
  remainingRewardQuantity
}
    ${RewardPurchaseFieldsFragmentDoc}`;
export const UpdatePurchaseStatusPayloadFieldsFragmentDoc = gql`
    """Update purchase status payload."""
fragment UpdatePurchaseStatusPayloadFields on UpdatePurchaseStatusPayload {
  purchase {
    ...RewardPurchaseFields
  }
  previousStatus
  refunded
}
    ${RewardPurchaseFieldsFragmentDoc}`;
export const UpdateMyPurchaseStatusPayloadFieldsFragmentDoc = gql`
    """Update my purchase status payload."""
fragment UpdateMyPurchaseStatusPayloadFields on UpdateMyPurchaseStatusPayload {
  purchase {
    ...RewardPurchaseFields
  }
  previousStatus
}
    ${RewardPurchaseFieldsFragmentDoc}`;
export const CreateSponsorPayloadFieldsFragmentDoc = gql`
    """Create sponsor payload."""
fragment CreateSponsorPayloadFields on CreateSponsorPayload {
  sponsor {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;
export const UpdateSponsorPayloadFieldsFragmentDoc = gql`
    """Update sponsor payload."""
fragment UpdateSponsorPayloadFields on UpdateSponsorPayload {
  sponsor {
    ...SponsorFields
  }
}
    ${SponsorFieldsFragmentDoc}`;
export const DeleteSponsorPayloadFieldsFragmentDoc = gql`
    """Delete sponsor payload."""
fragment DeleteSponsorPayloadFields on DeleteSponsorPayload {
  success
  id
}
    `;
export const LinkSponsorToTripPayloadFieldsFragmentDoc = gql`
    """Link sponsor to trip payload."""
fragment LinkSponsorToTripPayloadFields on LinkSponsorToTripPayload {
  linked
  sponsorId
  tripId
}
    `;
export const UnlinkSponsorFromTripPayloadFieldsFragmentDoc = gql`
    """Unlink sponsor from trip payload."""
fragment UnlinkSponsorFromTripPayloadFields on UnlinkSponsorFromTripPayload {
  unlinked
  sponsorId
  tripId
}
    `;
export const CreateNotificationResultFieldsFragmentDoc = gql`
    """Create notification result."""
fragment CreateNotificationResultFields on CreateNotificationResult {
  notification {
    ...NotificationFields
  }
}
    ${NotificationFieldsFragmentDoc}`;
export const UpdateNotificationResultFieldsFragmentDoc = gql`
    """Update notification result."""
fragment UpdateNotificationResultFields on UpdateNotificationResult {
  notification {
    ...NotificationFields
  }
}
    ${NotificationFieldsFragmentDoc}`;
export const DeleteNotificationResultFieldsFragmentDoc = gql`
    """Delete notification result."""
fragment DeleteNotificationResultFields on DeleteNotificationResult {
  success
}
    `;
export const UpdateNotificationStatusResultFieldsFragmentDoc = gql`
    """Update notification status result."""
fragment UpdateNotificationStatusResultFields on UpdateNotificationStatusResult {
  notification {
    ...NotificationFields
  }
  previousStatus
  newStatus
}
    ${NotificationFieldsFragmentDoc}`;
export const NotificationScheduleFieldsFragmentDoc = gql`
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
export const CreateNotificationSchedulePayloadFieldsFragmentDoc = gql`
    """Create notification schedule payload."""
fragment CreateNotificationSchedulePayloadFields on CreateNotificationSchedulePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const UpdateNotificationSchedulePayloadFieldsFragmentDoc = gql`
    """Update notification schedule payload."""
fragment UpdateNotificationSchedulePayloadFields on UpdateNotificationSchedulePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const DeleteNotificationSchedulePayloadFieldsFragmentDoc = gql`
    """Delete notification schedule payload."""
fragment DeleteNotificationSchedulePayloadFields on DeleteNotificationSchedulePayload {
  success
  message
  deletedExecutionCount
}
    `;
export const DuplicateNotificationSchedulePayloadFieldsFragmentDoc = gql`
    """Duplicate notification schedule payload."""
fragment DuplicateNotificationSchedulePayloadFields on DuplicateNotificationSchedulePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const ToggleScheduleActivePayloadFieldsFragmentDoc = gql`
    """Toggle schedule active payload."""
fragment ToggleScheduleActivePayloadFields on ToggleScheduleActivePayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const BulkToggleActivePayloadFieldsFragmentDoc = gql`
    """Bulk toggle active payload."""
fragment BulkToggleActivePayloadFields on BulkToggleActivePayload {
  success
  updatedCount
}
    `;
export const BulkDeleteNotificationSchedulesPayloadFieldsFragmentDoc = gql`
    """Bulk delete notification schedules payload."""
fragment BulkDeleteNotificationSchedulesPayloadFields on BulkDeleteNotificationSchedulesPayload {
  success
  requestedCount
  deletedCount
  notFoundIds
}
    `;
export const UpdateLastRunPayloadFieldsFragmentDoc = gql`
    """Update last run payload."""
fragment UpdateLastRunPayloadFields on UpdateLastRunPayload {
  schedule {
    ...NotificationScheduleFields
  }
}
    ${NotificationScheduleFieldsFragmentDoc}`;
export const SendMobileNotificationsPayloadFieldsFragmentDoc = gql`
    """Send mobile notifications payload."""
fragment SendMobileNotificationsPayloadFields on SendMobileNotificationsPayload {
  success
  sent
  failed
  total
}
    `;
export const TrackDeliveryStartPayloadFieldsFragmentDoc = gql`
    """Track delivery start payload."""
fragment TrackDeliveryStartPayloadFields on TrackDeliveryStartPayload {
  success
}
    `;
export const TrackDeliveryCompletePayloadFieldsFragmentDoc = gql`
    """Track delivery complete payload."""
fragment TrackDeliveryCompletePayloadFields on TrackDeliveryCompletePayload {
  success
}
    `;
export const TrackDeliveryFailurePayloadFieldsFragmentDoc = gql`
    """Track delivery failure payload."""
fragment TrackDeliveryFailurePayloadFields on TrackDeliveryFailurePayload {
  success
}
    `;
export const DeleteActivityResultFieldsFragmentDoc = gql`
    """Delete activity result."""
fragment DeleteActivityResultFields on DeleteActivityResult {
  success
}
    `;
export const ReactionCountsFieldsFragmentDoc = gql`
    """Reaction counts by type."""
fragment ReactionCountsFields on ReactionCounts {
  clap
  fire
  heart
  star
}
    `;
export const ReactionsSummaryFieldsFragmentDoc = gql`
    """Reactions summary on activities."""
fragment ReactionsSummaryFields on ReactionsSummary {
  total
  myReactions
  counts {
    ...ReactionCountsFields
  }
}
    ${ReactionCountsFieldsFragmentDoc}`;
export const ToggleReactionResultFieldsFragmentDoc = gql`
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
export const SubmitVotePayloadFieldsFragmentDoc = gql`
    """Submit vote payload."""
fragment SubmitVotePayloadFields on SubmitVotePayload {
  vote {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const SubmitVotesPayloadFieldsFragmentDoc = gql`
    """Submit votes payload."""
fragment SubmitVotesPayloadFields on SubmitVotesPayload {
  totalVotesCast
  votes {
    ...ChallengeVoteFields
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;
export const ForceEndVotingPayloadFieldsFragmentDoc = gql`
    """Force end voting payload."""
fragment ForceEndVotingPayloadFields on ForceEndVotingPayload {
  success
  challengeId
  challengeStatus
  finalized
  totalVotes
}
    `;
export const DeleteTripResultFieldsFragmentDoc = gql`
    """Delete trip result."""
fragment DeleteTripResultFields on DeleteTripResult {
  success
}
    `;
export const SharingUserFieldsFragmentDoc = gql`
    """User info for location sharing."""
fragment SharingUserFields on SharingUserInfo {
  id
  firstName
  lastName
}
    `;
export const LocationFieldsFragmentDoc = gql`
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
export const UpdateLocationPayloadFieldsFragmentDoc = gql`
    """Update location payload."""
fragment UpdateLocationPayloadFields on UpdateLocationPayload {
  location {
    ...LocationFields
  }
}
    ${LocationFieldsFragmentDoc}`;
export const LocationSharingSettingsFieldsFragmentDoc = gql`
    """Location sharing settings."""
fragment LocationSharingSettingsFields on LocationSharingSettings {
  isSharingLocation
  usersToShareWith {
    ...SharingUserFields
  }
}
    ${SharingUserFieldsFragmentDoc}`;
export const UpdateSharingSettingsPayloadFieldsFragmentDoc = gql`
    """Update sharing settings payload."""
fragment UpdateSharingSettingsPayloadFields on UpdateSharingSettingsPayload {
  settings {
    ...LocationSharingSettingsFields
  }
}
    ${LocationSharingSettingsFieldsFragmentDoc}`;
export const SharingUserPayloadFieldsFragmentDoc = gql`
    """Sharing user payload."""
fragment SharingUserPayloadFields on SharingUserPayload {
  location {
    ...LocationFields
  }
}
    ${LocationFieldsFragmentDoc}`;
export const TotalAvailablePointsPayloadFieldsFragmentDoc = gql`
    """Total available points payload."""
fragment TotalAvailablePointsPayloadFields on TotalAvailablePointsPayload {
  totalPoints
}
    `;
export const CheckInactiveUsersPayloadFieldsFragmentDoc = gql`
    """Check inactive users payload."""
fragment CheckInactiveUsersPayloadFields on CheckInactiveUsersPayload {
  checked
  notified
  skipped
  errors
}
    `;
export const DownloadUrlResultFieldsFragmentDoc = gql`
    """Download URL result."""
fragment DownloadUrlResultFields on DownloadUrlResult {
  signedUrl
  expiresAt
}
    `;
export const UploadUrlResultFieldsFragmentDoc = gql`
    """Upload URL result."""
fragment UploadUrlResultFields on UploadUrlResult {
  bucket
  storagePath
  objectPath
  resumableUrl
  token
}
    `;
export const PublicUrlResultFieldsFragmentDoc = gql`
    """Public URL result."""
fragment PublicUrlResultFields on PublicUrlResult {
  publicUrl
}
    `;
export const ExecutionHistoryNotificationFieldsFragmentDoc = gql`
    """Notification info in execution history."""
fragment ExecutionHistoryNotificationFields on ExecutionHistoryNotification {
  id
  title
  body
  createdAt
}
    `;
export const ExecutionHistoryEntryFieldsFragmentDoc = gql`
    """Execution history entry for schedules."""
fragment ExecutionHistoryEntryFields on ExecutionHistoryEntry {
  id
  executedAt
  notification {
    ...ExecutionHistoryNotificationFields
  }
}
    ${ExecutionHistoryNotificationFieldsFragmentDoc}`;
export const ExecutionHistoryResultFieldsFragmentDoc = gql`
    """Execution history result."""
fragment ExecutionHistoryResultFields on ExecutionHistoryResult {
  executions {
    ...ExecutionHistoryEntryFields
  }
}
    ${ExecutionHistoryEntryFieldsFragmentDoc}`;
export const GetActivityDocument = gql`
    query GetActivity($id: ID!) {
  activity(id: $id) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useGetActivityQuery(options: Omit<Urql.UseQueryArgs<GetActivityQueryVariables>, 'query'>) {
  return Urql.useQuery<GetActivityQuery, GetActivityQueryVariables>({ query: GetActivityDocument, ...options });
};
export const GetActivitiesByTripDocument = gql`
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

export function useGetActivitiesByTripQuery(options: Omit<Urql.UseQueryArgs<GetActivitiesByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetActivitiesByTripQuery, GetActivitiesByTripQueryVariables>({ query: GetActivitiesByTripDocument, ...options });
};
export const GetActivitiesByTripModerationDocument = gql`
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

export function useGetActivitiesByTripModerationQuery(options: Omit<Urql.UseQueryArgs<GetActivitiesByTripModerationQueryVariables>, 'query'>) {
  return Urql.useQuery<GetActivitiesByTripModerationQuery, GetActivitiesByTripModerationQueryVariables>({ query: GetActivitiesByTripModerationDocument, ...options });
};
export const CreateCustomActivityDocument = gql`
    mutation CreateCustomActivity($input: CreateCustomActivityInput!) {
  createCustomActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useCreateCustomActivityMutation() {
  return Urql.useMutation<CreateCustomActivityMutation, CreateCustomActivityMutationVariables>(CreateCustomActivityDocument);
};
export const CreateRankChangeActivityDocument = gql`
    mutation CreateRankChangeActivity($input: CreateRankChangeActivityInput!) {
  createRankChangeActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useCreateRankChangeActivityMutation() {
  return Urql.useMutation<CreateRankChangeActivityMutation, CreateRankChangeActivityMutationVariables>(CreateRankChangeActivityDocument);
};
export const CreateSubmissionActivityDocument = gql`
    mutation CreateSubmissionActivity($input: CreateSubmissionActivityInput!) {
  createSubmissionActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useCreateSubmissionActivityMutation() {
  return Urql.useMutation<CreateSubmissionActivityMutation, CreateSubmissionActivityMutationVariables>(CreateSubmissionActivityDocument);
};
export const UpdateActivityDocument = gql`
    mutation UpdateActivity($input: UpdateActivityInput!) {
  updateActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useUpdateActivityMutation() {
  return Urql.useMutation<UpdateActivityMutation, UpdateActivityMutationVariables>(UpdateActivityDocument);
};
export const DeleteActivityDocument = gql`
    mutation DeleteActivity($id: ID!) {
  deleteActivity(input: {activityId: $id}) {
    ...DeleteActivityResultFields
  }
}
    ${DeleteActivityResultFieldsFragmentDoc}`;

export function useDeleteActivityMutation() {
  return Urql.useMutation<DeleteActivityMutation, DeleteActivityMutationVariables>(DeleteActivityDocument);
};
export const HideActivityDocument = gql`
    mutation HideActivity($id: ID!, $reason: String) {
  hideActivity(input: {activityId: $id, reason: $reason}) {
    ...HiddenActivityFields
  }
}
    ${HiddenActivityFieldsFragmentDoc}`;

export function useHideActivityMutation() {
  return Urql.useMutation<HideActivityMutation, HideActivityMutationVariables>(HideActivityDocument);
};
export const UnhideActivityDocument = gql`
    mutation UnhideActivity($id: ID!) {
  unhideActivity(input: {activityId: $id}) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useUnhideActivityMutation() {
  return Urql.useMutation<UnhideActivityMutation, UnhideActivityMutationVariables>(UnhideActivityDocument);
};
export const SetActivityPinnedDocument = gql`
    mutation SetActivityPinned($id: ID!, $isPinned: Boolean!) {
  setActivityPinned(input: {activityId: $id, isPinned: $isPinned}) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useSetActivityPinnedMutation() {
  return Urql.useMutation<SetActivityPinnedMutation, SetActivityPinnedMutationVariables>(SetActivityPinnedDocument);
};
export const ToggleActivityReactionDocument = gql`
    mutation ToggleActivityReaction($activityId: ID!, $reaction: ReactionType!) {
  toggleActivityReaction(
    input: {activityId: $activityId, reactionType: $reaction}
  ) {
    ...ToggleReactionResultFields
  }
}
    ${ToggleReactionResultFieldsFragmentDoc}`;

export function useToggleActivityReactionMutation() {
  return Urql.useMutation<ToggleActivityReactionMutation, ToggleActivityReactionMutationVariables>(ToggleActivityReactionDocument);
};
export const GetChallengeDocument = gql`
    query GetChallenge($id: ID!, $tripId: ID!) {
  challenge(id: $id, tripId: $tripId) {
    ...ChallengeFields
  }
}
    ${ChallengeFieldsFragmentDoc}`;

export function useGetChallengeQuery(options: Omit<Urql.UseQueryArgs<GetChallengeQueryVariables>, 'query'>) {
  return Urql.useQuery<GetChallengeQuery, GetChallengeQueryVariables>({ query: GetChallengeDocument, ...options });
};
export const GetChallengesByTripDocument = gql`
    query GetChallengesByTrip($tripId: ID!, $limit: Int = 30, $offset: Int = 0) {
  challengesByTrip(tripId: $tripId, pagination: {limit: $limit, offset: $offset}) {
    challenges {
      ...ChallengeSummaryFields
    }
    pagination {
      total
      limit
      offset
      hasMore
    }
  }
}
    ${ChallengeSummaryFieldsFragmentDoc}`;

export function useGetChallengesByTripQuery(options: Omit<Urql.UseQueryArgs<GetChallengesByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetChallengesByTripQuery, GetChallengesByTripQueryVariables>({ query: GetChallengesByTripDocument, ...options });
};
export const GetChallengeSubmissionDocument = gql`
    query GetChallengeSubmission($id: ID!) {
  challengeSubmission(id: $id) {
    ...ChallengeSubmissionFields
  }
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;

export function useGetChallengeSubmissionQuery(options: Omit<Urql.UseQueryArgs<GetChallengeSubmissionQueryVariables>, 'query'>) {
  return Urql.useQuery<GetChallengeSubmissionQuery, GetChallengeSubmissionQueryVariables>({ query: GetChallengeSubmissionDocument, ...options });
};
export const GetChallengeSubmissionsDocument = gql`
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

export function useGetChallengeSubmissionsQuery(options: Omit<Urql.UseQueryArgs<GetChallengeSubmissionsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetChallengeSubmissionsQuery, GetChallengeSubmissionsQueryVariables>({ query: GetChallengeSubmissionsDocument, ...options });
};
export const GetChallengeSubmissionByChallengeAndGroupDocument = gql`
    query GetChallengeSubmissionByChallengeAndGroup($challengeId: ID!, $groupId: ID!) {
  challengeSubmissionByChallengeAndGroup(
    challengeId: $challengeId
    groupId: $groupId
  ) {
    ...ChallengeSubmissionFields
  }
}
    ${ChallengeSubmissionFieldsFragmentDoc}`;

export function useGetChallengeSubmissionByChallengeAndGroupQuery(options: Omit<Urql.UseQueryArgs<GetChallengeSubmissionByChallengeAndGroupQueryVariables>, 'query'>) {
  return Urql.useQuery<GetChallengeSubmissionByChallengeAndGroupQuery, GetChallengeSubmissionByChallengeAndGroupQueryVariables>({ query: GetChallengeSubmissionByChallengeAndGroupDocument, ...options });
};
export const GetVotesByChallengeDocument = gql`
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

export function useGetVotesByChallengeQuery(options: Omit<Urql.UseQueryArgs<GetVotesByChallengeQueryVariables>, 'query'>) {
  return Urql.useQuery<GetVotesByChallengeQuery, GetVotesByChallengeQueryVariables>({ query: GetVotesByChallengeDocument, ...options });
};
export const GetMyVotesDocument = gql`
    query GetMyVotes($challengeId: ID!, $tripId: ID!) {
  myVotes(input: {challengeId: $challengeId, tripId: $tripId}) {
    votes {
      ...ChallengeVoteFields
    }
    totalVotes
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export function useGetMyVotesQuery(options: Omit<Urql.UseQueryArgs<GetMyVotesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMyVotesQuery, GetMyVotesQueryVariables>({ query: GetMyVotesDocument, ...options });
};
export const GetVotingProgressDocument = gql`
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

export function useGetVotingProgressQuery(options: Omit<Urql.UseQueryArgs<GetVotingProgressQueryVariables>, 'query'>) {
  return Urql.useQuery<GetVotingProgressQuery, GetVotingProgressQueryVariables>({ query: GetVotingProgressDocument, ...options });
};
export const GetJudgedStaffVotingProgressDocument = gql`
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

export function useGetJudgedStaffVotingProgressQuery(options: Omit<Urql.UseQueryArgs<GetJudgedStaffVotingProgressQueryVariables>, 'query'>) {
  return Urql.useQuery<GetJudgedStaffVotingProgressQuery, GetJudgedStaffVotingProgressQueryVariables>({ query: GetJudgedStaffVotingProgressDocument, ...options });
};
export const CreateChallengeSubmissionDocument = gql`
    mutation CreateChallengeSubmission($input: CreateSubmissionInput!) {
  createChallengeSubmission(input: $input) {
    ...ChallengeSubmissionCreateResultFields
  }
}
    ${ChallengeSubmissionCreateResultFieldsFragmentDoc}`;

export function useCreateChallengeSubmissionMutation() {
  return Urql.useMutation<CreateChallengeSubmissionMutation, CreateChallengeSubmissionMutationVariables>(CreateChallengeSubmissionDocument);
};
export const UpdateChallengeSubmissionDocument = gql`
    mutation UpdateChallengeSubmission($input: UpdateSubmissionInput!) {
  updateChallengeSubmission(input: $input) {
    ...ChallengeSubmissionUpdateResultFields
  }
}
    ${ChallengeSubmissionUpdateResultFieldsFragmentDoc}`;

export function useUpdateChallengeSubmissionMutation() {
  return Urql.useMutation<UpdateChallengeSubmissionMutation, UpdateChallengeSubmissionMutationVariables>(UpdateChallengeSubmissionDocument);
};
export const DeleteChallengeSubmissionDocument = gql`
    mutation DeleteChallengeSubmission($id: ID!) {
  deleteChallengeSubmission(submissionId: $id)
}
    `;

export function useDeleteChallengeSubmissionMutation() {
  return Urql.useMutation<DeleteChallengeSubmissionMutation, DeleteChallengeSubmissionMutationVariables>(DeleteChallengeSubmissionDocument);
};
export const CreateChallengeActivityDocument = gql`
    mutation CreateChallengeActivity($input: CreateChallengeActivityInput!) {
  createChallengeActivity(input: $input) {
    ...ActivityFields
  }
}
    ${ActivityFieldsFragmentDoc}`;

export function useCreateChallengeActivityMutation() {
  return Urql.useMutation<CreateChallengeActivityMutation, CreateChallengeActivityMutationVariables>(CreateChallengeActivityDocument);
};
export const SubmitVoteDocument = gql`
    mutation SubmitVote($input: SubmitVoteInput!) {
  submitVote(input: $input) {
    vote {
      ...ChallengeVoteFields
    }
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export function useSubmitVoteMutation() {
  return Urql.useMutation<SubmitVoteMutation, SubmitVoteMutationVariables>(SubmitVoteDocument);
};
export const SubmitVotesDocument = gql`
    mutation SubmitVotes($input: SubmitVotesInput!) {
  submitVotes(input: $input) {
    votes {
      ...ChallengeVoteFields
    }
    totalVotesCast
  }
}
    ${ChallengeVoteFieldsFragmentDoc}`;

export function useSubmitVotesMutation() {
  return Urql.useMutation<SubmitVotesMutation, SubmitVotesMutationVariables>(SubmitVotesDocument);
};
export const ForceEndVotingDocument = gql`
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

export function useForceEndVotingMutation() {
  return Urql.useMutation<ForceEndVotingMutation, ForceEndVotingMutationVariables>(ForceEndVotingDocument);
};
export const CreateChallengeDocument = gql`
    mutation CreateChallenge($input: CreateChallengeInput!) {
  createChallenge(input: $input) {
    challenge {
      ...ChallengeSummaryFields
    }
  }
}
    ${ChallengeSummaryFieldsFragmentDoc}`;

export function useCreateChallengeMutation() {
  return Urql.useMutation<CreateChallengeMutation, CreateChallengeMutationVariables>(CreateChallengeDocument);
};
export const UpdateChallengeDocument = gql`
    mutation UpdateChallenge($input: UpdateChallengeInput!) {
  updateChallenge(input: $input) {
    challenge {
      ...ChallengeSummaryFields
    }
  }
}
    ${ChallengeSummaryFieldsFragmentDoc}`;

export function useUpdateChallengeMutation() {
  return Urql.useMutation<UpdateChallengeMutation, UpdateChallengeMutationVariables>(UpdateChallengeDocument);
};
export const DeleteChallengeDocument = gql`
    mutation DeleteChallenge($id: ID!, $tripId: ID!) {
  deleteChallenge(id: $id, tripId: $tripId) {
    success
  }
}
    `;

export function useDeleteChallengeMutation() {
  return Urql.useMutation<DeleteChallengeMutation, DeleteChallengeMutationVariables>(DeleteChallengeDocument);
};
export const GetCoinStatisticsDocument = gql`
    query GetCoinStatistics($tripId: ID!) {
  coinStatistics(input: {tripId: $tripId}) {
    ...CoinStatisticsFields
  }
}
    ${CoinStatisticsFieldsFragmentDoc}`;

export function useGetCoinStatisticsQuery(options: Omit<Urql.UseQueryArgs<GetCoinStatisticsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCoinStatisticsQuery, GetCoinStatisticsQueryVariables>({ query: GetCoinStatisticsDocument, ...options });
};
export const GetCoinQuickStatsDocument = gql`
    query GetCoinQuickStats($tripId: ID!) {
  coinQuickStats(input: {tripId: $tripId}) {
    ...CoinQuickStatsFields
  }
}
    ${CoinQuickStatsFieldsFragmentDoc}`;

export function useGetCoinQuickStatsQuery(options: Omit<Urql.UseQueryArgs<GetCoinQuickStatsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCoinQuickStatsQuery, GetCoinQuickStatsQueryVariables>({ query: GetCoinQuickStatsDocument, ...options });
};
export const GetCoinAdditionalInsightsDocument = gql`
    query GetCoinAdditionalInsights($tripId: ID!) {
  coinAdditionalInsights(input: {tripId: $tripId}) {
    ...CoinAdditionalInsightsFields
  }
}
    ${CoinAdditionalInsightsFieldsFragmentDoc}`;

export function useGetCoinAdditionalInsightsQuery(options: Omit<Urql.UseQueryArgs<GetCoinAdditionalInsightsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCoinAdditionalInsightsQuery, GetCoinAdditionalInsightsQueryVariables>({ query: GetCoinAdditionalInsightsDocument, ...options });
};
export const GetCoinTransactionsDocument = gql`
    query GetCoinTransactions($tripId: ID!, $limit: Int, $offset: Int) {
  coinTransactions(
    input: {tripId: $tripId, pagination: {limit: $limit, offset: $offset}}
  ) {
    ...CoinTransactionsConnectionFields
  }
}
    ${CoinTransactionsConnectionFieldsFragmentDoc}`;

export function useGetCoinTransactionsQuery(options: Omit<Urql.UseQueryArgs<GetCoinTransactionsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCoinTransactionsQuery, GetCoinTransactionsQueryVariables>({ query: GetCoinTransactionsDocument, ...options });
};
export const GetMyCoinTransactionsDocument = gql`
    query GetMyCoinTransactions($tripId: ID!, $groupId: ID, $limit: Int) {
  myCoinTransactions(input: {tripId: $tripId, groupId: $groupId, limit: $limit}) {
    ...CoinTransactionFields
  }
}
    ${CoinTransactionFieldsFragmentDoc}`;

export function useGetMyCoinTransactionsQuery(options: Omit<Urql.UseQueryArgs<GetMyCoinTransactionsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMyCoinTransactionsQuery, GetMyCoinTransactionsQueryVariables>({ query: GetMyCoinTransactionsDocument, ...options });
};
export const AddCoinsDocument = gql`
    mutation AddCoins($input: AddCoinsInput!) {
  addCoins(input: $input) {
    ...CoinTransactionResultFields
  }
}
    ${CoinTransactionResultFieldsFragmentDoc}`;

export function useAddCoinsMutation() {
  return Urql.useMutation<AddCoinsMutation, AddCoinsMutationVariables>(AddCoinsDocument);
};
export const RemoveCoinsDocument = gql`
    mutation RemoveCoins($input: RemoveCoinsInput!) {
  removeCoins(input: $input) {
    ...CoinTransactionResultFields
  }
}
    ${CoinTransactionResultFieldsFragmentDoc}`;

export function useRemoveCoinsMutation() {
  return Urql.useMutation<RemoveCoinsMutation, RemoveCoinsMutationVariables>(RemoveCoinsDocument);
};
export const CreateUploadUrlDocument = gql`
    mutation CreateUploadUrl($input: CreateUploadUrlInput!) {
  createUploadUrl(input: $input) {
    ...UploadUrlResultFields
  }
}
    ${UploadUrlResultFieldsFragmentDoc}`;

export function useCreateUploadUrlMutation() {
  return Urql.useMutation<CreateUploadUrlMutation, CreateUploadUrlMutationVariables>(CreateUploadUrlDocument);
};
export const CreateDownloadUrlDocument = gql`
    query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
  createDownloadUrl(input: $input) {
    ...DownloadUrlResultFields
  }
}
    ${DownloadUrlResultFieldsFragmentDoc}`;

export function useCreateDownloadUrlQuery(options: Omit<Urql.UseQueryArgs<CreateDownloadUrlQueryVariables>, 'query'>) {
  return Urql.useQuery<CreateDownloadUrlQuery, CreateDownloadUrlQueryVariables>({ query: CreateDownloadUrlDocument, ...options });
};
export const GetGroupJoinRequestDocument = gql`
    query GetGroupJoinRequest($groupId: ID!) {
  groupsByTrip(tripId: $groupId, pagination: {limit: 1}) {
    groups {
      id
      name
      code
    }
  }
}
    `;

export function useGetGroupJoinRequestQuery(options: Omit<Urql.UseQueryArgs<GetGroupJoinRequestQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupJoinRequestQuery, GetGroupJoinRequestQueryVariables>({ query: GetGroupJoinRequestDocument, ...options });
};
export const GetPendingGroupJoinRequestsDocument = gql`
    query GetPendingGroupJoinRequests($groupId: ID!) {
  groupsByTrip(tripId: $groupId, pagination: {limit: 0}) {
    groups {
      id
      name
      code
    }
  }
}
    `;

export function useGetPendingGroupJoinRequestsQuery(options: Omit<Urql.UseQueryArgs<GetPendingGroupJoinRequestsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetPendingGroupJoinRequestsQuery, GetPendingGroupJoinRequestsQueryVariables>({ query: GetPendingGroupJoinRequestsDocument, ...options });
};
export const LeaveGroupDocument = gql`
    mutation LeaveGroup($input: RemoveUserFromGroupInput!) {
  removeUserFromGroup(input: $input) {
    group {
      id
      name
      code
      description
      image
      coins
      isActive
      status
      tripId
      organizerId
      createdAt
      updatedAt
    }
  }
}
    `;

export function useLeaveGroupMutation() {
  return Urql.useMutation<LeaveGroupMutation, LeaveGroupMutationVariables>(LeaveGroupDocument);
};
export const RequestToJoinGroupDocument = gql`
    mutation RequestToJoinGroup($groupId: ID!, $userId: ID!) {
  assignUserToGroup(input: {groupId: $groupId, userId: $userId}) {
    group {
      id
      name
      code
    }
  }
}
    `;

export function useRequestToJoinGroupMutation() {
  return Urql.useMutation<RequestToJoinGroupMutation, RequestToJoinGroupMutationVariables>(RequestToJoinGroupDocument);
};
export const CancelGroupJoinRequestDocument = gql`
    mutation CancelGroupJoinRequest($groupId: ID!) {
  deleteGroup(id: $groupId) {
    success
  }
}
    `;

export function useCancelGroupJoinRequestMutation() {
  return Urql.useMutation<CancelGroupJoinRequestMutation, CancelGroupJoinRequestMutationVariables>(CancelGroupJoinRequestDocument);
};
export const RespondToGroupJoinRequestDocument = gql`
    mutation RespondToGroupJoinRequest($requestId: ID!, $action: String!, $message: String) {
  updateGroup(input: {id: $requestId, tripId: $requestId}) {
    group {
      id
      name
    }
  }
}
    `;

export function useRespondToGroupJoinRequestMutation() {
  return Urql.useMutation<RespondToGroupJoinRequestMutation, RespondToGroupJoinRequestMutationVariables>(RespondToGroupJoinRequestDocument);
};
export const GetGroupDocument = gql`
    query GetGroup($id: ID!, $tripId: ID!) {
  groupsByTrip(tripId: $tripId, pagination: {limit: 100}) {
    groups {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useGetGroupQuery(options: Omit<Urql.UseQueryArgs<GetGroupQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupQuery, GetGroupQueryVariables>({ query: GetGroupDocument, ...options });
};
export const GetGroupByCodeDocument = gql`
    query GetGroupByCode($code: String!) {
  groupByCode(code: $code) {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useGetGroupByCodeQuery(options: Omit<Urql.UseQueryArgs<GetGroupByCodeQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupByCodeQuery, GetGroupByCodeQueryVariables>({ query: GetGroupByCodeDocument, ...options });
};
export const GetGroupsDocument = gql`
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

export function useGetGroupsQuery(options?: Omit<Urql.UseQueryArgs<GetGroupsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupsQuery, GetGroupsQueryVariables>({ query: GetGroupsDocument, ...options });
};
export const GetGroupsByTripDocument = gql`
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

export function useGetGroupsByTripQuery(options: Omit<Urql.UseQueryArgs<GetGroupsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupsByTripQuery, GetGroupsByTripQueryVariables>({ query: GetGroupsByTripDocument, ...options });
};
export const GetGroupsByOrganizerDocument = gql`
    query GetGroupsByOrganizer($organizerId: ID!) {
  groupsByOrganizer(organizerId: $organizerId) {
    ...GroupFields
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useGetGroupsByOrganizerQuery(options: Omit<Urql.UseQueryArgs<GetGroupsByOrganizerQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupsByOrganizerQuery, GetGroupsByOrganizerQueryVariables>({ query: GetGroupsByOrganizerDocument, ...options });
};
export const GetGroupNamesByTripDocument = gql`
    query GetGroupNamesByTrip($tripId: ID!) {
  groupNamesByTrip(tripId: $tripId) {
    ...GroupSummaryFields
  }
}
    ${GroupSummaryFieldsFragmentDoc}`;

export function useGetGroupNamesByTripQuery(options: Omit<Urql.UseQueryArgs<GetGroupNamesByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupNamesByTripQuery, GetGroupNamesByTripQueryVariables>({ query: GetGroupNamesByTripDocument, ...options });
};
export const GetGroupRankingDocument = gql`
    query GetGroupRanking($tripId: ID!) {
  groupRanking(tripId: $tripId) {
    currentDate
    data {
      ...GroupRankingFields
    }
  }
}
    ${GroupRankingFieldsFragmentDoc}`;

export function useGetGroupRankingQuery(options: Omit<Urql.UseQueryArgs<GetGroupRankingQueryVariables>, 'query'>) {
  return Urql.useQuery<GetGroupRankingQuery, GetGroupRankingQueryVariables>({ query: GetGroupRankingDocument, ...options });
};
export const CreateGroupDocument = gql`
    mutation CreateGroup($input: CreateGroupInput!) {
  createGroup(input: $input) {
    group {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useCreateGroupMutation() {
  return Urql.useMutation<CreateGroupMutation, CreateGroupMutationVariables>(CreateGroupDocument);
};
export const UpdateGroupDocument = gql`
    mutation UpdateGroup($input: UpdateGroupInput!) {
  updateGroup(input: $input) {
    group {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useUpdateGroupMutation() {
  return Urql.useMutation<UpdateGroupMutation, UpdateGroupMutationVariables>(UpdateGroupDocument);
};
export const DeleteGroupDocument = gql`
    mutation DeleteGroup($id: ID!) {
  deleteGroup(id: $id) {
    success
  }
}
    `;

export function useDeleteGroupMutation() {
  return Urql.useMutation<DeleteGroupMutation, DeleteGroupMutationVariables>(DeleteGroupDocument);
};
export const AddUserToSharingDocument = gql`
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

export function useAddUserToSharingMutation() {
  return Urql.useMutation<AddUserToSharingMutation, AddUserToSharingMutationVariables>(AddUserToSharingDocument);
};
export const RemoveUserFromSharingDocument = gql`
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

export function useRemoveUserFromSharingMutation() {
  return Urql.useMutation<RemoveUserFromSharingMutation, RemoveUserFromSharingMutationVariables>(RemoveUserFromSharingDocument);
};
export const UpdateSharingSettingsDocument = gql`
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

export function useUpdateSharingSettingsMutation() {
  return Urql.useMutation<UpdateSharingSettingsMutation, UpdateSharingSettingsMutationVariables>(UpdateSharingSettingsDocument);
};
export const AssignUserToGroupDocument = gql`
    mutation AssignUserToGroup($input: AssignUserToGroupInput!) {
  assignUserToGroup(input: $input) {
    group {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useAssignUserToGroupMutation() {
  return Urql.useMutation<AssignUserToGroupMutation, AssignUserToGroupMutationVariables>(AssignUserToGroupDocument);
};
export const RemoveUserFromGroupDocument = gql`
    mutation RemoveUserFromGroup($input: RemoveUserFromGroupInput!) {
  removeUserFromGroup(input: $input) {
    group {
      ...GroupFields
    }
  }
}
    ${GroupFieldsFragmentDoc}`;

export function useRemoveUserFromGroupMutation() {
  return Urql.useMutation<RemoveUserFromGroupMutation, RemoveUserFromGroupMutationVariables>(RemoveUserFromGroupDocument);
};
export const GetLocationSharingSettingsDocument = gql`
    """
Get current user's location sharing settings.
Returns: Sharing settings including enabled status and users to share with.
"""
query GetLocationSharingSettings {
  mySharingSettings {
    isSharingLocation
    usersToShareWith {
      ...SharingUserFields
    }
  }
}
    ${SharingUserFieldsFragmentDoc}`;

export function useGetLocationSharingSettingsQuery(options?: Omit<Urql.UseQueryArgs<GetLocationSharingSettingsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetLocationSharingSettingsQuery, GetLocationSharingSettingsQueryVariables>({ query: GetLocationSharingSettingsDocument, ...options });
};
export const GetSharedFriendLocationsDocument = gql`
    """
Get friends' locations.
Returns: Direct array of friend locations (not Relay-style connection).
"""
query GetSharedFriendLocations {
  friendsLocations {
    locations {
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
    total
  }
}
    `;

export function useGetSharedFriendLocationsQuery(options?: Omit<Urql.UseQueryArgs<GetSharedFriendLocationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetSharedFriendLocationsQuery, GetSharedFriendLocationsQueryVariables>({ query: GetSharedFriendLocationsDocument, ...options });
};
export const SetLocationSharingSettingsDocument = gql`
    """
Update location sharing settings.
Requires: isSharingLocation boolean. Optional: userIdsToShareWith list.
Returns: Updated sharing settings.
"""
mutation SetLocationSharingSettings($input: UpdateSharingSettingsInput!) {
  updateSharingSettings(input: $input) {
    settings {
      isSharingLocation
      usersToShareWith {
        ...SharingUserFields
      }
    }
  }
}
    ${SharingUserFieldsFragmentDoc}`;

export function useSetLocationSharingSettingsMutation() {
  return Urql.useMutation<SetLocationSharingSettingsMutation, SetLocationSharingSettingsMutationVariables>(SetLocationSharingSettingsDocument);
};
export const AddSharedUserDocument = gql`
    """
Add a user to location sharing list.
Requires: userId to add.
Returns: Location with updated sharing list.
"""
mutation AddSharedUser($input: AddSharingUserInput!) {
  addUserToSharing(input: $input) {
    location {
      id
      userId
      latitude
      longitude
      isSharingLocation
      usersToShareWith {
        ...SharingUserFields
      }
      timestamp
    }
  }
}
    ${SharingUserFieldsFragmentDoc}`;

export function useAddSharedUserMutation() {
  return Urql.useMutation<AddSharedUserMutation, AddSharedUserMutationVariables>(AddSharedUserDocument);
};
export const RemoveSharedUserDocument = gql`
    """
Remove a user from location sharing list.
Requires: userId to remove.
Returns: Location with updated sharing list.
"""
mutation RemoveSharedUser($input: RemoveSharingUserInput!) {
  removeUserFromSharing(input: $input) {
    location {
      id
      userId
      latitude
      longitude
      isSharingLocation
      usersToShareWith {
        ...SharingUserFields
      }
      timestamp
    }
  }
}
    ${SharingUserFieldsFragmentDoc}`;

export function useRemoveSharedUserMutation() {
  return Urql.useMutation<RemoveSharedUserMutation, RemoveSharedUserMutationVariables>(RemoveSharedUserDocument);
};
export const GetMyLocationDocument = gql`
    """
Get current user's location.
Returns: Location object or null if not set.
"""
query GetMyLocation {
  myLocation {
    ...LocationFields
  }
}
    ${LocationFieldsFragmentDoc}`;

export function useGetMyLocationQuery(options?: Omit<Urql.UseQueryArgs<GetMyLocationQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMyLocationQuery, GetMyLocationQueryVariables>({ query: GetMyLocationDocument, ...options });
};
export const GetMySharingSettingsDocument = gql`
    """
Get current user's location sharing settings.
Returns: Sharing settings including enabled status and users to share with.
"""
query GetMySharingSettings {
  mySharingSettings {
    ...LocationSharingSettingsFields
  }
}
    ${LocationSharingSettingsFieldsFragmentDoc}`;

export function useGetMySharingSettingsQuery(options?: Omit<Urql.UseQueryArgs<GetMySharingSettingsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMySharingSettingsQuery, GetMySharingSettingsQueryVariables>({ query: GetMySharingSettingsDocument, ...options });
};
export const GetFriendsLocationsDocument = gql`
    """
Get friends' locations.
Returns: Connection of friend locations for the current user.
"""
query GetFriendsLocations {
  friendsLocations {
    ...FriendsLocationsConnectionFields
  }
}
    ${FriendsLocationsConnectionFieldsFragmentDoc}`;

export function useGetFriendsLocationsQuery(options?: Omit<Urql.UseQueryArgs<GetFriendsLocationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFriendsLocationsQuery, GetFriendsLocationsQueryVariables>({ query: GetFriendsLocationsDocument, ...options });
};
export const UpdateLocationDocument = gql`
    """
Update current user's location.
Requires: latitude, longitude. Optional: accuracy, altitude, etc.
Returns: Updated location.
"""
mutation UpdateLocation($input: UpdateLocationInput!) {
  updateLocation(input: $input) {
    ...UpdateLocationPayloadFields
  }
}
    ${UpdateLocationPayloadFieldsFragmentDoc}`;

export function useUpdateLocationMutation() {
  return Urql.useMutation<UpdateLocationMutation, UpdateLocationMutationVariables>(UpdateLocationDocument);
};
export const UpdateLocationSharingSettingsDocument = gql`
    """
Update location sharing settings.
Requires: isSharingLocation boolean.
Optional: userIdsToShareWith list.
Returns: Updated sharing settings.
"""
mutation UpdateLocationSharingSettings($input: UpdateSharingSettingsInput!) {
  updateSharingSettings(input: $input) {
    ...UpdateSharingSettingsPayloadFields
  }
}
    ${UpdateSharingSettingsPayloadFieldsFragmentDoc}`;

export function useUpdateLocationSharingSettingsMutation() {
  return Urql.useMutation<UpdateLocationSharingSettingsMutation, UpdateLocationSharingSettingsMutationVariables>(UpdateLocationSharingSettingsDocument);
};
export const AddUserToLocationSharingDocument = gql`
    """
Add a user to location sharing list.
Requires: userId to add.
Returns: Location with updated sharing list.
"""
mutation AddUserToLocationSharing($input: AddSharingUserInput!) {
  addUserToSharing(input: $input) {
    location {
      ...LocationFields
    }
  }
}
    ${LocationFieldsFragmentDoc}`;

export function useAddUserToLocationSharingMutation() {
  return Urql.useMutation<AddUserToLocationSharingMutation, AddUserToLocationSharingMutationVariables>(AddUserToLocationSharingDocument);
};
export const RemoveUserFromLocationSharingDocument = gql`
    """
Remove a user from location sharing list.
Requires: userId to remove.
Returns: Location with updated sharing list.
"""
mutation RemoveUserFromLocationSharing($input: RemoveSharingUserInput!) {
  removeUserFromSharing(input: $input) {
    location {
      ...LocationFields
    }
  }
}
    ${LocationFieldsFragmentDoc}`;

export function useRemoveUserFromLocationSharingMutation() {
  return Urql.useMutation<RemoveUserFromLocationSharingMutation, RemoveUserFromLocationSharingMutationVariables>(RemoveUserFromLocationSharingDocument);
};
export const GetNotificationDocument = gql`
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

export function useGetNotificationQuery(options: Omit<Urql.UseQueryArgs<GetNotificationQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationQuery, GetNotificationQueryVariables>({ query: GetNotificationDocument, ...options });
};
export const GetMyNotificationsDocument = gql`
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

export function useGetMyNotificationsQuery(options?: Omit<Urql.UseQueryArgs<GetMyNotificationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetMyNotificationsQuery, GetMyNotificationsQueryVariables>({ query: GetMyNotificationsDocument, ...options });
};
export const GetAllNotificationsDocument = gql`
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

export function useGetAllNotificationsQuery(options?: Omit<Urql.UseQueryArgs<GetAllNotificationsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetAllNotificationsQuery, GetAllNotificationsQueryVariables>({ query: GetAllNotificationsDocument, ...options });
};
export const GetNotificationSchedulesDocument = gql`
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

export function useGetNotificationSchedulesQuery(options?: Omit<Urql.UseQueryArgs<GetNotificationSchedulesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationSchedulesQuery, GetNotificationSchedulesQueryVariables>({ query: GetNotificationSchedulesDocument, ...options });
};
export const GetNotificationScheduleDocument = gql`
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

export function useGetNotificationScheduleQuery(options: Omit<Urql.UseQueryArgs<GetNotificationScheduleQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationScheduleQuery, GetNotificationScheduleQueryVariables>({ query: GetNotificationScheduleDocument, ...options });
};
export const GetActiveNotificationSchedulesDocument = gql`
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

export function useGetActiveNotificationSchedulesQuery(options?: Omit<Urql.UseQueryArgs<GetActiveNotificationSchedulesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetActiveNotificationSchedulesQuery, GetActiveNotificationSchedulesQueryVariables>({ query: GetActiveNotificationSchedulesDocument, ...options });
};
export const GetUpcomingNotificationSchedulesDocument = gql`
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

export function useGetUpcomingNotificationSchedulesQuery(options?: Omit<Urql.UseQueryArgs<GetUpcomingNotificationSchedulesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUpcomingNotificationSchedulesQuery, GetUpcomingNotificationSchedulesQueryVariables>({ query: GetUpcomingNotificationSchedulesDocument, ...options });
};
export const GetNotificationScheduleExecutionHistoryDocument = gql`
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

export function useGetNotificationScheduleExecutionHistoryQuery(options: Omit<Urql.UseQueryArgs<GetNotificationScheduleExecutionHistoryQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationScheduleExecutionHistoryQuery, GetNotificationScheduleExecutionHistoryQueryVariables>({ query: GetNotificationScheduleExecutionHistoryDocument, ...options });
};
export const GetNotificationDeliveriesDocument = gql`
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

export function useGetNotificationDeliveriesQuery(options?: Omit<Urql.UseQueryArgs<GetNotificationDeliveriesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationDeliveriesQuery, GetNotificationDeliveriesQueryVariables>({ query: GetNotificationDeliveriesDocument, ...options });
};
export const GetNotificationDeliveryByNotificationIdDocument = gql`
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

export function useGetNotificationDeliveryByNotificationIdQuery(options: Omit<Urql.UseQueryArgs<GetNotificationDeliveryByNotificationIdQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationDeliveryByNotificationIdQuery, GetNotificationDeliveryByNotificationIdQueryVariables>({ query: GetNotificationDeliveryByNotificationIdDocument, ...options });
};
export const GetFailedDeliveriesDocument = gql`
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

export function useGetFailedDeliveriesQuery(options?: Omit<Urql.UseQueryArgs<GetFailedDeliveriesQueryVariables>, 'query'>) {
  return Urql.useQuery<GetFailedDeliveriesQuery, GetFailedDeliveriesQueryVariables>({ query: GetFailedDeliveriesDocument, ...options });
};
export const GetDeliveryStatsDocument = gql`
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

export function useGetDeliveryStatsQuery(options?: Omit<Urql.UseQueryArgs<GetDeliveryStatsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetDeliveryStatsQuery, GetDeliveryStatsQueryVariables>({ query: GetDeliveryStatsDocument, ...options });
};
export const CreateNotificationDocument = gql`
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

export function useCreateNotificationMutation() {
  return Urql.useMutation<CreateNotificationMutation, CreateNotificationMutationVariables>(CreateNotificationDocument);
};
export const UpdateNotificationDocument = gql`
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

export function useUpdateNotificationMutation() {
  return Urql.useMutation<UpdateNotificationMutation, UpdateNotificationMutationVariables>(UpdateNotificationDocument);
};
export const DeleteNotificationDocument = gql`
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

export function useDeleteNotificationMutation() {
  return Urql.useMutation<DeleteNotificationMutation, DeleteNotificationMutationVariables>(DeleteNotificationDocument);
};
export const CreateNotificationScheduleDocument = gql`
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

export function useCreateNotificationScheduleMutation() {
  return Urql.useMutation<CreateNotificationScheduleMutation, CreateNotificationScheduleMutationVariables>(CreateNotificationScheduleDocument);
};
export const UpdateNotificationScheduleDocument = gql`
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

export function useUpdateNotificationScheduleMutation() {
  return Urql.useMutation<UpdateNotificationScheduleMutation, UpdateNotificationScheduleMutationVariables>(UpdateNotificationScheduleDocument);
};
export const DeleteNotificationScheduleDocument = gql`
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

export function useDeleteNotificationScheduleMutation() {
  return Urql.useMutation<DeleteNotificationScheduleMutation, DeleteNotificationScheduleMutationVariables>(DeleteNotificationScheduleDocument);
};
export const DuplicateNotificationScheduleDocument = gql`
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

export function useDuplicateNotificationScheduleMutation() {
  return Urql.useMutation<DuplicateNotificationScheduleMutation, DuplicateNotificationScheduleMutationVariables>(DuplicateNotificationScheduleDocument);
};
export const ToggleNotificationScheduleActiveDocument = gql`
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

export function useToggleNotificationScheduleActiveMutation() {
  return Urql.useMutation<ToggleNotificationScheduleActiveMutation, ToggleNotificationScheduleActiveMutationVariables>(ToggleNotificationScheduleActiveDocument);
};
export const BulkToggleNotificationScheduleActiveDocument = gql`
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

export function useBulkToggleNotificationScheduleActiveMutation() {
  return Urql.useMutation<BulkToggleNotificationScheduleActiveMutation, BulkToggleNotificationScheduleActiveMutationVariables>(BulkToggleNotificationScheduleActiveDocument);
};
export const BulkDeleteNotificationScheduleDocument = gql`
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

export function useBulkDeleteNotificationScheduleMutation() {
  return Urql.useMutation<BulkDeleteNotificationScheduleMutation, BulkDeleteNotificationScheduleMutationVariables>(BulkDeleteNotificationScheduleDocument);
};
export const UpdateNotificationScheduleLastRunDocument = gql`
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

export function useUpdateNotificationScheduleLastRunMutation() {
  return Urql.useMutation<UpdateNotificationScheduleLastRunMutation, UpdateNotificationScheduleLastRunMutationVariables>(UpdateNotificationScheduleLastRunDocument);
};
export const UpdateNotificationStatusDocument = gql`
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

export function useUpdateNotificationStatusMutation() {
  return Urql.useMutation<UpdateNotificationStatusMutation, UpdateNotificationStatusMutationVariables>(UpdateNotificationStatusDocument);
};
export const SendMobileNotificationsDocument = gql`
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

export function useSendMobileNotificationsMutation() {
  return Urql.useMutation<SendMobileNotificationsMutation, SendMobileNotificationsMutationVariables>(SendMobileNotificationsDocument);
};
export const TrackDeliveryStartDocument = gql`
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

export function useTrackDeliveryStartMutation() {
  return Urql.useMutation<TrackDeliveryStartMutation, TrackDeliveryStartMutationVariables>(TrackDeliveryStartDocument);
};
export const TrackDeliveryCompleteDocument = gql`
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

export function useTrackDeliveryCompleteMutation() {
  return Urql.useMutation<TrackDeliveryCompleteMutation, TrackDeliveryCompleteMutationVariables>(TrackDeliveryCompleteDocument);
};
export const TrackDeliveryFailureDocument = gql`
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

export function useTrackDeliveryFailureMutation() {
  return Urql.useMutation<TrackDeliveryFailureMutation, TrackDeliveryFailureMutationVariables>(TrackDeliveryFailureDocument);
};
export const GetNotificationSubscriptionStatusDocument = gql`
    """
Get the current user's push notification subscription status.
Returns: Subscription status and list of active subscriptions.
"""
query GetNotificationSubscriptionStatus {
  myNotificationSubscriptions {
    isSubscribed
    subscriptions {
      token
      platform
      createdAt
    }
  }
}
    `;

export function useGetNotificationSubscriptionStatusQuery(options?: Omit<Urql.UseQueryArgs<GetNotificationSubscriptionStatusQueryVariables>, 'query'>) {
  return Urql.useQuery<GetNotificationSubscriptionStatusQuery, GetNotificationSubscriptionStatusQueryVariables>({ query: GetNotificationSubscriptionStatusDocument, ...options });
};
export const SubscribeNotificationsDocument = gql`
    """
Subscribe to push notifications with an Expo push token.
Requires: token (Expo push token).
Returns: Success status and subscription details.
"""
mutation SubscribeNotifications($token: String!) {
  subscribeToNotifications(input: {token: $token}) {
    success
    subscription {
      token
      platform
    }
  }
}
    `;

export function useSubscribeNotificationsMutation() {
  return Urql.useMutation<SubscribeNotificationsMutation, SubscribeNotificationsMutationVariables>(SubscribeNotificationsDocument);
};
export const UnsubscribeNotificationsDocument = gql`
    """
Unsubscribe from push notifications by token.
Requires: token (Expo push token to remove).
Returns: Success status.
"""
mutation UnsubscribeNotifications($token: String!) {
  unsubscribeFromNotifications(input: {token: $token}) {
    success
  }
}
    `;

export function useUnsubscribeNotificationsMutation() {
  return Urql.useMutation<UnsubscribeNotificationsMutation, UnsubscribeNotificationsMutationVariables>(UnsubscribeNotificationsDocument);
};
export const GetRewardDocument = gql`
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

export function useGetRewardQuery(options: Omit<Urql.UseQueryArgs<GetRewardQueryVariables>, 'query'>) {
  return Urql.useQuery<GetRewardQuery, GetRewardQueryVariables>({ query: GetRewardDocument, ...options });
};
export const GetRewardsByTripDocument = gql`
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

export function useGetRewardsByTripQuery(options: Omit<Urql.UseQueryArgs<GetRewardsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetRewardsByTripQuery, GetRewardsByTripQueryVariables>({ query: GetRewardsByTripDocument, ...options });
};
export const GetRewardsByTripAdminDocument = gql`
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

export function useGetRewardsByTripAdminQuery(options: Omit<Urql.UseQueryArgs<GetRewardsByTripAdminQueryVariables>, 'query'>) {
  return Urql.useQuery<GetRewardsByTripAdminQuery, GetRewardsByTripAdminQueryVariables>({ query: GetRewardsByTripAdminDocument, ...options });
};
export const GetPurchaseHistoryDocument = gql`
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

export function useGetPurchaseHistoryQuery(options: Omit<Urql.UseQueryArgs<GetPurchaseHistoryQueryVariables>, 'query'>) {
  return Urql.useQuery<GetPurchaseHistoryQuery, GetPurchaseHistoryQueryVariables>({ query: GetPurchaseHistoryDocument, ...options });
};
export const GetTotalAvailablePointsDocument = gql`
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

export function useGetTotalAvailablePointsQuery(options: Omit<Urql.UseQueryArgs<GetTotalAvailablePointsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTotalAvailablePointsQuery, GetTotalAvailablePointsQueryVariables>({ query: GetTotalAvailablePointsDocument, ...options });
};
export const CreateRewardDocument = gql`
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

export function useCreateRewardMutation() {
  return Urql.useMutation<CreateRewardMutation, CreateRewardMutationVariables>(CreateRewardDocument);
};
export const UpdateRewardDocument = gql`
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

export function useUpdateRewardMutation() {
  return Urql.useMutation<UpdateRewardMutation, UpdateRewardMutationVariables>(UpdateRewardDocument);
};
export const DeleteRewardDocument = gql`
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

export function useDeleteRewardMutation() {
  return Urql.useMutation<DeleteRewardMutation, DeleteRewardMutationVariables>(DeleteRewardDocument);
};
export const PurchaseRewardDocument = gql`
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

export function usePurchaseRewardMutation() {
  return Urql.useMutation<PurchaseRewardMutation, PurchaseRewardMutationVariables>(PurchaseRewardDocument);
};
export const SetRewardHiddenDocument = gql`
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

export function useSetRewardHiddenMutation() {
  return Urql.useMutation<SetRewardHiddenMutation, SetRewardHiddenMutationVariables>(SetRewardHiddenDocument);
};
export const UpdatePurchaseStatusDocument = gql`
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

export function useUpdatePurchaseStatusMutation() {
  return Urql.useMutation<UpdatePurchaseStatusMutation, UpdatePurchaseStatusMutationVariables>(UpdatePurchaseStatusDocument);
};
export const UpdateMyPurchaseStatusDocument = gql`
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

export function useUpdateMyPurchaseStatusMutation() {
  return Urql.useMutation<UpdateMyPurchaseStatusMutation, UpdateMyPurchaseStatusMutationVariables>(UpdateMyPurchaseStatusDocument);
};
export const SeedCreateSponsorDocument = gql`
    mutation SeedCreateSponsor($name: String!, $description: String!, $logoPath: String!, $height: Int, $offsetX: Int, $offsetY: Int) {
  createSponsor(
    input: {name: $name, description: $description, logoPath: $logoPath, height: $height, offsetX: $offsetX, offsetY: $offsetY}
  ) {
    sponsor {
      id
      name
      description
      logoPath
      createdAt
    }
  }
}
    `;

export function useSeedCreateSponsorMutation() {
  return Urql.useMutation<SeedCreateSponsorMutation, SeedCreateSponsorMutationVariables>(SeedCreateSponsorDocument);
};
export const SeedLinkSponsorToTripDocument = gql`
    mutation SeedLinkSponsorToTrip($sponsorId: ID!, $tripId: ID!) {
  linkSponsorToTrip(input: {sponsorId: $sponsorId, tripId: $tripId}) {
    linked
    sponsorId
    tripId
  }
}
    `;

export function useSeedLinkSponsorToTripMutation() {
  return Urql.useMutation<SeedLinkSponsorToTripMutation, SeedLinkSponsorToTripMutationVariables>(SeedLinkSponsorToTripDocument);
};
export const SeedCreateRewardDocument = gql`
    mutation SeedCreateReward($tripId: ID!, $name: String!, $description: String!, $availableQuantity: Int!, $coinCost: Int!, $images: [String!], $isHidden: Boolean) {
  createReward(
    input: {tripId: $tripId, name: $name, description: $description, availableQuantity: $availableQuantity, coinCost: $coinCost, images: $images, isHidden: $isHidden}
  ) {
    reward {
      id
      tripId
      name
      description
      coinCostPercentage
      availableQuantity
      images
      isHidden
      createdAt
    }
  }
}
    `;

export function useSeedCreateRewardMutation() {
  return Urql.useMutation<SeedCreateRewardMutation, SeedCreateRewardMutationVariables>(SeedCreateRewardDocument);
};
export const GetSponsorDocument = gql`
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

export function useGetSponsorQuery(options: Omit<Urql.UseQueryArgs<GetSponsorQueryVariables>, 'query'>) {
  return Urql.useQuery<GetSponsorQuery, GetSponsorQueryVariables>({ query: GetSponsorDocument, ...options });
};
export const GetSponsorsByTripDocument = gql`
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

export function useGetSponsorsByTripQuery(options: Omit<Urql.UseQueryArgs<GetSponsorsByTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetSponsorsByTripQuery, GetSponsorsByTripQueryVariables>({ query: GetSponsorsByTripDocument, ...options });
};
export const CreateSponsorDocument = gql`
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

export function useCreateSponsorMutation() {
  return Urql.useMutation<CreateSponsorMutation, CreateSponsorMutationVariables>(CreateSponsorDocument);
};
export const UpdateSponsorDocument = gql`
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

export function useUpdateSponsorMutation() {
  return Urql.useMutation<UpdateSponsorMutation, UpdateSponsorMutationVariables>(UpdateSponsorDocument);
};
export const DeleteSponsorDocument = gql`
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

export function useDeleteSponsorMutation() {
  return Urql.useMutation<DeleteSponsorMutation, DeleteSponsorMutationVariables>(DeleteSponsorDocument);
};
export const LinkSponsorToTripDocument = gql`
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

export function useLinkSponsorToTripMutation() {
  return Urql.useMutation<LinkSponsorToTripMutation, LinkSponsorToTripMutationVariables>(LinkSponsorToTripDocument);
};
export const UnlinkSponsorFromTripDocument = gql`
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

export function useUnlinkSponsorFromTripMutation() {
  return Urql.useMutation<UnlinkSponsorFromTripMutation, UnlinkSponsorFromTripMutationVariables>(UnlinkSponsorFromTripDocument);
};
export const GetSubmissionReportsDocument = gql`
    query GetSubmissionReports($submissionId: ID!) {
  submissionReports(submissionId: $submissionId) {
    reports {
      ...SubmissionReportFields
    }
    totalCount
  }
}
    ${SubmissionReportFieldsFragmentDoc}`;

export function useGetSubmissionReportsQuery(options: Omit<Urql.UseQueryArgs<GetSubmissionReportsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetSubmissionReportsQuery, GetSubmissionReportsQueryVariables>({ query: GetSubmissionReportsDocument, ...options });
};
export const CreateSubmissionReportDocument = gql`
    mutation CreateSubmissionReport($input: CreateReportInput!) {
  createSubmissionReport(input: $input) {
    ...SubmissionReportCreateResultFields
  }
}
    ${SubmissionReportCreateResultFieldsFragmentDoc}`;

export function useCreateSubmissionReportMutation() {
  return Urql.useMutation<CreateSubmissionReportMutation, CreateSubmissionReportMutationVariables>(CreateSubmissionReportDocument);
};
export const GetTripDocument = gql`
    query GetTrip($id: ID!) {
  trip(id: $id) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export function useGetTripQuery(options: Omit<Urql.UseQueryArgs<GetTripQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTripQuery, GetTripQueryVariables>({ query: GetTripDocument, ...options });
};
export const GetTripsDocument = gql`
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

export function useGetTripsQuery(options?: Omit<Urql.UseQueryArgs<GetTripsQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTripsQuery, GetTripsQueryVariables>({ query: GetTripsDocument, ...options });
};
export const GetTripAdminDocument = gql`
    query GetTripAdmin($id: ID!) {
  tripAdmin(id: $id) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export function useGetTripAdminQuery(options: Omit<Urql.UseQueryArgs<GetTripAdminQueryVariables>, 'query'>) {
  return Urql.useQuery<GetTripAdminQuery, GetTripAdminQueryVariables>({ query: GetTripAdminDocument, ...options });
};
export const CreateTripDocument = gql`
    mutation CreateTrip($input: CreateTripInput!) {
  createTrip(input: $input) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export function useCreateTripMutation() {
  return Urql.useMutation<CreateTripMutation, CreateTripMutationVariables>(CreateTripDocument);
};
export const UpdateTripDocument = gql`
    mutation UpdateTrip($input: UpdateTripInput!) {
  updateTrip(input: $input) {
    ...TripFields
  }
}
    ${TripFieldsFragmentDoc}`;

export function useUpdateTripMutation() {
  return Urql.useMutation<UpdateTripMutation, UpdateTripMutationVariables>(UpdateTripDocument);
};
export const DeleteTripDocument = gql`
    mutation DeleteTrip($id: ID!) {
  deleteTrip(input: {id: $id}) {
    success
  }
}
    `;

export function useDeleteTripMutation() {
  return Urql.useMutation<DeleteTripMutation, DeleteTripMutationVariables>(DeleteTripDocument);
};
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export function useGetUserQuery(options: Omit<Urql.UseQueryArgs<GetUserQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUserQuery, GetUserQueryVariables>({ query: GetUserDocument, ...options });
};
export const GetCurrentUserDocument = gql`
    query GetCurrentUser {
  me {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export function useGetCurrentUserQuery(options?: Omit<Urql.UseQueryArgs<GetCurrentUserQueryVariables>, 'query'>) {
  return Urql.useQuery<GetCurrentUserQuery, GetCurrentUserQueryVariables>({ query: GetCurrentUserDocument, ...options });
};
export const GetUsersDocument = gql`
    query GetUsers($limit: Int = 20, $offset: Int = 0) {
  users(limit: $limit, offset: $offset) {
    ...UserFields
  }
}
    ${UserFieldsFragmentDoc}`;

export function useGetUsersQuery(options?: Omit<Urql.UseQueryArgs<GetUsersQueryVariables>, 'query'>) {
  return Urql.useQuery<GetUsersQuery, GetUsersQueryVariables>({ query: GetUsersDocument, ...options });
};
export const CreateUserDocument = gql`
    mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    ...UserCreateResultFields
  }
}
    ${UserCreateResultFieldsFragmentDoc}`;

export function useCreateUserMutation() {
  return Urql.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument);
};
export const UpdateUserDocument = gql`
    mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    ...UserUpdateResultFields
  }
}
    ${UserUpdateResultFieldsFragmentDoc}`;

export function useUpdateUserMutation() {
  return Urql.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument);
};
export const ActivityFeedUpdatedDocument = gql`
    subscription ActivityFeedUpdated($tripId: ID!) {
  activityFeedUpdated(tripId: $tripId) {
    id
    tripId
    title
    description
    imageUrl
    activityType
    isPinned
    isHidden
    admin {
      id
      firstName
      lastName
    }
    createdAt
    updatedAt
  }
}
    `;

export function useActivityFeedUpdatedSubscription<TData = ActivityFeedUpdatedSubscription>(options: Omit<Urql.UseSubscriptionArgs<ActivityFeedUpdatedSubscriptionVariables>, 'query'>, handler?: Urql.SubscriptionHandler<ActivityFeedUpdatedSubscription, TData>) {
  return Urql.useSubscription<ActivityFeedUpdatedSubscription, TData, ActivityFeedUpdatedSubscriptionVariables>({ query: ActivityFeedUpdatedDocument, ...options }, handler);
};
export const ChallengeVotingUpdatedDocument = gql`
    subscription ChallengeVotingUpdated($challengeId: ID!) {
  challengeVotingUpdated(challengeId: $challengeId) {
    challengeId
    totalVotes
    uniqueVoters
    submissions {
      submissionId
      voteCount
      voteScore
      rank
    }
    isComplete
    endsAt
    updatedAt
  }
}
    `;

export function useChallengeVotingUpdatedSubscription<TData = ChallengeVotingUpdatedSubscription>(options: Omit<Urql.UseSubscriptionArgs<ChallengeVotingUpdatedSubscriptionVariables>, 'query'>, handler?: Urql.SubscriptionHandler<ChallengeVotingUpdatedSubscription, TData>) {
  return Urql.useSubscription<ChallengeVotingUpdatedSubscription, TData, ChallengeVotingUpdatedSubscriptionVariables>({ query: ChallengeVotingUpdatedDocument, ...options }, handler);
};
export const LocationUpdatedDocument = gql`
    subscription LocationUpdated($userIds: [ID!]!) {
  locationUpdated(userIds: $userIds) {
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
}
    `;

export function useLocationUpdatedSubscription<TData = LocationUpdatedSubscription>(options: Omit<Urql.UseSubscriptionArgs<LocationUpdatedSubscriptionVariables>, 'query'>, handler?: Urql.SubscriptionHandler<LocationUpdatedSubscription, TData>) {
  return Urql.useSubscription<LocationUpdatedSubscription, TData, LocationUpdatedSubscriptionVariables>({ query: LocationUpdatedDocument, ...options }, handler);
};