export function calculateBanDuration(bannedUntilMs: number): {
  bannedUntil: Date;
  banDuration: string;
} {
  const bannedUntil = new Date(bannedUntilMs);

  if (Number.isNaN(bannedUntil.getTime())) {
    throw new Error("Invalid ban date");
  }

  const diffMs = bannedUntil.getTime() - Date.now();
  if (diffMs <= 0) {
    throw new Error("Ban date must be in the future");
  }

  const diffMinutes = Math.ceil(diffMs / 60000);
  const banDuration = `${diffMinutes}m`;

  return { bannedUntil, banDuration };
}

export function buildBanMetadata(
  existingMetadata: Record<string, unknown>,
  reason?: string,
): Record<string, unknown> {
  const trimmedReason = reason?.trim();
  return {
    ...existingMetadata,
    ban_reason: trimmedReason && trimmedReason.length > 0 ? trimmedReason : null,
  };
}
