"use client";

import { Card } from "../../ui/Card";
import type { TransactionItem } from "@mirai-app/frameworks/trpc/hooks";

interface TransactionCardProps {
  transaction: TransactionItem;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const isPositive = transaction.amount > 0;
  const amountLabel = `${isPositive ? "+" : ""}${transaction.amount}`;
  const adminName =
    `${transaction.admin.firstName} ${transaction.admin.lastName}`.trim();

  return (
    <Card className="h-full space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {transaction.group.name}
          </h3>
          <p className="text-sm text-text-secondary">
            {formatDate(transaction.createdAt)}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPositive
              ? "bg-emerald-900/30 text-emerald-400"
              : "bg-rose-900/30 text-rose-400"
          }`}
        >
          {amountLabel}
        </span>
      </div>

      {transaction.reason ? (
        <p className="text-sm text-text-secondary">{transaction.reason}</p>
      ) : null}

      <p className="text-sm text-text-muted">Admin: {adminName || "Unknown"}</p>
    </Card>
  );
}
