import type {
  LocationId,
  Connection,
  LocationSharingRequestConnectionArgs,
} from "@mirai-app/domain";
import type {
  LocationGateway,
  LocationDTO,
  LocationPaginatedResult,
  LocationConnectionArgs,
  LocationSharingDTO,
} from "@mirai-app/use-cases";
import { Effect } from "effect";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Location Gateway for Testing
 *
 * Implements LocationGateway port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * All methods return Effect.Effect<T, DatabaseError, never> for composable error handling.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryLocationGateway();
 *
 * // Seed with test data
 * const locationDto: LocationDTO = {
 *   id: "loc-123",
 *   userId: "user-123",
 *   latitude: 52.2297,
 *   longitude: 21.0122,
 *   accuracy: null,
 *   altitude: null,
 *   speed: null,
 *   heading: null,
 *   recordedAt: new Date(),
 *   createdAt: new Date(),
 * };
 *
 * await Effect.runPromise(gateway.create(locationDto));
 *
 * const found = await Effect.runPromise(gateway.findById("loc-123"));
 * expect(found).not.toBeNull();
 *
 * // Find by user ID
 * const userLocation = await Effect.runPromise(gateway.findByUserId("user-123"));
 * expect(userLocation?.latitude).toBe(52.2297);
 *
 * // Find locations sharing with a user
 * const sharing = await Effect.runPromise(gateway.findSharingWithUser("viewer-456"));
 * expect(sharing).toHaveLength(0);
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryLocationGateway
  extends InMemoryGateway<LocationDTO>
  implements LocationGateway
{
  private sharingRequestsStorage: Map<string, LocationSharingDTO> = new Map();

  /**
   * Reconstruct a LocationDTO from plain object storage.
   * For DTOs, this is a simple cast since they are plain objects.
   */
  protected override reconstruct(
    plain: unknown,
  ): Effect.Effect<LocationDTO, DatabaseError, never> {
    return Effect.succeed(plain as LocationDTO);
  }

  /**
   * Reset both location and sharing request storage
   */
  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
      this.sharingRequestsStorage.clear();
    });
  }

  create(location: LocationDTO): Effect.Effect<LocationDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(location.id, location);
      return location;
    });
  }

  findById(id: LocationId): Effect.Effect<LocationDTO | null, never, never> {
    return Effect.sync(() => {
      return this.storage.get(id as string) ?? null;
    });
  }

  findByUserId(
    userId: string,
  ): Effect.Effect<LocationDTO | null, never, never> {
    return Effect.gen(this, function* () {
      const items = this.getAllItems();
      const found = items.find((loc) => loc.userId === userId);
      return found ?? null;
    });
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<LocationPaginatedResult, never, never> {
    return Effect.gen(this, function* () {
      const allItems = this.getAllItems();
      const total = allItems.length;

      let items = allItems;
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? total;

      if (offset > 0) {
        items = items.slice(offset);
      }
      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      const hasMore = offset + items.length < total;

      return {
        items,
        total,
        limit,
        offset,
        hasMore,
      };
    });
  }

  save(location: LocationDTO): Effect.Effect<LocationDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(location.id, location);
      return location;
    });
  }

  delete(id: LocationId): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id as string);
    });
  }

  deleteByUserId(userId: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const items = this.getAllItems();
      const found = items.find((loc) => loc.userId === userId);
      if (found) {
        this.storage.delete(found.id);
      }
    });
  }

  existsForUser(userId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some((loc) => loc.userId === userId),
    );
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find locations for users that are sharing with a specific user
   * Uses cursor-based pagination with (recordedAt, id) sort
   */
  findSharingWithUserConnection(
    userId: string,
    args: LocationConnectionArgs,
  ): Effect.Effect<Connection<LocationDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all items that are "sharing" (simplified for testing)
      // In a real implementation, this would check isSharingLocation and permissions
      let items = this.getAllItems();

      // Sort by recordedAt, then id
      items.sort((a, b) => {
        const timeCompare = a.recordedAt.getTime() - b.recordedAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = items.findIndex(
          (loc) =>
            loc.recordedAt > cursorDate ||
            (loc.recordedAt.getTime() === cursorDate.getTime() &&
              loc.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.recordedAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }

  /**
   * Find locations by user IDs with cursor-based pagination
   * Uses (recordedAt, id) composite sort key for stable pagination
   */
  findByUserIdsConnection(
    userIds: string[],
    args: LocationConnectionArgs,
  ): Effect.Effect<Connection<LocationDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Handle empty userIds
      if (userIds.length === 0) {
        return {
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: !!cursor,
            startCursor: null,
            endCursor: null,
          },
        };
      }

      // Get items for specified user IDs
      const userIdSet = new Set(userIds);
      let items = this.getAllItems().filter((loc) => userIdSet.has(loc.userId));

      // Sort by recordedAt, then id
      items.sort((a, b) => {
        const timeCompare = a.recordedAt.getTime() - b.recordedAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = items.findIndex(
          (loc) =>
            loc.recordedAt > cursorDate ||
            (loc.recordedAt.getTime() === cursorDate.getTime() &&
              loc.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.recordedAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }

  /**
   * Find location sharing requests sent by a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all sharing requests sent by this user
      let items = Array.from(this.sharingRequestsStorage.values()).filter(
        (req) => req.userId === userId,
      );

      // Sort by createdAt, then id
      items.sort((a, b) => {
        const timeCompare = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = items.findIndex(
          (req) =>
            req.createdAt > cursorDate ||
            (req.createdAt.getTime() === cursorDate.getTime() &&
              req.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }

  /**
   * Find location sharing requests received by a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findReceivedSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all sharing requests received by this user
      let items = Array.from(this.sharingRequestsStorage.values()).filter(
        (req) => req.sharedWithUserId === userId,
      );

      // Sort by createdAt, then id
      items.sort((a, b) => {
        const timeCompare = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = items.findIndex(
          (req) =>
            req.createdAt > cursorDate ||
            (req.createdAt.getTime() === cursorDate.getTime() &&
              req.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }
}
