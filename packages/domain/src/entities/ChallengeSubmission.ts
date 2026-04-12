import { Effect } from "effect";
import type { SubmissionId } from "../value-objects/SubmissionId";
import type { GroupInfo, ChallengeInfo } from "./ActivityFeed";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { timestamps, updateEntity } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

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
 * State machine for submission status transitions
 */
const submissionStateMachine = createStateMachine<SubmissionStatus>({
  transitions: {
    PENDING: ["APPROVED", "REJECTED"],
    APPROVED: [],
    REJECTED: [],
  },
  terminalStates: ["APPROVED", "REJECTED"],
});

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
  }): Effect.Effect<ChallengeSubmission, ValidationError, never> {
    // Validate challengeId
    const challengeIdResult = validate.id(props.challengeId, "challengeId");
    if (challengeIdResult.kind === "err")
      return Effect.fail(challengeIdResult.error);

    // Validate groupId
    const groupIdResult = validate.id(props.groupId, "groupId");
    if (groupIdResult.kind === "err") return Effect.fail(groupIdResult.error);

    // Validate imageIds
    const imageIds = props.imageIds ?? [];
    const imageIdsResult = validate.array(imageIds, "imageIds", {
      maxItems: 10,
    });
    if (imageIdsResult.kind === "err") return Effect.fail(imageIdsResult.error);

    // Validate textContent length
    if (props.textContent !== null && props.textContent !== undefined) {
      const textResult = validate.string(props.textContent, "textContent", {
        maxLength: 10000,
      });
      if (textResult.kind === "err") return Effect.fail(textResult.error);
    }

    // Validate location coordinates
    if (props.latitude !== null && props.latitude !== undefined) {
      const latResult = validate.number(props.latitude, "latitude", {
        min: -90,
        max: 90,
      });
      if (latResult.kind === "err") return Effect.fail(latResult.error);
    }

    if (props.longitude !== null && props.longitude !== undefined) {
      const lngResult = validate.number(props.longitude, "longitude", {
        min: -180,
        max: 180,
      });
      if (lngResult.kind === "err") return Effect.fail(lngResult.error);
    }

    // Validate rejection reason length
    if (props.rejectionReason !== null && props.rejectionReason !== undefined) {
      const reasonResult = validate.string(
        props.rejectionReason,
        "rejectionReason",
        {
          maxLength: 1000,
        },
      );
      if (reasonResult.kind === "err") return Effect.fail(reasonResult.error);
    }

    // Validate points are non-negative
    const awardedPoints = props.awardedPoints ?? 0;
    if (awardedPoints < 0) {
      return Effect.fail(
        new ValidationError({
          message: "awardedPoints must be at least 0",
          field: "awardedPoints",
        }),
      );
    }

    const bonusPoints = props.bonusPoints ?? 0;
    if (bonusPoints < 0) {
      return Effect.fail(
        new ValidationError({
          message: "bonusPoints must be at least 0",
          field: "bonusPoints",
        }),
      );
    }

    // Validate ranking is between 1 and 3 if provided
    let ranking: number | null = null;
    if (props.ranking !== null && props.ranking !== undefined) {
      const rankingResult = validate.number(props.ranking, "ranking", {
        min: 1,
        max: 3,
        integer: true,
      });
      if (rankingResult.kind === "err") return Effect.fail(rankingResult.error);
      ranking = rankingResult.value;
    }

    // Generate timestamps
    const ts = timestamps({
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });

    return Effect.succeed(
      new ChallengeSubmission(
        props.id ?? (crypto.randomUUID() as SubmissionId),
        challengeIdResult.value.trim(),
        groupIdResult.value.trim(),
        imageIds,
        props.videoId ?? null,
        props.textContent ?? null,
        props.latitude ?? null,
        props.longitude ?? null,
        props.status ?? "PENDING",
        props.reviewedById ?? null,
        props.reviewedAt ?? null,
        props.rejectionReason ?? null,
        awardedPoints,
        bonusPoints,
        ranking,
        props.voteCount ?? 0,
        props.voteScore ?? 0,
        ts.createdAt,
        ts.updatedAt,
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
  }): Effect.Effect<
    ChallengeSubmission,
    ValidationError | StateTransitionError,
    never
  > {
    if (this.status !== "PENDING") {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: "PENDING_UPDATE",
          entityType: "ChallengeSubmission",
        }),
      );
    }

    // Validate imageIds
    const imageIds = props.imageIds ?? this.imageIds;
    const imageIdsResult = validate.array(imageIds, "imageIds", {
      maxItems: 10,
    });
    if (imageIdsResult.kind === "err") return Effect.fail(imageIdsResult.error);

    // Validate textContent length
    let textContent =
      props.textContent !== undefined ? props.textContent : this.textContent;
    if (textContent !== null) {
      const textResult = validate.string(textContent, "textContent", {
        maxLength: 10000,
      });
      if (textResult.kind === "err") return Effect.fail(textResult.error);
    }

    // Validate location coordinates
    const latitude =
      props.latitude !== undefined ? props.latitude : this.latitude;
    const longitude =
      props.longitude !== undefined ? props.longitude : this.longitude;

    if (latitude !== null) {
      const latResult = validate.number(latitude, "latitude", {
        min: -90,
        max: 90,
      });
      if (latResult.kind === "err") return Effect.fail(latResult.error);
    }

    if (longitude !== null) {
      const lngResult = validate.number(longitude, "longitude", {
        min: -180,
        max: 180,
      });
      if (lngResult.kind === "err") return Effect.fail(lngResult.error);
    }

    return Effect.succeed(
      updateEntity(
        this,
        {
          imageIds,
          videoId: props.videoId !== undefined ? props.videoId : this.videoId,
          textContent,
          latitude,
          longitude,
          reviewedById: null, // Reset reviewedById when editing
          reviewedAt: null, // Reset reviewedAt when editing
          rejectionReason: null, // Reset rejectionReason when editing
          reviewedBy: null, // Reset reviewedBy when editing
        },
        ChallengeSubmission,
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
  }): Effect.Effect<
    ChallengeSubmission,
    ValidationError | StateTransitionError,
    never
  > {
    if (!submissionStateMachine.canTransition(this.status, "APPROVED")) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: "APPROVED",
          entityType: "ChallengeSubmission",
        }),
      );
    }

    const awardedPoints = props.awardedPoints ?? this.awardedPoints;
    const bonusPoints = props.bonusPoints ?? this.bonusPoints;

    if (awardedPoints < 0) {
      return Effect.fail(ValidationError.minValue("awardedPoints", 0));
    }
    if (bonusPoints < 0) {
      return Effect.fail(ValidationError.minValue("bonusPoints", 0));
    }

    let ranking: number | null = this.ranking;
    if (props.ranking !== undefined && props.ranking !== null) {
      const rankingResult = validate.number(props.ranking, "ranking", {
        min: 1,
        max: 3,
        integer: true,
      });
      if (rankingResult.kind === "err") return Effect.fail(rankingResult.error);
      ranking = rankingResult.value;
    }

    return Effect.succeed(
      updateEntity(
        this,
        {
          status: "APPROVED",
          reviewedById: props.reviewedById,
          reviewedAt: new Date(),
          rejectionReason: null, // Clear rejection reason on approval
          awardedPoints,
          bonusPoints,
          ranking,
          reviewedBy: null, // Will be populated by repository
        },
        ChallengeSubmission,
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
  }): Effect.Effect<
    ChallengeSubmission,
    ValidationError | StateTransitionError,
    never
  > {
    if (!submissionStateMachine.canTransition(this.status, "REJECTED")) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: "REJECTED",
          entityType: "ChallengeSubmission",
        }),
      );
    }

    const reasonResult = validate.string(props.reason, "reason", {
      required: true,
      maxLength: 1000,
    });
    if (reasonResult.kind === "err") return Effect.fail(reasonResult.error);

    return Effect.succeed(
      updateEntity(
        this,
        {
          status: "REJECTED",
          reviewedById: props.reviewedById,
          reviewedAt: new Date(),
          rejectionReason: reasonResult.value.trim(),
          awardedPoints: 0, // Clear awarded points on rejection
          bonusPoints: 0, // Clear bonus points on rejection
          ranking: null, // Clear ranking on rejection
          reviewedBy: null, // Will be populated by repository
        },
        ChallengeSubmission,
      ),
    );
  }

  /**
   * Auto-approve the submission (for automatic approvals like QR code, location)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  autoApprove(props: {
    awardedPoints: number;
  }): Effect.Effect<ChallengeSubmission, ValidationError, never> {
    if (props.awardedPoints < 0) {
      return Effect.fail(
        new ValidationError({
          message: "awardedPoints must be at least 0",
          field: "awardedPoints",
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        {
          status: "APPROVED",
          reviewedById: null, // No reviewer for auto-approval
          reviewedAt: new Date(),
          rejectionReason: null, // No rejection reason
          awardedPoints: props.awardedPoints,
          bonusPoints: 0, // No bonus points for auto-approval
          ranking: null, // No ranking for auto-approval
        },
        ChallengeSubmission,
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
    return updateEntity(
      this,
      {
        voteCount: props.voteCount,
        voteScore: props.voteScore,
      },
      ChallengeSubmission,
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
    return updateEntity(this, { group }, ChallengeSubmission);
  }

  /**
   * Set the reviewer info (for display purposes)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  withReviewer(reviewer: ReviewerInfo): ChallengeSubmission {
    return updateEntity(this, { reviewedBy: reviewer }, ChallengeSubmission);
  }

  /**
   * Set the challenge info (for display purposes)
   * Returns a new ChallengeSubmission instance (immutable)
   */
  withChallenge(challenge: ChallengeInfo): ChallengeSubmission {
    return updateEntity(this, { challenge }, ChallengeSubmission);
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
