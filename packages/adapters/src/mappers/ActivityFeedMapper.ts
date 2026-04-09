import {
  ActivityFeed,
  ActivityReaction,
  ActivityId,
  REACTION_TYPES,
  type ReactionType,
  type ActivityType,
  type ChallengeEventType,
  type SubmissionActivityMetadata,
  type ChallengeActivityMetadata,
  type RankChangeActivityMetadata,
  type UserPostMetadata,
  type AdminInfo,
} from "@mirai-app/domain";

/**
 * ActivityFeedMapper
 *
 * Maps between Prisma database records and domain ActivityFeed entities.
 * This is a pure function with no side effects.
 */
export class ActivityFeedMapper {
  /**
   * Convert a Prisma ActivityFeed record to a domain ActivityFeed entity
   */
  static toDomain(record: {
    id: string;
    tripId: string;
    activityType: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    isPinned: boolean;
    isHidden: boolean;
    hiddenAt: Date | null;
    hiddenReason: string | null;
    createdByAdmin: string | null;
    hiddenByAdmin: string | null;
    createdAt: Date;
    updatedAt: Date;
    submissionActivity?: {
      submissionId: string;
      challengeId: string;
      groupId: string;
      hasVideo: boolean;
      isWinner: boolean | null;
      ranking: number | null;
      pointsAwarded: number | null;
      submission?: {
        id: string;
        status: string;
        awardedPoints: number | null;
        bonusPoints: number | null;
        ranking: number | null;
        createdAt: Date;
      } | null;
      challenge?: {
        id: string;
        name: string;
        status: string;
        submissionType: string;
        endTime: Date | null;
      } | null;
      group?: {
        id: string;
        name: string;
        image: string | null;
        coins: number;
      } | null;
    } | null;
    challengeActivity?: {
      challengeId: string;
      eventType: string;
      endTime: Date | null;
      submissionType: string | null;
      basePoints: number | null;
      submissionCount: number | null;
      challenge?: {
        id: string;
        name: string;
        description: string | null;
        image: string | null;
        status: string;
        startTime: Date | null;
        endTime: Date | null;
        votingStartTime: Date | null;
        votingEndTime: Date | null;
      } | null;
    } | null;
    rankChangeActivity?: {
      groupId: string;
      newRank: number;
      totalCoins: number;
      coinsGained: number;
      group?: {
        id: string;
        name: string;
        image: string | null;
        coins: number;
      } | null;
    } | null;
    userPost?: {
      authorId: string;
      additionalImages: string[];
      author?: {
        id: string;
        userId: string;
        tripId: string;
        groupId: string | null;
        user?: {
          id: string;
          firstName: string;
          lastName: string;
          hasAvatar: boolean;
        } | null;
        group?: {
          id: string;
          name: string;
          image: string | null;
        } | null;
      } | null;
    } | null;
    admin?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
    hiddenBy?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }): ActivityFeed {
    // Map activity type
    const activityType = this.mapActivityType(record.activityType);

    // Map submission activity metadata
    let submissionActivity: SubmissionActivityMetadata | null = null;
    if (record.submissionActivity) {
      submissionActivity = {
        submissionId: record.submissionActivity.submissionId,
        challengeId: record.submissionActivity.challengeId,
        groupId: record.submissionActivity.groupId,
        hasVideo: record.submissionActivity.hasVideo,
        isWinner: record.submissionActivity.isWinner,
        ranking: record.submissionActivity.ranking,
        pointsAwarded: record.submissionActivity.pointsAwarded,
        currentGroupRank: null, // Computed at query time
      };
    }

    // Map challenge activity metadata
    let challengeActivity: ChallengeActivityMetadata | null = null;
    if (record.challengeActivity) {
      challengeActivity = {
        challengeId: record.challengeActivity.challengeId,
        eventType: this.mapChallengeEventType(
          record.challengeActivity.eventType,
        ),
        endTime: record.challengeActivity.endTime,
        submissionType: record.challengeActivity.submissionType,
        basePoints: record.challengeActivity.basePoints,
        submissionCount: record.challengeActivity.submissionCount,
      };
    }

    // Map rank change activity metadata
    let rankChangeActivity: RankChangeActivityMetadata | null = null;
    if (record.rankChangeActivity) {
      rankChangeActivity = {
        groupId: record.rankChangeActivity.groupId,
        newRank: record.rankChangeActivity.newRank,
        totalCoins: record.rankChangeActivity.totalCoins,
        coinsGained: record.rankChangeActivity.coinsGained,
      };
    }

    // Map user post metadata
    let userPost: UserPostMetadata | null = null;
    if (record.userPost && record.userPost.author) {
      userPost = {
        authorId: record.userPost.authorId,
        authorUserId: record.userPost.author.userId,
        authorFirstName: record.userPost.author.user?.firstName ?? "",
        authorLastName: record.userPost.author.user?.lastName ?? "",
        authorHasAvatar: record.userPost.author.user?.hasAvatar ?? false,
        groupId: record.userPost.author.groupId,
        groupName: record.userPost.author.group?.name ?? null,
        additionalImages: record.userPost.additionalImages ?? [],
      };
    }

    // Map admin info
    let admin: AdminInfo | null = null;
    if (record.admin) {
      admin = {
        id: record.admin.id,
        firstName: record.admin.firstName,
        lastName: record.admin.lastName,
      };
    }

    // Map hiddenBy info
    let hiddenBy: AdminInfo | null = null;
    if (record.hiddenBy) {
      hiddenBy = {
        id: record.hiddenBy.id,
        firstName: record.hiddenBy.firstName,
        lastName: record.hiddenBy.lastName,
      };
    }

    const result = ActivityFeed.create({
      id: ActivityId.unsafeCreate(record.id),
      tripId: record.tripId,
      activityType,
      title: record.title,
      description: record.description,
      imageUrl: record.imageUrl,
      isPinned: record.isPinned,
      isHidden: record.isHidden,
      hiddenAt: record.hiddenAt,
      hiddenReason: record.hiddenReason,
      createdByAdmin: record.createdByAdmin,
      hiddenByAdmin: record.hiddenByAdmin,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      submissionActivity,
      challengeActivity,
      rankChangeActivity,
      userPost,
      admin,
      hiddenBy,
    });

    // This should never fail if database has valid data
    if (result.kind === "err") {
      throw new Error(
        `Failed to map ActivityFeed from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain ActivityFeed entity to Prisma create input
   */
  static toPrismaCreate(activity: ActivityFeed): {
    id: string;
    tripId: string;
    activityType: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    isPinned: boolean;
    isHidden: boolean;
    hiddenAt: Date | null;
    hiddenReason: string | null;
    createdByAdmin: string | null;
    hiddenByAdmin: string | null;
    submissionActivity?: {
      create: {
        submissionId: string;
        challengeId: string;
        groupId: string;
        hasVideo: boolean;
        isWinner: boolean | null;
        ranking: number | null;
        pointsAwarded: number | null;
      };
    };
    challengeActivity?: {
      create: {
        challengeId: string;
        eventType: string;
        endTime: Date | null;
        submissionType: string | null;
        basePoints: number | null;
        submissionCount: number | null;
      };
    };
    rankChangeActivity?: {
      create: {
        groupId: string;
        newRank: number;
        totalCoins: number;
        coinsGained: number;
      };
    };
    userPost?: {
      create: {
        authorId: string;
        additionalImages: string[];
      };
    };
  } {
    const data: ReturnType<typeof ActivityFeedMapper.toPrismaCreate> = {
      id: activity.id,
      tripId: activity.tripId,
      activityType: activity.activityType,
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      hiddenAt: activity.hiddenAt,
      hiddenReason: activity.hiddenReason,
      createdByAdmin: activity.createdByAdmin,
      hiddenByAdmin: activity.hiddenByAdmin,
    };

    if (activity.submissionActivity) {
      data.submissionActivity = {
        create: {
          submissionId: activity.submissionActivity.submissionId,
          challengeId: activity.submissionActivity.challengeId,
          groupId: activity.submissionActivity.groupId,
          hasVideo: activity.submissionActivity.hasVideo,
          isWinner: activity.submissionActivity.isWinner,
          ranking: activity.submissionActivity.ranking,
          pointsAwarded: activity.submissionActivity.pointsAwarded,
        },
      };
    }

    if (activity.challengeActivity) {
      data.challengeActivity = {
        create: {
          challengeId: activity.challengeActivity.challengeId,
          eventType: activity.challengeActivity.eventType,
          endTime: activity.challengeActivity.endTime,
          submissionType: activity.challengeActivity.submissionType,
          basePoints: activity.challengeActivity.basePoints,
          submissionCount: activity.challengeActivity.submissionCount,
        },
      };
    }

    if (activity.rankChangeActivity) {
      data.rankChangeActivity = {
        create: {
          groupId: activity.rankChangeActivity.groupId,
          newRank: activity.rankChangeActivity.newRank,
          totalCoins: activity.rankChangeActivity.totalCoins,
          coinsGained: activity.rankChangeActivity.coinsGained,
        },
      };
    }

    if (activity.userPost) {
      data.userPost = {
        create: {
          authorId: activity.userPost.authorId,
          additionalImages: activity.userPost.additionalImages,
        },
      };
    }

    return data;
  }

  /**
   * Convert a domain ActivityFeed entity to Prisma update input
   */
  static toPrismaUpdate(activity: ActivityFeed): {
    title: string;
    description: string | null;
    imageUrl: string | null;
    isPinned: boolean;
    isHidden: boolean;
    hiddenAt: Date | null;
    hiddenReason: string | null;
    hiddenByAdmin: string | null;
    updatedAt: Date;
  } {
    return {
      title: activity.title,
      description: activity.description,
      imageUrl: activity.imageUrl,
      isPinned: activity.isPinned,
      isHidden: activity.isHidden,
      hiddenAt: activity.hiddenAt,
      hiddenReason: activity.hiddenReason,
      hiddenByAdmin: activity.hiddenByAdmin,
      updatedAt: new Date(),
    };
  }

  /**
   * Convert a Prisma ActivityReaction record to domain ActivityReaction entity
   */
  static toReactionDomain(record: {
    activityId: string;
    userId: string;
    reactionType: string;
    createdAt: Date;
  }): ActivityReaction | null {
    // Validate reaction type
    if (!REACTION_TYPES.includes(record.reactionType as ReactionType)) {
      return null;
    }

    const result = ActivityReaction.create({
      activityId: ActivityId.unsafeCreate(record.activityId),
      userId: record.userId,
      reactionType: record.reactionType as ReactionType,
      createdAt: record.createdAt,
    });

    if (result.kind === "err") {
      return null;
    }

    return result.value;
  }

  /**
   * Convert a domain ActivityReaction entity to Prisma create input
   */
  static toPrismaReaction(reaction: ActivityReaction): {
    activityId: string;
    userId: string;
    reactionType: string;
  } {
    return {
      activityId: reaction.activityId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
    };
  }

  /**
   * Map Prisma activity type string to ActivityType
   */
  private static mapActivityType(type: string): ActivityType {
    switch (type) {
      case "custom":
        return "custom";
      case "user_post":
        return "user_post";
      case "submission":
        return "submission";
      case "challenge_event":
        return "challenge_event";
      case "rank_change":
        return "rank_change";
      default:
        return "custom";
    }
  }

  /**
   * Map Prisma challenge event type string to ChallengeEventType
   */
  private static mapChallengeEventType(type: string): ChallengeEventType {
    switch (type) {
      case "challenge_started":
        return "challenge_started";
      case "voting_started":
        return "voting_started";
      case "completed":
        return "completed";
      default:
        return "challenge_started";
    }
  }
}
