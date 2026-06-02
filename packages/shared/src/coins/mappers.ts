export interface MostActiveAdminStatRow {
  adminId: string;
  totalAmount: number;
  count: number;
}

export interface MostActiveAdminStat {
  adminId: string;
  _sum: { amount: number };
  _count: { id: number };
}

/**
 * Maps raw DB aggregate rows to the MostActiveAdminStat shape.
 * Pure: no side effects, no async, no DB calls.
 */
export function mapToMostActiveAdminStats(
  rows: MostActiveAdminStatRow[],
): MostActiveAdminStat[] {
  return rows.map((row) => ({
    adminId: row.adminId,
    _sum: { amount: row.totalAmount },
    _count: { id: row.count },
  }));
}

export interface RecentTransaction {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: Date;
  group: { name: string } | null;
}

export interface AdditionalInsights {
  mostActiveAdmin: {
    name: string;
    transactionCount: number;
  };
  recentTransactions: RecentTransaction[];
}

/**
 * Builds the additional insights response from recent transactions and most-active admin data.
 * Pure: no side effects, no async, no DB calls.
 */
export function buildAdditionalInsights(
  recentTransactions: RecentTransaction[],
  mostActiveAdminName: string,
  mostActiveAdminTransactionCount: number,
): AdditionalInsights {
  return {
    mostActiveAdmin: {
      name: mostActiveAdminName,
      transactionCount: mostActiveAdminTransactionCount,
    },
    recentTransactions,
  };
}
