import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * SubmissionActivity entity - represents a challenge submission in activity feed
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class SubmissionActivity {
  private constructor(
    public readonly activityId: string,
    public readonly submissionId: string,
    public readonly challengeId: string,
    public readonly groupId: string,
    public readonly hasVideo: boolean,
    public readonly isWinner: boolean,
    public readonly ranking: number | null,
    public readonly pointsAwarded: number | null,
  ) {}

  /**
   * Factory method to create a new SubmissionActivity
   * Validates all input data
   */
  static create(props: {
    activityId: string;
    submissionId: string;
    challengeId: string;
    groupId: string;
    hasVideo: boolean;
    isWinner?: boolean;
    ranking?: number | null;
    pointsAwarded?: number | null;
  }): Result<SubmissionActivity, string> {
    // Validate activityId
    if (!props.activityId || props.activityId.trim() === "") {
      return err("activityId is required");
    }

    // Validate submissionId
    if (!props.submissionId || props.submissionId.trim() === "") {
      return err("submissionId is required");
    }

    // Validate challengeId
    if (!props.challengeId || props.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate ranking if provided
    if (props.ranking !== undefined && props.ranking !== null) {
      if (props.ranking < 1) {
        return err("ranking must be at least 1");
      }
    }

    // Validate pointsAwarded if provided
    if (props.pointsAwarded !== undefined && props.pointsAwarded !== null) {
      if (props.pointsAwarded < 0) {
        return err("pointsAwarded must be non-negative");
      }
    }

    return ok(
      new SubmissionActivity(
        props.activityId.trim(),
        props.submissionId.trim(),
        props.challengeId.trim(),
        props.groupId.trim(),
        props.hasVideo,
        props.isWinner ?? false,
        props.ranking ?? null,
        props.pointsAwarded ?? null,
      ),
    );
  }

  /**
   * Mark as winner with ranking
   * Returns a new SubmissionActivity instance (immutable)
   */
  markAsWinner(
    ranking: number,
    pointsAwarded: number,
  ): Result<SubmissionActivity, string> {
    if (ranking < 1) {
      return err("ranking must be at least 1");
    }
    if (pointsAwarded < 0) {
      return err("pointsAwarded must be non-negative");
    }

    return ok(
      new SubmissionActivity(
        this.activityId,
        this.submissionId,
        this.challengeId,
        this.groupId,
        this.hasVideo,
        true,
        ranking,
        pointsAwarded,
      ),
    );
  }

  /**
   * Remove winner status
   * Returns a new SubmissionActivity instance (immutable)
   */
  removeWinnerStatus(): SubmissionActivity {
    return new SubmissionActivity(
      this.activityId,
      this.submissionId,
      this.challengeId,
      this.groupId,
      this.hasVideo,
      false,
      null,
      null,
    );
  }

  /**
   * Update points awarded
   * Returns a new SubmissionActivity instance (immutable)
   */
  updatePointsAwarded(points: number): Result<SubmissionActivity, string> {
    if (points < 0) {
      return err("points must be non-negative");
    }

    return ok(
      new SubmissionActivity(
        this.activityId,
        this.submissionId,
        this.challengeId,
        this.groupId,
        this.hasVideo,
        this.isWinner,
        this.ranking,
        points,
      ),
    );
  }

  /**
   * Check if this is a winning submission
   */
  isWinningSubmission(): boolean {
    return this.isWinner;
  }

  /**
   * Check if submission has a ranking
   */
  hasRanking(): boolean {
    return this.ranking !== null;
  }

  /**
   * Check if points were awarded
   */
  hasPointsAwarded(): boolean {
    return this.pointsAwarded !== null && this.pointsAwarded > 0;
  }

  /**
   * Check if submission includes video
   */
  includesVideo(): boolean {
    return this.hasVideo;
  }

  /**
   * Get formatted ranking text
   */
  getRankingText(): string {
    if (!this.hasRanking()) {
      return "Unranked";
    }
    const rank = this.ranking!;
    const suffix =
      rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
    return `${rank}${suffix} place`;
  }
}
