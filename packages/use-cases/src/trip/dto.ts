/**
 * Trip DTOs
 *
 * Data Transfer Objects for Trip domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type { TripStatus } from "@mirai-app/domain";

/**
 * TripDTO - Lightweight representation of a trip
 */
export interface TripDTO {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  destination: string;
  startDate: Date;
  endDate: Date;
  status: TripStatus;
  basePrice: number | null;
  totalSpots: number | null;
  availableSpots: number | null;
  registrationDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TripParticipantDTO - Representation of a trip participant
 */
export interface TripParticipantDTO {
  id: string;
  tripId: string;
  userId: string;
  groupId: string | null;
  role: string;
  status: string;
  joinedAt: Date;
  leftAt: Date | null;
  invitedById: string | null;
}

/**
 * Paginated result for trip queries
 */
export type TripPaginatedResult = PaginatedResult<TripDTO>;
