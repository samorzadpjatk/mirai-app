import { challenges } from "@mirai-app/db";

export const voteColumns = {
  id: true,
  challengeId: true,
  submissionId: true,
  voterId: true,
  votePosition: true,
  votePoints: true,
  normalizedWeight: true,
  votedAt: true,
} as const;

export const challengeColumns = {
  id: true,
  tripId: true,
  status: true,
  scoringCategory: true,
  endTime: true,
} as const;

export type ChallengeForVoting = Pick<
  typeof challenges.$inferSelect,
  "id" | "tripId" | "status" | "scoringCategory" | "endTime"
>;

export interface JudgedStaffVotingProgress {
  requiredPositions: number;
  eligibleSubmissionsCount: number;
  totalAdmins: number;
  votedAdmins: number;
  pendingAdmins: number;
  allAdminsVoted: boolean;
}
