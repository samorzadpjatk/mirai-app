import type { SponsorRepository } from "@mirai-app/use-cases";
import type { Sponsor } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  sponsors,
  tripSponsors,
} from "@mirai-app/frameworks/drizzle/schema/sponsor";
import { eq, and, asc, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../base/repository";
import { SponsorDrizzleMapper } from "../../mappers/drizzle/sponsor";

/**
 * DrizzleSponsorRepository
 *
 * Implements the SponsorRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleSponsorRepository
  extends BaseDrizzleRepository<
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
  async findActive(): Promise<Sponsor[]> {
    const records = await this.db
      .select()
      .from(sponsors)
      .where(eq(sponsors.isActive, true))
      .orderBy(asc(sponsors.createdAt));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find sponsors by trip ID
   */
  async findByTripId(tripId: string): Promise<Sponsor[]> {
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
  }

  /**
   * Check if a sponsor is associated with a trip
   */
  async isLinkedToTrip(sponsorId: string, tripId: string): Promise<boolean> {
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
  }

  /**
   * Link a sponsor to a trip
   */
  async linkToTrip(sponsorId: string, tripId: string): Promise<void> {
    await this.db
      .insert(tripSponsors)
      .values({
        tripId,
        sponsorId,
      })
      .onConflictDoNothing();
  }

  /**
   * Unlink a sponsor from a trip
   */
  async unlinkFromTrip(sponsorId: string, tripId: string): Promise<void> {
    await this.db
      .delete(tripSponsors)
      .where(
        and(
          eq(tripSponsors.sponsorId, sponsorId),
          eq(tripSponsors.tripId, tripId),
        ),
      );
  }
}
