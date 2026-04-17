import type { SponsorId, TripId } from "@mirai-app/domain";

/**
 * DTO for sponsor
 */
export interface SponsorDTO {
  id: SponsorId;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for sponsor with logo URL
 */
export interface SponsorWithLogoDTO extends SponsorDTO {
  logoUrl: string | null;
}

/**
 * DTO for trip sponsor relationship
 */
export interface TripSponsorDTO {
  id: string;
  tripId: TripId;
  sponsorId: SponsorId;
  sponsor: SponsorDTO;
  createdAt: Date;
}

/**
 * DTO for paginated sponsors
 */
export interface PaginatedSponsorsDTO {
  sponsors: SponsorDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for sponsor creation result
 */
export interface CreateSponsorResultDTO {
  id: SponsorId;
  name: string;
  description: string;
  isActive: boolean;
}

/**
 * DTO for sponsor update result
 */
export interface UpdateSponsorResultDTO {
  id: SponsorId;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
  updatedAt: Date;
}
