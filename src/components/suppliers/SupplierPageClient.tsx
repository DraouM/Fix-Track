"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Building2,
  DollarSign,
  User,
  Mail,
  Phone,
  Pencil,
  Trash,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  ArrowUpRight,
  RefreshCcw,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
} from "lucide-react";
import type { Supplier } from "@/types/supplier";
import { formatCurrency } from "@/lib/supplierUtils";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { useSupplierFilters } from "@/hooks/useSupplierFilters";
import { useTranslation } from "react-i18next";
import { SupplierForm } from "./SupplierForm";
import { SupplierPaymentModal } from "./SupplierPaymentModal";
import { SupplierPeekDrawer } from "./SupplierPeekDrawer";
import { openEntityWindow } from "@/lib/openWindow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { CURRENCY_SYMBOLS } from "@/types/settings";

/* ── Compact stat card: icon + value with title underneath (same as clients page) ── */
const StatCard = ({
  icon: Icon,
  value,
  valueClass,
  color = "blue",
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  valueClass?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple" | "gray";
  title?: string;
}) => {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    orange:
      "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    gray: "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span
          className={cn(
            "text-2xl font-black tracking-tight text-foreground",
            valueClass,
          )}
        >
          {value}
        </span>
      </div>
      {title && (
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          {title}
        </span>
      )}
    </div>
  );
};

const SupplierPageClient = () => {
  const router = useRouter();
  const { suppliers, loading, error } = useSupplierState();
  const { deleteSupplier, initialize, getSupplierHistory } =
    useSupplierActions();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const currencySymbol = CURRENCY_SYMBOLS[settings.currency] || "$";

  // ── Shared filtering/sorting hook (same pattern as the clients page) ──
  const {
    filteredAndSortedSuppliers,
    filters,
    sortConfig,
    setSearchTerm,
    setActiveFilter,
    handleSort,
    clearFilters,
  } = useSupplierFilters(suppliers);

  // ── Balance-range filter (layered on top of the hook results) ──
  const [balanceFilter, setBalanceFilter] = useState<
    "all" | "outstanding" | "settled"
  >("all");

  const displayedSuppliers = useMemo(() => {
    if (balanceFilter === "all") return filteredAndSortedSuppliers;
    return filteredAndSortedSuppliers.filter((s) =>
      balanceFilter === "outstanding"
        ? (s.outstandingBalance || 0) > 0
        : (s.outstandingBalance || 0) <= 0,
    );
  }, [filteredAndSortedSuppliers, balanceFilter]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  // ── Peek drawer (fast in-context glance without leaving the list) ──
  const [peekSupplierId, setPeekSupplierId] = useState<string | null>(null);
  const [peekLoading, setPeekLoading] = useState(false);
  const peekSupplier = suppliers.find((s) => s.id === peekSupplierId) || null;

  const loadPeek = useCallback(
    async (supplierId: string) => {
      setPeekLoading(true);
      try {
        await getSupplierHistory(supplierId);
      } catch (err) {
        console.error("Failed to load supplier peek data:", err);
      } finally {
        setPeekLoading(false);
      }
    },
    [getSupplierHistory],
  );

  const openPeek = (id: string) => {
    setPeekSupplierId(id);
    loadPeek(id);
  };

  const closePeek = () => setPeekSupplierId(null);

  // ── Global registry metrics for the overview bar ──
  const metrics = useMemo(() => {
    const activeCount = suppliers.filter((s) => s.status === "active").length;
    const totalBalance = suppliers.reduce(
      (sum, s) => sum + (s.outstandingBalance || 0),
      0,
    );
    return {
      total: suppliers.length,
      active: activeCount,
      inactive: suppliers.length - activeCount,
      totalBalance,
    };
  }, [suppliers]);

  const resetFilters = () => {
    clearFilters();
    setBalanceFilter("all");
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to remove this supplier? If the supplier has existing orders or payments, they will be deactivated instead of deleted.",
      )
    ) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error("Failed to delete supplier:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Synchronizing Supplier Database...
          </p>
        </div>
      </div>
    );
  }

  const headerStyles =
    "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 dark:text-muted-foreground/40 h-16 py-0 border-none select-none";

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground dark:text-slate-200">
                Suppliers
              </h1>
              <p className="hidden md:block text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                Supply Chain & Procurement Management
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => initialize()}
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Sync
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Summary Cards (icon + value + title) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            title="Total Suppliers"
            value={metrics.total}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            title="Outstanding Balance"
            value={formatCurrency(
              metrics.totalBalance,
              settings.currency,
              false,
            )}
            color="orange"
            valueClass={
              metrics.totalBalance > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
          />
          <StatCard
            icon={CheckCircle2}
            title="Active Partnerships"
            value={metrics.active}
            color="green"
            valueClass="text-green-600 dark:text-green-400"
          />
          <StatCard
            icon={XCircle}
            title="Inactive"
            value={metrics.inactive}
            color="gray"
            valueClass="text-muted-foreground/70 dark:text-slate-400"
          />
        </div>

        {/* Table with integrated search & filters (same layout as clients page) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center px-6 py-4 border-b dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter suppliers..."
                value={filters.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl h-11 border-gray-200 dark:border-slate-800 focus:ring-primary/20 bg-white dark:bg-slate-950"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                <span className="text-sm text-gray-600 dark:text-slate-400 hidden sm:block">
                  {t("common.filters")}
                </span>
              </div>

              {/* Status Filter */}
              <Select
                value={
                  filters.active === "All"
                    ? "all"
                    : filters.active
                      ? "active"
                      : "inactive"
                }
                onValueChange={(v) =>
                  setActiveFilter(v === "all" ? "All" : v === "active")
                }
              >
                <SelectTrigger className="w-[150px] h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider">
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    {t("common.all")} {t("common.status")}
                  </SelectItem>
                  <SelectItem
                    value="active"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Balance Filter */}
              <Select
                value={balanceFilter}
                onValueChange={(v) =>
                  setBalanceFilter(v as "all" | "outstanding" | "settled")
                }
              >
                <SelectTrigger className="w-[150px] h-11 rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-xs uppercase tracking-wider">
                  <SelectValue placeholder="Balance" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    All Balances
                  </SelectItem>
                  <SelectItem
                    value="outstanding"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Outstanding
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="settled"
                    className="font-bold text-xs uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Settled
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="rounded-xl h-11 w-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
                onClick={resetFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.searchTerm ||
            filters.active !== "All" ||
            balanceFilter !== "all") && (
            <div className="flex flex-wrap gap-2 items-center px-6 py-3 border-b dark:border-slate-800">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {t("common.activeFilters")}:
              </span>
              {filters.searchTerm && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 text-xs"
                >
                  {t("common.search")}: "
                  {filters.searchTerm.length > 20
                    ? filters.searchTerm.substring(0, 20) + "..."
                    : filters.searchTerm}
                  "
                </Badge>
              )}
              {filters.active !== "All" && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 text-xs"
                >
                  {t("common.status")}: {filters.active ? "Active" : "Inactive"}
                </Badge>
              )}
              {balanceFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 text-xs"
                >
                  Balance:{" "}
                  {balanceFilter === "outstanding" ? "Outstanding" : "Settled"}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50 h-7"
              >
                <X className="mr-1 h-3 w-3" />
                {t("common.clearAll")}
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full relative">
              <thead className="bg-white/90 dark:bg-slate-900/90 sticky top-0 z-20 backdrop-blur-md border-b-2 border-gray-50 dark:border-slate-800 shadow-sm">
                <tr>
                  <th
                    className={cn(
                      headerStyles,
                      "px-8 text-left cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors",
                    )}
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      {t("common.name")}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className={cn(headerStyles, "px-6 text-left")}>
                    {t("suppliers.contact")}
                  </th>
                  <th
                    className={cn(
                      headerStyles,
                      "px-6 text-right cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors",
                    )}
                    onClick={() => handleSort("outstandingBalance")}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {t("repairs.financialOverview")} ({currencySymbol})
                      {sortConfig.key === "outstandingBalance" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th
                    className={cn(
                      headerStyles,
                      "px-6 text-center cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors",
                    )}
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {t("common.status")}
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className={cn(headerStyles, "px-8 text-right")}>
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {displayedSuppliers.length > 0 ? (
                  displayedSuppliers.map((supplier, idx) => (
                    <tr
                      key={supplier.id}
                      className="group cursor-default border-b border-gray-50 dark:border-slate-800 hover:bg-muted/30 dark:hover:bg-slate-800/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="py-6 pl-8">
                        <div
                          className="flex flex-col cursor-pointer group-hover:translate-x-1.5 transition-transform duration-300"
                          onClick={() => openPeek(supplier.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-sm tracking-tight text-foreground dark:text-slate-200 group-hover:text-primary transition-colors">
                              {supplier.name}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-all text-primary" />
                          </div>
                          {supplier.contactName && (
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-40">
                              <User className="w-3 h-3 text-primary" />
                              <span className="text-[9px] text-muted-foreground/60 dark:text-muted-foreground/40 font-black uppercase tracking-widest">
                                {supplier.contactName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col gap-2.5">
                          {supplier.phone && (
                            <div className="flex items-center text-[10px] font-black text-muted-foreground dark:text-muted-foreground/60 uppercase tracking-widest">
                              <div className="w-6 h-6 rounded-lg bg-gray-50 dark:bg-slate-950 flex items-center justify-center mr-2.5 border border-gray-100 dark:border-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:border-primary/20 transition-all">
                                <Phone className="h-3 w-3 opacity-40" />
                              </div>
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center text-[10px] font-black text-muted-foreground/80 dark:text-muted-foreground/50 uppercase tracking-widest">
                              <div className="w-6 h-6 rounded-lg bg-primary/5 dark:bg-primary/10 flex items-center justify-center mr-2.5 border border-primary/5 dark:border-primary/20 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:border-primary/20 transition-all">
                                <Mail className="h-3 w-3 opacity-40 text-primary" />
                              </div>
                              <span className="truncate max-w-[180px]">
                                {supplier.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-6">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            type="button"
                            title="Quick view supplier profile"
                            onClick={() => openPeek(supplier.id)}
                            className={cn(
                              "group/balance cursor-pointer px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm flex items-center gap-2 transition-all hover:ring-2 hover:ring-primary/30",
                              (supplier.outstandingBalance || 0) > 0
                                ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40"
                                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40",
                            )}
                          >
                            <CreditCard className="w-3.5 h-3.5 opacity-60" />
                            {formatCurrency(
                              supplier.outstandingBalance || 0,
                              settings.currency,
                              false,
                            )}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/balance:opacity-60 transition-opacity" />
                          </button>
                          <span className="text-[9px] uppercase text-muted-foreground/30 font-black tracking-widest mr-1">
                            Aggregate Credit
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-6">
                        <div className="flex justify-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] shadow-none border transition-all",
                              supplier.status === "active"
                                ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/40 group-hover:bg-green-100 dark:group-hover:bg-green-900/50"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border-gray-200 dark:border-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-700",
                            )}
                          >
                            {supplier.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-right py-6 pr-8">
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all dark:border-slate-800 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentSupplier(supplier);
                              setShowPaymentModal(true);
                            }}
                          >
                            Settlement
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground/60 dark:text-muted-foreground/40" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 rounded-[1.5rem] border-none shadow-2xl p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
                            >
                              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-muted-foreground/50 px-3 py-2">
                                Entity Control
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPeek(supplier.id);
                                }}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                              >
                                <Eye className="mr-3 h-4 w-4 opacity-40 text-primary" />{" "}
                                View Detail
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const opened = await openEntityWindow(
                                    "supplier",
                                    supplier.id,
                                    "ledger",
                                  );
                                  if (!opened) {
                                    router.push(
                                      `/suppliers/ledger?id=${supplier.id}`,
                                    );
                                  }
                                }}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                              >
                                <FileText className="mr-3 h-4 w-4 opacity-40 text-emerald-600 dark:text-emerald-400" />{" "}
                                Financial Ledger
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/suppliers/detail?id=${supplier.id}`,
                                  );
                                }}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                              >
                                <Building2 className="mr-3 h-4 w-4 opacity-40 text-primary" />{" "}
                                Core Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPaymentSupplier(supplier);
                                  setShowPaymentModal(true);
                                }}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer focus:bg-green-50 focus:text-green-600"
                              >
                                <DollarSign className="mr-3 h-4 w-4 opacity-70" />{" "}
                                Record Settlement
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-50 dark:bg-slate-800 my-1" />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSupplier(supplier);
                                  setShowEditModal(true);
                                }}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 cursor-pointer"
                              >
                                <Pencil className="mr-3 h-4 w-4 opacity-40 text-primary" />{" "}
                                Edit Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(supplier.id);
                                }}
                                className="rounded-xl font-black text-[10px] uppercase tracking-widest px-3 py-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              >
                                <Trash className="mr-3 h-4 w-4 opacity-40" />{" "}
                                Remove Supplier
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="p-5 rounded-[2rem] bg-gray-50 dark:bg-slate-950 mb-6 flex items-center justify-center shadow-inner dark:shadow-slate-950/50">
                          <Building2 className="h-10 w-10 text-muted-foreground/20 dark:text-muted-foreground/5 font-light" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                          No entities matched.
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-3 uppercase tracking-widest">
                          Adjust search parameters or register a new supplier.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden p-0 dark:bg-slate-900">
          <DialogHeader className="p-6 pb-4 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-black">
              Register New Supplier
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Enter the details for the new supplier record.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <SupplierForm
              onSuccess={() => {
                setShowAddModal(false);
                setSelectedSupplier(null);
                initialize();
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] rounded-3xl border-none dark:border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden p-0 dark:bg-slate-900">
          <DialogHeader className="p-6 pb-4 border-b dark:border-slate-800">
            <DialogTitle className="text-xl font-black">
              Edit Operational Entity
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Maintain accurate records for procurement and financial
              settlement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedSupplier && (
              <SupplierForm
                key={selectedSupplier.id}
                supplier={selectedSupplier}
                onSuccess={() => {
                  setShowEditModal(false);
                  setSelectedSupplier(null);
                  initialize();
                }}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedSupplier(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Payment Modal */}
      {showPaymentModal && paymentSupplier && (
        <SupplierPaymentModal
          supplierId={paymentSupplier.id}
          supplierName={paymentSupplier.name}
          currentBalance={paymentSupplier.outstandingBalance || 0}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentSupplier(null);
            initialize();
            // Refresh the peek drawer so the settlement reflects immediately.
            if (peekSupplierId) loadPeek(peekSupplierId);
          }}
        />
      )}

      {/* Supplier Peek Drawer (clients ledger interaction pattern) */}
      <SupplierPeekDrawer
        isOpen={!!peekSupplierId}
        onClose={closePeek}
        supplier={peekSupplier}
        isLoading={peekLoading}
        onRefresh={() => peekSupplierId && loadPeek(peekSupplierId)}
        onOpenPayment={() => {
          if (peekSupplier) {
            setPaymentSupplier(peekSupplier);
            setShowPaymentModal(true);
          }
        }}
        onOpenFullPage={() => {
          if (peekSupplierId) {
            router.push(`/suppliers/detail?id=${peekSupplierId}`);
          }
        }}
        onOpenLedger={async () => {
          if (peekSupplierId) {
            const opened = await openEntityWindow(
              "supplier",
              peekSupplierId,
              "ledger",
            );
            if (!opened) {
              router.push(`/suppliers/ledger?id=${peekSupplierId}`);
            }
          }
        }}
      />
    </div>
  );
};

export default SupplierPageClient;
