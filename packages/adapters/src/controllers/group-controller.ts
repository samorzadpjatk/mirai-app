import { z } from "zod";
import type { GroupRepository } from "@repo/use-cases";
import { Group, GroupStatus } from "@repo/domain";

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
};

/**
 * GroupController
 *
 * Thin controller that works directly with the repository.
 * Note: Use cases should be created for Group and this controller
 * should delegate to them instead of working directly with the repository.
 */
export class GroupController {
  constructor(private groupRepository: GroupRepository) {}

  /**
   * Get a group by ID
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
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const group = await this.groupRepository.findById(parsed.data.id);

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    return {
      success: true,
      data: {
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
      },
    };
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

    const group = await this.groupRepository.findByCode(parsed.data.code);

    if (!group) {
      return { success: false, error: "Group not found" };
    }

    return {
      success: true,
      data: {
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
      },
    };
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

    const groups = await this.groupRepository.findByTripId(parsed.data.tripId);

    return {
      success: true,
      data: groups.map((group) => ({
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
    };
  }

  /**
   * Create a new group
   */
  async create(input: unknown): Promise<
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

    // Check if code is already in use
    const existingGroup = await this.groupRepository.findByCode(
      parsed.data.code,
    );
    if (existingGroup) {
      return { success: false, error: "Group code is already in use" };
    }

    // Create domain entity directly until CreateGroupUseCase exists
    const groupResult = Group.create({
      tripId: parsed.data.tripId,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image,
      organizerId: parsed.data.organizerId,
      code: parsed.data.code,
      coins: parsed.data.coins,
    });

    if (groupResult.kind === "err") {
      return { success: false, error: groupResult.error };
    }

    // Persist group
    const saved = await this.groupRepository.create(groupResult.value);

    return {
      success: true,
      data: {
        id: saved.id,
        tripId: saved.tripId,
        name: saved.name,
        description: saved.description,
        image: saved.image,
        organizerId: saved.organizerId,
        code: saved.code,
        coins: saved.coins,
        status: saved.status,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Update a group
   */
  async update(input: unknown): Promise<
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

    // Find existing group
    const group = await this.groupRepository.findById(parsed.data.groupId);
    if (!group) {
      return { success: false, error: "Group not found" };
    }

    // Check if group is active (can't update deleted groups)
    if (!group.isActive()) {
      return { success: false, error: "Cannot update a deleted group" };
    }

    // Apply updates using entity method
    let updatedGroup = group;

    if (
      parsed.data.name !== undefined ||
      parsed.data.description !== undefined ||
      parsed.data.image !== undefined
    ) {
      const detailsResult = updatedGroup.updateDetails({
        name: parsed.data.name,
        description: parsed.data.description,
        image: parsed.data.image,
      });

      if (detailsResult.kind === "err") {
        return { success: false, error: detailsResult.error };
      }

      updatedGroup = detailsResult.value;
    }

    // Persist changes
    const saved = await this.groupRepository.update(updatedGroup);

    return {
      success: true,
      data: {
        id: saved.id,
        tripId: saved.tripId,
        name: saved.name,
        description: saved.description,
        image: saved.image,
        organizerId: saved.organizerId,
        code: saved.code,
        coins: saved.coins,
        status: saved.status,
        updatedAt: saved.updatedAt,
      },
    };
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

    // Find existing group
    const group = await this.groupRepository.findById(parsed.data.groupId);
    if (!group) {
      return { success: false, error: "Group not found" };
    }

    // Check if group is active
    if (!group.isActive()) {
      return { success: false, error: "Cannot add coins to a deleted group" };
    }

    const previousCoins = group.coins;

    // Apply coin update
    const coinsResult = group.addCoins(parsed.data.amount);

    if (coinsResult.kind === "err") {
      return { success: false, error: coinsResult.error };
    }

    // Persist changes
    const saved = await this.groupRepository.update(coinsResult.value);

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

    const groups = await this.groupRepository.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return {
      success: true,
      data: groups.map((group) => ({
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
    };
  }

  /**
   * Get groups by organizer
   */
  async getByOrganizer(input: { organizerId: string }): Promise<
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
    if (!input.organizerId) {
      return {
        success: false,
        error: "Organizer ID is required",
      };
    }

    const groups = await this.groupRepository.findByOrganizerId(
      input.organizerId,
    );

    return {
      success: true,
      data: groups.map((group) => ({
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
    };
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

    // Find existing group
    const group = await this.groupRepository.findById(parsed.data.id);
    if (!group) {
      return { success: false, error: "Group not found" };
    }

    // Check if already deleted
    if (!group.isActive()) {
      return { success: false, error: "Group is already deleted" };
    }

    // Mark as deleted
    const deletedResult = group.delete();

    if (deletedResult.kind === "err") {
      return { success: false, error: deletedResult.error };
    }

    // Persist changes
    await this.groupRepository.update(deletedResult.value);

    return { success: true, data: { deleted: true } };
  }
}
