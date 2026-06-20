export const parseRewardImages = (image: string | null | undefined): string[] => {
  if (!image) return [];

  const trimmed = image.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }
  } catch {
    // Legacy single-image format.
  }

  return [trimmed];
};

export const serializeRewardImages = (images: string[]): string | null => {
  if (images.length === 0) return null;
  if (images.length === 1) return images[0] ?? null;
  return JSON.stringify(images);
};
