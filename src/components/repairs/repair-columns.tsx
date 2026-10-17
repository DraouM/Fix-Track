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
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Printer,
  FileText,
  Phone,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  MoreVertical,
  Minus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import type { Repair, RepairStatus, PaymentStatus } from "@/types/repair";
import { format, formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

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

// Deterministic avatar hue so each technician keeps a consistent color
const getTechnicianHue = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
};

interface RepairColumnActions {
  onEditRepair: (repair: Repair) => void;
  onViewRepair: (repair: Repair) => void;
  onDeleteRepair: (id: string) => void;
  onPaymentDialog: (repair: Repair) => void;
  updateRepairStatus: (id: string, status: RepairStatus) => void;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
  currencySymbol: string;
  getPaymentBadgeProps: (status: PaymentStatus) => {
    variant: "default" | "destructive" | "secondary" | "outline";
    className: string;
  };
  // Add print sticker function
  onPrintSticker: (repair: Repair) => void;
  // Add print receipt function
  onPrintReceipt: (repair: Repair) => void;
  // Add preview receipt function
  onPreviewReceipt: (repair: Repair) => void;
  // Technician display name lookup (undefined when unassigned)
  technicianName?: (id?: string | null) => string | undefined;
}

export const createRepairColumns = (
  actions: RepairColumnActions,
  t: any,
): ColumnDef<Repair>[] => [
  // Combined Technician & Selection column (interactive circular avatar with smart badge & ring overlay)
  {
    id: "technicianId",
    accessorKey: "technicianId",
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected();
      const isSomeSelected = table.getIsSomePageRowsSelected();
      return (
        <div className="flex items-center justify-center">
          <button
            type="button"
            role="checkbox"
            aria-checked={
              isAllSelected ? true : isSomeSelected ? "mixed" : false
            }
            aria-label={t("common.selectAll") || "Select all"}
            onClick={(e) => {
              e.stopPropagation();
              table.toggleAllPageRowsSelected(!isAllSelected);
            }}
            className={cn(
              "group/hdr relative h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 border-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isAllSelected
                ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/25"
                : isSomeSelected
                  ? "border-primary/70 bg-primary/10 text-primary"
                  : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30 text-transparent hover:text-muted-foreground/40",
            )}
            title={t("common.selectAll") || "Select all"}
          >
            {isAllSelected ? (
              <Check className="h-3 w-3 stroke-[3]" />
            ) : isSomeSelected ? (
              <Minus className="h-3 w-3 stroke-[3]" />
            ) : (
              <Check className="h-2.5 w-2.5 opacity-0 group-hover/hdr:opacity-40 transition-opacity stroke-[3]" />
            )}
          </button>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "All") return true;
      if (value === "Unassigned") return !row.original.technicianId;
      return row.original.technicianId === value;
    },
    sortingFn: (rowA, rowB) => {
      const nameA = actions.technicianName?.(rowA.original.technicianId) ?? "";
      const nameB = actions.technicianName?.(rowB.original.technicianId) ?? "";
      return nameA.localeCompare(nameB);
    },
    cell: ({ row }) => {
      const isSelected = row.getIsSelected();
      const technicianId = row.original.technicianId;
      const name = actions.technicianName?.(technicianId);
      const initials = name ? name.trim().slice(0, 2).toUpperCase() : null;
      const hue =
        technicianId || name ? getTechnicianHue(technicianId ?? name!) : 0;

      const titleText = name
        ? `${name} · ${
            isSelected
              ? t("common.selected") || "Selected (Click to deselect)"
              : t("common.select") || "Click to select"
          }`
        : `${t("repairs.unassigned")} · ${
            isSelected
              ? t("common.selected") || "Selected (Click to deselect)"
              : t("common.select") || "Click to select"
          }`;

      return (
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            aria-label={
              name
                ? `${isSelected ? "Deselect" : "Select"} repair assigned to ${name}`
                : `${isSelected ? "Deselect" : "Select"} unassigned repair`
            }
            onClick={() => row.toggleSelected(!isSelected)}
            title={titleText}
            className={cn(
              "relative group flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                : "hover:scale-105",
            )}
          >
            {/* Circular Avatar */}
            {initials ? (
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-black uppercase transition-all duration-200 select-none",
                  isSelected ? "shadow-inner" : "",
                )}
                style={{
                  backgroundColor: isSelected
                    ? `hsl(${hue} 71% 45% / 0.28)`
                    : `hsl(${hue} 71% 45% / 0.18)`,
                  color: `hsl(${hue} 75% 38%)`,
                }}
              >
                {initials}
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-full border border-dashed transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground/40 group-hover:border-primary/50 group-hover:text-primary/70",
                )}
              >
                <Minus className="h-3.5 w-3.5" />
              </div>
            )}

            {/* Smart Check Badge overlay */}
            {isSelected ? (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md animate-in zoom-in-75 duration-150">
                <Check className="h-2.5 w-2.5 stroke-[3.5]" />
              </div>
            ) : (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <Check className="h-2 w-2 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 52,
    meta: {
      className:
        "w-14 first:px-3 text-center border-r border-border/50 dark:border-slate-800 bg-muted/[0.04] dark:bg-slate-900/30",
    },
  },
  // {  the code of the repairs id
  //   accessorKey: "code",
  //   header: t("repairs.orderDetail")?.split(" ")[0] || "Order #",
  //   cell: ({ row }) => {
  //     const repair = row.original;
  //     return (
  //       <span className="font-black text-sm text-foreground font-mono">
  //         #{repair.code || repair.id.split("-")[0].toUpperCase()}
  //       </span>
  //     );
  //   },
  // },
  {
    accessorKey: "customerName",
    header: t("repairs.customerName"),
    meta: {
      className: "pl-5",
    },
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-black text-sm text-foreground">
            {repair.customerName}
          </span>
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
    header: t("repairs.device"),
    meta: { className: "hidden md:table-cell" },
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
    header: t("repairs.issue"),
    meta: { className: "hidden xl:table-cell" },
    cell: ({ row }) => {
      const issue = row.getValue("issueDescription") as string;
      return (
        <div className="max-w-[150px]">
          <span
            className="text-xs font-bold text-muted-foreground line-clamp-1"
            title={issue}
          >
            {issue}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: t("repairs.status"),
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
    cell: ({ row }) => {
      const repair = row.original;
      const statusConfig = getStatusConfig(repair.status);

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={repair.status}
            onValueChange={(newStatus: RepairStatus) => {
              actions.updateRepairStatus(repair.id, newStatus);
            }}
          >
            <SelectTrigger
              className={cn(
                "h-7 min-w-[110px] rounded-lg border-2 transition-all duration-200 px-2 py-0.5",
                statusConfig.color,
                statusConfig.hoverColor,
              )}
            >
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      statusConfig.indicator,
                    )}
                  ></div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {t(
                      "repairs." + repair.status.toLowerCase().replace(" ", ""),
                    )}
                  </span>
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
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          config.indicator,
                        )}
                      ></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {t("repairs." + status.toLowerCase().replace(" ", ""))}
                      </span>
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
    id: "paymentStatus",
    header: () => (
      <div className="flex items-center gap-1">
        {t("transactions_module.payment")}
        <span className="text-[8px] opacity-60 font-black">
          ({actions.currencySymbol})
        </span>
      </div>
    ),
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
                badgeProps.className,
              )}
            >
              {t(
                "repairs." +
                  repair.paymentStatus.toLowerCase().replace(" ", ""),
              )}
            </Badge>
            <span className="text-xs font-black">
              {actions.formatNumber(repair.estimatedCost)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-1 rounded-full bg-green-500"></div>
              <span className="text-[10px] font-bold text-green-700 uppercase">
                {actions.formatNumber(totalPaid)}
              </span>
            </div>
            {remaining > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-1 rounded-full bg-orange-500"></div>
                <span className="text-[10px] font-bold text-orange-700 uppercase">
                  {actions.formatNumber(remaining)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: t("repairs.created"),
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
        <div
          className="flex flex-col cursor-default"
          title={`${format(date, "MMM dd, yyyy HH:mm")} · ${formatDistanceToNow(date, { addSuffix: true })}`}
        >
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            {format(date, "MMM dd")}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">
            {format(date, "HH:mm")}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: t("common.actions"),
    enableHiding: false,
    cell: ({ row }) => {
      const repair = row.original;
      return (
        <div
          className="flex items-center justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-xl hover:bg-muted opacity-60 hover:opacity-100"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl border-none shadow-2xl p-2 min-w-[160px]"
            >
              <DropdownMenuItem
                onClick={() => actions.onViewRepair(repair)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
              >
                <Icons.search className="mr-3 h-4 w-4 opacity-70" />{" "}
                {t("repairs.viewDetails")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onEditRepair(repair)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
              >
                <Edit className="mr-3 h-4 w-4 opacity-70" />{" "}
                {t("repairs.editOrder")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onPaymentDialog(repair)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
              >
                <DollarSign className="mr-3 h-4 w-4 opacity-70" />{" "}
                {t("repairs.addPayment")}
              </DropdownMenuItem>
              <div className="h-px bg-muted my-1 mx-1"></div>
              <DropdownMenuItem
                onClick={() => actions.onPrintSticker(repair)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
              >
                <FileText className="mr-3 h-4 w-4 opacity-70" />{" "}
                {t("repairs.printSticker")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onPrintReceipt(repair)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
              >
                <Printer className="mr-3 h-4 w-4 opacity-70" />{" "}
                {t("repairs.printReceipt")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onPreviewReceipt(repair)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2"
              >
                <FileText className="mr-3 h-4 w-4 opacity-70" /> Preview & PDF
              </DropdownMenuItem>
              <div className="h-px bg-muted my-1 mx-1"></div>
              <DropdownMenuItem
                onClick={() => actions.onDeleteRepair(repair.id)}
                className="rounded-xl font-bold text-xs uppercase tracking-wider py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-3 h-4 w-4 opacity-70" />{" "}
                {t("repairs.deleteOrder")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
