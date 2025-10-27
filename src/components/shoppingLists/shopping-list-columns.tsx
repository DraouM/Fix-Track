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
import { MoreHorizontal, Edit, Trash2, Building2 } from "lucide-react";
import { ShoppingListItem, OrderStatus } from "@/types/shopping-list";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Status configuration
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "Draft":
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: "📝",
      };
    case "Pending":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: "⏳",
      };
    case "Ordered":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: "🚚",
      };
    case "Received":
      return {
        color: "bg-green-100 text-green-800 border-green-300",
        icon: "✅",
      };
    case "Cancelled":
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: "❌",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: "❓",
      };
  }
};

// Urgency configuration
const getUrgencyConfig = (urgency: "Low" | "Medium" | "High") => {
  switch (urgency) {
    case "Low":
      return {
        color: "bg-blue-100 text-blue-800 border-blue-300",
        icon: "🔽",
      };
    case "Medium":
      return {
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: "➡️",
      };
    case "High":
      return {
        color: "bg-red-100 text-red-800 border-red-300",
        icon: "🔼",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800 border-gray-300",
        icon: "❓",
      };
  }
};

interface ShoppingListColumnProps {
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}

export const shoppingListColumns = ({
  onEdit,
  onDelete,
  onStatusChange,
}: ShoppingListColumnProps): ColumnDef<ShoppingListItem>[] => [
  {
    accessorKey: "name",
    header: "Item",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{item.name}</div>
          {item.notes && (
            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
              {item.notes}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => row.getValue("quantity"),
  },
  {
    accessorKey: "estimatedCost",
    header: "Est. Cost",
    cell: ({ row }) => {
      const cost = row.getValue("estimatedCost") as number;
      return cost ? `$${cost.toFixed(2)}` : "-";
    },
  },
  {
    accessorKey: "supplierName",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.getValue("supplierName") as string;
      return supplier ? (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{supplier}</span>
        </div>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "urgency",
    header: "Urgency",
    cell: ({ row }) => {
      const urgency = row.getValue("urgency") as "Low" | "Medium" | "High";
      const config = getUrgencyConfig(urgency);
      return (
        <Badge variant="outline" className={cn("font-medium", config.color)}>
          <span className="mr-1">{config.icon}</span>
          {urgency}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as OrderStatus;
      const config = getStatusConfig(status);
      return (
        <Badge variant="outline" className={cn("font-medium", config.color)}>
          <span className="mr-1">{config.icon}</span>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      format(new Date(row.getValue("createdAt")), "MMM dd, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
