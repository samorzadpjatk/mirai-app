const formatDate = (value: string | Date | null): string => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitials = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
};

export function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

export function isNameValid(firstName: string, lastName: string): boolean {
  return isNonEmptyString(firstName) && isNonEmptyString(lastName);
}

export function isBanReady(banUntil: Date | null): boolean {
  return banUntil != null && banUntil > new Date();
}

export function formatBanLabel(banUntil: Date | null): string {
  return banUntil
    ? `${banUntil.toLocaleDateString()} • ${banUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Select date & time";
}

export { formatDate, getInitials };
