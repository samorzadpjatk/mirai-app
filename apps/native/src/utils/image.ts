import type { ImagePickerAsset } from "expo-image-picker";

/**
 * Extracts the file extension from an ImagePicker asset.
 * Falls back to mimeType detection or defaults to 'jpg'.
 */
export const getImageExtension = (asset: ImagePickerAsset) => {
  if (asset.fileName) {
    const parts = asset.fileName.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1]?.toLowerCase() ?? "jpg";
    }
  }

  const contentType = asset.mimeType ?? "";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/heic" || contentType === "image/heif") {
    return "heic";
  }
  return "jpg";
};

/**
 * Returns the appropriate MIME content type for a given image file extension.
 */
export const getImageContentType = (extension: string) => {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
};
