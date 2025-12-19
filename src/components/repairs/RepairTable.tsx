"use client";

import { useState, useMemo, useCallback } from "react";
import { useRepairContext } from "@/context/RepairContext";
import { useRepairFilters } from "@/hooks/useRepairFilters";
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
  const { repairs, updateRepairStatus, deleteRepair } = useRepairContext();
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
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    []
  );

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
      case "Partially Paid":
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
      if (window.confirm("Are you sure you want to delete this repair?")) {
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
          alert("Failed to print sticker. Please check your printer settings.");
        }
      } catch (error) {
        console.error("Error printing sticker:", error);
        alert("An error occurred while printing the sticker.");
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
          alert("Failed to print receipt. Please check your printer settings.");
        }
      } catch (error) {
        console.error("Error printing receipt:", error);
        alert("An error occurred while printing the receipt.");
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
      getPaymentBadgeProps,
      onPrintSticker: handlePrintSticker, // Add print sticker action
      onPrintReceipt: handlePrintReceipt, // Add print receipt action
    }),
    [
      onEditRepair,
      handleDeleteRepair,
      updateRepairStatus,
      formatCurrency,
      getPaymentBadgeProps,
      handlePrintSticker, // Add print sticker to dependencies
      handlePrintReceipt, // Add print receipt to dependencies
    ]
  );

  // ✅ Create columns with actions
  const columns = useMemo(
    () => createRepairColumns(columnActions),
    [columnActions]
  );

  return (
    <div className="space-y-4">
      {/* TanStack Data Table with Pagination */}
      <RepairDataTable
        columns={columns}
        data={filteredAndSortedRepairs}
        searchColumn="customerName"
        searchPlaceholder="Search by customer, device, or description..."
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a payment for this repair order
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
