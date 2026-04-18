import { Effect } from "effect";
import { eq, sql } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import { sponsors, type SponsorSelect } from "../../../infrastructure/drizzle";
import {
  Sponsor,
  SponsorId,
  DatabaseError,
  type ISponsorPort,
} from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { sponsorMapper } from "../../mappers/SponsorMapper";

/**
 * Sponsor Drizzle Gateway
 *
 * Implements ISponsorPort using Drizzle ORM for database operations.
 * Uses AuthContext and AuthZPortTag for authorization.
 *
 * Authorization Pattern:
 * - Read operations (findById, findAll, findActive, exists): Public - no auth required
 * - Write operations (create, update, delete): Admin only
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
    const idStr = SponsorId.toString(sponsor.id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify admin permission for create
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "sponsor",
          resourceId: idStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .insert(sponsors)
            .values(insertData)
            .returning();
          if (!result) throw new Error("Failed to create sponsor");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(
      Effect.flatMap((dbSponsor: SponsorSelect) =>
        sponsorMapper.toDomain(dbSponsor),
      ),
    );
  }

  update(sponsor: Sponsor) {
    const updateData = sponsorMapper.toUpdate(sponsor);
    const idStr = SponsorId.toString(sponsor.id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify admin permission for update
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "sponsor",
          resourceId: idStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .update(sponsors)
            .set(updateData)
            .where(eq(sponsors.id, idStr))
            .returning();
          if (!result) throw new Error("Failed to update sponsor");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "update",
            id: idStr,
            cause: error,
          }),
      });
    }).pipe(
      Effect.flatMap((dbSponsor: SponsorSelect) =>
        sponsorMapper.toDomain(dbSponsor),
      ),
    );
  }

  delete(id: SponsorId) {
    const idStr = SponsorId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext and verify admin permission for delete
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "sponsor",
          resourceId: idStr,
          requiredPermission: "write",
        });
      }

      // Proceed with database operation
      return yield* Effect.tryPromise({
        try: async () => {
          await self.db.delete(sponsors).where(eq(sponsors.id, idStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id: idStr,
            cause: error,
          }),
      });
    });
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
