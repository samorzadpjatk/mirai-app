const MB_IN_BYTES = 1024 * 1024;

export const DEFAULT_MAX_FILE_SIZE_MB = 10;

export const DEFAULT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export interface FileValidationOptions {
  maxSizeMb?: number;
  allowedMimeTypes?: readonly string[];
}

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

export const validateFileType = (
  file: File,
  allowedMimeTypes: readonly string[],
): string | null => {
  if (allowedMimeTypes.length === 0) {
    return null;
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return `Unsupported file type (${file.type || "unknown"}).`;
  }

  return null;
};

export const validateFileSize = (
  file: File,
  maxSizeMb: number,
): string | null => {
  const maxSizeBytes = Math.max(1, maxSizeMb) * MB_IN_BYTES;

  if (file.size > maxSizeBytes) {
    return `File is too large (${formatBytes(file.size)}). Maximum size is ${maxSizeMb} MB.`;
  }

  return null;
};

export const validateImageFile = (
  file: File,
  options: FileValidationOptions = {},
): string | null => {
  const maxSizeMb = options.maxSizeMb ?? DEFAULT_MAX_FILE_SIZE_MB;
  const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_IMAGE_MIME_TYPES;

  const typeError = validateFileType(file, allowedMimeTypes);
  if (typeError) {
    return typeError;
  }

  return validateFileSize(file, maxSizeMb);
};
