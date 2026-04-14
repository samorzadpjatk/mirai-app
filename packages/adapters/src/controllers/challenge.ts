import { z } from "zod";
import { Effect, type Layer } from "effect";
import {
  getChallengeUseCase,
  createChallengeUseCase,
  updateChallengeUseCase,
  updateChallengeStatusUseCase,
  type CreateChallengeInput,
  type UpdateChallengeInput,
  type UpdateChallengeStatusInput,
} from "@mirai-app/use-cases";
import {
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";

/**
 * Input validation schemas for challenge controller
 */
const schemas = {
  getById: z.object({
    id: z.string().uuid("Invalid challenge ID format"),
  }),

  getByTripId: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
  }),

  create: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be at most 200 characters"),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .nullable()
      .optional(),
    image: z.string().url("Invalid image URL").nullable().optional(),
    submissionType: z.enum([
      "IMAGE",
      "MULTI_IMAGE",
      "VIDEO",
      "TEXT",
      "IMAGE_LOCATION",
      "LOCATION",
      "QR_CODE",
    ]),
    scoringCategory: z.enum([
      "SPEED",
      "UNLIMITED",
      "JUDGED_STAFF",
      "PEER_VOTING",
    ]),
    isRecurring: z.boolean().default(false),
    dailyStartTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .nullable()
      .optional(),
    dailyEndTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .nullable()
      .optional(),
    basePoints: z.number().int().min(0).max(10000).default(100),
    firstPlacePoints: z.number().int().min(0).nullable().optional(),
    secondPlacePoints: z.number().int().min(0).nullable().optional(),
    thirdPlacePoints: z.number().int().min(0).nullable().optional(),
    status: z
      .enum([
        "HIDDEN",
        "VISIBLE",
        "ACTIVE",
        "VOTING_PHASE",
        "COMPLETED",
        "CANCELLED",
      ])
      .default("HIDDEN"),
    startTime: z.coerce.date().nullable().optional(),
    endTime: z.coerce.date().nullable().optional(),
    targetLatitude: z.number().min(-90).max(90).nullable().optional(),
    targetLongitude: z.number().min(-180).max(180).nullable().optional(),
    expectedValue: z.string().max(500).nullable().optional(),
    autoApprove: z.boolean().default(false),
  }),

  update: z.object({
    challengeId: z.string().uuid("Invalid challenge ID format"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be at most 200 characters")
      .optional(),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .nullable()
      .optional(),
    image: z.string().url("Invalid image URL").nullable().optional(),
    basePoints: z.number().int().min(0).max(10000).optional(),
    firstPlacePoints: z.number().int().min(0).nullable().optional(),
    secondPlacePoints: z.number().int().min(0).nullable().optional(),
    thirdPlacePoints: z.number().int().min(0).nullable().optional(),
    startTime: z.coerce.date().nullable().optional(),
    endTime: z.coerce.date().nullable().optional(),
    dailyStartTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .nullable()
      .optional(),
    dailyEndTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)")
      .nullable()
      .optional(),
    targetLatitude: z.number().min(-90).max(90).nullable().optional(),
    targetLongitude: z.number().min(-180).max(180).nullable().optional(),
    expectedValue: z.string().max(500).nullable().optional(),
    autoApprove: z.boolean().optional(),
  }),

  updateStatus: z.object({
    challengeId: z.string().uuid("Invalid challenge ID format"),
    newStatus: z.enum([
      "HIDDEN",
      "VISIBLE",
      "ACTIVE",
      "VOTING_PHASE",
      "COMPLETED",
      "CANCELLED",
    ]),
  }),

  list: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  listByStatus: z.object({
    status: z.enum([
      "HIDDEN",
      "VISIBLE",
      "ACTIVE",
      "VOTING_PHASE",
      "COMPLETED",
      "CANCELLED",
    ]),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),
};

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
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getChallengeUseCase({ challengeId: parsed.data.id });

    return await runWithLayer(effect, this.appLayer);
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
    const parsed = schemas.getByTripId.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findByTripId(parsed.data.tripId)
      .pipe(
        Effect.map((challenges) =>
          challenges.map((challenge) => ({
            id: challenge.id,
            tripId: challenge.tripId,
            name: challenge.name,
            description: challenge.description,
            submissionType: challenge.submissionType,
            scoringCategory: challenge.scoringCategory,
            status: challenge.status,
            basePoints: challenge.basePoints,
            createdAt: challenge.createdAt,
          })),
        ),
      );

    return await runWithLayer(effect, this.appLayer);
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
    const parsed = schemas.create.safeParse(input);
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

    return await runWithLayer(effect, this.appLayer);
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
    const parsed = schemas.update.safeParse(input);
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

    return await runWithLayer(effect, this.appLayer);
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
    const parsed = schemas.updateStatus.safeParse(input);
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

    return await runWithLayer(effect, this.appLayer);
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
    const parsed = schemas.list.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      })
      .pipe(
        Effect.map((challenges) =>
          challenges.map((challenge) => ({
            id: challenge.id,
            tripId: challenge.tripId,
            name: challenge.name,
            description: challenge.description,
            submissionType: challenge.submissionType,
            scoringCategory: challenge.scoringCategory,
            status: challenge.status,
            basePoints: challenge.basePoints,
            createdAt: challenge.createdAt,
          })),
        ),
      );

    return await runWithLayer(effect, this.appLayer);
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
    const parsed = schemas.listByStatus.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = 
      .findByStatus(parsed.data.status as ChallengeStatus)
      .pipe(
        Effect.map((challenges) => {
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
        }),
      );

    return await runWithLayer(effect, this.appLayer);
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
    const effect = .findActive().pipe(
      Effect.map((challenges) =>
        challenges.map((challenge) => ({
          id: challenge.id,
          tripId: challenge.tripId,
          name: challenge.name,
          description: challenge.description,
          submissionType: challenge.submissionType,
          scoringCategory: challenge.scoringCategory,
          status: challenge.status,
          basePoints: challenge.basePoints,
          createdAt: challenge.createdAt,
        })),
      ),
    );

    return await runWithLayer(effect, this.appLayer);
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
    const effect = .findOpenForSubmission().pipe(
      Effect.map((challenges) =>
        challenges.map((challenge) => ({
          id: challenge.id,
          tripId: challenge.tripId,
          name: challenge.name,
          description: challenge.description,
          submissionType: challenge.submissionType,
          scoringCategory: challenge.scoringCategory,
          status: challenge.status,
          basePoints: challenge.basePoints,
          createdAt: challenge.createdAt,
        })),
      ),
    );

    return await runWithLayer(effect, this.appLayer);
  }
}
