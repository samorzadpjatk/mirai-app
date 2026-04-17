import { Effect } from "effect";
import { TripSponsorPort, type TripSponsor } from "../ports/TripSponsorPort";
import { SponsorPort } from "../ports/SponsorPort";
import {
  SponsorNotFoundError,
  TripNotFoundError,
  SponsorAlreadyAssociatedError,
} from "../errors/SponsorErrors";
import type { TripSponsorDTO } from "../dto/SponsorDTOs";
import type { ApplicationError, SponsorId, TripId } from "@mirai-app/domain";
import { TripSponsorId } from "@mirai-app/domain";

/**
 * Input for AddSponsorToTripUseCase
 */
export interface AddSponsorToTripInput {
  tripId: TripId;
  sponsorId: SponsorId;
}

/**
 * Add Sponsor To Trip Use Case
 *
 * Associates an existing sponsor with a trip.
 */
export class AddSponsorToTripUseCase {
  execute(
    input: AddSponsorToTripInput,
  ): Effect.Effect<
    TripSponsorDTO,
    | ApplicationError
    | SponsorNotFoundError
    | TripNotFoundError
    | SponsorAlreadyAssociatedError,
    SponsorPort | TripSponsorPort
  > {
    return Effect.gen(function* () {
      const sponsorPort = yield* SponsorPort;
      const tripSponsorPort = yield* TripSponsorPort;

      // Verify sponsor exists
      const sponsor = yield* sponsorPort.findById(input.sponsorId);

      if (!sponsor) {
        return yield* Effect.fail(
          new SponsorNotFoundError({ sponsorId: input.sponsorId }),
        );
      }

      // Check if association already exists
      const existingAssociation =
        yield* tripSponsorPort.existsByTripIdAndSponsorId(
          input.tripId,
          input.sponsorId,
        );

      if (existingAssociation) {
        return yield* Effect.fail(
          new SponsorAlreadyAssociatedError({
            tripId: input.tripId,
            sponsorId: input.sponsorId,
          }),
        );
      }

      // Create the association
      const tripSponsorData: TripSponsor = {
        id: TripSponsorId.generate(),
        tripId: input.tripId,
        sponsorId: input.sponsorId,
        createdAt: new Date(),
      };

      const createdTripSponsor = yield* tripSponsorPort.create(tripSponsorData);

      return {
        id: createdTripSponsor.id,
        tripId: createdTripSponsor.tripId,
        sponsorId: createdTripSponsor.sponsorId,
        sponsor: {
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
        },
        createdAt: createdTripSponsor.createdAt,
      };
    });
  }
}
