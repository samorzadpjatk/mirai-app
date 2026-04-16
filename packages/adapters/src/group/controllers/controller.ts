import { Effect, type Layer } from "effect";
import {
  getGroupUseCase,
  createGroupUseCase,
  updateGroupUseCase,
  deleteGroupUseCase,
  assignUserToGroupUseCase,
  removeUserFromGroupUseCase,
  GroupGatewayTag,
  type GetGroupOutput,
  type CreateGroupOutput,
  type UpdateGroupOutput,
  type DeleteGroupOutput,
  type AssignUserToGroupOutput,
  type RemoveUserFromGroupOutput,
  type AssignUserToGroupInput,
  type RemoveUserFromGroupInput,
} from "@mirai-app/use-cases";
import { GroupStatus, UserId } from "@mirai-app/domain";
import {
  validateGetByIdInput,
  validateGetByCodeInput,
  validateGetByTripIdInput,
  validateCreateGroupInput,
  validateUpdateGroupInput,
  validateAddCoinsInput,
  validateListInput,
  validateGetByOrganizerInput,
  validateAssignUserToGroupInput,
  validateRemoveUserFromGroupInput,
} from "./validators/schema";

export {
  validateGetByIdInput,
  validateGetByCodeInput,
  validateGetByTripIdInput,
  validateCreateGroupInput,
  validateUpdateGroupInput,
  validateAddCoinsInput,
  validateListInput,
  validateGetByOrganizerInput,
  validateAssignUserToGroupInput,
  validateRemoveUserFromGroupInput,
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
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = getGroupUseCase({ groupId: parsed.data.id });

    const result = await runWithLayer(effect, this.appLayer);
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
    const parsed = validateGetByCodeInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;
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
    const parsed = validateGetByTripIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;
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
    const parsed = validateCreateGroupInput(input);
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
    const parsed = validateUpdateGroupInput(input);
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
    const parsed = validateAddCoinsInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;

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
    const parsed = validateListInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;
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
    const parsed = validateGetByOrganizerInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;
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
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;

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

  /**
   * Assign a user to a group
   */
  async assignUser(input: unknown): Promise<
    | {
        success: true;
        data: AssignUserToGroupOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validateAssignUserToGroupInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;
      const input: AssignUserToGroupInput = {
        groupId: parsed.data.groupId as AssignUserToGroupInput["groupId"],
        userId: UserId.create(parsed.data.userId),
      };
      return yield* assignUserToGroupUseCase(input);
    });

    const result = await runWithLayer<AssignUserToGroupOutput>(
      effect,
      this.appLayer,
    );

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("GroupNotFoundError")) {
        return { success: false, error: "Group not found" };
      }
      if (result.error.includes("UserNotFoundError")) {
        return { success: false, error: "User not found" };
      }
      if (result.error.includes("ParticipantNotFoundError")) {
        return {
          success: false,
          error: "User is not a participant in this trip",
        };
      }
    }

    return result as
      | { success: true; data: AssignUserToGroupOutput }
      | { success: false; error: string };
  }

  /**
   * Remove a user from a group
   */
  async removeUser(input: unknown): Promise<
    | {
        success: true;
        data: RemoveUserFromGroupOutput;
      }
    | { success: false; error: string }
  > {
    const parsed = validateRemoveUserFromGroupInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* GroupGatewayTag;
      const input: RemoveUserFromGroupInput = {
        groupId: parsed.data.groupId as RemoveUserFromGroupInput["groupId"],
        userId: UserId.create(parsed.data.userId),
      };
      return yield* removeUserFromGroupUseCase(input);
    });

    const result = await runWithLayer<RemoveUserFromGroupOutput>(
      effect,
      this.appLayer,
    );

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("GroupNotFoundError")) {
        return { success: false, error: "Group not found" };
      }
      if (result.error.includes("NotGroupMemberError")) {
        return { success: false, error: "User is not a member of this group" };
      }
      if (result.error.includes("ParticipantNotFoundError")) {
        return {
          success: false,
          error: "User is not a participant in this trip",
        };
      }
    }

    return result as
      | { success: true; data: RemoveUserFromGroupOutput }
      | { success: false; error: string };
  }
}
