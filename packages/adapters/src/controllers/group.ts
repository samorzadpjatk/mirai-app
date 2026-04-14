import { z } from "zod";
import { Effect, type Layer } from "effect";
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
} from "@mirai-app/use-cases";
import { GroupStatus } from "@mirai-app/domain";

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
 * GroupController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class GroupController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

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

    const effect = getGroupUseCase({
      groupId: parsed.data.id,
    });

    const result = await runWithLayer<GetGroupOutput>(effect, this.appLayer);
    return result as
      | { success: true; data: GetGroupOutput }
      | { success: false; error: string };
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

    const effect = Effect.gen(function* () {
      const repo = yield* GroupRepositoryTag;
      return yield* repo.findByCode(parsed.data.code);
    });

    const result = await runWithLayer(effect, this.appLayer, (group) => {
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

    const effect = Effect.gen(function* () {
      const repo = yield* GroupRepositoryTag;
      return yield* repo.findByTripId(parsed.data.tripId);
    });

    const result = await runWithLayer(effect, this.appLayer, (groups) =>
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

    return result as
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
      | { success: false; error: string };
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

    const effect = createGroupUseCase({
      tripId: parsed.data.tripId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      image: parsed.data.image ?? null,
      organizerId: parsed.data.organizerId,
      code: parsed.data.code,
      coins: parsed.data.coins,
    });

    const result = await runWithLayer<CreateGroupOutput>(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("already exists")) {
        return { success: false, error: "Group code is already in use" };
      }
    }

    return result as
      | { success: true; data: CreateGroupOutput }
      | { success: false; error: string };
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

    const effect = updateGroupUseCase({
      groupId: parsed.data.groupId,
      name: parsed.data.name,
      description: parsed.data.description,
      image: parsed.data.image,
    });

    const result = await runWithLayer<UpdateGroupOutput>(effect, this.appLayer);

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("not found")) {
        return { success: false, error: "Group not found" };
      }
      if (result.error.includes("deleted")) {
        return { success: false, error: "Cannot update a deleted group" };
      }
    }

    return result as
      | { success: true; data: UpdateGroupOutput }
      | { success: false; error: string };
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

    const effect = Effect.gen(function* () {
      const repo = yield* GroupRepositoryTag;

      // First get the group to validate and capture previous state
      const group = yield* repo.findById(parsed.data.groupId);

      if (!group) {
        return yield* Effect.fail(new Error("Group not found"));
      }

      if (!group.isActive()) {
        return yield* Effect.fail(
          new Error("Cannot add coins to a deleted group"),
        );
      }

      const previousCoins = group.coins;

      // Execute add coins and update
      const updatedGroup = yield* group.addCoins(parsed.data.amount);
      const saved = yield* repo.update(updatedGroup);

      return {
        id: saved.id,
        name: saved.name,
        previousCoins,
        newCoins: saved.coins,
        updatedAt: saved.updatedAt,
      };
    });

    const result = await runWithLayer(effect, this.appLayer);

    return result as
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
      | { success: false; error: string };
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

    const effect = Effect.gen(function* () {
      const repo = yield* GroupRepositoryTag;
      return yield* repo.findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      });
    });

    const result = await runWithLayer(effect, this.appLayer, (groups) =>
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

    return result as
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
      | { success: false; error: string };
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

    const effect = Effect.gen(function* () {
      const repo = yield* GroupRepositoryTag;
      return yield* repo.findByOrganizerId(parsed.data.organizerId);
    });

    const result = await runWithLayer(effect, this.appLayer, (groups) =>
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

    return result as
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
      | { success: false; error: string };
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

    const effect = Effect.gen(function* () {
      const repo = yield* GroupRepositoryTag;

      // Check if group exists
      const group = yield* repo.findById(parsed.data.id);

      if (!group) {
        return yield* Effect.fail(new Error("Group not found"));
      }

      if (!group.isActive()) {
        return yield* Effect.fail(new Error("Group is already deleted"));
      }

      // Use deleteGroupUseCase for the actual deletion
      const output = yield* deleteGroupUseCase({
        groupId: parsed.data.id,
      });

      return { deleted: output.success };
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    return {
      success: true,
      data: { deleted: (result.data as { deleted: boolean }).deleted as true },
    };
  }
}
