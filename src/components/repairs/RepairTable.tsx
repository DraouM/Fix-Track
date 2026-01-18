"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRepairContext } from "@/context/RepairContext";
import { useSettings } from "@/context/SettingsContext";
import { useRepairFilters } from "@/hooks/useRepairFilters";
import { formatCurrency as formatCurrencyCentralized, getLocaleForIntl } from "@/lib/formatters";
import type { Repair, PaymentStatus } from "@/types/repair";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RepairDetail } from "./RepairDetail";
import { RepairPaymentForm } from "./RepairPaymentForm";

// TanStack Table imports
import { RepairDataTable } from "./repair-data-table";
import { createRepairColumns } from "./repair-columns";

// Import print utilities
import { usePrintUtils } from "@/hooks/usePrintUtils";

interface RepairTableProps {
  onEditRepair: (repair: Repair) => void;
}

export function RepairTable({ onEditRepair }: RepairTableProps) {
  const { t, i18n } = useTranslation();
  const { repairs, updateRepairStatus, deleteRepair } = useRepairContext();
  const { settings } = useSettings();
  const { printSticker, printReceipt } = usePrintUtils(); // Add print sticker hook

  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [paymentDialogRepair, setPaymentDialogRepair] = useState<Repair | null>(
    null
  );

  // ✅ Filters & Sorting
  const { filteredAndSortedRepairs } = useRepairFilters(repairs);

  // ✅ Memoized helpers to prevent re-renders
  const formatCurrency = useCallback(
    (value: number) =>
      formatCurrencyCentralized(value, settings.currency, getLocaleForIntl(i18n.language)),
    [settings.currency, i18n.language]
  );

  const formatNumber = useCallback(
    (value: number) =>
      new Intl.NumberFormat(getLocaleForIntl(i18n.language), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    [i18n.language]
  );

  const currencySymbol = useMemo(() => settings.currency === 'MAD' ? 'MAD' : (settings.currency === 'DZD' ? 'DA' : (settings.currency === 'EUR' ? '€' : (settings.currency === 'GBP' ? '£' : '$'))), [settings.currency]);
  // Actually, I can just use getCurrencySymbol if it exists in settings context, which it does!
  // Wait, I already have getCurrencySymbol in settings context.
  
  const currentSymbol = useSettings().getCurrencySymbol(); 
  // Wait, useSettings is already called at top.
  

  const getPaymentBadgeProps = useCallback((status: PaymentStatus) => {
    switch (status) {
      case "Paid":
        return {
          variant: "default" as const,
          className: "bg-green-500 text-white",
        };
      case "Unpaid":
        return {
          variant: "destructive" as const,
          className: "bg-red-500 text-white",
        };
      case "Partially":
        return {
          variant: "secondary" as const,
          className: "bg-yellow-500 text-black",
        };
      case "Refunded":
        return {
          variant: "outline" as const,
          className: "bg-purple-100 text-purple-800 ",
        };
      default:
        return { variant: "outline" as const, className: "" };
    }
  }, []);

  const handleDeleteRepair = useCallback(
    (id: string) => {
      if (window.confirm(t('repairs.deleteConfirm'))) {
        deleteRepair(id);
      }
    },
    [deleteRepair]
  );

  // ✅ Handle print sticker functionality
  const handlePrintSticker = useCallback(
    async (repair: Repair) => {
      try {
        const success = await printSticker(repair);
        if (!success) {
          alert(t('repairs.printStickerError'));
        }
      } catch (error) {
        console.error("Error printing sticker:", error);
        alert(t('repairs.printGeneralError'));
      }
    },
    [printSticker]
  );

  // ✅ Handle print receipt functionality
  const handlePrintReceipt = useCallback(
    async (repair: Repair) => {
      try {
        const success = await printReceipt(repair);
        if (!success) {
          alert(t('repairs.printReceiptError'));
        }
      } catch (error) {
        console.error("Error printing receipt:", error);
        alert(t('repairs.printGeneralError'));
      }
    },
    [printReceipt]
  );

  // ✅ Create column actions for TanStack Table
  const columnActions = useMemo(
    () => ({
      onEditRepair,
      onViewRepair: setSelectedRepair,
      onDeleteRepair: handleDeleteRepair,
      onPaymentDialog: setPaymentDialogRepair,
      updateRepairStatus,
      formatCurrency,
      formatNumber,
      currencySymbol: currentSymbol,
      getPaymentBadgeProps,
      onPrintSticker: handlePrintSticker, // Add print sticker action
      onPrintReceipt: handlePrintReceipt, // Add print receipt action
    }),
    [
      onEditRepair,
      handleDeleteRepair,
      updateRepairStatus,
      formatCurrency,
      formatNumber,
      getPaymentBadgeProps,
      handlePrintSticker, // Add print sticker to dependencies
      handlePrintReceipt, // Add print receipt to dependencies
    ]
  );

  // ✅ Create columns with actions
  const columns = useMemo(
    () => createRepairColumns(columnActions, t),
    [columnActions, t]
  );

  return (
    <div className="space-y-4">
      {/* TanStack Data Table with Pagination */}
      <RepairDataTable
        columns={columns}
        data={filteredAndSortedRepairs}
        searchColumn="customerName"
        searchPlaceholder={t('repairs.searchParts')}
      />

      {/* -------------------- Detail Modal -------------------- */}
      {selectedRepair && (
        <RepairDetail
          repair={selectedRepair}
          open={!!selectedRepair} // ✅ pass boolean for Dialog
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRepair(null);
          }}
        />
      )}

      {/* -------------------- Payment Dialog -------------------- */}
      <Dialog
        open={!!paymentDialogRepair}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPaymentDialogRepair(null);
        }}
      >
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>{t('repairs.addPayment')}</DialogTitle>
            <DialogDescription>
              {t('repairs.financialOverview') || "Add a payment for this repair order"}
            </DialogDescription>
          </DialogHeader>
          {paymentDialogRepair && (
            <RepairPaymentForm
              repair={paymentDialogRepair}
              onSuccess={() => setPaymentDialogRepair(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
