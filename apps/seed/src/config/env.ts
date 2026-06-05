const bunEnv = typeof Bun !== "undefined" ? Bun.env : undefined;

export const env = {
  supabaseUrl: bunEnv?.SUPABASE_URL,
  serviceRoleKey: bunEnv?.SUPABASE_SERVICE_ROLE_KEY,
  imageBucket: bunEnv?.SUPABASE_STORAGE_IMAGE_BUCKET ?? "image",
  videoBucket: bunEnv?.SUPABASE_STORAGE_VIDEO_BUCKET ?? "video",
  publicBucket: bunEnv?.SUPABASE_STORAGE_PUBLIC_BUCKET ?? "files-public",
  seedGhostEmail: bunEnv?.SEED_GHOST_EMAIL,
  seedGhostPassword: bunEnv?.SEED_GHOST_PASSWORD,
  databaseUrl: bunEnv?.DATABASE_URL,
};
