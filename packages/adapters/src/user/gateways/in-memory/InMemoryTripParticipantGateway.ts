import { Effect } from "effect";
import {
  TripParticipant,
  TripParticipantId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import type { ITripParticipantPort } from "@mirai-app/use-cases/user";

/**
 * In-Memory TripParticipant Gateway
 *
 * Implements ITripParticipantPort using in-memory Map storage for testing.
 */
export class InMemoryTripParticipantGateway implements ITripParticipantPort {
  private participants = new Map<string, TripParticipant>();
  private participantsByUserId = new Map<string, Set<string>>();
  private participantsByTripId = new Map<string, Set<string>>();
  private participantsByUserAndTrip = new Map<string, string>();

  private createKey(userId: string, tripId: string): string {
    return `${userId}:${tripId}`;
  }

  findByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return Effect.sync(() => {
      const key = this.createKey(userId, tripId);
      const participantId = this.participantsByUserAndTrip.get(key);
      if (!participantId) return null;
      return this.participants.get(participantId) ?? null;
    });
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return Effect.sync(() => {
      const participantIds = this.participantsByTripId.get(tripId);
      if (!participantIds) return [];

      const result: TripParticipant[] = [];
      for (const participantId of participantIds) {
        const participant = this.participants.get(participantId);
        if (participant) {
          result.push(participant);
        }
      }
      return result;
    });
  }

  findByUserId(
    userId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return Effect.sync(() => {
      const participantIds = this.participantsByUserId.get(userId);
      if (!participantIds) return [];

      const result: TripParticipant[] = [];
      for (const participantId of participantIds) {
        const participant = this.participants.get(participantId);
        if (participant) {
          result.push(participant);
        }
      }
      return result;
    });
  }

  findById(
    id: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return Effect.sync(() => this.participants.get(id) ?? null);
  }

  upsert(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.sync(() => {
      const id = TripParticipantId.toString(participant.id);
      const userIdStr = UserId.toString(participant.userId);
      const tripIdStr = TripId.toString(participant.tripId);
      const key = this.createKey(userIdStr, tripIdStr);

      this.participants.set(id, participant);
      this.participantsByUserAndTrip.set(key, id);

      const userParticipants =
        this.participantsByUserId.get(userIdStr) ?? new Set<string>();
      userParticipants.add(id);
      this.participantsByUserId.set(userIdStr, userParticipants);

      const tripParticipants =
        this.participantsByTripId.get(tripIdStr) ?? new Set<string>();
      tripParticipants.add(id);
      this.participantsByTripId.set(tripIdStr, tripParticipants);

      return participant;
    });
  }

  update(
    participant: TripParticipant,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.sync(() => {
      const id = TripParticipantId.toString(participant.id);
      this.participants.set(id, participant);
      return participant;
    });
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const participant = this.participants.get(id);
      if (participant) {
        const userIdStr = UserId.toString(participant.userId);
        const tripIdStr = TripId.toString(participant.tripId);
        const key = this.createKey(userIdStr, tripIdStr);

        this.participants.delete(id);
        this.participantsByUserAndTrip.delete(key);

        const userParticipants = this.participantsByUserId.get(userIdStr);
        if (userParticipants) {
          userParticipants.delete(id);
          if (userParticipants.size === 0) {
            this.participantsByUserId.delete(userIdStr);
          }
        }

        const tripParticipants = this.participantsByTripId.get(tripIdStr);
        if (tripParticipants) {
          tripParticipants.delete(id);
          if (tripParticipants.size === 0) {
            this.participantsByTripId.delete(tripIdStr);
          }
        }
      }
    });
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      const participantIds = this.participantsByTripId.get(tripId);
      return participantIds?.size ?? 0;
    });
  }

  isParticipant(
    userId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => {
      const key = this.createKey(userId, tripId);
      return this.participantsByUserAndTrip.has(key);
    });
  }

  findByWristNumber(
    tripId: string,
    wristNumber: string,
    excludeUserId?: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return Effect.sync(() => {
      const participantIds = this.participantsByTripId.get(tripId);
      if (!participantIds) return null;

      for (const participantId of participantIds) {
        const participant = this.participants.get(participantId);
        if (
          participant &&
          participant.wristNumber === wristNumber &&
          UserId.toString(participant.userId) !== excludeUserId
        ) {
          return participant;
        }
      }
      return null;
    });
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
    return Effect.sync(() => {
      const key = this.createKey(userId, tripId);
      const participantId = this.participantsByUserAndTrip.get(key);
      if (!participantId) return null;

      const participant = this.participants.get(participantId);
      if (!participant) return null;

      return {
        participant,
        group: null,
        trip: null,
      };
    });
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
    return Effect.sync(() => {
      const participantIds = this.participantsByTripId.get(tripId);
      if (!participantIds) return [];

      const result: {
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

      for (const participantId of participantIds) {
        const participant = this.participants.get(participantId);
        if (participant) {
          result.push({
            participant,
            user: {
              id: UserId.toString(participant.userId),
              firstName: "",
              lastName: "",
              role: "USER",
              authUserId: null,
            },
            group: null,
          });
        }
      }

      return result;
    });
  }

  // Helper method for testing - clear all data
  clear(): void {
    this.participants.clear();
    this.participantsByUserId.clear();
    this.participantsByTripId.clear();
    this.participantsByUserAndTrip.clear();
  }
}
