"use client";

import React from "react";
import { Transaction } from "@/types/transaction";
import { ClientHistoryEvent } from "@/types/client";
import { EntityPeekDrawer } from "@/components/shared/EntityPeekDrawer";

export interface LedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientStatus?: string;
  transactions: Transaction[];
  history: ClientHistoryEvent[];
  isLoading?: boolean;
  onRefresh: () => void;
  onOpenPayment?: () => void;
  onOpenWindow?: () => void;
}

export function LedgerDrawer({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientStatus = "active",
  transactions,
  history,
  isLoading = false,
  onRefresh,
  onOpenPayment,
  onOpenWindow,
}: LedgerDrawerProps) {
  return (
    <EntityPeekDrawer
      mode="client"
      isOpen={isOpen}
      onClose={onClose}
      entityId={clientId}
      entityName={clientName}
      entityStatus={clientStatus}
      transactions={transactions}
      history={history}
      isLoading={isLoading}
      onRefresh={onRefresh}
      onOpenPayment={onOpenPayment}
      onOpenWindow={onOpenWindow}
    />
  );
}

export default LedgerDrawer;
