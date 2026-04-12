import { z } from "zod";
import { Effect } from "effect";
import type { SponsorRepository } from "@mirai-app/use-cases";
import type { Sponsor } from "@mirai-app/domain";
import {
  ListSponsorsUseCase,
  LinkSponsorToTripUseCase,
  UnlinkSponsorFromTripUseCase,
  getSponsorUseCase,
  createSponsorUseCase,
  updateSponsorUseCase,
  deleteSponsorUseCase,
  SponsorRepositoryTag,
  type CreateSponsorInput,
  type UpdateSponsorInput,
  type ListSponsorsInput,
  type LinkSponsorToTripInput,
  type UnlinkSponsorFromTripInput,
} from "@mirai-app/use-cases";

/**
 * Input validation schemas for sponsor controller
 */
const schemas = {
  getById: z.object({
    id: z.string().cuid("Invalid sponsor ID format"),
  }),

  getByTripId: z.object({
    tripId: z.string().cuid("Invalid trip ID format"),
  }),

  create: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be at most 200 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(2000, "Description must be at most 2000 characters"),
    logoPath: z.string().min(1, "Logo path is required"),
    height: z.number().int().min(0).nullable().optional(),
    offsetX: z.number().int().min(0).nullable().optional(),
    offsetY: z.number().int().min(0).nullable().optional(),
    isActive: z.boolean().default(true),
  }),

  update: z.object({
    sponsorId: z.string().cuid("Invalid sponsor ID format"),
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be at most 200 characters")
      .optional(),
    description: z
      .string()
      .min(1, "Description is required")
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    logoPath: z.string().min(1, "Logo path is required").optional(),
    height: z.number().int().min(0).nullable().optional(),
    offsetX: z.number().int().min(0).nullable().optional(),
    offsetY: z.number().int().min(0).nullable().optional(),
    isActive: z.boolean().optional(),
  }),

  delete: z.object({
    id: z.string().cuid("Invalid sponsor ID format"),
  }),

  list: z.object({
    limit: z.number().int().min(1).max(100).default(100),
    offset: z.number().int().min(0).default(0),
    activeOnly: z.boolean().default(false),
  }),

  linkToTrip: z.object({
    sponsorId: z.string().cuid("Invalid sponsor ID format"),
    tripId: z.string().cuid("Invalid trip ID format"),
  }),

  unlinkFromTrip: z.object({
    sponsorId: z.string().cuid("Invalid sponsor ID format"),
    tripId: z.string().cuid("Invalid trip ID format"),
  }),
};

/**
 * SponsorController
 *
 * Thin controller that delegates to use cases.
 * No business logic here - just input validation, use case orchestration,
 * and error handling.
 */
export class SponsorController {
  constructor(private sponsorRepository: SponsorRepository) {}

  /**
   * Get a sponsor by ID
   */
  async getById(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
          createdAt: Date;
          updatedAt: Date;
          hasLogoAdjustments: boolean;
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

    const program = getSponsorUseCase({ sponsorId: parsed.data.id }).pipe(
      Effect.provideService(SponsorRepositoryTag, {
        create: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.create(sponsor)),
        findById: (id: string) =>
          Effect.promise(() => this.sponsorRepository.findById(id)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => this.sponsorRepository.findAll(options)),
        findActive: () =>
          Effect.promise(() => this.sponsorRepository.findActive()),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.sponsorRepository.findByTripId(tripId)),
        update: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.update(sponsor)),
        delete: (id: string) =>
          Effect.promise(() => this.sponsorRepository.delete(id)),
        exists: (id: string) =>
          Effect.promise(() => this.sponsorRepository.exists(id)),
        isLinkedToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.isLinkedToTrip(sponsorId, tripId),
          ),
        linkToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.linkToTrip(sponsorId, tripId),
          ),
        unlinkFromTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.unlinkFromTrip(sponsorId, tripId),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get sponsors by trip ID
   */
  async getByTripId(input: unknown): Promise<
    | {
        success: true;
        data: Array<{
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
          createdAt: Date;
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

    const sponsors = await this.sponsorRepository.findByTripId(
      parsed.data.tripId,
    );

    return {
      success: true,
      data: sponsors.map((sponsor) => ({
        id: sponsor.id,
        name: sponsor.name,
        description: sponsor.description,
        logoPath: sponsor.logoPath,
        height: sponsor.height,
        offsetX: sponsor.offsetX,
        offsetY: sponsor.offsetY,
        isActive: sponsor.isActive,
        createdAt: sponsor.createdAt,
      })),
    };
  }

  /**
   * Create a new sponsor
   */
  async create(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
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

    const program = createSponsorUseCase({
      name: parsed.data.name,
      description: parsed.data.description,
      logoPath: parsed.data.logoPath,
      height: parsed.data.height,
      offsetX: parsed.data.offsetX,
      offsetY: parsed.data.offsetY,
      isActive: parsed.data.isActive,
    }).pipe(
      Effect.provideService(SponsorRepositoryTag, {
        create: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.create(sponsor)),
        findById: (id: string) =>
          Effect.promise(() => this.sponsorRepository.findById(id)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => this.sponsorRepository.findAll(options)),
        findActive: () =>
          Effect.promise(() => this.sponsorRepository.findActive()),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.sponsorRepository.findByTripId(tripId)),
        update: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.update(sponsor)),
        delete: (id: string) =>
          Effect.promise(() => this.sponsorRepository.delete(id)),
        exists: (id: string) =>
          Effect.promise(() => this.sponsorRepository.exists(id)),
        isLinkedToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.isLinkedToTrip(sponsorId, tripId),
          ),
        linkToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.linkToTrip(sponsorId, tripId),
          ),
        unlinkFromTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.unlinkFromTrip(sponsorId, tripId),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update a sponsor
   */
  async update(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          name: string;
          description: string;
          logoPath: string;
          height: number | null;
          offsetX: number | null;
          offsetY: number | null;
          isActive: boolean;
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

    const program = updateSponsorUseCase({
      sponsorId: parsed.data.sponsorId,
      name: parsed.data.name,
      description: parsed.data.description,
      logoPath: parsed.data.logoPath,
      height: parsed.data.height,
      offsetX: parsed.data.offsetX,
      offsetY: parsed.data.offsetY,
      isActive: parsed.data.isActive,
    }).pipe(
      Effect.provideService(SponsorRepositoryTag, {
        create: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.create(sponsor)),
        findById: (id: string) =>
          Effect.promise(() => this.sponsorRepository.findById(id)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => this.sponsorRepository.findAll(options)),
        findActive: () =>
          Effect.promise(() => this.sponsorRepository.findActive()),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.sponsorRepository.findByTripId(tripId)),
        update: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.update(sponsor)),
        delete: (id: string) =>
          Effect.promise(() => this.sponsorRepository.delete(id)),
        exists: (id: string) =>
          Effect.promise(() => this.sponsorRepository.exists(id)),
        isLinkedToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.isLinkedToTrip(sponsorId, tripId),
          ),
        linkToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.linkToTrip(sponsorId, tripId),
          ),
        unlinkFromTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.unlinkFromTrip(sponsorId, tripId),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a sponsor
   */
  async delete(input: unknown): Promise<
    | {
        success: true;
        data: {
          id: string;
          deleted: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.delete.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const program = deleteSponsorUseCase({ sponsorId: parsed.data.id }).pipe(
      Effect.provideService(SponsorRepositoryTag, {
        create: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.create(sponsor)),
        findById: (id: string) =>
          Effect.promise(() => this.sponsorRepository.findById(id)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => this.sponsorRepository.findAll(options)),
        findActive: () =>
          Effect.promise(() => this.sponsorRepository.findActive()),
        findByTripId: (tripId: string) =>
          Effect.promise(() => this.sponsorRepository.findByTripId(tripId)),
        update: (sponsor: Sponsor) =>
          Effect.promise(() => this.sponsorRepository.update(sponsor)),
        delete: (id: string) =>
          Effect.promise(() => this.sponsorRepository.delete(id)),
        exists: (id: string) =>
          Effect.promise(() => this.sponsorRepository.exists(id)),
        isLinkedToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.isLinkedToTrip(sponsorId, tripId),
          ),
        linkToTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.linkToTrip(sponsorId, tripId),
          ),
        unlinkFromTrip: (sponsorId: string, tripId: string) =>
          Effect.promise(() =>
            this.sponsorRepository.unlinkFromTrip(sponsorId, tripId),
          ),
      }),
    );

    try {
      const result = await Effect.runPromise(program);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List all sponsors
   */
  async list(input: unknown): Promise<
    | {
        success: true;
        data: {
          sponsors: Array<{
            id: string;
            name: string;
            description: string;
            logoPath: string;
            height: number | null;
            offsetX: number | null;
            offsetY: number | null;
            isActive: boolean;
            createdAt: Date;
          }>;
          total: number;
        };
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

    const useCase = new ListSponsorsUseCase(this.sponsorRepository);
    const result = await useCase.execute({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      activeOnly: parsed.data.activeOnly,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Link a sponsor to a trip
   */
  async linkToTrip(input: unknown): Promise<
    | {
        success: true;
        data: {
          sponsorId: string;
          tripId: string;
          linked: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.linkToTrip.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new LinkSponsorToTripUseCase(this.sponsorRepository);
    const result = await useCase.execute({
      sponsorId: parsed.data.sponsorId,
      tripId: parsed.data.tripId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }

  /**
   * Unlink a sponsor from a trip
   */
  async unlinkFromTrip(input: unknown): Promise<
    | {
        success: true;
        data: {
          sponsorId: string;
          tripId: string;
          unlinked: boolean;
        };
      }
    | { success: false; error: string }
  > {
    const parsed = schemas.unlinkFromTrip.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input: " + parsed.error.message,
      };
    }

    const useCase = new UnlinkSponsorFromTripUseCase(this.sponsorRepository);
    const result = await useCase.execute({
      sponsorId: parsed.data.sponsorId,
      tripId: parsed.data.tripId,
    });

    if (result.kind === "err") {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.value };
  }
}
