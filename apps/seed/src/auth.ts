import { env } from "./config/env";
import { supabase } from "./config/supabase";
import type { AuthUserByEmail } from "./types";
import { logger } from "@mirai-app/shared";

export const loadAuthUsers = async (): Promise<AuthUserByEmail> => {
  const perPage = 1000;
  let page = 1;
  const map: AuthUserByEmail = new Map();
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
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
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { firstName, lastName },
    app_metadata: { role },
  });
  if (error || !data.user) {
    logger.warn(
      `Failed to create Supabase Auth user for ${email}: ${error?.message ?? "unknown error"}`,
    );
    return null;
  }
    logger.info(`Created Supabase Auth user for ${email}`);
  return data.user;
};

export const ensureGhostAuthUser = async (authUsers: AuthUserByEmail) => {
  if (!env.seedGhostEmail) return null;
  const email = env.seedGhostEmail.trim();
  const user = authUsers.get(email.toLowerCase()) ?? null;
  if (user) return user;
  if (!env.seedGhostPassword) {
    logger.warn(
      `Ghost user ${email} missing and SEED_GHOST_PASSWORD not set; skipping ghost auth creation.`,
    );
    return null;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: env.seedGhostPassword,
    email_confirm: true,
    user_metadata: { firstName: "Ghost", lastName: "User" },
    app_metadata: { role: "user" },
  });
  if (error || !data.user) {
    logger.warn(`Failed to create ghost auth user ${email}: ${error?.message ?? "unknown error"}`);
    return null;
  }
    logger.info(`Created ghost auth user ${email}`);
  authUsers.set(email.toLowerCase(), data.user);
  return data.user;
};
