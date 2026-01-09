"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Download,
  Upload,
  Building2,
  Package,
  DollarSign,
  TrendingUp,
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  ArrowUpRight,
  RefreshCcw,
  CreditCard,
} from "lucide-react";
import type { Supplier } from "@/types/supplier";
import { formatCurrency, formatDate } from "@/lib/supplierUtils";
import {
  useSupplierState,
  useSupplierActions,
} from "@/context/SupplierContext";
import { SupplierForm } from "./SupplierForm";
import { SupplierPaymentModal } from "./SupplierPaymentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = "blue",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {title}
          </span>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-black text-foreground">{value}</div>
        {subtitle && (
          <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70">
            <div
              className={`h-1 w-1 rounded-full ${colorClasses[color].replace(
                "text-",
                "bg-"
              )}`}
            ></div>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

const SupplierPageClient = () => {
  const router = useRouter();
  const { suppliers, loading, error } = useSupplierState();
  const { deleteSupplier, initialize } = useSupplierActions();

  const [filters, setFilters] = useState({
    searchTerm: "",
    active: "All" as boolean | "All",
  });

  const [sortConfig, setSortConfig] = useState({
    key: "name" as keyof Supplier | "outstandingBalance" | "status",
    direction: "asc" as "asc" | "desc",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSupplier, setPaymentSupplier] = useState<Supplier | null>(null);

  const filteredAndSortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter((supplier) => {
      const matchesSearch =
        !filters.searchTerm ||
        supplier.name
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.contactName
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.email
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase()) ||
        supplier.phone
          ?.toLowerCase()
          .includes(filters.searchTerm.toLowerCase());

      const matchesActive =
        filters.active === "All" ||
        (filters.active === true && supplier.status === "active") ||
        (filters.active === false && supplier.status === "inactive");

      return matchesSearch && matchesActive;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === "outstandingBalance") {
        aValue = a.outstandingBalance || 0;
        bValue = b.outstandingBalance || 0;
      } else if (sortConfig.key === "status") {
        aValue = a.status;
        bValue = b.status;
      } else {
        aValue = a[sortConfig.key as keyof Supplier];
        bValue = b[sortConfig.key as keyof Supplier];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [suppliers, filters, sortConfig]);

  const metrics = useMemo(() => {
    const activeCount = filteredAndSortedSuppliers.filter(
      (s) => s.status === "active"
    ).length;
    const totalBalance = filteredAndSortedSuppliers.reduce(
      (sum, s) => sum + (s.outstandingBalance || 0),
      0
    );
    const suppliersWithBalance = filteredAndSortedSuppliers.filter(
      (s) => (s.outstandingBalance || 0) > 0
    ).length;

    return {
      total: filteredAndSortedSuppliers.length,
      active: activeCount,
      inactive: filteredAndSortedSuppliers.length - activeCount,
      totalBalance,
      suppliersWithBalance,
    };
  }, [filteredAndSortedSuppliers]);

  const handleSort = (key: any) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error("Failed to delete supplier:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
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

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
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
              className="h-11 px-4 rounded-xl border-2 font-black text-xs uppercase tracking-wider hover:bg-gray-50"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            title="Registry Size"
            value={metrics.total}
            subtitle={`${metrics.active} active entities`}
            color="blue"
          />
          <StatCard
            icon={DollarSign}
            title="Aggregate Credit"
            value={formatCurrency(metrics.totalBalance)}
            subtitle={`${metrics.suppliersWithBalance} outstanding accounts`}
            color="orange"
          />
          <StatCard
            icon={CheckCircle2}
            title="Active Partnerships"
            value={metrics.active}
            subtitle="Engaged supply lines"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Inactive Accounts"
            value={metrics.inactive}
            subtitle="Archived relationships"
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block">
                Search Entity
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter suppliers..."
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                  className="w-full h-11 pl-10 pr-4 bg-white border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary/20 transition-all text-sm font-bold placeholder:font-medium"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-[200px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1 mb-1.5 block">
                Partnership Status
              </span>
              <Select
                value={
                  filters.active === "All"
                    ? "all"
                    : filters.active
                    ? "active"
                    : "inactive"
                }
                onValueChange={(v) =>
                  setFilters((prev) => ({
                    ...prev,
                    active: v === "all" ? "All" : v === "active",
                  }))
                }
              >
                <SelectTrigger className="h-11 rounded-xl border-2 border-gray-100 bg-white font-bold text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem
                    value="all"
                    className="font-bold text-xs uppercase py-2.5"
                  >
                    All Accounts
                  </SelectItem>
                  <SelectItem
                    value="active"
                    className="font-bold text-xs uppercase py-2.5"
                  >
                    Active Only
                  </SelectItem>
                  <SelectItem
                    value="inactive"
                    className="font-bold text-xs uppercase py-2.5"
                  >
                    Inactive Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(filters.searchTerm !== "" || filters.active !== "All") && (
              <Button
                variant="ghost"
                onClick={() => setFilters({ searchTerm: "", active: "All" })}
                className="h-11 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full relative">
              <thead className="bg-white/90 sticky top-0 z-20 backdrop-blur-md border-b-2 border-gray-50 shadow-sm">
                <tr>
                  <th
                    className="px-8 py-0 h-16 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-none select-none cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Supplier Entity
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className="px-6 py-0 h-16 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-none select-none">
                    Technical & Comms
                  </th>
                  <th
                    className="px-6 py-0 h-16 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-none select-none cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => handleSort("outstandingBalance")}
                  >
                    <div className="flex items-center gap-2">
                      Financial Position
                      {sortConfig.key === "outstandingBalance" &&
                        (sortConfig.direction === "asc" ? " ↑" : " ↓")}
                    </div>
                  </th>
                  <th className="px-6 py-0 h-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-none select-none">
                    System Status
                  </th>
                  <th className="px-8 py-0 h-16 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-none select-none">
                    Directives
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAndSortedSuppliers.length > 0 ? (
                  filteredAndSortedSuppliers.map((supplier, idx) => (
                    <tr
                      key={supplier.id}
                      className="group cursor-default border-b border-gray-50 hover:bg-muted/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="py-6 pl-8">
                        <div
                          className="flex flex-col cursor-pointer group-hover:translate-x-1.5 transition-transform duration-300"
                          onClick={() =>
                            router.push(`/suppliers/${supplier.id}`)
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                              {supplier.name}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-all text-primary" />
                          </div>
                          {supplier.contactName && (
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-40">
                              <User className="w-3 h-3 text-primary" />
                              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                {supplier.contactName}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex flex-col gap-2.5">
                          {supplier.phone && (
                            <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center mr-2.5 border border-gray-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                                <Phone className="h-3 w-3 opacity-40" />
                              </div>
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                              <div className="w-6 h-6 rounded-lg bg-primary/5 flex items-center justify-center mr-2.5 border border-primary/5 group-hover:bg-white group-hover:border-primary/20 transition-all">
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
                          <div
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm flex items-center gap-2",
                              (supplier.outstandingBalance || 0) > 0
                                ? "bg-orange-50 text-orange-600 border border-orange-100"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            )}
                          >
                            <CreditCard className="w-3.5 h-3.5 opacity-60" />
                            {formatCurrency(supplier.outstandingBalance || 0)}
                          </div>
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
                                ? "bg-green-50 text-green-600 border-green-100 group-hover:bg-green-100"
                                : "bg-gray-100 text-gray-400 border-gray-200 group-hover:bg-gray-200"
                            )}
                          >
                            {supplier.status === "active"
                              ? "Operational"
                              : "Inactive"}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-right py-6 pr-8">
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
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
                                className="h-10 w-10 rounded-xl hover:bg-gray-100 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground/60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-56 rounded-[1.5rem] border-none shadow-2xl p-2 bg-white/95 backdrop-blur-md"
                            >
                              <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-3 py-2">
                                Entity Control
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/suppliers/${supplier.id}`)
                                }
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
                              <DropdownMenuSeparator className="bg-gray-50 my-1" />
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
                                Terminate Account
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
                        <div className="p-5 rounded-[2rem] bg-gray-50 mb-6 flex items-center justify-center shadow-inner">
                          <Building2 className="h-10 w-10 text-muted-foreground/20 font-light" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                          No entities matched.
                        </h3>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] rounded-3xl border-none shadow-2xl flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b">
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] rounded-3xl border-none shadow-2xl flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b">
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
          }}
        />
      )}
    </div>
  );
};

export default SupplierPageClient;
