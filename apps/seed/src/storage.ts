import { logger } from "@mirai-app/shared";
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
  const listResult = await supabase.storage.listBuckets();
  if (listResult.error) throw new Error(`listBuckets failed: ${listResult.error.message}`);

  const data = listResult.data;
  const seen = new Set(data?.map((b: { name: string }) => b.name));
  const desired = [env.publicBucket, env.imageBucket, env.videoBucket];

  for (const bucket of desired) {
    if (seen.has(bucket)) continue;
    const createResult = await supabase.storage.createBucket(bucket, {
      public: bucket === env.publicBucket,
    });
    if (createResult.error)
      throw new Error(`createBucket ${bucket} failed: ${createResult.error.message}`);
    logger.info(`Created bucket ${bucket}`);
  }
};

export const ensurePlaceholderImage = async (seedEnv: SeedEnv) => {
  const placeholderPath = "image/placeholder/trip-background.png";

  // Check if placeholder already exists
  const { data: existingFile } = await supabase.storage
    .from(env.imageBucket)
    .list("image/placeholder", { search: "trip-background.png" });

  if (existingFile && existingFile.length > 0) {
    logger.info("✓ Placeholder image already exists");
    return;
  }

  // Create a simple placeholder image (you would need to have this file in your assets)
  const placeholderAbsPath = joinPath(
    assetsRoot,
    seedEnv,
    "images/placeholder/trip-background.png",
  );
  try {
    const placeholderFile: BunFile = readFile(placeholderAbsPath);
    const uploadResult = await supabase.storage
      .from(env.imageBucket)
      .upload(placeholderPath, placeholderFile, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadResult.error) {
      logger.warn(`✗ Failed to upload placeholder image: ${uploadResult.error.message}`);
    } else {
      logger.info(`✓ Uploaded placeholder image: ${placeholderPath}`);
    }
  } catch {
    logger.warn(`✗ Placeholder image file not found at ${placeholderAbsPath}`);
    logger.info(
      `  Note: Add a placeholder image at apps/seed/assets/${seedEnv}/images/placeholder/trip-background.png`,
    );
  }
};

export const cleanupOldAssets = async () => {
  const oldPaths = ["sponsors/example-sponsor.png"];

  for (const path of oldPaths) {
    const { error } = await supabase.storage.from(env.imageBucket).remove([path]);
    if (error) {
      logger.warn(`✗ Failed to remove old asset ${env.imageBucket}/${path}: ${error.message}`);
    } else {
      logger.info(`✓ Removed old asset: ${env.imageBucket}/${path}`);
    }
  }
};

export const cleanupTripBackground = async (tripKey: string) => {
  const path = `trips/${tripKey}/background.jpg`;
  const { error } = await supabase.storage.from(env.imageBucket).remove([path]);
  if (error) {
    logger.warn(
      `✗ Failed to remove old trip background ${env.imageBucket}/${path}: ${error.message}`,
    );
  } else {
    logger.info(`✓ Removed old trip background: ${env.imageBucket}/${path}`);
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

    const [prefix, bucketFn] = bucketEntry;
    const bucketName = bucketFn();
    const objectPath =
      prefix === "rewards"
        ? rel // keep rewards/ namespace inside images bucket
        : rel.replace(new RegExp(`^${prefix}/`), "");

    const file: BunFile = readFile(absPath);
    const fileStat = await file.stat();
    const size: number = fileStat.size;
    if (!size) continue;

    const uploadResult = await supabase.storage.from(bucketName).upload(objectPath, file, {
      upsert: true,
    });
    if (uploadResult.error) {
      logger.warn(`✗ Upload failed ${bucketName}/${objectPath}: ${uploadResult.error.message}`);
    } else {
      logger.info(`✓ Uploaded ${bucketName}/${objectPath}`);
    }
  }
};
