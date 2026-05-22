export function toFiniteNumberOrNull(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function toNonNegativeOrNull(value: number | null | undefined): number | null {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0) {
    return null;
  }
  return normalized;
}

export function toHeadingOrNull(value: number | null | undefined): number | null {
  const normalized = toFiniteNumberOrNull(value);
  if (normalized == null || normalized < 0 || normalized > 360) {
    return null;
  }
  return normalized;
}
