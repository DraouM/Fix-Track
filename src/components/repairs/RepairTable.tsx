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

interface RepairTableProps {
  onEditRepair: (repair: Repair) => void;
}

export function RepairTable({ onEditRepair }: RepairTableProps) {
  const { repairs, updateRepairStatus, deleteRepair } = useRepairContext();

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
        style: "currency",
        currency: "USD",
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
    }),
    [
      onEditRepair,
      handleDeleteRepair,
      updateRepairStatus,
      formatCurrency,
      getPaymentBadgeProps,
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
        onOpenChange={() => setPaymentDialogRepair(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a payment for {paymentDialogRepair?.customerName}'s repair.
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
