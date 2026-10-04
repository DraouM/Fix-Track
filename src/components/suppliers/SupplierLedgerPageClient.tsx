"use client";

import React from "react";
import { LedgerPageClient } from "@/components/shared/ledger/LedgerPageClient";

export interface SupplierLedgerPageClientProps {
  supplierId: string;
}

export function SupplierLedgerPageClient({
  supplierId,
}: SupplierLedgerPageClientProps) {
  return <LedgerPageClient mode="supplier" entityId={supplierId} />;
}

export default SupplierLedgerPageClient;
