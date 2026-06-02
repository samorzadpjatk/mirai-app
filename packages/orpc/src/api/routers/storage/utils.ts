import { ORPCError } from "@orpc/server";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
import { STANDARD_BUCKETS } from "@mirai-app/shared";
import {
  buildResumableUrl,
  buildPublicObjectUrl,
  validateKnownBucket,
} from "@mirai-app/shared/storage";

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
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Missing SUPABASE_URL" });
  }

  return buildResumableUrl(baseUrl);
};

export const getPublicUrl = () => {
  const baseUrl = process.env.SUPABASE_PUBLIC_URL ?? process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Missing SUPABASE_URL or SUPABASE_PUBLIC_URL",
    });
  }

  return buildPublicObjectUrl(baseUrl);
};
