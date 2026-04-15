import { authStore, type AuthUser } from "@mirai-app/frameworks/auth/client";
import { supabase } from "./supabase";
import { urqlClient } from "./urql-client";

interface UserGetMyResponse {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
}

/**
 * Execute GraphQL query to fetch current user using urql
 */
async function executeGetMyUser(): Promise<UserGetMyResponse | null> {
  const GET_ME_QUERY = `
    query GetMe {
      me {
        id
        authUserId
        firstName
        lastName
        role
      }
    }
  `;

  const result = await urqlClient.query(GET_ME_QUERY, {}).toPromise();

  if (result.error) {
    throw result.error;
  }

  const me = result.data?.me;
  if (!me) return null;

  // Map to our interface (email is not in the response, will be handled separately if needed)
  return {
    id: me.id,
    authUserId: me.authUserId,
    email: null, // Not available in GetCurrentUserDocument - fetched separately if needed
    firstName: me.firstName ?? null,
    lastName: me.lastName ?? null,
    role: me.role,
  };
}

const mapToAuthUser = (user: {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
}): AuthUser => ({
  id: user.id,
  authUserId: user.authUserId,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  name:
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user.firstName ?? user.lastName ?? null),
  emailVerified: null,
  role: user.role,
});

export const onAuthUserFetch = async (
  authUserId: string,
): Promise<AuthUser | null> => {
  const session = authStore.getState().session;
  if (!session?.access_token) {
    return null;
  }

  try {
    const me = await executeGetMyUser();
    if (me?.authUserId !== authUserId) {
      return null;
    }

    return mapToAuthUser({
      id: me.id,
      authUserId: me.authUserId,
      email: me.email ?? null,
      firstName: me.firstName ?? null,
      lastName: me.lastName ?? null,
      role: me.role,
    });
  } catch {
    const { data, error: supabaseError } = await supabase.auth.getUser(
      session.access_token,
    );
    if (supabaseError || data.user?.id !== authUserId) {
      return null;
    }

    const firstName =
      typeof data.user.user_metadata?.firstName === "string"
        ? data.user.user_metadata.firstName
        : null;
    const lastName =
      typeof data.user.user_metadata?.lastName === "string"
        ? data.user.user_metadata.lastName
        : null;

    return mapToAuthUser({
      id: data.user.id,
      authUserId: data.user.id,
      email: data.user.email ?? null,
      firstName,
      lastName,
      role: (data.user.app_metadata?.role as AuthUser["role"]) || "USER",
    });
  }
};

export const checkIsAdminUser = async () => {
  const session = authStore.getState().session;
  if (!session?.access_token) {
    return false;
  }

  try {
    const me = await executeGetMyUser();
    if (!me) {
      return false;
    }

    return me.role === "ADMIN";
  } catch {
    const { data, error } = await supabase.auth.getUser(session.access_token);
    if (error || !data.user) {
      return false;
    }
    return data.user.app_metadata?.role === "ADMIN";
  }
};
