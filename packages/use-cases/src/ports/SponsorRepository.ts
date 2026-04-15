import type { SponsorRepository } from "@mirai-app/domain/ports";
import { Context } from "effect";

/**
 * SponsorRepository Port
 *
 * Port interface for sponsor persistence.
 * Implemented by adapters (e.g., DrizzleSponsorRepository).
 *
 * NOTE: Interface imported from @mirai-app/domain/ports.
 * Context.Tag defined here for Effect dependency injection.
 */
export type { SponsorRepository } from "@mirai-app/domain/ports";

/**
 * SponsorRepository Context.Tag for Effect dependency injection
 */
export class SponsorRepositoryTag extends Context.Tag("SponsorRepository")<
  SponsorRepositoryTag,
  SponsorRepository
>() {}
