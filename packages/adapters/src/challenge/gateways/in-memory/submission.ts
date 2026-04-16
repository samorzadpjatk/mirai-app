import type {
  ChallengeSubmissionGateway,
  ChallengeSubmissionDTO,
} from "@mirai-app/use-cases";
import type { SubmissionId, SubmissionStatus } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Challenge Submission Gateway for Testing
 *
 * Implements ChallengeSubmissionGateway port with in-memory storage.
 * Uses Map<string, ChallengeSubmissionDTO> keyed by submission ID.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryChallengeSubmissionGateway();
 * gateway.seed([mockSubmission]);
 *
 * const byChallenge = await Effect.runPromise(gateway.findByChallengeId("challenge-123"));
 * expect(byChallenge.items).toHaveLength(1);
 *
 * gateway.reset(); // Clear for next test
 * ```
 */
export class InMemoryChallengeSubmissionGateway
  extends InMemoryGateway<ChallengeSubmissionDTO>
  implements ChallengeSubmissionGateway
{
  create(
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.set(submission.id, submission);
      return submission;
    });
  }

  findById(
    id: SubmissionId,
  ): Effect.Effect<ChallengeSubmissionDTO | null, DatabaseError, never> {
    return Effect.sync(() => this.storage.get(id as string) ?? null);
  }

  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmissionDTO | null, DatabaseError, never> {
    return Effect.sync(() => {
      return (
        this.getAllItems().find(
          (s) => s.challengeId === challengeId && s.groupId === groupId,
        ) ?? null
      );
    });
  }

  findByChallengeId(
    challengeId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<
    {
      items: ChallengeSubmissionDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      let items = this.getAllItems().filter(
        (s) => s.challengeId === challengeId,
      );

      const total = items.length;
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      items = items.slice(offset, offset + limit);

      return {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      };
    });
  }

  findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Effect.Effect<
    {
      items: ChallengeSubmissionDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      let items = this.getAllItems().filter((s) => s.userId === userId);

      const total = items.length;
      const limit = options?.limit ?? 20;
      const offset = options?.offset ?? 0;

      items = items.slice(offset, offset + limit);

      return {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      };
    });
  }

  findByStatus(
    status: "PENDING" | "APPROVED" | "REJECTED",
  ): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never> {
    return Effect.sync(() => {
      return this.getAllItems().filter((s) => s.status === status);
    });
  }

  findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Effect.Effect<ChallengeSubmissionDTO[], DatabaseError, never> {
    return Effect.sync(() => {
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
          // Note: DTO doesn't have voteScore, use submittedAt as proxy
          if (orderDirection === "desc") {
            return b.submittedAt.getTime() - a.submittedAt.getTime();
          }
          return a.submittedAt.getTime() - b.submittedAt.getTime();
        } else {
          const aTime = a.submittedAt.getTime();
          const bTime = b.submittedAt.getTime();
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

      return items;
    });
  }

  update(
    submission: ChallengeSubmissionDTO,
  ): Effect.Effect<ChallengeSubmissionDTO, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.set(submission.id, submission);
      return submission;
    });
  }

  delete(id: SubmissionId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.delete(id as string);
    });
  }

  existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => {
      return this.getAllItems().some(
        (s) => s.challengeId === challengeId && s.groupId === groupId,
      );
    });
  }

  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      return this.getAllItems().filter((s) => s.challengeId === challengeId)
        .length;
    });
  }

  countByChallengeAndStatus(
    challengeId: string,
    status: "PENDING" | "APPROVED" | "REJECTED",
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      return this.getAllItems().filter(
        (s) => s.challengeId === challengeId && s.status === status,
      ).length;
    });
  }

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
    });
  }

  override seed(
    items: ChallengeSubmissionDTO[],
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      items.forEach((item) => this.storage.set(item.id, item));
    });
  }
}
