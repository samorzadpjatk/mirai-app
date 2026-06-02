/**
 * Attaches an email address to a user object by looking up authUserId in a map.
 * Returns a new object without the authUserId field.
 */
export function toUserWithEmail<T extends { authUserId?: string | null }>(
  user: T,
  emailByAuthUserId: Map<string, string | null>,
): Omit<T, "authUserId"> & { email: string | null } {
  const { authUserId, ...rest } = user;
  return {
    ...rest,
    email: authUserId ? emailByAuthUserId.get(authUserId) ?? null : null,
  };
}

/**
 * Normalizes a group image input value.
 * If the value is a Supabase storage URL, extracts the storage path.
 * Otherwise returns the original value. Returns undefined for empty input.
 */
export function normalizeGroupImageInput(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Extract path from Supabase storage URL pattern: .../storage/v1/object/public/{bucket}/{path}
  const publicUrlMatch = value.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicUrlMatch) {
    const bucket = publicUrlMatch[1];
    const path = publicUrlMatch[2];
    if (bucket && path) {
      return `${bucket}/${path}`;
    }
  }

  return value;
}
