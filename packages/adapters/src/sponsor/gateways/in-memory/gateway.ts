import type {
  SponsorGateway,
  SponsorDTO,
  TripSponsorDTO,
  SponsorPaginatedResult,
  SponsorConnectionArgs,
} from "@mirai-app/use-cases";
import type { SponsorId, Connection } from "@mirai-app/domain";
import { Effect } from "effect";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

/**
 * In-Memory Sponsor Gateway for Testing
 *
 * Implements SponsorGateway port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * All methods return SponsorDTOs instead of domain entities.
 */
export class InMemorySponsorGateway
  extends InMemoryGateway<SponsorDTO>
  implements SponsorGateway
{
  private tripLinks = new Map<string, Set<string>>(); // sponsorId -> Set of tripIds
  private tripSponsorData = new Map<string, TripSponsorDTO>(); // composite key -> TripSponsorDTO

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
      this.tripLinks.clear();
      this.tripSponsorData.clear();
    });
  }

  create(sponsor: SponsorDTO): Effect.Effect<SponsorDTO, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.set(sponsor.id, sponsor);
      return sponsor;
    });
  }

  findById(
    id: SponsorId,
  ): Effect.Effect<SponsorDTO | null, DatabaseError, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SponsorPaginatedResult, DatabaseError, never> {
    return Effect.sync(() => {
      const total = this.storage.size;
      let items = Array.from(this.storage.values());

      if (options?.offset !== undefined) {
        items = items.slice(options.offset);
      }
      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      return {
        items,
        total,
        limit: options?.limit ?? items.length,
        offset: options?.offset ?? 0,
      };
    });
  }

  update(sponsor: SponsorDTO): Effect.Effect<SponsorDTO, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.set(sponsor.id, sponsor);
      return sponsor;
    });
  }

  delete(id: SponsorId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      // Remove from trip links
      this.tripLinks.delete(id);
      // Remove any tripSponsorData entries for this sponsor
      for (const [key, value] of this.tripSponsorData.entries()) {
        if (value.sponsorId === id) {
          this.tripSponsorData.delete(key);
        }
      }
      // Remove sponsor itself
      this.storage.delete(id);
    });
  }

  exists(id: SponsorId): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<TripSponsorDTO[], DatabaseError, never> {
    return Effect.sync(() => {
      const result: TripSponsorDTO[] = [];

      for (const [key, tripSponsor] of this.tripSponsorData.entries()) {
        if (tripSponsor.tripId === tripId) {
          // Include sponsor data if available
          const sponsor = this.storage.get(tripSponsor.sponsorId);
          result.push({
            ...tripSponsor,
            sponsor: sponsor,
          });
        }
      }

      return result;
    });
  }

  linkToTrip(
    tripId: string,
    sponsorId: SponsorId,
    tier: string,
  ): Effect.Effect<TripSponsorDTO, DatabaseError, never> {
    return Effect.sync(() => {
      const compositeKey = `${tripId}:${sponsorId}`;
      const existing = this.tripSponsorData.get(compositeKey);

      if (existing) {
        return existing;
      }

      const tripSponsor: TripSponsorDTO = {
        id: crypto.randomUUID(),
        tripId,
        sponsorId,
        tier,
        benefits: null,
        displayOrder: 0,
        isActive: true,
        linkedAt: new Date(),
        linkedById: "",
      };

      // Add to trip links
      if (!this.tripLinks.has(sponsorId)) {
        this.tripLinks.set(sponsorId, new Set<string>());
      }
      this.tripLinks.get(sponsorId)!.add(tripId);

      // Store trip sponsor data
      this.tripSponsorData.set(compositeKey, tripSponsor);

      return tripSponsor;
    });
  }

  unlinkFromTrip(
    tripId: string,
    sponsorId: SponsorId,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const compositeKey = `${tripId}:${sponsorId}`;
      this.tripSponsorData.delete(compositeKey);

      const tripIds = this.tripLinks.get(sponsorId);
      if (tripIds) {
        tripIds.delete(tripId);
        if (tripIds.size === 0) {
          this.tripLinks.delete(sponsorId);
        }
      }
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find all active sponsors with cursor-based pagination
   * Sorts by createdAt, then id, then slices
   * Note: In-memory storage doesn't track isActive separately; all stored sponsors are considered active
   */
  findActiveConnection(
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<SponsorDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all sponsors (all stored sponsors are considered active)
      let sponsors = Array.from(this.storage.values());

      // Sort by createdAt ascending, then by id as tiebreaker
      sponsors.sort((a, b) => {
        const timeCompare = a.createdAt.getTime() - b.createdAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = sponsors.findIndex(
          (s) =>
            s.createdAt > cursorDate ||
            (s.createdAt.getTime() === cursorDate.getTime() &&
              s.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = sponsors.length;
        }
      }

      // Slice to get the page
      const items = sponsors.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < sponsors.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
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
   * Find sponsors by trip ID with cursor-based pagination
   * Sorts by linkedAt (createdAt of tripSponsor), then id, then slices
   */
  findByTripIdConnection(
    tripId: string,
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<TripSponsorDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all trip sponsors for the trip
      let tripSponsors: TripSponsorDTO[] = [];
      for (const [key, tripSponsor] of this.tripSponsorData.entries()) {
        if (tripSponsor.tripId === tripId) {
          // Include sponsor data if available
          const sponsor = this.storage.get(tripSponsor.sponsorId);
          tripSponsors.push({
            ...tripSponsor,
            sponsor: sponsor,
          });
        }
      }

      // Sort by linkedAt (createdAt) ascending, then by id as tiebreaker
      tripSponsors.sort((a, b) => {
        const timeCompare = a.linkedAt.getTime() - b.linkedAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = tripSponsors.findIndex(
          (ts) =>
            ts.linkedAt > cursorDate ||
            (ts.linkedAt.getTime() === cursorDate.getTime() &&
              ts.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = tripSponsors.length;
        }
      }

      // Slice to get the page
      const items = tripSponsors.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < tripSponsors.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.linkedAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
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
