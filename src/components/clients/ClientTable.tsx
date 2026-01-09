"use client";

import React from "react";
import { 
  MoreHorizontal, 
  Phone, 
  Mail, 
  ExternalLink, 
  History, 
  Edit2, 
  Trash2, 
  Users,
  ArrowUpRight,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { formatCurrency, getClientStatusDisplayText } from "@/lib/clientUtils";
import { useRouter } from "next/navigation";
import { useClientContext } from "@/context/ClientContext";
import { cn } from "@/lib/utils";

interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  onRecordPayment: (clientId: string) => void;
  onEditClient: (clientId: string) => void;
}

export function ClientTable({ clients, loading, onRecordPayment, onEditClient }: ClientTableProps) {
  const router = useRouter();
  const { deleteClient } = useClientContext();

  if (loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-gray-100 italic">
        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center animate-pulse mb-4">
          <History className="h-6 w-6 text-primary" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Synchronizing entity data...</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-gray-100">
        <div className="p-5 rounded-[2rem] bg-gray-50 mb-6 flex items-center justify-center shadow-inner">
          <Users className="h-10 w-10 text-muted-foreground/20 font-light" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/40">No Accounts Detected</p>
        <p className="text-[10px] font-bold text-muted-foreground/60 mt-3 uppercase tracking-widest">Adjust search parameters or register a new identity.</p>
      </div>
    );
  }

  const headerStyles = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 h-16 py-0 border-none select-none";

  return (
    <div className="relative overflow-hidden w-full rounded-[2.5rem] bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
      <Table>
        <TableHeader className="bg-white/90 sticky top-0 z-20 backdrop-blur-md border-b-2 border-gray-50 shadow-sm">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className={cn(headerStyles, "pl-8")}>Account Identity</TableHead>
            <TableHead className={headerStyles}>Operational Channels</TableHead>
            <TableHead className={cn(headerStyles, "text-right")}>Financial Position</TableHead>
            <TableHead className={cn(headerStyles, "text-center")}>System Status</TableHead>
            <TableHead className={cn(headerStyles, "text-right pr-8")}>Directives</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client, idx) => (
            <TableRow 
              key={client.id} 
              className="group cursor-default border-b border-gray-50 hover:bg-muted/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <TableCell className="py-6 pl-8">
                <div 
                  className="flex flex-col cursor-pointer group-hover:translate-x-1.5 transition-transform duration-300"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {client.name}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-all text-primary" />
                  </div>
                  {client.contactName && (
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-40">
                       <ShieldCheck className="w-3 h-3 text-primary" />
                       <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                         {client.contactName}
                       </span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-6">
                <div className="flex flex-col gap-2.5">
                  {client.phone && (
                    <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center mr-2.5 border border-gray-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                        <Phone className="h-3 w-3 opacity-40" />
                      </div> 
                      {client.phone}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                      <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center mr-2.5 border border-primary/5 group-hover:bg-white group-hover:border-primary/20 transition-all">
                        <Mail className="h-3 w-3 opacity-40 text-primary" />
                      </div> 
                      <span className="truncate max-w-[180px]">{client.email}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right py-6">
                <div className="flex flex-col items-end gap-1.5">
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm flex items-center gap-2",
                    client.outstandingBalance > 0 
                      ? "bg-red-50 text-red-600 border border-red-100" 
                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  )}>
                    <CreditCard className="w-3.5 h-3.5 opacity-60" />
                    {formatCurrency(client.outstandingBalance)}
                  </div>
                  <span className="text-[9px] uppercase text-muted-foreground/30 font-black tracking-widest mr-1">
                    Aggregate Debt
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center py-6">
                <div className="flex justify-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] shadow-none border transition-all",
                      client.status === "active" 
                        ? "bg-green-50 text-green-600 border-green-100 group-hover:bg-green-100" 
                        : "bg-gray-100 text-gray-400 border-gray-200 group-hover:bg-gray-200"
                    )}
                  >
                    {getClientStatusDisplayText(client.status)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right py-6 pr-8">
                <div className="flex items-center justify-end gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                    onClick={() => onRecordPayment(client.id)}
                  >
                    Settlement
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] border-none shadow-2xl p-2 bg-white/95 backdrop-blur-md">
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3 py-2">
                        Account Terminal
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-50 my-1" />
                      <DropdownMenuItem 
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                        onClick={() => router.push(`/clients/${client.id}`)}
                      >
                        <ExternalLink className="mr-3 h-4 w-4 opacity-40 text-primary" /> Core Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                        onClick={() => onEditClient(client.id)}
                      >
                        <Edit2 className="mr-3 h-4 w-4 opacity-40 text-primary" /> Modify Credentials
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer">
                        <History className="mr-3 h-4 w-4 opacity-40 text-primary" /> Financial Audit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-50 my-1" />
                      <DropdownMenuItem 
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Terminate account for ${client.name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-3 h-4 w-4 opacity-40" /> Terminate Identity
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
