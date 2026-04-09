import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import type { ActivityId } from "../value-objects/ActivityId";

/**
 * Activity types in the feed
 */
export type ActivityType =
  | "custom"
  | "user_post"
  | "submission"
  | "challenge_event"
  | "rank_change";

/**
 * Challenge event types for challenge_event activities
 */
export type ChallengeEventType =
  | "challenge_started"
  | "voting_started"
  | "completed";

/**
 * Reaction types
 */
export type ReactionType = "heart" | "fire" | "clap" | "star";

/**
 * All valid reaction types
 */
export const REACTION_TYPES: ReactionType[] = ["heart", "fire", "clap", "star"];

/**
 * Challenge event types
 */
export const CHALLENGE_EVENT_TYPES: ChallengeEventType[] = [
  "challenge_started",
  "voting_started",
  "completed",
];

/**
 * Reaction counts by type
 */
export interface ReactionCounts {
  heart: number;
  fire: number;
  clap: number;
  star: number;
}

/**
 * User reaction summary
 */
export interface ReactionsSummary {
  total: number;
  counts: ReactionCounts;
  myReactions: ReactionType[];
}

/**
 * Empty reaction counts (default state)
 */
export const emptyReactionCounts = (): ReactionCounts => ({
  heart: 0,
  fire: 0,
  clap: 0,
  star: 0,
});

/**
 * Activity metadata for submission activities
 */
export interface SubmissionActivityMetadata {
  submissionId: string;
  challengeId: string;
  groupId: string;
  hasVideo: boolean;
  isWinner: boolean | null;
  ranking: number | null;
  pointsAwarded: number | null;
  currentGroupRank: number | null;
}

/**
 * Activity metadata for challenge event activities
 */
export interface ChallengeActivityMetadata {
  challengeId: string;
  eventType: ChallengeEventType;
  endTime: Date | null;
  submissionType: string | null;
  basePoints: number | null;
  submissionCount: number | null;
}

/**
 * Activity metadata for rank change activities
 */
export interface RankChangeActivityMetadata {
  groupId: string;
  newRank: number;
  totalCoins: number;
  coinsGained: number;
}

/**
 * Activity metadata for user post activities
 */
export interface UserPostMetadata {
  authorId: string;
  authorUserId: string;
  authorFirstName: string;
  authorLastName: string;
  authorHasAvatar: boolean;
  groupId: string | null;
  groupName: string | null;
  additionalImages: string[];
}

/**
 * Author info (simplified user info for activity display)
 */
export interface AuthorInfo {
  id: string;
  userId: string;
  tripId: string;
  groupId: string | null;
  firstName: string;
  lastName: string;
  hasAvatar: boolean;
}

/**
 * Admin info (simplified admin user info)
 */
export interface AdminInfo {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * Group info (simplified group info for activity display)
 */
export interface GroupInfo {
  id: string;
  name: string;
  image: string | null;
  coins: number;
}

/**
 * Challenge info (simplified challenge info for activity display)
 */
export interface ChallengeInfo {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
}

/**
 * Submission info (simplified submission info for activity display)
 */
export interface SubmissionInfo {
  id: string;
  status: string;
  awardedPoints: number | null;
  bonusPoints: number | null;
  ranking: number | null;
  createdAt: Date;
}

/**
 * ActivityFeed entity - represents an activity in the feed
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class ActivityFeed {
  private constructor(
    public readonly id: ActivityId,
    public readonly tripId: string,
    public readonly activityType: ActivityType,
    public readonly title: string,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly isPinned: boolean,
    public readonly isHidden: boolean,
    public readonly hiddenAt: Date | null,
    public readonly hiddenReason: string | null,
    public readonly createdByAdmin: string | null,
    public readonly hiddenByAdmin: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Related metadata based on activity type
    public readonly submissionActivity: SubmissionActivityMetadata | null,
    public readonly challengeActivity: ChallengeActivityMetadata | null,
    public readonly rankChangeActivity: RankChangeActivityMetadata | null,
    public readonly userPost: UserPostMetadata | null,
    // Related entities (for display purposes)
    public readonly admin: AdminInfo | null,
    public readonly hiddenBy: AdminInfo | null,
  ) {}

  /**
   * Factory method to create a new ActivityFeed
   */
  static create(props: {
    id?: ActivityId;
    tripId: string;
    activityType: ActivityType;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    isPinned?: boolean;
    isHidden?: boolean;
    hiddenAt?: Date | null;
    hiddenReason?: string | null;
    createdByAdmin?: string | null;
    hiddenByAdmin?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    submissionActivity?: SubmissionActivityMetadata | null;
    challengeActivity?: ChallengeActivityMetadata | null;
    rankChangeActivity?: RankChangeActivityMetadata | null;
    userPost?: UserPostMetadata | null;
    admin?: AdminInfo | null;
    hiddenBy?: AdminInfo | null;
  }): Result<ActivityFeed, string> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate title
    if (!props.title || props.title.trim() === "") {
      return err("title is required");
    }

    // Validate activity type-specific requirements
    if (props.activityType === "submission" && !props.submissionActivity) {
      return err("submissionActivity is required for submission type");
    }

    if (props.activityType === "challenge_event" && !props.challengeActivity) {
      return err("challengeActivity is required for challenge_event type");
    }

    if (props.activityType === "rank_change" && !props.rankChangeActivity) {
      return err("rankChangeActivity is required for rank_change type");
    }

    if (props.activityType === "user_post" && !props.userPost) {
      return err("userPost is required for user_post type");
    }

    const now = new Date();

    return ok(
      new ActivityFeed(
        props.id ?? (crypto.randomUUID() as ActivityId),
        props.tripId.trim(),
        props.activityType,
        props.title.trim(),
        props.description ?? null,
        props.imageUrl ?? null,
        props.isPinned ?? false,
        props.isHidden ?? false,
        props.hiddenAt ?? null,
        props.hiddenReason ?? null,
        props.createdByAdmin ?? null,
        props.hiddenByAdmin ?? null,
        props.createdAt ?? now,
        props.updatedAt ?? now,
        props.submissionActivity ?? null,
        props.challengeActivity ?? null,
        props.rankChangeActivity ?? null,
        props.userPost ?? null,
        props.admin ?? null,
        props.hiddenBy ?? null,
      ),
    );
  }

  /**
   * Pin this activity
   * Returns a new ActivityFeed instance (immutable)
   */
  pin(): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      true, // isPinned
      this.isHidden,
      this.hiddenAt,
      this.hiddenReason,
      this.createdByAdmin,
      this.hiddenByAdmin,
      this.createdAt,
      new Date(), // updatedAt
      this.submissionActivity,
      this.challengeActivity,
      this.rankChangeActivity,
      this.userPost,
      this.admin,
      this.hiddenBy,
    );
  }

  /**
   * Unpin this activity
   * Returns a new ActivityFeed instance (immutable)
   */
  unpin(): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      false, // isPinned
      this.isHidden,
      this.hiddenAt,
      this.hiddenReason,
      this.createdByAdmin,
      this.hiddenByAdmin,
      this.createdAt,
      new Date(), // updatedAt
      this.submissionActivity,
      this.challengeActivity,
      this.rankChangeActivity,
      this.userPost,
      this.admin,
      this.hiddenBy,
    );
  }

  /**
   * Hide this activity (moderator action)
   * Returns a new ActivityFeed instance (immutable)
   */
  hide(hiddenByAdmin: string, reason?: string | null): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      this.isPinned,
      true, // isHidden
      new Date(), // hiddenAt
      reason ?? null,
      this.createdByAdmin,
      hiddenByAdmin,
      this.createdAt,
      new Date(), // updatedAt
      this.submissionActivity,
      this.challengeActivity,
      this.rankChangeActivity,
      this.userPost,
      this.admin,
      this.hiddenBy,
    );
  }

  /**
   * Unhide this activity (moderator action)
   * Returns a new ActivityFeed instance (immutable)
   */
  unhide(): ActivityFeed {
    return new ActivityFeed(
      this.id,
      this.tripId,
      this.activityType,
      this.title,
      this.description,
      this.imageUrl,
      this.isPinned,
      false, // isHidden
      null, // hiddenAt
      null, // hiddenReason
      this.createdByAdmin,
      null, // hiddenByAdmin
      this.createdAt,
      new Date(), // updatedAt
      this.submissionActivity,
      this.challengeActivity,
      this.rankChangeActivity,
      this.userPost,
      this.admin,
      this.hiddenBy,
    );
  }

  /**
   * Update the activity title and/or description
   * Returns a new ActivityFeed instance (immutable)
   */
  updateContent(props: {
    title?: string;
    description?: string | null;
  }): Result<ActivityFeed, string> {
    if (props.title !== undefined && props.title.trim() === "") {
      return err("title cannot be empty");
    }

    return ok(
      new ActivityFeed(
        this.id,
        this.tripId,
        this.activityType,
        props.title !== undefined ? props.title.trim() : this.title,
        props.description !== undefined ? props.description : this.description,
        this.imageUrl,
        this.isPinned,
        this.isHidden,
        this.hiddenAt,
        this.hiddenReason,
        this.createdByAdmin,
        this.hiddenByAdmin,
        this.createdAt,
        new Date(), // updatedAt
        this.submissionActivity,
        this.challengeActivity,
        this.rankChangeActivity,
        this.userPost,
        this.admin,
        this.hiddenBy,
      ),
    );
  }

  /**
   * Check if this activity can be viewed by regular users
   * (not hidden)
   */
  isVisible(): boolean {
    return !this.isHidden;
  }

  /**
   * Check if this activity was created by an admin
   */
  isAdminCreated(): boolean {
    return this.createdByAdmin !== null;
  }

  /**
   * Check if this activity is a user post
   */
  isUserPost(): boolean {
    return this.activityType === "user_post";
  }

  /**
   * Get the author info for user posts
   */
  getAuthor(): UserPostMetadata | null {
    return this.userPost;
  }

  /**
   * Get the sort key for pagination (pinned first, then by createdAt, then by id)
   */
  getSortKey(): { isPinned: boolean; createdAt: Date; id: string } {
    return {
      isPinned: this.isPinned,
      createdAt: this.createdAt,
      id: this.id,
    };
  }

  /**
   * Compare two activities for sorting (pinned first, then newest)
   */
  compareForSort(other: ActivityFeed): number {
    const thisKey = this.getSortKey();
    const otherKey = other.getSortKey();

    // Pinned activities come first
    if (thisKey.isPinned && !otherKey.isPinned) return -1;
    if (!thisKey.isPinned && otherKey.isPinned) return 1;

    // Then by createdAt descending (newest first)
    const dateDiff = otherKey.createdAt.getTime() - thisKey.createdAt.getTime();
    if (dateDiff !== 0) return dateDiff;

    // Finally by id descending for stable ordering
    return otherKey.id.localeCompare(thisKey.id);
  }
}

/**
 * Activity reaction entity - represents a user's reaction to an activity
 */
export class ActivityReaction {
  private constructor(
    public readonly activityId: ActivityId,
    public readonly userId: string,
    public readonly reactionType: ReactionType,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a new ActivityReaction
   */
  static create(props: {
    activityId: ActivityId;
    userId: string;
    reactionType: ReactionType;
    createdAt?: Date;
  }): Result<ActivityReaction, string> {
    if (!props.activityId || props.activityId.trim() === "") {
      return err("activityId is required");
    }

    if (!props.userId || props.userId.trim() === "") {
      return err("userId is required");
    }

    if (!REACTION_TYPES.includes(props.reactionType)) {
      return err(
        `Invalid reaction type: ${props.reactionType}. Must be one of: ${REACTION_TYPES.join(", ")}`,
      );
    }

    return ok(
      new ActivityReaction(
        props.activityId,
        props.userId.trim(),
        props.reactionType,
        props.createdAt ?? new Date(),
      ),
    );
  }

  /**
   * Get a unique key for this reaction
   */
  getUniqueKey(): string {
    return `${this.activityId}:${this.userId}:${this.reactionType}`;
  }

  /**
   * Check if this reaction is of a specific type
   */
  isType(type: ReactionType): boolean {
    return this.reactionType === type;
  }
}
