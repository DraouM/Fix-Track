"use client";

import { useState, useMemo, useCallback } from "react";
import { useRepairContext } from "@/context/RepairContext";
import { useRepairFilters } from "@/hooks/useRepairFilters";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RepairDetail } from "./RepairDetail";
import { RepairPaymentForm } from "./RepairPaymentForm";
import { Input } from "@/components/ui/input";

// TanStack Table imports
import { RepairDataTable } from "./repair-data-table";
import { createRepairColumns } from "./repair-columns";

interface RepairTableProps {
  onEditRepair: (repair: Repair) => void;
}

export function RepairTable({ onEditRepair }: RepairTableProps) {
  const { repairs, updateRepairStatus, updatePaymentStatus, deleteRepair } =
    useRepairContext();

  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [paymentDialogRepair, setPaymentDialogRepair] = useState<Repair | null>(
    null
  );

  // ✅ Filters & Sorting
  const {
    filters,
    filteredAndSortedRepairs,
    statistics,
    setSearchTerm,
    setStatusFilter,
    setPaymentStatusFilter,
    handleSort,
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

  const getStatusColorClass = useCallback((status: RepairStatus) => {
    switch (status) {
      case "Completed":
        return "border-l-green-500";
      case "In Progress":
        return "border-l-orange-500";
      case "Delivered":
        return "border-l-blue-500";
      case "Pending":
      default:
        return "border-l-muted-foreground";
    }
  }, []);

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
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200/50 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full lg:w-auto">
            {/* Total Repairs */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Filtered Results */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Filtered</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.filtered}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(statistics.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Revenue */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(statistics.pendingRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-10 px-4 bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
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
