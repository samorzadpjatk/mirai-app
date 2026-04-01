"use client";

import { CoinOperationForm } from "./CoinOperationForm";

interface CoinOperationContentProps {
  operation: "add" | "remove";
  groupId: string;
}

export function CoinOperationContent({
  operation,
  groupId,
}: CoinOperationContentProps) {
  return <CoinOperationForm operation={operation} initialGroupId={groupId} />;
}
