import { Effect, Layer } from "effect";
import type * as EffectTypes from "effect/Effect";
import { createYoga, type YogaServerInstance } from "graphql-yoga";
import type { Hono } from "hono";
import { schema } from "@mirai-app/frameworks/graphql";
import {
  AuthContextTag,
  type AuthContext,
  type TripRole,
} from "@mirai-app/frameworks/effect";
import type { Role } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { tripParticipants, users } from "@mirai-app/frameworks/drizzle";
import { eq } from "drizzle-orm";
import type { BetterAuthInstance } from "@mirai-app/frameworks/better-auth";

/**
 * GraphQL context for resolvers - contains request-specific context
 */
export interface GraphQLContext {
  /** The original HTTP request */
  request: Request;
  /** Function to run Effects with the full application layer including AuthContext */
  runWithAppLayer: <T, E>(effect: EffectTypes.Effect<T, E, unknown>) => Promise<T>;
  /** Authentication context for the current user */
  authContext: AuthContext;
}

/**
 * GraphQL server instance type with properly typed context
 */
export type TypedYogaServer = YogaServerInstance<{}, GraphQLContext>;

/**
 * GraphQL context configuration
 */
export interface GraphQLServerConfig {
  /** The application layer for running Effects with dependencies */
  appLayer: Layer.Layer<never>;
  /** Database client for auth context queries */
  db: DrizzleDb;
  /** Better Auth instance for session validation */
  betterAuth: BetterAuthInstance;
}

/**
 * Extract session cookie from request headers
 * Better Auth uses cookie-based sessions
 */
const extractSessionCookie = (request: Request): string | null => {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  return cookieHeader;
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
 * Better Auth session response type
 */
interface BetterAuthSessionResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
  } | null;
  session: {
    id: string;
    expiresAt: string;
  } | null;
}

/**
 * Build AuthContext by validating Better Auth session and fetching user data
 *
 * Uses Better Auth's cookie-based session validation. The session cookie
 * is automatically included in the request and validated by Better Auth.
 */
const buildAuthContext = async (
  cookieHeader: string,
  db: DrizzleDb,
  betterAuth: BetterAuthInstance,
): Promise<AuthContext | null> => {
  try {
    // Call Better Auth's session endpoint to validate the session
    // Better Auth validates the session cookie and returns user/session info
    const response = await betterAuth.api.getSession({
      headers: new Headers({ Cookie: cookieHeader }),
    });

    const result = response as BetterAuthSessionResponse | null;

    if (!result?.user || !result?.session) {
      return null;
    }

    // Fetch user role and trip roles from database
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, result.user.id),
      columns: { role: true },
    });

    const role: Role = mapDatabaseRole(userRecord?.role ?? "USER");

    // Fetch trip roles for the user
    const participantRecords = await db.query.tripParticipants.findMany({
      where: eq(tripParticipants.userId, result.user.id),
      columns: { tripId: true, role: true },
    });

    const tripRoles: Record<string, TripRole> = {};
    for (const record of participantRecords) {
      if (record.tripId) {
        tripRoles[record.tripId] = mapTripRole(record.role ?? "MEMBER");
      }
    }

    return {
      userId: result.user.id,
      role,
      tripRoles,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("[AuthContext] Session validation failed:", error);
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
  betterAuth,
}: {
  request: Request;
  appLayer: Layer.Layer<never>;
  db: DrizzleDb;
  betterAuth: BetterAuthInstance;
}) =>
  Effect.gen(function* () {
    // Extract session cookie from request
    const cookieHeader = extractSessionCookie(request);

    // Build AuthContext (authenticated or anonymous)
    let authContext: AuthContext;
    if (cookieHeader) {
      const validatedContext = yield* Effect.tryPromise({
        try: () => buildAuthContext(cookieHeader, db, betterAuth),
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
    const runWithAppLayer = <T, E>(effect: Effect.Effect<T, E, unknown>): Promise<T> =>
      Effect.runPromise(Effect.provide(effect, fullLayer) as Effect.Effect<T, E, never>);

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
  Effect.sync((): TypedYogaServer =>
    createYoga<{}, GraphQLContext>({
      schema,
      context: async ({ request }) => {
        return await Effect.runPromise(
          createGraphQLContext({
            request,
            appLayer: config.appLayer,
            db: config.db,
            betterAuth: config.betterAuth,
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
  yoga: TypedYogaServer,
) =>
  Effect.sync(() => {
    app.all("/api/graphql", (c) => yoga.handle(c.req.raw));
    return app;
  });
