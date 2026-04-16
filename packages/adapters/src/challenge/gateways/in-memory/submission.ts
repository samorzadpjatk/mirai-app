import type {
  ChallengeSubmissionGateway,
  ChallengeSubmissionDTO,
  ChallengeSubmissionVoteScoreConnectionArgs,
  ChallengeSubmissionCreatedAtConnectionArgs,
} from "@mirai-app/use-cases";
import type { SubmissionId, SubmissionStatus } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";
import type { Connection } from "@mirai-app/domain";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

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
          // Higher voteScore comes first
          if (orderDirection === "desc") {
            if (b.voteScore !== a.voteScore) {
              return b.voteScore - a.voteScore;
            }
          } else {
            if (a.voteScore !== b.voteScore) {
              return a.voteScore - b.voteScore;
            }
          }
          // Tie-breaker: earlier createdAt comes first
          const dateDiff = a.submittedAt.getTime() - b.submittedAt.getTime();
          if (dateDiff !== 0) return dateDiff;
          // Final tie-breaker: id
          return a.id.localeCompare(b.id);
        } else {
          // createdAt sorting
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find submissions by challenge ID with cursor-based pagination
   * Uses (voteScore, id) sort for peer voting challenges
   * Returns highest scoring submissions first
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeSubmissionVoteScoreConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all submissions for the challenge
      let items = this.getAllItems().filter(
        (s) => s.challengeId === challengeId,
      );

      // Sort by voteScore descending, then by id as tiebreaker
      items.sort((a, b) => {
        if (b.voteScore !== a.voteScore) {
          return b.voteScore - a.voteScore;
        }
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        startIndex = items.findIndex(
          (s) =>
            s.voteScore < cursor.voteScore ||
            (s.voteScore === cursor.voteScore && s.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.submittedAt.toISOString(),
          voteScore: item.voteScore,
        }),
      }));

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }

  /**
   * Find submissions by challenge ID with cursor-based pagination sorted by createdAt
   * Uses (createdAt, id) sort for chronological ordering
   */
  findByChallengeIdByCreatedAtConnection(
    challengeId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return this.executeCreatedAtConnectionQuery(
      (s) => s.challengeId === challengeId,
      args,
    );
  }

  /**
   * Find all submissions by a group with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByGroupIdConnection(
    groupId: string,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return this.executeCreatedAtConnectionQuery(
      (s) => s.groupId === groupId,
      args,
    );
  }

  /**
   * Find submissions by status with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByStatusConnection(
    status: "PENDING" | "APPROVED" | "REJECTED",
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return this.executeCreatedAtConnectionQuery(
      (s) => s.status === status,
      args,
    );
  }

  /**
   * Find submissions with advanced filtering and cursor-based pagination
   * Uses (voteScore, id) or (createdAt, id) sort depending on params.orderBy
   */
  findManyConnection(params: {
    challengeId?: string;
    groupId?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    first?: number;
    after?:
      | ChallengeSubmissionCreatedAtConnectionArgs["after"]
      | ChallengeSubmissionVoteScoreConnectionArgs["after"]
      | null;
  }): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const first = Math.min(params.first ?? 20, 100);
      const cursor = params.after;
      const orderBy = params.orderBy ?? "createdAt";
      const orderDirection = params.orderDirection ?? "desc";

      // Filter items
      let items = this.getAllItems().filter((s) => {
        if (params.challengeId && s.challengeId !== params.challengeId)
          return false;
        if (params.groupId && s.groupId !== params.groupId) return false;
        if (params.status && s.status !== params.status) return false;
        return true;
      });

      // Sort based on orderBy
      if (orderBy === "voteScore") {
        items.sort((a, b) => {
          if (orderDirection === "desc") {
            if (b.voteScore !== a.voteScore) {
              return b.voteScore - a.voteScore;
            }
          } else {
            if (a.voteScore !== b.voteScore) {
              return a.voteScore - b.voteScore;
            }
          }
          return a.id.localeCompare(b.id);
        });
      } else {
        items.sort((a, b) => {
          const aTime = a.submittedAt.getTime();
          const bTime = b.submittedAt.getTime();
          if (orderDirection === "desc") {
            if (bTime !== aTime) return bTime - aTime;
          } else {
            if (aTime !== bTime) return aTime - bTime;
          }
          return a.id.localeCompare(b.id);
        });
      }

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        if (
          orderBy === "voteScore" &&
          "voteScore" in cursor &&
          typeof cursor.voteScore === "number"
        ) {
          startIndex = items.findIndex(
            (s) =>
              (orderDirection === "desc" && s.voteScore < cursor.voteScore) ||
              (orderDirection === "asc" && s.voteScore > cursor.voteScore) ||
              (s.voteScore === cursor.voteScore && s.id > cursor.id),
          );
        } else {
          const cursorDate = new Date(cursor.createdAt);
          startIndex = items.findIndex(
            (s) =>
              (orderDirection === "desc" && s.submittedAt < cursorDate) ||
              (orderDirection === "asc" && s.submittedAt > cursorDate) ||
              (s.submittedAt.getTime() === cursorDate.getTime() &&
                s.id > cursor.id),
          );
        }
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => {
        const cursorData: {
          id: string;
          createdAt: string;
          voteScore?: number;
        } = {
          id: item.id,
          createdAt: item.submittedAt.toISOString(),
        };
        if (orderBy === "voteScore") {
          cursorData.voteScore = item.voteScore;
        }
        return {
          node: item,
          cursor: encodeCursor(cursorData),
        };
      });

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }

  /**
   * Internal helper to execute createdAt-based connection queries
   */
  private executeCreatedAtConnectionQuery(
    filterFn: (submission: ChallengeSubmissionDTO) => boolean,
    args: ChallengeSubmissionCreatedAtConnectionArgs,
  ): Effect.Effect<Connection<ChallengeSubmissionDTO>, DatabaseError, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all submissions matching the filter
      let items = this.getAllItems().filter(filterFn);

      // Sort by createdAt descending, then by id as tiebreaker
      items.sort((a, b) => {
        const timeCompare = b.submittedAt.getTime() - a.submittedAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = items.findIndex(
          (s) =>
            s.submittedAt < cursorDate ||
            (s.submittedAt.getTime() === cursorDate.getTime() &&
              s.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = items.length;
        }
      }

      // Slice to get the page
      const pageItems = items.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < items.length;

      // Build edges with cursors
      const edges = pageItems.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.submittedAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: pageItems,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }
}
