export interface BanStatus {
  banned: boolean;
  bannedUntil: string;
  reason: string;
}

export function parseBanStatus(
  bannedUntilRaw: string | null | undefined,
  reasonRaw: string | null | undefined,
): BanStatus {
  if (!bannedUntilRaw) {
    return { banned: false, bannedUntil: "", reason: "" };
  }

  const bannedUntil = new Date(bannedUntilRaw);
  if (Number.isNaN(bannedUntil.getTime()) || bannedUntil.getTime() <= Date.now()) {
    return { banned: false, bannedUntil: "", reason: "" };
  }

  return {
    banned: true,
    bannedUntil: bannedUntil.toISOString(),
    reason: reasonRaw ?? "Temporary ban",
  };
}
