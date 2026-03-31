"use client";

import { Input } from "../../ui/Input";
import { Select } from "../../ui/Select";
import { DateInput } from "../../ui/DateInput";

interface GroupOption {
  id: string;
  name: string;
}

interface TransactionsFiltersProps {
  userFilter: string;
  onUserFilterChange: (text: string) => void;
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  transactionType: "all" | "credit" | "debit";
  onTransactionTypeChange: (value: "all" | "credit" | "debit") => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  groups: GroupOption[];
}

export function TransactionsFilters({
  userFilter,
  onUserFilterChange,
  selectedGroupId,
  onGroupChange,
  transactionType,
  onTransactionTypeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  groups,
}: TransactionsFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 md:grid-cols-3">
      <Input
        label="User"
        value={userFilter}
        onChange={(event) => onUserFilterChange(event.target.value)}
        placeholder="Filter by admin name"
      />
      <Select
        label="Group"
        value={selectedGroupId}
        onChange={(event) => onGroupChange(event.target.value)}
        options={[
          { value: "all", label: "All groups" },
          ...groups.map((group) => ({ value: group.id, label: group.name })),
        ]}
      />
      <Select
        label="Transaction type"
        value={transactionType}
        onChange={(event) =>
          onTransactionTypeChange(
            event.target.value as "all" | "credit" | "debit",
          )
        }
        options={[
          { value: "all", label: "All types" },
          { value: "credit", label: "Credits (+)" },
          { value: "debit", label: "Debits (-)" },
        ]}
      />
      <DateInput
        label="Date from"
        value={dateFrom}
        onChange={(event) => onDateFromChange(event.target.value)}
      />
      <DateInput
        label="Date to"
        value={dateTo}
        onChange={(event) => onDateToChange(event.target.value)}
      />
    </div>
  );
}
