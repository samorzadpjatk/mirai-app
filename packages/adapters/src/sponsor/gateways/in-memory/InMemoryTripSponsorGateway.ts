import { Effect } from "effect";
import {
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
import type { Sponsor } from "@mirai-app/domain";

/**
 * In-Memory Trip Sponsor Gateway
 *
 * Implements ITripSponsorPort using in-memory Map storage for testing.
 */
export class InMemoryTripSponsorGateway implements ITripSponsorPort {
  private tripSponsors: Map<string, TripSponsor> = new Map();
  private sponsors: Map<string, Sponsor> = new Map();

  findById(
    id: TripSponsorId,
  ): Effect.Effect<TripSponsorWithSponsor | null, DatabaseError, never> {
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

  findByTripId(
    tripId: TripId,
  ): Effect.Effect<TripSponsorWithSponsor[], DatabaseError, never> {
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

  findBySponsorId(
    sponsorId: SponsorId,
  ): Effect.Effect<TripSponsor[], DatabaseError, never> {
    return Effect.sync(() => {
      const sponsorIdStr = SponsorId.toString(sponsorId);
      return Array.from(this.tripSponsors.values())
        .filter((ts) => SponsorId.toString(ts.sponsorId) === sponsorIdStr)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<TripSponsor | null, DatabaseError, never> {
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

  create(
    tripSponsor: TripSponsor,
  ): Effect.Effect<TripSponsor, DatabaseError, never> {
    return Effect.sync(() => {
      this.tripSponsors.set(
        TripSponsorId.toString(tripSponsor.id),
        tripSponsor,
      );
      return tripSponsor;
    });
  }

  delete(id: TripSponsorId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.tripSponsors.delete(TripSponsorId.toString(id));
    });
  }

  deleteByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const tripIdStr = TripId.toString(tripId);
      const sponsorIdStr = SponsorId.toString(sponsorId);
      const toDelete = Array.from(this.tripSponsors.entries()).find(
        ([_, ts]) =>
          TripId.toString(ts.tripId) === tripIdStr &&
          SponsorId.toString(ts.sponsorId) === sponsorIdStr,
      );
      if (toDelete) {
        this.tripSponsors.delete(toDelete[0]);
      }
    });
  }

  existsByTripIdAndSponsorId(
    tripId: TripId,
    sponsorId: SponsorId,
  ): Effect.Effect<boolean, DatabaseError, never> {
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
