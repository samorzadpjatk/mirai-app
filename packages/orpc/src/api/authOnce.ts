import { requireAuth } from "@mirai-app/auth";
import type { AuthUser } from "@mirai-app/common/stores";
import type { DB, User } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";

/**
 * Authenticate a request once, however many procedures it carries.
 *
 * `requireAuth` costs two HTTP round trips to GoTrue -- one to validate the token,
 * one to read `banned_until` -- plus a database lookup, and it used to run per
 * procedure. The client batches every call (`condition: () => true`), so a cold
 * start arrived as a handful of HTTP requests carrying 29 procedures between them
 * and produced 48 GoTrue calls for a single session. Measured on production: the
 * first call of each procedure returned in 318-704 ms while its duplicates took
 * 2.6-5.5 s, because the requests were queueing behind each other.
 *
 * The oRPC context is built per HTTP request (and per WebSocket message), so
 * memoising on that object resolves authentication exactly once per request. For a
 * client that does not batch, this is indistinguishable from the previous
 * behaviour; nothing is cached across requests, so a ban or an expired token takes
 * effect on the very next one.
 */
export interface AuthOnceContext {
  db: DB;
  supabase: SupabaseClient;
  accessToken?: string | null;
}

export interface AuthOnceResult {
  user: AuthUser;
  dbUser: User;
}

type AuthLoader = (context: AuthOnceContext) => Promise<AuthOnceResult>;

const defaultLoader: AuthLoader = (context) =>
  requireAuth(context.db, context.supabase, context.accessToken ?? undefined);

// Keyed by the context object, so an entry dies with the request that owns it.
const inFlight = new WeakMap<object, { token: string | null; promise: Promise<AuthOnceResult> }>();

export const resolveAuthOnce = (
  context: AuthOnceContext,
  loadAuth: AuthLoader = defaultLoader,
): Promise<AuthOnceResult> => {
  const token = context.accessToken ?? null;
  const cached = inFlight.get(context);

  if (cached && cached.token === token) {
    return cached.promise;
  }

  const promise = loadAuth(context);
  // A rejection is shared too: one failed authentication per request, rather than
  // every procedure in the batch repeating the same two failing GoTrue calls.
  promise.catch(() => undefined);
  inFlight.set(context, { token, promise });

  return promise;
};
