import type { User, Role } from "@mirai-app/domain";

/**
 * Group info DTO
 */
export interface GroupInfoDTO {
  id: string;
  name: string;
}

/**
 * Trip info DTO
 */
export interface TripInfoDTO {
  id: string;
  name: string;
}

/**
 * DTO for user with trip participant info
 */
export interface UserWithTripInfoDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: Role;
  hasAvatar: boolean;
  wristNumber: string | null;
  houseNumber: string | null;
  groupId: string | null;
  groupName: string | null;
  tripId: string;
  isBanned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
}

/**
 * DTO for user profile
 */
export interface UserProfileDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: Role;
  hasAvatar: boolean;
}

/**
 * DTO for user with group information for a trip
 */
export interface UserWithGroupInfoDTO {
  id: string;
  firstName: string;
  lastName: string;
  trips: {
    tripId: string;
    group: GroupInfoDTO | null;
    trip: TripInfoDTO | null;
  }[];
  organizerGroup: GroupInfoDTO | null;
}

/**
 * DTO for trip participant info
 */
export interface TripParticipantDTO {
  userId: string;
  tripId: string;
  wristNumber: string | null;
  houseNumber: string | null;
  group: GroupInfoDTO | null;
}

/**
 * DTO for paginated users
 */
export interface PaginatedUsersDTO {
  users: UserWithTripInfoDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * DTO for ban status
 */
export interface BanStatusDTO {
  banned: boolean;
  bannedUntil: string | null;
  reason: string | null;
  exists?: boolean;
}

/**
 * DTO for user creation result
 */
export interface CreateUserResultDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  wristNumber: string | null;
  houseNumber: string | null;
  groupId: string | null;
  groupName: string | null;
  tripId: string;
}

/**
 * DTO for user update result
 */
export interface UpdateUserResultDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: Role;
}

/**
 * DTO for wrist/house number update
 */
export interface ParticipantNumberUpdateDTO {
  userId: string;
  tripId: string;
  wristNumber: string | null;
  houseNumber: string | null;
}

/**
 * DTO for avatar update result
 */
export interface AvatarUpdateDTO {
  hasAvatar: boolean;
}

/**
 * DTO for admin user names
 */
export interface AdminNameDTO {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * DTO for delete user result
 */
export interface DeleteUserResultDTO {
  deletedFromSystem: boolean;
}

/**
 * DTO for ban user result
 */
export interface BanUserResultDTO {
  bannedUntil: string;
}
