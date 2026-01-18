"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { getTransactions, getTransactionById } from "@/lib/api/transactions";
import { Transaction, TransactionType } from "@/types/transaction";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/context/TransactionContext";
import { toast } from "sonner";

import { useInventory } from "@/context/InventoryContext";
import { useTranslation } from "react-i18next";

export function TransactionHistory() {
  const { editTransaction } = useTransactions();
  const { initialized } = useInventory();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (initialized) {
      loadTransactions();
    }
  }, [initialized]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (txId: string) => {
    setViewLoading(txId);
    try {
      const details = await getTransactionById(txId);
      if (details) {
        editTransaction(details);
      } else {
        toast.error(t('common.error'));
      }
    } catch (err) {
      console.error("Failed to fetch transaction:", err);
      toast.error(t('common.error'));
    } finally {
      setViewLoading(null);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tx.party_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "All" || tx.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t('common.searchPlaceholder')} 
            className="pl-10 rounded-xl dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted dark:bg-slate-900 p-1 rounded-xl">
            {["All", "Sale", "Purchase"].map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "rounded-lg text-xs font-bold uppercase tracking-wider h-8",
                  typeFilter === type 
                    ? (type === "Sale" ? "bg-green-600 dark:bg-green-700" : type === "Purchase" ? "bg-blue-600 dark:bg-blue-700" : "")
                    : "dark:text-slate-400 dark:hover:bg-slate-800"
                )}
                onClick={() => setTypeFilter(type)}
              >
                {type === "All" ? t('common.all') : t(`transactions_module.${type.toLowerCase()}`)}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 dark:bg-slate-900 dark:border-slate-800">
            <Filter className="h-4 w-4 dark:text-slate-400" />
          </Button>
        </div>
      </div>

      <Card className="border dark:border-slate-800 shadow-md rounded-2xl overflow-hidden dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 dark:bg-slate-800/50 border-b dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">{t('common.number')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">{t('common.type')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">{t('common.date')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400">{t('common.status')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 text-right">{t('common.total')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 bg-muted/5 dark:bg-slate-800/20"></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500 dark:text-red-400">
                    <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-destructive dark:text-red-500" />
                        <p className="font-bold uppercase tracking-widest text-xs">{t('common.errorLoading')}</p>
                        <p className="text-sm text-muted-foreground dark:text-slate-500">{error}</p>
                        <Button variant="outline" size="sm" onClick={() => loadTransactions()} className="mt-2 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                          {t('common.retry')}
                        </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                        <Clock className="h-8 w-8 opacity-20 dark:opacity-40" />
                        <p className="font-bold uppercase tracking-widest text-xs">{t('common.noTransactions')}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/5 dark:hover:bg-slate-800/30 transition-colors group border-b dark:border-slate-800">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-sm text-foreground dark:text-slate-200">{tx.transaction_number}</span>
                      <span className="text-[10px] font-bold text-muted-foreground dark:text-slate-500 uppercase opacity-60 truncate max-w-[120px]">{tx.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {tx.transaction_type === "Sale" ? (
                         <div className="h-7 w-7 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                           <ArrowUpRight className="h-4 w-4" />
                         </div>
                       ) : (
                         <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                           <ArrowDownLeft className="h-4 w-4" />
                         </div>
                       )}
                       <span className={cn(
                         "text-xs font-black uppercase tracking-tight",
                         tx.transaction_type === "Sale" ? "text-green-700 dark:text-green-400" : "text-blue-700 dark:text-blue-400"
                       )}>{t(`transactions_module.${tx.transaction_type.toLowerCase()}`)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-muted-foreground dark:text-slate-400">{formatDate(tx.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={tx.status === "Completed" ? "default" : "secondary"} className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
                      tx.status === "Completed" ? "bg-green-600 dark:bg-green-700" : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                    )}>
                      {t(`status.${tx.status.toLowerCase()}`)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-sm text-foreground dark:text-slate-200">{formatCurrency(tx.total_amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      disabled={viewLoading === tx.id}
                      onClick={() => handleView(tx.id)}
                      className="rounded-xl group-hover:bg-background dark:group-hover:bg-slate-800 shadow-sm border dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {viewLoading === tx.id ? (
                        <Clock className="h-4 w-4 animate-spin dark:text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 dark:text-slate-400" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
