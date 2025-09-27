"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";

interface RepairColumnActions {
  onEditRepair: (repair: Repair) => void;
  onViewRepair: (repair: Repair) => void;
  onDeleteRepair: (id: string) => void;
  onPaymentDialog: (repair: Repair) => void;
  updateRepairStatus: (id: string, status: RepairStatus) => void;
  formatCurrency: (value: number) => string;
  getPaymentBadgeProps: (status: PaymentStatus) => {
    variant: "default" | "destructive" | "secondary" | "outline";
    className: string;
  };
}

export const createRepairColumns = (
  actions: RepairColumnActions
): ColumnDef<Repair>[] => [
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
  },
  {
    accessorKey: "deviceModel",
    header: "Device",
    cell: ({ row }) => (
      <div>
        {row.original.deviceBrand} {row.getValue("deviceModel")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <Select
          value={repair.status}
          onValueChange={(newStatus: RepairStatus) => {
            actions.updateRepairStatus(repair.id, newStatus);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>{repair.status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
    cell: ({ row }) => {
      const repair = row.original;
      const badgeProps = actions.getPaymentBadgeProps(repair.paymentStatus);
      return (
        <Badge
          variant={badgeProps.variant}
          className={cn("text-xs", badgeProps.className)}
        >
          {repair.paymentStatus}
        </Badge>
      );
    },
  },
  {
    accessorKey: "estimatedCost",
    header: "Cost",
    cell: ({ row }) => (
      <div className="text-right">
        {actions.formatCurrency(row.getValue("estimatedCost"))}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <div>{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onViewRepair(repair)}>
              <Icons.search className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onEditRepair(repair)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onDeleteRepair(repair.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.onPaymentDialog(repair)}>
              Record Payment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    accessorKey: "totalPaid",
    header: "Paid",
    cell: ({ row }) => (
      <div className="text-right">
        ${(row.original.totalPaid || 0).toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "remainingBalance",
    header: "Remaining",
    cell: ({ row }) => {
      const repair = row.original;
      const remaining =
        repair.remainingBalance !== undefined
          ? repair.remainingBalance
          : repair.estimatedCost;
      return <div className="text-right">${remaining.toFixed(2)}</div>;
    },
  },
];
