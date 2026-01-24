
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowDownLeft, ArrowUpRight, Minus, Plus, Box } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import { SupplierHistoryEvent } from "@/types/supplier";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext"; // Assuming we need currency settings

interface SupplierHistoryListProps {
  history?: SupplierHistoryEvent[];
  isLoading?: boolean;
}

export function SupplierHistoryList({ history, isLoading }: SupplierHistoryListProps) {
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <Card className="border dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="border dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            No history recorded for this supplier.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border dark:border-slate-800 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 dark:bg-slate-900 border-b dark:border-slate-800">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((event) => {
               // Determine icon and color based on event type
               const isPayment = event.type === "Payment Made";
               const isPurchase = event.type === "Purchase Order Created" || event.type === "Purchase Order Completed";
               const isAdjustment = event.type === "Credit Balance Adjusted";
               
               let icon = <Clock className="w-4 h-4" />;
               let badgeClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
               
               if (isPayment) {
                 icon = <ArrowUpRight className="w-4 h-4" />; // Money going out to supplier
                 badgeClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
               } else if (isPurchase) {
                 icon = <Box className="w-4 h-4" />;
                 badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
               } else if (isAdjustment) {
                 icon = (event.amount || 0) < 0 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />;
                 badgeClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
               }

              return (
                <TableRow key={event.id} className="group hover:bg-muted/50 dark:hover:bg-slate-800/50">
                  <TableCell className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("gap-1.5 py-0.5 pr-2.5 font-bold uppercase text-[10px] tracking-wide", badgeClass)}>
                      {icon}
                      {event.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {event.notes || "-"}
                    {event.userId && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        by {event.userId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {event.amount !== undefined && event.amount !== 0 && (
                      <span className={cn(
                        (event.amount || 0) > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                      )}>
                        {(event.amount || 0) > 0 ? "+" : ""}{formatCurrency(event.amount || 0, settings?.currency)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
