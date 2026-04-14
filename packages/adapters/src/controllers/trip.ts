import { z } from "zod";
import { Effect, type Layer } from "effect";
import { TripRepositoryTag } from "@mirai-app/use-cases";
import {
  createTripUseCase,
  updateTripUseCase,
  getTripByIdUseCase,
  deleteTripUseCase,
  type CreateTripInput,
  type UpdateTripInput,
} from "@mirai-app/use-cases";
import { TripStatus } from "@mirai-app/domain";

/**
 * Input validation schemas for trip controller
 */
const schemas = {
  getById: z.object({
    id: z.string().uuid("Invalid trip ID format"),
  }),

  create: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be at most 200 characters"),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .nullable()
      .optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    backgroundImagePath: z
      .string()
      .url("Invalid image URL")
      .nullable()
      .optional(),
    status: z
      .enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"])
      .default("PLANNING"),
  }),

  update: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
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
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    backgroundImagePath: z
      .string()
      .url("Invalid image URL")
      .nullable()
      .optional(),
  }),

  updateStatus: z.object({
    tripId: z.string().uuid("Invalid trip ID format"),
    newStatus: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]),
  }),

  list: z.object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),

  listByStatus: z.object({
    status: z.enum(["PLANNING", "ACTIVE", "COMPLETED", "CANCELLED"]),
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
 * TripController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 *
 * Updated for Step 4: Now uses Effect Layers instead of direct repository injection.
 */
export class TripController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  /**
   * Get a trip by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string | null;
          startDate: Date;
          endDate: Date;
          backgroundImagePath: string | null;
          status: string;
          createdAt: Date;
          updatedAt: Date;
          isActive: boolean;
          isPlanning: boolean;
          isCompleted: boolean;
          isCancelled: boolean;
          isOngoing: boolean;
          hasStarted: boolean;
          hasEnded: boolean;
          durationInDays: number;
          summary: string;
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

    const effect = getTripByIdUseCase({
      tripId: parsed.data.id,
    });

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            id: string;
            name: string;
            description: string | null;
            startDate: Date;
            endDate: Date;
            backgroundImagePath: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            isPlanning: boolean;
            isCompleted: boolean;
            isCancelled: boolean;
            isOngoing: boolean;
            hasStarted: boolean;
            hasEnded: boolean;
            durationInDays: number;
            summary: string;
          };
        }
      | { success: false; error: string }
    >;
  }

  /**
   * Create a new trip
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string | null;
          startDate: Date;
          endDate: Date;
          backgroundImagePath: string | null;
          status: string;
          createdAt: Date;
          updatedAt: Date;
          isActive: boolean;
          isPlanning: boolean;
          durationInDays: number;
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

    // Validate date range
    if (parsed.data.endDate.getTime() < parsed.data.startDate.getTime()) {
      return { success: false, error: "End date must be after start date" };
    }

    const useCaseInput: CreateTripInput = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      backgroundImagePath: parsed.data.backgroundImagePath ?? null,
      status: parsed.data.status as TripStatus,
    };

    const effect = createTripUseCase(useCaseInput);

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            id: string;
            name: string;
            description: string | null;
            startDate: Date;
            endDate: Date;
            backgroundImagePath: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            isPlanning: boolean;
            durationInDays: number;
          };
        }
      | { success: false; error: string }
    >;
  }

  /**
   * Update a trip
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string | null;
          startDate: Date;
          endDate: Date;
          backgroundImagePath: string | null;
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

    const useCaseInput: UpdateTripInput = {
      tripId: parsed.data.tripId,
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      backgroundImagePath: parsed.data.backgroundImagePath,
    };

    const effect = updateTripUseCase(useCaseInput);

    return (await runWithLayer(effect, this.appLayer)) as Promise<
      | {
          success: true;
          data: {
            id: string;
            name: string;
            description: string | null;
            startDate: Date;
            endDate: Date;
            backgroundImagePath: string | null;
            status: string;
            updatedAt: Date;
          };
        }
      | { success: false; error: string }
    >;
  }

  /**
   * Update trip status
   * Note: Uses updateTripUseCase internally for now
   */
  async updateStatus(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          status: string;
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

    // Update the trip status using updateTripUseCase (handles not-found case)
    const updateEffect = updateTripUseCase({
      tripId: parsed.data.tripId,
      status: parsed.data.newStatus as TripStatus,
    });

    const result = await runWithLayer(updateEffect, this.appLayer, (data) => ({
      id: data.id,
      name: data.name,
      status: data.status,
      updatedAt: data.updatedAt,
    }));

    return result as
      | {
          success: true;
          data: {
            id: string;
            name: string;
            status: string;
            updatedAt: Date;
          };
        }
      | { success: false; error: string };
  }

  /**
   * List all trips with pagination
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          name: string;
          description: string | null;
          startDate: Date;
          endDate: Date;
          status: string;
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

    // Use repository directly for list operations
    const effect = Effect.gen(function* () {
      const repo = yield* TripRepositoryTag;
      return yield* repo.findAll({
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      });
    });

    return (await runWithLayer(effect, this.appLayer, (trips) =>
      trips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        createdAt: trip.createdAt,
      })),
    )) as Promise<
      | {
          success: true;
          data: Array<{
            id: string;
            name: string;
            description: string | null;
            startDate: Date;
            endDate: Date;
            status: string;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
    >;
  }

  /**
   * List trips by status
   */
  async listByStatus(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          name: string;
          description: string | null;
          startDate: Date;
          endDate: Date;
          status: string;
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

    // Use repository directly for list by status
    const effect = Effect.gen(function* () {
      const repo = yield* TripRepositoryTag;
      return yield* repo.findByStatus(parsed.data.status as TripStatus);
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    // Apply pagination manually
    const trips = result.data as Array<{
      id: string;
      name: string;
      description: string | null;
      startDate: Date;
      endDate: Date;
      status: string;
      createdAt: Date;
    }>;
    const paginated = trips.slice(
      parsed.data.offset,
      parsed.data.offset + parsed.data.limit,
    );

    return {
      success: true,
      data: paginated.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        createdAt: trip.createdAt,
      })),
    };
  }

  /**
   * Find active trips
   */
  async findActive(): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          name: string;
          description: string | null;
          startDate: Date;
          endDate: Date;
          status: string;
          createdAt: Date;
        }>;
      }
    | { success: false; error: string }
  > {
    // Use repository directly for findActive
    const effect = Effect.gen(function* () {
      const repo = yield* TripRepositoryTag;
      return yield* repo.findActive();
    });

    return (await runWithLayer(effect, this.appLayer, (trips) =>
      trips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        createdAt: trip.createdAt,
      })),
    )) as Promise<
      | {
          success: true;
          data: Array<{
            id: string;
            name: string;
            description: string | null;
            startDate: Date;
            endDate: Date;
            status: string;
            createdAt: Date;
          }>;
        }
      | { success: false; error: string }
    >;
  }

  /**
   * Delete a trip
   */
  async delete(
    input: unknown,
  ): Promise<
    | { success: true; data: { deleted: true; tripId: string } }
    | { success: false; error: string }
  > {
    const parsed = schemas.getById.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const effect = deleteTripUseCase({
      tripId: parsed.data.id,
    });

    const result = await runWithLayer(effect, this.appLayer);

    if (!result.success) {
      return result as { success: false; error: string };
    }

    const data = result.data as { deletedTripId: string };

    return {
      success: true,
      data: {
        deleted: true as const,
        tripId: data.deletedTripId,
      },
    };
  }
}
