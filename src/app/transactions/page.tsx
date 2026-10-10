"use client";

import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { useTransactions } from "@/context/TransactionContext";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TransactionsPage() {
  const { activeWorkspace, addWorkspace } = useTransactions();
  const { t } = useTranslation();

  if (activeWorkspace) {
    return <TransactionForm />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Module Header (sized like the repairs page header) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-500">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {t("transactions_module.title")}
            </h1>
          </div>
          <div className="flex gap-3 animate-in fade-in slide-in-from-right duration-500">
            <Button
              onClick={() => addWorkspace("Sale")}
              className="h-11 px-6 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/20 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("transactions_module.newSale")}
            </Button>
            <Button
              onClick={() => addWorkspace("Purchase")}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("transactions_module.newPurchase")}
            </Button>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
