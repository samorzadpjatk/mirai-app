/**
 * Group DTOs
 *
 * Data Transfer Objects for Group domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type { GroupStatus } from "@mirai-app/domain";

/**
 * GroupDTO - Lightweight representation of a group
 */
export interface GroupDTO {
  id: string;
  tripId: string;
  name: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  status: GroupStatus;
  coins: number;
  maxMembers: number | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedById: string | null;
}

/**
 * GroupMemberDTO - Representation of a group member
 */
export interface GroupMemberDTO {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
}

/**
 * Paginated result for group queries
 */
export type GroupPaginatedResult = PaginatedResult<GroupDTO>;
