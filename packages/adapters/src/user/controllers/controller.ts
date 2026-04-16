import { Effect, type Layer } from "effect";
import {
  GetUserUseCase,
  createUserUseCase,
  updateUserUseCase,
  UserGatewayTag,
} from "@mirai-app/use-cases";
import { UserRole } from "@mirai-app/domain";
import {
  validateGetByIdInput,
  validateGetByAuthIdInput,
  validateCreateUserInput,
  validateUpdateUserInput,
  validateListInput,
} from "./validators/schema";

/**
 * Re-export validators for external use
 */
export {
  validateGetByIdInput,
  validateGetByAuthIdInput,
  validateCreateUserInput,
  validateUpdateUserInput,
  validateListInput,
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
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = new GetUserUseCase().execute({ userId: parsed.data.id });

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateCreateUserInput(input);
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

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateUpdateUserInput(input);
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

    return (await runWithLayer(effect, this.appLayer)) as unknown as
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
      | { success: false; error: string };
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
    const parsed = validateListInput(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = Effect.gen(function* () {
      const repo = yield* UserGatewayTag;
      const connection = yield* repo.findAllConnection({
        first: parsed.data.limit,
        after: null,
      });
      return connection.nodes;
    });

    const result = await runWithLayer(effect, this.appLayer, (users) =>
      users.map((user) => ({
        id: user.id,
        authUserId: user.authUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName:
          [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        role: user.role,
        hasAvatar: user.avatarUrl !== null && user.avatarUrl !== "",
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
