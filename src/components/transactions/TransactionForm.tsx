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

export function TransactionForm() {
  const router = useRouter();
  const { activeWorkspace, updateActiveWorkspace, removeWorkspace, setActiveWorkspaceId } =
    useTransactions();
  const { emit } = useEvents();

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
      toast.error(`Please select a ${party_type.toLowerCase()}`);
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSaving(true);
    try {
      const session = await getCurrentSession();
      const now = new Date().toISOString();

      const transactionModel: TxModel = {
        id,
        transaction_number: activeWorkspace.is_existing ? activeWorkspace.name : "", 
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
                notes: `Payment for ${type}`,
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
        `${type} ${complete ? "completed" : "saved as draft"} successfully!`
      );

      setTimeout(() => {
        removeWorkspace(id);
      }, 500);
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Failed to save ${type.toLowerCase()}: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Top Header Navigation */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-8 w-px bg-muted-foreground/10"></div>
            <TransactionWorkspace />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 font-bold bg-white text-xs uppercase tracking-wider"
              onClick={() => setActiveWorkspaceId("")}
            >
              <History className="h-4 w-4 mr-2 opacity-50" />
              History
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg h-9 w-9 bg-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <div className="h-8 w-px bg-muted-foreground/10 mx-1"></div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 overflow-hidden border p-0"
            >
              <div className="h-full w-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                JD
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
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
              <LayoutGrid className="h-3 w-3" />
              <span>Transactions</span>
              <ChevronRight className="h-3 w-3" />
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md",
                  type === "Sale"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                )}
              >
                {type} Module
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
            <Card className="border shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                  <MoreHorizontal className="h-5 w-5" />
                </div>
                <Input
                  placeholder="Add internal notes, instructions or references for this transaction..."
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
