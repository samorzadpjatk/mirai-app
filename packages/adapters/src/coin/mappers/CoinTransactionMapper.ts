import type { CoinTransactionSelect } from "../../infrastructure/drizzle";
import type { CoinTransaction } from "@mirai-app/use-cases/coin/ports/CoinTransactionPort";
import { CoinTransactionId } from "@mirai-app/domain";

/**
 * CoinTransaction Mapper
 *
 * Maps between database CoinTransaction records and CoinTransaction DTOs.
 * Note: CoinTransaction is a DTO, not a domain entity.
 */
export class CoinTransactionMapper {
  /**
   * Convert database record to CoinTransaction DTO
   */
  toDTO(dbTransaction: CoinTransactionSelect): CoinTransaction {
    return {
      id: CoinTransactionId.unsafeCreate(dbTransaction.id),
      tripId: dbTransaction.tripId,
      groupId: dbTransaction.groupId,
      amount: dbTransaction.amount,
      reason: dbTransaction.reason ?? null,
      adminId: dbTransaction.adminId ?? null,
      createdAt: dbTransaction.createdAt,
    };
  }

  /**
   * Convert database records to CoinTransaction DTOs
   */
  toDTOs(dbTransactions: CoinTransactionSelect[]): CoinTransaction[] {
    return dbTransactions.map((t) => this.toDTO(t));
  }

  /**
   * Convert CoinTransaction DTO to database insert format
   */
  toInsert(transaction: CoinTransaction): {
    id: string;
    tripId: string;
    groupId: string;
    amount: number;
    reason: string | null;
    adminId: string;
    createdAt: Date;
  } {
    return {
      id: transaction.id,
      tripId: transaction.tripId,
      groupId: transaction.groupId,
      amount: transaction.amount,
      reason: transaction.reason,
      adminId: transaction.adminId ?? "", // Should be set by caller
      createdAt: transaction.createdAt,
    };
  }
}

export const coinTransactionMapper = new CoinTransactionMapper();
