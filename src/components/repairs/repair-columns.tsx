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
import { MoreHorizontal, Edit, Trash2, Printer, FileText, Phone, CheckCircle2, Clock, XCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import { format, formatDistanceToNow } from "date-fns";

// Status color configuration
const getStatusConfig = (status: RepairStatus) => {
  switch (status) {
    case "Pending":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        hoverColor: "hover:bg-yellow-200 hover:border-yellow-400",
        icon: "⏳",
        selectColor: "text-yellow-700 hover:text-yellow-800",
      };
    case "In Progress":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        hoverColor: "hover:bg-blue-200 hover:border-blue-400",
        icon: "🔧",
        selectColor: "text-blue-700 hover:text-blue-800",
      };
    case "Completed":
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        hoverColor: "hover:bg-green-200 hover:border-green-400",
        icon: "✅",
        selectColor: "text-green-700 hover:text-green-800",
      };
    case "Delivered":
      return {
        color: "bg-purple-100 text-purple-800 border-purple-300",
        hoverColor: "hover:bg-purple-200 hover:border-purple-400",
        icon: "📦",
        selectColor: "text-purple-700 hover:text-purple-800",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        hoverColor: "hover:bg-gray-200 hover:border-gray-400",
        icon: "❓",
        selectColor: "text-gray-700 hover:text-gray-800",
      };
  }
};

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
  // Add print sticker function
  onPrintSticker: (repair: Repair) => void;
  // Add print receipt function
  onPrintReceipt: (repair: Repair) => void;
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
    accessorKey: "issueDescription",
    header: "Issue",
    cell: ({ row }) => {
      const issue = row.getValue("issueDescription") as string;
      return (
        <div className="max-w-[150px]">
          <div className="text-sm text-gray-700 line-clamp-2" title={issue}>
            {issue}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
    cell: ({ row }) => {
      const repair = row.original;
      const statusConfig = getStatusConfig(repair.status);

      return (
        <div className="flex items-center gap-2">
          <Select
            value={repair.status}
            onValueChange={(newStatus: RepairStatus) => {
              actions.updateRepairStatus(repair.id, newStatus);
            }}
          >
            <SelectTrigger
              className={cn(
                "h-8 min-w-[140px] transition-all duration-200",
                statusConfig.color,
                statusConfig.hoverColor
              )}
            >
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span className="text-base">{statusConfig.icon}</span>
                  <span className="font-medium">{repair.status}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  "Pending",
                  "In Progress",
                  "Completed",
                  "Delivered",
                ] as RepairStatus[]
              ).map((status) => {
                const config = getStatusConfig(status);
                return (
                  <SelectItem
                    key={status}
                    value={status}
                    className="py-2 transition-colors duration-200 hover:bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{config.icon}</span>
                      <span className="font-medium">{status}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      );
    },
  },
  {
    id: "paymentInfo",
    header: "Payment",
    filterFn: (row, id, value) => {
      return row.original.paymentStatus === value;
    },
    cell: ({ row }) => {
      const repair = row.original;
      const badgeProps = actions.getPaymentBadgeProps(repair.paymentStatus);
      const totalPaid = repair.totalPaid || 0;
      const remaining =
        repair.remainingBalance !== undefined
          ? repair.remainingBalance
          : repair.estimatedCost - totalPaid;

      // Payment status icon
      const getPaymentIcon = (status: PaymentStatus) => {
        switch (status) {
          case "Paid":
            return <CheckCircle2 className="h-3 w-3" />;
          case "Partially":
            return <Clock className="h-3 w-3" />;
          case "Unpaid":
            return <XCircle className="h-3 w-3" />;
          case "Refunded":
            return <DollarSign className="h-3 w-3" />;
          default:
            return null;
        }
      };

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant={badgeProps.variant}
              className={cn("text-xs px-1.5 py-0 flex items-center gap-1", badgeProps.className)}
            >
              {getPaymentIcon(repair.paymentStatus)}
              {repair.paymentStatus}
            </Badge>
            <span className="text-xs font-medium">{actions.formatCurrency(repair.estimatedCost)}</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Paid:</span>
              <span className="font-medium text-green-600">{totalPaid.toFixed(2)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Due:</span>
                <span className="font-medium text-orange-600">{remaining.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          {remaining > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1">
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
    },
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
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="space-y-0.5">
          <div className="text-sm font-medium">
            {format(date, "MMM dd, yyyy")}
          </div>
          <div className="text-xs text-gray-500">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <div className="flex items-center gap-1">
          {/* Direct Print Sticker Button */}
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => actions.onPrintSticker(repair)}
            title="Print Sticker"
          >
            <span className="sr-only">Print Sticker</span>
            <FileText className="h-4 w-4" />
          </Button>

          {/* Direct Print Receipt Button */}
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => actions.onPrintReceipt(repair)}
            title="Print Receipt"
          >
            <span className="sr-only">Print Receipt</span>
            <Printer className="h-4 w-4" />
          </Button>

          {/* Actions Menu */}
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
        </div>
      );
    },
  },
];
