/**
 * Location Enums
 *
 * Enums for location tracking and sharing.
 *
 * @module enums/location
 */

/**
 * Location accuracy levels
 */
export enum LocationAccuracy {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  UNKNOWN = "UNKNOWN",
}

/**
 * Location sharing request status
 */
export enum LocationSharingRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

/**
 * Type guard to check if a string is a valid LocationAccuracy
 */
export function isLocationAccuracy(value: string): value is LocationAccuracy {
  return Object.values(LocationAccuracy).includes(value as LocationAccuracy);
}

/**
 * Type guard to check if a string is a valid LocationSharingRequestStatus
 */
export function isLocationSharingRequestStatus(
  value: string,
): value is LocationSharingRequestStatus {
  return Object.values(LocationSharingRequestStatus).includes(
    value as LocationSharingRequestStatus,
  );
}

/**
 * Check if location sharing request is resolved (accepted or rejected)
 */
export function isResolvedLocationSharingRequest(
  status: LocationSharingRequestStatus,
): boolean {
  return (
    status === LocationSharingRequestStatus.ACCEPTED ||
    status === LocationSharingRequestStatus.REJECTED
  );
}
