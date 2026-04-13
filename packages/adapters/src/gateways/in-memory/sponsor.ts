import type { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/use-cases/ports/SponsorRepository";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Sponsor Repository for Testing
 *
 * Implements SponsorRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * Manages sponsor data and trip-sponsor relationships in memory.
 *
 * @example
 * ```typescript
 * const repo = new InMemorySponsorRepository();
 * repo.seed([mockSponsor]);
 *
 * const found = await Effect.runPromise(repo.findById("sponsor-123"));
 * expect(found).not.toBeNull();
 *
 * // Link sponsor to trip
 * await Effect.runPromise(repo.linkToTrip("sponsor-123", "trip-456"));
 * const isLinked = await Effect.runPromise(repo.isLinkedToTrip("sponsor-123", "trip-456"));
 * expect(isLinked).toBe(true);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemorySponsorRepository
  extends InMemoryRepository<Sponsor>
  implements SponsorRepository
{
  private tripLinks = new Map<string, Set<string>>();

  override reset(): void {
    super.reset();
    this.tripLinks.clear();
  }

  create(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never> {
    return this.createGeneric(sponsor);
  }

  findById(id: string): Effect.Effect<Sponsor | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Sponsor[], DatabaseError, never> {
    return this.findAllGeneric(options);
  }

  findActive(): Effect.Effect<Sponsor[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((sponsor) => sponsor.isActive),
    );
  }

  findByTripId(tripId: string): Effect.Effect<Sponsor[], DatabaseError, never> {
    const linkedSponsorIds: string[] = [];

    for (const [sponsorId, tripIds] of Array.from(this.tripLinks.entries())) {
      if (tripIds.has(tripId)) {
        linkedSponsorIds.push(sponsorId);
      }
    }

    const sponsors: Sponsor[] = [];
    for (const sponsorId of linkedSponsorIds) {
      const sponsor = this.storage.get(sponsorId);
      if (sponsor) {
        sponsors.push(sponsor);
      }
    }

    return Effect.succeed(sponsors);
  }

  update(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never> {
    return this.updateGeneric(sponsor);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.tripLinks.delete(id);
    }).pipe(Effect.flatMap(() => this.deleteGeneric(id)));
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.existsGeneric(id);
  }

  isLinkedToTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    const tripIds = this.tripLinks.get(sponsorId);
    return Effect.succeed(tripIds?.has(tripId) ?? false);
  }

  linkToTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      if (!this.tripLinks.has(sponsorId)) {
        this.tripLinks.set(sponsorId, new Set<string>());
      }
      this.tripLinks.get(sponsorId)!.add(tripId);
    });
  }

  unlinkFromTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const tripIds = this.tripLinks.get(sponsorId);
      if (tripIds) {
        tripIds.delete(tripId);
        if (tripIds.size === 0) {
          this.tripLinks.delete(sponsorId);
        }
      }
    });
  }
}
