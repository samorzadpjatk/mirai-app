import { Effect } from "effect";
import { eq, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  tripSponsors,
  sponsors,
  type TripSponsorSelect,
  type SponsorSelect,
} from "../../../infrastructure/drizzle";
import {
  type Sponsor,
  SponsorId,
  TripId,
  TripSponsorId,
  DatabaseError,
} from "@mirai-app/domain";
import type {
  ITripSponsorPort,
  TripSponsor,
  TripSponsorWithSponsor,
  SponsorDTO,
} from "@mirai-app/use-cases/sponsor";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { sponsorMapper } from "../../mappers/SponsorMapper";

/**
 * Trip Sponsor Drizzle Gateway
 *
 * Implements ITripSponsorPort using Drizzle ORM for database operations.
 */
export class TripSponsorDrizzleGateway
  extends BaseDrizzleGateway
  implements ITripSponsorPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: TripSponsorId) {
    const idStr = TripSponsorId.toString(id);
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select({
            tripSponsor: tripSponsors,
            sponsor: sponsors,
          })
          .from(tripSponsors)
          .leftJoin(sponsors, eq(tripSponsors.sponsorId, sponsors.id))
          .where(eq(tripSponsors.id, idStr))
          .limit(1);
        return result[0] ?? null;
      },
      idStr,
    ).pipe(
      Effect.flatMap((row) => {
        if (!row?.tripSponsor || !row.sponsor) {
          return Effect.succeed(null);
        }
        return this.mapTripSponsorWithSponsor(row.tripSponsor, row.sponsor);
      }),
    );
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);
    return this.tryPromise(
      "findByTripId",
      async () => {
        const results = await this.db
          .select({
            tripSponsor: tripSponsors,
            sponsor: sponsors,
          })
          .from(tripSponsors)
          .leftJoin(sponsors, eq(tripSponsors.sponsorId, sponsors.id))
          .where(eq(tripSponsors.tripId, tripIdStr))
          .orderBy(sql`${tripSponsors.createdAt} DESC`);
        return results;
      },
      tripIdStr,
    ).pipe(
      Effect.flatMap((rows) => {
        // Filter out rows where sponsor is null (shouldn't happen with proper FK constraints)
        const validRows = rows.filter(
          (
            row,
          ): row is {
            tripSponsor: typeof row.tripSponsor;
            sponsor: NonNullable<typeof row.sponsor>;
          } => row.sponsor !== null,
        );
        return Effect.forEach(validRows, (row) =>
          this.mapTripSponsorWithSponsor(row.tripSponsor, row.sponsor),
        );
      }),
    );
  }

  findBySponsorId(sponsorId: SponsorId) {
    const sponsorIdStr = SponsorId.toString(sponsorId);
    return this.tryPromise(
      "findBySponsorId",
      async () => {
        const results = await this.db
          .select()
          .from(tripSponsors)
          .where(eq(tripSponsors.sponsorId, sponsorIdStr))
          .orderBy(sql`${tripSponsors.createdAt} DESC`);
        return results;
      },
      sponsorIdStr,
    ).pipe(
      Effect.flatMap((dbTripSponsors: TripSponsorSelect[]) =>
        Effect.forEach(dbTripSponsors, (dbTripSponsor) =>
          Effect.succeed(this.mapTripSponsor(dbTripSponsor)),
        ),
      ),
    );
  }

  findByTripIdAndSponsorId(tripId: TripId, sponsorId: SponsorId) {
    const tripIdStr = TripId.toString(tripId);
    const sponsorIdStr = SponsorId.toString(sponsorId);
    return this.tryPromise(
      "findByTripIdAndSponsorId",
      async () => {
        const result = await this.db
          .select()
          .from(tripSponsors)
          .where(
            and(
              eq(tripSponsors.tripId, tripIdStr),
              eq(tripSponsors.sponsorId, sponsorIdStr),
            ),
          )
          .limit(1);
        return result[0] ?? null;
      },
      `${tripIdStr}:${sponsorIdStr}`,
    ).pipe(
      Effect.flatMap((dbTripSponsor: TripSponsorSelect | null) =>
        dbTripSponsor
          ? Effect.succeed(this.mapTripSponsor(dbTripSponsor))
          : Effect.succeed(null),
      ),
    );
  }

  create(tripSponsor: TripSponsor) {
    const insertData = {
      id: TripSponsorId.toString(tripSponsor.id),
      tripId: TripId.toString(tripSponsor.tripId),
      sponsorId: SponsorId.toString(tripSponsor.sponsorId),
      createdAt: tripSponsor.createdAt,
    };
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(tripSponsors)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create trip sponsor");
        return result;
      },
      TripSponsorId.toString(tripSponsor.id),
    ).pipe(
      Effect.map((dbTripSponsor: TripSponsorSelect) =>
        this.mapTripSponsor(dbTripSponsor),
      ),
    );
  }

  delete(id: TripSponsorId) {
    const idStr = TripSponsorId.toString(id);
    return this.tryPromise(
      "delete",
      async () => {
        await this.db.delete(tripSponsors).where(eq(tripSponsors.id, idStr));
      },
      idStr,
    );
  }

  deleteByTripIdAndSponsorId(tripId: TripId, sponsorId: SponsorId) {
    const tripIdStr = TripId.toString(tripId);
    const sponsorIdStr = SponsorId.toString(sponsorId);
    return this.tryPromise(
      "deleteByTripIdAndSponsorId",
      async () => {
        await this.db
          .delete(tripSponsors)
          .where(
            and(
              eq(tripSponsors.tripId, tripIdStr),
              eq(tripSponsors.sponsorId, sponsorIdStr),
            ),
          );
      },
      `${tripIdStr}:${sponsorIdStr}`,
    );
  }

  existsByTripIdAndSponsorId(tripId: TripId, sponsorId: SponsorId) {
    const tripIdStr = TripId.toString(tripId);
    const sponsorIdStr = SponsorId.toString(sponsorId);
    return this.tryPromise(
      "existsByTripIdAndSponsorId",
      async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(tripSponsors)
          .where(
            and(
              eq(tripSponsors.tripId, tripIdStr),
              eq(tripSponsors.sponsorId, sponsorIdStr),
            ),
          );
        return (result[0]?.count ?? 0) > 0;
      },
      `${tripIdStr}:${sponsorIdStr}`,
    );
  }

  private mapTripSponsor(dbTripSponsor: TripSponsorSelect): TripSponsor {
    return {
      id: TripSponsorId.unsafeCreate(dbTripSponsor.id),
      tripId: TripId.unsafeCreate(dbTripSponsor.tripId),
      sponsorId: SponsorId.unsafeCreate(dbTripSponsor.sponsorId),
      createdAt: dbTripSponsor.createdAt,
    };
  }

  private mapTripSponsorWithSponsor(
    dbTripSponsor: TripSponsorSelect,
    dbSponsor: SponsorSelect,
  ) {
    return sponsorMapper.toDomain(dbSponsor).pipe(
      Effect.map((sponsor) => ({
        id: TripSponsorId.unsafeCreate(dbTripSponsor.id),
        tripId: TripId.unsafeCreate(dbTripSponsor.tripId),
        sponsorId: SponsorId.unsafeCreate(dbTripSponsor.sponsorId),
        createdAt: dbTripSponsor.createdAt,
        sponsor: this.toSponsorDTO(sponsor),
      })),
    );
  }

  private toSponsorDTO(sponsor: Sponsor): SponsorDTO {
    return {
      id: sponsor.id,
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
      createdAt: sponsor.createdAt,
      updatedAt: sponsor.updatedAt,
    };
  }
}
