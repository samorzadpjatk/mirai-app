import { Effect } from "effect";
import { Trip, TripId, DatabaseError } from "@mirai-app/domain";
import type { ITripPort } from "@mirai-app/use-cases";

/**
 * TripResource DTO interface (from TripPort)
 */
interface TripResource {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  iconName: string | null;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Insurance Step interface
 */
interface InsuranceStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
}

/**
 * Trip Insurance interface
 */
interface TripInsurance {
  id: string;
  tripId: string;
  title: string;
  description: string | null;
  provider: string | null;
  policyNumber: string | null;
  steps: InsuranceStep[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-Memory Trip Gateway
 *
 * Implements TripPort using in-memory Map storage for testing.
 */
export class InMemoryTripGateway implements ITripPort {
  private trips: Map<string, Trip> = new Map();
  private tripParticipants: Map<string, Set<string>> = new Map();
  private tripResources: Map<string, TripResource[]> = new Map();
  private tripInsurances: Map<string, TripInsurance> = new Map();

  findById(id: TripId): Effect.Effect<Trip | null, DatabaseError, never> {
    return Effect.sync(() => {
      const trip = this.trips.get(TripId.toString(id));
      return trip ?? null;
    });
  }

  findByUserId(userId: string): Effect.Effect<Trip[], DatabaseError, never> {
    return Effect.sync(() => {
      const userTripIds = this.getUserTripIds(userId);
      return userTripIds
        .map((tripId) => this.trips.get(tripId))
        .filter((trip): trip is Trip => trip !== undefined)
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    });
  }

  findAll(): Effect.Effect<Trip[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.trips.values()).sort(
        (a, b) => b.startDate.getTime() - a.startDate.getTime(),
      );
    });
  }

  findPaginated(params: {
    userId: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { trips: Trip[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const userTripIds = this.getUserTripIds(params.userId);
      const total = userTripIds.length;

      const paginatedIds = userTripIds.slice(
        params.offset,
        params.offset + params.limit,
      );

      const trips = paginatedIds
        .map((id) => this.trips.get(id))
        .filter((trip): trip is Trip => trip !== undefined)
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

      return {
        trips,
        total,
        hasMore: params.offset + trips.length < total,
      };
    });
  }

  create(trip: Trip): Effect.Effect<Trip, DatabaseError, never> {
    return Effect.sync(() => {
      this.trips.set(TripId.toString(trip.id), trip);
      return trip;
    });
  }

  update(trip: Trip): Effect.Effect<Trip, DatabaseError, never> {
    return Effect.sync(() => {
      this.trips.set(TripId.toString(trip.id), trip);
      return trip;
    });
  }

  delete(id: TripId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.trips.delete(TripId.toString(id));
      this.tripParticipants.delete(TripId.toString(id));
      this.tripResources.delete(TripId.toString(id));
      this.tripInsurances.delete(TripId.toString(id));
    });
  }

  exists(id: TripId): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => {
      return this.trips.has(TripId.toString(id));
    });
  }

  hasUserAccess(
    tripId: string,
    userId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => {
      const participants = this.tripParticipants.get(tripId);
      return participants?.has(userId) ?? false;
    });
  }

  findResourcesByTripId(
    tripId: string,
  ): Effect.Effect<TripResource[], DatabaseError, never> {
    return Effect.sync(() => {
      const resources = this.tripResources.get(tripId);
      return resources
        ? resources.sort((a, b) => a.sortOrder - b.sortOrder)
        : [];
    });
  }

  /**
   * Find insurance by trip ID
   *
   * Returns the stored TripInsurance or null if not found.
   */
  findInsuranceByTripId(
    tripId: string,
  ): Effect.Effect<TripInsurance | null, DatabaseError, never> {
    return Effect.sync(() => {
      return this.tripInsurances.get(tripId) ?? null;
    });
  }

  /**
   * Helper method to add insurance (for testing)
   */
  addInsurance(tripId: string, insurance: TripInsurance): void {
    this.tripInsurances.set(tripId, insurance);
  }

  /**
   * Helper method to add a participant (for testing)
   */
  addParticipant(tripId: string, userId: string): void {
    const participants = this.tripParticipants.get(tripId) ?? new Set();
    participants.add(userId);
    this.tripParticipants.set(tripId, participants);
  }

  /**
   * Helper method to add a resource (for testing)
   */
  addResource(tripId: string, resource: TripResource): void {
    const resources = this.tripResources.get(tripId) ?? [];
    resources.push(resource);
    this.tripResources.set(tripId, resources);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.trips.clear();
    this.tripParticipants.clear();
    this.tripResources.clear();
    this.tripInsurances.clear();
  }

  /**
   * Get all trip IDs for a user
   */
  private getUserTripIds(userId: string): string[] {
    const tripIds: string[] = [];
    for (const [tripId, participants] of this.tripParticipants.entries()) {
      if (participants.has(userId)) {
        tripIds.push(tripId);
      }
    }
    return tripIds;
  }
}
