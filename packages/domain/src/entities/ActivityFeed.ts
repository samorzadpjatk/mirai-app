import { Effect } from "effect";
import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";
import { validate } from "../utils/entity-validation";
import { updateEntity, timestamps, type Writable } from "../utils/immutable";
import { ValidationError } from "../errors/effect-errors";
import type { ActivityId } from "../value-objects/ActivityId";

/**
 * Challenge metadata for challenge_event activities
 * Replaces ChallengeActivity entity
 */
export interface ChallengeMetadata {
  readonly challengeId: string;
  readonly challengeName: string;
  readonly type: string; // event type (started, ended, voting_started, etc.)
}

/**
 * Rank change metadata for rank_change activities
 * Replaces RankChangeActivity entity
 */
export interface RankChangeMetadata {
  readonly groupId: string;
  readonly newRank: number;
  readonly totalCoins: number;
  readonly coinsGained: number;
}

/**
 * Submission metadata for submission activities
 * Replaces SubmissionActivity entity
 */
export interface SubmissionMetadata {
  readonly submissionId: string;
  readonly challengeId: string;
  readonly groupId: string;
  readonly hasVideo: boolean;
  readonly isWinner: boolean;
  readonly ranking: number | null;
  readonly pointsAwarded: number | null;
}

/**
 * Post metadata for user_post activities
 * Replaces UserPost entity
 */
export interface PostMetadata {
  readonly authorId: string;
  readonly additionalImages: readonly string[];
}

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
    public title: string,
    public description: string | null,
    public readonly imageUrl: string | null,
    public readonly isPinned: boolean,
    public readonly isHidden: boolean,
    public readonly hiddenAt: Date | null,
    public readonly hiddenReason: string | null,
    public readonly createdByAdmin: string | null,
    public readonly hiddenByAdmin: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // NEW: Nested metadata based on activity type (discriminated union pattern)
    public readonly challengeMetadata: ChallengeMetadata | null,
    public readonly rankChangeMetadata: RankChangeMetadata | null,
    public readonly submissionMetadata: SubmissionMetadata | null,
    public readonly postMetadata: PostMetadata | null,
    // Existing related entities (for display purposes)
    /** @deprecated Use challengeMetadata instead */
    public readonly submissionActivity: SubmissionActivityMetadata | null,
    /** @deprecated Use rankChangeMetadata instead */
    public readonly challengeActivity: ChallengeActivityMetadata | null,
    /** @deprecated Use submissionMetadata instead */
    public readonly rankChangeActivity: RankChangeActivityMetadata | null,
    /** @deprecated Use postMetadata instead */
    public readonly userPost: UserPostMetadata | null,
    public readonly admin: AdminInfo | null,
    public readonly hiddenBy: AdminInfo | null,
  ) {}

  /**
   * Factory method to create a new ActivityFeed
   *
   * Returns Effect<ActivityFeed, ValidationError, never>
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
    // NEW metadata parameters
    challengeMetadata?: ChallengeMetadata | null;
    rankChangeMetadata?: RankChangeMetadata | null;
    submissionMetadata?: SubmissionMetadata | null;
    postMetadata?: PostMetadata | null;
    // Legacy parameters (maintain backward compatibility)
    submissionActivity?: SubmissionActivityMetadata | null;
    challengeActivity?: ChallengeActivityMetadata | null;
    rankChangeActivity?: RankChangeActivityMetadata | null;
    userPost?: UserPostMetadata | null;
    admin?: AdminInfo | null;
    hiddenBy?: AdminInfo | null;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    // Validate tripId
    const tripId = validate.id(props.tripId, "tripId");
    if (isError(tripId)) {
      return Effect.fail(
        new ValidationError({
          message: tripId.error.message,
          field: "tripId",
        }),
      );
    }

    // Validate title
    const title = validate.string(props.title, "title", {
      required: true,
      maxLength: 500,
      trim: true,
    });
    if (isError(title)) {
      return Effect.fail(
        new ValidationError({
          message: title.error.message,
          field: "title",
        }),
      );
    }

    // Validate activity type-specific requirements
    if (
      props.activityType === "submission" &&
      !props.submissionActivity &&
      !props.submissionMetadata
    ) {
      return Effect.fail(
        new ValidationError({
          message:
            "submissionActivity or submissionMetadata is required for submission type",
          field: "submissionMetadata",
        }),
      );
    }

    if (
      props.activityType === "challenge_event" &&
      !props.challengeActivity &&
      !props.challengeMetadata
    ) {
      return Effect.fail(
        new ValidationError({
          message:
            "challengeActivity or challengeMetadata is required for challenge_event type",
          field: "challengeMetadata",
        }),
      );
    }

    if (
      props.activityType === "rank_change" &&
      !props.rankChangeActivity &&
      !props.rankChangeMetadata
    ) {
      return Effect.fail(
        new ValidationError({
          message:
            "rankChangeActivity or rankChangeMetadata is required for rank_change type",
          field: "rankChangeMetadata",
        }),
      );
    }

    if (
      props.activityType === "user_post" &&
      !props.userPost &&
      !props.postMetadata
    ) {
      return Effect.fail(
        new ValidationError({
          message: "userPost or postMetadata is required for user_post type",
          field: "postMetadata",
        }),
      );
    }

    const ts = timestamps(props);

    return Effect.succeed(
      new ActivityFeed(
        props.id ?? (crypto.randomUUID() as ActivityId),
        tripId.value,
        props.activityType,
        title.value,
        props.description ?? null,
        props.imageUrl ?? null,
        props.isPinned ?? false,
        props.isHidden ?? false,
        props.hiddenAt ?? null,
        props.hiddenReason ?? null,
        props.createdByAdmin ?? null,
        props.hiddenByAdmin ?? null,
        ts.createdAt,
        ts.updatedAt,
        // NEW: Pass metadata to constructor
        props.challengeMetadata ?? null,
        props.rankChangeMetadata ?? null,
        props.submissionMetadata ?? null,
        props.postMetadata ?? null,
        // Legacy fields
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
   * Factory method for creating challenge activity
   *
   * Returns Effect<ActivityFeed, ValidationError, never>
   */
  static createChallengeActivity(props: {
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    createdByAdmin?: string | null;
    challenge: ChallengeMetadata;
    id?: ActivityId;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    return ActivityFeed.create({
      id: props.id,
      tripId: props.tripId,
      activityType: "challenge_event",
      title: props.title,
      description: props.description,
      imageUrl: props.imageUrl,
      createdByAdmin: props.createdByAdmin,
      challengeMetadata: props.challenge,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Factory method for creating rank change activity
   *
   * Returns Effect<ActivityFeed, ValidationError, never>
   */
  static createRankChangeActivity(props: {
    tripId: string;
    title: string;
    description?: string | null;
    rankChange: RankChangeMetadata;
    id?: ActivityId;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    return ActivityFeed.create({
      id: props.id,
      tripId: props.tripId,
      activityType: "rank_change",
      title: props.title,
      description: props.description,
      rankChangeMetadata: props.rankChange,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Factory method for creating submission activity
   *
   * Returns Effect<ActivityFeed, ValidationError, never>
   */
  static createSubmissionActivity(props: {
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    submission: SubmissionMetadata;
    id?: ActivityId;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    return ActivityFeed.create({
      id: props.id,
      tripId: props.tripId,
      activityType: "submission",
      title: props.title,
      description: props.description,
      imageUrl: props.imageUrl,
      submissionMetadata: props.submission,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Factory method for creating user post activity
   *
   * Returns Effect<ActivityFeed, ValidationError, never>
   */
  static createPostActivity(props: {
    tripId: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    post: PostMetadata;
    id?: ActivityId;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    return ActivityFeed.create({
      id: props.id,
      tripId: props.tripId,
      activityType: "user_post",
      title: props.title,
      description: props.description,
      imageUrl: props.imageUrl,
      postMetadata: props.post,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Type guard: Check if this is a challenge activity
   */
  isChallengeActivity(): this is { challengeMetadata: ChallengeMetadata } {
    return (
      this.activityType === "challenge_event" && this.challengeMetadata !== null
    );
  }

  /**
   * Type guard: Check if this is a rank change activity
   */
  isRankChange(): this is { rankChangeMetadata: RankChangeMetadata } {
    return (
      this.activityType === "rank_change" && this.rankChangeMetadata !== null
    );
  }

  /**
   * Type guard: Check if this is a submission activity
   */
  isSubmission(): this is { submissionMetadata: SubmissionMetadata } {
    return (
      this.activityType === "submission" && this.submissionMetadata !== null
    );
  }

  /**
   * Type guard: Check if this is a user post activity
   */
  isUserPostActivity(): this is { postMetadata: PostMetadata } {
    return this.activityType === "user_post" && this.postMetadata !== null;
  }

  /**
   * Pin this activity
   * Returns a new ActivityFeed instance (immutable)
   */
  pin(): ActivityFeed {
    return updateEntity(this, { isPinned: true }, ActivityFeed);
  }

  /**
   * Unpin this activity
   * Returns a new ActivityFeed instance (immutable)
   */
  unpin(): ActivityFeed {
    return updateEntity(this, { isPinned: false }, ActivityFeed);
  }

  /**
   * Hide this activity (moderator action)
   * Returns a new ActivityFeed instance (immutable)
   */
  hide(hiddenByAdmin: string, reason?: string | null): ActivityFeed {
    return updateEntity(
      this,
      {
        isHidden: true,
        hiddenAt: new Date(),
        hiddenReason: reason ?? null,
        hiddenByAdmin,
      },
      ActivityFeed,
    );
  }

  /**
   * Unhide this activity (moderator action)
   * Returns a new ActivityFeed instance (immutable)
   */
  unhide(): ActivityFeed {
    return updateEntity(
      this,
      {
        isHidden: false,
        hiddenAt: null,
        hiddenReason: null,
        hiddenByAdmin: null,
      },
      ActivityFeed,
    );
  }

  /**
   * Update the activity title and/or description
   * Returns a Effect with new ActivityFeed instance or ValidationError
   */
  updateContent(props: {
    title?: string;
    description?: string | null;
  }): Effect.Effect<ActivityFeed, ValidationError, never> {
    const updates: Partial<ActivityFeed> = {};

    if (props.title !== undefined) {
      const validated = validate.string(props.title, "title", {
        required: true,
        maxLength: 500,
        trim: true,
      });
      if (isError(validated)) {
        return Effect.fail(
          new ValidationError({
            message: validated.error.message,
            field: "title",
          }),
        );
      }
      updates.title = validated.value;
    }

    if (props.description !== undefined) {
      updates.description = props.description;
    }

    return Effect.succeed(updateEntity(this, updates, ActivityFeed));
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

// Backward compatibility: Keep synchronous Result-based methods for transition
export namespace ActivityFeedCompat {
  /**
   * @deprecated Use ActivityFeed.create instead (returns Effect)
   * Synchronous Result-based version for backward compatibility during migration
   */
  export function createSync(
    props: Parameters<typeof ActivityFeed.create>[0],
  ): Result<ActivityFeed, ValidationError> {
    const effect = ActivityFeed.create(props);
    try {
      const entity = Effect.runSync(effect);
      return ok(entity);
    } catch (e) {
      return err(e as ValidationError);
    }
  }
}
