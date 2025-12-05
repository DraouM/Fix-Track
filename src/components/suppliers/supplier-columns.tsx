// supplier-columns.tsx
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
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Supplier } from "@/types/supplier";

interface SupplierColumnProps {
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export const supplierColumns = ({
  onEdit,
  onDelete,
}: SupplierColumnProps): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{supplier.name}</div>
          {supplier.contactName && (
            <div className="text-sm text-muted-foreground">
              Contact: {supplier.contactName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact Info",
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="space-y-1">
          {supplier.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${supplier.email}`}
                className="text-blue-600 hover:underline truncate"
              >
                {supplier.email}
              </a>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              <a
                href={`tel:${supplier.phone}`}
                className="text-blue-600 hover:underline truncate"
              >
                {supplier.phone}
              </a>
            </div>
          )}
          {supplier.address && (
            <div
              className="text-sm text-gray-500 flex items-start gap-2 mt-1 truncate"
              title={supplier.address}
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="truncate">{supplier.address}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "preferredPaymentMethod",
    header: "Payment Method",
    cell: ({ row }) => {
      const method = row.getValue("preferredPaymentMethod") as string;
      return method ? <Badge variant="secondary">{method}</Badge> : null;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status === "active" ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(supplier)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(supplier)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
