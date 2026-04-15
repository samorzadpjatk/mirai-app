/**
 * Backend Server Entry Point
 *
 * Hono + GraphQL Yoga server using the frameworks layer.
 * Leverages existing Effect DI, controllers, and GraphQL schema.
 */
import { Hono } from "hono";
import {
  createYogaHandler,
  createSimpleContextFactory,
} from "@mirai-app/frameworks/graphql";
import { makeAppLayer } from "@mirai-app/frameworks/layers";
import { createControllers, type Controllers } from "@mirai-app/adapters";
import {
  createDrizzleClient,
  type DrizzleDb,
} from "@mirai-app/frameworks/drizzle";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase";
import type { Layer } from "effect";

// =============================================================================
// Environment Configuration
// =============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://localhost:8000";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const PORT = parseInt(process.env.PORT ?? "4000", 10);
const NODE_ENV = process.env.NODE_ENV ?? "development";

// =============================================================================
// Types for Hono Context Variables
// =============================================================================

type HonoVariables = {
  db: DrizzleDb;
  appLayer: Layer.Layer<never>;
  controllers: Controllers;
};

// =============================================================================
// Server Initialization
// =============================================================================

async function main() {
  console.log("Starting Mirai App Backend Server...");
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Port: ${PORT}`);

  // Validate environment
  if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is required");
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required",
    );
    process.exit(1);
  }

  // Initialize database client
  const db = createDrizzleClient(DATABASE_URL);
  console.log("Database client initialized");

  // Initialize Supabase client
  const supabase = createSupabaseClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );
  console.log("Supabase client initialized");

  // Create Effect DI layer
  const appLayer = makeAppLayer({ supabase, db });
  console.log("Effect DI layer created");

  // Create controllers factory
  const controllers = createControllers({ appLayer, supabase });
  console.log("Controllers initialized");

  // Create GraphQL Yoga handler
  const yoga = createYogaHandler({
    enableGraphiQL: NODE_ENV === "development",
    contextFactory: createSimpleContextFactory(),
  });
  console.log("GraphQL Yoga handler created");

  // Create Hono app with typed variables
  const app = new Hono<{ Variables: HonoVariables }>();

  // Simple logger middleware
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(
      `${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`,
    );
  });

  // CORS headers middleware
  app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    c.header("Access-Control-Allow-Credentials", "true");

    if (c.req.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    await next();
  });

  // Database and DI middleware - injects db and appLayer into context
  app.use("*", async (c, next) => {
    c.set("db", db);
    c.set("appLayer", appLayer);
    c.set("controllers", controllers);
    await next();
  });

  // Health check endpoint
  app.get("/health", (c) => {
    return c.json({
      status: "healthy",
      service: "mirai-backend",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // GraphQL endpoint
  app.all("/graphql", async (c) => {
    return yoga.handle(c.req.raw, { context: c });
  });

  // Root endpoint - redirect to GraphiQL in dev, show info in prod
  app.get("/", (c) => {
    if (NODE_ENV === "development") {
      return c.redirect("/graphql");
    }
    return c.json({
      name: "Mirai App Backend API",
      version: "1.0.0",
      graphqlEndpoint: "/graphql",
      healthEndpoint: "/health",
    });
  });

  // Start server
  console.log(`\nServer ready at http://localhost:${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  if (NODE_ENV === "development") {
    console.log(`GraphiQL playground: http://localhost:${PORT}/graphql`);
  }

  const server = Bun.serve({
    port: PORT,
    fetch: app.fetch,
  });

  console.log("\nServer running! Press Ctrl+C to stop.\n");

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\nShutting down server...");
    server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down server...");
    server.stop();
    process.exit(0);
  });
}

// Run server
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
