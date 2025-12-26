"use client";

import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { useTransactions } from "@/context/TransactionContext";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default function TransactionsPage() {
  const { activeWorkspace, addWorkspace } = useTransactions();

  if (activeWorkspace) {
    return <TransactionForm />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <LayoutGrid className="h-8 w-8" />
              </div>
              Transactions
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">Manage your sales and purchase orders in one place.</p>
          </div>
          <div className="flex gap-3">
            <Button 
                onClick={() => addWorkspace("Sale")}
                className="h-14 px-8 rounded-2xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 text-lg font-black"
            >
              <Plus className="mr-2 h-6 w-6" />
              New Sale
            </Button>
            <Button 
                onClick={() => addWorkspace("Purchase")}
                className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-lg font-black"
            >
              <Plus className="mr-2 h-6 w-6" />
              New Order
            </Button>
          </div>
        </div>

        {/* Quick Stats/Summary would go here */}

        {/* History Section */}
        <div className="space-y-6">
             <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-primary"></div>
                 <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Transaction History</h2>
             </div>
             <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
