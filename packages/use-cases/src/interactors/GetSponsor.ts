import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

/**
 * Input for GetSponsor use case
 */
export interface GetSponsorInput {
  sponsorId: string;
}

/**
 * Output DTO for GetSponsor use case
 */
export interface GetSponsorOutput {
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
}

/**
 * GetSponsor Use Case
 *
 * Retrieves a single sponsor by ID.
 * Returns error if sponsor not found.
 */
export class GetSponsorUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: GetSponsorInput,
  ): Promise<Result<GetSponsorOutput, string>> {
    const sponsor = await this.sponsorRepository.findById(input.sponsorId);

    if (!sponsor) {
      return err("Sponsor not found");
    }

    return ok(this.toOutput(sponsor));
  }

  private toOutput(sponsor: {
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
    hasLogoAdjustments(): boolean;
  }): GetSponsorOutput {
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
      updatedAt: sponsor.updatedAt,
      hasLogoAdjustments: sponsor.hasLogoAdjustments(),
    };
  }
}
