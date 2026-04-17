import { Context } from "effect";
import type { ILocationPort } from "@mirai-app/domain";

/**
 * Location Port - Context.Tag for Effect DI
 */
export class LocationPortTag extends Context.Tag("LocationPort")<
  LocationPortTag,
  ILocationPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ILocationPort };

/**
 * @deprecated Use LocationPortTag instead. Kept for backward compatibility.
 */
export const LocationPort = LocationPortTag;

/**
 * @deprecated Use ILocationPort instead. Kept for backward compatibility.
 */
export type LocationPort = typeof LocationPortTag;
