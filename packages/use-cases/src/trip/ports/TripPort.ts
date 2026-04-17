import { Context, Effect } from "effect";
import type {
  Trip,
  DatabaseError,
  TripId,
  TripResourceId,
  TripInsuranceId,
} from "@mirai-app/domain";

/**
 * Trip Port - Repository interface with Context.Tag for Effect DI
 */
export interface ITripPort {
  findById(id: TripId): Effect.Effect<Trip | null, DatabaseError, never>;
  findByUserId(userId: string): Effect.Effect<Trip[], DatabaseError, never>;
  findAll(): Effect.Effect<Trip[], DatabaseError, never>;
  findPaginated(params: {
    userId: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { trips: Trip[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  create(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;
  update(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;
  delete(id: TripId): Effect.Effect<void, DatabaseError, never>;
  exists(id: TripId): Effect.Effect<boolean, DatabaseError, never>;
  hasUserAccess(
    tripId: string,
    userId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  // Trip resources
  findResourcesByTripId(
    tripId: string,
  ): Effect.Effect<TripResource[], DatabaseError, never>;
  findInsuranceByTripId(
    tripId: string,
  ): Effect.Effect<TripInsurance | null, DatabaseError, never>;
}

export class TripPortTag extends Context.Tag("TripPort")<
  TripPortTag,
  ITripPort
>() {}

/**
 * Trip Resource interface
 */
export interface TripResource {
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
 * Trip Insurance interface
 */
export interface TripInsurance {
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
 * Insurance Step interface
 */
export interface InsuranceStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string | null;
}
