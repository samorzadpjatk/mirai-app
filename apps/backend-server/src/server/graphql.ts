import { Effect } from "effect";
import { createYoga } from "graphql-yoga";
import type { Hono } from "hono";
import { schema } from "@mirai-app/frameworks/graphql";

/**
 * Create GraphQL context for each request
 */
const createGraphQLContext = ({ request }: { request: Request }) =>
  Effect.sync(() => ({
    request,
  }));

/**
 * Create GraphQL Yoga server
 */
export const createYogaServer = () =>
  Effect.sync(() =>
    createYoga({
      schema,
      context: async ({ request }) => {
        return await Effect.runPromise(createGraphQLContext({ request }));
      },
    })
  );

/**
 * Mount GraphQL endpoint on Hono app
 */
export const mountGraphQLEndpoint = (app: Hono, yoga: ReturnType<typeof createYoga>) =>
  Effect.sync(() => {
    app.all("/graphql", (c) => yoga.handle(c.req.raw));
    return app;
  });
