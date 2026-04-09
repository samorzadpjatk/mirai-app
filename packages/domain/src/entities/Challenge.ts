import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * Challenge submission types
 */
export enum SubmissionType {
  IMAGE = "IMAGE",
  MULTI_IMAGE = "MULTI_IMAGE",
  VIDEO = "VIDEO",
  TEXT = "TEXT",
  IMAGE_LOCATION = "IMAGE_LOCATION",
  LOCATION = "LOCATION",
  QR_CODE = "QR_CODE",
}

/**
 * Challenge scoring categories
 */
export enum ScoringCategory {
  SPEED = "SPEED",
  UNLIMITED = "UNLIMITED",
  JUDGED_STAFF = "JUDGED_STAFF",
  PEER_VOTING = "PEER_VOTING",
}

/**
 * Challenge status workflow
 * HIDDEN -> VISIBLE -> ACTIVE -> [VOTING_PHASE] -> COMPLETED
 *                            -> CANCELLED
 */
export enum ChallengeStatus {
  HIDDEN = "HIDDEN",
  VISIBLE = "VISIBLE",
  ACTIVE = "ACTIVE",
  VOTING_PHASE = "VOTING_PHASE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * Validation rules for challenge data
 */
const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    maxLength: 2000,
  },
  basePoints: {
    min: 0,
    max: 10000,
  },
  dailyTimeFormat: /^([01]\d|2[0-3]):([0-5]\d)$/, // HH:MM format
};

/**
 * Valid status transitions
 */
const VALID_STATUS_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  [ChallengeStatus.HIDDEN]: [
    ChallengeStatus.VISIBLE,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.VISIBLE]: [
    ChallengeStatus.ACTIVE,
    ChallengeStatus.HIDDEN,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.ACTIVE]: [
    ChallengeStatus.VOTING_PHASE,
    ChallengeStatus.COMPLETED,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.VOTING_PHASE]: [
    ChallengeStatus.COMPLETED,
    ChallengeStatus.CANCELLED,
  ],
  [ChallengeStatus.COMPLETED]: [], // Terminal state
  [ChallengeStatus.CANCELLED]: [], // Terminal state
};

/**
 * Challenge entity - represents a challenge/task in a trip
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class Challenge {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly image: string | null,
    public readonly submissionType: SubmissionType,
    public readonly scoringCategory: ScoringCategory,
    public readonly isRecurring: boolean,
    public readonly dailyStartTime: string | null,
    public readonly dailyEndTime: string | null,
    public readonly basePoints: number,
    public readonly firstPlacePoints: number | null,
    public readonly secondPlacePoints: number | null,
    public readonly thirdPlacePoints: number | null,
    public readonly status: ChallengeStatus,
    public readonly startTime: Date | null,
    public readonly endTime: Date | null,
    public readonly votingStartTime: Date | null,
    public readonly votingEndTime: Date | null,
    public readonly targetLatitude: number | null,
    public readonly targetLongitude: number | null,
    public readonly expectedValue: string | null,
    public readonly autoApprove: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new Challenge
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId: string;
    name: string;
    description?: string | null;
    image?: string | null;
    submissionType: SubmissionType;
    scoringCategory: ScoringCategory;
    isRecurring?: boolean;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
    basePoints?: number;
    firstPlacePoints?: number | null;
    secondPlacePoints?: number | null;
    thirdPlacePoints?: number | null;
    status?: ChallengeStatus;
    startTime?: Date | null;
    endTime?: Date | null;
    votingStartTime?: Date | null;
    votingEndTime?: Date | null;
    targetLatitude?: number | null;
    targetLongitude?: number | null;
    expectedValue?: string | null;
    autoApprove?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<Challenge, string> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate name
    if (!props.name || props.name.trim() === "") {
      return err("name is required");
    }
    if (props.name.length > VALIDATION_RULES.name.maxLength) {
      return err(
        `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
      );
    }

    // Validate description length
    if (
      props.description &&
      props.description.length > VALIDATION_RULES.description.maxLength
    ) {
      return err(
        `description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
      );
    }

    // Validate points
    const basePoints = props.basePoints ?? 0;
    if (basePoints < VALIDATION_RULES.basePoints.min) {
      return err(
        `basePoints must be at least ${VALIDATION_RULES.basePoints.min}`,
      );
    }
    if (basePoints > VALIDATION_RULES.basePoints.max) {
      return err(
        `basePoints must be at most ${VALIDATION_RULES.basePoints.max}`,
      );
    }

    // Validate ranking points
    if (
      props.firstPlacePoints !== undefined &&
      props.firstPlacePoints !== null &&
      props.firstPlacePoints < 0
    ) {
      return err("firstPlacePoints must be non-negative");
    }
    if (
      props.secondPlacePoints !== undefined &&
      props.secondPlacePoints !== null &&
      props.secondPlacePoints < 0
    ) {
      return err("secondPlacePoints must be non-negative");
    }
    if (
      props.thirdPlacePoints !== undefined &&
      props.thirdPlacePoints !== null &&
      props.thirdPlacePoints < 0
    ) {
      return err("thirdPlacePoints must be non-negative");
    }

    // Validate time range
    if (
      props.startTime &&
      props.endTime &&
      props.endTime.getTime() < props.startTime.getTime()
    ) {
      return err("endTime must be after startTime");
    }

    // Validate daily time format
    if (
      props.dailyStartTime &&
      !VALIDATION_RULES.dailyTimeFormat.test(props.dailyStartTime)
    ) {
      return err("dailyStartTime must be in HH:MM format");
    }
    if (
      props.dailyEndTime &&
      !VALIDATION_RULES.dailyTimeFormat.test(props.dailyEndTime)
    ) {
      return err("dailyEndTime must be in HH:MM format");
    }

    const now = new Date();

    return ok(
      new Challenge(
        props.id ?? crypto.randomUUID(),
        props.tripId.trim(),
        props.name.trim(),
        props.description ?? null,
        props.image ?? null,
        props.submissionType,
        props.scoringCategory,
        props.isRecurring ?? false,
        props.dailyStartTime ?? null,
        props.dailyEndTime ?? null,
        basePoints,
        props.firstPlacePoints ?? null,
        props.secondPlacePoints ?? null,
        props.thirdPlacePoints ?? null,
        props.status ?? ChallengeStatus.HIDDEN,
        props.startTime ?? null,
        props.endTime ?? null,
        props.votingStartTime ?? null,
        props.votingEndTime ?? null,
        props.targetLatitude ?? null,
        props.targetLongitude ?? null,
        props.expectedValue ?? null,
        props.autoApprove ?? false,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Update challenge details (name, description, image)
   * Returns a new Challenge instance (immutable)
   */
  updateDetails(props: {
    name?: string;
    description?: string | null;
    image?: string | null;
  }): Result<Challenge, string> {
    // Validate name if provided
    if (props.name !== undefined) {
      if (props.name.trim() === "") {
        return err("name is required");
      }
      if (props.name.length > VALIDATION_RULES.name.maxLength) {
        return err(
          `name must be at most ${VALIDATION_RULES.name.maxLength} characters`,
        );
      }
    }

    // Validate description if provided
    if (props.description !== undefined && props.description !== null) {
      if (props.description.length > VALIDATION_RULES.description.maxLength) {
        return err(
          `description must be at most ${VALIDATION_RULES.description.maxLength} characters`,
        );
      }
    }

    return ok(
      new Challenge(
        this.id,
        this.tripId,
        props.name ?? this.name,
        props.description !== undefined ? props.description : this.description,
        props.image !== undefined ? props.image : this.image,
        this.submissionType,
        this.scoringCategory,
        this.isRecurring,
        this.dailyStartTime,
        this.dailyEndTime,
        this.basePoints,
        this.firstPlacePoints,
        this.secondPlacePoints,
        this.thirdPlacePoints,
        this.status,
        this.startTime,
        this.endTime,
        this.votingStartTime,
        this.votingEndTime,
        this.targetLatitude,
        this.targetLongitude,
        this.expectedValue,
        this.autoApprove,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update challenge status
   * Returns a new Challenge instance (immutable)
   * @throws if status transition is invalid
   */
  updateStatus(newStatus: ChallengeStatus): Challenge {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    return new Challenge(
      this.id,
      this.tripId,
      this.name,
      this.description,
      this.image,
      this.submissionType,
      this.scoringCategory,
      this.isRecurring,
      this.dailyStartTime,
      this.dailyEndTime,
      this.basePoints,
      this.firstPlacePoints,
      this.secondPlacePoints,
      this.thirdPlacePoints,
      newStatus,
      this.startTime,
      this.endTime,
      this.votingStartTime,
      this.votingEndTime,
      this.targetLatitude,
      this.targetLongitude,
      this.expectedValue,
      this.autoApprove,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Update challenge points
   * Returns a new Challenge instance (immutable)
   */
  updatePoints(props: {
    basePoints?: number;
    firstPlacePoints?: number | null;
    secondPlacePoints?: number | null;
    thirdPlacePoints?: number | null;
  }): Result<Challenge, string> {
    // Validate basePoints if provided
    if (props.basePoints !== undefined) {
      if (props.basePoints < VALIDATION_RULES.basePoints.min) {
        return err(
          `basePoints must be at least ${VALIDATION_RULES.basePoints.min}`,
        );
      }
      if (props.basePoints > VALIDATION_RULES.basePoints.max) {
        return err(
          `basePoints must be at most ${VALIDATION_RULES.basePoints.max}`,
        );
      }
    }

    // Validate ranking points
    if (
      props.firstPlacePoints !== undefined &&
      props.firstPlacePoints !== null &&
      props.firstPlacePoints < 0
    ) {
      return err("firstPlacePoints must be non-negative");
    }
    if (
      props.secondPlacePoints !== undefined &&
      props.secondPlacePoints !== null &&
      props.secondPlacePoints < 0
    ) {
      return err("secondPlacePoints must be non-negative");
    }
    if (
      props.thirdPlacePoints !== undefined &&
      props.thirdPlacePoints !== null &&
      props.thirdPlacePoints < 0
    ) {
      return err("thirdPlacePoints must be non-negative");
    }

    return ok(
      new Challenge(
        this.id,
        this.tripId,
        this.name,
        this.description,
        this.image,
        this.submissionType,
        this.scoringCategory,
        this.isRecurring,
        this.dailyStartTime,
        this.dailyEndTime,
        props.basePoints ?? this.basePoints,
        props.firstPlacePoints !== undefined
          ? props.firstPlacePoints
          : this.firstPlacePoints,
        props.secondPlacePoints !== undefined
          ? props.secondPlacePoints
          : this.secondPlacePoints,
        props.thirdPlacePoints !== undefined
          ? props.thirdPlacePoints
          : this.thirdPlacePoints,
        this.status,
        this.startTime,
        this.endTime,
        this.votingStartTime,
        this.votingEndTime,
        this.targetLatitude,
        this.targetLongitude,
        this.expectedValue,
        this.autoApprove,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Update challenge schedule
   * Returns a new Challenge instance (immutable)
   */
  updateSchedule(props: {
    startTime?: Date | null;
    endTime?: Date | null;
    votingStartTime?: Date | null;
    votingEndTime?: Date | null;
    dailyStartTime?: string | null;
    dailyEndTime?: string | null;
  }): Result<Challenge, string> {
    const newStartTime =
      props.startTime !== undefined ? props.startTime : this.startTime;
    const newEndTime =
      props.endTime !== undefined ? props.endTime : this.endTime;

    // Validate time range
    if (
      newStartTime &&
      newEndTime &&
      newEndTime.getTime() < newStartTime.getTime()
    ) {
      return err("endTime must be after startTime");
    }

    // Validate daily time format
    if (
      props.dailyStartTime &&
      !VALIDATION_RULES.dailyTimeFormat.test(props.dailyStartTime)
    ) {
      return err("dailyStartTime must be in HH:MM format");
    }
    if (
      props.dailyEndTime &&
      !VALIDATION_RULES.dailyTimeFormat.test(props.dailyEndTime)
    ) {
      return err("dailyEndTime must be in HH:MM format");
    }

    return ok(
      new Challenge(
        this.id,
        this.tripId,
        this.name,
        this.description,
        this.image,
        this.submissionType,
        this.scoringCategory,
        this.isRecurring,
        props.dailyStartTime !== undefined
          ? props.dailyStartTime
          : this.dailyStartTime,
        props.dailyEndTime !== undefined
          ? props.dailyEndTime
          : this.dailyEndTime,
        this.basePoints,
        this.firstPlacePoints,
        this.secondPlacePoints,
        this.thirdPlacePoints,
        this.status,
        newStartTime,
        newEndTime,
        props.votingStartTime !== undefined
          ? props.votingStartTime
          : this.votingStartTime,
        props.votingEndTime !== undefined
          ? props.votingEndTime
          : this.votingEndTime,
        this.targetLatitude,
        this.targetLongitude,
        this.expectedValue,
        this.autoApprove,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Check if status can transition to new status
   */
  canTransitionTo(newStatus: ChallengeStatus): boolean {
    const validTransitions = VALID_STATUS_TRANSITIONS[this.status];
    return validTransitions.includes(newStatus);
  }

  /**
   * Check if challenge is currently active
   */
  isActive(): boolean {
    return this.status === ChallengeStatus.ACTIVE;
  }

  /**
   * Check if challenge is open for submissions
   * Must be ACTIVE and within time window
   */
  isOpenForSubmission(): boolean {
    if (!this.isActive()) {
      return false;
    }

    const now = new Date();

    // Check start time
    if (this.startTime && now.getTime() < this.startTime.getTime()) {
      return false;
    }

    // Check end time
    if (this.endTime && now.getTime() > this.endTime.getTime()) {
      return false;
    }

    return true;
  }

  /**
   * Check if challenge is currently in voting phase
   */
  isInVotingPhase(): boolean {
    return this.status === ChallengeStatus.VOTING_PHASE;
  }

  /**
   * Check if challenge is completed
   */
  isCompleted(): boolean {
    return this.status === ChallengeStatus.COMPLETED;
  }

  /**
   * Check if challenge is cancelled
   */
  isCancelled(): boolean {
    return this.status === ChallengeStatus.CANCELLED;
  }

  /**
   * Check if challenge is in a terminal state (COMPLETED or CANCELLED)
   */
  isTerminal(): boolean {
    return this.isCompleted() || this.isCancelled();
  }

  /**
   * Check if this submission type requires location
   */
  requiresLocation(): boolean {
    return (
      this.submissionType === SubmissionType.IMAGE_LOCATION ||
      this.submissionType === SubmissionType.LOCATION
    );
  }

  /**
   * Check if this submission type requires QR code
   */
  requiresQRCode(): boolean {
    return this.submissionType === SubmissionType.QR_CODE;
  }

  /**
   * Check if this challenge has a voting phase
   */
  hasVotingPhase(): boolean {
    return this.scoringCategory === ScoringCategory.PEER_VOTING;
  }

  /**
   * Check if this challenge is staff-judged
   */
  isStaffJudged(): boolean {
    return this.scoringCategory === ScoringCategory.JUDGED_STAFF;
  }

  /**
   * Check if this challenge is speed-based
   */
  isSpeedBased(): boolean {
    return this.scoringCategory === ScoringCategory.SPEED;
  }

  /**
   * Check if this challenge has unlimited submissions
   */
  isUnlimited(): boolean {
    return this.scoringCategory === ScoringCategory.UNLIMITED;
  }

  /**
   * Check if challenge has a target location set
   */
  hasTargetLocation(): boolean {
    return this.targetLatitude !== null && this.targetLongitude !== null;
  }

  /**
   * Get target location as tuple [lat, lng] or null
   */
  getTargetLocation(): [number, number] | null {
    if (this.hasTargetLocation()) {
      return [this.targetLatitude!, this.targetLongitude!];
    }
    return null;
  }
}
