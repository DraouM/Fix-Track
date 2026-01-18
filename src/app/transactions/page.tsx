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
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary">
                <LayoutGrid className="h-8 w-8" />
              </div>
              {t("transactions_module.title")}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {t("dashboard.transactions.subtitle") || "Manage your sales and purchase orders in one place."}
            </p>
          </div>
          <div className="flex gap-3 animate-in fade-in slide-in-from-right duration-500">
            <Button 
                onClick={() => addWorkspace("Sale")}
                className="h-14 px-8 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/20 text-lg font-black text-white transition-all active:scale-95"
            >
              <Plus className="mr-2 h-6 w-6" />
              {t("transactions_module.newSale")}
            </Button>
            <Button 
                onClick={() => addWorkspace("Purchase")}
                className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 text-lg font-black text-white transition-all active:scale-95"
            >
              <Plus className="mr-2 h-6 w-6" />
              {t("transactions_module.newPurchase")}
            </Button>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
             <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground dark:text-slate-500">
                    {t("transactions_module.history")}
                 </h2>
             </div>
             <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
