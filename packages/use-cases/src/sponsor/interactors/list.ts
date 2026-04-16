import type { Sponsor } from "@mirai-app/domain";
import { Effect } from "effect";
import { SponsorGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";

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
 * Helper function to convert Sponsor to list item DTO
 */
function toListItem(sponsor: Sponsor): SponsorListItem {
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

/**
 * ListSponsors Use Case
 *
 * Retrieves a list of sponsors with optional filtering.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = listSponsorsUseCase(input).pipe(
 *   Effect.provideService(SponsorGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function listSponsorsUseCase(
  input: ListSponsorsInput = {},
): Effect.Effect<ListSponsorsOutput, DatabaseError, SponsorGatewayTag> {
  return Effect.gen(function* () {
    const repo = yield* SponsorGatewayTag;

    const { limit = 100, offset = 0, activeOnly = false } = input;

    // Fetch sponsors - filter by active status if requested
    const result = yield* repo.findAll({ limit, offset });
    const sponsors = activeOnly
      ? result.items.filter((sponsor) => sponsor.isActive)
      : result.items;

    // Map to DTO
    const items = sponsors.map((sponsor) => toListItem(sponsor));

    return {
      sponsors: items,
      total: items.length,
    };
  });
}
