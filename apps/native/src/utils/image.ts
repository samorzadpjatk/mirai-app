/**
 * Extracts the file extension from an ImagePicker asset.
 * Handles both images and videos. Falls back to mimeType detection or defaults to 'jpg'.
 */
export const getFileExtension = (asset: { fileName?: string | null; mimeType?: string | null }) => {
  if (asset.fileName) {
    const parts = asset.fileName.split(".");
    if (parts.length > 1) {
      const ext = parts[parts.length - 1]?.toLowerCase() ?? "";
      if (ext) return ext;
    }
  }

  const contentType = asset.mimeType ?? "";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") return "heic";
  if (contentType === "video/quicktime") return "mov";
  if (contentType === "video/x-m4v") return "m4v";
  if (contentType === "video/mp4") return "mp4";
  if (contentType === "video/webm") return "webm";
  return "jpg";
};

/** @deprecated Use getFileExtension instead. */
export const getImageExtension = getFileExtension;

/**
 * Returns the appropriate MIME content type for a given file extension.
 * Handles both images and videos.
 */
export const getFileContentType = (extension: string) => {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    case "mov":
      return "video/quicktime";
    case "m4v":
      return "video/x-m4v";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return "image/jpeg";
  }
};

/** @deprecated Use getFileContentType instead. */
export const getImageContentType = getFileContentType;

/**
 * Determines a stable file name for an upload asset.
 * Prefers the asset's original fileName, falls back to URI segment or generated name.
 */
export const getUploadFileName = (
  asset: { uri: string; fileName?: string | null },
  extension: string,
  prefix = "upload",
) => {
  if (asset.fileName && asset.fileName.trim().length > 0) {
    return asset.fileName;
  }

  const uriLastSegment = asset.uri.split("/").pop();
  if (uriLastSegment?.includes(".")) {
    return uriLastSegment;
  }

  return `${prefix}-${Date.now()}.${extension}`;
};
