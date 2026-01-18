"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Search,
  Pencil,
  DollarSign,
  MoreVertical,
  Trash2,
  Activity,
  ChevronRight,
  TrendingUp,
  FileText,
  LayoutDashboard,
  Box,
  Link as LinkIcon,
  Calendar,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { SupplierForm } from "./SupplierForm";
import { SupplierPaymentModal } from "./SupplierPaymentModal";
import { getOrdersBySupplier } from "@/lib/api/orders";
import type { Order as DBOrder } from "@/types/order";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SupplierDetailProps {
  supplierId: string;
}

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const router = useRouter();
  const { suppliers } = useSupplierState();
  const { getSupplierHistory, getSupplierById, initialize } =
    useSupplierActions();

  const supplier = getSupplierById(supplierId);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (supplierId) {
      getSupplierHistory(supplierId);
      loadOrders();
    }
  }, [supplierId, getSupplierHistory]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await getOrdersBySupplier(supplierId);
      setOrders(data);
    } catch (error) {
      console.error("Failed to load supplier orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleBack = () => {
    router.push("/suppliers");
  };

  if (!supplier) {
    return (
      <div className="flex flex-col h-full bg-[#fbfcfd] dark:bg-[#0f172a]">
        {/* Top Banner & Header Skeleton */}
        <div className="relative p-8 pb-32 bg-primary/5 dark:bg-primary/10 border-b border-primary/5 dark:border-primary/20 overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Building2 className="w-64 h-64 -mr-20 -mt-20" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-6 min-w-0 flex-1">
              <div className="h-12 w-12 rounded-2xl border-2 font-black bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm dark:border-slate-800" />
              <div className="w-24 h-24 rounded-[2rem] bg-gray-200/50 dark:bg-slate-800/50 shadow-xl shadow-primary/5 border-4 border-white dark:border-slate-900 flex items-center justify-center text-4xl font-black text-primary animate-pulse">
                <Building2 className="h-8 w-8 text-gray-400 dark:text-slate-600" />
              </div>
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="h-8 w-48 bg-gray-200/50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                  <div className="h-6 w-24 bg-gray-200/30 dark:bg-slate-800/30 rounded-lg animate-pulse" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="h-4 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="h-12 w-24 bg-gray-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
              <div className="h-12 w-24 bg-gray-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Dashboard Skeleton */}
        <div className="max-w-7xl mx-auto w-full px-8 -mt-20 pb-20 space-y-8">
          {/* Info Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identity Card Skeleton */}
            <div className="lg:col-span-1 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 dark:shadow-slate-950/20 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 py-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="h-4 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="pt-8 space-y-6 p-6">
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse ml-1" />
                  <div className="h-12 w-full bg-gray-200/30 dark:bg-slate-800/30 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-12 w-full bg-gray-200/30 dark:bg-slate-800/30 rounded-xl animate-pulse" />
                  <div className="h-12 w-full bg-gray-200/30 dark:bg-slate-800/30 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-24 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse ml-1" />
                  <div className="h-16 w-full bg-gray-200/30 dark:bg-slate-800/30 rounded-xl animate-pulse" />
                </div>
              </div>
            </div>

            {/* Financial Dashboard Card Skeleton */}
            <div className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 dark:shadow-slate-950/20 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100/50 dark:border-emerald-800/50 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="h-4 w-40 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-28 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <div className="h-3 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse mb-3" />
                      <div className="h-16 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                      <div className="h-3 w-40 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse mt-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-gray-200/30 dark:bg-slate-800/30 border border-gray-200/50 dark:border-slate-800/50">
                        <div className="h-3 w-20 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse mb-1" />
                        <div className="h-5 w-16 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse" />
                      </div>
                      <div className="p-4 rounded-2xl bg-gray-200/30 dark:bg-slate-800/30 border border-gray-200/50 dark:border-slate-800/50">
                        <div className="h-3 w-20 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse mb-1" />
                        <div className="h-5 w-16 bg-gray-200/50 dark:bg-slate-700/50 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="h-3 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse mb-3" />
                    <div className="relative p-6 rounded-3xl bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 min-h-[140px]">
                      <div className="h-3 w-full bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                      <div className="h-3 w-4/5 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse mt-2" />
                      <div className="h-3 w-3/4 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & History Tabs Skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 pt-6 border-b border-gray-50 dark:border-slate-800">
              <div className="flex gap-8">
                <div className="h-10 w-32 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                <div className="h-10 w-36 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
                <div className="h-10 w-40 bg-gray-200/30 dark:bg-slate-800/30 rounded animate-pulse" />
              </div>
            </div>
            <div className="p-8">
              <div className="h-96 w-full bg-gray-200/20 dark:bg-slate-800/20 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const history = supplier.history || [];

  const getHistoryEventBadgeVariant = (type: string) => {
    switch (type) {
      case "Payment Made":
        return "bg-green-50 text-green-600 border-green-100";
      case "Purchase Order Created":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "Credit Balance Adjusted":
        return "bg-orange-50 text-orange-600 border-orange-100";
      default:
        return "bg-gray-50 text-gray-500 border-gray-100";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfcfd] dark:bg-[#0f172a]">
      {/* Top Banner & Header */}
      <div className="relative p-8 pb-32 bg-primary/5 dark:bg-primary/10 border-b border-primary/5 dark:border-primary/20 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Building2 className="w-64 h-64 -mr-20 -mt-20" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-6 min-w-0 flex-1">
            <Button
              onClick={handleBack}
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl border-2 font-black bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm dark:border-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl shadow-primary/5 border-4 border-white dark:border-slate-900 flex items-center justify-center text-4xl font-black text-primary">
              {supplier.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-slate-200 truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] lg:max-w-[300px]">
                  {supplier.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border shadow-none",
                    supplier.status === "active"
                      ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700"
                  )}
                >
                  {supplier.status === "active" ? "Operational" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <LinkIcon className="w-3.5 h-3.5 opacity-40 text-primary" />
                  ID: {supplier.id.slice(0, 8)}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5 opacity-40 text-primary" />
                  Updated: {formatDate(supplier.updatedAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="h-12 px-3 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-[10px] uppercase tracking-widest min-w-[40px]"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Record Settlement
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              className="h-12 px-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm min-w-[40px] dark:border-slate-800"
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
          <Card className="lg:col-span-1 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 dark:shadow-slate-950/20 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 py-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <User className="w-4 h-4" />
                </div>
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-muted-foreground/40">
                  Primary Identity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 ml-1">
                  Operations Liaison
                </p>
                <div className="h-12 w-full px-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center font-bold text-sm text-foreground dark:text-slate-200">
                  {supplier.contactName || "Unspecified"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 ml-1">
                  Direct Comms
                </p>
                <div className="space-y-3">
                  <div className="h-12 w-full px-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                    <Mail className="w-4 h-4 opacity-30 text-primary" />
                    <span className="font-bold text-sm text-foreground/80 dark:text-slate-300 truncate">
                      {supplier.email || "No email documented"}
                    </span>
                  </div>
                  <div className="h-12 w-full px-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
                    <Phone className="w-4 h-4 opacity-30 text-primary" />
                    <span className="font-bold text-sm text-foreground/80 dark:text-slate-300">
                      {supplier.phone || "No phone documented"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40 ml-1">
                  Operational Base
                </p>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 min-h-[80px] flex items-start gap-3">
                  <MapPin className="w-4 h-4 opacity-30 text-primary mt-0.5" />
                  <span className="font-bold text-sm text-foreground/80 dark:text-slate-300 leading-relaxed italic">
                    {supplier.address || "Address not specified"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Dashboard Card */}
          <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl shadow-gray-200/50 dark:shadow-slate-950/20 overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100/50 dark:border-emerald-800/50 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-800/60 dark:text-emerald-400/60">
                    Financial Standing
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    Real-time stats
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
                          (supplier.outstandingBalance || 0) > 0
                            ? "text-orange-600 dark:text-orange-500"
                            : "text-emerald-600 dark:text-emerald-500"
                        )}
                      >
                        {formatCurrency(supplier.outstandingBalance || 0)}
                      </h2>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-widest">
                      Current procurement debt
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-950/80 border border-gray-100 dark:border-slate-800">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-muted-foreground/50 mb-1">
                        Settlement
                      </p>
                      <p className="text-sm font-black text-foreground dark:text-slate-200">
                        {supplier.preferredPaymentMethod || "Direct"}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-slate-950/80 border border-gray-100 dark:border-slate-800">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-muted-foreground/50 mb-1">
                        Status
                      </p>
                      <p className="text-sm font-black text-foreground dark:text-slate-200 capitalize">
                        {supplier.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
                    Strategic Observations
                  </p>
                  <div className="relative p-6 rounded-3xl bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 min-h-[140px]">
                    <AlertCircle className="absolute top-4 right-4 w-5 h-5 text-amber-500/20" />
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-500/80 leading-relaxed italic">
                      {supplier.notes ||
                        "No administrative notes provided for this entity."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity & History Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <Tabs defaultValue="history" className="w-full">
            <div className="px-8 pt-6 border-b border-gray-50 dark:border-slate-800">
              <TabsList className="bg-transparent gap-8 h-14 p-0">
                <TabsTrigger
                  value="history"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 data-[state=active]:text-primary transition-all"
                >
                  <Activity className="w-3.5 h-3.5 mr-2" />
                  Activity Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 data-[state=active]:text-primary transition-all"
                >
                  <Box className="w-3.5 h-3.5 mr-2" />
                  Procurement Orders
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none h-full px-0 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 data-[state=active]:text-primary transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                  Supplier Intelligence
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history" className="p-8 mt-0 outline-none">
              <ScrollArea className="h-[500px] pr-4">
                <div className="relative pl-12 space-y-8 pb-8">
                  {/* Timeline track */}
                  <div className="absolute left-[23px] top-2 bottom-6 w-0.5 bg-gray-100 dark:bg-slate-800" />

                  {history.length > 0 ? (
                    history.map((event, idx) => (
                      <div
                        key={event.id}
                        className="relative group animate-in fade-in slide-in-from-left-4 duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        {/* Event indicator */}
                        <div className="absolute -left-[45px] top-1.5 w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <Clock className="w-4 h-4 opacity-50 dark:opacity-40 group-hover:opacity-100" />
                        </div>

                        <div className="flex flex-col gap-1 italic mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-muted-foreground/50">
                            {formatDate(event.date)}
                          </span>
                        </div>

                        <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:shadow-md transition-all duration-300">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-none border",
                                getHistoryEventBadgeVariant(event.type)
                              )}
                            >
                              {event.type}
                            </Badge>
                            {event.amount && (
                              <span className="text-sm font-black text-foreground dark:text-slate-200">
                                {formatCurrency(event.amount)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-foreground/70 dark:text-slate-400 leading-relaxed mb-4">
                            {event.notes}
                          </p>
                          {event.relatedId && (
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100/50 dark:border-slate-800/50">
                              <FileText className="w-3 h-3 text-primary opacity-50" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 dark:text-muted-foreground/40">
                                Ref: {event.relatedId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-muted-foreground/10" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/40">
                        No activity documented.
                      </h3>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="orders" className="p-8 mt-0 outline-none">
              {loadingOrders ? (
                <div className="py-20 text-center italic">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 animate-pulse">
                    Fetching procurement history...
                  </p>
                </div>
              ) : orders.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl shadow-gray-200/50 dark:shadow-slate-950/20 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                      <TableRow className="border-b dark:border-slate-800">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6 text-muted-foreground dark:text-muted-foreground/50">
                          Order Registry
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-muted-foreground dark:text-muted-foreground/50">
                          Total Value
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-muted-foreground dark:text-muted-foreground/50">
                          Settlement Progress
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-muted-foreground dark:text-muted-foreground/50">
                          Fulfillment Status
                        </TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-4 pr-6 text-muted-foreground dark:text-muted-foreground/50">
                          Directives
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="dark:border-slate-800">
                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="group hover:bg-muted/30 dark:hover:bg-slate-800/30 transition-colors border-b dark:border-slate-800"
                        >
                          <TableCell className="py-5 pl-6">
                            <div className="flex flex-col">
                              <span className="font-black text-sm text-foreground">
                                #{order.order_number}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                                {order.created_at.split("T")[0]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 font-black text-sm text-foreground dark:text-slate-200">
                            {formatCurrency(order.total_amount)}
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 font-black text-[11px] text-foreground/80 dark:text-slate-300">
                                <span className="text-emerald-600 dark:text-emerald-500">
                                  {formatCurrency(order.paid_amount)}
                                </span>
                                <span className="text-muted-foreground/30 dark:text-muted-foreground/20">
                                  / {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border shadow-none",
                                order.payment_status === "paid"
                                  ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40"
                                  : "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/40"
                              )}
                            >
                              {order.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-5 pr-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                            >
                              <Link href={`/orders`}>
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-24 text-center border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2.5rem] bg-gray-50/30 dark:bg-slate-950/30">
                  <Box className="w-12 h-12 text-muted-foreground/10 dark:text-muted-foreground/5 mx-auto mb-6" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/30 dark:text-muted-foreground/20">
                    Zero procurement orders documented.
                  </h3>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="p-8 mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center">
                  <TrendingUp className="w-12 h-12 text-primary opacity-10 mb-6" />
                  <h3 className="text-lg font-black tracking-tight text-foreground/30 dark:text-slate-700 mb-2">
                    Predictive Intelligence
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] mx-auto">
                    Future integration: Demand forecasting based on procurement
                    history.
                  </p>
                </div>
                <div className="p-10 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center">
                  <LayoutDashboard className="w-12 h-12 text-primary opacity-10 mb-6" />
                  <h3 className="text-lg font-black tracking-tight text-foreground/30 dark:text-slate-700 mb-2">
                    Performance Metrics
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-[200px] mx-auto">
                    Future integration: Fulfillment speed and accuracy analysis.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Access Modals */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] border dark:border-slate-800 overflow-hidden scale-in-center">
            <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Pencil className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground dark:text-slate-200">
                  Modify Entity Credentials
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditModal(false)}
                className="rounded-xl h-10 w-10 text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <XCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SupplierForm
                key={supplier.id}
                supplier={supplier}
                onSuccess={() => {
                  setShowEditModal(false);
                  initialize();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-[0_32px_128px_-32px_rgba(0,0,0,0.5)] border dark:border-slate-800 overflow-hidden scale-in-center">
            <SupplierPaymentModal
              supplierId={supplier.id}
              supplierName={supplier.name}
              currentBalance={supplier.outstandingBalance || 0}
              onClose={() => {
                setShowPaymentModal(false);
                initialize();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierDetail;
