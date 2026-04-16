import type { GroupId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { GroupDTO, GroupPaginatedResult } from "../dto";
import type { DatabaseError } from "./errors";

/**
 * GroupGateway Port
 *
 * This interface defines what operations the application needs
 * from any group gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleGroupGateway: Uses Drizzle ORM
 * - InMemoryGroupGateway: For testing
 */
export interface GroupGateway {
  /**
   * Create a new group
   */
  create(group: GroupDTO): Effect.Effect<GroupDTO, DatabaseError, never>;

  /**
   * Find group by ID
   * @returns GroupDTO or null if not found
   */
  findById(id: GroupId): Effect.Effect<GroupDTO | null, DatabaseError, never>;

  /**
   * Find groups by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<GroupDTO[], DatabaseError, never>;

  /**
   * Find groups by status
   */
  findByStatus(status: string): Effect.Effect<GroupDTO[], DatabaseError, never>;

  /**
   * Find all groups with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<GroupPaginatedResult, DatabaseError, never>;

  /**
   * Update group
   */
  update(group: GroupDTO): Effect.Effect<GroupDTO, DatabaseError, never>;

  /**
   * Delete group (soft delete)
   */
  delete(id: GroupId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if group exists
   */
  exists(id: GroupId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Check if group code already exists
   */
  existsByCode(
    code: string,
    excludeGroupId?: GroupId,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Find group by code
   */
  findByCode(
    code: string,
  ): Effect.Effect<GroupDTO | null, DatabaseError, never>;

  /**
   * Get coin balance for a group
   */
  getCoins(id: GroupId): Effect.Effect<number, DatabaseError, never>;

  /**
   * Update coin balance
   */
  updateCoins(
    id: GroupId,
    amount: number,
  ): Effect.Effect<GroupDTO, DatabaseError, never>;
}

/**
 * GroupGateway Context.Tag for Effect dependency injection
 */
export class GroupGatewayTag extends Context.Tag("GroupGateway")<
  GroupGatewayTag,
  GroupGateway
>() {}
