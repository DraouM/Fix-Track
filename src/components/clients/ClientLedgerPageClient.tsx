"use client";

import React from "react";
import { LedgerPageClient } from "@/components/shared/ledger/LedgerPageClient";

export interface ClientLedgerPageClientProps {
  clientId: string;
}

export function ClientLedgerPageClient({
  clientId,
}: ClientLedgerPageClientProps) {
  return <LedgerPageClient mode="client" entityId={clientId} />;
}

export default ClientLedgerPageClient;
