import { createTRPCRouter } from "./server";
import type { TRPCRouterRecord } from "@trpc/server";

/**
 * Router Factory Utilities
 *
 * Helper functions for creating tRPC routers following Clean Architecture patterns.
 * These utilities promote consistency across the API surface.
 */

/**
 * Creates a namespaced tRPC router
 *
 * This helper ensures consistent router naming and structure across the API.
 *
 * @param name - The router namespace (e.g., "user", "challenge")
 * @param routes - The router record defining procedures
 * @returns The configured tRPC router
 *
 * @example
 * ```typescript
 * import { createNamespaceRouter } from "@repo/frameworks/trpc/router-factory";
 * import { protectedProcedure } from "@repo/frameworks/trpc/server";
 * import { z } from "zod";
 *
 * export const userRouter = createNamespaceRouter("user", {
 *   get: protectedProcedure
 *     .input(z.object({ id: z.string() }))
 *     .query(async ({ ctx, input }) => {
 *       return ctx.db.user.findUnique({ where: { id: input.id } });
 *     }),
 *
 *   list: protectedProcedure
 *     .query(async ({ ctx }) => {
 *       return ctx.db.user.findMany();
 *     }),
 * });
 * ```
 */
export function createNamespaceRouter<T extends TRPCRouterRecord>(
  name: string,
  routes: T,
): ReturnType<typeof createTRPCRouter<T>> {
  console.log(`[Router Factory] Creating router: ${name}`);
  return createTRPCRouter(routes);
}

/**
 * Router naming conventions
 *
 * These conventions ensure consistent API structure:
 *
 * - **Entity routers**: Named after the domain entity (user, challenge, group)
 * - **Action routers**: Named after the action domain (notificationSender, activityFeed)
 * - **Resource routers**: Named after the resource (storage, coin)
 */
export const ROUTER_NAMING = {
  /**
   * Entity-based router names
   */
  entities: [
    "user",
    "group",
    "challenge",
    "trip",
    "location",
    "reward",
    "sponsor",
  ] as const,

  /**
   * Action-based router names
   */
  actions: [
    "notification",
    "notificationSchedule",
    "notificationDelivery",
    "notificationSender",
    "activityFeed",
    "challengeSubmission",
    "challengeVote",
    "submissionReport",
  ] as const,

  /**
   * Resource-based router names
   */
  resources: ["storage", "coin", "coinTransaction"] as const,
};

/**
 * Common router patterns documentation
 *
 * Follow these patterns when creating new routers:
 *
 * ## CRUD Pattern
 * ```typescript
 * {
 *   // Create
 *   create: protectedProcedure
 *     .input(CreateInputSchema)
 *     .mutation(async ({ ctx, input }) => { ... }),
 *
 *   // Read (single)
 *   get: protectedProcedure
 *     .input(z.object({ id: z.string() }))
 *     .query(async ({ ctx, input }) => { ... }),
 *
 *   // Read (list)
 *   list: protectedProcedure
 *     .query(async ({ ctx }) => { ... }),
 *
 *   // Update
 *   update: protectedProcedure
 *     .input(UpdateInputSchema)
 *     .mutation(async ({ ctx, input }) => { ... }),
 *
 *   // Delete
 *   delete: protectedProcedure
 *     .input(z.object({ id: z.string() }))
 *     .mutation(async ({ ctx, input }) => { ... }),
 * }
 * ```
 *
 * ## Real-time Pattern
 * ```typescript
 * {
 *   // Subscription for real-time updates
 *   onUpdate: protectedProcedure
 *     .subscription(async function* ({ ctx, input, signal }) {
 *       // Implementation using async generators
 *     }),
 * }
 * ```
 */
export const ROUTER_PATTERNS = {
  /**
   * Standard CRUD operation names
   */
  crud: {
    create: "create",
    read: "get",
    list: "list",
    update: "update",
    delete: "delete",
  },

  /**
   * Real-time operation names
   */
  realtime: {
    subscribe: "onUpdate",
    subscribeAll: "onChanges",
  },
};

/**
 * Type helper for router configuration
 *
 * Use this type to ensure your router configuration
 * follows the expected patterns.
 */
export type RouterConfig<T extends TRPCRouterRecord> = {
  name: string;
  routes: T;
  tags?: string[];
};

/**
 * Validates router configuration
 *
 * Performs runtime checks on router configuration to catch common mistakes.
 *
 * @param config - Router configuration to validate
 * @returns Validated configuration
 */
export function validateRouterConfig<T extends TRPCRouterRecord>(
  config: RouterConfig<T>,
): RouterConfig<T> {
  // Check for required properties
  if (!config.name) {
    throw new Error("Router must have a name");
  }

  if (!config.routes || Object.keys(config.routes).length === 0) {
    throw new Error(`Router "${config.name}" must have at least one route`);
  }

  // Check for naming conventions
  const reservedNames = ["trpc", "router", "procedure"];
  if (reservedNames.includes(config.name.toLowerCase())) {
    throw new Error(`Router name "${config.name}" is reserved`);
  }

  console.log(`[Router Factory] Validated router: ${config.name}`);
  return config;
}
