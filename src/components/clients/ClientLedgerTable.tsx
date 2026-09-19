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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { Transaction, TransactionWithDetails } from "@/types/transaction";
import { ClientHistoryEvent } from "@/types/client";
import { getTransactionById } from "@/lib/api/transactions";
import { TransactionDetailsDialog } from "../transactions/TransactionDetailsDialog";
import { useTransactions } from "@/context/TransactionContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

type LedgerEntryKind = "sale" | "payment" | "adjustment";
type FilterKind = "all" | "sale" | "payment" | "adjustment";

interface LedgerEntry {
  id: string;
  date: string;
  ref: string;
  kind: LedgerEntryKind;
  sale_total?: number;
  paid_amount?: number;
  amount_delta: number; // positive = debt increase, negative = debt decrease
  running_balance: number; // computed after sort
  status?: string;
  method?: string;
  notes?: string;
  transaction_id?: string;
  history_event_id?: string;
}

// ─── Sort priority so same-timestamp events are deterministic ─────────────

const KIND_PRIORITY: Record<LedgerEntryKind, number> = {
  sale: 1,
  payment: 2,
  adjustment: 3,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClientLedgerTableProps {
  transactions: Transaction[];
  history: ClientHistoryEvent[];
  clientId: string;
  isLoading?: boolean;
  onHistoryRefresh?: () => void;
}

// ─── Edit Payment Modal ───────────────────────────────────────────────────────

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  currentAmount: number;
  currentMethod: string;
  onSuccess: () => void;
}

function EditPaymentModal({
  isOpen,
  onClose,
  paymentId,
  currentAmount,
  currentMethod,
  onSuccess,
}: EditPaymentModalProps) {
  const [amount, setAmount] = useState(currentAmount);
  const [method, setMethod] = useState(currentMethod || "Cash");
  const [saving, setSaving] = useState(false);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount);
      setMethod(currentMethod || "Cash");
    }
  }, [isOpen, currentAmount, currentMethod]);

  const handleSave = async () => {
    if (amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    setSaving(true);
    try {
      await invoke("update_client_payment", { id: paymentId, amount, method });
      toast.success("Payment updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[2rem] dark:bg-slate-900 dark:border-slate-800 border-none shadow-2xl">
        <DialogHeader className="pb-4 border-b dark:border-slate-800">
          <DialogTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <Edit2 className="h-4 w-4" />
            </div>
            Edit Payment
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Amount
            </label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="h-11 rounded-xl dark:bg-slate-950 dark:border-slate-700 font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Payment Method
            </label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="h-11 rounded-xl dark:bg-slate-950 dark:border-slate-700 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                {["Cash", "Card", "Bank Transfer", "Cheque", "Other"].map(
                  (m) => (
                    <SelectItem key={m} value={m} className="font-medium">
                      {m}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl dark:border-slate-700 font-black text-[10px] uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Ledger Row ───────────────────────────────────────────────────────────────

interface LedgerRowProps {
  entry: LedgerEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewTransaction: (txId: string) => void;
  onEditPayment: (entry: LedgerEntry) => void;
  viewLoading: string | null;
}

function LedgerRow({
  entry,
  isExpanded,
  onToggleExpand,
  onViewTransaction,
  onEditPayment,
  viewLoading,
}: LedgerRowProps) {
  const isSale = entry.kind === "sale";
  const isPayment = entry.kind === "payment";
  const isAdj = entry.kind === "adjustment";

  const kindConfig = {
    sale: {
      label: "Sale",
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
      rowBorder: "border-l-2 border-l-rose-300 dark:border-l-rose-700/50",
    },
    payment: {
      label: "Payment",
      icon: <CreditCard className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
      rowBorder:
        "border-l-2 border-l-emerald-400 dark:border-l-emerald-600/70",
    },
    adjustment: {
      label: "Adjustment",
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      badgeClass:
        "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
      rowBorder:
        "border-l-2 border-l-amber-400 dark:border-l-amber-600/70",
    },
  }[entry.kind];

  const balancePositive = entry.running_balance > 0;

  return (
    <>
      {/* Main Row */}
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

        {/* Sale Total */}
        <td className="px-5 py-4 text-right">
          {isSale && entry.sale_total !== undefined ? (
            <span className="font-black text-sm text-rose-600 dark:text-rose-400">
              +{formatCurrency(entry.sale_total)}
            </span>
          ) : (
            <span className="text-muted-foreground/30 text-xs">—</span>
          )}
        </td>

        {/* Amount Paid */}
        <td className="px-5 py-4 text-right">
          {!isSale && entry.paid_amount !== undefined ? (
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
              {formatCurrency(Math.abs(entry.paid_amount))}
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
            {formatCurrency(entry.running_balance)}
          </span>
        </td>

        {/* Status */}
        <td className="px-5 py-4">
          {entry.status && (
            <Badge
              variant="secondary"
              className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                entry.status === "Completed" || entry.status === "Paid"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                  : entry.status === "Partially"
                  ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
              )}
            >
              {entry.status}
            </Badge>
          )}
        </td>

        {/* Actions */}
        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {isSale && entry.transaction_id && (
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
            {isPayment && (
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

      {/* Expanded Audit Drawer */}
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
                    {entry.id.slice(0, 12)}...
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClientLedgerTable({
  transactions,
  history,
  clientId,
  isLoading,
  onHistoryRefresh,
}: ClientLedgerTableProps) {
  const { editTransaction } = useTransactions();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<FilterKind>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [editPaymentTarget, setEditPaymentTarget] =
    useState<LedgerEntry | null>(null);

  // ── Merge & sort all entries ──────────────────────────────────────────────

  const allEntries = useMemo<LedgerEntry[]>(() => {
    const saleEntries: LedgerEntry[] = transactions.map((tx) => ({
      id: tx.id,
      date: tx.created_at,
      ref: tx.transaction_number,
      kind: "sale" as LedgerEntryKind,
      sale_total: tx.total_amount,
      amount_delta: tx.total_amount, // debit: increases balance
      running_balance: 0, // computed below
      status: tx.payment_status,
      notes: tx.notes,
      transaction_id: tx.id,
    }));

    const historyEntries: LedgerEntry[] = history.map((ev) => {
      const isPayment = ev.event_type.toLowerCase().includes("payment received");
      const isAdj = ev.event_type.toLowerCase().includes("adjust") || ev.event_type.toLowerCase().includes("balance");
      const kind: LedgerEntryKind = isPayment
        ? "payment"
        : isAdj
        ? "adjustment"
        : "payment";

      // Parse method from notes if available (e.g. "Direct Payment" or payment method stored in notes)
      const methodMatch = ev.notes?.match(/^(cash|card|bank transfer|cheque|other)/i);
      const method = methodMatch ? methodMatch[1] : ev.notes?.includes("Direct") ? undefined : undefined;

      // payment amount stored as negative in history (credit), we flip for display
      const absAmount = Math.abs(ev.amount);

      return {
        id: ev.id,
        date: ev.date,
        ref: ev.event_type,
        kind,
        paid_amount: absAmount,
        amount_delta: -absAmount, // credit: decreases balance
        running_balance: 0,
        method,
        notes: ev.notes,
        history_event_id: ev.id,
        transaction_id: ev.related_id,
      };
    });

    // Merge and sort chronologically, secondary sort by kind priority
    const merged = [...saleEntries, ...historyEntries].sort((a, b) => {
      const timeDiff =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      return KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
    });

    // Compute running balance
    let balance = 0;
    for (const entry of merged) {
      balance += entry.amount_delta;
      entry.running_balance = balance;
    }

    // Return in descending order for display (newest first)
    return [...merged].reverse();
  }, [transactions, history]);

  // ── Summary totals ────────────────────────────────────────────────────────

  const totalBilled = useMemo(
    () =>
      allEntries
        .filter((e) => e.kind === "sale")
        .reduce((sum, e) => sum + (e.sale_total ?? 0), 0),
    [allEntries]
  );
  const totalPaid = useMemo(
    () =>
      allEntries
        .filter((e) => e.kind === "payment")
        .reduce((sum, e) => sum + (e.paid_amount ?? 0), 0),
    [allEntries]
  );
  const outstanding = totalBilled - totalPaid;

  // ── Filtered entries ──────────────────────────────────────────────────────

  const filteredEntries = useMemo(
    () =>
      filter === "all" ? allEntries : allEntries.filter((e) => e.kind === filter),
    [allEntries, filter]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleViewTransaction = useCallback(async (txId: string) => {
    setViewLoading(txId);
    try {
      const details = await getTransactionById(txId);
      if (details) setSelectedTransaction(details);
      else toast.error("Could not load transaction details");
    } catch {
      toast.error("Failed to load transaction");
    } finally {
      setViewLoading(null);
    }
  }, []);

  const handleEditTransaction = (details: TransactionWithDetails) => {
    editTransaction(details);
    setSelectedTransaction(null);
  };

  const handleEditPaymentSuccess = () => {
    setEditPaymentTarget(null);
    onHistoryRefresh?.();
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Summary card skeletons */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-muted/30 animate-pulse dark:bg-slate-800/50"
            />
          ))}
        </div>
        <div className="rounded-2xl border dark:border-slate-800 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-muted/10 dark:bg-slate-800/20 animate-pulse border-b dark:border-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (allEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-gray-50/30 dark:bg-slate-950/30 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
        <FileText className="h-16 w-16 mb-6 text-muted-foreground/10 dark:text-muted-foreground/5" />
        <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
          No Ledger Activity
        </h3>
        <p className="text-xs font-bold text-muted-foreground/60 max-w-sm text-center uppercase tracking-widest leading-loose">
          Sales, payments, and balance adjustments will appear here as a unified
          cash flow statement.
        </p>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Billed */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
          <div className="absolute top-3 right-3 opacity-10">
            <TrendingUp className="w-10 h-10 text-rose-600" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-600/60 dark:text-rose-400/60 mb-2">
            Total Billed
          </p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
            {formatCurrency(totalBilled)}
          </p>
          <p className="text-[10px] font-bold text-rose-600/40 dark:text-rose-400/40 mt-1 uppercase tracking-widest">
            {transactions.length} sale{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Total Paid */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <div className="absolute top-3 right-3 opacity-10">
            <TrendingDown className="w-10 h-10 text-emerald-600" />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 dark:text-emerald-400/60 mb-2">
            Total Paid
          </p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-[10px] font-bold text-emerald-600/40 dark:text-emerald-400/40 mt-1 uppercase tracking-widest">
            {history.filter((h) =>
              h.event_type.toLowerCase().includes("payment")
            ).length}{" "}
            payment(s)
          </p>
        </div>

        {/* Outstanding Balance */}
        <div
          className={cn(
            "relative overflow-hidden p-5 rounded-2xl border",
            outstanding > 0
              ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30"
              : "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20"
          )}
        >
          <div className="absolute top-3 right-3 opacity-10">
            <Banknote
              className={cn(
                "w-10 h-10",
                outstanding > 0 ? "text-amber-600" : "text-emerald-600"
              )}
            />
          </div>
          <p
            className={cn(
              "text-[9px] font-black uppercase tracking-widest mb-2",
              outstanding > 0
                ? "text-amber-600/60 dark:text-amber-400/60"
                : "text-emerald-600/60 dark:text-emerald-400/60"
            )}
          >
            Outstanding
          </p>
          <p
            className={cn(
              "text-2xl font-black tracking-tight",
              outstanding > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {formatCurrency(outstanding)}
          </p>
          <p
            className={cn(
              "text-[10px] font-bold mt-1 uppercase tracking-widest",
              outstanding > 0
                ? "text-amber-600/40 dark:text-amber-400/40"
                : "text-emerald-600/40 dark:text-emerald-400/40"
            )}
          >
            {outstanding > 0 ? "Pending Settlement" : "Fully Settled"}
          </p>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mr-1">
          Filter:
        </span>
        {(
          [
            { key: "all", label: "All Events" },
            { key: "sale", label: "Sales" },
            { key: "payment", label: "Payments" },
            { key: "adjustment", label: "Adjustments" },
          ] as { key: FilterKind; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border",
              filter === key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-transparent text-muted-foreground/60 border-muted-foreground/20 hover:border-muted-foreground/40"
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
          {filteredEntries.length} record{filteredEntries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Ledger Table ── */}
      <div className="rounded-2xl border dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/20 dark:bg-slate-800/40 border-b dark:border-slate-800">
                {[
                  { label: "Date & Time", align: "left" },
                  { label: "Ref / Event", align: "left" },
                  { label: "Type", align: "left" },
                  { label: "Sale Total", align: "right" },
                  { label: "Amount Paid", align: "right" },
                  { label: "Running Balance", align: "right" },
                  { label: "Status", align: "left" },
                  { label: "Actions", align: "right" },
                ].map(({ label, align }) => (
                  <th
                    key={label}
                    className={cn(
                      "px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-slate-500",
                      align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 dark:divide-slate-800/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                      <AlertCircle className="h-6 w-6" />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        No matching records
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <LedgerRow
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedRows.has(entry.id)}
                    onToggleExpand={() => toggleRow(entry.id)}
                    onViewTransaction={handleViewTransaction}
                    onEditPayment={(e) => setEditPaymentTarget(e)}
                    viewLoading={viewLoading}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <TransactionDetailsDialog
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onEdit={handleEditTransaction}
      />

      {editPaymentTarget && (
        <EditPaymentModal
          isOpen={!!editPaymentTarget}
          onClose={() => setEditPaymentTarget(null)}
          paymentId={editPaymentTarget.history_event_id || editPaymentTarget.id}
          currentAmount={editPaymentTarget.paid_amount ?? 0}
          currentMethod={editPaymentTarget.method || "Cash"}
          onSuccess={handleEditPaymentSuccess}
        />
      )}
    </div>
  );
}
