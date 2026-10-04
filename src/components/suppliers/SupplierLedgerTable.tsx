"use client";

import React from "react";
import { Transaction } from "@/types/transaction";
import { SupplierHistoryEvent } from "@/types/supplier";
import { LedgerTable } from "@/components/shared/ledger/LedgerTable";

export interface SupplierLedgerTableProps {
  transactions: Transaction[];
  history: SupplierHistoryEvent[] | any[];
  supplierId: string;
  currentBalance?: number;
  isLoading?: boolean;
  onHistoryRefresh?: () => void;
}

export function SupplierLedgerTable({
  transactions,
  history,
  supplierId,
  currentBalance,
  isLoading,
  onHistoryRefresh,
}: SupplierLedgerTableProps) {
  return (
    <LedgerTable
      mode="supplier"
      transactions={transactions}
      history={history}
      entityId={supplierId}
      currentBalance={currentBalance}
      isLoading={isLoading}
      onHistoryRefresh={onHistoryRefresh}
    />
  );
}

export default SupplierLedgerTable;
