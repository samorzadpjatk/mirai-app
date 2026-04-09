import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * TripParticipantRole - represents the role of a participant in a trip
 */
export enum TripParticipantRole {
  MEMBER = "MEMBER",
  LEADER = "LEADER",
}

/**
 * Validation rules for TripParticipant data
 */
const VALIDATION_RULES = {
  wristNumber: {
    maxLength: 50,
  },
  houseNumber: {
    maxLength: 50,
  },
};

/**
 * TripParticipant entity - represents a user's participation in a trip
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class TripParticipant {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tripId: string,
    public readonly groupId: string | null,
    public readonly wristNumber: string | null,
    public readonly houseNumber: string | null,
    public readonly role: TripParticipantRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new TripParticipant
   * Validates all input data
   */
  static create(props: {
    id?: string;
    userId: string;
    tripId: string;
    groupId?: string | null;
    wristNumber?: string | null;
    houseNumber?: string | null;
    role?: TripParticipantRole;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<TripParticipant, string> {
    // Validate userId
    if (!props.userId || props.userId.trim() === "") {
      return err("userId is required");
    }

    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate role
    const role = props.role ?? TripParticipantRole.MEMBER;
    if (!Object.values(TripParticipantRole).includes(role)) {
      return err(`Invalid role: ${role}. Must be MEMBER or LEADER`);
    }

    // Validate wristNumber if provided
    if (
      props.wristNumber &&
      props.wristNumber.length > VALIDATION_RULES.wristNumber.maxLength
    ) {
      return err(
        `wristNumber must be at most ${VALIDATION_RULES.wristNumber.maxLength} characters`,
      );
    }

    // Validate houseNumber if provided
    if (
      props.houseNumber &&
      props.houseNumber.length > VALIDATION_RULES.houseNumber.maxLength
    ) {
      return err(
        `houseNumber must be at most ${VALIDATION_RULES.houseNumber.maxLength} characters`,
      );
    }

    const now = new Date();

    return ok(
      new TripParticipant(
        props.id ?? crypto.randomUUID(),
        props.userId.trim(),
        props.tripId.trim(),
        props.groupId ?? null,
        props.wristNumber ?? null,
        props.houseNumber ?? null,
        role,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Assign participant to a group
   * Returns a new TripParticipant instance (immutable)
   */
  assignToGroup(groupId: string): Result<TripParticipant, string> {
    if (!groupId || groupId.trim() === "") {
      return err("groupId cannot be empty");
    }

    return ok(
      new TripParticipant(
        this.id,
        this.userId,
        this.tripId,
        groupId.trim(),
        this.wristNumber,
        this.houseNumber,
        this.role,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Remove participant from group
   * Returns a new TripParticipant instance (immutable)
   */
  removeFromGroup(): TripParticipant {
    return new TripParticipant(
      this.id,
      this.userId,
      this.tripId,
      null,
      this.wristNumber,
      this.houseNumber,
      this.role,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Update role
   * Returns a new TripParticipant instance (immutable)
   */
  updateRole(newRole: TripParticipantRole): TripParticipant {
    return new TripParticipant(
      this.id,
      this.userId,
      this.tripId,
      this.groupId,
      this.wristNumber,
      this.houseNumber,
      newRole,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Assign wrist number
   * Returns a new TripParticipant instance (immutable)
   */
  assignWristNumber(
    wristNumber: string | null,
  ): Result<TripParticipant, string> {
    if (
      wristNumber !== null &&
      wristNumber.length > VALIDATION_RULES.wristNumber.maxLength
    ) {
      return err(
        `wristNumber must be at most ${VALIDATION_RULES.wristNumber.maxLength} characters`,
      );
    }

    return ok(
      new TripParticipant(
        this.id,
        this.userId,
        this.tripId,
        this.groupId,
        wristNumber,
        this.houseNumber,
        this.role,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Assign house number
   * Returns a new TripParticipant instance (immutable)
   */
  assignHouseNumber(
    houseNumber: string | null,
  ): Result<TripParticipant, string> {
    if (
      houseNumber !== null &&
      houseNumber.length > VALIDATION_RULES.houseNumber.maxLength
    ) {
      return err(
        `houseNumber must be at most ${VALIDATION_RULES.houseNumber.maxLength} characters`,
      );
    }

    return ok(
      new TripParticipant(
        this.id,
        this.userId,
        this.tripId,
        this.groupId,
        this.wristNumber,
        houseNumber,
        this.role,
        this.createdAt,
        new Date(), // updatedAt
      ),
    );
  }

  /**
   * Check if participant is assigned to a group
   */
  isAssignedToGroup(): boolean {
    return this.groupId !== null;
  }

  /**
   * Check if participant has a wrist number
   */
  hasWristNumber(): boolean {
    return this.wristNumber !== null && this.wristNumber.length > 0;
  }

  /**
   * Check if participant has a house number
   */
  hasHouseNumber(): boolean {
    return this.houseNumber !== null && this.houseNumber.length > 0;
  }

  /**
   * Check if participant is a leader
   */
  isLeader(): boolean {
    return this.role === TripParticipantRole.LEADER;
  }

  /**
   * Check if participant is a regular member
   */
  isMember(): boolean {
    return this.role === TripParticipantRole.MEMBER;
  }

  /**
   * Promote to leader role
   */
  promoteToLeader(): TripParticipant {
    return this.updateRole(TripParticipantRole.LEADER);
  }

  /**
   * Demote to member role
   */
  demoteToMember(): TripParticipant {
    return this.updateRole(TripParticipantRole.MEMBER);
  }
}
