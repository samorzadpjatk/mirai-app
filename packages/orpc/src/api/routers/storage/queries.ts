import { ORPCError } from "@orpc/server";
import { resolveStoragePath, getResumableEndpoint, getPublicUrl } from "./utils";

export const createUploadUrl = async (
  context: {
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUploadUrl: (
            path: string,
            options: { upsert: boolean },
          ) => Promise<{ data: { token?: string | null } | null; error: unknown }>;
        };
      };
    };
  },
  input: {
    storagePath: string;
    upsert?: boolean;
    fileSize?: number;
    contentType?: string;
  },
) => {
  const objectInfo = resolveStoragePath(input.storagePath);

  const { data, error } = await context.supabase.storage
    .from(objectInfo.bucket)
    .createSignedUploadUrl(objectInfo.path, { upsert: Boolean(input.upsert) });

  if (error || !data?.token) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Unable to create signed upload URL",
    });
  }

  return {
    resumableUrl: getResumableEndpoint(),
    token: data.token,
    bucket: objectInfo.bucket,
    objectPath: objectInfo.path,
    storagePath: objectInfo.storagePath,
  };
};

export const createDownloadUrl = async (
  context: {
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: { message?: string } | null }>;
        };
      };
    };
  },
  input: {
    storagePath: string;
    expiresInSeconds?: number;
  },
) => {
  const objectInfo = resolveStoragePath(input.storagePath);
  const expiresIn = input.expiresInSeconds ?? 10 * 60;

  const { data, error } = await context.supabase.storage
    .from(objectInfo.bucket)
    .createSignedUrl(objectInfo.path, expiresIn);

  if (error || !data?.signedUrl) {
    const message =
      typeof error?.message === "string" ? error.message : "Unable to create signed URL";
    const looksLikeNotFound =
      message.toLowerCase().includes("not found") ||
      message.toLowerCase().includes("does not exist");

    throw new ORPCError(looksLikeNotFound ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR", {
      message: looksLikeNotFound ? "Storage object not found" : "Unable to create signed URL",
    });
  }

  let signedUrl = data.signedUrl;
  const publicUrl = process.env.SUPABASE_PUBLIC_URL;
  if (publicUrl) {
    try {
      const signed = new URL(signedUrl);
      const pub = new URL(publicUrl);
      signed.host = pub.host;
      signed.protocol = pub.protocol;
      signed.port = pub.port;
      signedUrl = signed.toString();
    } catch {
      // If URL parsing fails, fall back to the original signed URL
    }
  }

  return {
    signedUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
};

export const createPublicUrl = (
  _context: unknown,
  input: {
    storagePath: string;
  },
) => {
  const objectInfo = resolveStoragePath(input.storagePath);

  if (objectInfo.bucket !== "files-public") {
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Public URLs are only available for files-public bucket. Use createDownloadUrl for other buckets.",
    });
  }

  const publicUrlBase = getPublicUrl();

  return {
    publicUrl: `${publicUrlBase}/${objectInfo.bucket}/${objectInfo.path}`,
  };
};
