import { z } from "zod";
import { Effect } from "effect";
import type { UserRepository } from "@mirai-app/use-cases";
import {
  getUserUseCase,
  createUserUseCase,
  updateUserUseCase,
  type GetUserInput,
  type CreateUserInput,
  type UpdateUserInput,
  UserRepositoryTag,
} from "@mirai-app/use-cases";
import { UserRole } from "@mirai-app/domain";
import {
  toEffectUserRepository,
  effectToControllerResult,
} from "../utils/controller-helpers";

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
 * UserController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated to use Effect-based use cases (Step 4.2).
 */
export class UserController {
  constructor(private userRepository: UserRepository) {}

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

    const effectRepo = toEffectUserRepository(this.userRepository);
    const effect = getUserUseCase({ userId: parsed.data.id }).pipe(
      Effect.provideService(UserRepositoryTag, effectRepo),
    );

    return await effectToControllerResult(effect);
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

    const effectRepo = toEffectUserRepository(this.userRepository);
    const effect = createUserUseCase({
      authUserId: parsed.data.authUserId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: parsed.data.role as UserRole,
    }).pipe(Effect.provideService(UserRepositoryTag, effectRepo));

    return await effectToControllerResult(effect);
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

    const effectRepo = toEffectUserRepository(this.userRepository);
    const effect = updateUserUseCase({
      userId: parsed.data.userId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      hasAvatar: parsed.data.hasAvatar,
    }).pipe(Effect.provideService(UserRepositoryTag, effectRepo));

    return await effectToControllerResult(effect);
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

    const users = await Effect.runPromise(
      this.userRepository.findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      }),
    );

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        authUserId: user.authUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.getFullName(),
        role: user.role,
        hasAvatar: user.hasAvatar,
        createdAt: user.createdAt,
      })),
    };
  }
}
