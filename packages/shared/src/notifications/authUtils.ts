export const resolveAuthEmail = (
  emailByAuthUserId: Map<string, string | null>,
  authUserId?: string | null,
): string | null => {
  if (!authUserId) return null;
  return emailByAuthUserId.get(authUserId) ?? null;
};
