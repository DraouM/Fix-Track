"use client";

import React from "react";
import { Transaction } from "@/types/transaction";
import { ClientHistoryEvent } from "@/types/client";
import { LedgerTable } from "@/components/shared/ledger/LedgerTable";

export interface ClientLedgerTableProps {
  transactions: Transaction[];
  history: ClientHistoryEvent[];
  clientId: string;
  currentBalance?: number;
  isLoading?: boolean;
  onHistoryRefresh?: () => void;
}

export function ClientLedgerTable({
  transactions,
  history,
  clientId,
  currentBalance,
  isLoading,
  onHistoryRefresh,
}: ClientLedgerTableProps) {
  return (
    <LedgerTable
      mode="client"
      transactions={transactions}
      history={history}
      entityId={clientId}
      currentBalance={currentBalance}
      isLoading={isLoading}
      onHistoryRefresh={onHistoryRefresh}
    />
  );
}

export default ClientLedgerTable;
