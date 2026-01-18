// supplier-columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { Supplier } from "@/types/supplier";
import { formatCurrency } from "@/lib/supplierUtils";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
    header: ({ column }) => (
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-muted-foreground/40">Supplier Entity</div>
    ),
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex items-center gap-3 group/cell">
          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center font-black text-primary border border-gray-100 dark:border-slate-800 group-hover/cell:bg-primary group-hover/cell:text-white transition-all duration-300">
            {supplier.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-foreground dark:text-slate-200">{supplier.name}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/cell:opacity-40 transition-opacity" />
            </div>
            {supplier.contactName && (
              <div className="flex items-center gap-1 opacity-40">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-muted-foreground/40">
                  {supplier.contactName}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: ({ column }) => (
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-muted-foreground/40">Communications</div>
    ),
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex flex-col gap-1.5">
          {supplier.email && (
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground dark:text-muted-foreground/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">
              <Mail className="h-3 w-3 opacity-40" />
              <span className="truncate max-w-[150px]">{supplier.email}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground dark:text-muted-foreground/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">
              <Phone className="h-3 w-3 opacity-40" />
              <span>{supplier.phone}</span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "outstandingBalance",
    header: ({ column }) => (
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-muted-foreground/40 text-right">Position</div>
    ),
    cell: ({ row }) => {
      const balance = row.getValue("outstandingBalance") as number || 0;
      return (
        <div className="flex flex-col items-end gap-1">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[11px] font-black shadow-none border flex items-center gap-2",
            balance > 0 
              ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40" 
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
          )}>
            <CreditCard className="w-3.5 h-3.5 opacity-60" />
            {formatCurrency(balance)}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 dark:text-muted-foreground/20 mr-1">Current Due</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-muted-foreground/40 text-center">Status</div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex justify-center">
          <Badge 
            variant="outline" 
            className={cn(
              "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-none border",
              status === "active" 
                ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40" 
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
            )}
          >
            {status === "active" ? "Operational" : "Inactive"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: ({ column }) => <div className="sr-only">Actions</div>,
    cell: ({ row }) => {
      const supplier = row.original;

      return (
        <div className="flex items-center justify-end gap-2 pr-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white dark:border-slate-800 transition-all shadow-sm"
            onClick={() => onEdit(supplier)}
          >
            Edit
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground/60 dark:text-muted-foreground/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] border-none shadow-2xl p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/50 px-3 py-2">
                Operational Terminal
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-50 dark:bg-slate-800 my-1" />
              <DropdownMenuItem 
                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                onSelect={() => window.location.href = `/suppliers/${supplier.id}`}
              >
                <ExternalLink className="mr-3 h-4 w-4 opacity-40 text-primary" /> Profile View
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                onClick={() => onDelete(supplier)}
              >
                <Trash2 className="mr-3 h-4 w-4 opacity-40" /> Terminate Account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
