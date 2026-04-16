import { Effect } from "effect";
import { ValidationError, StateTransitionError } from "../../system/errors";
import {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
  isTerminalChallengeStatus,
} from "../../challenge/enums";
import { validate } from "../../system/utils/entity-validation";
import { createStateMachine } from "../../system/utils/state-machine";
import { timestamps, updateEntity } from "../../system/utils/immutable";

/**
 * Challenge entity - represents a challenge in the system
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
   * State machine for challenge status transitions
   */
  private static readonly stateMachine = createStateMachine<ChallengeStatus>({
    transitions: {
      [ChallengeStatus.HIDDEN]: [
        ChallengeStatus.VISIBLE,
        ChallengeStatus.CANCELLED,
      ],
      [ChallengeStatus.VISIBLE]: [
        ChallengeStatus.ACTIVE,
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
      // Validate tripId
      const tripId = yield* validate.id(props.tripId, "tripId");

      // Validate name
      const name = yield* validate.string(props.name, "name", {
        required: true,
        minLength: 1,
        maxLength: 255,
      });

      // Validate description if provided
      let description: string | null = null;
      if (props.description) {
        description = yield* validate.string(props.description, "description", {
          required: false,
          maxLength: 2000,
        });
      }

      // Validate image URL if provided
      let image: string | null = null;
      if (props.image) {
        image = yield* validate.string(props.image, "image", {
          required: false,
          maxLength: 1000,
        });
      }

      // Validate submission type
      const submissionType = props.submissionType;
      if (!Object.values(SubmissionType).includes(submissionType)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid submission type: ${submissionType}`,
            field: "submissionType",
          }),
        );
      }

      // Validate scoring category
      const scoringCategory = props.scoringCategory;
      if (!Object.values(ScoringCategory).includes(scoringCategory)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid scoring category: ${scoringCategory}`,
            field: "scoringCategory",
          }),
        );
      }

      // Validate status
      const status = props.status ?? ChallengeStatus.HIDDEN;
      if (!Object.values(ChallengeStatus).includes(status)) {
        return yield* Effect.fail(
          new ValidationError({
            message: `Invalid status: ${status}`,
            field: "status",
          }),
        );
      }

      // Validate daily time format if provided (HH:MM)
      let dailyStartTime: string | null = null;
      if (props.dailyStartTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(props.dailyStartTime)) {
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
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        if (!timeRegex.test(props.dailyEndTime)) {
          return yield* Effect.fail(
            new ValidationError({
              message: "dailyEndTime must be in HH:MM format",
              field: "dailyEndTime",
            }),
          );
        }
        dailyEndTime = props.dailyEndTime;
      }

      // Validate points
      const basePoints = props.basePoints ?? 0;
      if (basePoints < 0) {
        return yield* Effect.fail(
          new ValidationError({
            message: "basePoints must be non-negative",
            field: "basePoints",
          }),
        );
      }

      // Validate time range if both start and end are provided
      const startTime = props.startTime ?? null;
      const endTime = props.endTime ?? null;
      if (startTime && endTime && endTime < startTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endTime must be after startTime",
            field: "endTime",
          }),
        );
      }

      // Validate voting time range
      const votingStartTime = props.votingStartTime ?? null;
      const votingEndTime = props.votingEndTime ?? null;
      if (votingStartTime && votingEndTime && votingEndTime < votingStartTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "votingEndTime must be after votingStartTime",
            field: "votingEndTime",
          }),
        );
      }

      // Validate expected value if provided
      let expectedValue: string | null = null;
      if (props.expectedValue) {
        expectedValue = yield* validate.string(
          props.expectedValue,
          "expectedValue",
          {
            required: false,
            maxLength: 500,
          },
        );
      }

      const ts = timestamps(props);

      return new Challenge(
        props.id ?? crypto.randomUUID(),
        tripId,
        name,
        description,
        image,
        submissionType,
        scoringCategory,
        props.isRecurring ?? false,
        dailyStartTime,
        dailyEndTime,
        basePoints,
        props.firstPlacePoints ?? null,
        props.secondPlacePoints ?? null,
        props.thirdPlacePoints ?? null,
        status,
        startTime,
        endTime,
        votingStartTime,
        votingEndTime,
        props.targetLatitude ?? null,
        props.targetLongitude ?? null,
        expectedValue,
        props.autoApprove ?? false,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Transition challenge to a new status
   */
  transitionStatus(
    newStatus: ChallengeStatus,
  ): Effect.Effect<Challenge, StateTransitionError, never> {
    const self = this;
    return Effect.gen(function* () {
      if (!Challenge.stateMachine.canTransition(self.status, newStatus)) {
        return yield* Effect.fail(
          new StateTransitionError({
            message: `Cannot transition from ${self.status} to ${newStatus}`,
            from: self.status,
            to: newStatus,
            entityType: "Challenge",
          }),
        );
      }

      return updateEntity(self, { status: newStatus }, Challenge);
    });
  }

  /**
   * Make challenge visible
   */
  makeVisible(): Effect.Effect<Challenge, StateTransitionError, never> {
    return this.transitionStatus(ChallengeStatus.VISIBLE);
  }

  /**
   * Activate the challenge
   */
  activate(): Effect.Effect<Challenge, StateTransitionError, never> {
    return this.transitionStatus(ChallengeStatus.ACTIVE);
  }

  /**
   * Start voting phase
   */
  startVoting(): Effect.Effect<Challenge, StateTransitionError, never> {
    return this.transitionStatus(ChallengeStatus.VOTING_PHASE);
  }

  /**
   * Complete the challenge
   */
  complete(): Effect.Effect<Challenge, StateTransitionError, never> {
    return this.transitionStatus(ChallengeStatus.COMPLETED);
  }

  /**
   * Cancel the challenge
   */
  cancel(): Effect.Effect<Challenge, StateTransitionError, never> {
    return this.transitionStatus(ChallengeStatus.CANCELLED);
  }

  /**
   * Update challenge details
   */
  update(props: {
    name?: string;
    description?: string | null;
    image?: string | null;
    basePoints?: number;
    firstPlacePoints?: number | null;
    secondPlacePoints?: number | null;
    thirdPlacePoints?: number | null;
    startTime?: Date | null;
    endTime?: Date | null;
    votingStartTime?: Date | null;
    votingEndTime?: Date | null;
    targetLatitude?: number | null;
    targetLongitude?: number | null;
    expectedValue?: string | null;
    autoApprove?: boolean;
  }): Effect.Effect<Challenge, ValidationError, never> {
    const self = this;
    return Effect.gen(function* () {
      // Validate name if provided
      let name = self.name;
      if (props.name !== undefined) {
        name = yield* validate.string(props.name, "name", {
          required: true,
          minLength: 1,
          maxLength: 255,
        });
      }

      // Validate description if provided
      let description = self.description;
      if (props.description !== undefined) {
        if (props.description) {
          description = yield* validate.string(
            props.description,
            "description",
            {
              required: false,
              maxLength: 2000,
            },
          );
        } else {
          description = null;
        }
      }

      // Validate image if provided
      let image = self.image;
      if (props.image !== undefined) {
        if (props.image) {
          image = yield* validate.string(props.image, "image", {
            required: false,
            maxLength: 1000,
          });
        } else {
          image = null;
        }
      }

      // Validate basePoints if provided
      let basePoints = self.basePoints;
      if (props.basePoints !== undefined) {
        if (props.basePoints < 0) {
          return yield* Effect.fail(
            new ValidationError({
              message: "basePoints must be non-negative",
              field: "basePoints",
            }),
          );
        }
        basePoints = props.basePoints;
      }

      // Validate time ranges
      const startTime =
        props.startTime !== undefined ? props.startTime : self.startTime;
      const endTime =
        props.endTime !== undefined ? props.endTime : self.endTime;
      if (startTime && endTime && endTime < startTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "endTime must be after startTime",
            field: "endTime",
          }),
        );
      }

      const votingStartTime =
        props.votingStartTime !== undefined
          ? props.votingStartTime
          : self.votingStartTime;
      const votingEndTime =
        props.votingEndTime !== undefined
          ? props.votingEndTime
          : self.votingEndTime;
      if (votingStartTime && votingEndTime && votingEndTime < votingStartTime) {
        return yield* Effect.fail(
          new ValidationError({
            message: "votingEndTime must be after votingStartTime",
            field: "votingEndTime",
          }),
        );
      }

      // Validate expected value if provided
      let expectedValue = self.expectedValue;
      if (props.expectedValue !== undefined) {
        if (props.expectedValue) {
          expectedValue = yield* validate.string(
            props.expectedValue,
            "expectedValue",
            {
              required: false,
              maxLength: 500,
            },
          );
        } else {
          expectedValue = null;
        }
      }

      return updateEntity(
        self,
        {
          name,
          description,
          image,
          basePoints,
          firstPlacePoints: props.firstPlacePoints,
          secondPlacePoints: props.secondPlacePoints,
          thirdPlacePoints: props.thirdPlacePoints,
          startTime,
          endTime,
          votingStartTime,
          votingEndTime,
          targetLatitude: props.targetLatitude,
          targetLongitude: props.targetLongitude,
          expectedValue,
          autoApprove: props.autoApprove,
        },
        Challenge,
      );
    });
  }

  /**
   * Check if challenge is hidden
   */
  isHidden(): boolean {
    return this.status === ChallengeStatus.HIDDEN;
  }

  /**
   * Check if challenge is visible
   */
  isVisible(): boolean {
    return this.status === ChallengeStatus.VISIBLE;
  }

  /**
   * Check if challenge is active
   */
  isActive(): boolean {
    return this.status === ChallengeStatus.ACTIVE;
  }

  /**
   * Check if challenge is in voting phase
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
   * Check if challenge is in a terminal state
   */
  isTerminal(): boolean {
    return isTerminalChallengeStatus(this.status);
  }

  /**
   * Check if challenge accepts submissions
   */
  canAcceptSubmissions(): boolean {
    return this.status === ChallengeStatus.ACTIVE;
  }

  /**
   * Check if challenge accepts votes
   */
  canAcceptVotes(): boolean {
    return this.status === ChallengeStatus.VOTING_PHASE;
  }

  /**
   * Check if challenge has location target
   */
  hasLocationTarget(): boolean {
    return this.targetLatitude !== null && this.targetLongitude !== null;
  }

  /**
   * Check if challenge has expected value (for QR code or text submissions)
   */
  hasExpectedValue(): boolean {
    return this.expectedValue !== null && this.expectedValue.length > 0;
  }

  /**
   * Check if submission requires location
   */
  requiresLocation(): boolean {
    return (
      this.submissionType === SubmissionType.LOCATION ||
      this.submissionType === SubmissionType.IMAGE_LOCATION
    );
  }

  /**
   * Check if challenge is recurring
   */
  isDailyChallenge(): boolean {
    return this.isRecurring;
  }

  /**
   * Get points for a specific ranking position
   */
  getPointsForRanking(position: number): number {
    switch (position) {
      case 1:
        return this.firstPlacePoints ?? this.basePoints;
      case 2:
        return this.secondPlacePoints ?? this.basePoints;
      case 3:
        return this.thirdPlacePoints ?? this.basePoints;
      default:
        return this.basePoints;
    }
  }
}
