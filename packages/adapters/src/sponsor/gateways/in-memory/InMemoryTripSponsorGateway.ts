import { Effect, Context } from "effect";
import {
  SponsorId,
  TripId,
  TripSponsorId,
  DatabaseError,
  type IAuthZPort,
} from "@mirai-app/domain";
import type {
  ITripSponsorPort,
  TripSponsor,
  TripSponsorWithSponsor,
} from "@mirai-app/use-cases/sponsor";
import type { Sponsor } from "@mirai-app/domain";
import { AuthContextTag } from "../../../infrastructure/effect";

// Local AuthZPortTag to avoid circular dependency issues
class AuthZPortTag extends Context.Tag("AuthZ")<AuthZPortTag, IAuthZPort>() {}

/**
 * In-Memory Trip Sponsor Gateway
 *
 * Implements ITripSponsorPort using in-memory Map storage for testing.
 *
 * Authorization Pattern:
 * - Read operations: Public - no auth required
 * - Write operations (create, delete, deleteByTripIdAndSponsorId): Admin or trip leader
 */
export class InMemoryTripSponsorGateway implements ITripSponsorPort {
  private tripSponsors: Map<string, TripSponsor> = new Map();
  private sponsors: Map<string, Sponsor> = new Map();

  findById(id: TripSponsorId) {
    return Effect.sync(() => {
      const tripSponsor = this.tripSponsors.get(TripSponsorId.toString(id));
      if (!tripSponsor) return null;

      const sponsor = this.sponsors.get(
        SponsorId.toString(tripSponsor.sponsorId),
      );
      if (!sponsor) return null;

      return {
        ...tripSponsor,
        sponsor: this.toSponsorDTO(sponsor),
      };
    });
  }

  findByTripId(tripId: TripId) {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      return Array.from(this.tripSponsors.values())
        .filter((ts) => TripId.toString(ts.tripId) === tripIdStr)
        .map((ts) => {
          const sponsor = this.sponsors.get(SponsorId.toString(ts.sponsorId));
          if (!sponsor) {
            throw new Error(
              `Sponsor not found: ${SponsorId.toString(ts.sponsorId)}`,
            );
          }
          return {
            ...ts,
            sponsor: this.toSponsorDTO(sponsor),
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findBySponsorId(sponsorId: SponsorId) {
    return Effect.sync(() => {
      const sponsorIdStr = SponsorId.toString(sponsorId);
      return Array.from(this.tripSponsors.values())
        .filter((ts) => SponsorId.toString(ts.sponsorId) === sponsorIdStr)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findByTripIdAndSponsorId(tripId: TripId, sponsorId: SponsorId) {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      const sponsorIdStr = SponsorId.toString(sponsorId);
      const found = Array.from(this.tripSponsors.values()).find(
        (ts) =>
          TripId.toString(ts.tripId) === tripIdStr &&
          SponsorId.toString(ts.sponsorId) === sponsorIdStr,
      );
      return found ?? null;
    });
  }

  create(tripSponsor: TripSponsor) {
    const self = this;
    const idStr = TripSponsorId.toString(tripSponsor.id);
    const tripIdStr = TripId.toString(tripSponsor.tripId);

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission (admin or trip leader)
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "write",
        });
      }

      self.tripSponsors.set(idStr, tripSponsor);
      return tripSponsor;
    });
  }

  delete(id: TripSponsorId) {
    const self = this;
    const idStr = TripSponsorId.toString(id);

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission (admin or trip leader)
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: idStr,
          requiredPermission: "write",
        });
      }

      self.tripSponsors.delete(idStr);
    });
  }

  deleteByTripIdAndSponsorId(tripId: TripId, sponsorId: SponsorId) {
    const self = this;
    const tripIdStr = TripId.toString(tripId);
    const sponsorIdStr = SponsorId.toString(sponsorId);

    return Effect.gen(function* () {
      // Get AuthContext and verify write permission (admin or trip leader)
      const authCtx = yield* AuthContextTag;

      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: tripIdStr,
          requiredPermission: "write",
        });
      }

      const toDelete = Array.from(self.tripSponsors.entries()).find(
        ([_, ts]) =>
          TripId.toString(ts.tripId) === tripIdStr &&
          SponsorId.toString(ts.sponsorId) === sponsorIdStr,
      );
      if (toDelete) {
        self.tripSponsors.delete(toDelete[0]);
      }
    });
  }

  existsByTripIdAndSponsorId(tripId: TripId, sponsorId: SponsorId) {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      const sponsorIdStr = SponsorId.toString(sponsorId);
      return Array.from(this.tripSponsors.values()).some(
        (ts) =>
          TripId.toString(ts.tripId) === tripIdStr &&
          SponsorId.toString(ts.sponsorId) === sponsorIdStr,
      );
    });
  }

  /**
   * Helper method to add a trip sponsor relationship (for testing)
   */
  addTripSponsor(tripSponsor: TripSponsor): void {
    this.tripSponsors.set(TripSponsorId.toString(tripSponsor.id), tripSponsor);
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
    this.tripSponsors.clear();
    this.sponsors.clear();
  }

  private toSponsorDTO(sponsor: Sponsor): TripSponsorWithSponsor["sponsor"] {
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
