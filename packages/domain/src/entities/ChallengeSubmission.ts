import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import type { SubmissionId } from "../value-objects/SubmissionId";
import type { GroupInfo, ChallengeInfo } from "./ActivityFeed";

/**
 * Submission status values
 */
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Valid submission statuses
 */
export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

/**
 * Reviewer info (simplified user info for display)
 * Note: GroupInfo, ChallengeInfo are imported from ActivityFeed entity
 */
export interface ReviewerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

/**
 * Validation rules for submission data
 */
const VALIDATION_RULES = {
  textContent: {
    maxLength: 10000,
  },
  rejectionReason: {
    maxLength: 1000,
  },
  imageIds: {
    maxCount: 10,
  },
  location: {
    minLatitude: -90,
    maxLatitude: 90,
    minLongitude: -180,
    maxLongitude: 180,
  },
};

/**
 * ChallengeSubmission entity - represents a challenge submission in the system
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class ChallengeSubmission {
  private constructor(
    public readonly id: SubmissionId,
    public readonly challengeId: string,
    public readonly groupId: string,
    public readonly imageIds: string[],
    public readonly videoId: string | null,
    public readonly textContent: string | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly status: SubmissionStatus,
    public readonly reviewedById: string | null,
    public readonly reviewedAt: Date | null,
    public readonly rejectionReason: string | null,
    public readonly awardedPoints: number,
    public readonly bonusPoints: number,
    public readonly ranking: number | null,
    public readonly voteCount: number,
    public readonly voteScore: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Related entities (for display purposes, optional)
    public readonly group: GroupInfo | null,
    public readonly reviewedBy: ReviewerInfo | null,
    public readonly challenge: ChallengeInfo | null,
  ) {}

  /**
   * Factory method to create a new ChallengeSubmission
   * Validates all input data
   */
  static create(props: {
    id?: SubmissionId;
    challengeId: string;
    groupId: string;
    imageIds?: string[];
    videoId?: string | null;
    textContent?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status?: SubmissionStatus;
    reviewedById?: string | null;
    reviewedAt?: Date | null;
    rejectionReason?: string | null;
    awardedPoints?: number;
    bonusPoints?: number;
    ranking?: number | null;
    voteCount?: number;
    voteScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
    group?: GroupInfo | null;
    reviewedBy?: ReviewerInfo | null;
    challenge?: ChallengeInfo | null;
  }): Result<ChallengeSubmission, string> {
    // Validate challengeId
    if (!props.challengeId || props.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate imageIds
    const imageIds = props.imageIds ?? [];
    if (imageIds.length > VALIDATION_RULES.imageIds.maxCount) {
      return err(
        `Cannot have more than ${VALIDATION_RULES.imageIds.maxCount} images`,
      );
    }

    // Validate textContent length
    if (
      props.textContent &&
      props.textContent.length > VALIDATION_RULES.textContent.maxLength
    ) {
      return err(
        `textContent must be at most ${VALIDATION_RULES.textContent.maxLength} characters`,
      );
    }

    // Validate location coordinates
    if (props.latitude !== null && props.latitude !== undefined) {
      if (
        props.latitude < VALIDATION_RULES.location.minLatitude ||
        props.latitude > VALIDATION_RULES.location.maxLatitude
      ) {
        return err("latitude must be between -90 and 90");
      }
    }

    if (props.longitude !== null && props.longitude !== undefined) {
      if (
        props.longitude < VALIDATION_RULES.location.minLongitude ||
        props.longitude > VALIDATION_RULES.location.maxLongitude
      ) {
        return err("longitude must be between -180 and 180");
      }
    }

    // Validate status
    if (props.status && !SUBMISSION_STATUSES.includes(props.status)) {
      return err(
        `Invalid status: ${props.status}. Must be one of: ${SUBMISSION_STATUSES.join(", ")}`,
      );
    }

    // Validate rejection reason length
    if (
      props.rejectionReason &&
      props.rejectionReason.length > VALIDATION_RULES.rejectionReason.maxLength
    ) {
      return err(
        `rejectionReason must be at most ${VALIDATION_RULES.rejectionReason.maxLength} characters`,
      );
    }

    // Validate points are non-negative
    if (props.awardedPoints !== undefined && props.awardedPoints < 0) {
      return err("awardedPoints cannot be negative");
    }
    if (props.bonusPoints !== undefined && props.bonusPoints < 0) {
      return err("bonusPoints cannot be negative");
    }

    // Validate ranking is positive if provided
    if (props.ranking !== null && props.ranking !== undefined) {
      if (props.ranking < 1) {
        return err("ranking must be at least 1");
      }
      if (props.ranking > 3) {
        return err("ranking must be at most 3");
      }
    }

    const now = new Date();

    return ok(
      new ChallengeSubmission(
        props.id ?? (crypto.randomUUID() as SubmissionId),
        props.challengeId.trim(),
        props.groupId.trim(),
        imageIds,
        props.videoId ?? null,
        props.textContent ?? null,
        props.latitude ?? null,
        props.longitude ?? null,
        props.status ?? "PENDING",
        props.reviewedById ?? null,
        props.reviewedAt ?? null,
        props.rejectionReason ?? null,
        props.awardedPoints ?? 0,
        props.bonusPoints ?? 0,
        props.ranking ?? null,
        props.voteCount ?? 0,
        props.voteScore ?? 0,
        props.createdAt ?? now,
        props.updatedAt ?? now,
        props.group ?? null,
        props.reviewedBy ?? null,
        props.challenge ?? null,
      ),
    );
  }

  /**
   * Update the submission content (images, video, text, location)
   * Returns a new ChallengeSubmission instance (immutable)
   * Only allowed when status is PENDING
   */
  updateContent(props: {
    imageIds?: string[];
    videoId?: string | null;
    textContent?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Result<ChallengeSubmission, string> {
    if (this.status !== "PENDING") {
      return err("Cannot edit submission that is not pending");
    }

    // Validate imageIds
    const imageIds = props.imageIds ?? this.imageIds;
    if (imageIds.length > VALIDATION_RULES.imageIds.maxCount) {
      return err(
        `Cannot have more than ${VALIDATION_RULES.imageIds.maxCount} images`,
      );
    }

    // Validate textContent length
    const textContent =
      props.textContent !== undefined ? props.textContent : this.textContent;
    if (
      textContent &&
      textContent.length > VALIDATION_RULES.textContent.maxLength
    ) {
      return err(
        `textContent must be at most ${VALIDATION_RULES.textContent.maxLength} characters`,
      );
    }

    // Validate location coordinates
    const latitude =
      props.latitude !== undefined ? props.latitude : this.latitude;
    const longitude =
      props.longitude !== undefined ? props.longitude : this.longitude;

    if (latitude !== null) {
      if (
        latitude < VALIDATION_RULES.location.minLatitude ||
        latitude > VALIDATION_RULES.location.maxLatitude
      ) {
        return err("latitude must be between -90 and 90");
      }
    }

    if (longitude !== null) {
      if (
        longitude < VALIDATION_RULES.location.minLongitude ||
        longitude > VALIDATION_RULES.location.maxLongitude
      ) {
        return err("longitude must be between -180 and 180");
      }
    }

    return ok(
      new ChallengeSubmission(
        this.id,
        this.challengeId,
        this.groupId,
        imageIds,
        props.videoId !== undefined ? props.videoId : this.videoId,
        textContent,
        latitude,
        longitude,
        this.status,
        null, // Reset reviewedById when editing
        null, // Reset reviewedAt when editing
        null, // Reset rejectionReason when editing
        this.awardedPoints,
        this.bonusPoints,
        this.ranking,
        this.voteCount,
        this.voteScore,
        this.createdAt,
        new Date(), // updatedAt
        this.group,
        null, // Reset reviewedBy when editing
        this.challenge,
      ),
    );
  }

  /**
   * Approve the submission
   * Returns a new ChallengeSubmission instance (immutable)
   */
  approve(props: {
    reviewedById: string;
    awardedPoints?: number;
    bonusPoints?: number;
    ranking?: number | null;
  }): Result<ChallengeSubmission, string> {
    if (this.status === "REJECTED") {
      return err("Cannot approve a rejected submission");
    }

    const awardedPoints = props.awardedPoints ?? this.awardedPoints;
    const bonusPoints = props.bonusPoints ?? this.bonusPoints;

    if (awardedPoints < 0) {
      return err("awardedPoints cannot be negative");
    }
    if (bonusPoints < 0) {
      return err("bonusPoints cannot be negative");
    }

    if (props.ranking !== undefined && props.ranking !== null) {
      if (props.ranking < 1 || props.ranking > 3) {
        return err("ranking must be between 1 and 3");
      }
    }

    return ok(
      new ChallengeSubmission(
        this.id,
        this.challengeId,
        this.groupId,
        this.imageIds,
        this.videoId,
        this.textContent,
        this.latitude,
        this.longitude,
        "APPROVED",
        props.reviewedById,
        new Date(), // reviewedAt
        null, // Clear rejection reason on approval
        awardedPoints,
        bonusPoints,
        props.ranking !== undefined ? props.ranking : this.ranking,
        this.voteCount,
        this.voteScore,
        this.createdAt,
        new Date(), // updatedAt
        this.group,
        null, // Will be populated by repository
        this.challenge,
      ),
    );
  }

  /**
   * Reject the submission
   * Returns a new ChallengeSubmission instance (immutable)
   */
  reject(props: {
    reviewedById: string;
    reason: string;
  }): Result<ChallengeSubmission, string> {
    if (this.status === "APPROVED") {
      return err("Cannot reject an approved submission");
    }

    if (!props.reason || props.reason.trim() === "") {
      return err("Rejection reason is required");
    }

    if (props.reason.length > VALIDATION_RULES.rejectionReason.maxLength) {
      return err(
        `rejectionReason must be at most ${VALIDATION_RULES.rejectionReason.maxLength} characters`,
      );
    }

    return ok(
      new ChallengeSubmission(
        this.id,
        this.challengeId,
        this.groupId,
        this.imageIds,
        this.videoId,
        this.textContent,
        this.latitude,
        this.longitude,
        "REJECTED",
        props.reviewedById,
        new Date(), // reviewedAt
        props.reason.trim(),
        0, // Clear awarded points on rejection
        0, // Clear bonus points on rejection
        null, // Clear ranking on rejection
        this.voteCount,
        this.voteScore,
        this.createdAt,
        new Date(), // updatedAt
        this.group,
        null, // Will be populated by repository
        this.challenge,
      ),
    );
  }

  /**
   * Auto-approve the submission (for automatic approvals like QR code, location)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  autoApprove(props: {
    awardedPoints: number;
  }): Result<ChallengeSubmission, string> {
    if (props.awardedPoints < 0) {
      return err("awardedPoints cannot be negative");
    }

    return ok(
      new ChallengeSubmission(
        this.id,
        this.challengeId,
        this.groupId,
        this.imageIds,
        this.videoId,
        this.textContent,
        this.latitude,
        this.longitude,
        "APPROVED",
        null, // No reviewer for auto-approval
        new Date(), // reviewedAt
        null, // No rejection reason
        props.awardedPoints,
        0, // No bonus points for auto-approval
        null, // No ranking for auto-approval
        this.voteCount,
        this.voteScore,
        this.createdAt,
        new Date(), // updatedAt
        this.group,
        null,
        this.challenge,
      ),
    );
  }

  /**
   * Update vote statistics
   * Returns a new ChallengeSubmission instance (immutable)
   */
  updateVoteStats(props: {
    voteCount: number;
    voteScore: number;
  }): ChallengeSubmission {
    return new ChallengeSubmission(
      this.id,
      this.challengeId,
      this.groupId,
      this.imageIds,
      this.videoId,
      this.textContent,
      this.latitude,
      this.longitude,
      this.status,
      this.reviewedById,
      this.reviewedAt,
      this.rejectionReason,
      this.awardedPoints,
      this.bonusPoints,
      this.ranking,
      props.voteCount,
      props.voteScore,
      this.createdAt,
      new Date(), // updatedAt
      this.group,
      this.reviewedBy,
      this.challenge,
    );
  }

  /**
   * Check if the submission is pending
   */
  isPending(): boolean {
    return this.status === "PENDING";
  }

  /**
   * Check if the submission is approved
   */
  isApproved(): boolean {
    return this.status === "APPROVED";
  }

  /**
   * Check if the submission is rejected
   */
  isRejected(): boolean {
    return this.status === "REJECTED";
  }

  /**
   * Check if the submission can be edited
   */
  canEdit(): boolean {
    return this.status === "PENDING";
  }

  /**
   * Check if the submission can be deleted
   */
  canDelete(): boolean {
    return this.status === "PENDING";
  }

  /**
   * Check if the submission has media (images or video)
   */
  hasMedia(): boolean {
    return this.imageIds.length > 0 || this.videoId !== null;
  }

  /**
   * Check if the submission has location data
   */
  hasLocation(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * Get total points (awarded + bonus)
   */
  getTotalPoints(): number {
    return this.awardedPoints + this.bonusPoints;
  }

  /**
   * Check if submission has been reviewed
   */
  isReviewed(): boolean {
    return this.reviewedAt !== null;
  }

  /**
   * Set the group info (for display purposes)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  withGroup(group: GroupInfo): ChallengeSubmission {
    return new ChallengeSubmission(
      this.id,
      this.challengeId,
      this.groupId,
      this.imageIds,
      this.videoId,
      this.textContent,
      this.latitude,
      this.longitude,
      this.status,
      this.reviewedById,
      this.reviewedAt,
      this.rejectionReason,
      this.awardedPoints,
      this.bonusPoints,
      this.ranking,
      this.voteCount,
      this.voteScore,
      this.createdAt,
      this.updatedAt,
      group,
      this.reviewedBy,
      this.challenge,
    );
  }

  /**
   * Set the reviewer info (for display purposes)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  withReviewer(reviewer: ReviewerInfo): ChallengeSubmission {
    return new ChallengeSubmission(
      this.id,
      this.challengeId,
      this.groupId,
      this.imageIds,
      this.videoId,
      this.textContent,
      this.latitude,
      this.longitude,
      this.status,
      this.reviewedById,
      this.reviewedAt,
      this.rejectionReason,
      this.awardedPoints,
      this.bonusPoints,
      this.ranking,
      this.voteCount,
      this.voteScore,
      this.createdAt,
      this.updatedAt,
      this.group,
      reviewer,
      this.challenge,
    );
  }

  /**
   * Set the challenge info (for display purposes)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  withChallenge(challenge: ChallengeInfo): ChallengeSubmission {
    return new ChallengeSubmission(
      this.id,
      this.challengeId,
      this.groupId,
      this.imageIds,
      this.videoId,
      this.textContent,
      this.latitude,
      this.longitude,
      this.status,
      this.reviewedById,
      this.reviewedAt,
      this.rejectionReason,
      this.awardedPoints,
      this.bonusPoints,
      this.ranking,
      this.voteCount,
      this.voteScore,
      this.createdAt,
      this.updatedAt,
      this.group,
      this.reviewedBy,
      challenge,
    );
  }

  /**
   * Get the sort key for ordering submissions
   * Default: by voteScore descending, then createdAt ascending
   */
  getSortKey(): { voteScore: number; createdAt: Date; id: string } {
    return {
      voteScore: this.voteScore,
      createdAt: this.createdAt,
      id: this.id,
    };
  }

  /**
   * Compare two submissions for sorting (by voteScore desc, then createdAt asc)
   */
  compareForSort(other: ChallengeSubmission): number {
    const thisKey = this.getSortKey();
    const otherKey = other.getSortKey();

    // Higher voteScore comes first
    if (otherKey.voteScore !== thisKey.voteScore) {
      return otherKey.voteScore - thisKey.voteScore;
    }

    // Earlier createdAt comes first
    const dateDiff = thisKey.createdAt.getTime() - otherKey.createdAt.getTime();
    if (dateDiff !== 0) return dateDiff;

    // Finally by id for stable ordering
    return thisKey.id.localeCompare(otherKey.id);
  }
}
