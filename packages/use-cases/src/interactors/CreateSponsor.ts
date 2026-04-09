import type { Result } from "@repo/domain";
import { ok, err, Sponsor } from "@repo/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

/**
 * Input for CreateSponsor use case
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
 * Output DTO for CreateSponsor use case
 */
export interface CreateSponsorOutput {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * CreateSponsor Use Case
 *
 * Creates a new sponsor.
 * Returns error if validation fails.
 */
export class CreateSponsorUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: CreateSponsorInput,
  ): Promise<Result<CreateSponsorOutput, string>> {
    // Create domain entity
    const sponsorResult = Sponsor.create({
      name: input.name,
      description: input.description,
      logoPath: input.logoPath,
      ...(input.height !== undefined && { height: input.height }),
      ...(input.offsetX !== undefined && { offsetX: input.offsetX }),
      ...(input.offsetY !== undefined && { offsetY: input.offsetY }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    if (sponsorResult.kind === "err") {
      return err(sponsorResult.error);
    }

    // Persist sponsor
    const saved = await this.sponsorRepository.create(sponsorResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(sponsor: Sponsor): CreateSponsorOutput {
    return {
      id: sponsor.id,
      name: sponsor.name,
      description: sponsor.description,
      logoPath: sponsor.logoPath,
      height: sponsor.height,
      offsetX: sponsor.offsetX,
      offsetY: sponsor.offsetY,
      isActive: sponsor.isActive,
      createdAt: sponsor.createdAt,
    };
  }
}
