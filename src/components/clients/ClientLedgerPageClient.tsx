"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  User,
  RotateCw,
  DollarSign,
  X,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useClientContext } from "@/context/ClientContext";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { ClientLedgerTable } from "./ClientLedgerTable";
import { ClientPaymentModal } from "./ClientPaymentModal";
import { getTransactions } from "@/lib/api/transactions";
import { Transaction } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { closeCurrentWindow } from "@/lib/openWindow";

interface ClientLedgerPageClientProps {
  clientId: string;
}

export function ClientLedgerPageClient({
  clientId,
}: ClientLedgerPageClientProps) {
  const { clients, getClientHistory } = useClientContext();
  const client = clients.find((c) => c.id === clientId);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [hasLoadedLedger, setHasLoadedLedger] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const loadLedgerData = useCallback(async () => {
    if (!clientId) return;
    setLedgerLoading(true);
    try {
      const [txData] = await Promise.all([
        getTransactions("Sale", null, clientId),
        getClientHistory(clientId),
      ]);
      setTransactions(txData);
      setHasLoadedLedger(true);
    } catch (err) {
      console.error("Failed to load ledger data:", err);
    } finally {
      setLedgerLoading(false);
    }
  }, [clientId, getClientHistory]);

  useEffect(() => {
    if (!hasLoadedLedger) {
      loadLedgerData();
    }
  }, [hasLoadedLedger, loadLedgerData]);

  const handleCloseWindow = () => {
    closeCurrentWindow();
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-[#fbfcfd] dark:bg-slate-950 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
          Loading Client Financial Ledger...
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
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-foreground truncate">
                  Financial Ledger & Statement
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                    client.status === "active"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700",
                  )}
                >
                  {client.status === "active" ? "Operational" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <User className="w-3.5 h-3.5 opacity-40 text-primary" />
                  {client.name}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-mono text-muted-foreground/70 uppercase">
                  ID: {client.id.slice(0, 8)}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>Registered: {formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
            <Button
              onClick={() => setIsPaymentModalOpen(true)}
              className="h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all font-black text-[10px] uppercase tracking-widest gap-2"
            >
              <DollarSign className="w-4 h-4" />
              Settle Balance
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={loadLedgerData}
              disabled={ledgerLoading}
              title="Refresh ledger records"
              className="h-11 w-11 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCw
                className={cn("w-4 h-4 text-muted-foreground", {
                  "animate-spin text-primary": ledgerLoading,
                })}
              />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleCloseWindow}
              className="h-11 w-11 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-muted-foreground hover:text-foreground"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Page Body */}
      <div className="max-w-7xl mx-auto w-full px-8 py-8 space-y-8 flex-1">
        {/* Quick Financial Overview Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/40 mb-2">
                Outstanding Aggregate
              </p>
              <div className="flex items-baseline gap-2">
                <h2
                  className={cn(
                    "text-3xl font-black tracking-tight",
                    (client.outstandingBalance || 0) > 0
                      ? "text-red-500 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {formatCurrency(client.outstandingBalance || 0)}
                </h2>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/40 mb-2">
                Standing Rating
              </p>
              <div className="flex items-center gap-2 text-foreground font-black text-xl">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span>Verified Account</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/40 mb-2">
                Live Audit Mode
              </p>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xl">
                <TrendingUp className="w-5 h-5" />
                <span>Real-Time Sync</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-6 md:p-8">
          <ClientLedgerTable
            transactions={transactions}
            history={client.history || []}
            clientId={clientId}
            isLoading={ledgerLoading}
            onHistoryRefresh={loadLedgerData}
          />
        </div>
      </div>

      <ClientPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientId={client.id}
      />
    </div>
  );
}
