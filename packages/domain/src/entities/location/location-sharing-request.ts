import { Effect } from "effect";
import { validate } from "../../utils/entity-validation";
import { createStateMachine } from "../../utils/state-machine";
import { updateEntity, timestamps } from "../../utils/immutable";
import { ValidationError, StateTransitionError } from "../../errors";
import { LocationSharingRequestStatus } from "../../enums/location";

/**
 * State machine for LocationSharingRequest status transitions
 */
const stateMachine = createStateMachine<LocationSharingRequestStatus>({
  transitions: {
    [LocationSharingRequestStatus.PENDING]: [
      LocationSharingRequestStatus.ACCEPTED,
      LocationSharingRequestStatus.REJECTED,
    ],
    [LocationSharingRequestStatus.ACCEPTED]: [],
    [LocationSharingRequestStatus.REJECTED]: [],
  },
  terminalStates: [
    LocationSharingRequestStatus.ACCEPTED,
    LocationSharingRequestStatus.REJECTED,
  ],
});

/**
 * LocationSharingRequest entity - represents friend-to-friend location sharing requests
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class LocationSharingRequest {
  private constructor(
    public readonly id: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly status: LocationSharingRequestStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new LocationSharingRequest
   * Validates all input data
   *
   * Returns Effect<LocationSharingRequest, ValidationError, never>
   */
  static create(props: {
    id?: string;
    senderId: string;
    receiverId: string;
    status?: LocationSharingRequestStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<LocationSharingRequest, ValidationError, never> {
    return Effect.gen(function* () {
      // Validate senderId
      const senderId = yield* validate.id(props.senderId, "senderId");

      // Validate receiverId
      const receiverId = yield* validate.id(props.receiverId, "receiverId");

      // Check that sender and receiver are different
      if (senderId === receiverId) {
        return yield* Effect.fail(
          new ValidationError({
            message: "senderId and receiverId must be different",
            field: "receiverId",
          }),
        );
      }

      const ts = timestamps(props);

      return new LocationSharingRequest(
        props.id ?? crypto.randomUUID(),
        senderId,
        receiverId,
        props.status ?? LocationSharingRequestStatus.PENDING,
        ts.createdAt,
        ts.updatedAt,
      );
    });
  }

  /**
   * Reconstitute a LocationSharingRequest from persistence (bypasses validation)
   * Use this when loading from database - assumes data is already valid
   */
  static reconstitute(data: {
    id: string;
    senderId: string;
    receiverId: string;
    status: LocationSharingRequestStatus;
    createdAt: Date;
    updatedAt: Date;
  }): LocationSharingRequest {
    return new LocationSharingRequest(
      data.id,
      data.senderId,
      data.receiverId,
      data.status,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * Accept the request
   * Returns a Effect with new LocationSharingRequest instance or StateTransitionError
   */
  accept(): Effect.Effect<LocationSharingRequest, StateTransitionError, never> {
    if (
      !stateMachine.canTransition(
        this.status,
        LocationSharingRequestStatus.ACCEPTED,
      )
    ) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: LocationSharingRequestStatus.ACCEPTED,
          entityType: "LocationSharingRequest",
          message: `Cannot accept LocationSharingRequest in ${this.status} status`,
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        { status: LocationSharingRequestStatus.ACCEPTED },
        LocationSharingRequest,
      ),
    );
  }

  /**
   * Reject the request
   * Returns a Effect with new LocationSharingRequest instance or StateTransitionError
   */
  reject(): Effect.Effect<LocationSharingRequest, StateTransitionError, never> {
    if (
      !stateMachine.canTransition(
        this.status,
        LocationSharingRequestStatus.REJECTED,
      )
    ) {
      return Effect.fail(
        new StateTransitionError({
          from: this.status,
          to: LocationSharingRequestStatus.REJECTED,
          entityType: "LocationSharingRequest",
          message: `Cannot reject LocationSharingRequest in ${this.status} status`,
        }),
      );
    }

    return Effect.succeed(
      updateEntity(
        this,
        { status: LocationSharingRequestStatus.REJECTED },
        LocationSharingRequest,
      ),
    );
  }

  /**
   * Check if request is pending
   */
  isPending(): boolean {
    return this.status === LocationSharingRequestStatus.PENDING;
  }

  /**
   * Check if request is accepted
   */
  isAccepted(): boolean {
    return this.status === LocationSharingRequestStatus.ACCEPTED;
  }

  /**
   * Check if request is rejected
   */
  isRejected(): boolean {
    return this.status === LocationSharingRequestStatus.REJECTED;
  }

  /**
   * Check if request is in a terminal state (accepted or rejected)
   */
  isResolved(): boolean {
    return stateMachine.isTerminal(this.status);
  }

  /**
   * Get unique composite identifier (senderId + receiverId)
   */
  getUniqueKey(): string {
    return `${this.senderId}:${this.receiverId}`;
  }

  /**
   * Check if this user is involved in the request (as sender or receiver)
   */
  involvesUser(userId: string): boolean {
    return this.senderId === userId || this.receiverId === userId;
  }

  /**
   * Check if user is the sender
   */
  isFromUser(userId: string): boolean {
    return this.senderId === userId;
  }

  /**
   * Check if user is the receiver
   */
  isToUser(userId: string): boolean {
    return this.receiverId === userId;
  }

  /**
   * Get the other party's ID given one user's ID
   */
  getOtherParty(userId: string): string | null {
    if (this.senderId === userId) return this.receiverId;
    if (this.receiverId === userId) return this.senderId;
    return null;
  }
}
