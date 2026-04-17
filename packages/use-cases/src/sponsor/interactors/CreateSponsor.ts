import { Effect } from "effect";
import { Sponsor } from "@mirai-app/domain";
import { SponsorPort } from "../ports/SponsorPort";
import { InvalidSponsorDataError } from "../errors/SponsorErrors";
import type { CreateSponsorResultDTO } from "../dto/SponsorDTOs";
import type { ValidationError } from "@mirai-app/domain";

/**
 * Input for CreateSponsorUseCase
 */
export interface CreateSponsorInput {
  name: string;
  description: string;
  logoPath: string;
  height?: number | null;
  offsetX?: number | null;
  offsetY?: number | null;
  isActive?: boolean;
}

/**
 * Create Sponsor Use Case
 *
 * Creates a new sponsor with the provided details.
 */
export class CreateSponsorUseCase {
  execute(input: CreateSponsorInput) {
    return Effect.gen(function* () {
      const sponsorPort = yield* SponsorPort;

      // Validate required fields
      if (input.name.trim().length === 0) {
        return yield* Effect.fail(
          new InvalidSponsorDataError({
            field: "name",
            message: "Sponsor name is required",
          }),
        );
      }

      if (input.description.trim().length === 0) {
        return yield* Effect.fail(
          new InvalidSponsorDataError({
            field: "description",
            message: "Sponsor description is required",
          }),
        );
      }

      if (input.logoPath.trim().length === 0) {
        return yield* Effect.fail(
          new InvalidSponsorDataError({
            field: "logoPath",
            message: "Logo path is required",
          }),
        );
      }

      const now = new Date();

      // Create the sponsor entity - ID will be auto-generated
      const sponsorEffect = Sponsor.create({
        name: input.name.trim(),
        description: input.description.trim(),
        logoPath: input.logoPath.trim(),
        height: input.height ?? null,
        offsetX: input.offsetX ?? null,
        offsetY: input.offsetY ?? null,
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      const sponsor = yield* sponsorEffect;

      // Save to repository
      const savedSponsor = yield* sponsorPort.create(sponsor);

      return {
        id: savedSponsor.id,
        name: savedSponsor.name,
        description: savedSponsor.description,
        isActive: savedSponsor.isActive,
      };
    });
  }
}
