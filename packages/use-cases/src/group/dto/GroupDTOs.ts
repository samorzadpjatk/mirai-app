import type { GroupId, TripId, UserId } from "@mirai-app/domain";
import type { CoinTransactionDTO } from "../../coin/dto/CoinDTOs";

/**
 * DTO for basic group info (name only)
 */
export interface GroupNameDTO {
  id: GroupId;
  name: string;
}

/**
 * DTO for basic group info
 */
export interface GroupDTO {
  id: GroupId;
  tripId: TripId;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for group with organizer
 */
export interface GroupWithOrganizerDTO {
  id: GroupId;
  tripId: TripId;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  isDeleted: boolean;
  organizer: GroupMemberDTO | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for group member
 */
export interface GroupMemberDTO {
  id: UserId;
  firstName: string;
  lastName: string;
  email: string | null;
}

/**
 * DTO for group with participants
 */
export interface GroupWithParticipantsDTO {
  id: GroupId;
  tripId: TripId;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  isDeleted: boolean;
  organizer: GroupMemberDTO | null;
  participants: GroupParticipantDTO[];
  coinTransactions: CoinTransactionDTO[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for group participant
 */
export interface GroupParticipantDTO {
  id: string;
  user: GroupMemberDTO;
  joinedAt: Date;
}

/**
 * DTO for group with stats (for moderator list)
 */
export interface GroupWithStatsDTO {
  id: GroupId;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  participantCount: number;
  organizer: GroupMemberDTO | null;
  isDeleted: boolean;
}

/**
 * DTO for group ranking info
 */
export interface GroupRankingDTO {
  id: GroupId;
  name: string;
  image: string | null;
  coins: number;
  rank: number;
  previousRank: number | null;
  rankChange: number | null;
  organizer: GroupMemberDTO | null;
  participants: GroupParticipantDTO[];
  coinTransactions: CoinTransactionDTO[];
}

/**
 * DTO for paginated groups
 */
export interface PaginatedGroupsDTO {
  groups: GroupWithParticipantsDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for group creation result
 */
export interface CreateGroupResultDTO {
  id: GroupId;
  tripId: TripId;
  name: string;
  description: string | null;
  image: string | null;
  code: string;
  coins: number;
  organizer: GroupMemberDTO | null;
}

/**
 * DTO for group update result
 */
export interface UpdateGroupResultDTO {
  id: GroupId;
  name: string;
  description: string | null;
  image: string | null;
  organizerId: UserId | null;
}

/**
 * DTO for group deletion result
 */
export interface DeleteGroupResultDTO {
  success: boolean;
  groupId: GroupId;
}

/**
 * DTO for group join request
 */
export interface GroupJoinRequestDTO {
  id: string;
  groupId: GroupId;
  tripId: TripId;
  userId: UserId;
  user: GroupMemberDTO;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  requestedAt: Date;
  decidedAt: Date | null;
  decidedBy: GroupMemberDTO | null;
}

/**
 * DTO for group join result
 */
export interface GroupJoinResultDTO {
  success: boolean;
  groupId: GroupId;
  joinedAsOrganizer: boolean;
}

/**
 * DTO for leave group result
 */
export interface LeaveGroupResultDTO {
  left: boolean;
  reassignedOrganizerId: UserId | null;
  groupDeleted: boolean;
}

/**
 * DTO for bulk assign result
 */
export interface BulkAssignResultDTO {
  count: number;
  participants: GroupParticipantDTO[];
}

/**
 * DTO for add coins result
 */
export interface AddCoinsResultDTO {
  groupId: GroupId;
  previousCoins: number;
  newCoins: number;
  amount: number;
}

/**
 * DTO for group with approved submissions
 */
export interface GroupWithSubmissionsDTO extends GroupWithParticipantsDTO {
  approvedSubmissions: {
    submissionId: string;
    challengeId: string;
    challengeTitle: string;
    imageStoragePath: string;
    approvedAt: Date;
  }[];
  trip: {
    id: TripId;
    name: string;
  };
}

/**
 * DTO for join request response result
 */
export interface JoinRequestResponseDTO {
  status: "ACCEPTED" | "REJECTED";
  requestId: string;
}

/**
 * DTO for group rankings
 */
export interface GroupRankingsDTO {
  groups: GroupRankingDTO[];
  currentDate: Date;
}
