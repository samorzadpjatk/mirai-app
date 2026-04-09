import type { Result } from "@mirai-app/domain";
import { ok, err, Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

/**
 * Input for UpdateSponsor use case
 */
export interface UpdateSponsorInput {
  sponsorId: string;
  name?: string;
  description?: string;
  logoPath?: string;
  height?: number | null;
  offsetX?: number | null;
  offsetY?: number | null;
  isActive?: boolean;
}

/**
 * Output DTO for UpdateSponsor use case
 */
export interface UpdateSponsorOutput {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
  updatedAt: Date;
}

/**
 * UpdateSponsor Use Case
 *
 * Updates an existing sponsor.
 * Returns error if sponsor not found or validation fails.
 */
export class UpdateSponsorUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: UpdateSponsorInput,
  ): Promise<Result<UpdateSponsorOutput, string>> {
    // Find existing sponsor
    const existing = await this.sponsorRepository.findById(input.sponsorId);

    if (!existing) {
      return err("Sponsor not found");
    }

    // Update the entity
    const updatedResult = existing.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.logoPath !== undefined && { logoPath: input.logoPath }),
      ...(input.height !== undefined && { height: input.height }),
      ...(input.offsetX !== undefined && { offsetX: input.offsetX }),
      ...(input.offsetY !== undefined && { offsetY: input.offsetY }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    if (updatedResult.kind === "err") {
      return err(updatedResult.error);
    }

    // Persist updated sponsor
    const saved = await this.sponsorRepository.update(updatedResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(sponsor: Sponsor): UpdateSponsorOutput {
    return {
      id: sponsor.id,
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
      updatedAt: sponsor.updatedAt,
    };
  }
}
