import { z } from "zod";
import { Effect } from "effect";
import type { GroupRepository } from "@mirai-app/use-cases";
import {
  getGroupUseCase,
  createGroupUseCase,
  updateGroupUseCase,
  deleteGroupUseCase,
  GroupRepositoryTag,
  type GetGroupOutput,
  type CreateGroupOutput,
  type UpdateGroupOutput,
  type DeleteGroupOutput,
  GetGroupNotFoundError,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
  DeleteGroupNotFoundError,
} from "@mirai-app/use-cases";
import { GroupStatus } from "@mirai-app/domain";
import {
  toEffectGroupRepository,
  effectToControllerResult,
} from "../utils/controller-helpers";

/**
 * Input validation schemas for group controller
 */
const schemas = {
  getById: z.object({
    id: z.string().uuid("Invalid group ID format"),
  }),

  getByCode: z.object({
    code: z.string().min(1, "Group code is required").max(50),
  }),

  getByTripId: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
  }),

  create: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters"),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .nullable()
      .optional(),
    image: z.string().url("Invalid image URL").nullable().optional(),
    organizerId: z.string().uuid("Invalid organizer ID format"),
    code: z
      .string()
      .min(1, "Group code is required")
      .max(50, "Code must be at most 50 characters"),
    coins: z.number().int().min(0).default(0),
  }),

  update: z.object({
    groupId: z.string().uuid("Invalid group ID format"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters")
      .optional(),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .nullable()
      .optional(),
    image: z.string().url("Invalid image URL").nullable().optional(),
  }),

  addCoins: z.object({
    groupId: z.string().uuid("Invalid group ID format"),
    amount: z.number().int().min(1, "Amount must be at least 1"),
  }),

  list: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  getByOrganizer: z.object({
    organizerId: z.string().min(1, "Organizer ID is required"),
  }),
};

/**
 * GroupController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class GroupController {
  constructor(private groupRepository: GroupRepository) {}

  /**
   * Get a group by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: GetGroupOutput;
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

    const effectRepo = toEffectGroupRepository(this.groupRepository);
    const effect = getGroupUseCase({
      groupId: parsed.data.id,
    }).pipe(Effect.provideService(GroupRepositoryTag, effectRepo));

    return await effectToControllerResult(effect);
  }

  /**
   * Get a group by its unique code
   */
  async getByCode(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          image: string | null;
          organizerId: string;
          code: string;
          coins: number;
          status: string;
          createdAt: Date;
          updatedAt: Date;
          isActive: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByCode.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectGroupRepository(this.groupRepository);

    // Use repository directly for findByCode (simple read operation)
    const effect = effectRepo.findByCode(parsed.data.code);

    const result = await effectToControllerResult(effect, (group) => {
      if (!group) {
        return null;
      }
      return {
        id: group.id,
        tripId: group.tripId,
        name: group.name,
        description: group.description,
        image: group.image,
        organizerId: group.organizerId,
        code: group.code,
        coins: group.coins,
        status: group.status,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        isActive: group.isActive(),
      };
    });

    if (result.success && result.data === null) {
      return { success: false, error: "Group not found" };
    }

    return result as
      | {
          success: true;
          data: {
            id: string;
            tripId: string;
            name: string;
            description: string | null;
            image: string | null;
            organizerId: string;
            code: string;
            coins: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
          };
        }
      | { success: false; error: string };
  }

  /**
   * Get groups by trip ID
   */
  async getByTripId(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          image: string | null;
          organizerId: string;
          code: string;
          coins: number;
          status: string;
          createdAt: Date;
          isActive: boolean;
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

    const effectRepo = toEffectGroupRepository(this.groupRepository);

    // Use repository directly for findByTripId (simple read operation)
    const effect = effectRepo.findByTripId(parsed.data.tripId);

    return await effectToControllerResult(effect, (groups) =>
      groups.map((group) => ({
        id: group.id,
        tripId: group.tripId,
        name: group.name,
        description: group.description,
        image: group.image,
        organizerId: group.organizerId,
        code: group.code,
        coins: group.coins,
        status: group.status,
        createdAt: group.createdAt,
        isActive: group.isActive(),
      })),
    );
  }

  /**
   * Create a new group
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: CreateGroupOutput;
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

    const effectRepo = toEffectGroupRepository(this.groupRepository);
    const effect = createGroupUseCase({
      tripId: parsed.data.tripId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      image: parsed.data.image ?? null,
      organizerId: parsed.data.organizerId,
      code: parsed.data.code,
      coins: parsed.data.coins,
    }).pipe(Effect.provideService(GroupRepositoryTag, effectRepo));

    const result = await effectToControllerResult(effect);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("already exists")) {
        return { success: false, error: "Group code is already in use" };
      }
    }

    return result;
  }

  /**
   * Update a group
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: UpdateGroupOutput;
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

    const effectRepo = toEffectGroupRepository(this.groupRepository);
    const effect = updateGroupUseCase({
      groupId: parsed.data.groupId,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image,
    }).pipe(Effect.provideService(GroupRepositoryTag, effectRepo));

    const result = await effectToControllerResult(effect);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Group not found" };
      }
      if (result.error.includes("deleted")) {
        return { success: false, error: "Cannot update a deleted group" };
      }
    }

    return result;
  }

  /**
   * Add coins to a group
   */
  async addCoins(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          previousCoins: number;
          newCoins: number;
          updatedAt: Date;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.addCoins.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    // First get the group to capture previous coins state
    const effectRepo = toEffectGroupRepository(this.groupRepository);

    const getEffect = getGroupUseCase({
      groupId: parsed.data.groupId,
    }).pipe(Effect.provideService(GroupRepositoryTag, effectRepo));

    const groupResult = await effectToControllerResult(getEffect);
    if (!groupResult.success) {
      return { success: false, error: "Group not found" };
    }

    const previousCoins = groupResult.data.coins;

    // Then update the group with new coins amount
    const updateEffect = updateGroupUseCase({
      groupId: parsed.data.groupId,
    }).pipe(Effect.provideService(GroupRepositoryTag, effectRepo));

    // Use repository directly to update coins (business logic should be in domain)
    const group = await Effect.runPromise(
      effectRepo.findById(parsed.data.groupId),
    );

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    if (!group.isActive()) {
      return { success: false, error: "Cannot add coins to a deleted group" };
    }

    try {
      const updatedGroup = await Effect.runPromise(
        group.addCoins(parsed.data.amount),
      );
      const saved = await Effect.runPromise(effectRepo.update(updatedGroup));

      return {
        success: true,
        data: {
          id: saved.id,
          name: saved.name,
          previousCoins,
          newCoins: saved.coins,
          updatedAt: saved.updatedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List all groups with pagination
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          image: string | null;
          organizerId: string;
          code: string;
          coins: number;
          status: string;
          createdAt: Date;
          isActive: boolean;
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

    const effectRepo = toEffectGroupRepository(this.groupRepository);

    // Use repository directly for findAll (simple read operation)
    const effect = effectRepo.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return await effectToControllerResult(effect, (groups) =>
      groups.map((group) => ({
        id: group.id,
        tripId: group.tripId,
        name: group.name,
        description: group.description,
        image: group.image,
        organizerId: group.organizerId,
        code: group.code,
        coins: group.coins,
        status: group.status,
        createdAt: group.createdAt,
        isActive: group.isActive(),
      })),
    );
  }

  /**
   * Get groups by organizer
   */
  async getByOrganizer(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          tripId: string;
          name: string;
          description: string | null;
          image: string | null;
          organizerId: string;
          code: string;
          coins: number;
          status: string;
          createdAt: Date;
          isActive: boolean;
        }>;
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.getByOrganizer.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectGroupRepository(this.groupRepository);

    // Use repository directly for findByOrganizerId (simple read operation)
    const effect = effectRepo.findByOrganizerId(parsed.data.organizerId);

    return await effectToControllerResult(effect, (groups) =>
      groups.map((group) => ({
        id: group.id,
        tripId: group.tripId,
        name: group.name,
        description: group.description,
        image: group.image,
        organizerId: group.organizerId,
        code: group.code,
        coins: group.coins,
        status: group.status,
        createdAt: group.createdAt,
        isActive: group.isActive(),
      })),
    );
  }

  /**
   * Soft delete a group (marks as DELETED)
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: { deleted: true } }
    | { success: false; error: string }
  > {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effectRepo = toEffectGroupRepository(this.groupRepository);

    // First check if group exists and is active
    const group = await Effect.runPromise(effectRepo.findById(parsed.data.id));

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    if (!group.isActive()) {
      return { success: false, error: "Group is already deleted" };
    }

    // Use deleteGroupUseCase for the actual deletion
    const effect = deleteGroupUseCase({
      groupId: parsed.data.id,
    }).pipe(Effect.provideService(GroupRepositoryTag, effectRepo));

    const result = await effectToControllerResult(effect);

    if (!result.success) {
      return result;
    }

    return { success: true, data: { deleted: true } };
  }
}
