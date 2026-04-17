import { Effect } from "effect";
import { SponsorPort } from "../ports/SponsorPort";
import type { SponsorDTO } from "../dto/SponsorDTOs";

/**
 * Get All Sponsors Use Case
 *
 * Retrieves all active sponsors ordered by creation date.
 */
export class GetAllSponsorsUseCase {
  execute() {
    return Effect.gen(function* () {
      const sponsorPort = yield* SponsorPort;

      const sponsors = yield* sponsorPort.findActive();

      return sponsors.map((sponsor) => ({
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
      }));
    });
  }
}
