"use client";

import React from "react";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  Package,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/clientUtils";
import { TransactionItem, TransactionType } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TransactionItemTableProps {
  type: TransactionType;
  items: TransactionItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemoveItem: (id: string) => void;
}

export function TransactionItemTable({
  type,
  items,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}: TransactionItemTableProps) {
  const isSale = type === "Sale";
  const { t } = useTranslation();
  const accentColor = isSale ? "text-green-600" : "text-blue-600";
  const headerBg = isSale ? "bg-green-50/30 dark:bg-green-900/10" : "bg-blue-50/30 dark:bg-blue-900/10";
  const cardBg = "bg-white dark:bg-slate-900";

  return (
    <Card className={cn("border dark:border-slate-800 shadow-sm overflow-hidden", cardBg)}>
      <CardHeader className="pb-3 border-b dark:border-slate-800 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {isSale ? (
            <ShoppingCart className={cn("h-5 w-5", accentColor)} />
          ) : (
            <Package className={cn("h-5 w-5", accentColor)} />
          )}
          {isSale
            ? t("transactions_module.itemTable.title.sale")
            : t("transactions_module.itemTable.title.purchase")}
        </CardTitle>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            isSale
              ? "bg-green-100/50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-blue-100/50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
          )}
        >
          {t("transactions_module.itemTable.itemsCount", { 
            count: items.length, 
            label: items.length === 1 ? t("common.item") : t("common.items") 
          })}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className={cn("header-row", headerBg)}>
              <TableHead className="font-bold text-xs uppercase tracking-wider pl-6 dark:text-slate-400">
                {t("transactions_module.itemTable.details")}
              </TableHead>
              <TableHead className="text-center w-[130px] font-bold text-xs uppercase tracking-wider dark:text-slate-400">
                {t("transactions_module.itemTable.qty")}
              </TableHead>
              <TableHead className="text-right w-[150px] font-bold text-xs uppercase tracking-wider dark:text-slate-400">
                {isSale
                  ? t("transactions_module.itemTable.sellingPrice")
                  : t("transactions_module.itemTable.unitCost")}
              </TableHead>
              <TableHead className="text-right w-[150px] font-bold text-xs uppercase tracking-wider pr-6 dark:text-slate-400">
                {t("transactions_module.itemTable.total")}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="group hover:bg-muted/30 dark:hover:bg-slate-800/30 transition-colors border-b dark:border-slate-800"
                >
                  <TableCell className="pl-6">
                    <p className="font-semibold text-sm text-foreground dark:text-slate-200">
                      {item.item_name}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-muted-foreground dark:text-slate-400 mt-0.5">
                        {item.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-sm border-muted-foreground/20 dark:border-slate-700 hover:border-primary hover:text-primary transition-all dark:bg-slate-800"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3 dark:text-slate-400" />
                      </Button>
                      <input
                        type="number"
                        className="w-10 text-center text-sm font-bold bg-transparent border-none focus:ring-0 dark:text-slate-200"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onUpdateQuantity(item.id, val - item.quantity);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-sm border-muted-foreground/20 dark:border-slate-700 hover:border-primary hover:text-primary transition-all dark:bg-slate-800"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3 dark:text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <div className="relative w-28 group/input">
                        <Input
                          type="number"
                          className="h-8 text-right text-sm font-bold bg-muted/30 dark:bg-slate-800 border-transparent group-hover/input:border-input focus:bg-background dark:focus:bg-slate-700 transition-all dark:text-slate-200"
                          value={item.unit_price}
                          onChange={(e) =>
                            onUpdatePrice(
                              item.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm text-foreground dark:text-slate-200 pr-6">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-24 text-center text-muted-foreground dark:text-slate-500 bg-muted/5 dark:bg-slate-800/20"
                >
                  <div className="flex flex-col items-center justify-center gap-3 grayscale opacity-30 dark:opacity-40">
                    <ShoppingCart className="h-14 w-14" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {t("transactions_module.form.emptyBasket")}
                      </p>
                      <p className="text-[11px]">
                        {t("transactions_module.form.itemPlaceholder")}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
