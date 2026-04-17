import { Effect } from "effect";
import { Sponsor } from "@mirai-app/domain";
import { SponsorPort } from "../ports/SponsorPort";
import {
  SponsorNotFoundError,
  InvalidSponsorDataError,
} from "../errors/SponsorErrors";
import type { UpdateSponsorResultDTO } from "../dto/SponsorDTOs";
import type {
  ApplicationError,
  ValidationError,
  SponsorId,
} from "@mirai-app/domain";

/**
 * Input for UpdateSponsorUseCase
 */
export interface UpdateSponsorInput {
  sponsorId: SponsorId;
  name?: string;
  description?: string;
  logoPath?: string;
  height?: number | null;
  offsetX?: number | null;
  offsetY?: number | null;
  isActive?: boolean;
}

/**
 * Update Sponsor Use Case
 *
 * Updates an existing sponsor's details.
 */
export class UpdateSponsorUseCase {
  execute(
    input: UpdateSponsorInput,
  ): Effect.Effect<
    UpdateSponsorResultDTO,
    | ApplicationError
    | ValidationError
    | SponsorNotFoundError
    | InvalidSponsorDataError,
    SponsorPort
  > {
    return Effect.gen(function* () {
      const sponsorPort = yield* SponsorPort;

      // Check if sponsor exists
      const existingSponsor = yield* sponsorPort.findById(input.sponsorId);

      if (!existingSponsor) {
        return yield* Effect.fail(
          new SponsorNotFoundError({ sponsorId: input.sponsorId }),
        );
      }

      // Validate input if provided
      if (input.name !== undefined && input.name.trim().length === 0) {
        return yield* Effect.fail(
          new InvalidSponsorDataError({
            field: "name",
            message: "Sponsor name cannot be empty",
          }),
        );
      }

      if (input.logoPath !== undefined && input.logoPath.trim().length === 0) {
        return yield* Effect.fail(
          new InvalidSponsorDataError({
            field: "logoPath",
            message: "Logo path cannot be empty",
          }),
        );
      }

      // Build updated sponsor using domain methods
      let updatedSponsor = existingSponsor;

      // Update details if provided
      if (input.name !== undefined || input.description !== undefined) {
        const detailsEffect = updatedSponsor.withDetails({
          name: input.name,
          description: input.description,
        });
        updatedSponsor = yield* detailsEffect;
      }

      // Update display settings if provided
      if (
        input.height !== undefined ||
        input.offsetX !== undefined ||
        input.offsetY !== undefined
      ) {
        updatedSponsor = updatedSponsor.withDisplaySettings({
          height: input.height,
          offsetX: input.offsetX,
          offsetY: input.offsetY,
        });
      }

      // Update logo path if provided
      if (input.logoPath !== undefined) {
        // Create new sponsor with updated logo
        const logoEffect = Sponsor.create({
          id: updatedSponsor.id,
          name: updatedSponsor.name,
          description: updatedSponsor.description,
          logoPath: input.logoPath.trim(),
          height: updatedSponsor.height,
          offsetX: updatedSponsor.offsetX,
          offsetY: updatedSponsor.offsetY,
          isActive: input.isActive ?? updatedSponsor.isActive,
          createdAt: updatedSponsor.createdAt,
          updatedAt: new Date(),
        });
        updatedSponsor = yield* logoEffect;
      } else if (input.isActive !== undefined) {
        // Just update active status
        updatedSponsor = input.isActive
          ? updatedSponsor.activate()
          : updatedSponsor.deactivate();
      }

      // Save to repository
      const savedSponsor = yield* sponsorPort.update(updatedSponsor);

      return {
        id: savedSponsor.id,
        name: savedSponsor.name,
        description: savedSponsor.description,
        logoPath: savedSponsor.logoPath,
        height: savedSponsor.height,
        offsetX: savedSponsor.offsetX,
        offsetY: savedSponsor.offsetY,
        isActive: savedSponsor.isActive,
        updatedAt: savedSponsor.updatedAt,
      };
    });
  }
}
