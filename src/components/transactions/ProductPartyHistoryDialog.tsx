"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Loader2,
  Package,
  TrendingUp,
  Boxes,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTransactions, getTransactionById } from "@/lib/api/transactions";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface ProductPartyHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Sale" = sold to a client, "Purchase" = purchased from a supplier */
  txType: "Sale" | "Purchase";
  /** Inventory item id of the selected line (when available) */
  itemId?: string;
  /** Display name of the selected item (fallback matcher) */
  itemName: string;
  /** Client/supplier (party) id the history is scoped to */
  partyId: string;
  /** Party name shown in the header */
  partyName: string;
  /** Workspace transaction id, excluded from the results while editing */
  currentTxId?: string;
}

interface ProductHistoryRow {
  transactionId: string;
  transactionNumber: string;
  date: string;
  quantity: number;
  amount: number;
}

/**
 * Keyboard-triggered (Ctrl+Shift+H) popup showing, for the currently selected
 * line item, every past transaction with the currently selected party
 * (client sales or supplier purchases) that contained this exact product:
 * aggregated units/value plus the detailed history.
 */
export function ProductPartyHistoryDialog({
  open,
  onOpenChange,
  txType,
  itemId,
  itemName,
  partyId,
  partyName,
  currentTxId,
}: ProductPartyHistoryDialogProps) {
  const { t } = useTranslation();
  const isSale = txType === "Sale";
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ProductHistoryRow[]>([]);

  useEffect(() => {
    if (!open || !itemName || !partyId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // All transactions of this type for this party
        const txs = await getTransactions(txType, null, partyId);
        const relevant = txs.filter(
          (tx) => tx.id !== currentTxId && tx.status !== "Cancelled",
        );

        const details = await Promise.all(
          relevant.map((tx) => getTransactionById(tx.id)),
        );

        const matched: ProductHistoryRow[] = [];
        details.forEach((d) => {
          if (!d) return;
          // Match on the inventory item id, falling back to the line name
          const lines = d.items.filter(
            (i) =>
              (itemId && i.item_id === itemId) ||
              (!itemId && i.item_name === itemName) ||
              (itemId && !i.item_id && i.item_name === itemName),
          );
          if (lines.length === 0) return;
          matched.push({
            transactionId: d.transaction.id,
            transactionNumber: d.transaction.transaction_number,
            date: d.transaction.created_at,
            quantity: lines.reduce((sum, l) => sum + l.quantity, 0),
            amount: lines.reduce((sum, l) => sum + l.total_price, 0),
          });
        });

        if (!cancelled) {
          matched.sort((a, b) => b.date.localeCompare(a.date));
          setRows(matched);
        }
      } catch (err) {
        console.error("Failed to load product history:", err);
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, txType, itemId, itemName, partyId, currentTxId]);

  const totals = rows.reduce(
    (acc, r) => {
      acc.units += r.quantity;
      acc.revenue += r.amount;
      return acc;
    },
    { units: 0, revenue: 0 },
  );
  const avgUnitPrice = totals.units > 0 ? totals.revenue / totals.units : 0;

  const summaryTiles = [
    {
      icon: Boxes,
      label: t("transactions_module.itemHistory.totalUnits"),
      value: String(totals.units),
      tint: "text-green-600",
    },
    {
      icon: TrendingUp,
      label: t("transactions_module.itemHistory.totalRevenue"),
      value: formatCurrency(totals.revenue),
      tint: "text-emerald-600",
    },
    {
      icon: Receipt,
      label: t("transactions_module.itemHistory.timesPurchased"),
      value: String(rows.length),
      tint: "text-primary",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden p-0 dark:bg-slate-900">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b dark:border-slate-800 bg-muted/20 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                isSale
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-blue-100 dark:bg-blue-900/30",
              )}
            >
              <History
                className={cn(
                  "h-5 w-5",
                  isSale
                    ? "text-green-600 dark:text-green-400"
                    : "text-blue-600 dark:text-blue-400",
                )}
              />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-black tracking-tight dark:text-slate-100 truncate">
                {itemName}
              </DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500 mt-0.5">
                {t(
                  isSale
                    ? "transactions_module.itemHistory.subtitleSale"
                    : "transactions_module.itemHistory.subtitlePurchase",
                  { party: partyName || "—" },
                )}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Aggregated summary tiles */}
          <div className="grid grid-cols-3 gap-3">
            {summaryTiles.map(({ icon: Icon, label, value, tint }) => (
              <div
                key={label}
                className="p-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon className={cn("h-3.5 w-3.5", tint)} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500">
                    {label}
                  </span>
                </div>
                <p className="text-xl font-black tracking-tight text-foreground dark:text-slate-100 truncate">
                  {loading ? "…" : value}
                </p>
              </div>
            ))}
          </div>

          {/* Detailed history list */}
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground dark:text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest">
                {t("transactions_module.itemHistory.loading")}
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground dark:text-slate-500 bg-muted/5 dark:bg-slate-800/20 rounded-xl">
              <div className="grayscale opacity-30 dark:opacity-40">
                <Package className="h-12 w-12" />
              </div>
              <p className="text-sm font-medium text-center max-w-[320px]">
                {t(
                  isSale
                    ? "transactions_module.itemHistory.emptySale"
                    : "transactions_module.itemHistory.emptyPurchase",
                )}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
              {/* Column header */}
              <div className="grid grid-cols-[1fr_90px_110px_110px_110px] items-center px-4 py-2.5 bg-muted/30 dark:bg-slate-800/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500">
                <span>{t("transactions_module.itemHistory.transaction")}</span>
                <span className="text-center">
                  {t("transactions_module.itemHistory.date")}
                </span>
                <span className="text-center">
                  {t("transactions_module.itemHistory.qty")}
                </span>
                <span className="text-right">
                  {t("transactions_module.itemHistory.unitPrice")}
                </span>
                <span className="text-right">
                  {t("transactions_module.itemHistory.amount")}
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <div
                    key={row.transactionId}
                    className="grid grid-cols-[1fr_90px_110px_110px_110px] items-center px-4 py-3 hover:bg-muted/30 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground dark:text-slate-200 truncate">
                        {row.transactionNumber}
                      </span>
                    </div>
                    <span className="text-center text-xs font-medium text-muted-foreground dark:text-slate-400">
                      {formatDate(row.date)}
                    </span>
                    <span className="text-center text-sm font-black text-foreground dark:text-slate-200">
                      {row.quantity}
                    </span>
                    <span className="text-right text-xs font-medium text-muted-foreground dark:text-slate-400">
                      {formatCurrency(
                        row.quantity > 0 ? row.amount / row.quantity : 0,
                      )}
                    </span>
                    <span className="text-right text-sm font-black text-foreground dark:text-slate-200">
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer hint */}
          {!loading && rows.length > 0 && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-slate-600 text-center">
              {t("transactions_module.itemHistory.avgPrice", {
                price: formatCurrency(avgUnitPrice),
              })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
