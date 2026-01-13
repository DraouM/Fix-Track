"use client";

import React from "react";
import { Plus, X, ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/context/TransactionContext";
import { TransactionType } from "@/types/transaction";
import { useTranslation } from "react-i18next";

export function TransactionWorkspace() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    addWorkspace, 
    removeWorkspace, 
    setActiveWorkspaceId 
  } = useTransactions();
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
      {workspaces.map((ws) => (
        <button
          key={ws.id}
          onClick={() => setActiveWorkspaceId(ws.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border whitespace-nowrap group relative",
            activeWorkspaceId === ws.id
              ? "bg-white border-primary/20 shadow-sm text-primary"
              : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <div className={cn(
            "w-2 h-2 rounded-full",
            ws.type === "Sale" ? "bg-green-500" : "bg-blue-500"
          )}></div>
          
          <div className="flex items-center gap-1.5 min-w-[100px] max-w-[150px]">
             {ws.type === "Sale" ? (
               <ShoppingCart className="h-3.5 w-3.5 opacity-50" />
             ) : (
               <Package className="h-3.5 w-3.5 opacity-50" />
             )}
             <span className="truncate">{ws.name}</span>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              removeWorkspace(ws.id);
            }}
            className={cn(
              "p-1 rounded-lg hover:bg-muted transition-all",
              activeWorkspaceId === ws.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </div>

          {activeWorkspaceId === ws.id && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"></div>
          )}
        </button>
      ))}

      <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 ml-2 border border-muted-foreground/5">
        <button
          onClick={() => addWorkspace("Sale")}
          className="p-1.5 hover:bg-green-500 hover:text-white text-green-600 rounded-lg transition-all"
          title={t("transactions_module.newSale")}
        >
          <Plus className="h-5 w-5" />
        </button>
        <div className="w-px h-4 bg-muted-foreground/10 mx-1"></div>
        <button
          onClick={() => addWorkspace("Purchase")}
          className="p-1.5 hover:bg-blue-500 hover:text-white text-blue-600 rounded-lg transition-all"
          title={t("transactions_module.newPurchase")}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
