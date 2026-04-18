import { Effect, Layer } from "effect";
import { createYoga } from "graphql-yoga";
import type { Hono } from "hono";
import { schema } from "@mirai-app/frameworks/graphql";
import {
  AuthContextTag,
  type AuthContext,
  type TripRole,
} from "@mirai-app/frameworks/effect";
import type { Role } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import { tripParticipants, users } from "@mirai-app/frameworks/drizzle";
import { eq } from "drizzle-orm";

/**
 * GraphQL context configuration
 */
export interface GraphQLServerConfig {
  /** The application layer for running Effects with dependencies */
  appLayer: Layer.Layer<unknown, never, never>;
  /** Database client for auth context queries */
  db: DrizzleDb;
  /** Supabase client for JWT validation */
  supabase: SupabaseClient;
}

/**
 * Extract Bearer token from Authorization header
 */
const extractAuthToken = (request: Request): string | null => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1] ?? null;
};

/**
 * Map database role to Role type
 */
const mapDatabaseRole = (role: string): Role => {
  switch (role) {
    case "ADMIN":
      return "ADMIN";
    case "MODERATOR":
      return "MODERATOR";
    case "SERVICE":
      return "SERVICE";
    default:
      return "USER";
  }
};

/**
 * Map trip participant role to TripRole type
 */
const mapTripRole = (role: string): TripRole => {
  return role === "LEADER" ? "LEADER" : "MEMBER";
};

/**
 * Build AuthContext by validating JWT and fetching user data
 */
const buildAuthContext = async (
  token: string,
  db: DrizzleDb,
  supabase: SupabaseClient,
): Promise<AuthContext | null> => {
  try {
    // Validate JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    const authUserId = data.user.id;

    // Fetch user from database to get user ID and role
    const userResult = await db.query.users.findFirst({
      where: eq(users.authUserId, authUserId),
    });

    if (!userResult) {
      return null;
    }

    const userId = userResult.id;
    const role = mapDatabaseRole(userResult.role);

    // Fetch trip participants to build tripRoles map
    const participants = await db.query.tripParticipants.findMany({
      where: eq(tripParticipants.userId, userId),
    });

    const tripRoles: Record<string, TripRole> = {};
    for (const participant of participants) {
      tripRoles[participant.tripId] = mapTripRole(participant.role);
    }

    return {
      userId,
      role,
      tripRoles,
      isAuthenticated: true,
      accessToken: token,
    };
  } catch {
    return null;
  }
};

/**
 * Create anonymous AuthContext for unauthenticated requests
 */
const createAnonymousAuthContext = (): AuthContext => ({
  userId: "",
  role: "USER",
  tripRoles: {},
  isAuthenticated: false,
});

/**
 * Create GraphQL context for each request
 */
const createGraphQLContext = ({
  request,
  appLayer,
  db,
  supabase,
}: {
  request: Request;
  appLayer: Layer.Layer<unknown, never, never>;
  db: DrizzleDb;
  supabase: SupabaseClient;
}) =>
  Effect.gen(function* () {
    // Extract token from Authorization header
    const token = extractAuthToken(request);

    // Build AuthContext (authenticated or anonymous)
    let authContext: AuthContext;
    if (token) {
      const validatedContext = yield* Effect.tryPromise({
        try: () => buildAuthContext(token, db, supabase),
        catch: () => null,
      });
      authContext = validatedContext ?? createAnonymousAuthContext();
    } else {
      authContext = createAnonymousAuthContext();
    }

    // Create AuthContext Layer to provide in Effect context
    const authContextLayer = Layer.succeed(AuthContextTag, authContext);

    // Merge appLayer with authContextLayer
    const fullLayer = Layer.merge(appLayer, authContextLayer);

    // Create a function to run Effects with the full layer (including AuthContext)
    const runWithAppLayer = <T>(effect: Effect.Effect<T, unknown, unknown>) =>
      Effect.runPromise(effect.pipe(Effect.provide(fullLayer)));

    return {
      request,
      runWithAppLayer,
      authContext,
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
          createGraphQLContext({
            request,
            appLayer: config.appLayer,
            db: config.db,
            supabase: config.supabase,
          }),
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
