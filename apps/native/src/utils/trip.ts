/**
 * Trip utility functions
 */

/**
 * Determines if a trip has ended (past its end date)
 * @param endDate - The end date of the trip
 * @returns true if the trip has ended, false otherwise
 */
export function isTripPast(endDate: Date | string): boolean {
  const now = new Date();
  const end = new Date(endDate);

  const today = now.toISOString().split("T")[0] ?? "";
  const endDay = end.toISOString().split("T")[0] ?? "";

  return today > endDay;
}

/**
 * Determines if a trip is currently ongoing
 * @param startDate - The start date of the trip
 * @param endDate - The end date of the trip
 * @returns true if the trip is ongoing, false otherwise
 */
export function isTripOngoing(startDate: Date | string, endDate: Date | string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

/**
 * Determines if a trip is upcoming
 * @param startDate - The start date of the trip
 * @returns true if the trip is upcoming, false otherwise
 */
export function isTripUpcoming(startDate: Date | string): boolean {
  const now = new Date();
  const start = new Date(startDate);
  return now < start;
}

/**
 * Gets the status of a trip as a string
 * @param startDate - The start date of the trip
 * @param endDate - The end date of the trip
 * @returns "Ongoing", "Upcoming", or "Past"
 */
export function getTripStatus(
  startDate: Date | string,
  endDate: Date | string,
): "Ongoing" | "Upcoming" | "Past" {
  if (isTripOngoing(startDate, endDate)) return "Ongoing";
  if (isTripUpcoming(startDate)) return "Upcoming";
  return "Past";
}

/**
 * Formats the span of a trip for display, e.g. "Sep 16 - Sep 20, 2026".
 * @param startDate - The start date of the trip
 * @param endDate - The end date of the trip
 * @returns The formatted range, or null when either date is missing or invalid
 */
export function formatTripDateRange(
  startDate?: Date | string | null,
  endDate?: Date | string | null,
): string | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const sameYear = start.getFullYear() === end.getFullYear();
  const startOptions: Intl.DateTimeFormatOptions = sameYear
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  const endOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  return `${start.toLocaleDateString("en-US", startOptions)} - ${end.toLocaleDateString("en-US", endOptions)}`;
}
