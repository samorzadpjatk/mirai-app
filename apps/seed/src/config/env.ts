import { STANDARD_BUCKETS } from "@mirai-app/common/storage";

export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // These defaults must stay in sync with STANDARD_BUCKETS: the backend resolves
  // "images/..." and "videos/..." storage paths to those bucket names when it
  // signs URLs, so seeding into anything else uploads files nothing can read and
  // every seeded image falls back to a placeholder.
  imageBucket: process.env.SUPABASE_STORAGE_IMAGE_BUCKET ?? STANDARD_BUCKETS.IMAGES,
  videoBucket: process.env.SUPABASE_STORAGE_VIDEO_BUCKET ?? STANDARD_BUCKETS.VIDEOS,
  publicBucket: process.env.SUPABASE_STORAGE_PUBLIC_BUCKET ?? STANDARD_BUCKETS.PUBLIC,
  seedGhostEmail: process.env.SEED_GHOST_EMAIL,
  seedGhostPassword: process.env.SEED_GHOST_PASSWORD,
  databaseUrl: process.env.DATABASE_URL,
};
