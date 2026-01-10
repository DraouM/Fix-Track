"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  History,
  ShoppingCart,
  Pencil,
  Trash2,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  CreditCard,
  ShieldCheck,
  Tag,
  LayoutDashboard,
  Box,
  Link as LinkIcon,
  Wallet,
  TrendingUp,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientContext } from "@/context/ClientContext";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/clientUtils";
import { ClientForm } from "./ClientForm";
import { ClientPaymentModal } from "./ClientPaymentModal";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientDetailProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const { clients, getClientHistory, deleteClient, loading } =
    useClientContext();
  const client = clients.find((c) => c.id === clientId);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (clientId) {
      getClientHistory(clientId);
    }
  }, [clientId]); // Only run when clientId changes, not on every render

  if (!client) {
    return (
      <div className="flex flex-col h-full bg-[#fbfcfd]">
        {/* Top Banner & Header Skeleton */}
        <div className="relative p-8 pb-32 bg-primary/5 border-b border-primary/5 overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="w-64 h-64 -mr-20 -mt-20" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-6 min-w-0 flex-1">
              <div className="h-12 w-12 rounded-2xl border-2 font-black bg-white/80 hover:bg-white transition-all shadow-sm" />
              <div className="w-24 h-24 rounded-[2rem] bg-gray-200/50 shadow-xl shadow-primary/5 border-4 border-white flex items-center justify-center text-4xl font-black text-primary animate-pulse">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="h-8 w-48 bg-gray-200/50 rounded-xl animate-pulse" />
                  <div className="h-6 w-24 bg-gray-200/30 rounded-lg animate-pulse" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="h-4 w-32 bg-gray-200/30 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200/30 rounded animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="h-12 w-24 bg-gray-200/50 rounded-2xl animate-pulse" />
              <div className="h-12 w-24 bg-gray-200/50 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Dashboard Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-8 -mt-20 pb-20 space-y-8">
          {/* Info Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identity Card Skeleton */}
            <div className="lg:col-span-1 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
              <div className="bg-gray-50/50 border-b border-gray-100 py-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50/50 text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="h-4 w-32 bg-gray-200/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="pt-8 space-y-6 p-6">
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-200/30 rounded animate-pulse ml-1" />
                  <div className="h-12 w-full bg-gray-200/30 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-12 w-full bg-gray-200/30 rounded-xl animate-pulse" />
                  <div className="h-12 w-full bg-gray-200/30 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-200/30 rounded animate-pulse ml-1" />
                  <div className="h-16 w-full bg-gray-200/30 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>

            {/* Financial Dashboard Card Skeleton */}
            <div className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
              <div className="bg-emerald-50/50 border-b border-emerald-100/50 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100/50 text-emerald-600">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="h-4 w-40 bg-gray-200/30 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-28 bg-gray-200/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <div className="h-3 w-32 bg-gray-200/30 rounded animate-pulse mb-3" />
                      <div className="h-16 w-32 bg-gray-200/30 rounded animate-pulse" />
                      <div className="h-3 w-40 bg-gray-200/30 rounded animate-pulse mt-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-gray-200/30 border border-gray-200/50">
                        <div className="h-3 w-20 bg-gray-200/50 rounded animate-pulse mb-1" />
                        <div className="h-5 w-16 bg-gray-200/50 rounded animate-pulse" />
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-200/30 border border-gray-200/50">
                        <div className="h-3 w-20 bg-gray-200/50 rounded animate-pulse mb-1" />
                        <div className="h-5 w-16 bg-gray-200/50 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="h-3 w-32 bg-gray-200/30 rounded animate-pulse mb-3" />
                    <div className="relative p-6 rounded-3xl bg-amber-50/30 border border-amber-100 min-h-[140px]">
                      <div className="h-3 w-full bg-gray-200/30 rounded animate-pulse" />
                      <div className="h-3 w-4/5 bg-gray-200/30 rounded animate-pulse mt-2" />
                      <div className="h-3 w-3/4 bg-gray-200/30 rounded animate-pulse mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & History Tabs Skeleton */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 pt-6 border-b border-gray-50">
              <div className="flex gap-8">
                <div className="h-10 w-32 bg-gray-200/30 rounded animate-pulse" />
                <div className="h-10 w-36 bg-gray-200/30 rounded animate-pulse" />
                <div className="h-10 w-40 bg-gray-200/30 rounded animate-pulse" />
              </div>
            </div>
            <div className="p-8">
              <div className="h-96 w-full bg-gray-200/20 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const history = client.history || [];

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "payment":
        return <ArrowDownRight className="w-4 h-4" />;
      case "sale":
        return <ShoppingCart className="w-4 h-4" />;
      case "adjustment":
        return <Activity className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getEventBadgeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case "payment":
        return "bg-green-50 text-green-600 border-green-100";
      case "sale":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "adjustment":
        return "bg-orange-50 text-orange-600 border-orange-100";
      default:
        return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfcfd]">
      {/* Top Banner & Header */}
      <div className="relative p-8 pb-32 bg-primary/5 border-b border-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <User className="w-64 h-64 -mr-20 -mt-20" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl border-2 font-black bg-white/80 hover:bg-white transition-all shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl shadow-primary/5 border-4 border-white flex items-center justify-center text-4xl font-black text-primary">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black tracking-tight text-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[300px]">
                  {client.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border shadow-none",
                    client.status === "active"
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-gray-100 text-gray-500 border-gray-200"
                  )}
                >
                  {client.status === "active" ? "Operational" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <LinkIcon className="w-3.5 h-3.5 opacity-40 text-primary" />
                  ID: {client.id.slice(0, 8)}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5 opacity-40 text-primary" />
                  Registered: {formatDate(client.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsPaymentModalOpen(true)}
              className="h-12 px-3 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-[10px] uppercase tracking-widest min-w-[40px]"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Settle Balance
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="h-12 px-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm min-w-[40px]"
            >
              <Pencil className="w-4 h-4 mr-2 opacity-40" />
              Edit Credentials
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <div className="max-w-7xl mx-auto w-full px-8 -mt-20 pb-20 space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <Card className="lg:col-span-1 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  Profile Identity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                  Liaison Name
                </p>
                <div className="h-12 w-full px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center font-bold text-sm text-foreground">
                  {client.contactName || "Unspecified"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                  Communication Channels
                </p>
                <div className="space-y-3">
                  <div className="h-12 w-full px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <Mail className="w-4 h-4 opacity-30 text-primary" />
                    <span className="font-bold text-sm text-foreground/80 truncate">
                      {client.email || "No email documented"}
                    </span>
                  </div>
                  <div className="h-12 w-full px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <Phone className="w-4 h-4 opacity-30 text-primary" />
                    <span className="font-bold text-sm text-foreground/80">
                      {client.phone || "No phone documented"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 ml-1">
                  Operational Base
                </p>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 min-h-[80px] flex items-start gap-3">
                  <MapPin className="w-4 h-4 opacity-30 text-primary mt-0.5" />
                  <span className="font-bold text-sm text-foreground/80 leading-relaxed italic">
                    {client.address || "Address not specified"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Dashboard Card */}
          <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800/60">
                    Account Standing
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    Real-time audit
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                      Outstanding Aggregate
                    </p>
                    <div className="flex items-baseline gap-3">
                      <h2
                        className={cn(
                          "text-5xl font-black tracking-tighter",
                          (client.outstandingBalance || 0) > 0
                            ? "text-red-500"
                            : "text-emerald-600"
                        )}
                      >
                        {formatCurrency(client.outstandingBalance || 0)}
                      </h2>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-widest">
                      Currently pending settlements
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                        Trust Score
                      </p>
                      <p className="text-sm font-black text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                        Premium
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                        Status
                      </p>
                      <p className="text-sm font-black text-foreground capitalize">
                        {client.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                    System Insights
                  </p>
                  <div className="relative p-6 rounded-3xl bg-amber-50/30 border border-amber-100 min-h-[140px]">
                    <History className="absolute top-4 right-4 w-5 h-5 text-amber-500/20" />
                    <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                      {client.notes ||
                        "No administrative observation recorded for this identity."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & History Tabs */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <Tabs defaultValue="history" className="w-full">
            <div className="px-8 pt-6 border-b border-gray-50">
              <TabsList className="bg-transparent gap-8 h-14 p-0">
                <TabsTrigger
                  value="history"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 data-[state=active]:text-primary transition-all"
                >
                  <Activity className="w-3.5 h-3.5 mr-2" />
                  Operational Feed
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 data-[state=active]:text-primary transition-all"
                >
                  <ShoppingCart className="w-3.5 h-3.5 mr-2" />
                  Transaction Ledger
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 data-[state=active]:text-primary transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                  Identity Intelligence
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="p-8 mt-0 outline-none">
              <ScrollArea className="h-[500px] pr-4">
                <div className="relative pl-12 space-y-8 pb-8">
                  {/* Timeline track */}
                  <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-gray-100" />

                  {history.length > 0 ? (
                    history.map((event, idx) => (
                      <div
                        key={event.id}
                        className="relative group animate-in fade-in slide-in-from-left-4 duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {/* Event indicator */}
                        <div className="absolute -left-[45px] top-1.5 w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <Clock className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                        </div>

                        <div className="flex flex-col gap-1 italic mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                            {formatDate(event.date)}
                          </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-none border",
                                getEventBadgeStyles(event.event_type)
                              )}
                            >
                              {event.event_type}
                            </Badge>
                            {event.amount !== undefined && (
                              <span
                                className={cn(
                                  "text-sm font-black",
                                  event.amount > 0
                                    ? "text-red-500"
                                    : "text-green-600"
                                )}
                              >
                                {event.amount > 0 ? "+" : "-"}
                                {formatCurrency(Math.abs(event.amount))}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-foreground/70 leading-relaxed mb-4">
                            {event.notes}
                          </p>
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100/50">
                            <FileText className="w-3 h-3 text-primary opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                              REF: {event.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-muted-foreground/10" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">
                        No operations documented.
                      </h3>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="sales" className="p-8 mt-0 outline-none">
              <div className="flex flex-col items-center justify-center py-32 bg-gray-50/30 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                <Box className="h-16 w-16 mb-6 text-muted-foreground/10" />
                <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                  Transaction Vault
                </h3>
                <p className="text-xs font-bold text-muted-foreground/60 max-w-sm text-center mb-8 uppercase tracking-widest leading-loose">
                  Historical sales data and formal agreements will be accessible
                  here once the ledger is synchronized.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/sales/new")}
                  className="h-12 px-8 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm"
                >
                  Initiate New Protocol
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="p-8 mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
                  <TrendingUp className="w-12 h-12 text-primary opacity-10 mb-6" />
                  <h3 className="text-lg font-black tracking-tight text-foreground/30 mb-2">
                    Predictive Logic
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] mx-auto">
                    Future integration: Behavior forecasting based on
                    interaction history.
                  </p>
                </div>
                <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
                  <LayoutDashboard className="w-12 h-12 text-primary opacity-10 mb-6" />
                  <h3 className="text-lg font-black tracking-tight text-foreground/30 mb-2">
                    Behavioral Metrics
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] mx-auto">
                    Future integration: Customer lifetime value and engagement
                    analysis.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] overflow-hidden scale-in-center">
            <div className="flex justify-between items-center p-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Pencil className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  Modify Account Identity
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-gray-100"
              >
                <XCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ClientForm
                clientId={client.id}
                onSuccess={() => setIsEditModalOpen(false)}
                onCancel={() => setIsEditModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <ClientPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientId={client.id}
      />
    </div>
  );
}
