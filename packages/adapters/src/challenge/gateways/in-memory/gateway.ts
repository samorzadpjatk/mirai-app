import type {
  ChallengeStatus,
  ScoringCategory,
  SubmissionType,
} from "@mirai-app/domain";
import type {
  ChallengeGateway,
  ChallengeDTO,
  ChallengePaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Challenge Gateway for Testing
 *
 * Implements ChallengeGateway port with in-memory storage.
 * Uses ChallengeDTOs instead of domain entities.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryChallengeGateway();
 * gateway.seed([mockChallengeDTO]);
 *
 * const byTrip = await Effect.runPromise(gateway.findByTripId("trip-123"));
 * expect(byTrip).toHaveLength(1);
 *
 * gateway.reset();
 * ```
 */
export class InMemoryChallengeGateway
  extends InMemoryGateway<ChallengeDTO>
  implements ChallengeGateway
{
  create(dto: ChallengeDTO): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    return this.createGeneric(dto);
  }

  findById(
    id: string,
  ): Effect.Effect<ChallengeDTO | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.tripId === tripId),
    );
  }

  findByStatus(
    status: string,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.status === status),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (c) => c.tripId === tripId && c.status === status,
      ),
    );
  }

  findBySubmissionType(
    type: SubmissionType,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.scoringCategory === type),
    );
  }

  findByScoringCategory(
    category: ScoringCategory,
  ): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((c) => c.scoringCategory === category),
    );
  }

  findActive(): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return this.findByStatus("ACTIVE");
  }

  findOpenForSubmission(): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    const now = new Date();
    return Effect.succeed(
      this.getAllItems().filter((c) => {
        if (c.status !== "ACTIVE") return false;
        if (c.startDate && c.startDate > now) return false;
        if (c.endDate && c.endDate < now) return false;
        return true;
      }),
    );
  }

  findRecurring(): Effect.Effect<ChallengeDTO[], DatabaseError, never> {
    return Effect.succeed([]);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengePaginatedResult, DatabaseError, never> {
    return Effect.sync(() => {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const allItems = this.getAllItems();
      const total = allItems.length;
      const items = allItems.slice(offset, offset + limit);
      const hasMore = offset + items.length < total;

      return {
        items,
        total,
        limit,
        offset,
        hasMore,
      };
    });
  }

  update(dto: ChallengeDTO): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    return this.updateGeneric(dto);
  }

  updateStatus(
    id: string,
    status: string,
  ): Effect.Effect<ChallengeDTO, DatabaseError, never> {
    const dto = this.storage.get(id);
    if (!dto) {
      return Effect.fail(
        new DatabaseError({
          operation: "updateStatus",
          message: `Challenge with id ${id} not found`,
        }),
      );
    }
    const updated: ChallengeDTO = {
      ...dto,
      status: status as ChallengeStatus,
      updatedAt: new Date(),
    };
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
