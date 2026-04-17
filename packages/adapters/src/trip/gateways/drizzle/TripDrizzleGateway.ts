import { Effect } from "effect";
import { eq, count, and, sql, inArray, asc } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  trips,
  tripResources,
  tripParticipants,
  tripInsurance,
  tripInsuranceSteps,
  type TripSelect,
  type TripResourceSelect,
  type TripInsuranceSelect,
  type TripInsuranceStepSelect,
} from "@mirai-app/frameworks/drizzle";
import { Trip, TripId, DatabaseError, type ITripPort } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { tripMapper } from "../../mappers/TripMapper";
import { tripResourceMapper } from "../../mappers/TripResourceMapper";
import { tripInsuranceMapper } from "../../mappers/TripInsuranceMapper";

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
 * Trip Drizzle Gateway
 *
 * Implements TripPort using Drizzle ORM for database operations.
 */
export class TripDrizzleGateway
  extends BaseDrizzleGateway
  implements ITripPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  /**
   * Find active trips at a given date
   *
   * Returns trips where startDate <= atDate <= endDate
   */
  findActive(atDate: Date) {
    return this.tryPromise("findActive", async () => {
      const results = await this.db
        .select()
        .from(trips)
        .where(
          and(
            sql`${trips.startDate} <= ${atDate.toISOString()}`,
            sql`${trips.endDate} >= ${atDate.toISOString()}`,
          ),
        )
        .orderBy(sql`${trips.startDate} DESC`);
      return results;
    }).pipe(
      Effect.flatMap((dbTrips: TripSelect[]) =>
        Effect.forEach(dbTrips, (dbTrip) => tripMapper.toDomain(dbTrip)),
      ),
    );
  }

  findById(id: TripId) {
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(trips)
          .where(eq(trips.id, TripId.toString(id)))
          .limit(1);
        return result[0] ?? null;
      },
      TripId.toString(id),
    ).pipe(
      Effect.flatMap((dbTrip: TripSelect | null) =>
        dbTrip ? tripMapper.toDomain(dbTrip) : Effect.succeed(null),
      ),
    );
  }

  findByUserId(userId: string) {
    return this.tryPromise(
      "findByUserId",
      async () => {
        const participantTrips = await this.db
          .select({ tripId: tripParticipants.tripId })
          .from(tripParticipants)
          .where(eq(tripParticipants.userId, userId));

        const tripIds = participantTrips.map((p) => p.tripId);
        if (tripIds.length === 0) return [];

        const results = await this.db
          .select()
          .from(trips)
          .where(inArray(trips.id, tripIds))
          .orderBy(sql`${trips.startDate} DESC`);
        return results;
      },
      userId,
    ).pipe(
      Effect.flatMap((dbTrips: TripSelect[]) =>
        Effect.forEach(dbTrips, (dbTrip) => tripMapper.toDomain(dbTrip)),
      ),
    );
  }

  findAll() {
    return this.tryPromise("findAll", async () => {
      const results = await this.db
        .select()
        .from(trips)
        .orderBy(sql`${trips.startDate} DESC`);
      return results;
    }).pipe(
      Effect.flatMap((dbTrips: TripSelect[]) =>
        Effect.forEach(dbTrips, (dbTrip) => tripMapper.toDomain(dbTrip)),
      ),
    );
  }

  findPaginated(params: { userId: string; limit: number; offset: number }) {
    return this.tryPromise(
      "findPaginated",
      async () => {
        const participantTrips = await this.db
          .select({ tripId: tripParticipants.tripId })
          .from(tripParticipants)
          .where(eq(tripParticipants.userId, params.userId));

        const tripIds = participantTrips.map((p) => p.tripId);
        if (tripIds.length === 0) {
          return { items: [], total: 0 };
        }

        const [items, totalResult] = await Promise.all([
          this.db
            .select()
            .from(trips)
            .where(inArray(trips.id, tripIds))
            .orderBy(sql`${trips.startDate} DESC`)
            .limit(params.limit)
            .offset(params.offset),
          this.db
            .select({ count: count() })
            .from(trips)
            .where(inArray(trips.id, tripIds)),
        ]);

        return { items, total: totalResult[0]?.count ?? 0 };
      },
      params.userId,
    ).pipe(
      Effect.flatMap(
        ({ items, total }: { items: TripSelect[]; total: number }) =>
          Effect.forEach(items, (item) => tripMapper.toDomain(item)).pipe(
            Effect.map((domainTrips) => ({
              trips: domainTrips,
              total,
              hasMore: params.offset + items.length < total,
            })),
          ),
      ),
    );
  }

  create(trip: Trip) {
    const insertData = tripMapper.toInsert(trip);
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(trips)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create trip");
        return result;
      },
      TripId.toString(trip.id),
    ).pipe(Effect.flatMap((dbTrip: TripSelect) => tripMapper.toDomain(dbTrip)));
  }

  update(trip: Trip) {
    const updateData = tripMapper.toUpdate(trip);
    return this.tryPromise(
      "update",
      async () => {
        const [result] = await this.db
          .update(trips)
          .set(updateData)
          .where(eq(trips.id, TripId.toString(trip.id)))
          .returning();
        if (!result) throw new Error("Failed to update trip");
        return result;
      },
      TripId.toString(trip.id),
    ).pipe(Effect.flatMap((dbTrip: TripSelect) => tripMapper.toDomain(dbTrip)));
  }

  delete(id: TripId) {
    return this.tryPromise(
      "delete",
      async () => {
        await this.db.delete(trips).where(eq(trips.id, TripId.toString(id)));
      },
      TripId.toString(id),
    );
  }

  exists(id: TripId) {
    return this.tryPromise(
      "exists",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(trips)
          .where(eq(trips.id, TripId.toString(id)));
        return (result[0]?.count ?? 0) > 0;
      },
      TripId.toString(id),
    );
  }

  hasUserAccess(tripId: string, userId: string) {
    return this.tryPromise(
      "hasUserAccess",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.tripId, tripId),
              eq(tripParticipants.userId, userId),
            ),
          );
        return (result[0]?.count ?? 0) > 0;
      },
      tripId,
    );
  }

  findResourcesByTripId(tripId: string) {
    return this.tryPromise(
      "findResourcesByTripId",
      async () => {
        const results = await this.db
          .select()
          .from(tripResources)
          .where(eq(tripResources.tripId, tripId))
          .orderBy(sql`${tripResources.sortOrder} ASC`);
        return results;
      },
      tripId,
    ).pipe(
      Effect.map((dbResources: TripResourceSelect[]) =>
        tripResourceMapper.toDTOs(dbResources),
      ),
    );
  }

  /**
   * Find insurance by trip ID
   *
   * Queries the tripInsurance table and associated tripInsuranceSteps
   * to build the complete TripInsurance DTO with nested steps.
   */
  findInsuranceByTripId(tripId: string) {
    return this.tryPromise(
      "findInsuranceByTripId",
      async () => {
        // Query the insurance record for this trip
        const insuranceResult = await this.db
          .select()
          .from(tripInsurance)
          .where(eq(tripInsurance.tripId, tripId))
          .limit(1);

        const insurance = insuranceResult[0];
        if (!insurance) {
          return null;
        }

        // Query the associated steps
        const stepsResult = await this.db
          .select()
          .from(tripInsuranceSteps)
          .where(eq(tripInsuranceSteps.insuranceId, insurance.id))
          .orderBy(asc(tripInsuranceSteps.stepNumber));

        return { insurance, steps: stepsResult };
      },
      tripId,
    ).pipe(
      Effect.map((result) => {
        if (!result) return null;
        return tripInsuranceMapper.toDTO(
          result.insurance as TripInsuranceSelect,
          result.steps as TripInsuranceStepSelect[],
        );
      }),
    );
  }
}
