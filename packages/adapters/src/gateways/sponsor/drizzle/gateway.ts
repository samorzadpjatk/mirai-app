import type { SponsorRepository } from "@mirai-app/domain/ports";
import type { Sponsor } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { sponsors, tripSponsors } from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleGateway } from "../_shared/drizzle-base";

/**
 * DrizzleSponsorGateway
 *
 * Implements the SponsorRepository port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 */
export class DrizzleSponsorGateway
  extends BaseDrizzleGateway<
    Sponsor,
    typeof sponsors.$inferSelect,
    Partial<typeof sponsors.$inferInsert>,
    typeof sponsors
  >
  implements SponsorRepository
{
  constructor(db: DrizzleDb) {
    super(db, { table: sponsors, mapper: SponsorDrizzleMapper.instance });
  }

  /**
   * Find all active sponsors
   */
  findActive(): Effect.Effect<Sponsor[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(sponsors)
          .where(eq(sponsors.isActive, true))
          .orderBy(asc(sponsors.createdAt));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active sponsors",
          cause: error,
        }),
    });
  }

  /**
   * Find sponsors by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<Sponsor[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const tripSponsorRecords = await this.db
          .select({
            sponsorId: tripSponsors.sponsorId,
          })
          .from(tripSponsors)
          .where(eq(tripSponsors.tripId, tripId));

        if (tripSponsorRecords.length === 0) {
          return [];
        }

        const sponsorIds = tripSponsorRecords.map((ts) => ts.sponsorId);

        const records = await this.db
          .select()
          .from(sponsors)
          .where(
            and(
              eq(sponsors.isActive, true),
              sql`${sponsors.id} IN (${sql.join(sponsorIds, sql`, `)})`,
            ),
          )
          .orderBy(asc(sponsors.createdAt));

        return records.map((record) => this.mapper.toDomain(record));
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
   * Check if a sponsor is associated with a trip
   */
  isLinkedToTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(tripSponsors)
          .where(
            and(
              eq(tripSponsors.sponsorId, sponsorId),
              eq(tripSponsors.tripId, tripId),
            ),
          )
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "isLinkedToTrip",
          message: "Failed to check if sponsor is linked to trip",
          cause: error,
        }),
    });
  }

  /**
   * Link a sponsor to a trip
   */
  linkToTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .insert(tripSponsors)
          .values({
            tripId,
            sponsorId,
          })
          .onConflictDoNothing();
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
   * Unlink a sponsor from a trip
   */
  unlinkFromTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(tripSponsors)
          .where(
            and(
              eq(tripSponsors.sponsorId, sponsorId),
              eq(tripSponsors.tripId, tripId),
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
}
