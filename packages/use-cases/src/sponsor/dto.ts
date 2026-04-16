/**
 * Sponsor DTOs
 *
 * Data Transfer Objects for Sponsor domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";

/**
 * SponsorDTO - Lightweight representation of a sponsor
 */
export interface SponsorDTO {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TripSponsorDTO - Representation of a sponsor linked to a trip
 */
export interface TripSponsorDTO {
  id: string;
  tripId: string;
  sponsorId: string;
  tier: string;
  benefits: string | null;
  displayOrder: number;
  isActive: boolean;
  linkedAt: Date;
  linkedById: string;
  sponsor?: SponsorDTO;
}

/**
 * Paginated result for sponsor queries
 */
export type SponsorPaginatedResult = PaginatedResult<SponsorDTO>;
