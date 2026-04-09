import type { Trip, TripStatus } from "@mirai-app/domain";
import type { TripRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./InMemoryRepository";

/**
 * In-Memory Trip Repository for Testing
 *
 * Implements TripRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryTripRepository();
 * repo.seed([mockTrip]);
 *
 * const active = await repo.findActive();
 * expect(active).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryTripRepository
  extends InMemoryRepository<Trip>
  implements TripRepository
{
  async create(trip: Trip): Promise<Trip> {
    return this.createGeneric(trip);
  }

  async findById(id: string): Promise<Trip | null> {
    return this.findByIdGeneric(id);
  }

  async findByStatus(status: TripStatus): Promise<Trip[]> {
    return this.getAllItems().filter((t) => t.status === status);
  }

  async findActive(): Promise<Trip[]> {
    return this.findByStatus("ACTIVE" as TripStatus);
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Trip[]> {
    return this.findAllGeneric(options);
  }

  async update(trip: Trip): Promise<Trip> {
    return this.updateGeneric(trip);
  }

  async updateStatus(id: string, status: TripStatus): Promise<Trip> {
    const trip = await this.findById(id);
    if (!trip) {
      throw new Error(`Trip with id ${id} not found`);
    }
    // Create new trip with updated status
    const updated = new (trip.constructor as new (...args: unknown[]) => Trip)(
      trip.id,
      trip.name,
      trip.description,
      trip.startDate,
      trip.endDate,
      trip.backgroundImagePath,
      status,
      trip.createdAt,
      new Date(), // updatedAt
    );
    return this.updateGeneric(updated);
  }

  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }

  async countByStatus(status: TripStatus): Promise<number> {
    return this.findByStatus(status).then((items) => items.length);
  }
}
