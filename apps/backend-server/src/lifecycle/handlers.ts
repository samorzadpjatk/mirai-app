import { Effect, Layer, Either } from "effect";
import { initializeNotificationHandlers } from "../handlers/notification-handlers";
import { initializeLocationHandlers } from "../handlers/location-handlers";
import { serverState } from "../state";

/**
 * Initialize all event handlers with dependency injection
 *
 * This function initializes both notification and location event handlers,
 * wiring them to the EventBus for real-time event processing.
 */
export const initializeHandlers = <T>(appLayer: Layer.Layer<T, never, never>) =>
  Effect.gen(function* () {
    yield* Effect.log("Initializing all event handlers...");

    // Initialize notification handlers
    const notificationEither = yield* initializeNotificationHandlers().pipe(
      Effect.provide(appLayer),
      Effect.either
    );

    const notificationResult = yield* Either.match(notificationEither, {
      onLeft: (error) =>
        Effect.gen(function* () {
          serverState.handlerStatus.notification = "error";
          yield* Effect.logError("Failed to initialize notification handlers").pipe(
            Effect.annotateLogs({ error })
          );

          return { cleanup: () => { } };
        }),
      onRight: ({ cleanup }) =>
        Effect.gen(function* () {
          serverState.notificationCleanup = cleanup;
          serverState.handlerStatus.notification = "initialized";

          yield* Effect.log("Notification handlers initialized successfully");

          return { cleanup };
        }),
    });

    // Initialize location handlers
    const locationEither = yield* initializeLocationHandlers().pipe(
      Effect.provide(appLayer),
      Effect.either
    );

    const locationResult = yield* Either.match(locationEither, {
      onLeft: (error) =>
        Effect.gen(function* () {
          serverState.handlerStatus.location = "error";
          yield* Effect.logError("Failed to initialize location handlers").pipe(
            Effect.annotateLogs({ error })
          );

          return { cleanup: () => { } };
        }),
      onRight: ({ cleanup }) =>
        Effect.gen(function* () {
          serverState.locationCleanup = cleanup;
          serverState.handlerStatus.location = "initialized";

          yield* Effect.log("Location handlers initialized successfully");

          return { cleanup };
        }),
    });

    // Combine cleanup functions
    const combinedCleanup = () => {
      notificationResult.cleanup();
      locationResult.cleanup();
    };

    return { cleanup: combinedCleanup };
  });
