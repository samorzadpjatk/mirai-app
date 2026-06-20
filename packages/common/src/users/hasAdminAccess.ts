export function hasAdminAccess(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}
