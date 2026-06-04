export function filterParticipantsByEmail(
  participants: Array<{ user: { id: string } }>,
  emailQuery: string | undefined,
  authSummaryById: Map<string, { email: string | null }>,
): Array<{ user: { id: string } }> {
  const normalizedSearch = emailQuery?.toLowerCase();
  return participants.filter((participant) => {
    if (!normalizedSearch) return true;
    const email = authSummaryById.get(participant.user.id)?.email ?? null;
    return email?.toLowerCase().includes(normalizedSearch) ?? false;
  });
}

export function sortParticipants(
  participants: Array<{
    user: {
      firstName: string | null;
      lastName: string | null;
      authSummary?: { email: string | null };
    };
  }>,
  sortBy: "firstName" | "lastName" | "email",
): Array<{
  user: {
    firstName: string | null;
    lastName: string | null;
    authSummary?: { email: string | null };
  };
}> {
  return [...participants].sort((a, b) => {
    const getValue = (p: typeof a, field: "firstName" | "lastName" | "email") => {
      if (field === "email") {
        return p.user.authSummary?.email ?? "";
      }
      return p.user[field] ?? "";
    };

    const primary = getValue(a, sortBy).localeCompare(getValue(b, sortBy));
    if (primary !== 0) return primary;

    const fields: Array<"firstName" | "lastName" | "email"> = ["firstName", "lastName", "email"];
    for (const field of fields) {
      if (field === sortBy) continue;
      const cmp = getValue(a, field).localeCompare(getValue(b, field));
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}
