export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  imageBucket: process.env.SUPABASE_STORAGE_IMAGE_BUCKET ?? "image",
  videoBucket: process.env.SUPABASE_STORAGE_VIDEO_BUCKET ?? "video",
  publicBucket: process.env.SUPABASE_STORAGE_PUBLIC_BUCKET ?? "files-public",
  seedGhostEmail: process.env.SEED_GHOST_EMAIL,
  seedGhostPassword: process.env.SEED_GHOST_PASSWORD,
  databaseUrl: process.env.DATABASE_URL,
};
