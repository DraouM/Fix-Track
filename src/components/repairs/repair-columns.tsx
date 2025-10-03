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
import { DateRange } from "react-day-picker";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import { format } from "date-fns";

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
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{repair.customerName}</div>
          {repair.customerPhone && (
            <div className="text-sm text-gray-500">{repair.customerPhone}</div>
          )}
        </div>
      );
    },
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
    filterFn: (row, id, value: DateRange) => {
      const rowDate = new Date(row.getValue(id));
      const { from, to } = value;

      if (from && to) {
        return rowDate >= from && rowDate <= to;
      } else if (from) {
        return rowDate >= from;
      }
      return true;
    },
    cell: ({ row }) =>
      format(new Date(row.getValue("createdAt")), "MMM dd, yyyy"),
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
    id: "payment",
    header: "Amounts",
    cell: ({ row }) => {
      const repair = row.original;
      const totalPaid = repair.totalPaid || 0;
      const remaining =
        repair.remainingBalance !== undefined
          ? repair.remainingBalance
          : repair.estimatedCost - totalPaid;

      const badgeProps = actions.getPaymentBadgeProps(repair.paymentStatus);

      return (
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-2">
            <div className="text-sm font-medium text-green-600">
              ${totalPaid.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">paid</div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div
              className={cn(
                "text-sm font-medium",
                remaining > 0 ? "text-orange-600" : "text-gray-500"
              )}
            >
              ${remaining.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">remaining</div>
          </div>
          {remaining > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (totalPaid / repair.estimatedCost) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      );

      /* 
      // ALTERNATIVE IMPLEMENTATION - Status Badge + Amounts Combined
      // Uncomment this block and comment out the above to switch to the enhanced version
      
      const badgeProps = actions.getPaymentBadgeProps(repair.paymentStatus);
      
      return (
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <Badge
              variant={badgeProps.variant}
              className={cn("text-xs px-2 py-0.5", badgeProps.className)}
            >
              {repair.paymentStatus}
            </Badge>
            <div className="text-sm font-medium text-green-600">
              ${totalPaid.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">paid</div>
          </div>
          
          <div className="flex items-center justify-end gap-2">
            <div
              className={cn(
                "text-sm font-medium",
                remaining > 0 ? "text-orange-600" : "text-gray-500"
              )}
            >
              ${remaining.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">remaining</div>
          </div>
          
          {remaining > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (totalPaid / repair.estimatedCost) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      );
      */
    },
  },
];
