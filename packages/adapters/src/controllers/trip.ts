import { z } from "zod";
import { Effect } from "effect";
import type { TripRepository } from "@mirai-app/use-cases";
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
import {
  toEffectTripRepository,
  effectToControllerResult,
} from "../utils/controller-helpers";

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
 * TripController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class TripController {
  constructor(private tripRepository: TripRepository) {}

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

    const effectRepo = toEffectTripRepository(this.tripRepository);
    const effect = getTripByIdUseCase({
      tripId: parsed.data.id,
    }).pipe(Effect.provideService(TripRepositoryTag, effectRepo));

    return await effectToControllerResult(effect);
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

    const effectRepo = toEffectTripRepository(this.tripRepository);
    const useCaseInput: CreateTripInput = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      backgroundImagePath: parsed.data.backgroundImagePath ?? null,
      status: parsed.data.status as TripStatus,
    };

    const effect = createTripUseCase(useCaseInput).pipe(
      Effect.provideService(TripRepositoryTag, effectRepo),
    );

    return await effectToControllerResult(effect);
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

    const effectRepo = toEffectTripRepository(this.tripRepository);
    const useCaseInput: UpdateTripInput = {
      tripId: parsed.data.tripId,
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      backgroundImagePath: parsed.data.backgroundImagePath,
    };

    const effect = updateTripUseCase(useCaseInput).pipe(
      Effect.provideService(TripRepositoryTag, effectRepo),
    );

    return await effectToControllerResult(effect);
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

    const effectRepo = toEffectTripRepository(this.tripRepository);

    // First get the trip to ensure it exists
    const tripEffect = getTripByIdUseCase({
      tripId: parsed.data.tripId,
    }).pipe(Effect.provideService(TripRepositoryTag, effectRepo));

    const tripResult = await Effect.runPromise(Effect.either(tripEffect));

    if (tripResult._tag === "Left") {
      return { success: false, error: tripResult.left.message };
    }

    // Update the trip status using updateTripUseCase
    const updateEffect = updateTripUseCase({
      tripId: parsed.data.tripId,
      status: parsed.data.newStatus as TripStatus,
    }).pipe(Effect.provideService(TripRepositoryTag, effectRepo));

    const result = await effectToControllerResult(updateEffect, (data) => ({
      id: data.id,
      name: data.name,
      status: data.status,
      updatedAt: data.updatedAt,
    }));

    return result;
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

    const effectRepo = toEffectTripRepository(this.tripRepository);

    // Use repository directly for list operations
    const effect = effectRepo.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return await effectToControllerResult(effect, (trips) =>
      trips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        createdAt: trip.createdAt,
      })),
    );
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

    const effectRepo = toEffectTripRepository(this.tripRepository);

    // Use repository directly for list by status
    const effect = effectRepo.findByStatus(parsed.data.status as TripStatus);

    const result = await effectToControllerResult(effect);

    if (!result.success) {
      return result;
    }

    // Apply pagination manually
    const paginated = result.data.slice(
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
    const effectRepo = toEffectTripRepository(this.tripRepository);

    // Use repository directly for findActive
    const effect = effectRepo.findActive();

    return await effectToControllerResult(effect, (trips) =>
      trips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        status: trip.status,
        createdAt: trip.createdAt,
      })),
    );
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

    const effectRepo = toEffectTripRepository(this.tripRepository);
    const effect = deleteTripUseCase({
      tripId: parsed.data.id,
    }).pipe(Effect.provideService(TripRepositoryTag, effectRepo));

    const result = await effectToControllerResult(effect);

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      data: {
        deleted: true as const,
        tripId: result.data.deletedTripId,
      },
    };
  }
}
