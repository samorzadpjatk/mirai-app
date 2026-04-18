import { Context, Effect } from "effect";
import type { UserId } from "@mirai-app/domain";

/**
 * Coordinates for location throttle check
 */
interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

/**
 * Throttle service interface for location updates
 */
export interface IThrottleService {
  /**
   * Check if a location update should be published based on throttle rules
   * @param userId - The user ID
   * @param coordinates - The coordinates to check
   * @returns Effect that resolves to true if should publish, false otherwise
   */
  readonly shouldPublish: (
    userId: UserId,
    coordinates: Coordinates,
  ) => Effect.Effect<boolean, never, never>;
}

/**
 * ThrottleService Tag for Effect DI
 *
 * Use this tag to access the throttle service in Effect.gen blocks:
 * ```
 * const throttleService = yield* ThrottleServiceTag;
 * const shouldPublish = yield* throttleService.shouldPublish(userId, coordinates);
 * ```
 */
export class ThrottleServiceTag extends Context.Tag("ThrottleService")<
  ThrottleServiceTag,
  IThrottleService
>() {}
