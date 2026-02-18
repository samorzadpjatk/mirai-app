import { env } from "./config/env";
import { supabase } from "./config/supabase";
import { assetsRoot } from "./constants";
import type { SeedEnv } from "./types";
import { listFilesRecursive, readFile } from "./utils/fs";
import { joinPath, normalizePath, relativePath } from "./utils/path";

export const BUCKET_MAP = {
  public: () => env.publicBucket,
  images: () => env.imageBucket,
  videos: () => env.videoBucket,
  "trip/images": () => env.imageBucket,
  "trip/videos": () => env.videoBucket,
  rewards: () => env.imageBucket,
} as const;

export const ensureBuckets = async () => {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets failed: ${error.message}`);

  const seen = new Set(data?.map((b) => b.name));
  const desired = [env.publicBucket, env.imageBucket, env.videoBucket];

  for (const bucket of desired) {
    if (seen.has(bucket)) continue;
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: bucket === env.publicBucket,
    });
    if (createError) throw new Error(`createBucket ${bucket} failed: ${createError.message}`);
    console.log(`Created bucket ${bucket}`);
  }
};

export const ensurePlaceholderImage = async (seedEnv: SeedEnv) => {
  const placeholderPath = "image/placeholder/trip-background.png";
  
  // Check if placeholder already exists
  const { data: existingFile } = await supabase.storage
    .from(env.imageBucket)
    .list("image/placeholder", { search: "trip-background.png" });
    
  if (existingFile && existingFile.length > 0) {
    console.log("✓ Placeholder image already exists");
    return;
  }
  
  // Create a simple placeholder image (you would need to have this file in your assets)
  const placeholderAbsPath = joinPath(assetsRoot, seedEnv, "images/placeholder/trip-background.png");
  try {
    const placeholderFile = readFile(placeholderAbsPath);
    const { error } = await supabase.storage
      .from(env.imageBucket)
      .upload(placeholderPath, placeholderFile, {
        upsert: true,
        contentType: "image/png",
      });
      
    if (error) {
      console.warn(`✗ Failed to upload placeholder image: ${error.message}`);
    } else {
      console.log(`✓ Uploaded placeholder image: ${placeholderPath}`);
    }
  } catch (err) {
    console.warn(`✗ Placeholder image file not found at ${placeholderAbsPath}`);
    console.log(`  Note: Add a placeholder image at apps/seed/assets/${seedEnv}/images/placeholder/trip-background.png`);
  }
};

export const uploadAssets = async (seedEnv: SeedEnv) => {
  const envRoot = joinPath(assetsRoot, seedEnv);
  const files = await listFilesRecursive(envRoot);
  for (const absPath of files) {
    const rel = normalizePath(relativePath(envRoot, absPath));
    if (!rel || rel.startsWith("config/") || rel.startsWith("users/")) continue;

    const bucketEntry = Object.entries(BUCKET_MAP).find(([prefix]) => rel.startsWith(`${prefix}/`));
    if (!bucketEntry) continue;

    const [, bucketFn] = bucketEntry;
    const bucketName = bucketFn();
    const objectPath = rel.replace(/^[^/]+\//, "");

    const file = readFile(absPath);
    const { size } = await file.stat();
    if (!size) continue;

    const { error } = await supabase.storage.from(bucketName).upload(objectPath, file, {
      upsert: true,
    });
    if (error) {
      console.warn(`✗ Upload failed ${bucketName}/${objectPath}: ${error.message}`);
    } else {
      console.log(`✓ Uploaded ${bucketName}/${objectPath}`);
    }
  }
};
