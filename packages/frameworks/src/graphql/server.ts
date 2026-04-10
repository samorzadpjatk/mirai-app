import { Hono } from "hono";
import { createYoga } from "graphql-yoga";
import type { Schema } from "./schema";
import type { GraphQLContext } from "./builder";
import type { DIContext } from "../trpc";
import type { AuthPort } from "@mirai-app/use-cases";

/**
 * Create Hono App with GraphQL endpoint
 *
 * Phase 3: API Layer
 * - Hono web framework (lightweight, fast)
 * - GraphQL Yoga for GraphQL server
 * - Pothos schema builder integration
 * - Auth middleware
 * - DI container integration
 *
 * Strangler Fig Pattern:
 * - Hono runs alongside tRPC (different ports)
 * - Existing clients use tRPC (port 3000)
 * - New polyglot clients use GraphQL (port 4000)
 * - Gradual migration without breaking changes
 *
 * @example
 * ```typescript
 * // Start the server
 * const app = createHonoApp(schema, { getDIContext });
 * app.fire(4000);
 * ```
 */
export function createHonoApp(
  schema: Schema,
  options: {
    getDIContext: () => DIContext;
    authPort?: AuthPort;
  },
) {
  const app = new Hono();

  // Create GraphQL Yoga instance
  const yoga = createYoga({
    schema,
    // Custom context factory
    context: async ({ request }): Promise<GraphQLContext> => {
      const diContext = options.getDIContext();

      // Extract and validate auth token
      let authContext: GraphQLContext["authContext"] = undefined;

      if (options.authPort) {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.slice(7);
          const result = await options.authPort.validateToken(token);

          if (result.kind === "ok") {
            authContext = {
              userId: result.value.userId.toString(),
              role: result.value.role,
            };
          }
        }
      }

      return {
        container: diContext.container,
        authContext,
        requestId: crypto.randomUUID(),
      };
    },
  });

  // Health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      service: "graphql",
      timestamp: new Date().toISOString(),
    });
  });

  // GraphQL endpoint
  app.all("/graphql", async (c) => {
    const response = await yoga.handle(c.req.raw);
    return response;
  });

  // GraphiQL endpoint (only in development)
  if (process.env.NODE_ENV !== "production") {
    app.get("/graphiql", async (c) => {
      return c.html(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>GraphiQL</title>
            <style>
              body { margin: 0; height: 100vh; }
              #graphiql { height: 100%; }
            </style>
            <script
              crossorigin
              src="https://unpkg.com/react@18/umd/react.development.js"
            ></script>
            <script
              crossorigin
              src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"
            ></script>
            <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
          </head>
          <body>
            <div id="graphiql"></div>
            <script
              src="https://unpkg.com/graphiql/graphiql.min.js"
              type="application/javascript"
            ></script>
            <script>
              ReactDOM.render(
                React.createElement(GraphiQL, {
                  fetcher: GraphiQL.createFetcher({ url: '/graphql' }),
                  defaultEditorToolsVisibility: true,
                }),
                document.getElementById('graphiql'),
              );
            </script>
          </body>
        </html>
      `);
    });
  }

  return app;
}

/**
 * Start Hono GraphQL server
 *
 * @param schema - Pothos GraphQL schema
 * @param options - Server configuration
 * @returns Server instance
 */
export async function startHonoServer(
  schema: Schema,
  options: {
    port: number;
    getDIContext: () => DIContext;
    authPort?: AuthPort;
  },
) {
  const app = createHonoApp(schema, {
    getDIContext: options.getDIContext,
    authPort: options.authPort,
  });

  // Bun-specific server start
  const server = Bun.serve({
    port: options.port,
    fetch: app.fetch,
  });

  console.log(
    `🚀 GraphQL server ready at http://localhost:${options.port}/graphql`,
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `📊 GraphiQL available at http://localhost:${options.port}/graphiql`,
    );
  }

  return server;
}
