import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

/**
 * Input for DeleteSponsor use case
 */
export interface DeleteSponsorInput {
  sponsorId: string;
}

/**
 * Output DTO for DeleteSponsor use case
 */
export interface DeleteSponsorOutput {
  id: string;
  deleted: boolean;
}

/**
 * DeleteSponsor Use Case
 *
 * Deletes a sponsor by ID.
 * Returns error if sponsor not found.
 */
export class DeleteSponsorUseCase {
  constructor(private sponsorRepository: SponsorRepository) {}

  async execute(
    input: DeleteSponsorInput,
  ): Promise<Result<DeleteSponsorOutput, string>> {
    // Check if sponsor exists
    const exists = await this.sponsorRepository.exists(input.sponsorId);

    if (!exists) {
      return err("Sponsor not found");
    }

    // Delete the sponsor
    await this.sponsorRepository.delete(input.sponsorId);

    return ok({
      id: input.sponsorId,
      deleted: true,
    });
  }
}
