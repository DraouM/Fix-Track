"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  InventoryItem,
  InventoryHistoryEvent,
  HistoryEventType,
} from "@/types/inventory";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Package,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Wrench,
  RotateCcw,
  Settings,
  Calendar,
  Layers
} from "lucide-react";

import { useTranslation } from "react-i18next";

// --- Props ---
interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null; // full item
  historyEvents: InventoryHistoryEvent[]; // history already fetched in parent
}

// --- Status Icon Helper ---
const getEventIcon = (type: HistoryEventType) => {
  switch (type) {
    case "Purchased":
      return <ArrowDownLeft className="w-3.5 h-3.5" />;
    case "Sold":
      return <ArrowUpRight className="w-3.5 h-3.5" />;
    case "Used in Repair":
      return <Wrench className="w-3.5 h-3.5" />;
    case "Returned":
      return <RotateCcw className="w-3.5 h-3.5" />;
    case "Manual Correction":
      return <Settings className="w-3.5 h-3.5" />;
    default:
      return <History className="w-3.5 h-3.5" />;
  }
};

const getEventColor = (type: HistoryEventType) => {
  switch (type) {
    case "Purchased":
      return "bg-green-50 text-green-600 border-green-100";
    case "Sold":
      return "bg-blue-50 text-blue-600 border-blue-100";
    case "Used in Repair":
      return "bg-orange-50 text-orange-600 border-orange-100";
    case "Returned":
      return "bg-purple-50 text-purple-600 border-purple-100";
    case "Manual Correction":
      return "bg-gray-50 text-gray-600 border-gray-100";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

// --- Component ---
export function InventoryHistoryDialog({
  open,
  onOpenChange,
  item,
  historyEvents,
}: InventoryHistoryDialogProps) {
  const { t } = useTranslation();
  if (!item) return null;

  // Sort history (newest first)
  const sortedHistory = [...historyEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}
    >
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <div className="bg-primary/5 p-4 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-white shadow-sm text-primary">
                <History className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight leading-tight">{t('common.history')}</DialogTitle>
                <DialogDescription className="text-[9px] font-black uppercase tracking-widest opacity-60">
                   {item.itemName}
                </DialogDescription>
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
               <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50">
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5 flex items-center gap-1.5">
                    <Layers className="w-2.5 h-2.5" />
                    {t('inventory.table.stock')}
                  </div>
                  <div className="text-sm font-black lead-none">{item.quantityInStock}</div>
               </div>
               <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50">
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5 flex items-center gap-1.5">
                    <Calendar className="w-2.5 h-2.5" />
                    {t('repairs.historyLogs').split(' ')[0]} {t('common.date')}
                  </div>
                  <div className="text-[10px] font-bold leading-none">
                    {sortedHistory.length > 0 ? format(new Date(sortedHistory[0].date), "MMM d") : "N/A"}
                  </div>
               </div>
               <div className="bg-white/60 backdrop-blur-sm rounded-xl p-2 border border-white/50">
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5 flex items-center gap-1.5">
                    <Package className="w-2.5 h-2.5" />
                    {t('common.type')}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-primary truncate leading-none">
                    {item.itemType}
                  </div>
               </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-4">
          <ScrollArea className="h-[320px] pr-4">
            {sortedHistory.length > 0 ? (
              <div className="space-y-3">
                {sortedHistory.map((event, idx) => (
                  <div key={event.id} className="relative group">
                    {/* Vertical Line Connector */}
                    {idx !== sortedHistory.length - 1 && (
                      <div className="absolute left-[16px] top-[32px] bottom-[-16px] w-0.5 bg-gray-100 group-hover:bg-primary/20 transition-colors" />
                    )}
                    
                    <div className="flex gap-3 items-start">
                      {/* Icon Circle */}
                      <div className={cn(
                        "z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 shadow-sm",
                        getEventColor(event.type)
                      )}>
                        {getEventIcon(event.type)}
                      </div>

                      {/* Content Card */}
                      <div className="flex-1 bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-black uppercase tracking-wider text-foreground leading-none">
                              {event.type}
                            </div>
                            <div className="text-[9px] font-bold text-muted-foreground/60">
                              {format(new Date(event.date), "PPP p")}
                            </div>
                          </div>
                          
                          {/* Quantity Change Bubble */}
                          <div className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm",
                            event.quantityChange > 0 
                              ? "bg-green-500 text-white" 
                              : "bg-red-500 text-white"
                          )}>
                            {event.quantityChange > 0 ? `+${event.quantityChange}` : event.quantityChange}
                          </div>
                        </div>

                        {event.notes && (
                          <div className="mt-1.5 p-1.5 bg-muted/30 rounded-lg text-[9px] font-medium text-muted-foreground leading-tight border border-gray-50 italic">
                            "{event.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40 py-8">
                <div className="p-3 rounded-full bg-gray-50 mb-2">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('repairs.noHistory')}</p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-3 bg-gray-50/50 border-t flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white"
          >
            {t('common.close')}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
