import { Effect, type Layer } from "effect";
import {
  getChallengeUseCase,
  createChallengeUseCase,
  updateChallengeUseCase,
  updateChallengeStatusUseCase,
  ChallengeRepositoryTag,
  type CreateChallengeInput,
  type UpdateChallengeInput,
  type UpdateChallengeStatusInput,
} from "@mirai-app/use-cases";
import {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
} from "./validators/challenge-validators";

export {
  validateGetByIdInput,
  validateGetByTripIdInput,
  validateCreateInput,
  validateUpdateInput,
  validateUpdateStatusInput,
  validateListInput,
  validateListByStatusInput,
};

import {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

/**
 * Input validation schemas for challenge controller
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
 * ChallengeController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class ChallengeController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a challenge by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          image: string | null;
          submissionType: string;
          scoringCategory: string;
          isRecurring: boolean;
          basePoints: number;
          status: string;
          startTime: Date | null;
          endTime: Date | null;
          targetLatitude: number | null;
          targetLongitude: number | null;
          expectedValue: string | null;
          autoApprove: boolean;
          createdAt: Date;
          isActive: boolean;
          isOpenForSubmission: boolean;
          requiresLocation: boolean;
          requiresQRCode: boolean;
          hasVotingPhase: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getChallengeUseCase({ challengeId: parsed.data.id });

    const result = await runWithLayer(effect, this.appLayer);
    return result as unknown as
      | {
          success: true;
          data: {
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            image: string | null;
            submissionType: string;
            scoringCategory: string;
            isRecurring: boolean;
            basePoints: number;
            status: string;
            startTime: Date | null;
            endTime: Date | null;
            targetLatitude: number | null;
            targetLongitude: number | null;
            expectedValue: string | null;
            autoApprove: boolean;
            createdAt: Date;
            isActive: boolean;
            isOpenForSubmission: boolean;
            requiresLocation: boolean;
            requiresQRCode: boolean;
            hasVotingPhase: boolean;
          };
        }
      | { success: false; error: string };
  }

  /**
   * Get challenges by trip ID
   */
  async getByTripId(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          submissionType: string;
          scoringCategory: string;
          status: string;
          basePoints: number;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = validateGetByTripIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* ChallengeRepositoryTag;
      const challenges = yield* repo.findByTripId(parsed.data.tripId);
      return challenges.map((challenge) => ({
        id: challenge.id,
        tripId: challenge.tripId,
        name: challenge.name,
        description: challenge.description,
        submissionType: challenge.submissionType,
        scoringCategory: challenge.scoringCategory,
        status: challenge.status,
        basePoints: challenge.basePoints,
        createdAt: challenge.createdAt,
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: Array<{
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            submissionType: string;
            scoringCategory: string;
            status: string;
            basePoints: number;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
  }

  /**
   * Create a new challenge
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          submissionType: string;
          scoringCategory: string;
          status: string;
          basePoints: number;
          createdAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateCreateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = createChallengeUseCase({
      tripId: parsed.data.tripId,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image,
      submissionType: parsed.data.submissionType as SubmissionType,
      scoringCategory: parsed.data.scoringCategory as ScoringCategory,
      isRecurring: parsed.data.isRecurring,
      dailyStartTime: parsed.data.dailyStartTime,
      dailyEndTime: parsed.data.dailyEndTime,
      basePoints: parsed.data.basePoints,
      firstPlacePoints: parsed.data.firstPlacePoints,
      secondPlacePoints: parsed.data.secondPlacePoints,
      thirdPlacePoints: parsed.data.thirdPlacePoints,
      status: parsed.data.status as ChallengeStatus,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      targetLatitude: parsed.data.targetLatitude,
      targetLongitude: parsed.data.targetLongitude,
      expectedValue: parsed.data.expectedValue,
      autoApprove: parsed.data.autoApprove,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            submissionType: string;
            scoringCategory: string;
            status: string;
            basePoints: number;
            createdAt: Date;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Update a challenge
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          basePoints: number;
          status: string;
          updatedAt: Date;
          isOpenForSubmission: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateUpdateInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateChallengeUseCase({
      challengeId: parsed.data.challengeId,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image,
      basePoints: parsed.data.basePoints,
      firstPlacePoints: parsed.data.firstPlacePoints,
      secondPlacePoints: parsed.data.secondPlacePoints,
      thirdPlacePoints: parsed.data.thirdPlacePoints,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      dailyStartTime: parsed.data.dailyStartTime,
      dailyEndTime: parsed.data.dailyEndTime,
      targetLatitude: parsed.data.targetLatitude,
      targetLongitude: parsed.data.targetLongitude,
      expectedValue: parsed.data.expectedValue,
      autoApprove: parsed.data.autoApprove,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            basePoints: number;
            status: string;
            updatedAt: Date;
            isOpenForSubmission: boolean;
          };
        }
      | { success: false; error: string }
  }

  /**
   * Update challenge status
   */
  async updateStatus(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          name: string;
          previousStatus: string;
          newStatus: string;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = validateUpdateStatusInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = updateChallengeStatusUseCase({
      challengeId: parsed.data.challengeId,
      newStatus: parsed.data.newStatus as ChallengeStatus,
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: {
            id: string;
            tripId: string;
            name: string;
            previousStatus: string;
            newStatus: string;
            updatedAt: Date;
          };
        }
      | { success: false; error: string }
  }

  /**
   * List all challenges with pagination
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          submissionType: string;
          scoringCategory: string;
          status: string;
          basePoints: number;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = validateListInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* ChallengeRepositoryTag;
      const challenges = yield* repo.findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      });
      return challenges.map((challenge) => ({
        id: challenge.id,
        tripId: challenge.tripId,
        name: challenge.name,
        description: challenge.description,
        submissionType: challenge.submissionType,
        scoringCategory: challenge.scoringCategory,
        status: challenge.status,
        basePoints: challenge.basePoints,
        createdAt: challenge.createdAt,
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: Array<{
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            submissionType: string;
            scoringCategory: string;
            status: string;
            basePoints: number;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
  }

  /**
   * List challenges by status
   */
  async listByStatus(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          submissionType: string;
          scoringCategory: string;
          status: string;
          basePoints: number;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = validateListByStatusInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* ChallengeRepositoryTag;
      const challenges = yield* repo.findByStatus(
        parsed.data.status as ChallengeStatus,
      );
      const paginated = challenges.slice(
        parsed.data.offset,
        parsed.data.offset + parsed.data.limit,
      );
      return paginated.map((challenge) => ({
        id: challenge.id,
        tripId: challenge.tripId,
        name: challenge.name,
        description: challenge.description,
        submissionType: challenge.submissionType,
        scoringCategory: challenge.scoringCategory,
        status: challenge.status,
        basePoints: challenge.basePoints,
        createdAt: challenge.createdAt,
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: Array<{
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            submissionType: string;
            scoringCategory: string;
            status: string;
            basePoints: number;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
  }

  /**
   * Find active challenges
   */
  async findActive(): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          submissionType: string;
          scoringCategory: string;
          status: string;
          basePoints: number;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const effect = Effect.gen(function* () {
      const repo = yield* ChallengeRepositoryTag;
      const challenges = yield* repo.findActive();
      return challenges.map((challenge) => ({
        id: challenge.id,
        tripId: challenge.tripId,
        name: challenge.name,
        description: challenge.description,
        submissionType: challenge.submissionType,
        scoringCategory: challenge.scoringCategory,
        status: challenge.status,
        basePoints: challenge.basePoints,
        createdAt: challenge.createdAt,
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: Array<{
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            submissionType: string;
            scoringCategory: string;
            status: string;
            basePoints: number;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
  }

  /**
   * Find challenges open for submission
   */
  async findOpenForSubmission(): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          submissionType: string;
          scoringCategory: string;
          status: string;
          basePoints: number;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    const effect = Effect.gen(function* () {
      const repo = yield* ChallengeRepositoryTag;
      const challenges = yield* repo.findOpenForSubmission();
      return challenges.map((challenge) => ({
        id: challenge.id,
        tripId: challenge.tripId,
        name: challenge.name,
        description: challenge.description,
        submissionType: challenge.submissionType,
        scoringCategory: challenge.scoringCategory,
        status: challenge.status,
        basePoints: challenge.basePoints,
        createdAt: challenge.createdAt,
      }));
    });

    return (await runWithLayer(effect, this.appLayer)) as unknown as 
      | {
          success: true;
          data: Array<{
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            submissionType: string;
            scoringCategory: string;
            status: string;
            basePoints: number;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
  }
}
