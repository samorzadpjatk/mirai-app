import { Sponsor } from "@mirai-app/domain";
import { Effect } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

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
 * Error type when sponsor is not found
 */
export class UpdateSponsorNotFoundError extends Error {
  readonly _tag = "UpdateSponsorNotFoundError";
  constructor() {
    super("Sponsor not found");
  }
}

/**
 * Error type for validation failures
 */
export class UpdateSponsorValidationError extends Error {
  readonly _tag = "UpdateSponsorValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * UpdateSponsor Use Case (Effect-based)
 *
 * Updates an existing sponsor.
 * Returns error if sponsor not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = updateSponsorUseCase(input).pipe(
 *   Effect.provideService(SponsorRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateSponsorUseCase(
  input: UpdateSponsorInput,
): Effect.Effect<
  UpdateSponsorOutput,
  UpdateSponsorNotFoundError | UpdateSponsorValidationError,
  SponsorRepositoryTag
> {
  return Effect.gen(function* () {
    const sponsorRepo = yield* SponsorRepositoryTag;

    // Find existing sponsor
    const existing = yield* sponsorRepo.findById(input.sponsorId);

    if (!existing) {
      return yield* Effect.fail(new UpdateSponsorNotFoundError());
    }

    // Update the entity
    const updateEffect = existing.update({
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

    // Run validation effect and convert validation errors to Effect.fail
    const updated = yield* Effect.catchAll(updateEffect, (error) =>
      Effect.fail(
        new UpdateSponsorValidationError(
          error instanceof Error ? error.message : String(error),
        ),
      ),
    );

    // Persist updated sponsor
    const saved = yield* sponsorRepo.update(updated);

    return toOutput(saved);
  });
}

function toOutput(sponsor: Sponsor): UpdateSponsorOutput {
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
