import { env } from "./config/env";
import { getSupabaseClient } from "./config/supabase";
import type { AuthUserByEmail } from "./types";

export const loadAuthUsers = async (): Promise<AuthUserByEmail> => {
  const client = getSupabaseClient();
  const perPage = 1000;
  let page = 1;
  const map: AuthUserByEmail = new Map();
  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error || !data) break;
    for (const u of data.users) {
      if (u.email) {
        map.set(u.email.toLowerCase(), u);
      }
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  return map;
};

export const createAuthUserByEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  role: string,
) => {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { firstName, lastName },
    app_metadata: { role },
  });
  if (error || !data.user) {
    return null;
  }
  return data.user;
};

export const ensureGhostAuthUser = async (authUsers: AuthUserByEmail) => {
  const client = getSupabaseClient();
  if (!env.seedGhostEmail) return null;
  const email = env.seedGhostEmail.trim();
  let user = authUsers.get(email.toLowerCase()) ?? null;
  if (user) return user;
  if (!env.seedGhostPassword) {
    return null;
  }
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: env.seedGhostPassword,
    email_confirm: true,
    user_metadata: { firstName: "Ghost", lastName: "User" },
    app_metadata: { role: "user" },
  });
  if (error || !data.user) {
    return null;
  }
  authUsers.set(email.toLowerCase(), data.user);
  return data.user;
};
