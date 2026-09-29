"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  InventoryItem,
  StockMovement,
  HistoryEventType,
} from "@/types/inventory";
import {
  getMovementUnitPrice,
  getMovementValue,
  computeStockLevels,
} from "@/hooks/useStockMovementFilters";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Package,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Wrench,
  RotateCcw,
  Settings,
  Calendar,
  Layers,
  User,
  Building2,
} from "lucide-react";

import { useTranslation } from "react-i18next";

// --- Props ---
interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null; // full item (null when the item was deleted)
  historyEvents: StockMovement[]; // movements already fetched in parent
}

// --- Status Icon Helper (exported for reuse in the Stock Movement view) ---
export const getEventIcon = (type: HistoryEventType) => {
  switch (type) {
    case "Purchased":
      return <ArrowDownLeft className="w-3.5 h-3.5" />;
    case "Sold":
      return <ArrowUpRight className="w-3.5 h-3.5" />;
    case "Used in Repair":
      return <Wrench className="w-3.5 h-3.5" />;
    case "Returned":
      return <RotateCcw className="w-3.5 h-3.5" />;
    case "Manual Correction":
      return <Settings className="w-3.5 h-3.5" />;
    default:
      return <History className="w-3.5 h-3.5" />;
  }
};

export const getEventColor = (type: HistoryEventType) => {
  switch (type) {
    case "Purchased":
      return "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/50";
    case "Sold":
      return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50";
    case "Used in Repair":
      return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50";
    case "Returned":
      return "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50";
    case "Manual Correction":
      return "bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-800";
    default:
      return "bg-muted dark:bg-slate-800 text-muted-foreground dark:text-slate-400 border-border dark:border-slate-700";
  }
};

// --- Component ---
export function InventoryHistoryDialog({
  open,
  onOpenChange,
  item,
  historyEvents,
}: InventoryHistoryDialogProps) {
  const { t } = useTranslation();

  // Sort history (newest first)
  const sortedHistory = [...historyEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Fall back to movement data when the item itself is no longer available
  const itemName =
    item?.itemName ??
    sortedHistory[0]?.itemName ??
    t("inventory.stockMovement.deletedItem");
  const itemType = item?.itemType ?? sortedHistory[0]?.itemType;

  // Stock level remaining after each movement
  const stockLevels = computeStockLevels(historyEvents);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden rounded-3xl border dark:border-slate-800 shadow-2xl dark:bg-slate-950">
        <div className="bg-primary/5 dark:bg-primary/10 p-4 border-b border-primary/10 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-primary">
                <History className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight leading-tight dark:text-slate-100">
                  {t("common.history")}
                </DialogTitle>
                <DialogDescription className="text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500 opacity-60">
                  {itemName}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 dark:border-slate-800">
                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500 opacity-60 mb-0.5 flex items-center gap-1.5">
                  <Layers className="w-2.5 h-2.5" />
                  {t("inventory.table.stock")}
                </div>
                <div className="text-sm font-black lead-none dark:text-slate-100">
                  {item?.quantityInStock ?? "—"}
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 dark:border-slate-800">
                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500 opacity-60 mb-0.5 flex items-center gap-1.5">
                  <Calendar className="w-2.5 h-2.5" />
                  {t("repairs.historyLogs").split(" ")[0]} {t("common.date")}
                </div>
                <div className="text-[10px] font-bold leading-none dark:text-slate-300">
                  {sortedHistory.length > 0
                    ? format(new Date(sortedHistory[0].date), "MMM d")
                    : "N/A"}
                </div>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-2 border border-white/50 dark:border-slate-800">
                <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500 opacity-60 mb-0.5 flex items-center gap-1.5">
                  <Package className="w-2.5 h-2.5" />
                  {t("common.type")}
                </div>
                <div className="text-[9px] font-black uppercase tracking-wider text-primary truncate leading-none">
                  {itemType ?? "—"}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Movements Table */}
        <div className="p-4">
          {sortedHistory.length > 0 ? (
            <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="flex items-center h-10 bg-muted/10 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 px-3">
                <div className="w-40 shrink-0 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("inventory.stockMovement.table.movement")}
                </div>
                <div className="w-36 shrink-0 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("common.date")}
                </div>
                <div className="flex-[1.3] min-w-0 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 pr-2">
                  {t("inventory.stockMovement.table.party")}
                </div>
                <div className="w-16 shrink-0 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("inventory.stockMovement.table.qty")}
                </div>
                <div className="w-20 shrink-0 text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("inventory.stockMovement.table.qtyLeft")}
                </div>
                <div className="w-24 shrink-0 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 pr-3">
                  {t("inventory.stockMovement.table.unit")}
                </div>
                <div className="w-24 shrink-0 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 pr-3">
                  {t("inventory.stockMovement.table.value")}
                </div>
                <div className="flex-1 min-w-0 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {t("common.notes")}
                </div>
              </div>

              {/* Table Rows */}
              <ScrollArea className="max-h-[340px]">
                <div className="bg-white dark:bg-slate-900">
                  {sortedHistory.map((event) => {
                    const isInbound = event.quantityChange > 0;
                    const unitPrice = getMovementUnitPrice(event);
                    const value = getMovementValue(event);
                    const isSupplier =
                      event.type === "Purchased" || event.type === "Returned";
                    return (
                      <div
                        key={event.id}
                        className="flex items-center h-14 border-b border-gray-50 dark:border-slate-800/60 last:border-b-0 hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-colors group px-3"
                      >
                        {/* Movement type */}
                        <div className="w-40 shrink-0 flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform",
                              getEventColor(event.type),
                            )}
                          >
                            {getEventIcon(event.type)}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-foreground dark:text-slate-200 truncate">
                            {t(
                              `inventory.stockMovement.movementTypes.${event.type}`,
                              { defaultValue: event.type },
                            )}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="w-36 shrink-0 flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-foreground dark:text-slate-300 leading-none truncate">
                            {format(new Date(event.date), "MMM d, yyyy")}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground dark:text-slate-500 opacity-60 mt-0.5">
                            {format(new Date(event.date), "p")}
                          </span>
                        </div>

                        {/* Counterparty + source document */}
                        <div className="flex-[1.3] min-w-0 pr-2">
                          {event.movementParty ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isSupplier ? (
                                <Building2 className="w-3 h-3 text-green-600 dark:text-green-400 shrink-0" />
                              ) : (
                                <User className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black text-foreground dark:text-slate-200 truncate leading-none">
                                  {event.movementParty}
                                </span>
                                <span className="text-[8px] font-bold text-muted-foreground dark:text-slate-500 opacity-60 uppercase tracking-wider mt-0.5 truncate">
                                  {t(
                                    isSupplier
                                      ? "inventory.stockMovement.details.from"
                                      : "inventory.stockMovement.details.to",
                                  )}
                                  {event.movementReference
                                    ? ` · ${event.movementReference}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                              —
                            </span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="w-16 shrink-0 flex justify-center">
                          <div
                            className={cn(
                              "px-1.5 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 shadow-sm",
                              isInbound
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white",
                            )}
                          >
                            {isInbound
                              ? `+${event.quantityChange}`
                              : event.quantityChange}
                          </div>
                        </div>

                        {/* Quantity left after this movement */}
                        <div className="w-20 shrink-0 flex justify-center">
                          <span className="text-[10px] font-black text-foreground dark:text-slate-300 tabular-nums">
                            {stockLevels.get(event.id) ?? "—"}
                          </span>
                        </div>

                        {/* Unit price */}
                        <div className="w-24 shrink-0 text-right pr-3">
                          <span
                            className={cn(
                              "text-[11px] font-black tracking-tight",
                              event.movementPrice != null
                                ? "text-foreground dark:text-slate-200"
                                : "text-muted-foreground/60 dark:text-slate-500",
                            )}
                          >
                            {unitPrice.toFixed(2)}
                          </span>
                          {event.movementPrice == null && unitPrice > 0 && (
                            <div className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40">
                              {t("inventory.stockMovement.table.current")}
                            </div>
                          )}
                        </div>

                        {/* Value */}
                        <div className="w-24 shrink-0 text-right pr-3">
                          <span
                            className={cn(
                              "text-[11px] font-black tracking-tight",
                              value > 0 && "text-green-600 dark:text-green-400",
                              value < 0 && "text-red-600 dark:text-red-400",
                              value === 0 &&
                                "text-muted-foreground dark:text-slate-500 opacity-40",
                            )}
                          >
                            {value > 0 ? "+" : ""}
                            {value.toFixed(2)}
                          </span>
                        </div>

                        {/* Notes */}
                        <div className="flex-1 min-w-0 pl-2">
                          {event.notes && (
                            <span
                              className="block text-[9px] font-medium text-muted-foreground dark:text-slate-400 italic truncate"
                              title={event.notes}
                            >
                              {event.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-16">
              <div className="p-3 rounded-full bg-gray-50 dark:bg-slate-900 mb-2">
                <Package className="w-6 h-6 text-gray-400 dark:text-slate-600" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] dark:text-slate-400">
                {t("repairs.noHistory")}
              </p>
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50/50 dark:bg-slate-900/50 border-t dark:border-slate-800 flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 dark:text-slate-300 transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
