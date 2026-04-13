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
    console.warn(
      `Failed to create Supabase Auth user for ${email}: ${error?.message ?? "unknown error"}`,
    );
    return null;
  }
  console.log(`Created Supabase Auth user for ${email}`);
  return data.user;
};

export const ensureGhostAuthUser = async (authUsers: AuthUserByEmail) => {
  const client = getSupabaseClient();
  if (!env.seedGhostEmail) return null;
  const email = env.seedGhostEmail.trim();
  let user = authUsers.get(email.toLowerCase()) ?? null;
  if (user) return user;
  if (!env.seedGhostPassword) {
    console.warn(
      `Ghost user ${email} missing and SEED_GHOST_PASSWORD not set; skipping ghost auth creation.`,
    );
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
    console.warn(
      `Failed to create ghost auth user ${email}: ${error?.message ?? "unknown error"}`,
    );
    return null;
  }
  console.log(`Created ghost auth user ${email}`);
  authUsers.set(email.toLowerCase(), data.user);
  return data.user;
};
