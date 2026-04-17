import { Context } from "effect";
import type { ISponsorPort } from "@mirai-app/domain";

/**
 * Sponsor Port - Context.Tag for Effect DI
 */
export class SponsorPortTag extends Context.Tag("SponsorPort")<
  SponsorPortTag,
  ISponsorPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ISponsorPort };

/**
 * @deprecated Use SponsorPortTag instead. Kept for backward compatibility.
 */
export const SponsorPort = SponsorPortTag;

/**
 * @deprecated Use ISponsorPort instead. Kept for backward compatibility.
 */
export type SponsorPort = typeof SponsorPortTag;
