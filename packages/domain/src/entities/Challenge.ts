import { Effect } from "effect";
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

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
 * Regex for validating daily time format (HH:MM)
 */
const DAILY_TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * State machine for Challenge status transitions
 */
const stateMachine = createStateMachine<ChallengeStatus>({
  transitions: {
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
    [ChallengeStatus.COMPLETED]: [],
    [ChallengeStatus.CANCELLED]: [],
  },
  terminalStates: [ChallengeStatus.COMPLETED, ChallengeStatus.CANCELLED],
});

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
    public name: string,
    public description: string | null,
    public image: string | null,
    public readonly submissionType: SubmissionType,
    public readonly scoringCategory: ScoringCategory,
    public readonly isRecurring: boolean,
    public dailyStartTime: string | null,
    public dailyEndTime: string | null,
    public basePoints: number,
    public firstPlacePoints: number | null,
    public secondPlacePoints: number | null,
    public thirdPlacePoints: number | null,
    public status: ChallengeStatus,
    public startTime: Date | null,
    public endTime: Date | null,
    public votingStartTime: Date | null,
    public votingEndTime: Date | null,
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
  }): Effect.Effect<Challenge, ValidationError, never> {
    return Effect.gen(function* () {
      const tripId = yield* validate.id(props.tripId, "tripId");
      const name = yield* validate.string(props.name, "name", {
        required: true,
        maxLength: 200,
        trim: true,
      });
      const description = yield* validate.string(
        props.description ?? "",
        "description",
        {
          required: false,
          maxLength: 2000,
          trim: true,
        },
      );
      const basePoints = yield* validate.number(
        props.basePoints ?? 0,
        "basePoints",
        {
          required: true,
          min: 0,
          max: 10000,
        },
      );

      // Validate firstPlacePoints
      let firstPlacePoints: number | null = null;
      if (
        props.firstPlacePoints !== undefined &&
        props.firstPlacePoints !== null
      ) {
        firstPlacePoints = yield* validate.number(
          props.firstPlacePoints,
          "firstPlacePoints",
          {
            required: true,
            min: 0,
          },
        );
      }

      // Validate secondPlacePoints
      let secondPlacePoints: number | null = null;
      if (
        props.secondPlacePoints !== undefined &&
        props.secondPlacePoints !== null
      ) {
        secondPlacePoints = yield* validate.number(
          props.secondPlacePoints,
          "secondPlacePoints",
          {
            required: true,
            min: 0,
          },
        );
      }

      // Validate thirdPlacePoints
      let thirdPlacePoints: number | null = null;
      if (
        props.thirdPlacePoints !== undefined &&
        props.thirdPlacePoints !== null
      ) {
        thirdPlacePoints = yield* validate.number(
          props.thirdPlacePoints,
          "thirdPlacePoints",
          {
            required: true,
            min: 0,
          },
        );
      }

      // Validate date range
      if (props.startTime && props.endTime) {
        yield* validate.dateRange(props.startTime, props.endTime).pipe(
          Effect.mapError(
            () =>
              new ValidationError({
                message: "endTime must be after startTime",
                field: "endTime",
              }),
          ),
        );
      }

      // Validate daily time format
      let dailyStartTime: string | null = null;
      if (props.dailyStartTime) {
        if (!DAILY_TIME_FORMAT.test(props.dailyStartTime)) {
          return yield* Effect.fail(
            new ValidationError({
              message: "dailyStartTime must be in HH:MM format",
              field: "dailyStartTime",
            }),
          );
        }
        dailyStartTime = props.dailyStartTime;
      }

      let dailyEndTime: string | null = null;
      if (props.dailyEndTime) {
        if (!DAILY_TIME_FORMAT.test(props.dailyEndTime)) {
          return yield* Effect.fail(
            new ValidationError({
              message: "dailyEndTime must be in HH:MM format",
              field: "dailyEndTime",
            }),
          );
        }
        dailyEndTime = props.dailyEndTime;
      }

      const ts = timestamps(props);

      return new Challenge(
        props.id ?? crypto.randomUUID(),
        tripId,
        name,
        description || null,
        props.image ?? null,
        props.submissionType,
        props.scoringCategory,
        props.isRecurring ?? false,
        dailyStartTime,
        dailyEndTime,
        basePoints,
        firstPlacePoints,
        secondPlacePoints,
        thirdPlacePoints,
        props.status ?? ChallengeStatus.HIDDEN,
        props.startTime ?? null,
        props.endTime ?? null,
        props.votingStartTime ?? null,
        props.votingEndTime ?? null,
        props.targetLatitude ?? null,
        props.targetLongitude ?? null,
        props.expectedValue ?? null,
        props.autoApprove ?? false,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Update challenge details (name, description, image)
   * Returns a new Challenge instance (immutable)
   */
  updateDetails(props: {
    name?: string;
    description?: string | null;
    image?: string | null;
  }): Effect.Effect<Challenge, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      const updates: Partial<Challenge> = {};

      // Validate name if provided
      if (props.name !== undefined) {
        updates.name = yield* validate.string(props.name, "name", {
          required: true,
          maxLength: 200,
          trim: true,
        });
      }

      // Validate description if provided
      if (props.description !== undefined && props.description !== null) {
        updates.description = yield* validate.string(
          props.description,
          "description",
          {
            required: false,
            maxLength: 2000,
            trim: true,
          },
        );
      } else if (props.description === null) {
        updates.description = null;
      }

      if (props.image !== undefined) {
        updates.image = props.image;
      }

      return updateEntity(self, updates, Challenge);
    });
  }

  /**
   * Update challenge status
   * Returns an Effect with new Challenge instance or StateTransitionError
   */
  updateStatus(
    newStatus: ChallengeStatus,
  ): Effect.Effect<Challenge, StateTransitionError, never> {
    if (!stateMachine.canTransition(this.status, newStatus)) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: newStatus,
          entityType: "Challenge",
        }),
      );
    }

    return Effect.succeed(updateEntity(this, { status: newStatus }, Challenge));
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
  }): Effect.Effect<Challenge, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      const updates: Partial<Challenge> = {};

      // Validate basePoints if provided
      if (props.basePoints !== undefined) {
        updates.basePoints = yield* validate.number(
          props.basePoints,
          "basePoints",
          {
            required: true,
            min: 0,
            max: 10000,
          },
        );
      }

      // Validate firstPlacePoints
      if (props.firstPlacePoints !== undefined) {
        if (props.firstPlacePoints !== null) {
          yield* validate.number(props.firstPlacePoints, "firstPlacePoints", {
            required: true,
            min: 0,
          });
        }
        updates.firstPlacePoints = props.firstPlacePoints;
      }

      // Validate secondPlacePoints
      if (props.secondPlacePoints !== undefined) {
        if (props.secondPlacePoints !== null) {
          yield* validate.number(props.secondPlacePoints, "secondPlacePoints", {
            required: true,
            min: 0,
          });
        }
        updates.secondPlacePoints = props.secondPlacePoints;
      }

      // Validate thirdPlacePoints
      if (props.thirdPlacePoints !== undefined) {
        if (props.thirdPlacePoints !== null) {
          yield* validate.number(props.thirdPlacePoints, "thirdPlacePoints", {
            required: true,
            min: 0,
          });
        }
        updates.thirdPlacePoints = props.thirdPlacePoints;
      }

      return updateEntity(self, updates, Challenge);
    });
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
  }): Effect.Effect<Challenge, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      const updates: Partial<Challenge> = {};

      const newStartTime =
        props.startTime !== undefined ? props.startTime : self.startTime;
      const newEndTime =
        props.endTime !== undefined ? props.endTime : self.endTime;

      // Validate time range
      if (newStartTime && newEndTime) {
        yield* validate.dateRange(newStartTime, newEndTime).pipe(
          Effect.mapError(
            () =>
              new ValidationError({
                message: "endTime must be after startTime",
                field: "endTime",
              }),
          ),
        );
      }

      if (props.startTime !== undefined) updates.startTime = props.startTime;
      if (props.endTime !== undefined) updates.endTime = props.endTime;
      if (props.votingStartTime !== undefined)
        updates.votingStartTime = props.votingStartTime;
      if (props.votingEndTime !== undefined)
        updates.votingEndTime = props.votingEndTime;

      // Validate daily time format
      if (props.dailyStartTime !== undefined && props.dailyStartTime !== null) {
        if (!DAILY_TIME_FORMAT.test(props.dailyStartTime)) {
          return yield* Effect.fail(
            new ValidationError({
              message: "dailyStartTime must be in HH:MM format",
              field: "dailyStartTime",
            }),
          );
        }
        updates.dailyStartTime = props.dailyStartTime;
      } else if (props.dailyStartTime === null) {
        updates.dailyStartTime = null;
      }

      if (props.dailyEndTime !== undefined && props.dailyEndTime !== null) {
        if (!DAILY_TIME_FORMAT.test(props.dailyEndTime)) {
          return yield* Effect.fail(
            new ValidationError({
              message: "dailyEndTime must be in HH:MM format",
              field: "dailyEndTime",
            }),
          );
        }
        updates.dailyEndTime = props.dailyEndTime;
      } else if (props.dailyEndTime === null) {
        updates.dailyEndTime = null;
      }

      return updateEntity(self, updates, Challenge);
    });
  }

  /**
   * Check if status can transition to new status
   */
  canTransitionTo(newStatus: ChallengeStatus): boolean {
    return stateMachine.canTransition(this.status, newStatus);
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
    return stateMachine.isTerminal(this.status);
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
