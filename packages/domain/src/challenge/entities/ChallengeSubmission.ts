import type { ChallengeId, ChallengeSubmissionId } from "../value-objects/ChallengeId";
import type { ImageId, VideoId } from "../value-objects/MediaId";
import type { GroupId } from "../../group/value-objects/GroupId";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * ChallengeSubmission entity interface
 * Represents a group's submission for a challenge
 */
export interface ChallengeSubmission {
  id: ChallengeSubmissionId;
  challengeId: ChallengeId;
  groupId: GroupId;
  imageIds: ImageId[];
  videoId: VideoId | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById: UserId | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number | null;
  bonusPoints: number | null;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
}
