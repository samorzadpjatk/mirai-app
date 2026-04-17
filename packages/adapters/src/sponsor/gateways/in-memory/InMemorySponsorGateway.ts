import { Effect } from "effect";
import { Sponsor, SponsorId, DatabaseError } from "@mirai-app/domain";
import type { ISponsorPort } from "@mirai-app/domain";

/**
 * In-Memory Sponsor Gateway
 *
 * Implements ISponsorPort using in-memory Map storage for testing.
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
    return Effect.sync(() => {
      this.sponsors.set(SponsorId.toString(sponsor.id), sponsor);
      return sponsor;
    });
  }

  update(sponsor: Sponsor) {
    return Effect.sync(() => {
      this.sponsors.set(SponsorId.toString(sponsor.id), sponsor);
      return sponsor;
    });
  }

  delete(id: SponsorId) {
    return Effect.sync(() => {
      this.sponsors.delete(SponsorId.toString(id));
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
