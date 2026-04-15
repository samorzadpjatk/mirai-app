import type { ChallengeVote, ChallengeVoteId } from "@mirai-app/domain";
import type { ChallengeVoteRepository } from "@mirai-app/domain/ports";
import { DatabaseError } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway } from "../_shared/in-memory-base";

/**
 * In-Memory ChallengeVote Gateway for Testing
 *
 * Implements ChallengeVoteRepository port with in-memory storage.
 * Uses Map<string, ChallengeVote> for storage, keyed by vote ID.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryChallengeVoteGateway();
 *
 * // Seed with test data
 * gateway.seed([mockVote1, mockVote2]);
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
  extends InMemoryGateway<ChallengeVote>
  implements ChallengeVoteRepository
{
  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, DatabaseError, never> {
    return this.createGeneric(vote);
  }

  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.sync(() => {
      votes.forEach((vote) => this.storage.set(vote.id as string, vote));
      return votes;
    });
  }

  findById(
    id: string,
  ): Effect.Effect<ChallengeVote | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((vote) => vote.challengeId === challengeId),
    );
  }

  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (vote) => vote.challengeId === challengeId && vote.voterId === voterId,
      ),
    );
  }

  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
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
          vote.position.value === position,
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
        .map((vote) => vote.position.value)
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
        this.storage.delete(vote.id as string);
      });
    });
  }

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.clear();
    });
  }

  override seed(votes: ChallengeVote[]): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      votes.forEach((vote) => this.storage.set(vote.id as string, vote));
    });
  }
}
