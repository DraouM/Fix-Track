"use client";

import { useState, useMemo, useCallback } from "react";
import { useRepairContext } from "@/context/RepairContext";
import { useRepairFilters } from "@/hooks/useRepairFilters";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  return (
    <div className="space-y-4">
      {/* Compact Statistics Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-700">Overview:</span>
            </div>
            <div className="flex gap-4 align-space-x-4 ">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {statistics.total}
                </span>{" "}
                Total
              </span>
              <span className="text-gray-600">
                <span className="font-semibold text-blue-600">
                  {statistics.filtered}
                </span>{" "}
                Filtered
              </span>
              <span className="text-gray-600">
                <span className="font-semibold text-green-600">
                  {formatCurrency(statistics.totalRevenue)}
                </span>{" "}
                Revenue
              </span>
              <span className="text-gray-600">
                <span className="font-semibold text-yellow-600">
                  {formatCurrency(statistics.pendingRevenue)}
                </span>{" "}
                Pending
              </span>
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Compact Search & Filters - Positioned Above Table */}
      <div className=" rounded-t-lg ">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer, device, or description..."
                value={filters.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 hidden sm:block">
                Filters:
              </span>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setStatusFilter(value as RepairStatus | "All")
              }
            >
              <SelectTrigger className="w-[140px] h-10 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Pending">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="In Progress">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="Completed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="Delivered">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Delivered
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) =>
                setPaymentStatusFilter(value as PaymentStatus | "All")
              }
            >
              <SelectTrigger className="w-[140px] h-10 focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Payments</SelectItem>
                <SelectItem value="Unpaid">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Unpaid
                  </div>
                </SelectItem>
                <SelectItem value="Partially Paid">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Partially Paid
                  </div>
                </SelectItem>
                <SelectItem value="Paid">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Paid
                  </div>
                </SelectItem>
                <SelectItem value="Refunded">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Refunded
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters - Compact Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
            {filters.searchTerm && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 text-xs"
              >
                "
                {filters.searchTerm.length > 20
                  ? filters.searchTerm.substring(0, 20) + "..."
                  : filters.searchTerm}
                "
              </Badge>
            )}
            {filters.status !== "All" && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 text-xs"
              >
                {filters.status}
              </Badge>
            )}
            {filters.paymentStatus !== "All" && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 text-xs"
              >
                {filters.paymentStatus}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Repairs Table */}
      <div className="bg-white rounded-b-lg border border-t-0 shadow-sm overflow-hidden">
        <Table>
          <TableCaption>A list of your current repairs.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort("customerName")}>
                Customer
              </TableHead>
              <TableHead onClick={() => handleSort("deviceModel")}>
                Device
              </TableHead>
              <TableHead onClick={() => handleSort("status")}>Status</TableHead>
              <TableHead onClick={() => handleSort("paymentStatus")}>
                Payment
              </TableHead>
              <TableHead onClick={() => handleSort("estimatedCost")}>
                Cost
              </TableHead>
              <TableHead onClick={() => handleSort("createdAt")}>
                Created
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>

              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAndSortedRepairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No repairs found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedRepairs.map((repair) => {
                const paymentBadgeProps = getPaymentBadgeProps(
                  repair.paymentStatus
                );
                return (
                  <TableRow
                    key={repair.id}
                    className={cn(
                      "border-l-4",
                      getStatusColorClass(repair.status)
                    )}
                  >
                    <TableCell>{repair.customerName}</TableCell>
                    <TableCell>
                      {repair.deviceBrand} {repair.deviceModel}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={repair.status}
                        onValueChange={(newStatus: RepairStatus) => {
                          console.log(
                            "🔄 Changing status from",
                            repair.status,
                            "to",
                            newStatus
                          );
                          updateRepairStatus(repair.id, newStatus);
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>{repair.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={paymentBadgeProps.variant}
                        className={cn("text-xs", paymentBadgeProps.className)}
                      >
                        {repair.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(repair.estimatedCost)}
                    </TableCell>
                    <TableCell>
                      {new Date(repair.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      👉
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedRepair(repair)}
                          >
                            <Icons.search className="mr-2 h-4 w-4" /> View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditRepair(repair)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRepair(repair.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                          {/* ✅ New "Record Payment" action */}
                          <DropdownMenuItem
                            onClick={() => setPaymentDialogRepair(repair)} // <-- local state
                          >
                            Record Payment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                    <TableCell className="text-right">
                      ${(repair.totalPaid || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      $
                      {(repair.remainingBalance !== undefined
                        ? repair.remainingBalance
                        : repair.estimatedCost
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
