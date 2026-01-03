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
import { MoreHorizontal, Edit, Trash2, Printer, FileText, Phone, CheckCircle2, Clock, XCircle, DollarSign, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import { format, formatDistanceToNow } from "date-fns";

// Status color configuration
const getStatusConfig = (status: RepairStatus) => {
  switch (status) {
    case "Pending":
      return {
        color: "bg-yellow-50 text-yellow-700 border-yellow-100",
        hoverColor: "hover:bg-yellow-100",
        icon: "Clock",
        badge: "bg-yellow-100 text-yellow-700",
        indicator: "bg-yellow-500",
      };
    case "In Progress":
      return {
        color: "bg-blue-50 text-blue-700 border-blue-100",
        hoverColor: "hover:bg-blue-100",
        icon: "Wrench",
        badge: "bg-blue-100 text-blue-700",
        indicator: "bg-blue-500",
      };
    case "Completed":
      return {
        color: "bg-green-50 text-green-700 border-green-100",
        hoverColor: "hover:bg-green-100",
        icon: "CheckCircle2",
        badge: "bg-green-100 text-green-700",
        indicator: "bg-green-500",
      };
    case "Delivered":
      return {
        color: "bg-purple-50 text-purple-700 border-purple-100",
        hoverColor: "hover:bg-purple-100",
        icon: "Truck",
        badge: "bg-purple-100 text-purple-700",
        indicator: "bg-purple-500",
      };
    default:
      return {
        color: "bg-gray-50 text-gray-700 border-gray-100",
        hoverColor: "hover:bg-gray-100",
        indicator: "bg-gray-500",
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
        <div className="flex flex-col">
          <span className="font-black text-sm text-foreground">{repair.customerName}</span>
          {repair.customerPhone && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider">
               {repair.customerPhone}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "deviceModel",
    header: "Device",
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-black text-xs text-foreground uppercase tracking-tight">
            {repair.deviceBrand}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">
            {repair.deviceModel}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "issueDescription",
    header: "Issue",
    cell: ({ row }) => {
      const issue = row.getValue("issueDescription") as string;
      return (
        <div className="max-w-[150px]">
          <span className="text-xs font-bold text-muted-foreground line-clamp-1" title={issue}>
            {issue}
          </span>
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
        <Select
          value={repair.status}
          onValueChange={(newStatus: RepairStatus) => {
            actions.updateRepairStatus(repair.id, newStatus);
          }}
        >
          <SelectTrigger
            className={cn(
              "h-7 min-w-[130px] rounded-lg border-2 transition-all duration-200 px-2 py-0.5",
              statusConfig.color,
              statusConfig.hoverColor
            )}
          >
            <SelectValue>
              <div className="flex items-center gap-2">
                <div className={cn("h-1.5 w-1.5 rounded-full", statusConfig.indicator)}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{repair.status}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-none shadow-2xl">
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
                    <div className={cn("h-1.5 w-1.5 rounded-full", config.indicator)}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
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
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <div className="flex items-center gap-2">
            <Badge
              variant={badgeProps.variant}
              className={cn(
                "rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", 
                badgeProps.className
              )}
            >
              {repair.paymentStatus}
            </Badge>
            <span className="text-xs font-black">{actions.formatCurrency(repair.estimatedCost)}</span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-green-500"></div>
                <span className="text-[10px] font-bold text-green-700 uppercase">{totalPaid.toFixed(2)}</span>
             </div>
             {remaining > 0 && (
               <div className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-orange-500"></div>
                  <span className="text-[10px] font-bold text-orange-700 uppercase">{remaining.toFixed(2)} DUE</span>
               </div>
             )}
          </div>
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
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            {format(date, "MMM dd")}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">
             {formatDistanceToNow(date, { addSuffix: true })}
          </span>
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
        <div className="flex items-center justify-end gap-1">
           {/* Actions Menu */}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-xl hover:bg-muted opacity-60 hover:opacity-100">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]">
              <DropdownMenuItem onClick={() => actions.onViewRepair(repair)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                <Icons.search className="mr-3 h-4 w-4 opacity-70" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onEditRepair(repair)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                <Edit className="mr-3 h-4 w-4 opacity-70" /> Edit Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onPaymentDialog(repair)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                <DollarSign className="mr-3 h-4 w-4 opacity-70" /> Record Payment
              </DropdownMenuItem>
              <div className="h-px bg-muted my-1 mx-1"></div>
              <DropdownMenuItem onClick={() => actions.onPrintSticker(repair)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                <FileText className="mr-3 h-4 w-4 opacity-70" /> Print Sticker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onPrintReceipt(repair)} className="rounded-xl font-bold text-xs uppercase tracking-wider py-2">
                <Printer className="mr-3 h-4 w-4 opacity-70" /> Print Receipt
              </DropdownMenuItem>
              <div className="h-px bg-muted my-1 mx-1"></div>
              <DropdownMenuItem
                onClick={() => actions.onDeleteRepair(repair.id)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-3 h-4 w-4 opacity-70" /> Delete Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => actions.onViewRepair(repair)}
            className="rounded-xl group-hover:bg-white shadow-sm border opacity-0 group-hover:opacity-100 transition-all h-9 w-9"
          >
            <Icons.search className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
