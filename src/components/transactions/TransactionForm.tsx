"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import {
  ArrowLeft,
  History,
  LayoutGrid,
  Settings,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/context/TransactionContext";
import { TransactionWorkspace } from "./TransactionWorkspace";
import { TransactionPartySelector } from "./TransactionPartySelector";
import { TransactionItemTable } from "./TransactionItemTable";
import { TransactionSummary } from "./TransactionSummary";
import { TransactionScanner } from "./TransactionScanner";
import { InventoryItem } from "@/types/inventory";
import { cn } from "@/lib/utils";
import { submitTransaction, updateTransaction } from "@/lib/api/transactions";
import { getCurrentSession } from "@/lib/api/session";
import {
  Transaction as TxModel,
  TransactionItem as TxItemModel,
  TransactionPayment as TxPaymentModel,
} from "@/types/transaction";
import { useInventory } from "@/context/InventoryContext";
import { useEvents } from "@/context/EventContext";
import { useTranslation } from "react-i18next";
import { usePrintUtils } from "@/hooks/usePrintUtils";
import { useSettings } from "@/context/SettingsContext";
import { useClientContext } from "@/context/ClientContext";

export function TransactionForm() {
  const router = useRouter();
  const {
    activeWorkspace,
    updateActiveWorkspace,
    removeWorkspace,
    setActiveWorkspaceId,
  } = useTransactions();
  const { emit } = useEvents();
  const { t, i18n } = useTranslation();
  const { printTransactionReceipt } = usePrintUtils();
  const { settings } = useSettings();
  const { fetchClientById, selectedClient } = useClientContext();

  const [isSaving, setIsSaving] = useState(false);

  if (!activeWorkspace) return null;

  const {
    id,
    type,
    items,
    party_id,
    party_type,
    paid_amount,
    payment_method,
    notes,
  } = activeWorkspace;

  // Enhance: Fetch client details when party_id changes
  React.useEffect(() => {
    if (party_id && party_type === "Client") {
      fetchClientById(party_id);
    }
  }, [party_id, party_type, fetchClientById]);

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

  const handleAddItem = (invItem: InventoryItem) => {
    const existingIndex = items.findIndex((i) => i.item_id === invItem.id);
    const unitPrice =
      type === "Sale" ? invItem.sellingPrice || 0 : invItem.buyingPrice || 0;

    if (existingIndex > -1) {
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      newItems[existingIndex].total_price =
        newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
      updateActiveWorkspace({ items: newItems });
    } else {
      updateActiveWorkspace({
        items: [
          ...items,
          {
            id: uuidv4(),
            transaction_id: id,
            item_id: invItem.id,
            item_name: `${invItem.phoneBrand} - ${invItem.itemName}`,
            quantity: 1,
            unit_price: unitPrice,
            total_price: unitPrice,
          },
        ],
      });
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const newItems = items.map((item) => {
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
    const newItems = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          unit_price: newPrice,
          total_price: item.quantity * newPrice,
        };
      }
      return item;
    });
    updateActiveWorkspace({ items: newItems });
  };

  const removeItem = (itemId: string) => {
    updateActiveWorkspace({
      items: items.filter((i) => i.id !== itemId),
    });
  };

  const handleSave = async (complete: boolean) => {
    if (!party_id) {
      toast.error(
        t("transactions_module.form.selectPartyError", {
          type: t(`transactions_module.party.${party_type.toLowerCase()}`),
        })
      );
      return;
    }
    if (items.length === 0) {
      toast.error(t("transactions_module.form.addItemError"));
      return;
    }

    setIsSaving(true);
    try {
      const session = await getCurrentSession();
      const now = new Date().toISOString();

      const transactionModel: TxModel = {
        id,
        transaction_number: activeWorkspace.is_existing
          ? activeWorkspace.name
          : "",
        transaction_type: type,
        party_id: party_id || "",
        party_type: party_type,
        status: complete ? "Completed" : "Draft",
        payment_status: "Unpaid", // Backend recalculates
        total_amount: totalAmount,
        paid_amount: paid_amount,
        notes: notes || "",
        created_at: now,
        updated_at: now,
        created_by: "System", // Replace with real user if available
      };

      const itemModels: TxItemModel[] = items.map((item) => ({
        id: item.id,
        transaction_id: id,
        item_id: item.item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: "",
      }));

      const paymentModels: TxPaymentModel[] =
        paid_amount > 0
          ? [
              {
                id: uuidv4(),
                transaction_id: id,
                amount: paid_amount,
                method: payment_method,
                date: now,
                received_by: "System",
                notes: t(`transactions_module.summary.paymentFor`, {
                  type: t(`transactions_module.${type.toLowerCase()}`),
                }),
                session_id: session?.id || null,
              },
            ]
          : [];

      if (activeWorkspace.is_existing) {
        await updateTransaction(transactionModel, itemModels, paymentModels);
      } else {
        await submitTransaction(transactionModel, itemModels, paymentModels);
      }

      // Emit event to notify dashboard of financial change
      emit("financial-data-change");

      toast.success(
        t("transactions_module.form.success", {
          type: t(`transactions_module.${type.toLowerCase()}`),
          status: complete
            ? t("transactions_module.form.completed")
            : t("transactions_module.form.savedAsDraft"),
        })
      );

      setTimeout(async () => {
        // Print receipt if it's a completed Sale
        if (complete && type === "Sale") {
            const clientToPrint = party_type === 'Client' && selectedClient?.id === party_id ? selectedClient : null;
            // The client context might be stale or not updated with the latest balance yet, 
            // but for "Previous Balance" we specifically want the balance BEFORE this transaction.
            // selectedClient.outstandingBalance holds the current balance from DB.
            const previousBalance = clientToPrint ? clientToPrint.outstandingBalance : 0;

            await printTransactionReceipt(
                transactionModel,
                itemModels,
                paymentModels,
                clientToPrint,
                previousBalance,
                i18n.language,
                settings.currency as any
            );
        }
        removeWorkspace(id);
      }, 500);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(
        t("transactions_module.form.error", {
          type: t(`transactions_module.${type.toLowerCase()}`),
          error: String(err),
        })
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-24">
      {/* Top Header Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-40 shadow-sm px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-6 w-full max-w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveWorkspaceId("")}
              className="rounded-xl flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-8 w-px bg-muted-foreground/10 flex-shrink-0"></div>
            <div className="flex-1 w-0">
              <TransactionWorkspace />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 font-bold bg-white dark:bg-slate-800 text-xs uppercase tracking-wider dark:border-slate-700 dark:text-slate-200 hover:dark:text-slate-100"
              onClick={() => setActiveWorkspaceId("")}
            >
              <History className="h-4 w-4 mr-2 opacity-50" />
              {t("transactions_module.history")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg h-9 w-9 bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:dark:text-slate-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <div className="h-8 w-px bg-muted-foreground/10 dark:bg-slate-700 mx-1"></div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 overflow-hidden border dark:border-slate-700 p-0"
            >
              <div className="h-full w-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-[10px] font-bold dark:text-primary-foreground">
                {t("common.userInitial") || "JD"}
              </div>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Column: Transaction Details (8/12) */}
          <div className="xl:col-span-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Context Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 px-1">
              <LayoutGrid className="h-3 w-3" />
              <span>{t("transactions_module.title")}</span>
              <ChevronRight className="h-3 w-3" />
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md",
                  type === "Sale"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                )}
              >
                {t("transactions_module.form.module", {
                  type: t(`transactions_module.${type.toLowerCase()}`),
                })}
              </span>
            </div>

            <TransactionScanner onAddItem={handleAddItem} type={type} />

            <TransactionItemTable
              type={type}
              items={items}
              onUpdateQuantity={updateQuantity}
              onUpdatePrice={updatePrice}
              onRemoveItem={removeItem}
            />

            {/* Internal Notes Card */}
            <Card className="border dark:border-slate-800 shadow-sm overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="h-10 w-10 rounded-xl bg-muted dark:bg-slate-800 flex items-center justify-center text-muted-foreground dark:text-slate-400 flex-shrink-0">
                  <MoreHorizontal className="h-5 w-5" />
                </div>
                <Input
                  placeholder={t("transactions_module.form.notesPlaceholder")}
                  value={notes}
                  onChange={(e) =>
                    updateActiveWorkspace({ notes: e.target.value })
                  }
                  className="border-none focus-visible:ring-0 bg-transparent h-12 text-sm font-medium"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sidebar Actions (4/12) */}
          <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 sticky top-[84px]">
            <TransactionPartySelector
              type={party_type}
              selectedId={party_id}
              onSelect={(id) => updateActiveWorkspace({ party_id: id })}
            />

            <TransactionSummary
              type={type}
              totalAmount={totalAmount}
              paidAmount={paid_amount}
              paymentMethod={payment_method}
              isSaving={isSaving}
              onUpdatePaidAmount={(amount) =>
                updateActiveWorkspace({ paid_amount: amount })
              }
              onUpdatePaymentMethod={(method) =>
                updateActiveWorkspace({ payment_method: method })
              }
              onComplete={() => handleSave(true)}
              onSaveDraft={() => handleSave(false)}
              disabled={items.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
