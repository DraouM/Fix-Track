"use client";

import React, { useState } from "react";
import { useRepairContext } from "@/context/RepairContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Import Badge
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
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { RepairDetail } from "./RepairDetail";
import { cn } from "@/lib/utils";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import { Icons } from "@/components/icons";

interface RepairListProps {
  onEditRepair: (repair: Repair) => void;
}

export function RepairList({ onEditRepair }: RepairListProps) {
  const { repairs, updateRepair, deleteRepair } = useRepairContext();
  const [selectedRepairDetail, setSelectedRepairDetail] =
    useState<Repair | null>(null);

  const handleStatusChange = (repairId: string, newStatus: RepairStatus) => {
    const repairToUpdate = repairs.find((r) => r.id === repairId);
    if (repairToUpdate) {
      updateRepair({ ...repairToUpdate, repairStatus: newStatus });
    }
  };

  const getStatusColorClass = (status: RepairStatus): string => {
    switch (status) {
      case "Completed":
        return "border-l-green-500";
      case "In Progress":
        return "border-l-orange-500";
      case "Cancelled":
        return "border-l-destructive";
      case "Pending":
      default:
        return "border-l-muted-foreground";
    }
  };

  const getPaymentStatusBadgeProps = (
    status: PaymentStatus
  ): {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  } => {
    switch (status) {
      case "Paid":
        return {
          variant: "default",
          className:
            "bg-green-500 hover:bg-green-600 text-primary-foreground border-transparent",
        };
      case "Unpaid":
        return {
          variant: "destructive",
          className:
            "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-transparent",
        };
      case "Partially Paid":
        return {
          variant: "secondary",
          className:
            "bg-yellow-500 hover:bg-yellow-600 text-primary-foreground border-transparent",
        }; // Use primary-foreground for better contrast on yellow
      case "Refunded":
        return {
          variant: "outline",
          className: "text-foreground border-border",
        };
      default:
        return {
          variant: "outline",
          className: "text-foreground border-border",
        };
    }
  };

  const handleDeleteRepair = (repairId: string) => {
    // Consider adding a confirmation dialog here
    deleteRepair(repairId);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Current Repairs</h2>
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your current repairs.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead className="hidden md:table-cell">Issue</TableHead>
              <TableHead>Repair Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  No repairs found. Click "Add New Repair" to get started.
                </TableCell>
              </TableRow>
            ) : (
              repairs.map((repair) => {
                const paymentBadgeProps = getPaymentStatusBadgeProps(
                  repair.paymentStatus
                );
                return (
                  <TableRow
                    key={repair.id}
                    className={cn(
                      "border-l-4",
                      getStatusColorClass(repair.repairStatus)
                    )}
                  >
                    <TableCell className="font-mono text-xs">
                      {repair.id.slice(-6)}
                    </TableCell>
                    <TableCell>{repair.customerName}</TableCell>
                    <TableCell>
                      {repair.deviceBrand} {repair.deviceModel}
                    </TableCell>
                    <TableCell className="max-w-xs truncate hidden md:table-cell">
                      {repair.issueDescription}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={repair.repairStatus}
                        onValueChange={(newStatus: RepairStatus) =>
                          handleStatusChange(repair.id, newStatus)
                        }
                      >
                        <SelectTrigger className="w-full md:w-[140px] text-xs md:text-sm h-9 md:h-10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                      ${repair.estimatedCost}
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
                            onClick={() => setSelectedRepairDetail(repair)}
                          >
                            <Icons.search className="mr-2 h-4 w-4" /> View
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditRepair(repair)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Repair
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRepair(repair.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Repair
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
      {selectedRepairDetail && (
        <RepairDetail
          repair={selectedRepairDetail}
          onClose={() => setSelectedRepairDetail(null)}
        />
      )}
    </div>
  );
}
