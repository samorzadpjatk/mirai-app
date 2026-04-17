import { Context } from "effect";
import type {
  ITripPort,
  TripResource,
  TripInsurance,
  InsuranceStep,
} from "@mirai-app/domain";

/**
 * Trip Port - Context.Tag for Effect DI
 */
export class TripPortTag extends Context.Tag("TripPort")<
  TripPortTag,
  ITripPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ITripPort, TripResource, TripInsurance, InsuranceStep };

/**
 * @deprecated Use TripPortTag instead. Kept for backward compatibility.
 */
export const TripPort = TripPortTag;

/**
 * @deprecated Use ITripPort instead. Kept for backward compatibility.
 */
export type TripPort = typeof TripPortTag;
