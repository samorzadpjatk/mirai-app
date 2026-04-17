import type { TripParticipantId } from "../value-objects/TripParticipantId";
import type { TripId } from "../value-objects/TripId";
import type { UserId } from "../../user/value-objects/UserId";
import type { GroupId } from "../../group/value-objects/GroupId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Trip Participant Role Enum
 */
export type ParticipantRole = "MEMBER" | "LEADER";

/**
 * Trip Participant Domain Entity
 *
 * Represents a user's participation in a specific trip.
 */
export class TripParticipant {
  private constructor(
    readonly id: TripParticipantId,
    readonly userId: UserId,
    readonly tripId: TripId,
    readonly groupId: GroupId | null,
    readonly wristNumber: string | null,
    readonly houseNumber: string | null,
    readonly role: ParticipantRole,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a TripParticipant entity
   */
  static create(props: {
    id: TripParticipantId;
    userId: UserId;
    tripId: TripId;
    groupId?: GroupId | null;
    wristNumber?: string | null;
    houseNumber?: string | null;
    role?: ParticipantRole;
    createdAt: Date;
    updatedAt: Date;
  }): Effect.Effect<TripParticipant, ValidationError, never> {
    const wristNumber = props.wristNumber?.trim() ?? null;
    const houseNumber = props.houseNumber?.trim() ?? null;

    if (wristNumber && wristNumber.length > 50) {
      return Effect.fail(
        new ValidationError({
          field: "wristNumber",
          message: "Wrist number must be at most 50 characters",
          value: props.wristNumber,
        }),
      );
    }

    if (houseNumber && houseNumber.length > 50) {
      return Effect.fail(
        new ValidationError({
          field: "houseNumber",
          message: "House number must be at most 50 characters",
          value: props.houseNumber,
        }),
      );
    }

    return Effect.succeed(
      new TripParticipant(
        props.id,
        props.userId,
        props.tripId,
        props.groupId ?? null,
        wristNumber,
        houseNumber,
        props.role ?? "MEMBER",
        props.createdAt,
        props.updatedAt,
      ),
    );
  }

  /**
   * Check if participant is a leader
   */
  isLeader(): boolean {
    return this.role === "LEADER";
  }

  /**
   * Assign to a group
   */
  assignToGroup(groupId: GroupId): TripParticipant {
    return new TripParticipant(
      this.id,
      this.userId,
      this.tripId,
      groupId,
      this.wristNumber,
      this.houseNumber,
      this.role,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Remove from group
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
      new Date(),
    );
  }

  /**
   * Promote to leader
   */
  promoteToLeader(): TripParticipant {
    return new TripParticipant(
      this.id,
      this.userId,
      this.tripId,
      this.groupId,
      this.wristNumber,
      this.houseNumber,
      "LEADER",
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Demote to member
   */
  demoteToMember(): TripParticipant {
    return new TripParticipant(
      this.id,
      this.userId,
      this.tripId,
      this.groupId,
      this.wristNumber,
      this.houseNumber,
      "MEMBER",
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update wrist number
   */
  withWristNumber(
    wristNumber: string | null,
  ): Effect.Effect<TripParticipant, ValidationError, never> {
    return TripParticipant.create({
      id: this.id,
      userId: this.userId,
      tripId: this.tripId,
      groupId: this.groupId,
      wristNumber,
      houseNumber: this.houseNumber,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Update house number
   */
  withHouseNumber(
    houseNumber: string | null,
  ): Effect.Effect<TripParticipant, ValidationError, never> {
    return TripParticipant.create({
      id: this.id,
      userId: this.userId,
      tripId: this.tripId,
      groupId: this.groupId,
      wristNumber: this.wristNumber,
      houseNumber,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
