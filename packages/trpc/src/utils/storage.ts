const SUPABASE_OBJECT_PREFIXES = new Set(["public", "sign", "authenticated"]);

export const parseSupabaseStorageObject = (
  value: string,
): { bucket: string; path: string } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let rawPath = trimmed;
  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      rawPath = url.pathname;
    } catch (error) {
      return null;
    }
  }

  const normalizedPath = rawPath.split("?")[0] ?? "";
  const objectPrefix = "/storage/v1/object/";
  const objectIndex = normalizedPath.indexOf(objectPrefix);
  let objectPath =
    objectIndex >= 0
      ? normalizedPath.slice(objectIndex + objectPrefix.length)
      : normalizedPath;

  objectPath = objectPath.replace(/^\/+/, "");
  if (!objectPath) return null;

  const segments = objectPath.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  if (SUPABASE_OBJECT_PREFIXES.has(segments[0] ?? "")) {
    segments.shift();
  }

  if (segments.length < 2) return null;

  const bucket = segments.shift();
  const path = segments.join("/");
  if (!bucket || !path) return null;

  return { bucket, path: decodeURIComponent(path) };
};

export { SUPABASE_OBJECT_PREFIXES };
