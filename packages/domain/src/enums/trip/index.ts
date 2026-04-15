/**
 * Trip Enums
 *
 * Enums for trips and trip participants.
 *
 * @module enums/trip
 */

/**
 * Trip status
 */
export enum TripStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * Trip participant role
 */
export enum TripParticipantRole {
  MEMBER = "MEMBER",
  LEADER = "LEADER",
}

/**
 * Type guard to check if a string is a valid TripStatus
 */
export function isTripStatus(value: string): value is TripStatus {
  return Object.values(TripStatus).includes(value as TripStatus);
}

/**
 * Type guard to check if a string is a valid TripParticipantRole
 */
export function isTripParticipantRole(
  value: string,
): value is TripParticipantRole {
  return Object.values(TripParticipantRole).includes(
    value as TripParticipantRole,
  );
}

/**
 * Check if a trip status is terminal
 */
export function isTerminalTripStatus(status: TripStatus): boolean {
  return status === TripStatus.COMPLETED || status === TripStatus.CANCELLED;
}

/**
 * Check if a trip is active or planning (not terminal)
 */
export function isActiveOrPlanningTripStatus(status: TripStatus): boolean {
  return status === TripStatus.ACTIVE || status === TripStatus.PLANNING;
}

/**
 * Check if a participant role is leader
 */
export function isLeaderRole(role: TripParticipantRole): boolean {
  return role === TripParticipantRole.LEADER;
}
