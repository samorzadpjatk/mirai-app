import { Context, Effect } from "effect";
import type { Sponsor, SponsorId, DatabaseError } from "@mirai-app/domain";

/**
 * Sponsor Port - Repository interface with Context.Tag for Effect DI
 */
export interface ISponsorPort {
  findById(id: SponsorId): Effect.Effect<Sponsor | null, DatabaseError, never>;
  findAll(): Effect.Effect<Sponsor[], DatabaseError, never>;
  findActive(): Effect.Effect<Sponsor[], DatabaseError, never>;
  create(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;
  update(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;
  delete(id: SponsorId): Effect.Effect<void, DatabaseError, never>;
  exists(id: SponsorId): Effect.Effect<boolean, DatabaseError, never>;
}

export class SponsorPortTag extends Context.Tag("SponsorPort")<
  SponsorPortTag,
  ISponsorPort
>() {}
