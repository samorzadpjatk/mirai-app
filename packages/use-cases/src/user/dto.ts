/**
 * User DTOs
 *
 * Data Transfer Objects for User domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type { UserRole, UserStatus } from "@mirai-app/domain";

/**
 * UserDTO - Lightweight representation of a user
 */
export interface UserDTO {
  id: string;
  authUserId: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  groupId: string | null;
  bio: string | null;
  birthDate: Date | null;
  shirtSize: string | null;
  dietaryRequirements: string | null;
  medicalInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated result for user queries
 */
export type UserPaginatedResult = PaginatedResult<UserDTO>;
