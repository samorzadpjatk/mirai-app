export const classifyStorageError = (
  message: string,
): { code: "NOT_FOUND" | "INTERNAL_SERVER_ERROR"; message: string } => {
  const looksLikeNotFound =
    message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist");

  return {
    code: looksLikeNotFound ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
    message: looksLikeNotFound ? "Storage object not found" : "Unable to create signed URL",
  };
};

export const isPublicBucket = (bucket: string): boolean => {
  return bucket === "files-public";
};

export const validateKnownBucket = (
  bucket: string,
  knownBuckets: Set<string>,
): { valid: boolean; error?: string } => {
  if (knownBuckets.has(bucket)) {
    return { valid: true };
  }
  return { valid: false, error: "Invalid storage bucket" };
};
