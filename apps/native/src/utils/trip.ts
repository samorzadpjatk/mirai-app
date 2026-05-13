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
