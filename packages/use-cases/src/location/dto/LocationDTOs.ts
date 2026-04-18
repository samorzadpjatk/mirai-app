import type {
  LocationId,
  UserId,
  LocationSharingRequestId,
} from "@mirai-app/domain";

/**
 * DTO for user location
 */
export interface LocationDTO {
  id: LocationId;
  userId: UserId;
  timestamp: Date;
  isSharingLocation: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  lastInactivityNotification: Date | null;
}

/**
 * DTO for location with user info
 */
export interface LocationWithUserDTO extends LocationDTO {
  user: {
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  } | null;
}

/**
 * DTO for location sharing settings
 */
export interface LocationSharingSettingsDTO {
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  }>;
}

/**
 * DTO for sharing user
 */
export interface SharingUserDTO {
  id: UserId;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  isSharingLocation: boolean;
  lastLocationUpdate: Date | null;
}

/**
 * DTO for nearby users result
 */
export interface NearbyUsersResultDTO {
  users: Array<{
    userId: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    distance: number;
    lastUpdated: number;
  }>;
}

/**
 * DTO for location update result
 */
export interface LocationUpdateResultDTO {
  success: boolean;
  locationId: LocationId;
  timestamp: number;
}

/**
 * DTO for location history entry
 */
export interface LocationHistoryEntryDTO {
  id: LocationId;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

/**
 * DTO for location sharing request
 */
export interface LocationSharingRequestDTO {
  id: LocationSharingRequestId;
  senderId: UserId;
  receiverId: UserId;
  sender: {
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  } | null;
  receiver: {
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  } | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for location sharing request creation result
 */
export interface LocationSharingRequestResultDTO {
  success: boolean;
  request: LocationSharingRequestDTO;
}

/**
 * DTO for sharing settings update result
 */
export interface SharingSettingsUpdateResultDTO {
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  }>;
}

/**
 * DTO for add/remove user from sharing result
 */
export interface SharingListUpdateResultDTO {
  success: boolean;
  usersToShareWith: Array<{
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  }>;
}

/**
 * DTO for request response result (accept/reject)
 */
export interface RequestResponseResultDTO {
  success: boolean;
  request: LocationSharingRequestDTO;
}

/**
 * DTO for my location sharing requests (sent and received)
 */
export interface MyLocationSharingRequestsDTO {
  sent: LocationSharingRequestDTO[];
  received: LocationSharingRequestDTO[];
}

/**
 * DTO for pending requests
 */
export interface PendingLocationSharingRequestsDTO {
  requests: LocationSharingRequestDTO[];
}

/**
 * DTO for friends locations
 */
export interface FriendsLocationsDTO {
  locations: LocationWithUserDTO[];
}

/**
 * DTO for my location
 */
export interface MyLocationDTO {
  location: LocationDTO | null;
}

/**
 * DTO for available users for sharing
 */
export interface AvailableUsersForSharingDTO {
  users: Array<{
    id: UserId;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  }>;
}
