"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Plus,
  X,
  ShoppingCart,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
    setActiveWorkspaceId,
  } = useTransactions();
  const { t } = useTranslation();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update arrow visibility
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Handle scroll with smooth behavior
  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollPosition =
        direction === "left"
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      });
    }
  };

  // Update scroll buttons when workspaces change or component mounts
  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [workspaces.length]);

  return (
    <div className="relative flex items-center gap-2 w-full max-w-full overflow-hidden min-w-0">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-0 z-10 h-10 w-8 flex items-center justify-center bg-gradient-to-r from-background to-transparent hover:from-muted/50 dark:hover:from-slate-800/50 transition-all rounded-l-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-1 w-full max-w-full min-w-0"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {workspaces.map((ws) => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border whitespace-nowrap group relative flex-shrink-0",
              activeWorkspaceId === ws.id
                ? "bg-white dark:bg-slate-800 border-primary/20 dark:border-primary/40 shadow-sm text-primary dark:text-slate-100"
                : "bg-transparent border-transparent text-muted-foreground dark:text-slate-400 dark:hover:text-slate-100 hover:bg-muted/50 dark:hover:bg-slate-800/50 hover:text-foreground"
            )}
            style={{ flexShrink: 0 }}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                ws.type === "Sale" ? "bg-green-500" : "bg-blue-500"
              )}
            ></div>

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
                "p-1 rounded-lg hover:bg-muted dark:hover:bg-slate-700 transition-all",
                activeWorkspaceId === ws.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <X className="h-3.5 w-3.5" />
            </div>

            {activeWorkspaceId === ws.id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full"></div>
            )}
          </button>
        ))}

        <div
          className="flex items-center gap-1 bg-muted/30 dark:bg-slate-800/50 rounded-xl p-1 ml-2 border border-muted-foreground/5 dark:border-slate-700 flex-shrink-0"
          style={{ flexShrink: 0 }}
        >
          <button
            onClick={() => addWorkspace("Sale")}
            className="p-1.5 hover:bg-green-500 hover:text-white text-green-600 dark:text-green-500 rounded-lg transition-all"
            title={t("transactions_module.newSale")}
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="w-px h-4 bg-muted-foreground/10 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={() => addWorkspace("Purchase")}
            className="p-1.5 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-500 rounded-lg transition-all"
            title={t("transactions_module.newPurchase")}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-0 z-10 h-10 w-8 flex items-center justify-center bg-gradient-to-l from-background to-transparent hover:from-muted/50 dark:hover:from-slate-800/50 transition-all rounded-r-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
