import { Effect } from "effect";
import { SponsorPort } from "../ports/SponsorPort";
import { SponsorNotFoundError } from "../errors/SponsorErrors";
import type { SponsorDTO } from "../dto/SponsorDTOs";
import type { SponsorId } from "@mirai-app/domain";

/**
 * Input for GetSponsorByIdUseCase
 */
export interface GetSponsorByIdInput {
  sponsorId: SponsorId;
}

/**
 * Get Sponsor By ID Use Case
 *
 * Retrieves a sponsor by its ID.
 */
export class GetSponsorByIdUseCase {
  execute(input: GetSponsorByIdInput) {
    return Effect.gen(function* () {
      const sponsorPort = yield* SponsorPort;

      const sponsor = yield* sponsorPort.findById(input.sponsorId);

      if (!sponsor) {
        return yield* Effect.fail(
          new SponsorNotFoundError({ sponsorId: input.sponsorId }),
        );
      }

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
      };
    });
  }
}
