import { z } from "zod";
import type { ChallengeSubmissionRepository } from "@mirai-app/use-cases";
import {
  CreateSubmissionUseCase,
  GetSubmissionUseCase,
  GetSubmissionByChallengeAndGroupUseCase,
  UpdateSubmissionUseCase,
  DeleteSubmissionUseCase,
  ListSubmissionsByChallengeUseCase,
  type CreateSubmissionInput,
  type UpdateSubmissionInput,
} from "@mirai-app/use-cases";
import { SubmissionId } from "@mirai-app/domain";

/**
 * Input validation schemas for challenge submission controller
 */
const schemas = {
  getById: z.object({
    submissionId: z.string().min(1, "Submission ID is required"),
  }),

  getByChallengeAndGroup: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    groupId: z.string().min(1, "Group ID is required"),
  }),

  getByChallenge: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    orderBy: z.enum(["voteScore", "createdAt"]).optional(),
    orderDirection: z.enum(["asc", "desc"]).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
  }),

  create: z.object({
    challengeId: z.string().min(1, "Challenge ID is required"),
    groupId: z.string().min(1, "Group ID is required"),
    imageIds: z.array(z.string().min(1)).max(10).optional(),
    videoId: z.string().min(1).optional(),
    textContent: z.string().max(10000).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),

  update: z.object({
    submissionId: z.string().min(1, "Submission ID is required"),
    // Content update fields
    imageIds: z.array(z.string().min(1)).max(10).optional(),
    videoId: z.string().min(1).optional().nullable(),
    textContent: z.string().max(10000).optional().nullable(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    // Review fields
    reviewAction: z.enum(["APPROVE", "REJECT"]).optional(),
    reviewedById: z.string().optional(),
    rejectionReason: z.string().max(1000).optional(),
    awardedPoints: z.number().int().min(0).optional(),
    bonusPoints: z.number().int().min(0).optional(),
    ranking: z.number().int().min(1).max(3).optional().nullable(),
  }),

  delete: z.object({
    submissionId: z.string().min(1, "Submission ID is required"),
  }),
};

/**
 * ChallengeSubmissionController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class ChallengeSubmissionController {
  constructor(private submissionRepository: ChallengeSubmissionRepository) {}

  /**
   * Get a submission by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
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
          group: {
            id: string;
            name: string;
            description: string | null;
            image: string | null;
          } | null;
          reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
          } | null;
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

    const useCase = new GetSubmissionUseCase(this.submissionRepository);
    const result = await useCase.execute({
      submissionId: SubmissionId.unsafeCreate(parsed.data.submissionId),
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Get a submission by challenge ID and group ID
   */
  async getByChallengeAndGroup(input: unknown): Promise<
    | {
        success: true;
        data: {
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
          group: {
            id: string;
            name: string;
            description: string | null;
            image: string | null;
          } | null;
          reviewedBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string | null;
          } | null;
        } | null;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByChallengeAndGroup.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new GetSubmissionByChallengeAndGroupUseCase(
      this.submissionRepository,
    );
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      groupId: parsed.data.groupId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * List submissions for a challenge
   */
  async listByChallenge(input: unknown): Promise<
    | {
        success: true;
        data: {
          submissions: Array<{
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
            group: {
              id: string;
              name: string;
              description: string | null;
              image: string | null;
            } | null;
            reviewedBy: {
              id: string;
              firstName: string;
              lastName: string;
              email: string | null;
            } | null;
          }>;
          totalCount: number;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByChallenge.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new ListSubmissionsByChallengeUseCase(
      this.submissionRepository,
    );
    const result = await useCase.execute({
      challengeId: parsed.data.challengeId,
      orderBy: parsed.data.orderBy,
      orderDirection: parsed.data.orderDirection,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Create a new submission
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          challengeId: string;
          groupId: string;
          imageIds: string[];
          videoId: string | null;
          textContent: string | null;
          latitude: number | null;
          longitude: number | null;
          status: string;
          awardedPoints: number;
          bonusPoints: number;
          ranking: number | null;
          voteCount: number;
          voteScore: number;
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

    const useCase = new CreateSubmissionUseCase(this.submissionRepository);

    const createInput: CreateSubmissionInput = {
      challengeId: parsed.data.challengeId,
      groupId: parsed.data.groupId,
      imageIds: parsed.data.imageIds,
      videoId: parsed.data.videoId,
      textContent: parsed.data.textContent,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    };

    const result = await useCase.execute(createInput);

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Update a submission (content or review)
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
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
          updatedAt: Date;
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

    const useCase = new UpdateSubmissionUseCase(this.submissionRepository);

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

    const result = await useCase.execute(updateInput);

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Delete a submission
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: { success: boolean } }
    | { success: false; error: string }
  > {
    const parsed = schemas.delete.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new DeleteSubmissionUseCase(this.submissionRepository);
    const result = await useCase.execute({
      submissionId: SubmissionId.unsafeCreate(parsed.data.submissionId),
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }
}
