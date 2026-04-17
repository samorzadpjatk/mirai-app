import type { UserId } from "@mirai-app/domain";
import type { GroupId } from "@mirai-app/domain";
import type { TripId } from "@mirai-app/domain";

/**
 * DTO for trip participant
 */
export interface TripParticipantDTO {
  id: string;
  userId: UserId;
  tripId: TripId;
  groupId: GroupId | null;
  wristNumber: string | null;
  houseNumber: string | null;
  joinedAt: Date;
  user: {
    id: UserId;
    firstName: string;
    lastName: string;
    email: string | null;
    role: string;
  };
  group: {
    id: GroupId;
    name: string;
    image: string | null;
    coins: number;
    participantCount: number;
    isDeleted: boolean;
  } | null;
}

/**
 * DTO for creating a trip participant
 */
export interface CreateTripParticipantDTO {
  userId: UserId;
  tripId: TripId;
  groupId?: GroupId;
  wristNumber?: string;
  houseNumber?: string;
}

/**
 * DTO for participant with contact info
 */
export interface ParticipantWithContactDTO {
  id: string;
  userId: UserId;
  tripId: TripId;
  groupId: GroupId | null;
  wristNumber: string | null;
  houseNumber: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  groupName: string | null;
}

/**
 * DTO for updating participant numbers
 */
export interface UpdateParticipantNumbersDTO {
  userId: UserId;
  tripId: TripId;
  wristNumber: string | null;
  houseNumber: string | null;
}

/**
 * DTO for bulk participant import result
 */
export interface BulkImportResultDTO {
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    reason: string;
  }>;
}
