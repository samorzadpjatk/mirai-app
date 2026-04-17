import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import type {
  IChallengeVotePort,
  ChallengeVote,
} from "@mirai-app/use-cases/challenge-vote";

/**
 * In-Memory ChallengeVote Gateway
 *
 * Implements IChallengeVotePort using in-memory Map storage for testing.
 */
export class InMemoryChallengeVoteGateway implements IChallengeVotePort {
  private votes: Map<string, ChallengeVote> = new Map();

  findById(
    id: string,
  ): Effect.Effect<ChallengeVote | null, DatabaseError, never> {
    return Effect.sync(() => {
      const vote = this.votes.get(id);
      return vote ?? null;
    });
  }

  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.votes.values())
        .filter((vote) => vote.challengeId === challengeId)
        .sort((a, b) => a.votedAt.getTime() - b.votedAt.getTime());
    });
  }

  findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.votes.values())
        .filter(
          (vote) =>
            vote.challengeId === challengeId && vote.voterId === voterId,
        )
        .sort((a, b) => a.votedAt.getTime() - b.votedAt.getTime());
    });
  }

  create(
    vote: ChallengeVote,
  ): Effect.Effect<ChallengeVote, DatabaseError, never> {
    return Effect.sync(() => {
      this.votes.set(vote.id, vote);
      return vote;
    });
  }

  createMany(
    votes: ChallengeVote[],
  ): Effect.Effect<ChallengeVote[], DatabaseError, never> {
    return Effect.sync(() => {
      for (const vote of votes) {
        this.votes.set(vote.id, vote);
      }
      return votes;
    });
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.votes.delete(id);
    });
  }

  deleteByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      for (const [id, vote] of this.votes.entries()) {
        if (vote.challengeId === challengeId && vote.voterId === voterId) {
          this.votes.delete(id);
        }
      }
    });
  }

  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.votes.values()).filter(
        (vote) => vote.challengeId === challengeId,
      ).length;
    });
  }

  /**
   * Helper method to add a vote (for testing)
   */
  addVote(vote: ChallengeVote): void {
    this.votes.set(vote.id, vote);
  }

  /**
   * Helper method to clear all data (for testing)
   */
  clear(): void {
    this.votes.clear();
  }
}
