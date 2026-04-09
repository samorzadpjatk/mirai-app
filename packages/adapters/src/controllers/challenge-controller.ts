import { z } from "zod";
import type { ChallengeRepository } from "@repo/use-cases";
import {
  GetChallengeUseCase,
  CreateChallengeUseCase,
  UpdateChallengeUseCase,
  UpdateChallengeStatusUseCase,
  type CreateChallengeInput,
  type UpdateChallengeInput,
  type UpdateChallengeStatusInput,
} from "@repo/use-cases";
import { ChallengeStatus, SubmissionType, ScoringCategory } from "@repo/domain";

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
 * ChallengeController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class ChallengeController {
  constructor(private challengeRepository: ChallengeRepository) {}

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

    const useCase = new GetChallengeUseCase(this.challengeRepository);
    const result = await useCase.execute({ challengeId: parsed.data.id });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const challenges = await this.challengeRepository.findByTripId(
      parsed.data.tripId,
    );

    return {
      success: true,
      data: challenges.map((challenge) => ({
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
    };
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

    const useCase = new CreateChallengeUseCase(this.challengeRepository);
    const result = await useCase.execute({
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

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new UpdateChallengeUseCase(this.challengeRepository);
    const result = await useCase.execute({
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

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const useCase = new UpdateChallengeStatusUseCase(this.challengeRepository);
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      newStatus: parsed.data.newStatus as ChallengeStatus,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
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

    const challenges = await this.challengeRepository.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return {
      success: true,
      data: challenges.map((challenge) => ({
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
    };
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

    const challenges = await this.challengeRepository.findByStatus(
      parsed.data.status as ChallengeStatus,
    );

    // Apply pagination manually
    const paginated = challenges.slice(
      parsed.data.offset,
      parsed.data.offset + parsed.data.limit,
    );

    return {
      success: true,
      data: paginated.map((challenge) => ({
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
    };
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
    const challenges = await this.challengeRepository.findActive();

    return {
      success: true,
      data: challenges.map((challenge) => ({
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
    };
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
    const challenges = await this.challengeRepository.findOpenForSubmission();

    return {
      success: true,
      data: challenges.map((challenge) => ({
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
    };
  }
}
