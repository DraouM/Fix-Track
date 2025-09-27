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
import { Search, X, BarChart3 } from "lucide-react";
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
  const {
    filteredAndSortedRepairs,
    statistics,
    clearFilters,
    hasActiveFilters,
  } = useRepairFilters(repairs);

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
      {/* Enhanced Statistics Dashboard */}
      <div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
            {[
              {
                label: "Total",
                value: statistics.total,
                icon: <BarChart3 className="h-5 w-5 text-gray-600" />,
                iconBg: "bg-gray-100",
                color: "text-gray-900",
              },
              {
                label: "Filtered",
                value: statistics.filtered,
                icon: <Search className="h-5 w-5 text-blue-600" />,
                iconBg: "bg-blue-100",
                color: "text-blue-600",
              },
              {
                label: "Revenue",
                value: formatCurrency(statistics.totalRevenue),
                icon: (
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2
                   3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 
                   2.599 1M12 8V7m0 1v8m0 0v1m0-1
                   c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                ),
                iconBg: "bg-green-100",
                color: "text-green-600",
              },
              {
                label: "Pending",
                value: formatCurrency(statistics.pendingRevenue),
                icon: (
                  <svg
                    className="h-5 w-5 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 
                   0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                iconBg: "bg-yellow-100",
                color: "text-yellow-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className=" rounded-lg p-3 border shadow-sm flex items-center gap-3"
              >
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">
                    {stat.label}
                  </p>
                  <p className={`text-lg font-semibold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* New TanStack Data Table with Pagination */}
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
