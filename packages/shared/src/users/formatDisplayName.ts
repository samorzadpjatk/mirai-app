export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback?: string | null,
): string | null {
  const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return fallback?.trim() ?? null;
}
