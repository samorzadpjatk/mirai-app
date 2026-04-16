/**
 * Location DTOs
 *
 * Data Transfer Objects for Location domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";

/**
 * User sharing info
 */
export interface SharingUserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * LocationDTO - Lightweight representation of a user location
 */
export interface LocationDTO {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  recordedAt: Date;
  createdAt: Date;
  isSharingLocation: boolean;
  usersToShareWith: SharingUserInfo[];
}

/**
 * LocationSharingDTO - Representation of location sharing settings
 */
export interface LocationSharingDTO {
  id: string;
  userId: string;
  sharedWithUserId: string;
  canViewLocation: boolean;
  createdAt: Date;
}

/**
 * Paginated result for location queries
 */
export type LocationPaginatedResult = PaginatedResult<LocationDTO>;
