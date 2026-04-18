// =============================================================================
// GraphQL Group Module
// =============================================================================

/**
 * Group GraphQL Module
 *
 * Provides GraphQL types, queries, and mutations for group management:
 * - Group CRUD operations
 * - Group membership and join requests
 * - Group rankings and coins
 * - Group gallery
 *
 * ## Queries
 * - myGroup: Get current user's group for a trip
 * - myJoinRequest: Get current user's join request
 * - groups: List all groups for a trip
 * - group: Get group by ID
 * - groupRanking: Get group ranking for a trip
 * - groupList: List groups (moderator only)
 * - pendingJoinRequests: Get pending join requests
 * - groupGallery: Get approved submissions for gallery
 *
 * ## Mutations
 * - createGroup: Create new group
 * - updateGroup: Update group
 * - deleteGroup: Delete group (admin only)
 * - deleteMyGroup: Delete own group
 * - joinGroup: Join a group
 * - leaveGroup: Leave current group
 * - requestJoinGroup: Request to join a group
 * - cancelJoinRequest: Cancel pending request
 * - respondToJoinRequest: Accept/reject join request
 * - removeUserFromGroup: Remove user from group
 * - bulkAssignUsers: Bulk assign users to group
 * - addGroupCoins: Add coins to group (admin only)
 */

// =============================================================================
// Type Exports
// =============================================================================

export {
  GroupType,
  GroupWithStatsType,
  GroupMemberType,
  GroupParticipantType,
  GroupCoinTransactionType,
  GroupWithDetailsType,
  GroupConnectionType,
  GroupRankingEntryType,
  GroupRankingResultType,
  GroupJoinRequestType,
  GroupGallerySubmissionType,
  CreateGroupInput,
  UpdateGroupInput,
  DeleteGroupInput,
  JoinGroupInput,
  RequestJoinGroupInput,
  RespondJoinRequestInput,
  AddGroupCoinsInput,
  BulkAssignUsersInput,
  CreateGroupResultType,
  UpdateGroupResultType,
  JoinGroupResultType,
  LeaveGroupResultType,
  JoinRequestResponseType,
  AddCoinsResultType,
  BulkAssignResultType,
} from "./types.js";

// =============================================================================
// Side-Effect Registration
// =============================================================================

import "./types.js";
import "./queries.js";
import "./mutations.js";
