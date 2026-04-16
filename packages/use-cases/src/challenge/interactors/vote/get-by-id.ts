import {
  ChallengeVote,
  ValidationError,
  ChallengeVoteId,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeVoteGatewayTag } from "../../ports/vote/gateway";
import type { ChallengeVoteDTO } from "../../dto";

/**
 * Convert ChallengeVoteDTO to ChallengeVote domain entity
 */
function dtoToVote(
  dto: ChallengeVoteDTO,
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
 * Input for GetChallengeVoteById use case
 */
export interface GetChallengeVoteByIdInput {
  voteId: string;
}

/**
 * Output DTO for GetChallengeVoteById use case
 */
export interface GetChallengeVoteByIdOutput {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  position: number;
  points: number;
  weight: number;
  votedAt: Date;
}

/**
 * Error types for GetChallengeVoteById use case
 */
export class ChallengeVoteNotFoundError extends Data.TaggedError(
  "ChallengeVoteNotFoundError",
)<{
  message: string;
}> {}

export class ChallengeVoteGetRepositoryError extends Data.TaggedError(
  "ChallengeVoteGetRepositoryError",
)<{
  message: string;
}> {}

/**
 * GetChallengeVoteById Use Case
 *
 * Retrieves a vote by ID.
 * Returns error if vote not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getChallengeVoteByIdUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ChallengeVoteGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getChallengeVoteByIdUseCase(
  input: GetChallengeVoteByIdInput,
): Effect.Effect<
  GetChallengeVoteByIdOutput,
  ChallengeVoteNotFoundError | ChallengeVoteGetRepositoryError,
  ChallengeVoteGatewayTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteGatewayTag;

    // Find vote by ID
    const voteDto = yield* voteRepo
      .findById(ChallengeVoteId.unsafeCreate(input.voteId))
      .pipe(
        Effect.mapError(
          () =>
            new ChallengeVoteGetRepositoryError({
              message: "Failed to retrieve vote",
            }),
        ),
      );

    if (!voteDto) {
      return yield* Effect.fail(
        new ChallengeVoteNotFoundError({ message: "Vote not found" }),
      );
    }

    // Convert DTO to domain entity
    const vote = yield* dtoToVote(voteDto).pipe(
      Effect.mapError(
        () =>
          new ChallengeVoteGetRepositoryError({
            message: "Failed to process vote data",
          }),
      ),
    );

    return toOutput(vote);
  });
}

function toOutput(vote: ChallengeVote): GetChallengeVoteByIdOutput {
  return {
    id: vote.id,
    challengeId: vote.challengeId,
    submissionId: vote.submissionId,
    voterId: vote.voterId,
    position: vote.position.value,
    points: vote.points,
    weight: vote.weight.value,
    votedAt: vote.votedAt,
  };
}
