import type {
  Challenge,
  ChallengeStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";
import type { ChallengeRepository } from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/use-cases/ports/errors";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Challenge Repository for Testing
 *
 * Implements ChallengeRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryChallengeRepository();
 * repo.seed([mockChallenge]);
 *
 * const byTrip = await Effect.runPromise(repo.findByTripId("trip-123"));
 * expect(byTrip).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryChallengeRepository
  extends InMemoryRepository<Challenge>
  implements ChallengeRepository
{
  create(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never> {
    return this.createGeneric(challenge);
  }

  findById(id: string): Effect.Effect<Challenge | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.tripId === tripId),
    );
  }

  findByStatus(
    status: ChallengeStatus,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.status === status),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (c) => c.tripId === tripId && c.status === status,
      ),
    );
  }

  findBySubmissionType(
    type: SubmissionType,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.submissionType === type),
    );
  }

  findByScoringCategory(
    category: ScoringCategory,
  ): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.scoringCategory === category),
    );
  }

  findActive(): Effect.Effect<Challenge[], DatabaseError, never> {
    return this.findByStatus("ACTIVE" as ChallengeStatus);
  }

  findOpenForSubmission(): Effect.Effect<Challenge[], DatabaseError, never> {
    const now = new Date();
    return Effect.succeed(
      this.getAllItems().filter((c) => {
        if (c.status !== ("ACTIVE" as ChallengeStatus)) return false;
        if (c.startTime && c.startTime > now) return false;
        if (c.endTime && c.endTime < now) return false;
        return true;
      }),
    );
  }

  findRecurring(): Effect.Effect<Challenge[], DatabaseError, never> {
    return Effect.succeed(this.getAllItems().filter((c) => c.isRecurring));
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Challenge[], DatabaseError, never> {
    return this.findAllGeneric(options);
  }

  update(challenge: Challenge): Effect.Effect<Challenge, DatabaseError, never> {
    return this.updateGeneric(challenge);
  }

  updateStatus(
    id: string,
    status: ChallengeStatus,
  ): Effect.Effect<Challenge, DatabaseError, never> {
    const challenge = this.storage.get(id);
    if (!challenge) {
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: `Challenge with id ${id} not found`,
        }),
      );
    }
    const updated = new (challenge.constructor as new (
      ...args: unknown[]
    ) => Challenge)(
      challenge.id,
      challenge.tripId,
      challenge.name,
      challenge.description,
      challenge.image,
      challenge.submissionType,
      challenge.scoringCategory,
      challenge.isRecurring,
      challenge.dailyStartTime,
      challenge.dailyEndTime,
      challenge.basePoints,
      challenge.firstPlacePoints,
      challenge.secondPlacePoints,
      challenge.thirdPlacePoints,
      status,
      challenge.startTime,
      challenge.endTime,
      challenge.votingStartTime,
      challenge.votingEndTime,
      challenge.targetLatitude,
      challenge.targetLongitude,
      challenge.expectedValue,
      challenge.autoApprove,
      challenge.createdAt,
      new Date(),
    );
    return this.updateGeneric(updated);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.existsGeneric(id);
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.tripId === tripId).length,
    );
  }
}
