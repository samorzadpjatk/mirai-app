import type {
  ChallengeSubmission,
  SubmissionId,
  SubmissionStatus,
} from "@mirai-app/domain";
import type { ChallengeSubmissionRepository } from "@mirai-app/domain/ports";
import { DatabaseError } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway } from "../_shared/in-memory-base";

/**
 * In-Memory Challenge Submission Gateway for Testing
 *
 * Implements ChallengeSubmissionRepository port with in-memory storage.
 * Uses Map<string, ChallengeSubmission> keyed by submission ID.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryChallengeSubmissionGateway();
 * gateway.seed([mockSubmission]);
 *
 * const byChallenge = await Effect.runPromise(gateway.findByChallengeId("challenge-123"));
 * expect(byChallenge).toHaveLength(1);
 *
 * gateway.reset(); // Clear for next test
 * ```
 */
export class InMemoryChallengeSubmissionGateway
  extends InMemoryGateway<ChallengeSubmission>
  implements ChallengeSubmissionRepository
{
  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never> {
    return this.createGeneric(submission);
  }

  findById(
    id: SubmissionId,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
    return this.findByIdGeneric(id as string);
  }

  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().find(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      ) ?? null,
    );
  }

  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((s) => s.challengeId === challengeId),
    );
  }

  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((s) => s.groupId === groupId),
    );
  }

  findByStatus(
    status: SubmissionStatus,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((s) => s.status === status),
    );
  }

  findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    let items = this.getAllItems();

    if (params.challengeId) {
      items = items.filter((s) => s.challengeId === params.challengeId);
    }

    if (params.groupId) {
      items = items.filter((s) => s.groupId === params.groupId);
    }

    if (params.status) {
      items = items.filter((s) => s.status === params.status);
    }

    const orderBy = params.orderBy ?? "voteScore";
    const orderDirection = params.orderDirection ?? "desc";

    items.sort((a, b) => {
      if (orderBy === "voteScore") {
        if (orderDirection === "desc") {
          return b.voteScore - a.voteScore;
        }
        return a.voteScore - b.voteScore;
      } else {
        const aTime = a.createdAt.getTime();
        const bTime = b.createdAt.getTime();
        if (orderDirection === "desc") {
          return bTime - aTime;
        }
        return aTime - bTime;
      }
    });

    if (params.offset) {
      items = items.slice(params.offset);
    }

    if (params.limit !== undefined) {
      items = items.slice(0, params.limit);
    }

    return Effect.succeed(items);
  }

  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never> {
    return this.updateGeneric(submission);
  }

  delete(id: SubmissionId): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id as string);
  }

  existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      ),
    );
  }

  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((s) => s.challengeId === challengeId).length,
    );
  }

  countByChallengeAndStatus(
    challengeId: string,
    status: SubmissionStatus,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (s) => s.challengeId === challengeId && s.status === status,
      ).length,
    );
  }

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
    });
  }

  override seed(
    items: ChallengeSubmission[],
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.storage.set(item.id, item));
    });
  }
}
