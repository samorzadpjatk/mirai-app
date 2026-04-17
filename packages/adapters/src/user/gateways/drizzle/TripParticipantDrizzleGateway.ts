import { Effect } from "effect";
import { eq, and, sql, count } from "drizzle-orm";
import type { ITripParticipantPort } from "@mirai-app/use-cases/user";
import {
  TripParticipant,
  TripParticipantId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import {
  tripParticipants,
  trips,
  groups,
  users,
} from "@mirai-app/frameworks/drizzle";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { tripParticipantMapper } from "../../mappers/TripParticipantMapper";

/**
 * TripParticipant Drizzle Gateway
 *
 * Implements ITripParticipantPort using Drizzle ORM for database operations.
 */
export class TripParticipantDrizzleGateway
  extends BaseDrizzleGateway
  implements ITripParticipantPort
{
  findByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findByUserAndTrip",
      async () => {
        const result = await this.db.query.tripParticipants.findFirst({
          where: and(
            eq(tripParticipants.userId, userId),
            eq(tripParticipants.tripId, tripId),
          ),
        });
        if (!result) return null;
        return await Effect.runPromise(tripParticipantMapper.toDomain(result));
      },
      `${userId}-${tripId}`,
    );
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findByTripId",
      async () => {
        const results = await this.db.query.tripParticipants.findMany({
          where: eq(tripParticipants.tripId, tripId),
        });

        const domainParticipants: TripParticipant[] = [];
        for (const result of results) {
          const participant = await Effect.runPromise(
            tripParticipantMapper.toDomain(result),
          );
          domainParticipants.push(participant);
        }
        return domainParticipants;
      },
      tripId,
    );
  }

  findByUserId(
    userId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findByUserId",
      async () => {
        const results = await this.db.query.tripParticipants.findMany({
          where: eq(tripParticipants.userId, userId),
        });

        const domainParticipants: TripParticipant[] = [];
        for (const result of results) {
          const participant = await Effect.runPromise(
            tripParticipantMapper.toDomain(result),
          );
          domainParticipants.push(participant);
        }
        return domainParticipants;
      },
      userId,
    );
  }

  findById(
    id: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.tripParticipants.findFirst({
          where: eq(tripParticipants.id, id),
        });
        if (!result) return null;
        return await Effect.runPromise(tripParticipantMapper.toDomain(result));
      },
      id,
    );
  }

  upsert(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.upsert",
      async () => {
        const insertData = tripParticipantMapper.toInsert(participant);

        await this.db
          .insert(tripParticipants)
          .values(insertData)
          .onConflictDoUpdate({
            target: tripParticipants.id,
            set: {
              groupId: insertData.groupId,
              wristNumber: insertData.wristNumber,
              houseNumber: insertData.houseNumber,
              role: insertData.role,
              updatedAt: new Date(),
            },
          });

        return participant;
      },
      TripParticipantId.toString(participant.id),
    );
  }

  update(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.update",
      async () => {
        const updateData = tripParticipantMapper.toUpdate(participant);
        await this.db
          .update(tripParticipants)
          .set(updateData)
          .where(
            eq(tripParticipants.id, TripParticipantId.toString(participant.id)),
          );
        return participant;
      },
      TripParticipantId.toString(participant.id),
    );
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.delete",
      async () => {
        await this.db
          .delete(tripParticipants)
          .where(eq(tripParticipants.id, id));
      },
      id,
    );
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.countByTripId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(tripParticipants)
          .where(eq(tripParticipants.tripId, tripId));
        return result[0]?.count ?? 0;
      },
      tripId,
    );
  }

  isParticipant(
    userId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.isParticipant",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.userId, userId),
              eq(tripParticipants.tripId, tripId),
            ),
          );
        return (result[0]?.count ?? 0) > 0;
      },
      `${userId}-${tripId}`,
    );
  }

  findByWristNumber(
    tripId: string,
    wristNumber: string,
    excludeUserId?: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findByWristNumber",
      async () => {
        let result;

        if (excludeUserId) {
          result = await this.db.query.tripParticipants.findFirst({
            where: and(
              eq(tripParticipants.tripId, tripId),
              eq(tripParticipants.wristNumber, wristNumber),
              sql`${tripParticipants.userId} != ${excludeUserId}`,
            ),
          });
        } else {
          result = await this.db.query.tripParticipants.findFirst({
            where: and(
              eq(tripParticipants.tripId, tripId),
              eq(tripParticipants.wristNumber, wristNumber),
            ),
          });
        }

        if (!result) return null;
        return await Effect.runPromise(tripParticipantMapper.toDomain(result));
      },
      `${tripId}-${wristNumber}`,
    );
  }

  findByUserAndTripWithRelations(
    userId: string,
    tripId: string,
  ): Effect.Effect<
    {
      participant: TripParticipant;
      group: { id: string; name: string } | null;
      trip: { id: string; name: string } | null;
    } | null,
    DatabaseError,
    never
  > {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findByUserAndTripWithRelations",
      async () => {
        const result = await this.db
          .select({
            participant: tripParticipants,
            trip: {
              id: trips.id,
              name: trips.name,
            },
            group: {
              id: groups.id,
              name: groups.name,
            },
          })
          .from(tripParticipants)
          .leftJoin(trips, eq(tripParticipants.tripId, trips.id))
          .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
          .where(
            and(
              eq(tripParticipants.userId, userId),
              eq(tripParticipants.tripId, tripId),
            ),
          )
          .limit(1);

        if (result.length === 0) return null;

        const row = result[0];
        if (!row) return null;

        const participant = await Effect.runPromise(
          tripParticipantMapper.toDomain(row.participant),
        );

        return {
          participant,
          group:
            row.group && row.group.id
              ? { id: row.group.id, name: row.group.name }
              : null,
          trip:
            row.trip && row.trip.id
              ? { id: row.trip.id, name: row.trip.name }
              : null,
        };
      },
      `${userId}-${tripId}`,
    );
  }

  findByTripIdWithRelations(tripId: string): Effect.Effect<
    {
      participant: TripParticipant;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        authUserId: string | null;
      };
      group: { id: string; name: string } | null;
    }[],
    DatabaseError,
    never
  > {
    return this.tryPromise(
      "TripParticipantDrizzleGateway.findByTripIdWithRelations",
      async () => {
        const results = await this.db
          .select({
            participant: tripParticipants,
            user: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              role: users.role,
              authUserId: users.authUserId,
            },
            group: {
              id: groups.id,
              name: groups.name,
            },
          })
          .from(tripParticipants)
          .innerJoin(users, eq(tripParticipants.userId, users.id))
          .leftJoin(groups, eq(tripParticipants.groupId, groups.id))
          .where(eq(tripParticipants.tripId, tripId));

        const domainResults: {
          participant: TripParticipant;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            role: string;
            authUserId: string | null;
          };
          group: { id: string; name: string } | null;
        }[] = [];

        for (const row of results) {
          const participant = await Effect.runPromise(
            tripParticipantMapper.toDomain(row.participant),
          );

          domainResults.push({
            participant,
            user: row.user
              ? {
                  id: row.user.id,
                  firstName: row.user.firstName,
                  lastName: row.user.lastName,
                  role: row.user.role,
                  authUserId: row.user.authUserId,
                }
              : {
                  id: row.participant.userId,
                  firstName: "",
                  lastName: "",
                  role: "USER",
                  authUserId: null,
                },
            group:
              row.group && row.group.id
                ? { id: row.group.id, name: row.group.name }
                : null,
          });
        }

        return domainResults;
      },
      tripId,
    );
  }
}
