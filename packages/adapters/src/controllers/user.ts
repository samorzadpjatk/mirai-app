import { z } from "zod";
import { Effect, type Layer } from "effect";
import {
  getUserUseCase,
  createUserUseCase,
  updateUserUseCase,
  UserRepositoryTag,
} from "@mirai-app/use-cases";
import { UserRole } from "@mirai-app/domain";

/**
 * Input validation schemas for user controller
 */
const schemas = {
  getById: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),

  getByAuthId: z.object({
    authUserId: z.string().min(1, "Auth user ID is required"),
  }),

  create: z.object({
    authUserId: z.string().min(1, "Auth user ID is required"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name must be at most 100 characters")
      .refine((val) => !/\d/.test(val), "First name cannot contain digits"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(100, "Last name must be at most 100 characters")
      .refine((val) => !/\d/.test(val), "Last name cannot contain digits"),
    role: z.enum(["USER", "MODERATOR", "ADMIN", "SERVICE"]).default("USER"),
  }),

  update: z.object({
    userId: z.string().uuid("Invalid user ID format"),
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(100, "First name must be at most 100 characters")
      .refine((val) => !/\d/.test(val), "First name cannot contain digits")
      .optional(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(100, "Last name must be at most 100 characters")
      .refine((val) => !/\d/.test(val), "Last name cannot contain digits")
      .optional(),
    hasAvatar: z.boolean().optional(),
  }),

  list: z.object({
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
 * UserController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class UserController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a user by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          authUserId: string;
          firstName: string;
          lastName: string;
          fullName: string;
          role: string;
          hasAvatar: boolean;
          createdAt: Date;
          lastSeenOn: Date | null;
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

    const effect = getUserUseCase({ userId: parsed.data.id });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            id: string;
            authUserId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            role: string;
            hasAvatar: boolean;
            createdAt: Date;
            lastSeenOn: Date | null;
          };
        }
      | { success: false; error: string }
    >;
  }

  /**
   * Create a new user
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          authUserId: string;
          firstName: string;
          lastName: string;
          fullName: string;
          role: string;
          hasAvatar: boolean;
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

    const effect = createUserUseCase({
      authUserId: parsed.data.authUserId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role as UserRole,
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            id: string;
            authUserId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            role: string;
            hasAvatar: boolean;
            createdAt: Date;
          };
        }
      | { success: false; error: string }
    >;
  }

  /**
   * Update a user
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          authUserId: string;
          firstName: string;
          lastName: string;
          fullName: string;
          role: string;
          hasAvatar: boolean;
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

    const effect = updateUserUseCase({
      userId: parsed.data.userId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      hasAvatar: parsed.data.hasAvatar,
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            id: string;
            authUserId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            role: string;
            hasAvatar: boolean;
            updatedAt: Date;
          };
        }
      | { success: false; error: string }
    >;
  }

  /**
   * List users with pagination
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          authUserId: string;
          firstName: string;
          lastName: string;
          fullName: string;
          role: string;
          hasAvatar: boolean;
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

    const effect = Effect.gen(function* () {
      const repo = yield* UserRepositoryTag;
      return yield* repo.findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      });
    });

    const result = await runWithLayer(effect, this.appLayer, (users) =>
      users.map((user) => ({
        id: user.id,
        authUserId: user.authUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        hasAvatar: user.hasAvatar,
        createdAt: user.createdAt,
      })),
    );

    return result as
      | {
          success: true;
          data: Array<{
            id: string;
            authUserId: string;
            firstName: string;
            lastName: string;
            fullName: string;
            role: string;
            hasAvatar: boolean;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string };
  }
}
