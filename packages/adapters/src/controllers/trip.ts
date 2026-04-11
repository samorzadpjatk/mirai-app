import { z } from "zod";
import type { TripRepository } from "@mirai-app/use-cases";
import { Trip, TripStatus } from "@mirai-app/domain";

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
 * Thin controller that works directly with the repository.
 * Note: Use cases should be created for Trip and this controller
 * should delegate to them instead of working directly with the repository.
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
          isPlanning: boolean;
          isActive: boolean;
          isCompleted: boolean;
          isCancelled: boolean;
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

    const trip = await this.tripRepository.findById(parsed.data.id);

    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    return {
      success: true,
      data: {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        backgroundImagePath: trip.backgroundImagePath,
        status: trip.status,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
        isPlanning: trip.isPlanning(),
        isActive: trip.isActive(),
        isCompleted: trip.isCompleted(),
        isCancelled: trip.isCancelled(),
      },
    };
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

    // Create domain entity directly until CreateTripUseCase exists
    const tripResult = Trip.create({
      name: parsed.data.name,
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      backgroundImagePath: parsed.data.backgroundImagePath,
      status: parsed.data.status as TripStatus,
    });

    if (tripResult.kind === "err") {
      return { success: false, error: tripResult.error.message };
    }

    // Persist trip
    const saved = await this.tripRepository.create(tripResult.value);

    return {
      success: true,
      data: {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        startDate: saved.startDate,
        endDate: saved.endDate,
        backgroundImagePath: saved.backgroundImagePath,
        status: saved.status,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    };
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

    // Find existing trip
    const trip = await this.tripRepository.findById(parsed.data.tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    // Check if trip can be updated (not in terminal state)
    if (trip.isCompleted() || trip.isCancelled()) {
      return {
        success: false,
        error: "Cannot update a completed or cancelled trip",
      };
    }

    // Apply updates using entity methods
    let updatedTrip = trip;

    // Update details if provided
    if (
      parsed.data.name !== undefined ||
      parsed.data.description !== undefined ||
      parsed.data.backgroundImagePath !== undefined
    ) {
      const detailsResult = updatedTrip.updateDetails({
        name: parsed.data.name,
        description: parsed.data.description,
        backgroundImagePath: parsed.data.backgroundImagePath,
      });

      if (detailsResult.kind === "err") {
        return { success: false, error: detailsResult.error.message };
      }

      updatedTrip = detailsResult.value;
    }

    // Update dates if provided
    if (
      parsed.data.startDate !== undefined ||
      parsed.data.endDate !== undefined
    ) {
      const datesResult = updatedTrip.updateDates({
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      });

      if (datesResult.kind === "err") {
        return { success: false, error: datesResult.error.message };
      }

      updatedTrip = datesResult.value;
    }

    // Persist changes
    const saved = await this.tripRepository.update(updatedTrip);

    return {
      success: true,
      data: {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        startDate: saved.startDate,
        endDate: saved.endDate,
        backgroundImagePath: saved.backgroundImagePath,
        status: saved.status,
        updatedAt: saved.updatedAt,
      },
    };
  }

  /**
   * Update trip status
   */
  async updateStatus(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          previousStatus: string;
          newStatus: string;
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

    // Find existing trip
    const trip = await this.tripRepository.findById(parsed.data.tripId);
    if (!trip) {
      return { success: false, error: "Trip not found" };
    }

    const previousStatus = trip.status;

    // Check if transition is valid
    if (!trip.canTransitionTo(parsed.data.newStatus as TripStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${previousStatus} to ${parsed.data.newStatus}`,
      };
    }

    // Apply status update
    try {
      const updatedTrip = trip.updateStatus(
        parsed.data.newStatus as TripStatus,
      );

      // Persist changes
      const saved = await this.tripRepository.update(updatedTrip);

      return {
        success: true,
        data: {
          id: saved.id,
          name: saved.name,
          previousStatus,
          newStatus: saved.status,
          updatedAt: saved.updatedAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update status: ${error}`,
      };
    }
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

    const trips = await this.tripRepository.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return {
      success: true,
      data: trips.map((trip) => ({
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

    const trips = await this.tripRepository.findByStatus(
      parsed.data.status as TripStatus,
    );

    // Apply pagination manually
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
    const trips = await this.tripRepository.findActive();

    return {
      success: true,
      data: trips.map((trip) => ({
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
   * Delete a trip
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

    // Check if trip exists
    const exists = await this.tripRepository.exists(parsed.data.id);
    if (!exists) {
      return { success: false, error: "Trip not found" };
    }

    await this.tripRepository.delete(parsed.data.id);

    return { success: true, data: { deleted: true } };
  }
}
