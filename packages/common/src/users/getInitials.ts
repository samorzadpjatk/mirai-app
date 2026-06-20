export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "?",
): string {
  const f = (firstName ?? "")[0] ?? "";
  const l = (lastName ?? "")[0] ?? "";
  const initials = `${f}${l}`.toUpperCase();
  return initials || fallback;
}
