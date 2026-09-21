"use client";

import React, { useEffect } from "react";
import {
  X,
  FileText,
  RotateCw,
  DollarSign,
  User,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientLedgerTable } from "./ClientLedgerTable";
import { Transaction } from "@/types/transaction";
import { ClientHistoryEvent } from "@/types/client";
import { cn } from "@/lib/utils";

interface LedgerDrawerProps {
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
  // ── Keyboard shortcut: Escape to close ──────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Prevent background scroll when open ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        aria-hidden="true"
      />

      {/* Drawer Container (85vw desktop class ledger) */}
      <div className="relative z-10 w-full max-w-[85vw] h-full bg-[#fbfcfd] dark:bg-slate-950 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out">
        {/* Top Drawer Header */}
        <div className="flex-shrink-0 px-8 py-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 shadow-sm border border-primary/10">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-foreground truncate">
                  Financial Ledger & Statement
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                    clientStatus === "active"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700",
                  )}
                >
                  {clientStatus === "active" ? "Operational" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <User className="w-3.5 h-3.5 opacity-40 text-primary" />
                  {clientName}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-mono text-muted-foreground/70 uppercase">
                  ID: {clientId.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Escalate peek to a dedicated window */}
            {onOpenWindow && (
              <Button
                onClick={onOpenWindow}
                variant="outline"
                size="sm"
                title="Open in dedicated window"
                className="h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-black text-[10px] uppercase tracking-widest gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Window
              </Button>
            )}

            {/* Quick Settle Balance trigger */}
            {onOpenPayment && (
              <Button
                onClick={onOpenPayment}
                size="sm"
                className="h-10 px-3.5 rounded-xl bg-primary hover:bg-primary/90 shadow-sm font-black text-[10px] uppercase tracking-widest gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Settle Balance
              </Button>
            )}

            {/* Refresh Data */}
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh ledger records"
              className="h-10 w-10 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCw
                className={cn("w-4 h-4 text-muted-foreground", {
                  "animate-spin text-primary": isLoading,
                })}
              />
            </Button>

            {/* Close Button + Escape hint */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-10 px-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors gap-2 text-muted-foreground hover:text-foreground"
            >
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 text-muted-foreground">
                ESC
              </kbd>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Drawer Body - Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <ClientLedgerTable
            transactions={transactions}
            history={history}
            clientId={clientId}
            isLoading={isLoading}
            onHistoryRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}
