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
import { Edit, Trash2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PaymentEditDialog } from "./PaymentEditDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/context/SettingsContext";
import { formatNumber, getLocaleForIntl } from "@/lib/formatters";

interface PaymentTableProps {
  payments: UnifiedPayment[];
  loading: boolean;
  onUpdate: () => void;
}

export function PaymentTable({ payments, loading, onUpdate }: PaymentTableProps) {
  const { t, i18n } = useTranslation();
  const { getCurrencySymbol } = useSettings();
  const [editingPayment, setEditingPayment] = useState<UnifiedPayment | null>(null);

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
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-black uppercase text-[9px] tracking-widest px-2 py-0.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-none">
            {t(`payments.sourceTypes.${row.original.source_type}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "source_number",
        header: t("payments.reference"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-black text-[10px] uppercase tracking-tighter text-primary bg-primary/5 px-2 py-0.5 rounded-md">
              #{row.original.source_number || "---"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "party_name",
        header: t("payments.party"),
        cell: ({ row }) => (
          <span className="text-xs font-black text-foreground uppercase tracking-tight">
            {row.original.party_name || "---"}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: t("repairs.method"),
        cell: ({ row }) => (
          <Badge variant="outline" className="px-2 py-0 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-wider">
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "amount",
        header: t("common.amount"),
        cell: ({ row }) => (
          <div className="flex items-baseline gap-1">
             <span className="font-black text-sm text-foreground tabular-nums">
               {formatNumber(row.original.amount, getLocaleForIntl(i18n.language))}
             </span>
             <span className="text-[10px] font-black text-muted-foreground/60 uppercase">{getCurrencySymbol()}</span>
          </div>
        ),
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
    [t, i18n, getCurrencySymbol]
  );

  const table = useReactTable({
    data: payments,
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
              <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-6">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground font-medium">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
          {t("common.showingCount", { count: table.getRowModel().rows.length, total: payments.length, label: t("common.items") })}
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
