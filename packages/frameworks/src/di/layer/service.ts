/**
 * Service Layer Composition - Authentication and Storage Services
 *
 * Composes service gateways into Effect Layers using Better Auth for authentication
 * and SeaweedFS for storage and Redis Streams for realtime/event bus services.
 * Located in frameworks/di because this is DI wiring logic that binds
 * adapter implementations to use-cases layer Context.Tags.
 */

import { Layer, Effect, Runtime } from "effect";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { createBetterAuth } from "@mirai-app/frameworks/better-auth";
import {
  AuthNPortTag,
  StoragePortTag,
  EventBusTag,
  EmailPortTag,
} from "@mirai-app/use-cases";
import {
  PushSubscriptionPortTag,
  NotificationDeliveryPortTag,
  NotificationServicePortTag,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  BetterAuthGateway,
  RedisEventBusGateway,
  SeaweedFSStorageGateway,
  SmtpEmailGateway,
  loadConfigFromEnv,
  loadRedisEventBusConfigFromEnv,
  loadSmtpConfigFromEnv,
} from "@mirai-app/adapters";
import type {
  SeaweedFSConfig,
  RedisEventBusConfig,
  SmtpEmailConfig,
} from "@mirai-app/adapters";

/**
 * Configuration for creating service Layers
 */
export interface ServiceLayerConfig {
  /** Drizzle database client for Better Auth */
  db: DrizzleDb;
  /** Better Auth secret key (falls back to BETTER_AUTH_SECRET env var) */
  betterAuthSecret?: string;
  /** Better Auth base URL (falls back to BETTER_AUTH_URL env var) */
  betterAuthUrl?: string;
  /** SeaweedFS storage configuration (loads from env if not provided) */
  seaweedfsConfig?: SeaweedFSConfig;
  /** Redis Event Bus configuration (loads from env if not provided) */
  eventBusConfig?: RedisEventBusConfig;
  /** SMTP email configuration (loads from env if not provided) */
  smtpEmailConfig?: SmtpEmailConfig;
}

/**
 * Creates the complete service Layer with authentication, storage, event bus, and email services.
 *
 * Provides:
 * - AuthNPortTag - Authentication operations using Better Auth (sign in/out, sessions)
 * - StoragePortTag - File storage operations using SeaweedFS with native TUS for resumable uploads
 * - EventBusTag - Event bus for notifications and background jobs (Redis Streams)
 * - EmailPortTag - Email sending operations using SMTP
 *
 * Storage uses SeaweedFS with native TUS support for resumable uploads.
 * Event bus uses Redis Streams for reliable, scalable event processing.
 * Email uses SMTP for sending OTP and transactional emails.
 *
 * Note: The EventBusTag provided by this layer requires notification ports
 * (PushSubscriptionPortTag, NotificationDeliveryPortTag, NotificationServicePortTag)
 * to be provided by the repository layer. Use makeAppLayer() for complete composition.
 *
 * @example
 * ```typescript
 * const serviceLayer = makeServiceLayer({ db });
 *
 * const program = Effect.gen(function* () {
 *   const authN = yield* AuthNPortTag;
 *   return yield* authN.getSession();
 * }).pipe(Effect.provide(serviceLayer));
 * ```
 */
export const makeServiceLayer = (config: ServiceLayerConfig) => {
  // Create email layer first (needed for Better Auth OTP)
  const emailLayer = createSmtpEmailLayer(config);

  // Create Better Auth layer with email support (pass layer for extraction)
  const authNLayer = createBetterAuthLayerWithEmail(config, emailLayer);

  // Create storage layer (always SeaweedFS)
  const storageLayer = createSeaweedFSStorageLayer(config);

  // Event bus uses Redis Streams (created without runtime, runtime set by makeAppLayer)
  const eventBusLayer = createRedisEventBusLayer(config);

  return Layer.mergeAll(authNLayer, storageLayer, eventBusLayer, emailLayer);
};

/**
 * Creates the Better Auth layer with BetterAuthGateway.
 *
 * This helper function creates a Better Auth instance and wires it to AuthNPortTag.
 * Requires db client to be provided in config.
 *
 * @throws Error if db is not provided
 * @throws Error if BETTER_AUTH_SECRET or BETTER_AUTH_URL env vars are not set
 */
const createBetterAuthLayer = (config: ServiceLayerConfig) => {
  if (!config.db) {
    throw new Error(
      "Drizzle database client (db) is required. " +
        "Provide it via config.db.",
    );
  }

  const betterAuth = createBetterAuth(config.db, {
    secret: config.betterAuthSecret,
    baseUrl: config.betterAuthUrl,
  });

  return Layer.succeed(AuthNPortTag, new BetterAuthGateway(betterAuth));
};

/**
 * Creates the Better Auth layer with email support.
 *
 * This helper creates a Better Auth instance with SMTP email integration
 * and wires it to AuthNPortTag.
 *
 * @throws Error if db is not provided
 * @throws Error if BETTER_AUTH_SECRET or BETTER_AUTH_URL env vars are not set
 */
const createBetterAuthLayerWithEmail = (
  config: ServiceLayerConfig,
  emailLayer: Layer.Layer<EmailPortTag>,
) => {
  if (!config.db) {
    throw new Error(
      "Drizzle database client (db) is required. " +
        "Provide it via config.db.",
    );
  }

  // Create the email gateway directly using the same config
  // This ensures Better Auth and the DI layer use the same email instance
  const emailEffect = Effect.gen(function* () {
    const resolvedConfig = config.smtpEmailConfig
      ? Effect.succeed(config.smtpEmailConfig)
      : loadSmtpConfigFromEnv();

    const cfg = yield* resolvedConfig;
    return new SmtpEmailGateway(cfg);
  }).pipe(Effect.catchAll((error): Effect.Effect<never, never, never> => {
    throw new Error(
      `Failed to create email gateway for Better Auth: ${error.message}`,
    );
  }));

  const emailGateway = Effect.runSync(emailEffect);

  const betterAuth = createBetterAuth(config.db, {
    secret: config.betterAuthSecret,
    baseUrl: config.betterAuthUrl,
    emailPort: emailGateway,
  });

  return Layer.succeed(AuthNPortTag, new BetterAuthGateway(betterAuth));
};

/**
 * Creates the SeaweedFS Storage service Layer with configuration.
 *
 * Uses environment variables or provided config for SeaweedFS.
 * If no config is provided, loads from environment variables.
 *
 * @example
 * ```typescript
 * const storageLayer = makeSeaweedFSStorageLayer();
 * // Or with explicit config:
 * const storageLayer = makeSeaweedFSStorageLayer({
 *   endpoint: "http://localhost:8333",
 *   accessKeyId: "dev_access_key",
 *   secretAccessKey: "dev_secret_key",
 *   region: "us-east-1",
 *   forcePathStyle: true,
 *   useSsl: false
 * });
 * ```
 */
export const makeSeaweedFSStorageLayer = (
  config?: SeaweedFSConfig,
) => {
  const effect = Effect.gen(function* () {
    // Load config from env if not provided
    const resolvedConfig = config
      ? Effect.succeed(config)
      : loadConfigFromEnv();

    const cfg = yield* resolvedConfig;

    // Create the SeaweedFS gateway with validated config
    const gateway = new SeaweedFSStorageGateway(cfg);

    return Layer.succeed(StoragePortTag, gateway);
  }).pipe(Effect.catchAll((error): Effect.Effect<never, never, never> => {
    // If config validation fails, throw at layer creation time
    // This ensures errors are caught early during app initialization
    throw new Error(
      `Failed to create SeaweedFS storage layer: ${error.message}`,
    );
  }));
  return Effect.runSync(effect);
};

/**
 * Creates the SeaweedFS Storage service Layer from config.
 * Internal helper used by makeServiceLayer.
 */
const createSeaweedFSStorageLayer = (config: ServiceLayerConfig) => {
  const effect = Effect.gen(function* () {
    // Use provided config or load from environment
    const resolvedConfig = config.seaweedfsConfig
      ? Effect.succeed(config.seaweedfsConfig)
      : loadConfigFromEnv();

    const cfg = yield* resolvedConfig;

    const gateway = new SeaweedFSStorageGateway(cfg);

    return Layer.succeed(StoragePortTag, gateway);
  }).pipe(Effect.catchAll((error): Effect.Effect<never, never, never> => {
    throw new Error(
      `Failed to create SeaweedFS storage layer: ${error.message}`,
    );
  }));
  return Effect.runSync(effect);
};

/**
 * Creates the Redis Event Bus service Layer with configuration.
 *
 * This function creates a RedisEventBusGateway and wires it to EventBusTag.
 * The gateway is created without a handler runtime - the runtime must be set
 * after the repository layer is available using setEventBusHandlerRuntime().
 *
 * Supports consumer groups for load-balanced background job processing
 * and broadcast mode for real-time pub/sub.
 *
 * @example
 * ```typescript
 * const eventBusLayer = makeServiceLayer({ db });
 *
 * // Later, after repository layer is available:
 * const fullLayer = Layer.mergeAll(serviceLayer, repoLayer);
 * const runtime = yield* Layer.toRuntime(fullLayer);
 * const eventBus = yield* EventBusTag;
 * eventBus.setRuntime(runtime);
 * ```
 */
const createRedisEventBusLayer = (config: ServiceLayerConfig) => {
  const effect = Effect.gen(function* () {
    // Load config from env if not provided
    const resolvedConfig = config.eventBusConfig
      ? Effect.succeed(config.eventBusConfig)
      : loadRedisEventBusConfigFromEnv();

    const cfg = yield* resolvedConfig;

    const gateway = new RedisEventBusGateway(cfg);

    return Layer.succeed(EventBusTag, gateway);
  }).pipe(Effect.catchAll((error): Effect.Effect<never, never, never> => {
    throw new Error(
      `Failed to create Redis event bus layer: ${error.message}`,
    );
  }));
  return Effect.runSync(effect);
};

/**
 * Creates the SMTP Email service Layer with configuration.
 *
 * Uses environment variables or provided config for SMTP email delivery.
 * If no config is provided, loads from environment variables.
 *
 * @example
 * ```typescript
 * const emailLayer = makeSmtpEmailLayer();
 * // Or with explicit config:
 * const emailLayer = makeSmtpEmailLayer({
 *   host: "smtp.gmail.com",
 *   port: 587,
 *   user: "user@gmail.com",
 *   pass: "app-password",
 *   from: "noreply@example.com",
 *   secure: true
 * });
 * ```
 */
export const makeSmtpEmailLayer = (config?: SmtpEmailConfig) => {
  const effect = Effect.gen(function* () {
    // Load config from env if not provided
    const resolvedConfig = config
      ? Effect.succeed(config)
      : loadSmtpConfigFromEnv();

    const cfg = yield* resolvedConfig;

    // Create the SMTP email gateway with validated config
    const gateway = new SmtpEmailGateway(cfg);

    return Layer.succeed(EmailPortTag, gateway);
  }).pipe(Effect.catchAll((error): Effect.Effect<never, never, never> => {
    // If config validation fails, throw at layer creation time
    // This ensures errors are caught early during app initialization
    throw new Error(
      `Failed to create SMTP email layer: ${error.message}`,
    );
  }));
  return Effect.runSync(effect);
};

/**
 * Creates the SMTP Email service Layer from config.
 * Internal helper used by makeServiceLayer.
 */
const createSmtpEmailLayer = (config: ServiceLayerConfig) => {
  const effect = Effect.gen(function* () {
    // Use provided config or load from environment
    const resolvedConfig = config.smtpEmailConfig
      ? Effect.succeed(config.smtpEmailConfig)
      : loadSmtpConfigFromEnv();

    const cfg = yield* resolvedConfig;

    const gateway = new SmtpEmailGateway(cfg);

    return Layer.succeed(EmailPortTag, gateway);
  }).pipe(Effect.catchAll((error): Effect.Effect<never, never, never> => {
    throw new Error(
      `Failed to create SMTP email layer: ${error.message}`,
    );
  }));
  return Effect.runSync(effect);
};

/**
 * Sets up the EventBus handler runtime with notification ports.
 *
 * This function should be called after the repository layer is available
 * to provide the notification ports to the EventBus for handler dependency injection.
 *
 * @param eventBus - The event bus gateway (from EventBusTag)
 * @returns Effect that sets up the handler runtime
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const eventBus = yield* EventBusTag;
 *   yield* setupEventBusHandlerRuntime(eventBus);
 * });
 * ```
 */
export const setupEventBusHandlerRuntime = (eventBus: RedisEventBusGateway) => {
  return Effect.gen(function* () {
    // Capture notification ports for handler injection
    const pushSubscriptionPort = yield* PushSubscriptionPortTag;
    const deliveryPort = yield* NotificationDeliveryPortTag;
    const servicePort = yield* NotificationServicePortTag;

    // Build handler runtime with these ports
    const handlerLayer = Layer.mergeAll(
      Layer.succeed(PushSubscriptionPortTag, pushSubscriptionPort),
      Layer.succeed(NotificationDeliveryPortTag, deliveryPort),
      Layer.succeed(NotificationServicePortTag, servicePort),
    );

    const handlerRuntime = yield* Layer.toRuntime(handlerLayer);
    eventBus.setRuntime(handlerRuntime);

    yield* Effect.log("EventBus handler runtime initialized");
  });
};
