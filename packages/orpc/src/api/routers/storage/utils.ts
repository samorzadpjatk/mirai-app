import {
  buildPublicObjectUrl,
  buildResumableUrl,
  STANDARD_BUCKETS,
  validateKnownBucket,
} from "@mirai-app/common/storage";
import { ORPCError } from "@orpc/server";
import { env } from "bun";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";

const KNOWN_BUCKETS = new Set<string>(Object.values(STANDARD_BUCKETS));

export const resolveStoragePath = (value: string) => {
  const info = normalizeSupabaseStoragePath(value);
  if (!info) {
    throw new ORPCError("BAD_REQUEST", { message: "Unsupported storage reference" });
  }
  const bucketValidation = validateKnownBucket(info.bucket, KNOWN_BUCKETS);
  if (!bucketValidation.valid) {
    throw new ORPCError("BAD_REQUEST", { message: bucketValidation.error });
  }
  return info;
};

export const getResumableEndpoint = () => {
  const baseUrl = env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Missing SUPABASE_URL" });
  }

  return buildResumableUrl(baseUrl);
};

export const getPublicUrl = () => {
  const baseUrl = env.SUPABASE_PUBLIC_URL ?? env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Missing SUPABASE_URL or SUPABASE_PUBLIC_URL",
    });
  }

  return buildPublicObjectUrl(baseUrl);
};
