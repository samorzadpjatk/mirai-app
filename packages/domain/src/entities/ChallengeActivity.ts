import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";
import { SubmissionType } from "./Challenge";

/**
 * ChallengeActivity entity - represents challenge lifecycle events in activity feed
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class ChallengeActivity {
  private constructor(
    public readonly activityId: string,
    public readonly challengeId: string,
    public readonly eventType: string,
    public readonly endTime: Date | null,
    public readonly submissionType: SubmissionType | null,
    public readonly basePoints: number | null,
    public readonly submissionCount: number | null,
  ) {}

  /**
   * Factory method to create a new ChallengeActivity
   * Validates all input data
   */
  static create(props: {
    activityId: string;
    challengeId: string;
    eventType: string;
    endTime?: Date | null;
    submissionType?: SubmissionType | null;
    basePoints?: number | null;
    submissionCount?: number | null;
  }): Result<ChallengeActivity, string> {
    // Validate activityId
    if (!props.activityId || props.activityId.trim() === "") {
      return err("activityId is required");
    }

    // Validate challengeId
    if (!props.challengeId || props.challengeId.trim() === "") {
      return err("challengeId is required");
    }

    // Validate eventType
    if (!props.eventType || props.eventType.trim() === "") {
      return err("eventType is required");
    }

    // Validate basePoints if provided
    if (props.basePoints !== undefined && props.basePoints !== null) {
      if (props.basePoints < 0) {
        return err("basePoints must be non-negative");
      }
    }

    // Validate submissionCount if provided
    if (props.submissionCount !== undefined && props.submissionCount !== null) {
      if (props.submissionCount < 0) {
        return err("submissionCount must be non-negative");
      }
    }

    return ok(
      new ChallengeActivity(
        props.activityId.trim(),
        props.challengeId.trim(),
        props.eventType.trim(),
        props.endTime ?? null,
        props.submissionType ?? null,
        props.basePoints ?? null,
        props.submissionCount ?? null,
      ),
    );
  }

  /**
   * Update end time
   * Returns a new ChallengeActivity instance (immutable)
   */
  updateEndTime(endTime: Date | null): ChallengeActivity {
    return new ChallengeActivity(
      this.activityId,
      this.challengeId,
      this.eventType,
      endTime,
      this.submissionType,
      this.basePoints,
      this.submissionCount,
    );
  }

  /**
   * Update submission count
   * Returns a new ChallengeActivity instance (immutable)
   */
  updateSubmissionCount(count: number): Result<ChallengeActivity, string> {
    if (count < 0) {
      return err("submissionCount must be non-negative");
    }

    return ok(
      new ChallengeActivity(
        this.activityId,
        this.challengeId,
        this.eventType,
        this.endTime,
        this.submissionType,
        this.basePoints,
        count,
      ),
    );
  }

  /**
   * Update base points
   * Returns a new ChallengeActivity instance (immutable)
   */
  updateBasePoints(points: number | null): Result<ChallengeActivity, string> {
    if (points !== null && points < 0) {
      return err("basePoints must be non-negative");
    }

    return ok(
      new ChallengeActivity(
        this.activityId,
        this.challengeId,
        this.eventType,
        this.endTime,
        this.submissionType,
        points,
        this.submissionCount,
      ),
    );
  }

  /**
   * Check if challenge has ended
   */
  hasEnded(): boolean {
    if (this.endTime === null) {
      return false;
    }
    return new Date() >= this.endTime;
  }

  /**
   * Check if has submission type info
   */
  hasSubmissionType(): boolean {
    return this.submissionType !== null;
  }

  /**
   * Check if has base points info
   */
  hasBasePoints(): boolean {
    return this.basePoints !== null;
  }

  /**
   * Check if has submission count
   */
  hasSubmissionCount(): boolean {
    return this.submissionCount !== null;
  }

  /**
   * Event type checks
   */
  isStarted(): boolean {
    return this.eventType.toLowerCase() === "started";
  }

  isEnded(): boolean {
    return this.eventType.toLowerCase() === "ended";
  }

  isVotingStarted(): boolean {
    return this.eventType.toLowerCase() === "voting_started";
  }

  isVotingEnded(): boolean {
    return this.eventType.toLowerCase() === "voting_ended";
  }

  /**
   * Get formatted duration until end
   */
  getTimeRemaining(): number | null {
    if (this.endTime === null) {
      return null;
    }
    const remaining = this.endTime.getTime() - Date.now();
    return remaining > 0 ? remaining : 0;
  }
}
