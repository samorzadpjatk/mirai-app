import { Effect, type Layer } from "effect";
import {
  createSubmissionUseCase,
  getSubmissionUseCase,
  getSubmissionByChallengeAndGroupUseCase,
  updateSubmissionUseCase,
  deleteSubmissionUseCase,
  listSubmissionsByChallengeUseCase,
  ChallengeSubmissionRepositoryTag,
  type CreateSubmissionInput,
  type UpdateSubmissionInput,
  type GetSubmissionOutput,
  type GetSubmissionByChallengeAndGroupOutput,
  type ListSubmissionsByChallengeOutput,
  type CreateSubmissionOutput,
  type UpdateSubmissionOutput,
} from "@mirai-app/use-cases";
import {
  validateGetByIdInput,
  validateGetByChallengeAndGroupInput,
  validateGetByChallengeInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
} from "./validators/submission-schema";

export {
  validateGetByIdInput,
  validateGetByChallengeAndGroupInput,
  validateGetByChallengeInput,
  validateCreateInput,
  validateUpdateInput,
  validateDeleteInput,
};

import { SubmissionId } from "@mirai-app/domain";

/**
 * Helper type to convert branded SubmissionId to string in DTOs
 * This ensures API returns primitive types, not branded types
 */
type ConvertSubmissionId<T> = T extends { id: SubmissionId }
  ? Omit<T, "id"> & { id: string }
  : T;

/**
 * Convert DTO with branded SubmissionId to API-compatible DTO with string id
 */
function convertDtoWithSubmissionId<T extends { id: SubmissionId }>(
  dto: T,
): ConvertSubmissionId<T> {
  return {
    ...dto,
    id: SubmissionId.toString(dto.id),
  } as ConvertSubmissionId<T>;
}

/**
 * API-ready DTO types (branded IDs converted to strings)
 */
type ApiGetSubmissionOutput = ConvertSubmissionId<GetSubmissionOutput>;
type ApiGetSubmissionByChallengeAndGroupOutput =
  ConvertSubmissionId<GetSubmissionByChallengeAndGroupOutput>;
type ApiCreateSubmissionOutput = ConvertSubmissionId<CreateSubmissionOutput>;
type ApiUpdateSubmissionOutput = ConvertSubmissionId<UpdateSubmissionOutput>;

/**
 * Convert list output with branded IDs to API-compatible output
 */
function convertListOutput(output: ListSubmissionsByChallengeOutput): {
  submissions: Array<
    ConvertSubmissionId<ListSubmissionsByChallengeOutput["submissions"][number]>
  >;
  totalCount: number;
} {
  return {
    submissions: output.submissions.map((s) => convertDtoWithSubmissionId(s)),
    totalCount: output.totalCount,
  };
}

/**
 * Input validation schemas for challenge submission controller
 */

/**
 * Helper to run an Effect with the provided Layer and convert to controller result
 */
async function runWithLayer<T>(
  effect: Effect.Effect<T, unknown, unknown>,
  layer: Layer.Layer<unknown>,
  transform?: (value: T) => unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  const provided = effect.pipe(Effect.provide(layer));
  const result = await Effect.runPromise(Effect.either(provided));

  if (result._tag === "Left") {
    const error = result.left;
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }

  return {
    success: true,
    data: transform ? transform(result.right) : result.right,
  };
}

/**
 * ChallengeSubmissionController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class ChallengeSubmissionController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a submission by ID
   */
  async getById(input: unknown) {
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getSubmissionUseCase({
      submissionId: SubmissionId.unsafeCreate(parsed.data.submissionId),
    });
    const result = await runWithLayer(effect, this.appLayer);
    if (!result.success) return result;
    return {
      success: true,
      data: convertDtoWithSubmissionId(result.data as GetSubmissionOutput),
    };
  }

  /**
   * Get a submission by challenge ID and group ID
   */
  async getByChallengeAndGroup(input: unknown) {
    const parsed = validateGetByChallengeAndGroupInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getSubmissionByChallengeAndGroupUseCase({
      challengeId: parsed.data.challengeId,
      groupId: parsed.data.groupId,
    });
    const result = await runWithLayer(effect, this.appLayer);
    if (!result.success) return result;
    const apiData = result.data
      ? convertDtoWithSubmissionId(
          result.data as GetSubmissionByChallengeAndGroupOutput,
        )
      : null;
    return { success: true, data: apiData };
  }

  /**
   * List submissions for a challenge
   */
  async listByChallenge(input: unknown) {
    const parsed = validateGetByChallengeInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = listSubmissionsByChallengeUseCase({
      challengeId: parsed.data.challengeId,
      orderBy: parsed.data.orderBy,
      orderDirection: parsed.data.orderDirection,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
    const result = await runWithLayer(effect, this.appLayer);
    if (!result.success) return result;
    return {
      success: true,
      data: convertListOutput(result.data as ListSubmissionsByChallengeOutput),
    };
  }

  /**
   * Create a new submission
   */
  async create(input: unknown) {
    const parsed = validateCreateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const createInput: CreateSubmissionInput = {
      challengeId: parsed.data.challengeId,
      groupId: parsed.data.groupId,
      imageIds: parsed.data.imageIds,
      videoId: parsed.data.videoId,
      textContent: parsed.data.textContent,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    };

    const effect = createSubmissionUseCase(createInput);
    const result = await runWithLayer(effect, this.appLayer);
    if (!result.success) return result;
    return {
      success: true,
      data: convertDtoWithSubmissionId(result.data as CreateSubmissionOutput),
    };
  }

  /**
   * Update a submission (content or review)
   */
  async update(input: unknown) {
    const parsed = validateUpdateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const updateInput: UpdateSubmissionInput = {
      submissionId: SubmissionId.unsafeCreate(parsed.data.submissionId),
      imageIds: parsed.data.imageIds,
      videoId: parsed.data.videoId,
      textContent: parsed.data.textContent,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      reviewAction: parsed.data.reviewAction,
      reviewedById: parsed.data.reviewedById,
      rejectionReason: parsed.data.rejectionReason,
      awardedPoints: parsed.data.awardedPoints,
      bonusPoints: parsed.data.bonusPoints,
      ranking: parsed.data.ranking ?? undefined,
    };

    const effect = updateSubmissionUseCase(updateInput);
    const result = await runWithLayer(effect, this.appLayer);
    if (!result.success) return result;
    return {
      success: true,
      data: convertDtoWithSubmissionId(result.data as UpdateSubmissionOutput),
    };
  }

  /**
   * Delete a submission
   */
  async delete(input: unknown) {
    const parsed = validateDeleteInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = deleteSubmissionUseCase({
      submissionId: SubmissionId.unsafeCreate(parsed.data.submissionId),
    });
    return await runWithLayer(effect, this.appLayer);
  }

  /**
   * Get submissions by group ID
   */
  async getByGroupId(input: { groupId: string }): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          challengeId: string;
          groupId: string;
          imageIds: string[];
          videoId: string | null;
          textContent: string | null;
          latitude: number | null;
          longitude: number | null;
          status: string;
          reviewedById: string | null;
          reviewedAt: Date | null;
          rejectionReason: string | null;
          awardedPoints: number;
          bonusPoints: number;
          ranking: number | null;
          voteCount: number;
          voteScore: number;
          createdAt: Date;
          updatedAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const program = Effect.gen(function* () {
      const submissionRepo = yield* ChallengeSubmissionRepositoryTag;
      const submissions = yield* submissionRepo.findByGroupId(input.groupId);

      return submissions.map((s) => ({
        id: SubmissionId.toString(s.id),
        challengeId: s.challengeId,
        groupId: s.groupId,
        imageIds: s.imageIds,
        videoId: s.videoId,
        textContent: s.textContent,
        latitude: s.latitude,
        longitude: s.longitude,
        status: s.status,
        reviewedById: s.reviewedById,
        reviewedAt: s.reviewedAt,
        rejectionReason: s.rejectionReason,
        awardedPoints: s.awardedPoints,
        bonusPoints: s.bonusPoints,
        ranking: s.ranking,
        voteCount: s.voteCount,
        voteScore: s.voteScore,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    });

    const result = await runWithLayer(program, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: result.data as Array<{
        id: string;
        challengeId: string;
        groupId: string;
        imageIds: string[];
        videoId: string | null;
        textContent: string | null;
        latitude: number | null;
        longitude: number | null;
        status: string;
        reviewedById: string | null;
        reviewedAt: Date | null;
        rejectionReason: string | null;
        awardedPoints: number;
        bonusPoints: number;
        ranking: number | null;
        voteCount: number;
        voteScore: number;
        createdAt: Date;
        updatedAt: Date;
      }>,
    };
  }
}
