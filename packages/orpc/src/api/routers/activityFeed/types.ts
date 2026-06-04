import { z } from "zod";

export const REACTION_TYPES = ["heart", "fire", "clap", "star"] as const;

export const CHALLENGE_EVENT_TYPES = ["challenge_started", "voting_started", "completed"] as const;

export const activityCursorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  isPinned: z.boolean(),
});

export interface ReactionsSummary {
  total: number;
  counts: {
    heart: number;
    fire: number;
    clap: number;
    star: number;
  };
  myReactions: string[];
}

export interface AdminSnippet {
  id: string;
  firstName: string;
  lastName: string;
}

export interface GroupSnippet {
  id: string;
  name: string;
  image: string;
  coins: number;
}

export interface ChallengeSnippet {
  id: string;
  name: string;
  description: string;
  image: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
}

export interface SubmissionSnippet {
  id: string;
  status: string;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number;
  createdAt: Date;
}

export interface BaseActivity {
  id: string;
  tripId: string;
  title: string;
  description: string;
  imageUrl: string;
  isPinned: boolean;
  isHidden: boolean;
  hiddenAt: Date | null;
  hiddenReason: string;
  createdByAdmin: string;
  createdAt: Date;
  updatedAt: Date;
  admin: AdminSnippet | null;
  hiddenBy: AdminSnippet | null;
  reactionsSummary: ReactionsSummary;
}

export interface CustomActivity extends BaseActivity {
  activityType: "custom";
  submissionActivity: null;
  challengeActivity: null;
  rankChangeActivity: null;
  userPost: null;
}

export interface UserPostActivity extends BaseActivity {
  activityType: "user_post";
  userPost: {
    authorId: string;
    additionalImages: string[];
    author: {
      id: string;
      userId: string;
      tripId: string;
      groupId: string | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        hasAvatar: boolean;
      } | null;
      group: {
        id: string;
        name: string;
        image: string;
      } | null;
    } | null;
  };
  submissionActivity: null;
  challengeActivity: null;
  rankChangeActivity: null;
}

export interface SubmissionActivity extends BaseActivity {
  activityType: "submission";
  submissionActivity: {
    submissionId: string;
    challengeId: string;
    groupId: string;
    hasVideo: boolean;
    isWinner: boolean;
    ranking: number;
    pointsAwarded: number;
    currentGroupRank: number | null;
    submission: SubmissionSnippet | null;
    challenge: {
      id: string;
      name: string;
      status: string;
      submissionType: string;
      endTime: Date | null;
    } | null;
    group: GroupSnippet | null;
  };
  challengeActivity: null;
  rankChangeActivity: null;
  userPost: null;
}

export interface ChallengeEventActivity extends BaseActivity {
  activityType: "challenge_event";
  challengeActivity: {
    challengeId: string;
    eventType: string;
    endTime: Date | null;
    submissionType: string;
    basePoints: number;
    submissionCount: number;
    challenge: ChallengeSnippet | null;
  };
  submissionActivity: null;
  rankChangeActivity: null;
  userPost: null;
}

export interface RankChangeActivity extends BaseActivity {
  activityType: "rank_change";
  rankChangeActivity: {
    groupId: string;
    newRank: number;
    totalCoins: number;
    coinsGained: number;
    group: GroupSnippet | null;
  };
  submissionActivity: null;
  challengeActivity: null;
  userPost: null;
}

export type Activity =
  | CustomActivity
  | UserPostActivity
  | SubmissionActivity
  | ChallengeEventActivity
  | RankChangeActivity;

export type ActivityType = Activity["activityType"];

/**
 * Raw database query result type before enrichment.
 * Kept for internal use where Drizzle ORM returns nullable relations.
 */
export interface RawActivityWithRelations {
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
  createdAt: Date;
  updatedAt: Date;
  admin: { id: string; firstName: string; lastName: string } | null;
  hiddenBy: { id: string; firstName: string; lastName: string } | null;
  submissionActivity: {
    submissionId: string;
    challengeId: string;
    groupId: string;
    hasVideo: boolean;
    isWinner: boolean;
    ranking: number | null;
    pointsAwarded: number | null;
    submission: {
      id: string;
      status: string;
      awardedPoints: number | null;
      bonusPoints: number | null;
      ranking: number | null;
      createdAt: Date;
    } | null;
    challenge: {
      id: string;
      name: string;
      status: string;
      submissionType: string | null;
      endTime: Date | null;
    } | null;
    group: {
      id: string;
      name: string;
      image: string | null;
      coins: number;
    } | null;
  } | null;
  challengeActivity: {
    challengeId: string;
    eventType: string;
    endTime: Date | null;
    submissionType: string | null;
    basePoints: number | null;
    submissionCount: number | null;
    challenge: {
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
  rankChangeActivity: {
    groupId: string;
    newRank: number;
    totalCoins: number;
    coinsGained: number;
    group: {
      id: string;
      name: string;
      image: string | null;
      coins: number;
    } | null;
  } | null;
  userPost: {
    authorId: string;
    additionalImages: string[];
    author: {
      id: string;
      userId: string;
      tripId: string;
      groupId: string | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        hasAvatar: boolean;
      } | null;
      group: {
        id: string;
        name: string;
        image: string | null;
      } | null;
    } | null;
  } | null;
}
