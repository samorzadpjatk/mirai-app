export function toFiniteNumberOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function toNonNegativeOrNull(value: unknown): number | null {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0) {
    return null;
  }
  return normalized;
}

export function toHeadingOrNull(value: unknown): number | null {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0 || normalized > 360) {
    return null;
  }
  return normalized;
}
