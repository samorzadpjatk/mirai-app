import { Context, Effect } from "effect";
import type {
  Trip,
  IPortError,
  TripId,
  TripResourceId,
  TripInsuranceId,
} from "@mirai-app/domain";

/**
 * Trip Port - Repository interface with Context.Tag for Effect DI
 * Note: This extends the domain ITripPort with additional use-case specific methods
 */
export interface ITripPort {
  findById(id: TripId): Effect.Effect<Trip | null, IPortError, never>;
  findByUserId(userId: string): Effect.Effect<Trip[], IPortError, never>;
  findAll(): Effect.Effect<Trip[], IPortError, never>;
  findPaginated(params: {
    userId: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { trips: Trip[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  create(trip: Trip): Effect.Effect<Trip, IPortError, never>;
  update(trip: Trip): Effect.Effect<Trip, IPortError, never>;
  delete(id: TripId): Effect.Effect<void, IPortError, never>;
  exists(id: TripId): Effect.Effect<boolean, IPortError, never>;
  hasUserAccess(
    tripId: string,
    userId: string,
  ): Effect.Effect<boolean, IPortError, never>;

  // Trip resources
  findResourcesByTripId(
    tripId: string,
  ): Effect.Effect<TripResource[], IPortError, never>;
  findInsuranceByTripId(
    tripId: string,
  ): Effect.Effect<TripInsurance | null, IPortError, never>;
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
