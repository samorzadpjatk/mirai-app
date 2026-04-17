import { Context, Effect } from "effect";
import type { Sponsor, SponsorId, IPortError } from "@mirai-app/domain";

/**
 * Sponsor Port - Repository interface with Context.Tag for Effect DI
 */
export interface ISponsorPort {
  findById(id: SponsorId): Effect.Effect<Sponsor | null, IPortError, never>;
  findAll(): Effect.Effect<Sponsor[], IPortError, never>;
  findActive(): Effect.Effect<Sponsor[], IPortError, never>;
  create(sponsor: Sponsor): Effect.Effect<Sponsor, IPortError, never>;
  update(sponsor: Sponsor): Effect.Effect<Sponsor, IPortError, never>;
  delete(id: SponsorId): Effect.Effect<void, IPortError, never>;
  exists(id: SponsorId): Effect.Effect<boolean, IPortError, never>;
}

export class SponsorPortTag extends Context.Tag("SponsorPort")<
  SponsorPortTag,
  ISponsorPort
>() {}

/**
 * @deprecated Use SponsorPortTag instead. Kept for backward compatibility.
 */
export const SponsorPort = SponsorPortTag;

/**
 * @deprecated Use ISponsorPort instead. Kept for backward compatibility.
 */
export type SponsorPort = typeof SponsorPortTag;
