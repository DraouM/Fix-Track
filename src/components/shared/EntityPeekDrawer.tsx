"use client";

import React, { useEffect } from "react";
import {
  X,
  RotateCw,
  DollarSign,
  User,
  Building2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { LedgerTable } from "./ledger/LedgerTable";
import { cn } from "@/lib/utils";
import { formatDate, formatCurrencySmart } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";

export interface EntityPeekDrawerProps {
  mode: "client" | "supplier";
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
  entityStatus?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  outstandingBalance?: number;
  transactions: Transaction[];
  history: any[];
  isLoading?: boolean;
  onRefresh: () => void;
  onOpenPayment?: () => void;
  onOpenFullPage?: () => void;
  onOpenWindow?: () => void;
}

export function EntityPeekDrawer({
  mode,
  isOpen,
  onClose,
  entityId,
  entityName,
  entityStatus = "active",
  contactName,
  createdAt,
  outstandingBalance = 0,
  transactions,
  history,
  isLoading = false,
  onRefresh,
  onOpenPayment,
  onOpenFullPage,
  onOpenWindow,
}: EntityPeekDrawerProps) {
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

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

  const isClient = mode === "client";

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
              {isClient ? (
                <User className="w-6 h-6" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-foreground truncate">
                  {isClient
                    ? "Client Financial Ledger & Statement"
                    : "Supplier Operational Ledger & Statement"}
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                    entityStatus === "active"
                      ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
                  )}
                >
                  {entityStatus === "active" ? "Operational" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <User className="w-3.5 h-3.5 opacity-40 text-primary" />
                  {entityName}
                  {contactName && contactName !== entityName && (
                    <span className="text-muted-foreground/60 font-medium">
                      ({contactName})
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="font-mono text-muted-foreground/70 uppercase">
                  ID: {entityId.slice(0, 8)}
                </span>
                {createdAt && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>Created: {formatDate(createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Escalate peek to a dedicated native window */}
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

            {/* Escalate peek to full detail profile page */}
            {onOpenFullPage && (
              <Button
                onClick={onOpenFullPage}
                variant="outline"
                size="sm"
                title="Open full profile"
                className="h-10 px-3.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-black text-[10px] uppercase tracking-widest gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <FileText className="w-3.5 h-3.5" />
                Full Profile
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
          {/* Quick Financial Overview Bar */}
          <Card className="rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardContent className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 dark:text-muted-foreground/40 mb-0.5">
                  Outstanding Balance
                </p>
                <span
                  className={cn(
                    "text-lg font-black tracking-tight",
                    outstandingBalance > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {formatCurrencySmart(outstandingBalance, currency)}
                </span>
              </div>

              <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 hidden md:block" />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 dark:text-muted-foreground/40 mb-0.5">
                  Entity Status
                </p>
                <div className="flex items-center gap-1.5 text-foreground font-black text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>
                    {entityStatus === "active" ? "Active Account" : "Archived"}
                  </span>
                </div>
              </div>

              <div className="w-px h-8 bg-gray-100 dark:bg-slate-800 hidden md:block" />

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 dark:text-muted-foreground/40 mb-0.5">
                  Live Audit Mode
                </p>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Real-Time Sync</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ledger Table */}
          <LedgerTable
            mode={mode}
            transactions={transactions}
            history={history}
            entityId={entityId}
            currentBalance={outstandingBalance}
            isLoading={isLoading}
            onHistoryRefresh={onRefresh}
          />
        </div>
      </div>
    </div>
  );
}

export default EntityPeekDrawer;
