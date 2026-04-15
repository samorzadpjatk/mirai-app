import type { Sponsor } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

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
 * Error type when sponsor is not found
 */
export class GetSponsorNotFoundError extends Data.TaggedError(
  "GetSponsorNotFoundError",
)<{}> {}

/**
 * GetSponsor Use Case (Effect-based)
 *
 * Retrieves a single sponsor by ID.
 * Returns error if sponsor not found.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = getSponsorUseCase(input).pipe(
 *   Effect.provideService(SponsorRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getSponsorUseCase(
  input: GetSponsorInput,
): Effect.Effect<
  GetSponsorOutput,
  DatabaseError | GetSponsorNotFoundError,
  SponsorRepositoryTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorRepositoryTag;

    const sponsor = yield* sponsorRepo.findById(input.sponsorId);

    if (!sponsor) {
      return yield* Effect.fail(new GetSponsorNotFoundError({}));
    }

    return toOutput(sponsor);
  });
}

function toOutput(sponsor: {
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
