import type { Trip, TripId } from "@mirai-app/domain";
import type { GroupDTO, GroupWithStatsDTO } from "../../group/dto/GroupDTOs";
import type { TripParticipantDTO } from "./TripParticipantDTOs";
import type { SponsorDTO, TripSponsorDTO } from "../../sponsor/dto/SponsorDTOs";

/**
 * DTO for basic trip info
 */
export interface TripDTO {
  id: TripId;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for trip with groups and sponsors
 */
export interface TripWithDetailsDTO {
  id: TripId;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  image: string | null;
  isActive: boolean;
  groups: GroupDTO[];
  tripSponsors: TripSponsorDTO[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for trip with full details including participants
 */
export interface TripWithParticipantsDTO {
  id: TripId;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  image: string | null;
  isActive: boolean;
  groups: GroupWithStatsDTO[];
  tripSponsors: TripSponsorDTO[];
  participants: TripParticipantDTO[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for trip creation result
 */
export interface CreateTripResultDTO {
  id: TripId;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for trip update result
 */
export interface UpdateTripResultDTO {
  id: TripId;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for trip membership check
 */
export interface TripMembershipDTO {
  isParticipant: boolean;
  tripId: TripId | null;
  groupId: string | null;
}

/**
 * DTO for trip with computed stats
 */
export interface TripWithStatsDTO {
  id: TripId;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  image: string | null;
  isActive: boolean;
  participantCount: number;
  groupCount: number;
  challengeCount: number;
}

/**
 * DTO for paginated trips
 */
export interface PaginatedTripsDTO {
  trips: TripDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    hasNextPage: boolean;
    currentPage: number;
    totalPages: number;
    hasPreviousPage: boolean;
  };
}
