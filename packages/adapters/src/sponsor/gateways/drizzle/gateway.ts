import type {
  SponsorGateway,
  SponsorDTO,
  TripSponsorDTO,
  SponsorPaginatedResult,
  SponsorConnectionArgs,
} from "@mirai-app/use-cases";
import type { SponsorId, Connection } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  sponsors,
  tripSponsors,
  type SponsorSelect,
  type SponsorInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { DatabaseError } from "../../../system/shared/gateways/in-memory-base";
import { SponsorDrizzleMapper } from "../../../sponsor/mappers/drizzle/mapper";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

/**
 * DrizzleSponsorGateway
 *
 * Implements the SponsorGateway port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 * Returns SponsorDTOs instead of domain entities.
 */
export class DrizzleSponsorGateway
  extends BaseDrizzleGateway<
    SponsorDTO,
    SponsorSelect,
    SponsorInsert,
    typeof sponsors
  >
  implements SponsorGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: sponsors,
      mapper: SponsorDrizzleMapper.instance,
    });
  }

  /**
   * Find sponsor by ID
   */
  findById(
    id: SponsorId,
  ): Effect.Effect<SponsorDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(sponsors)
          .where(eq(sponsors.id, id))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: `Failed to find sponsor by id ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Find all sponsors with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SponsorPaginatedResult, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Get total count
        const countResult = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(sponsors);
        const total = countResult[0]?.count ?? 0;

        // Get items with pagination
        let query = this.db
          .select()
          .from(sponsors)
          .orderBy(asc(sponsors.createdAt));

        if (options?.limit !== undefined) {
          query = query.limit(options.limit);
        }
        if (options?.offset !== undefined) {
          query = query.offset(options.offset);
        }

        const records = await query;
        const items = records.map((record) => this.mapper.toDTO(record));

        return {
          items,
          total,
          limit: options?.limit ?? items.length,
          offset: options?.offset ?? 0,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find sponsors",
          cause: error,
        }),
    });
  }

  /**
   * Create a new sponsor
   */
  create(sponsor: SponsorDTO): Effect.Effect<SponsorDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData = this.mapper.toDrizzleInsert(sponsor);
        const [record] = await this.db
          .insert(sponsors)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error("Failed to create sponsor: no record returned");
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create sponsor",
          cause: error,
        }),
    });
  }

  /**
   * Update sponsor
   */
  update(sponsor: SponsorDTO): Effect.Effect<SponsorDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const updateData = this.mapper.toDrizzleUpdate(sponsor);
        const [record] = await this.db
          .update(sponsors)
          .set(updateData)
          .where(eq(sponsors.id, sponsor.id))
          .returning();

        if (!record) {
          throw new Error(`Failed to update sponsor with id ${sponsor.id}`);
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "update",
          message: `Failed to update sponsor with id ${sponsor.id}`,
          cause: error,
        }),
    });
  }

  /**
   * Delete sponsor
   */
  delete(id: SponsorId): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.delete(sponsors).where(eq(sponsors.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: `Failed to delete sponsor with id ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Check if sponsor exists
   */
  exists(id: SponsorId): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({ id: sponsors.id })
          .from(sponsors)
          .where(eq(sponsors.id, id))
          .limit(1);

        return records.length > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "exists",
          message: "Failed to check sponsor existence",
          cause: error,
        }),
    });
  }

  /**
   * Find sponsors by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<TripSponsorDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const tripSponsorRecords = await this.db
          .select()
          .from(tripSponsors)
          .where(eq(tripSponsors.tripId, tripId));

        if (tripSponsorRecords.length === 0) {
          return [];
        }

        const sponsorIds = tripSponsorRecords.map((ts) => ts.sponsorId);

        const sponsorRecords = await this.db
          .select()
          .from(sponsors)
          .where(
            and(
              eq(sponsors.isActive, true),
              sql`${sponsors.id} IN (${sql.join(sponsorIds, sql`, `)})`,
            ),
          )
          .orderBy(asc(sponsors.createdAt));

        // Create a map of sponsor records by ID for quick lookup
        const sponsorMap = new Map(sponsorRecords.map((s) => [s.id, s]));

        // Build TripSponsorDTOs with sponsor data
        return tripSponsorRecords.map((ts) => {
          const sponsorRecord = sponsorMap.get(ts.sponsorId);
          return {
            id: ts.id,
            tripId: ts.tripId,
            sponsorId: ts.sponsorId,
            tier: "standard",
            benefits: null,
            displayOrder: 0,
            isActive: true,
            linkedAt: ts.createdAt,
            linkedById: "",
            sponsor: sponsorRecord
              ? this.mapper.toDTO(sponsorRecord)
              : undefined,
          };
        });
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find sponsors by trip ID",
          cause: error,
        }),
    });
  }

  /**
   * Link sponsor to a trip
   */
  linkToTrip(
    tripId: string,
    sponsorId: SponsorId,
    tier: string,
  ): Effect.Effect<TripSponsorDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .insert(tripSponsors)
          .values({
            tripId,
            sponsorId,
          })
          .onConflictDoNothing()
          .returning();

        if (!record) {
          // Record already exists, fetch it
          const existing = await this.db
            .select()
            .from(tripSponsors)
            .where(
              and(
                eq(tripSponsors.tripId, tripId),
                eq(tripSponsors.sponsorId, sponsorId),
              ),
            )
            .limit(1);

          if (existing[0]) {
            return {
              id: existing[0].id,
              tripId: existing[0].tripId,
              sponsorId: existing[0].sponsorId,
              tier,
              benefits: null,
              displayOrder: 0,
              isActive: true,
              linkedAt: existing[0].createdAt,
              linkedById: "",
            };
          }
          throw new Error("Failed to link sponsor to trip");
        }

        return {
          id: record.id,
          tripId: record.tripId,
          sponsorId: record.sponsorId,
          tier,
          benefits: null,
          displayOrder: 0,
          isActive: true,
          linkedAt: record.createdAt,
          linkedById: "",
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "linkToTrip",
          message: "Failed to link sponsor to trip",
          cause: error,
        }),
    });
  }

  /**
   * Unlink sponsor from a trip
   */
  unlinkFromTrip(
    tripId: string,
    sponsorId: SponsorId,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(tripSponsors)
          .where(
            and(
              eq(tripSponsors.tripId, tripId),
              eq(tripSponsors.sponsorId, sponsorId),
            ),
          );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "unlinkFromTrip",
          message: "Failed to unlink sponsor from trip",
          cause: error,
        }),
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find all active sponsors with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findActiveConnection(
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<SponsorDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions with active filter
        const conditions = [eq(sponsors.isActive, true)];

        // Add cursor condition: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${sponsors.createdAt}, ${sponsors.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(sponsors)
          .where(and(...conditions))
          .orderBy(asc(sponsors.createdAt), asc(sponsors.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActiveConnection",
          message: "Failed to find active sponsors with pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find sponsors by trip ID with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<TripSponsorDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(tripSponsors.tripId, tripId)];

        // Add cursor condition for trip sponsors
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${tripSponsors.createdAt}, ${tripSponsors.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Get trip sponsor links with pagination
        const tripSponsorRecords = await this.db
          .select()
          .from(tripSponsors)
          .where(and(...conditions))
          .orderBy(asc(tripSponsors.createdAt), asc(tripSponsors.id))
          .limit(first + 1);

        const hasMore = tripSponsorRecords.length > first;
        const paginatedTripSponsors = tripSponsorRecords.slice(0, first);

        if (paginatedTripSponsors.length === 0) {
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

        // Get sponsor IDs to fetch full sponsor data
        const sponsorIds = paginatedTripSponsors.map((ts) => ts.sponsorId);

        // Fetch sponsor records
        const sponsorRecords = await this.db
          .select()
          .from(sponsors)
          .where(
            and(
              eq(sponsors.isActive, true),
              sql`${sponsors.id} IN (${sql.join(sponsorIds, sql`, `)})`,
            ),
          );

        // Create a map of sponsor records by ID for quick lookup
        const sponsorMap = new Map(sponsorRecords.map((s) => [s.id, s]));

        // Build TripSponsorDTOs with sponsor data
        const items: TripSponsorDTO[] = paginatedTripSponsors.map((ts) => {
          const sponsorRecord = sponsorMap.get(ts.sponsorId);
          return {
            id: ts.id,
            tripId: ts.tripId,
            sponsorId: ts.sponsorId,
            tier: "standard",
            benefits: null,
            displayOrder: 0,
            isActive: true,
            linkedAt: ts.createdAt,
            linkedById: "",
            sponsor: sponsorRecord
              ? this.mapper.toDTO(sponsorRecord)
              : undefined,
          };
        });

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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdConnection",
          message: "Failed to find sponsors by trip ID with pagination",
          cause: error,
        }),
    });
  }
}
