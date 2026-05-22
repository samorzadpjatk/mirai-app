import { z } from "zod";

export const REACTION_TYPES = ["heart", "fire", "clap", "star"] as const;

export const CHALLENGE_EVENT_TYPES = [
  "challenge_started",
  "voting_started",
  "completed",
] as const;

export const activityCursorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  isPinned: z.boolean(),
});

export interface ActivityWithRelations {
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
