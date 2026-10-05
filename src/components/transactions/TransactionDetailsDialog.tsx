import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import {
  TransactionWithDetails,
  Transaction as TxModel,
  TransactionItem as TxItemModel,
  TransactionPayment as TxPaymentModel,
} from "@/types/transaction";
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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useTransactions } from "@/context/TransactionContext";
import { useEvents } from "@/context/EventContext";
import { updateTransaction } from "@/lib/api/transactions";
import { getCurrentSession } from "@/lib/api/session";
import { TransactionItemTable } from "./TransactionItemTable";
import { TransactionPartySelector } from "./TransactionPartySelector";
import { TransactionSummary } from "./TransactionSummary";

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithDetails | null;
  onEdit: (transaction: TransactionWithDetails) => void;
  /** When true, the Edit button flips this dialog into an inline editing
   *  form (same components and tokens as TransactionForm) instead of
   *  delegating to the parent's onEdit navigation flow. */
  inlineEdit?: boolean;
  /** Called after a successful save so the caller can refresh its data. */
  onEdited?: () => void;
}

export function TransactionDetailsDialog({
  isOpen,
  onClose,
  transaction,
  onEdit,
  inlineEdit = false,
  onEdited,
}: TransactionDetailsDialogProps) {
  const { t } = useTranslation();
  const {
    editTransaction,
    activeWorkspace,
    updateActiveWorkspace,
    removeWorkspace,
  } = useTransactions();
  const { emit } = useEvents();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Leaving the dialog always drops out of edit mode.
  useEffect(() => {
    if (!isOpen) setIsEditing(false);
  }, [isOpen]);

  if (!transaction) return null;

  const { transaction: tx, items, payments, party_name } = transaction;
  const isSale = tx.transaction_type === "Sale";

  // Editing runs through the shared transaction workspace, exactly like
  // TransactionForm does, so behavior and design tokens stay identical.
  const editingWs =
    isEditing && activeWorkspace?.id === tx.id ? activeWorkspace : null;

  const editTotal = editingWs
    ? editingWs.items.reduce((sum, i) => sum + i.total_price, 0)
    : 0;

  const handleStartEdit = () => {
    editTransaction(transaction);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    removeWorkspace(tx.id);
    setIsEditing(false);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    if (!editingWs) return;
    const newItems = editingWs.items.map((item) => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          total_price: newQty * item.unit_price,
        };
      }
      return item;
    });
    updateActiveWorkspace({ items: newItems });
  };

  const updatePrice = (itemId: string, newPrice: number) => {
    if (!editingWs) return;
    const newItems = editingWs.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            unit_price: newPrice,
            total_price: item.quantity * newPrice,
          }
        : item,
    );
    updateActiveWorkspace({ items: newItems });
  };

  const removeItem = (itemId: string) => {
    if (!editingWs) return;
    updateActiveWorkspace({
      items: editingWs.items.filter((i) => i.id !== itemId),
    });
  };

  const handleSave = async (complete: boolean) => {
    if (!editingWs) return;
    if (!editingWs.party_id) {
      toast.error(
        t("transactions_module.form.selectPartyError", {
          type: t(
            `transactions_module.party.${editingWs.party_type.toLowerCase()}`,
          ),
        }),
      );
      return;
    }
    if (editingWs.items.length === 0) {
      toast.error(t("transactions_module.form.addItemError"));
      return;
    }

    setIsSaving(true);
    try {
      const session = await getCurrentSession();
      const now = new Date().toISOString();

      const transactionModel: TxModel = {
        ...tx,
        party_id: editingWs.party_id,
        status: complete ? "Completed" : "Draft",
        payment_status: "Unpaid", // Backend recalculates
        total_amount: editTotal,
        paid_amount: editingWs.paid_amount,
        notes: editingWs.notes || "",
        updated_at: now,
      };

      const itemModels: TxItemModel[] = editingWs.items.map((item) => ({
        id: item.id,
        transaction_id: tx.id,
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: "",
      }));

      const paymentModels: TxPaymentModel[] =
        editingWs.paid_amount > 0
          ? [
              {
                id: uuidv4(),
                transaction_id: tx.id,
                amount: editingWs.paid_amount,
                method: editingWs.payment_method,
                date: now,
                received_by: "System",
                notes: t("transactions_module.summary.paymentFor", {
                  type: t(
                    `transactions_module.${tx.transaction_type.toLowerCase()}`,
                  ),
                }),
                session_id: session?.id || null,
              },
            ]
          : [];

      await updateTransaction(transactionModel, itemModels, paymentModels);
      emit("financial-data-change");

      toast.success(
        t("transactions_module.form.success", {
          type: t(`transactions_module.${tx.transaction_type.toLowerCase()}`),
          status: complete
            ? t("transactions_module.form.completed")
            : t("transactions_module.form.savedAsDraft"),
        }),
      );

      removeWorkspace(tx.id);
      setIsEditing(false);
      onEdited?.();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      toast.error(
        t("transactions_module.form.error", {
          type: t(`transactions_module.${tx.transaction_type.toLowerCase()}`),
          error: String(err),
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto rounded-3xl dark:bg-slate-950 dark:border-slate-800",
          editingWs ? "max-w-6xl" : "max-w-3xl",
        )}
      >
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
                      : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900",
                  )}
                >
                  {isSale ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownLeft className="w-3 h-3 mr-1" />
                  )}
                  {t(
                    `transactions_module.${tx.transaction_type.toLowerCase()}`,
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
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200",
                )}
              >
                {t(`status.${tx.status.toLowerCase()}`)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {editingWs ? (
          /* Inline edit mode: same two-column layout & components as
             TransactionForm, rendered compactly inside this dialog. */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in-50 duration-300">
            {/* Left: editable items + notes */}
            <div className="xl:col-span-8 space-y-6">
              <TransactionItemTable
                type={editingWs.type}
                items={editingWs.items}
                onUpdateQuantity={updateQuantity}
                onUpdatePrice={updatePrice}
                onRemoveItem={removeItem}
              />
              <div className="rounded-2xl border dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-4 flex gap-4 items-center">
                <div className="h-10 w-10 rounded-xl bg-muted dark:bg-slate-800 flex items-center justify-center text-muted-foreground dark:text-slate-400 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <Input
                  placeholder={t("transactions_module.form.notesPlaceholder")}
                  value={editingWs.notes}
                  onChange={(e) =>
                    updateActiveWorkspace({ notes: e.target.value })
                  }
                  className="border-none focus-visible:ring-0 bg-transparent h-12 text-sm font-medium"
                />
              </div>
            </div>

            {/* Right: party selector + summary / save panel */}
            <div className="xl:col-span-4 space-y-6">
              <TransactionPartySelector
                type={editingWs.party_type}
                selectedId={editingWs.party_id}
                onSelect={(id) => updateActiveWorkspace({ party_id: id })}
              />
              <TransactionSummary
                type={editingWs.type}
                totalAmount={editTotal}
                paidAmount={editingWs.paid_amount}
                paymentMethod={editingWs.payment_method}
                isSaving={isSaving}
                onUpdatePaidAmount={(amount) =>
                  updateActiveWorkspace({ paid_amount: amount })
                }
                onUpdatePaymentMethod={(method) =>
                  updateActiveWorkspace({ payment_method: method })
                }
                onComplete={() => handleSave(true)}
                onSaveDraft={() => handleSave(false)}
                disabled={editingWs.items.length === 0}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-2xl bg-muted/30 dark:bg-slate-900 border dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500">
                  {t(
                    isSale
                      ? "transactions_module.party.client"
                      : "transactions_module.party.supplier",
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
                  {payments.length > 0
                    ? payments[0].method
                    : t("repairs.unpaid")}
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
                      <th className="px-4 py-3 text-right">
                        {t("common.price")}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {t("common.total")}
                      </th>
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
          </>
        )}

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          {editingWs ? (
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-xl h-12 px-6 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
            >
              <X className="w-4 h-4 mr-2" />
              {t("common.cancel")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-xl h-12 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
              >
                {t("common.close")}
              </Button>
              <Button
                onClick={
                  inlineEdit ? handleStartEdit : () => onEdit(transaction)
                }
                className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {t("common.edit")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
