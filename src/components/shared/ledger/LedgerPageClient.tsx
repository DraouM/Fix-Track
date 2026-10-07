"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, Building2, RotateCw, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientContext } from "@/context/ClientContext";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { formatDate } from "@/lib/formatters";
import { LedgerTable } from "./LedgerTable";
import { ClientPaymentModal } from "@/components/clients/ClientPaymentModal";
import { SupplierPaymentModal } from "@/components/suppliers/SupplierPaymentModal";
import { getTransactions } from "@/lib/api/transactions";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { closeCurrentWindow } from "@/lib/openWindow";

export interface LedgerPageClientProps {
  mode: "client" | "supplier";
  entityId: string;
}

export function LedgerPageClient({ mode, entityId }: LedgerPageClientProps) {
  // Client context
  const clientCtx = useClientContext();
  // Supplier context
  const { suppliers } = useSupplierState();
  const { getSupplierHistory, initialize: refreshSuppliers } =
    useSupplierActions();

  const isClient = mode === "client";

  const client = isClient
    ? clientCtx.clients.find((c) => c.id === entityId)
    : null;
  const supplier = !isClient ? suppliers.find((s) => s.id === entityId) : null;

  const entityName = isClient ? client?.name : supplier?.name;
  const entityStatus = isClient ? client?.status : supplier?.status;
  const outstandingBalance = isClient
    ? client?.outstandingBalance || 0
    : supplier?.outstandingBalance || 0;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [hasLoadedLedger, setHasLoadedLedger] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const history = (isClient ? client?.history : supplier?.history) || [];

  const loadLedgerData = useCallback(async () => {
    if (!entityId) return;
    setLedgerLoading(true);
    try {
      if (isClient) {
        const [txData] = await Promise.all([
          getTransactions("Sale", null, entityId),
          clientCtx.getClientHistory(entityId),
        ]);
        setTransactions(txData);
      } else {
        const [txData] = await Promise.all([
          getTransactions(null, null, entityId),
          getSupplierHistory(entityId),
        ]);
        setTransactions(txData);
      }
      setHasLoadedLedger(true);
    } catch (err) {
      console.error("Failed to load ledger data:", err);
    } finally {
      setLedgerLoading(false);
    }
  }, [entityId, isClient, clientCtx, getSupplierHistory]);

  useEffect(() => {
    if (!hasLoadedLedger) {
      loadLedgerData();
    }
  }, [hasLoadedLedger, loadLedgerData]);

  const handleCloseWindow = () => {
    closeCurrentWindow();
  };

  const entityMissing = isClient ? !client : !supplier;

  if (entityMissing) {
    return (
      <div className="min-h-screen bg-[#fbfcfd] dark:bg-slate-950 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {isClient
            ? "Loading Client Financial Ledger..."
            : "Loading Supplier Financial Ledger..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfcfd] dark:bg-slate-950 flex flex-col">
      {/* Top Header Banner */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30 px-8 py-5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-sm text-xl font-black">
              {isClient ? (
                <User className="w-7 h-7" />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-foreground truncate">
                  {isClient
                    ? "Financial Ledger & Statement"
                    : "Supplier Ledger & Statement"}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                    entityStatus === "active"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700",
                  )}
                >
                  {entityStatus === "active" ? "Operational" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  {entityName}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-mono text-muted-foreground/70 uppercase">
                  ID: {entityId.slice(0, 8)}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>
                  Updated:{" "}
                  {formatDate(
                    (isClient ? client?.updatedAt : supplier?.updatedAt) ||
                      new Date(),
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {/* Quick Settle Balance trigger */}
            <Button
              onClick={() => setIsPaymentModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-sm font-black text-xs uppercase tracking-widest gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {isClient ? "Settle Balance" : "Record Settlement"}
            </Button>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={loadLedgerData}
              disabled={ledgerLoading}
              title="Refresh ledger records"
              className="h-10 w-10 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCw
                className={cn("w-4 h-4 text-muted-foreground", {
                  "animate-spin text-primary": ledgerLoading,
                })}
              />
            </Button>

            {/* Close dedicated window */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleCloseWindow}
              title="Close window"
              className="h-10 w-10 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto w-full p-8 space-y-6 flex-1">
        {/* Ledger Table */}
        <LedgerTable
          mode={mode}
          transactions={transactions}
          history={history}
          entityId={entityId}
          currentBalance={outstandingBalance}
          isLoading={ledgerLoading}
          onHistoryRefresh={loadLedgerData}
        />
      </div>

      {/* Payment Modals */}
      {isClient && isPaymentModalOpen && client && (
        <ClientPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            loadLedgerData();
          }}
          clientId={client.id}
        />
      )}

      {!isClient && isPaymentModalOpen && supplier && (
        <SupplierPaymentModal
          supplierId={supplier.id}
          supplierName={supplier.name}
          currentBalance={supplier.outstandingBalance || 0}
          onClose={() => {
            setIsPaymentModalOpen(false);
            loadLedgerData();
            refreshSuppliers();
          }}
        />
      )}
    </div>
  );
}

export default LedgerPageClient;
