import { Context } from "effect";
import type { ILocationSharingRequestPort } from "@mirai-app/domain";

/**
 * LocationSharingRequest Port - Context.Tag for Effect DI
 */
export class LocationSharingRequestPortTag extends Context.Tag(
  "LocationSharingRequestPort",
)<LocationSharingRequestPortTag, ILocationSharingRequestPort>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ILocationSharingRequestPort };

/**
 * @deprecated Use LocationSharingRequestPortTag instead. Kept for backward compatibility.
 */
export const LocationSharingRequestPort = LocationSharingRequestPortTag;

/**
 * @deprecated Use ILocationSharingRequestPort instead. Kept for backward compatibility.
 */
export type LocationSharingRequestPort = typeof LocationSharingRequestPortTag;
