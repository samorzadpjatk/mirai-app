import type { GroupId, Connection, DatabaseError } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type {
  CursorPaginatedResult,
  CursorPaginationOptions,
} from "../../system/shared/dto";
import type { GroupDTO, GroupPaginatedResult } from "../dto";
import type { TripParticipantDTO } from "../../trip/dto";

/**
 * Cursor data for group pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface GroupCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for group connection pagination
 */
export interface GroupConnectionArgs {
  first?: number;
  after?: GroupCursorData | null;
}

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
   * Find groups by trip ID with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByTripIdConnection(
    tripId: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  >;

  /**
   * Find groups by status with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByStatusConnection(
    status: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  >;

  /**
   * Find groups by trip ID and status with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByTripIdAndStatusConnection(
    tripId: string,
    status: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  >;

  /**
   * Find groups by organizer ID with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByOrganizerIdConnection(
    organizerId: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  >;

  /**
   * Find groups by status with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByStatusConnection(
    status: string,
    options: CursorPaginationOptions,
  ): Effect.Effect<CursorPaginatedResult<GroupDTO>, DatabaseError, never>;

  /**
   * Find groups by trip ID and status with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByTripIdAndStatusConnection(
    tripId: string,
    status: string,
    options: CursorPaginationOptions,
  ): Effect.Effect<CursorPaginatedResult<GroupDTO>, DatabaseError, never>;

  /**
   * Find groups by organizer ID with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByOrganizerIdConnection(
    organizerId: string,
    options: CursorPaginationOptions,
  ): Effect.Effect<CursorPaginatedResult<GroupDTO>, DatabaseError, never>;

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

  /**
   * Find trip participants with cursor-based pagination
   */
  findTripParticipantsConnection(
    tripId: string,
    args: GroupConnectionArgs,
  ): Effect.Effect<Connection<TripParticipantDTO>, DatabaseError, never>;
}

/**
 * GroupGateway Context.Tag for Effect dependency injection
 */
export class GroupGatewayTag extends Context.Tag("GroupGateway")<
  GroupGatewayTag,
  GroupGateway
>() {}
