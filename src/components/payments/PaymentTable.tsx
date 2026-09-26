"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnifiedPayment } from "@/types/payment";
import { Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PaymentEditDialog } from "./PaymentEditDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/context/SettingsContext";
import { formatNumber, getLocaleForIntl } from "@/lib/formatters";

interface PaymentTableProps {
  payments: UnifiedPayment[];
  loading: boolean;
  onUpdate: () => void;
  selectedAccount?: string;
  previousSubtotal?: number;
  hasDateFilter?: boolean;
}

export function PaymentTable({
  payments,
  loading,
  onUpdate,
  selectedAccount = "all",
  previousSubtotal = 0,
  hasDateFilter = false,
}: PaymentTableProps) {
  const { t, i18n } = useTranslation();
  const { getCurrencySymbol } = useSettings();
  const [editingPayment, setEditingPayment] = useState<UnifiedPayment | null>(
    null,
  );

  const paymentsWithSubtotal = useMemo<UnifiedPayment[]>(() => {
    if (!payments || payments.length === 0) return [];

    // Sort chronologically (oldest to newest) to calculate cumulative running subtotal
    const indexed = payments.map((p, index) => ({ p, originalIndex: index }));
    indexed.sort((a, b) => {
      const timeDiff =
        new Date(a.p.date).getTime() - new Date(b.p.date).getTime();
      if (timeDiff !== 0) return timeDiff;
      // If timestamps are equal, preserve chronological order (since payments is newest-first, higher index is older)
      return b.originalIndex - a.originalIndex;
    });

    let runningSubtotal = previousSubtotal;
    const subtotalsByIndex = new Array<number>(payments.length);

    for (const item of indexed) {
      const isCharge = item.p.source_type === "Charge";
      const isTransfer = item.p.source_type === "Transfer";
      if (isCharge) {
        runningSubtotal -= item.p.amount;
      } else if (isTransfer) {
        if (selectedAccount !== "all") {
          if (item.p.source_number === selectedAccount) {
            runningSubtotal -= item.p.amount;
          } else if (item.p.party_name === selectedAccount) {
            runningSubtotal += item.p.amount;
          }
        }
      } else {
        runningSubtotal += item.p.amount;
      }
      subtotalsByIndex[item.originalIndex] = runningSubtotal;
    }

    return payments.map((p, index) => ({
      ...p,
      subtotal: subtotalsByIndex[index] ?? previousSubtotal + p.amount,
    }));
  }, [payments, selectedAccount, previousSubtotal]);

  const finalSubtotal = useMemo(() => {
    if (paymentsWithSubtotal.length > 0) {
      return paymentsWithSubtotal[0]?.subtotal ?? previousSubtotal;
    }
    return previousSubtotal;
  }, [paymentsWithSubtotal, previousSubtotal]);

  const columns = useMemo<ColumnDef<UnifiedPayment>[]>(
    () => [
      {
        accessorKey: "date",
        header: t("common.date"),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              {format(new Date(row.original.date), "MMM dd, yyyy")}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">
              {format(new Date(row.original.date), "HH:mm")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "source_type",
        header: t("payments.source"),
        cell: ({ row }) => {
          const isCharge = row.original.source_type === "Charge";
          const isTransfer = row.original.source_type === "Transfer";

          let badgeText = t(
            `payments.sourceTypes.${row.original.source_type}`,
            row.original.source_type,
          );
          let badgeClass =
            "font-black uppercase text-[9px] tracking-widest px-2 py-0.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none";

          if (isCharge) {
            badgeClass =
              "font-black uppercase text-[9px] tracking-widest px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-none";
          } else if (isTransfer) {
            if (selectedAccount !== "all") {
              const isOut = row.original.source_number === selectedAccount;
              if (isOut) {
                badgeText = t("payments.transferOut", "Transfer Out");
                badgeClass =
                  "font-black uppercase text-[9px] tracking-widest px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-none";
              } else {
                badgeText = t("payments.transferIn", "Transfer In");
                badgeClass =
                  "font-black uppercase text-[9px] tracking-widest px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-none";
              }
            } else {
              badgeClass =
                "font-black uppercase text-[9px] tracking-widest px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-none";
            }
          }

          return (
            <Badge variant="secondary" className={badgeClass}>
              {badgeText}
            </Badge>
          );
        },
      },
      {
        accessorKey: "source_number",
        header: t("payments.reference"),
        cell: ({ row }) => {
          const isTransfer = row.original.source_type === "Transfer";
          return (
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded-md ${
                  isTransfer
                    ? "text-blue-600 dark:text-blue-400 bg-blue-500/10"
                    : "text-primary bg-primary/5"
                }`}
              >
                {isTransfer
                  ? row.original.source_number || "---"
                  : `#${row.original.source_number || "---"}`}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "party_name",
        header: t("payments.party"),
        cell: ({ row }) => {
          const isTransfer = row.original.source_type === "Transfer";
          if (isTransfer) {
            if (selectedAccount !== "all") {
              const isOut = row.original.source_number === selectedAccount;
              return (
                <span className="text-xs font-black text-foreground uppercase tracking-tight flex items-center gap-1">
                  <span
                    className={
                      isOut
                        ? "text-amber-500 font-bold"
                        : "text-emerald-500 font-bold"
                    }
                  >
                    {isOut ? "→" : "←"}
                  </span>
                  <span>
                    {isOut
                      ? row.original.party_name
                      : row.original.source_number}
                  </span>
                </span>
              );
            }
            return (
              <span className="text-xs font-black text-foreground uppercase tracking-tight flex items-center gap-1">
                <span className="text-blue-500 font-bold">→</span>
                {row.original.party_name || "---"}
              </span>
            );
          }
          return (
            <span className="text-xs font-black text-foreground uppercase tracking-tight">
              {row.original.party_name || "---"}
            </span>
          );
        },
      },
      {
        accessorKey: "method",
        header: t("repairs.method"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="px-2 py-0 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-wider"
          >
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: t("common.amount"),
        cell: ({ row }) => {
          const isCharge = row.original.source_type === "Charge";
          const isTransfer = row.original.source_type === "Transfer";
          let isNegative = isCharge;
          let isPositive = false;
          let amountColor = "text-foreground";

          if (isCharge) {
            amountColor = "text-red-500";
          } else if (isTransfer) {
            if (selectedAccount !== "all") {
              const isOut = row.original.source_number === selectedAccount;
              if (isOut) {
                isNegative = true;
                amountColor = "text-amber-600 dark:text-amber-400";
              } else {
                isPositive = true;
                amountColor = "text-emerald-600 dark:text-emerald-400";
              }
            } else {
              amountColor = "text-blue-600 dark:text-blue-400";
            }
          }

          return (
            <div className="flex items-baseline gap-1">
              <span
                className={`font-black text-sm tabular-nums ${amountColor}`}
              >
                {isNegative ? "−" : isPositive ? "+" : ""}
                {formatNumber(
                  row.original.amount,
                  getLocaleForIntl(i18n.language),
                )}
              </span>
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                {getCurrencySymbol()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "subtotal",
        header: t("payments.subtotal", t("common.subtotal", "Subtotal")),
        cell: ({ row }) => {
          const subtotal = row.original.subtotal ?? 0;
          const isNegative = subtotal < 0;
          return (
            <div className="flex items-baseline gap-1">
              <span
                className={`font-black text-sm tabular-nums ${
                  isNegative ? "text-red-500" : "text-foreground"
                }`}
              >
                {isNegative ? "−" : ""}
                {formatNumber(
                  Math.abs(subtotal),
                  getLocaleForIntl(i18n.language),
                )}
              </span>
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                {getCurrencySymbol()}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-all">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-gray-100 dark:border-slate-800 shadow-sm hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() => setEditingPayment(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, i18n, getCurrencySymbol, selectedAccount],
  );

  const table = useReactTable({
    data: paymentsWithSubtotal,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-none hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground font-medium"
                >
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {paymentsWithSubtotal.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4 bg-zinc-50/80 dark:bg-zinc-900/60 border-t-2 border-zinc-200 dark:border-zinc-800">
          {previousSubtotal !== 0 && (
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                {t("payments.openingBalance", "Opening Balance")}
              </span>
              <span
                className={`text-sm font-black tabular-nums ${previousSubtotal < 0 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {previousSubtotal < 0 ? "−" : ""}
                {formatNumber(
                  Math.abs(previousSubtotal),
                  getLocaleForIntl(i18n.language),
                )}
              </span>
            </div>
          )}
          {previousSubtotal !== 0 && (
            <span className="text-muted-foreground/40 font-black text-sm">
              +
            </span>
          )}
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {t("payments.periodMovement", "Period Movement")}
            </span>
            {(() => {
              const movement = finalSubtotal - previousSubtotal;
              return (
                <span
                  className={`text-sm font-black tabular-nums ${movement < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}
                >
                  {movement < 0 ? "−" : "+"}
                  {formatNumber(
                    Math.abs(movement),
                    getLocaleForIntl(i18n.language),
                  )}
                </span>
              );
            })()}
          </div>
          <div className="flex items-baseline gap-2 ml-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              {t("payments.closingBalance", "Closing Balance")}
            </span>
            <span
              className={`text-base font-black tabular-nums ${finalSubtotal < 0 ? "text-red-500" : "text-primary"}`}
            >
              {finalSubtotal < 0 ? "−" : ""}
              {formatNumber(
                Math.abs(finalSubtotal),
                getLocaleForIntl(i18n.language),
              )}
            </span>
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
              {getCurrencySymbol()}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
          {t("common.showingCount", {
            count: table.getRowModel().rows.length,
            total: payments.length,
            label: t("common.items"),
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs h-8 border-zinc-200 dark:border-zinc-700"
          >
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs h-8 border-zinc-200 dark:border-zinc-700"
          >
            {t("common.next")}
          </Button>
        </div>
      </div>

      {editingPayment && (
        <PaymentEditDialog
          payment={editingPayment}
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
