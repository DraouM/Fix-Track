"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ShoppingCart,
  CreditCard,
  SlidersHorizontal,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
  Banknote,
  TrendingUp,
  TrendingDown,
  Edit2,
  Calendar,
  FileText,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate, formatCurrencySmart } from "@/lib/formatters";
import { useSettings } from "@/context/SettingsContext";
import { Transaction, TransactionWithDetails } from "@/types/transaction";
import { getTransactionById } from "@/lib/api/transactions";
import { TransactionDetailsDialog } from "@/components/transactions/TransactionDetailsDialog";
import { useTransactions } from "@/context/TransactionContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { EditPaymentModal } from "./EditPaymentModal";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LedgerEntryKind = "sale" | "purchase" | "payment" | "adjustment";
export type FilterKind = "all" | "primary" | "payment" | "adjustment";

export interface LedgerEntry {
  id: string;
  date: string;
  ref: string;
  kind: LedgerEntryKind;
  primary_amount?: number; // sale_total or order_total
  paid_amount?: number;
  amount_delta: number; // positive = balance increase, negative = decrease
  running_balance: number;
  status?: string;
  method?: string;
  notes?: string;
  transaction_id?: string;
  payment_row_id?: string;
}

const KIND_PRIORITY: Record<LedgerEntryKind, number> = {
  sale: 1,
  purchase: 1,
  payment: 2,
  adjustment: 3,
};

export interface LedgerTableProps {
  mode: "client" | "supplier";
  transactions: Transaction[];
  history: any[];
  entityId: string;
  currentBalance?: number;
  isLoading?: boolean;
  onHistoryRefresh?: () => void;
}

// ─── Ledger Row Component ───────────────────────────────────────────────────

interface LedgerRowProps {
  mode: "client" | "supplier";
  entry: LedgerEntry;
  currency: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewTransaction: (txId: string) => void;
  onEditPayment: (entry: LedgerEntry) => void;
  viewLoading: string | null;
}

function LedgerRow({
  mode,
  entry,
  currency,
  isExpanded,
  onToggleExpand,
  onViewTransaction,
  onEditPayment,
  viewLoading,
}: LedgerRowProps) {
  const isPrimary = entry.kind === "sale" || entry.kind === "purchase";
  const isPayment = entry.kind === "payment";

  const kindConfig = {
    sale: {
      label: "Sale",
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
      rowBorder: "border-l-2 border-l-rose-400 dark:border-l-rose-600/70",
    },
    purchase: {
      label: "Purchase",
      icon: <Package className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
      rowBorder: "border-l-2 border-l-rose-300 dark:border-l-rose-700/50",
    },
    payment: {
      label: mode === "client" ? "Payment" : "Settlement",
      icon: <CreditCard className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
      rowBorder: "border-l-2 border-l-emerald-400 dark:border-l-emerald-600/70",
    },
    adjustment: {
      label: "Adjustment",
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
      rowBorder: "border-l-2 border-l-amber-400 dark:border-l-amber-600/70",
    },
  }[entry.kind];

  const balancePositive = entry.running_balance > 0;

  return (
    <>
      <tr
        className={cn(
          "group transition-colors cursor-pointer",
          kindConfig.rowBorder,
          "hover:bg-muted/5 dark:hover:bg-slate-800/30",
          isExpanded && "bg-muted/5 dark:bg-slate-800/20"
        )}
        onClick={onToggleExpand}
      >
        {/* Date */}
        <td className="px-5 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground dark:text-slate-200">
              {formatDate(entry.date)}
            </span>
            <span className="text-[10px] text-muted-foreground/50 dark:text-slate-500 font-medium">
              {new Date(entry.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </td>

        {/* Ref / Event */}
        <td className="px-5 py-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-black text-foreground dark:text-slate-100 truncate max-w-[140px]">
              {entry.ref}
            </span>
            {entry.method && (
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                {entry.method}
              </span>
            )}
          </div>
        </td>

        {/* Type Badge */}
        <td className="px-5 py-4">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit",
              kindConfig.badgeClass
            )}
          >
            {kindConfig.icon}
            {kindConfig.label}
          </Badge>
        </td>

        {/* Primary Amount (Sale / Purchase Total) */}
        <td className="px-5 py-4 text-right">
          {isPrimary && entry.primary_amount !== undefined ? (
            <span className="font-black text-sm text-rose-600 dark:text-rose-400">
              +{formatCurrencySmart(entry.primary_amount, currency)}
            </span>
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </td>

        {/* Amount Paid / Settled */}
        <td className="px-5 py-4 text-right">
          {!isPrimary && entry.paid_amount !== undefined ? (
            <span
              className={cn(
                "font-black text-sm",
                isPayment
                  ? "text-emerald-600 dark:text-emerald-400"
                  : entry.paid_amount < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {entry.paid_amount > 0 ? "-" : "+"}
              {formatCurrencySmart(Math.abs(entry.paid_amount), currency)}
            </span>
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </td>

        {/* Running Balance */}
        <td className="px-5 py-4 text-right">
          <span
            className={cn(
              "font-black text-sm tabular-nums",
              balancePositive
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {balancePositive ? "+" : ""}
            {formatCurrencySmart(entry.running_balance, currency)}
          </span>
        </td>

        {/* Status */}
        <td className="px-5 py-4">
          {entry.status ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                entry.status.toLowerCase() === "completed" ||
                  entry.status.toLowerCase() === "paid"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                  : entry.status.toLowerCase() === "pending"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {entry.status}
            </span>
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {isPrimary && entry.transaction_id && (
              <Button
                variant="ghost"
                size="sm"
                disabled={viewLoading === entry.transaction_id}
                onClick={() => onViewTransaction(entry.transaction_id!)}
                className="h-7 px-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 text-primary"
              >
                {viewLoading === entry.transaction_id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Eye className="w-3 h-3 mr-1" />
                )}
                View
              </Button>
            )}
            {isPayment && entry.payment_row_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditPayment(entry)}
                className="h-7 px-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 text-primary"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-muted dark:hover:bg-slate-800 text-muted-foreground"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </td>
      </tr>

      {/* Expanded Audit Detail */}
      {isExpanded && (
        <tr className={cn(kindConfig.rowBorder, "bg-muted/5 dark:bg-slate-800/10")}>
          <td colSpan={8} className="px-5 py-0">
            <div className="py-4 pl-4 border-l-2 border-dashed border-muted-foreground/20 dark:border-slate-700 ml-2 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">
                Audit Detail
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                    Reference ID
                  </p>
                  <p className="text-[11px] font-mono font-bold text-foreground/60 dark:text-slate-400 break-all">
                    {entry.id}
                  </p>
                </div>
                {entry.notes && (
                  <div className="col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                      Notes
                    </p>
                    <p className="text-[11px] font-medium text-foreground/70 dark:text-slate-300 leading-relaxed">
                      {entry.notes}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                    Timestamp
                  </p>
                  <p className="text-[11px] font-bold text-foreground/60 dark:text-slate-400">
                    {new Date(entry.date).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Unified LedgerTable Component ─────────────────────────────────────

export function LedgerTable({
  mode,
  transactions,
  history,
  entityId,
  currentBalance,
  isLoading,
  onHistoryRefresh,
}: LedgerTableProps) {
  const { editTransaction } = useTransactions();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  const [filter, setFilter] = useState<FilterKind>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [editPaymentTarget, setEditPaymentTarget] =
    useState<LedgerEntry | null>(null);

  // ── Merge & sort all entries ──────────────────────────────────────────────
  const allEntries = useMemo<LedgerEntry[]>(() => {
    const primaryKind: LedgerEntryKind = mode === "client" ? "sale" : "purchase";

    const txEntries: LedgerEntry[] = (transactions || []).map((tx) => ({
      id: tx.id,
      date: tx.created_at,
      ref: tx.transaction_number,
      kind: primaryKind,
      primary_amount: tx.total_amount,
      amount_delta: tx.total_amount, // debit increases balance/debt
      running_balance: 0,
      status: tx.payment_status,
      notes: tx.notes,
      transaction_id: tx.id,
    }));

    const historyEntries: LedgerEntry[] = (history || [])
      .filter((ev) => {
        const eventType = (
          (ev as any).event_type || ev.type || ""
        ).toLowerCase();
        if (mode === "client") {
          return true; // client history already carries client financial events
        } else {
          return (
            eventType.includes("payment") ||
            eventType.includes("adjust") ||
            eventType.includes("balance")
          );
        }
      })
      .map((ev) => {
        const eventType = (
          (ev as any).event_type || ev.type || ""
        ).toLowerCase();
        const isPayment =
          eventType.includes("payment") ||
          eventType.includes("payment received") ||
          eventType.includes("payment made");
        const isAdj =
          eventType.includes("adjust") || eventType.includes("balance");

        const kind: LedgerEntryKind = isPayment
          ? "payment"
          : isAdj
          ? "adjustment"
          : "payment";

        const methodMatch = ev.notes?.match(
          /(cash|card|credit card|bank transfer|check|cheque|other)/i
        );
        const method = methodMatch ? methodMatch[1] : undefined;

        const rawAmount = ev.amount || 0;
        const absAmount = Math.abs(rawAmount);

        // For client, payment delta is negative (credit).
        // For supplier, payments reduce balance.
        const delta = -absAmount;

        const relatedId = ev.related_id || ev.relatedId;

        return {
          id: ev.id,
          date: ev.date,
          ref: (ev as any).event_type || ev.type || (mode === "client" ? "Payment" : "Settlement"),
          kind,
          paid_amount: absAmount,
          amount_delta: delta,
          running_balance: 0,
          method,
          notes: ev.notes,
          transaction_id: isPayment ? undefined : relatedId,
          payment_row_id: isPayment ? relatedId : undefined,
        };
      });

    const merged = [...txEntries, ...historyEntries].sort((a, b) => {
      const timeDiff =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      return KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
    });

    let balance = 0;
    for (const entry of merged) {
      balance += entry.amount_delta;
      entry.running_balance = balance;
    }

    return [...merged].reverse();
  }, [mode, transactions, history]);

  // ── Summary Totals ────────────────────────────────────────────────────────
  const totalPrimary = useMemo(
    () =>
      allEntries
        .filter((e) => e.kind === "sale" || e.kind === "purchase")
        .reduce((sum, e) => sum + (e.primary_amount ?? 0), 0),
    [allEntries]
  );

  const totalPaid = useMemo(
    () =>
      allEntries
        .filter((e) => e.kind === "payment")
        .reduce((sum, e) => sum + Math.abs(e.paid_amount ?? 0), 0),
    [allEntries]
  );

  const outstanding =
    currentBalance ?? allEntries[0]?.running_balance ?? 0;

  // ── Filtered entries ──────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    if (filter === "all") return allEntries;
    if (filter === "primary") {
      return allEntries.filter(
        (e) => e.kind === "sale" || e.kind === "purchase"
      );
    }
    return allEntries.filter((e) => e.kind === filter);
  }, [allEntries, filter]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleViewTransaction = useCallback(
    async (txId: string) => {
      setViewLoading(txId);
      try {
        const fullTx = await getTransactionById(txId);
        if (fullTx) {
          setSelectedTransaction(fullTx);
        } else {
          toast.error("Transaction details not found");
        }
      } catch (err) {
        console.error("Failed to load transaction:", err);
        toast.error("Failed to load transaction details");
      } finally {
        setViewLoading(null);
      }
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Billed / Purchased */}
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {mode === "client" ? "Total Billed" : "Total Purchased"}
            </p>
            <p className="text-2xl font-black text-foreground">
              {formatCurrencySmart(totalPrimary, currency)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            {mode === "client" ? (
              <ShoppingCart className="w-5 h-5" />
            ) : (
              <Package className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Total Paid / Settled */}
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              {mode === "client" ? "Total Paid" : "Total Settled"}
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrencySmart(totalPaid, currency)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Outstanding Balance
            </p>
            <p
              className={cn(
                "text-2xl font-black",
                outstanding > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatCurrencySmart(outstanding, currency)}
            </p>
          </div>
          <div
            className={cn(
              "p-3 rounded-xl",
              outstanding > 0
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}
          >
            {outstanding > 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* ── Filters & Controls ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-muted/50 dark:bg-slate-900 rounded-xl border border-border/50">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === "all"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter("primary")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === "primary"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === "client" ? "Sales" : "Purchases"}
          </button>
          <button
            onClick={() => setFilter("payment")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === "payment"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter("adjustment")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === "adjustment"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Adjustments
          </button>
        </div>

        <span className="text-xs text-muted-foreground font-medium">
          Showing {filteredEntries.length} of {allEntries.length} records
        </span>
      </div>

      {/* ── Ledger Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Reference / Event</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">
                  {mode === "client" ? "Sale Total" : "Order Total"}
                </th>
                <th className="px-5 py-3 text-right">
                  {mode === "client" ? "Amount Paid" : "Amount Settled"}
                </th>
                <th className="px-5 py-3 text-right">Running Balance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-xs font-bold text-muted-foreground">
                      Loading financial ledger...
                    </p>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">
                      No records found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      No ledger activity matches the selected criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <LedgerRow
                    key={entry.id}
                    mode={mode}
                    entry={entry}
                    currency={currency}
                    isExpanded={expandedRows.has(entry.id)}
                    onToggleExpand={() => toggleRow(entry.id)}
                    onViewTransaction={handleViewTransaction}
                    onEditPayment={(target) => setEditPaymentTarget(target)}
                    viewLoading={viewLoading}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Details Dialog ─────────────────────────────────── */}
      <TransactionDetailsDialog
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onEdit={(tx) => {
          editTransaction(tx);
          setSelectedTransaction(null);
        }}
      />

      {/* ── Edit Payment Modal ─────────────────────────────────────────── */}
      {editPaymentTarget && (
        <EditPaymentModal
          mode={mode}
          isOpen={!!editPaymentTarget}
          onClose={() => setEditPaymentTarget(null)}
          paymentId={editPaymentTarget.payment_row_id || editPaymentTarget.id}
          currentAmount={Math.abs(editPaymentTarget.paid_amount || 0)}
          currentMethod={editPaymentTarget.method || "Cash"}
          onSuccess={() => {
            setEditPaymentTarget(null);
            onHistoryRefresh?.();
          }}
        />
      )}
    </div>
  );
}
