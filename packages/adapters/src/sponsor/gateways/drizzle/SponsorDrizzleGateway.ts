import { Effect } from "effect";
import { eq, sql } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { sponsors, type SponsorSelect } from "@mirai-app/frameworks/drizzle";
import {
  Sponsor,
  SponsorId,
  DatabaseError,
  type ISponsorPort,
} from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { sponsorMapper } from "../../mappers/SponsorMapper";

/**
 * Sponsor Drizzle Gateway
 *
 * Implements ISponsorPort using Drizzle ORM for database operations.
 */
export class SponsorDrizzleGateway
  extends BaseDrizzleGateway
  implements ISponsorPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: SponsorId) {
    const idStr = SponsorId.toString(id);
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(sponsors)
          .where(eq(sponsors.id, idStr))
          .limit(1);
        return result[0] ?? null;
      },
      idStr,
    ).pipe(
      Effect.flatMap((dbSponsor: SponsorSelect | null) =>
        dbSponsor ? sponsorMapper.toDomain(dbSponsor) : Effect.succeed(null),
      ),
    );
  }

  findAll() {
    return this.tryPromise("findAll", async () => {
      const results = await this.db
        .select()
        .from(sponsors)
        .orderBy(sql`${sponsors.createdAt} DESC`);
      return results;
    }).pipe(
      Effect.flatMap((dbSponsors: SponsorSelect[]) =>
        Effect.forEach(dbSponsors, (dbSponsor) =>
          sponsorMapper.toDomain(dbSponsor),
        ),
      ),
    );
  }

  findActive() {
    return this.tryPromise("findActive", async () => {
      const results = await this.db
        .select()
        .from(sponsors)
        .where(eq(sponsors.isActive, true))
        .orderBy(sql`${sponsors.createdAt} DESC`);
      return results;
    }).pipe(
      Effect.flatMap((dbSponsors: SponsorSelect[]) =>
        Effect.forEach(dbSponsors, (dbSponsor) =>
          sponsorMapper.toDomain(dbSponsor),
        ),
      ),
    );
  }

  create(sponsor: Sponsor) {
    const insertData = sponsorMapper.toInsert(sponsor);
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(sponsors)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create sponsor");
        return result;
      },
      SponsorId.toString(sponsor.id),
    ).pipe(
      Effect.flatMap((dbSponsor: SponsorSelect) =>
        sponsorMapper.toDomain(dbSponsor),
      ),
    );
  }

  update(sponsor: Sponsor) {
    const updateData = sponsorMapper.toUpdate(sponsor);
    return this.tryPromise(
      "update",
      async () => {
        const [result] = await this.db
          .update(sponsors)
          .set(updateData)
          .where(eq(sponsors.id, SponsorId.toString(sponsor.id)))
          .returning();
        if (!result) throw new Error("Failed to update sponsor");
        return result;
      },
      SponsorId.toString(sponsor.id),
    ).pipe(
      Effect.flatMap((dbSponsor: SponsorSelect) =>
        sponsorMapper.toDomain(dbSponsor),
      ),
    );
  }

  delete(id: SponsorId) {
    const idStr = SponsorId.toString(id);
    return this.tryPromise(
      "delete",
      async () => {
        await this.db.delete(sponsors).where(eq(sponsors.id, idStr));
      },
      idStr,
    );
  }

  exists(id: SponsorId) {
    const idStr = SponsorId.toString(id);
    return this.tryPromise(
      "exists",
      async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(sponsors)
          .where(eq(sponsors.id, idStr));
        return (result[0]?.count ?? 0) > 0;
      },
      idStr,
    );
  }
}
