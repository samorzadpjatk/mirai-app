import { Data, Effect } from "effect";
import {
  ChallengeVote,
  ValidationError,
  ChallengeVoteId,
} from "@mirai-app/domain";
import { ChallengeVoteGatewayTag } from "../../ports/vote/gateway";
import type { ChallengeVoteDTO as ImportedChallengeVoteDTO } from "../../dto";

/**
 * Convert ChallengeVoteDTO to ChallengeVote domain entity
 */
function dtoToVote(
  dto: ImportedChallengeVoteDTO,
): Effect.Effect<ChallengeVote, ValidationError, never> {
  return ChallengeVote.create({
    id: ChallengeVoteId.unsafeCreate(dto.id),
    challengeId: dto.challengeId,
    submissionId: dto.submissionId,
    voterId: dto.voterId,
    position: dto.votePosition,
    points: dto.votePoints,
    weight: dto.normalizedWeight,
    votedAt: dto.votedAt,
  });
}

/**
 * Input for GetVotesByChallenge use case
 */
export interface GetVotesByChallengeInput {
  challengeId: string;
}

/**
 * Output vote DTO
 */
export interface ChallengeVoteDTO {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
}

/**
 * Output DTO for GetVotesByChallenge use case
 */
export interface GetVotesByChallengeOutput {
  votes: ChallengeVoteDTO[];
  totalVotes: number;
  uniqueVoters: number;
}

/**
 * Error types for GetVotesByChallenge use case
 */
export class GetVotesByChallengeValidationError extends Data.TaggedError(
  "GetVotesByChallengeValidationError",
)<{
  message: string;
}> {}

export class GetVotesByChallengeRepositoryError extends Data.TaggedError(
  "GetVotesByChallengeRepositoryError",
)<{
  message: string;
}> {}

/**
 * GetVotesByChallenge Use Case (Effect-based)
 *
 * Retrieves all votes for a specific challenge.
 * Typically used by moderators/admins to view voting results.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getVotesByChallengeUseCase(input);
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getVotesByChallengeUseCase(
  input: GetVotesByChallengeInput,
): Effect.Effect<
  GetVotesByChallengeOutput,
  GetVotesByChallengeValidationError | GetVotesByChallengeRepositoryError,
  ChallengeVoteGatewayTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteGatewayTag;

    // Validate input
    if (!input.challengeId || input.challengeId.trim() === "") {
      return yield* Effect.fail(
        new GetVotesByChallengeValidationError({
          message: "challengeId is required",
        }),
      );
    }

    // Fetch all votes
    const voteDtos = yield* voteRepo.findByChallengeId(input.challengeId).pipe(
      Effect.mapError(
        () =>
          new GetVotesByChallengeRepositoryError({
            message: "Failed to retrieve votes",
          }),
      ),
    );

    // Convert DTOs to domain entities
    const votes = yield* Effect.all(
      voteDtos.map((dto) => dtoToVote(dto)),
      { mode: "either" },
    ).pipe(
      Effect.map((results) =>
        results
          .filter((r): r is typeof r & { _tag: "Right" } => r._tag === "Right")
          .map((r) => r.right),
      ),
      Effect.mapError(
        () =>
          new GetVotesByChallengeRepositoryError({
            message: "Failed to process vote data",
          }),
      ),
    );

    // Sort by voterId then position
    const sortedVotes = [...votes].sort((a, b) => {
      if (a.voterId !== b.voterId) {
        return a.voterId.localeCompare(b.voterId);
      }
      return a.position.value - b.position.value;
    });

    // Count unique voters
    const uniqueVoterIds = new Set(votes.map((v) => v.voterId));

    return {
      votes: sortedVotes.map((v) => toDTO(v)),
      totalVotes: sortedVotes.length,
      uniqueVoters: uniqueVoterIds.size,
    };
  });
}

function toDTO(vote: ChallengeVote): ChallengeVoteDTO {
  return {
    id: vote.id as string,
    challengeId: vote.challengeId,
    submissionId: vote.submissionId,
    voterId: vote.voterId,
    votePosition: vote.position.value,
    votePoints: vote.points,
    normalizedWeight: vote.weight.value,
    votedAt: vote.votedAt,
  };
}
