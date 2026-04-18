import type { TripParticipantSelect } from "../../infrastructure/drizzle";
import {
  TripParticipant,
  TripParticipantId,
  TripId,
  UserId,
  GroupId,
} from "@mirai-app/domain";
import type { ValidationError } from "@mirai-app/domain";
import type { Effect } from "effect";

/**
 * TripParticipant Mapper
 *
 * Maps between database TripParticipant records and domain TripParticipant entities.
 */
export class TripParticipantMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbParticipant: TripParticipantSelect,
  ): Effect.Effect<TripParticipant, ValidationError, never> {
    return TripParticipant.create({
      id: TripParticipantId.unsafeCreate(dbParticipant.id),
      userId: UserId.unsafeCreate(dbParticipant.userId),
      tripId: TripId.unsafeCreate(dbParticipant.tripId),
      groupId: dbParticipant.groupId
        ? GroupId.unsafeCreate(dbParticipant.groupId)
        : null,
      wristNumber: dbParticipant.wristNumber ?? null,
      houseNumber: dbParticipant.houseNumber ?? null,
      role: (dbParticipant.role as "MEMBER" | "LEADER") ?? "MEMBER",
      createdAt: dbParticipant.createdAt,
      updatedAt: dbParticipant.updatedAt,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(participant: TripParticipant): {
    id: string;
    userId: string;
    tripId: string;
    groupId: string | null;
    wristNumber: string | null;
    houseNumber: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: TripParticipantId.toString(participant.id),
      userId: UserId.toString(participant.userId),
      tripId: TripId.toString(participant.tripId),
      groupId: participant.groupId
        ? GroupId.toString(participant.groupId)
        : null,
      wristNumber: participant.wristNumber,
      houseNumber: participant.houseNumber,
      role: participant.role,
      createdAt: participant.createdAt,
      updatedAt: participant.updatedAt,
    };
  }

  /**
   * Convert domain entity to database update format
   */
  toUpdate(participant: TripParticipant): {
    groupId: string | null;
    wristNumber: string | null;
    houseNumber: string | null;
    role: string;
    updatedAt: Date;
  } {
    return {
      groupId: participant.groupId
        ? GroupId.toString(participant.groupId)
        : null,
      wristNumber: participant.wristNumber,
      houseNumber: participant.houseNumber,
      role: participant.role,
      updatedAt: new Date(),
    };
  }
}

export const tripParticipantMapper = new TripParticipantMapper();
