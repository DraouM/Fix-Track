"use client";

import React from "react";
import { MoreHorizontal, Phone, Mail, MapPin, DollarSign, ExternalLink, History, Edit2, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Client } from "@/types/client";
import { formatCurrency, getClientStatusBadgeVariant, getClientStatusDisplayText } from "@/lib/clientUtils";
import { useRouter } from "next/navigation";
import { useClientContext } from "@/context/ClientContext";
import { cn } from "@/lib/utils";

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  onRecordPayment: (clientId: string) => void;
}

export function ClientTable({ clients, loading, onRecordPayment }: ClientTableProps) {
  const router = useRouter();
  const { deleteClient } = useClientContext();

  if (loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading clients...</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2">
        <Users className="h-12 w-12 text-muted-foreground opacity-20" />
        <p className="text-xl font-semibold text-muted-foreground">No clients found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your search or add a new client.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-semibold">Client Name</TableHead>
            <TableHead className="font-semibold">Contact Info</TableHead>
            <TableHead className="font-semibold">Balance</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow 
              key={client.id} 
              className="group cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => router.push(`/clients/${client.id}`)}
            >
              <TableCell className="py-4">
                <div className="flex flex-col">
                  <span className="font-bold text-base">{client.name}</span>
                  {client.contactName && (
                    <span className="text-xs text-muted-foreground">{client.contactName}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {client.phone && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Phone className="mr-1 h-3 w-3" /> {client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Mail className="mr-1 h-3 w-3 text-primary/60" /> {client.email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-bold",
                    client.outstandingBalance > 0 ? "text-destructive" : "text-green-600"
                  )}>
                    {formatCurrency(client.outstandingBalance)}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground font-medium">Outstanding</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={getClientStatusBadgeVariant(client.status) as any} className="capitalize">
                  {getClientStatusDisplayText(client.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => onRecordPayment(client.id)}
                  >
                    Payment
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Client Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                        <ExternalLink className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <History className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${client.name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
