import { ORPCError } from "@orpc/server";
import { normalizeSupabaseStoragePath } from "../../../utils/storage";
import { STANDARD_BUCKETS } from "@mirai-app/shared";

export const KNOWN_BUCKETS = new Set<string>(Object.values(STANDARD_BUCKETS));

export const resolveStoragePath = (value: string) => {
  const info = normalizeSupabaseStoragePath(value);
  if (!info) {
    throw new ORPCError("BAD_REQUEST", { message: "Unsupported storage reference" });
  }
  if (!KNOWN_BUCKETS.has(info.bucket)) {
    throw new ORPCError("BAD_REQUEST", { message: "Invalid storage bucket" });
  }
  return info;
};

export const getResumableEndpoint = () => {
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Missing SUPABASE_URL" });
  }

  try {
    const url = new URL(baseUrl);
    const host = url.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      url.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/upload/resumable/sign";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${baseUrl.replace(/\/$/, "")}/storage/v1/upload/resumable/sign`;
  }
};

export const getPublicUrl = () => {
  const baseUrl = process.env.SUPABASE_PUBLIC_URL ?? process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Missing SUPABASE_URL or SUPABASE_PUBLIC_URL",
    });
  }

  try {
    const url = new URL(baseUrl);
    const host = url.host;
    if (host.endsWith(".supabase.co") && !host.includes(".storage.")) {
      url.host = host.replace(".supabase.co", ".storage.supabase.co");
    }
    url.pathname = "/storage/v1/object/public";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public`;
  }
};
