import {
  ChallengeVote,
  ValidationError,
  ChallengeVoteId,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { ChallengeVoteGatewayTag } from "../../ports/vote/gateway";
import type { ChallengeVoteDTO } from "../../dto";

/**
 * Convert ChallengeVote domain entity to ChallengeVoteDTO
 */
function toDTO(vote: ChallengeVote): ChallengeVoteDTO {
  return {
    id: vote.id,
    challengeId: vote.challengeId,
    submissionId: vote.submissionId,
    voterId: vote.voterId,
    votePosition: vote.position.value,
    votePoints: vote.points,
    normalizedWeight: vote.weight.value,
    votedAt: vote.votedAt,
  };
}

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
 * Input for UpdateChallengeVote use case
 */
export interface UpdateChallengeVoteInput {
  voteId: string;
  position?: number;
  points?: number;
  weight?: number;
}

/**
 * Output DTO for UpdateChallengeVote use case
 */
export interface UpdateChallengeVoteOutput {
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
 * Error types for UpdateChallengeVote use case
 */
export class ChallengeVoteNotFoundError extends Data.TaggedError(
  "ChallengeVoteNotFoundError",
)<{
  message: string;
}> {}

export class ChallengeVoteValidationError extends Data.TaggedError(
  "ChallengeVoteValidationError",
)<{
  message: string;
}> {}

export class ChallengeVoteUpdateRepositoryError extends Data.TaggedError(
  "ChallengeVoteUpdateRepositoryError",
)<{
  message: string;
}> {}

/**
 * UpdateChallengeVote Use Case
 *
 * Updates an existing vote.
 * Returns error if vote not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateChallengeVoteUseCase(input);
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
export function updateChallengeVoteUseCase(
  input: UpdateChallengeVoteInput,
): Effect.Effect<
  UpdateChallengeVoteOutput,
  | ChallengeVoteNotFoundError
  | ChallengeVoteValidationError
  | ChallengeVoteUpdateRepositoryError,
  ChallengeVoteGatewayTag
> {
  return Effect.gen(function* () {
    const voteRepo = yield* ChallengeVoteGatewayTag;

    // Check if vote exists
    const existingDto = yield* voteRepo
      .findById(ChallengeVoteId.unsafeCreate(input.voteId))
      .pipe(
        Effect.mapError(
          () =>
            new ChallengeVoteUpdateRepositoryError({
              message: "Failed to load existing vote",
            }),
        ),
      );

    if (!existingDto) {
      return yield* Effect.fail(
        new ChallengeVoteNotFoundError({ message: "Vote not found" }),
      );
    }

    // Create updated vote DTO with new values
    const updatedDto: ChallengeVoteDTO = {
      id: existingDto.id,
      challengeId: existingDto.challengeId,
      submissionId: existingDto.submissionId,
      voterId: existingDto.voterId,
      votePosition: input.position ?? existingDto.votePosition,
      votePoints: input.points ?? existingDto.votePoints,
      normalizedWeight: input.weight ?? existingDto.normalizedWeight,
      votedAt: existingDto.votedAt,
    };

    // Convert to domain entity for validation
    const vote = yield* dtoToVote(updatedDto).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new ChallengeVoteValidationError({
            message: validationError.message,
          }),
      ),
    );

    // Save to repository (convert back to DTO)
    const savedDto = yield* voteRepo.create(toDTO(vote)).pipe(
      Effect.mapError(
        () =>
          new ChallengeVoteUpdateRepositoryError({
            message: "Failed to update vote",
          }),
      ),
    );

    // Convert saved DTO back to domain entity for output
    const saved = yield* dtoToVote(savedDto).pipe(
      Effect.mapError(
        () =>
          new ChallengeVoteUpdateRepositoryError({
            message: "Failed to process saved vote",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(vote: ChallengeVote): UpdateChallengeVoteOutput {
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
