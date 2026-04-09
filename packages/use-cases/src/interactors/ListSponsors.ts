import type { Result } from "@repo/domain";
import { ok } from "@repo/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

/**
 * Sponsor list item DTO
 */
export interface SponsorListItem {
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
 * Input for ListSponsors use case
 */
export interface ListSponsorsInput {
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
}

/**
 * Output DTO for ListSponsors use case
 */
export interface ListSponsorsOutput {
  sponsors: SponsorListItem[];
  total: number;
}

/**
 * ListSponsors Use Case
 *
 * Retrieves a list of sponsors with optional filtering.
 */
export class ListSponsorsUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: ListSponsorsInput = {},
  ): Promise<Result<ListSponsorsOutput, string>> {
    const { limit = 100, offset = 0, activeOnly = false } = input;

    // Fetch sponsors
    const sponsors = activeOnly
      ? await this.sponsorRepository.findActive()
      : await this.sponsorRepository.findAll({ limit, offset });

    // Map to DTO
    const items = sponsors.map((sponsor) => this.toListItem(sponsor));

    return ok({
      sponsors: items,
      total: items.length,
    });
  }

  private toListItem(sponsor: {
    id: string;
    name: string;
    description: string;
    logoPath: string;
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
    isActive: boolean;
    createdAt: Date;
  }): SponsorListItem {
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
