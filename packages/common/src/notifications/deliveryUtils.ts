export function aggregateTicketResults(
  tickets: Array<{ status: string; details?: { error?: string } }>,
  messages: Array<{ to: string }>,
  userByToken: Map<string, string>,
): Map<string, { hasSuccess: boolean; hasFailure: boolean }> {
  const resultByUser = new Map<string, { hasSuccess: boolean; hasFailure: boolean }>();

  const results = tickets
    .map((t, idx) => {
      const token = messages[idx]?.to;
      if (!token || typeof token !== "string") return null;
      const userId = userByToken.get(token);
      if (!userId) return null;
      const statusCode = t.status === "ok" ? 200 : 500;
      return { userId, statusCode };
    })
    .filter((r): r is { userId: string; statusCode: number } => r !== null);

  for (const r of results) {
    const current = resultByUser.get(r.userId) ?? {
      hasSuccess: false,
      hasFailure: false,
    };
    if (r.statusCode >= 200 && r.statusCode < 300) {
      current.hasSuccess = true;
    } else {
      current.hasFailure = true;
    }
    resultByUser.set(r.userId, current);
  }

  return resultByUser;
}

export function calculateDeliveryStats(
  resultByUser: Map<string, { hasSuccess: boolean; hasFailure: boolean }>,
  explicitAudienceUserIds: Set<string>,
  sentUserIds: string[],
  failedUserIds: string[],
): { sent: number; failed: number; total: number; success: boolean } {
  const hasExplicitAudience = explicitAudienceUserIds.size > 0;

  const failedCount = hasExplicitAudience
    ? Array.from(explicitAudienceUserIds).filter((userId) => {
        const status = resultByUser.get(userId);
        if (!status) return true;
        return !status.hasSuccess;
      }).length
    : failedUserIds.length;

  const sentCount = hasExplicitAudience
    ? Array.from(explicitAudienceUserIds).filter((userId) => {
        const status = resultByUser.get(userId);
        return !!status?.hasSuccess;
      }).length
    : sentUserIds.length;

  const totalCount = hasExplicitAudience
    ? explicitAudienceUserIds.size
    : sentUserIds.length + failedUserIds.length;

  return {
    success: failedCount === 0,
    sent: sentCount,
    failed: failedCount,
    total: totalCount,
  };
}
