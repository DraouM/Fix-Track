import React, { useState } from "react";
import { Clock, ArrowDownLeft, Minus, Plus, ExternalLink, Calendar, Banknote } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { ClientHistoryEvent } from "@/types/client";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionDetailsDialog } from "../transactions/TransactionDetailsDialog";
import { getTransactionById } from "@/lib/api/transactions";
import { TransactionWithDetails } from "@/types/transaction";
import { toast } from "sonner";
import { useTransactions } from "@/context/TransactionContext";
import { useSettings } from "@/context/SettingsContext";

interface ClientHistoryListProps {
  history?: ClientHistoryEvent[];
  isLoading?: boolean;
}

export function ClientHistoryList({ history, isLoading }: ClientHistoryListProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { editTransaction } = useTransactions();
  
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);

  const handleViewTransaction = async (txId: string) => {
    setViewLoading(txId);
    try {
      const details = await getTransactionById(txId);
      if (details) {
        setSelectedTransaction(details);
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

  const handleEdit = (details: TransactionWithDetails) => {
    editTransaction(details);
    setSelectedTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl border dark:border-slate-800" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30 dark:bg-slate-950/30 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
        <Banknote className="h-16 w-16 mb-6 text-muted-foreground/10 dark:text-muted-foreground/5" />
        <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/40 dark:text-muted-foreground/30 mb-2">
          {t('clients_module.history.noHistory', 'No History')}
        </h3>
        <p className="text-xs font-bold text-muted-foreground/60 max-w-sm text-center uppercase tracking-widest leading-loose">
          Payment and balance adjustment records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
      {history.map((event) => {
        const isPayment = event.event_type.toLowerCase().includes("payment");
        const isAdjustment = event.event_type.toLowerCase().includes("adjust");
        
        let icon = <Clock className="w-4 h-4" />;
        let iconClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        let amountClass = "text-slate-600 dark:text-slate-400";
        
        if (isPayment) {
          icon = <ArrowDownLeft className="w-5 h-5" />;
          iconClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800";
          amountClass = "text-green-600 dark:text-green-400";
        } else if (isAdjustment) {
          icon = event.amount < 0 ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />;
          iconClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800";
          amountClass = event.amount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
        }

        return (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            {/* Timeline Icon */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-10 transition-transform group-hover:scale-110",
              iconClass
            )}>
              {icon}
            </div>

            {/* Event Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0 p-5 rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className={cn("uppercase text-[10px] font-black tracking-widest", iconClass)}>
                  {event.event_type}
                </Badge>
                <div className="flex flex-col items-end">
                  <span className={cn("text-lg font-black", amountClass)}>
                    {event.amount > 0 ? "+" : ""}{formatCurrency(event.amount)}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-foreground/80 dark:text-slate-300 font-medium mb-4">
                {event.notes || "-"}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t dark:border-slate-800/60">
                <div className="flex items-center text-xs font-bold text-muted-foreground/60">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {formatDate(event.date)}
                  {event.changed_by && (
                    <span className="ml-2 pl-2 border-l border-border/50">by {event.changed_by}</span>
                  )}
                </div>
                
                {event.related_id && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleViewTransaction(event.related_id!)}
                    disabled={viewLoading === event.related_id}
                    className="h-7 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                  >
                    {viewLoading === event.related_id ? (
                      <Clock className="w-3 h-3 mr-1.5 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                    )}
                    View Tx
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <TransactionDetailsDialog 
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onEdit={handleEdit}
      />
    </div>
  );
}
