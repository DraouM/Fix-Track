"use client";

import { useState } from "react";
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
import { Icons } from "@/components/icons";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RepairDetail } from "./RepairDetail";

interface RepairTableProps {
  onEditRepair: (repair: Repair) => void;
}

export function RepairTable({ onEditRepair }: RepairTableProps) {
  const { repairs, updateRepairStatus, updatePaymentStatus, deleteRepair } =
    useRepairContext();

  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

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

  // ✅ Helpers
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const getStatusColorClass = (status: RepairStatus) => {
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
  };

  const getPaymentBadgeProps = (status: PaymentStatus) => {
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
          className: "text-gray-700",
        };
      default:
        return { variant: "outline" as const, className: "" };
    }
  };

  const handleDeleteRepair = (id: string) => {
    if (window.confirm("Are you sure you want to delete this repair?")) {
      deleteRepair(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* -------------------- Filters -------------------- */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search repairs..."
          value={filters.searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-2 py-1"
        />

        <select
          value={filters.status}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Delivered">Delivered</option>
        </select>

        <select
          value={filters.paymentStatus}
          onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
          className="border rounded px-2 py-1"
        >
          <option value="All">All Payments</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Refundd">Refunded</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-500 underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* -------------------- Statistics -------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>Total Repairs: {statistics.total}</div>
        <div>Filtered: {statistics.filtered}</div>
        <div>Total Revenue: {statistics.totalRevenue}</div>
        <div>Pending Revenue: {statistics.pendingRevenue}</div>
      </div>

      {/* -------------------- Table -------------------- */}
      <div className="rounded-md border">
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
                        onValueChange={(newStatus: RepairStatus) =>
                          updateRepairStatus(repair.id, newStatus)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
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
                        </DropdownMenuContent>
                      </DropdownMenu>
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
    </div>
  );
}
