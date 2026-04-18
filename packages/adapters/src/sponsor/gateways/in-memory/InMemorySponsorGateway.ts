import { Effect, Context } from "effect";
import { Sponsor, SponsorId, DatabaseError } from "@mirai-app/domain";
import type { ISponsorPort, IAuthZPort } from "@mirai-app/domain";
import { AuthContextTag } from "../../../infrastructure/effect";

// Local AuthZPortTag to avoid circular dependency issues
class AuthZPortTag extends Context.Tag("AuthZ")<AuthZPortTag, IAuthZPort>() {}

/**
 * In-Memory Sponsor Gateway
 *
 * Implements ISponsorPort using in-memory Map storage for testing.
 *
 * Authorization Pattern:
 * - Read operations: Public - no auth required
 * - Write operations (create, update, delete): Admin only
 */
export class InMemorySponsorGateway implements ISponsorPort {
  private sponsors: Map<string, Sponsor> = new Map();

  findById(id: SponsorId) {
    return Effect.sync(() => {
      const sponsor = this.sponsors.get(SponsorId.toString(id));
      return sponsor ?? null;
    });
  }

  findAll() {
    return Effect.sync(() => {
      return Array.from(this.sponsors.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    });
  }

  findActive() {
    return Effect.sync(() => {
      return Array.from(this.sponsors.values())
        .filter((sponsor) => sponsor.isActive)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  create(sponsor: Sponsor) {
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
          resourceId: SponsorId.toString(sponsor.id),
          requiredPermission: "write",
        });
      }

      self.sponsors.set(SponsorId.toString(sponsor.id), sponsor);
      return sponsor;
    });
  }

  update(sponsor: Sponsor) {
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
          resourceId: SponsorId.toString(sponsor.id),
          requiredPermission: "write",
        });
      }

      self.sponsors.set(SponsorId.toString(sponsor.id), sponsor);
      return sponsor;
    });
  }

  delete(id: SponsorId) {
    const self = this;
    const idStr = SponsorId.toString(id);

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

      self.sponsors.delete(idStr);
    });
  }

  exists(id: SponsorId) {
    return Effect.sync(() => {
      return this.sponsors.has(SponsorId.toString(id));
    });
  }

  /**
   * Helper method to add a sponsor (for testing)
   */
  addSponsor(sponsor: Sponsor): void {
    this.sponsors.set(SponsorId.toString(sponsor.id), sponsor);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.sponsors.clear();
  }
}
