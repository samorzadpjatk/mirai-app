import { Effect, type Layer } from "effect";
import { createYoga } from "graphql-yoga";
import type { Hono } from "hono";
import { schema } from "@mirai-app/frameworks/graphql";

/**
 * GraphQL context configuration
 */
export interface GraphQLServerConfig {
  /** The application layer for running Effects with dependencies */
  appLayer: Layer.Layer<unknown, never, never>;
}

/**
 * Create GraphQL context for each request
 */
const createGraphQLContext = ({
  request,
  appLayer,
}: {
  request: Request;
  appLayer: Layer.Layer<unknown, never, never>;
}) =>
  Effect.sync(() => {
    // Create a function to run Effects with the app layer
    const runWithAppLayer = <T>(effect: Effect.Effect<T, unknown, unknown>) =>
      Effect.runPromise(effect.pipe(Effect.provide(appLayer)));

    return {
      request,
      runWithAppLayer,
    };
  });

/**
 * Create GraphQL Yoga server
 */
export const createYogaServer = (config: GraphQLServerConfig) =>
  Effect.sync(() =>
    createYoga({
      schema,
      context: async ({ request }) => {
        return await Effect.runPromise(
          createGraphQLContext({ request, appLayer: config.appLayer }),
        );
      },
    }),
  );

/**
 * Mount GraphQL endpoint on Hono app
 */
export const mountGraphQLEndpoint = (
  app: Hono,
  yoga: ReturnType<typeof createYoga>,
) =>
  Effect.sync(() => {
    app.all("/graphql", (c) => yoga.handle(c.req.raw));
    return app;
  });
