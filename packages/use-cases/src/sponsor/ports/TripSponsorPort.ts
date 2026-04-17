import { Context } from "effect";
import type { ITripSponsorPort, TripSponsor, TripSponsorWithSponsor } from "@mirai-app/domain";

/**
 * TripSponsor Port - Context.Tag for Effect DI
 */
export class TripSponsorPortTag extends Context.Tag("TripSponsorPort")<
  TripSponsorPortTag,
  ITripSponsorPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ITripSponsorPort, TripSponsor, TripSponsorWithSponsor };

/**
 * @deprecated Use TripSponsorPortTag instead. Kept for backward compatibility.
 */
export const TripSponsorPort = TripSponsorPortTag;

/**
 * @deprecated Use ITripSponsorPort instead. Kept for backward compatibility.
 */
export type TripSponsorPort = typeof TripSponsorPortTag;
