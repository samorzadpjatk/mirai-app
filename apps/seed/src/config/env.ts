export const env = {
  supabaseUrl: process.env.SUPABASE_URL!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  imageBucket: process.env.SUPABASE_STORAGE_IMAGE_BUCKET!,
  videoBucket: process.env.SUPABASE_STORAGE_VIDEO_BUCKET!,
  publicBucket: process.env.SUPABASE_STORAGE_PUBLIC_BUCKET!,
  seedGhostEmail: process.env.SEED_GHOST_EMAIL!,
  seedGhostPassword: process.env.SEED_GHOST_PASSWORD!,
  databaseUrl: process.env.DATABASE_URL!,
};
