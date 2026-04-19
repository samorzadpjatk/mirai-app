import type {
  CoinTransactionId,
  GroupId,
  TripId,
  UserId,
} from "@mirai-app/domain";

/**
 * DTO for coin transaction
 */
export interface CoinTransactionDTO {
  id: CoinTransactionId;
  groupId: GroupId;
  amount: number;
  reason: string | null;
  adminId: UserId;
  createdAt: Date;
}

/**
 * DTO for coin transaction with group info
 */
export interface CoinTransactionWithGroupDTO extends CoinTransactionDTO {
  group: {
    id: GroupId;
    name: string;
    coins: number;
  } | null;
}

/**
 * DTO for coin transaction with admin info
 */
export interface CoinTransactionWithAdminDTO extends CoinTransactionDTO {
  admin: {
    id: UserId;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * DTO for coin transaction with full details
 */
export interface CoinTransactionWithDetailsDTO extends CoinTransactionDTO {
  group: {
    id: GroupId;
    name: string;
    coins: number;
  } | null;
  admin: {
    id: UserId;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * DTO for coin operation result
 */
export interface CoinOperationResultDTO {
  success: boolean;
  groupId: GroupId;
  previousBalance: number;
  newBalance: number;
  transactionId: CoinTransactionId;
}

/**
 * DTO for group coin balance
 */
export interface GroupCoinBalanceDTO {
  groupId: GroupId;
  name: string;
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

/**
 * DTO for trip coin leaderboard
 */
export interface TripCoinLeaderboardDTO {
  tripId: TripId;
  rankings: Array<{
    groupId: GroupId;
    name: string;
    image: string | null;
    coins: number;
    rank: number;
    change: number | null;
  }>;
}

/**
 * DTO for paginated coin transactions
 */
export interface PaginatedCoinTransactionsDTO {
  transactions: CoinTransactionDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
