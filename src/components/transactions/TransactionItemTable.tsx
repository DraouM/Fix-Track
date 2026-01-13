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
  const headerBg = isSale ? "bg-green-50/30" : "bg-blue-50/30";

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
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
              ? "bg-green-100/50 border-green-200 text-green-700"
              : "bg-blue-100/50 border-blue-200 text-blue-700"
          )}
        >
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className={cn("header-row", headerBg)}>
              <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">
                {t("transactions_module.itemTable.details")}
              </TableHead>
              <TableHead className="text-center w-[130px] font-bold text-xs uppercase tracking-wider">
                {t("transactions_module.itemTable.qty")}
              </TableHead>
              <TableHead className="text-right w-[150px] font-bold text-xs uppercase tracking-wider">
                {isSale
                  ? t("transactions_module.itemTable.sellingPrice")
                  : t("transactions_module.itemTable.unitCost")}
              </TableHead>
              <TableHead className="text-right w-[150px] font-bold text-xs uppercase tracking-wider pr-6">
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
                  className="group hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-6">
                    <p className="font-semibold text-sm text-foreground">
                      {item.item_name}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-sm border-muted-foreground/20 hover:border-primary hover:text-primary transition-all"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <input
                        type="number"
                        className="w-10 text-center text-sm font-bold bg-transparent border-none focus:ring-0"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          onUpdateQuantity(item.id, val - item.quantity);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-sm border-muted-foreground/20 hover:border-primary hover:text-primary transition-all"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <div className="relative w-28 group/input">
                        <Input
                          type="number"
                          className="h-8 text-right text-sm font-bold bg-muted/30 border-transparent group-hover/input:border-input focus:bg-background transition-all"
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
                  <TableCell className="text-right font-bold text-sm text-foreground pr-6">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
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
                  className="py-24 text-center text-muted-foreground bg-muted/5"
                >
                  <div className="flex flex-col items-center justify-center gap-3 grayscale opacity-30">
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
