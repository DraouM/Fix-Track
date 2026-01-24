import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TransactionWithDetails } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Calendar,
  CreditCard,
  FileText,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithDetails | null;
  onEdit: (transaction: TransactionWithDetails) => void;
}

export function TransactionDetailsDialog({
  isOpen,
  onClose,
  transaction,
  onEdit,
}: TransactionDetailsDialogProps) {
  const { t } = useTranslation();

  if (!transaction) return null;

  const { transaction: tx, items, payments, party_name } = transaction;
  const isSale = tx.transaction_type === "Sale";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl dark:bg-slate-950 dark:border-slate-800">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                {tx.transaction_number}
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-widest",
                    isSale
                      ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900"
                      : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900"
                  )}
                >
                  {isSale ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                  )}
                  {t(
                    `transactions_module.${tx.transaction_type.toLowerCase()}`
                  )}
                </Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground dark:text-slate-500 font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(tx.created_at)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <Badge
                variant={tx.status === "Completed" ? "default" : "secondary"}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest",
                  tx.status === "Completed"
                    ? "bg-green-600 dark:bg-green-700 hover:bg-green-700"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200"
                )}
              >
                {t(`status.${tx.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
          <div className="p-4 rounded-2xl bg-muted/30 dark:bg-slate-900 border dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500">
              {t(
                isSale
                  ? "transactions_module.party.client"
                  : "transactions_module.party.supplier"
              )}
            </span>
            <div className="flex items-center gap-2 text-base font-bold text-foreground dark:text-slate-200">
              <User className="w-4 h-4 opacity-50" />
              {party_name}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 dark:bg-slate-900 border dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500">
              {t("transactions_module.summary.paymentMethod")}
            </span>
            <div className="flex items-center gap-2 text-base font-bold text-foreground dark:text-slate-200">
              <CreditCard className="w-4 h-4 opacity-50" />
              {payments.length > 0 ? payments[0].method : t("repairs.unpaid")}
            </div>
          </div>
        </div>

        {tx.notes && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-xl flex gap-3 text-sm text-amber-900 dark:text-amber-400">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <p>{tx.notes}</p>
          </div>
        )}

        <div className="space-y-3 mt-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500">
            {t("transactions_module.items")}
          </h3>
          <div className="border dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 dark:bg-slate-900 text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("common.item")}</th>
                  <th className="px-4 py-3 text-center">
                    {t("common.quantity")}
                  </th>
                  <th className="px-4 py-3 text-right">{t("common.price")}</th>
                  <th className="px-4 py-3 text-right">{t("common.total")}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="dark:bg-slate-950/50">
                    <td className="px-4 py-3 font-medium dark:text-slate-300">
                      {item.item_name}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground dark:text-slate-500">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground dark:text-slate-500">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold dark:text-slate-300">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 mt-4 pt-4 border-t dark:border-slate-800">
          <div className="flex justify-between w-full md:w-1/2">
            <span className="text-sm text-muted-foreground dark:text-slate-500 font-medium">
              {t("repairs.subtotal")}
            </span>
            <span className="text-sm font-bold dark:text-slate-300">
              {formatCurrency(tx.total_amount)}
            </span>
          </div>
          <div className="flex justify-between w-full md:w-1/2">
            <span className="text-sm text-muted-foreground dark:text-slate-500 font-medium">
              {t("repairs.paid")}
            </span>
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {formatCurrency(tx.paid_amount)}
            </span>
          </div>
          <Separator className="my-1 w-full md:w-1/2 dark:bg-slate-800" />
          <div className="flex justify-between w-full md:w-1/2">
            <span className="text-lg font-black uppercase tracking-tight dark:text-slate-200">
              {t("common.total")}
            </span>
            <span className="text-lg font-black text-primary">
              {formatCurrency(tx.total_amount)}
            </span>
          </div>
        </div>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl h-12 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
          >
            {t("common.close")}
          </Button>
          <Button
            onClick={() => onEdit(transaction)}
            className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20"
          >
            <Pencil className="w-4 h-4 mr-2" />
            {t("common.edit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
