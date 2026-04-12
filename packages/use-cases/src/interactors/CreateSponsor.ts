import { Sponsor } from "@mirai-app/domain";
import { Effect } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

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
 * Error type for CreateSponsor use case
 */
export class CreateSponsorValidationError extends Error {
  readonly _tag = "CreateSponsorValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * CreateSponsor Use Case (Effect-based)
 *
 * Creates a new sponsor.
 * Returns error if validation fails.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = createSponsorUseCase(input).pipe(
 *   Effect.provideService(SponsorRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function createSponsorUseCase(
  input: CreateSponsorInput,
): Effect.Effect<
  CreateSponsorOutput,
  CreateSponsorValidationError,
  SponsorRepositoryTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorRepositoryTag;

    // Create domain entity
    const sponsorEffect = Sponsor.create({
      name: input.name,
      description: input.description,
      logoPath: input.logoPath,
      ...(input.height !== undefined && { height: input.height }),
      ...(input.offsetX !== undefined && { offsetX: input.offsetX }),
      ...(input.offsetY !== undefined && { offsetY: input.offsetY }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    // Run validation effect and convert validation errors to Effect.fail
    const sponsor = yield* Effect.catchAll(sponsorEffect, (error) =>
      Effect.fail(
        new CreateSponsorValidationError(
          error instanceof Error ? error.message : String(error),
        ),
      ),
    );

    // Persist sponsor
    const saved = yield* sponsorRepo.create(sponsor);

    return toOutput(saved);
  });
}

function toOutput(sponsor: Sponsor): CreateSponsorOutput {
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
