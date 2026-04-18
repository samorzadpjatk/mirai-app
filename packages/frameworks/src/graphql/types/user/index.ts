// =============================================================================
// GraphQL User Module
// =============================================================================

/**
 * User GraphQL Module
 *
 * Provides GraphQL types, queries, and mutations for user management:
 * - User profiles and authentication
 * - Trip participant management
 * - Admin user management (ban, delete, role changes)
 * - Wrist/house number management
 *
 * ## Queries
 * - me: Current user profile
 * - myBanStatus: Current user's ban status
 * - myGroupInfo: Current user's group info for a trip
 * - user: Get user by ID (moderator+)
 * - userWithGroup: Get user with group info (moderator+)
 * - tripParticipant: Get trip participant info (moderator+)
 * - banStatusByEmail: Check ban status by email
 * - users: List all users for a trip (moderator+)
 * - searchUsers: Search users with filters (moderator+)
 * - adminNames: List all admin names (moderator+)
 *
 * ## Mutations
 * - updateMyProfile: Update current user's profile
 * - updateAvatar: Update avatar status
 * - createUser: Create new user (admin only)
 * - updateUserRole: Update user role (admin only)
 * - updateUserName: Update user name (admin only)
 * - banUser: Ban user until date (admin only)
 * - deleteUser: Delete user from trip/system (admin only)
 * - updateWristNumber: Set wrist number (admin only)
 * - removeWristNumber: Remove wrist number (admin only)
 * - updateHouseNumber: Set house number (admin only)
 * - removeHouseNumber: Remove house number (admin only)
 */

// =============================================================================
// Type Exports
// =============================================================================

export {
  UserType,
  UserProfileType,
  UserWithTripInfoType,
  UserWithGroupInfoType,
  BanStatusType,
  TripParticipantInfoType,
  UserConnectionType,
  AdminNameType,
  GroupInfoType,
  TripInfoType,
  UpdateProfileResultType,
  AvatarUpdateResultType,
  CreateUserResultType,
  UpdateUserResultType,
  DeleteUserResultType,
  BanUserResultType,
  ParticipantNumberResultType,
  UpdateUserProfileInput,
  UpdateAvatarInput,
  CreateUserInput,
  UpdateUserRoleInput,
  UpdateUserNameInput,
  BanUserInput,
  UpdateWristNumberInput,
  UpdateHouseNumberInput,
  DeleteUserInput,
  SearchUsersInput,
  GetUserByEmailInput,
} from "./types.js";

// =============================================================================
// Side-Effect Registration
// =============================================================================

// Register types, queries, and mutations with Pothos builder
import "./types.js";
import "./queries.js";
import "./mutations.js";
