import type {
  ChallengeVoteGateway,
  ChallengeVoteDTO,
  ChallengeVoteConnectionArgs,
} from "@mirai-app/use-cases";
import { DatabaseError, type Connection } from "@mirai-app/domain";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory ChallengeVote Gateway for Testing
 *
 * Implements ChallengeVoteGateway port with in-memory storage.
 * Uses Map<string, ChallengeVoteDTO> for storage, keyed by vote ID.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryChallengeVoteGateway();
 *
 * // Seed with test data
 * gateway.seed([mockVoteDTO1, mockVoteDTO2]);
 *
 * // Find votes by challenge
 * const votes = await Effect.runPromise(gateway.findByChallengeId("challenge-123"));
 * expect(votes).toHaveLength(2);
 *
 * // Check if user has voted
 * const hasVoted = await Effect.runPromise(gateway.hasVoted("challenge-123", "user-456"));
 * expect(hasVoted).toBe(true);
 *
 * // Clean up after test
 * gateway.reset();
 * ```
 */
export class InMemoryChallengeVoteGateway
  extends InMemoryGateway<ChallengeVoteDTO>
  implements ChallengeVoteGateway
{
  create(
    vote: ChallengeVoteDTO,
  ): Effect.Effect<ChallengeVoteDTO, DatabaseError, never> {
    return this.createGeneric(vote);
  }

  createMany(
    votes: ChallengeVoteDTO[],
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.sync(() => {
      votes.forEach((vote) => this.storage.set(vote.id, vote));
      return votes;
    });
  }

  findById(
    id: string,
  ): Effect.Effect<ChallengeVoteDTO | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((vote) => vote.challengeId === challengeId),
    );
  }

  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
      ),
    );
  }

  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<ChallengeVoteDTO[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((vote) => vote.submissionId === submissionId),
    );
  }

  hasVoted(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
      ),
    );
  }

  hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (vote) =>
          vote.challengeId === challengeId &&
          vote.voterId === voterId &&
          vote.votePosition === position,
      ),
    );
  }

  getVotedPositions(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<number[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter(
          (vote) =>
            vote.challengeId === challengeId && vote.voterId === voterId,
        )
        .map((vote) => vote.votePosition)
        .sort((a, b) => a - b),
    );
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  deleteByChallengeId(
    challengeId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const votesToDelete = this.getAllItems().filter(
        (vote) => vote.challengeId === challengeId,
      );
      votesToDelete.forEach((vote) => {
        this.storage.delete(vote.id);
      });
    });
  }

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.clear();
    });
  }

  override seed(votes: ChallengeVoteDTO[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      votes.forEach((vote) => this.storage.set(vote.id, vote));
    });
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find votes by challenge ID with cursor-based pagination
   * Sorts by createdAt (votedAt), then id, then slices
   */
  findByChallengeIdConnection(
    challengeId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, never, never> {
    return this.executeConnectionQuery(
      challengeId,
      args,
      (vote) => vote.challengeId === challengeId,
    );
  }

  /**
   * Find votes by challenge and voter with cursor-based pagination
   * Sorts by createdAt (votedAt), then id, then slices
   */
  findByChallengeAndVoterConnection(
    challengeId: string,
    voterId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, never, never> {
    return this.executeConnectionQuery(
      challengeId,
      args,
      (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
    );
  }

  /**
   * Find votes by submission ID with cursor-based pagination
   * Sorts by createdAt (votedAt), then id, then slices
   */
  findBySubmissionIdConnection(
    submissionId: string,
    args: ChallengeVoteConnectionArgs,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, never, never> {
    return this.executeConnectionQuery(
      submissionId,
      args,
      (vote) => vote.submissionId === submissionId,
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Sorts by votedAt (createdAt), then id, then slices
   */
  private executeConnectionQuery(
    _filterValue: string,
    args: ChallengeVoteConnectionArgs,
    filterFn: (vote: ChallengeVoteDTO) => boolean,
  ): Effect.Effect<Connection<ChallengeVoteDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all votes matching the filter
      let votes = this.getAllItems().filter(filterFn);

      // Sort by votedAt ascending, then by id as tiebreaker
      votes.sort((a, b) => {
        const timeCompare = a.votedAt.getTime() - b.votedAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = votes.findIndex(
          (v) =>
            v.votedAt > cursorDate ||
            (v.votedAt.getTime() === cursorDate.getTime() && v.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = votes.length;
        }
      }

      // Slice to get the page
      const items = votes.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < votes.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.votedAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
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
