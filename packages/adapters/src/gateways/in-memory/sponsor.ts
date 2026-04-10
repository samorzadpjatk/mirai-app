import type { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "@mirai-app/use-cases";
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
 * const found = await repo.findById("sponsor-123");
 * expect(found).not.toBeNull();
 *
 * // Link sponsor to trip
 * await repo.linkToTrip("sponsor-123", "trip-456");
 * const isLinked = await repo.isLinkedToTrip("sponsor-123", "trip-456");
 * expect(isLinked).toBe(true);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemorySponsorRepository
  extends InMemoryRepository<Sponsor>
  implements SponsorRepository
{
  /**
   * Stores trip-sponsor relationships.
   * Key: sponsorId, Value: Set of tripIds linked to this sponsor.
   */
  private tripLinks = new Map<string, Set<string>>();

  /**
   * Reset the repository - clears all stored data and trip links.
   * Call this in beforeEach for test isolation.
   */
  override reset(): void {
    super.reset();
    this.tripLinks.clear();
  }

  /**
   * Create a new sponsor.
   *
   * @param sponsor - The sponsor entity to create
   * @returns The created sponsor
   */
  async create(sponsor: Sponsor): Promise<Sponsor> {
    return this.createGeneric(sponsor);
  }

  /**
   * Find a sponsor by ID.
   *
   * @param id - The sponsor ID to search for
   * @returns The sponsor if found, null otherwise
   */
  async findById(id: string): Promise<Sponsor | null> {
    return this.findByIdGeneric(id);
  }

  /**
   * Find all sponsors with optional pagination.
   *
   * @param options - Optional pagination parameters (limit and offset)
   * @returns Array of sponsors
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Sponsor[]> {
    return this.findAllGeneric(options);
  }

  /**
   * Find all active sponsors.
   *
   * @returns Array of sponsors where isActive is true
   */
  async findActive(): Promise<Sponsor[]> {
    return this.getAllItems().filter((sponsor) => sponsor.isActive);
  }

  /**
   * Find sponsors by trip ID.
   *
   * Returns all sponsors linked to the specified trip.
   *
   * @param tripId - The trip ID to search for
   * @returns Array of sponsors linked to the trip
   */
  async findByTripId(tripId: string): Promise<Sponsor[]> {
    const linkedSponsorIds: string[] = [];

    for (const [sponsorId, tripIds] of Array.from(this.tripLinks.entries())) {
      if (tripIds.has(tripId)) {
        linkedSponsorIds.push(sponsorId);
      }
    }

    const sponsors: Sponsor[] = [];
    for (const sponsorId of linkedSponsorIds) {
      const sponsor = await this.findById(sponsorId);
      if (sponsor) {
        sponsors.push(sponsor);
      }
    }

    return sponsors;
  }

  /**
   * Update an existing sponsor.
   *
   * @param sponsor - The sponsor entity to update
   * @returns The updated sponsor
   * @throws Error if sponsor with the given ID does not exist
   */
  async update(sponsor: Sponsor): Promise<Sponsor> {
    return this.updateGeneric(sponsor);
  }

  /**
   * Delete a sponsor by ID.
   *
   * Also removes any trip links associated with this sponsor.
   *
   * @param id - The sponsor ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.deleteGeneric(id);
    this.tripLinks.delete(id);
  }

  /**
   * Check if a sponsor exists.
   *
   * @param id - The sponsor ID to check
   * @returns True if sponsor exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }

  /**
   * Check if a sponsor is associated with a trip.
   *
   * @param sponsorId - The sponsor ID to check
   * @param tripId - The trip ID to check
   * @returns True if sponsor is linked to the trip, false otherwise
   */
  async isLinkedToTrip(sponsorId: string, tripId: string): Promise<boolean> {
    const tripIds = this.tripLinks.get(sponsorId);
    return tripIds?.has(tripId) ?? false;
  }

  /**
   * Link a sponsor to a trip.
   *
   * Creates an association between the sponsor and the trip.
   * Does nothing if the link already exists.
   *
   * @param sponsorId - The sponsor ID to link
   * @param tripId - The trip ID to link to
   */
  async linkToTrip(sponsorId: string, tripId: string): Promise<void> {
    if (!this.tripLinks.has(sponsorId)) {
      this.tripLinks.set(sponsorId, new Set<string>());
    }
    this.tripLinks.get(sponsorId)!.add(tripId);
  }

  /**
   * Unlink a sponsor from a trip.
   *
   * Removes the association between the sponsor and the trip.
   * Does nothing if the link does not exist.
   *
   * @param sponsorId - The sponsor ID to unlink
   * @param tripId - The trip ID to unlink from
   */
  async unlinkFromTrip(sponsorId: string, tripId: string): Promise<void> {
    const tripIds = this.tripLinks.get(sponsorId);
    if (tripIds) {
      tripIds.delete(tripId);
      // Clean up empty sets to prevent memory leaks
      if (tripIds.size === 0) {
        this.tripLinks.delete(sponsorId);
      }
    }
  }
}
