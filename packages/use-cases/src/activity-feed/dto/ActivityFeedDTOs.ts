import type { ActivityReactionType } from "../ports/ActivityReactionPort";

/**
 * DTO for activity feed item
 */
export interface ActivityFeedItemDTO {
  id: string;
  tripId: string;
  activityType: "SUBMISSION" | "CHALLENGE" | "RANK_CHANGE" | "USER_POST";
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  hiddenAt: Date | null;
  hiddenReason: string | null;
  createdByAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for activity with admin info
 */
export interface ActivityWithAdminDTO extends ActivityFeedItemDTO {
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  hiddenBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * DTO for submission activity details
 */
export interface SubmissionActivityDetailsDTO {
  submissionId: string;
  challengeId: string;
  groupId: string;
  hasVideo: boolean;
  isWinner: boolean;
  ranking: number | null;
}

/**
 * DTO for challenge activity details
 */
export interface ChallengeActivityDetailsDTO {
  challengeId: string;
  challengeTitle: string;
  eventType: "STARTED" | "ENDED" | "VOTING_STARTED";
}

/**
 * DTO for rank change activity details
 */
export interface RankChangeActivityDetailsDTO {
  groupId: string;
  groupName: string;
  previousRank: number;
  newRank: number;
  coinsAtChange: number;
}

/**
 * DTO for activity with submission details
 */
export interface ActivityWithSubmissionDTO extends ActivityWithAdminDTO {
  submissionDetails: SubmissionActivityDetailsDTO | null;
  challengeDetails: ChallengeActivityDetailsDTO | null;
  rankChangeDetails: RankChangeActivityDetailsDTO | null;
}

/**
 * DTO for activity with reaction counts
 */
export interface ActivityWithReactionsDTO extends ActivityWithSubmissionDTO {
  reactions: Record<ActivityReactionType, number>;
  userReactions: ActivityReactionType[];
}

/**
 * Cursor for pagination
 */
export interface ActivityCursor {
  isPinned: boolean;
  createdAt: Date;
  id: string;
}

/**
 * DTO for paginated activities with cursor
 */
export interface PaginatedActivitiesDTO {
  activities: ActivityWithReactionsDTO[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * DTO for paginated activities for moderation
 */
export interface PaginatedActivitiesForModerationDTO {
  activities: ActivityWithReactionsDTO[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * DTO for activity reaction
 */
export interface ActivityReactionDTO {
  id: string;
  activityId: string;
  userId: string;
  reactionType: ActivityReactionType;
  createdAt: Date;
}

/**
 * DTO for activity creation result
 */
export interface CreateActivityResultDTO {
  id: string;
  tripId: string;
  activityType: "SUBMISSION" | "CHALLENGE" | "RANK_CHANGE" | "USER_POST";
  title: string;
  createdAt: Date;
}

/**
 * DTO for activity update result
 */
export interface UpdateActivityResultDTO {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  updatedAt: Date;
}

/**
 * DTO for activity hide result
 */
export interface HideActivityResultDTO {
  id: string;
  isHidden: boolean;
  hiddenAt: Date;
  hiddenReason: string | null;
}

/**
 * DTO for activity unhide result
 */
export interface UnhideActivityResultDTO {
  id: string;
  isHidden: boolean;
  unhiddenAt: Date;
}

/**
 * DTO for toggle reaction result
 */
export interface ToggleReactionResultDTO {
  activityId: string;
  reactionType: ActivityReactionType;
  isAdded: boolean;
  reactionCount: number;
}

/**
 * DTO for delete activity result
 */
export interface DeleteActivityResultDTO {
  success: boolean;
  activityId: string;
}
